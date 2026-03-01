import { SYMBOL_MAP } from '../config/constants.js';
import { delay, getRandomDelay, getRandomWrongChar } from '../utils/typingUtils.js';
import { UIManager } from '../ui/UIManager.js';

// 自動化システム（タイピング制御メインロジック）
export class AutoTyper {
    constructor(config) {
        this.config = config;
        this.controller = null;
        this.romajiData = [];
        this.originalTitle = document.title;

        this.isCancelled = false;
        this.isPaused = false;
        this.isTypingLine = false;
        this.isTransitionPanic = false;

        this.lastKeyTime = 0;
        this.recentIntervals = [];
        this.kpsHistory = new Array(50).fill(0);
        this.allKpsRecords = [];

        this.humanityStartTime = Date.now();
        this.concHistory = new Array(50).fill(100);
        this.humanityState = { concentration: 100, delayMult: 1.0, missMult: 1.0 };

        // ★ UIマネージャーの初期化
        this.ui = new UIManager(this);
    }

    async setPauseState(state) {
        if (this.controller && this.controller.youtubeController && this.controller.youtubeController.player && this.controller.youtubeController.player.getCurrentTime() === 0) return;

        if (this.isCancelled || this.isPaused === state) return;
        this.isPaused = state;

        // UIへの反映を委譲
        this.ui.updatePauseUI(this.isPaused);

        await this.simulateKeydown("Escape", false, false);
    }

    init() {
        const controllerName = "typing--game";
        const selector = `[data-controller~="${controllerName}"]`;
        const element = document.querySelector(selector);
        const stimApp = window.Application || window.Stimulus;

        if (!element || !stimApp) throw new Error("Game element/Stimulus not found.");
        this.controller = stimApp.getControllerForElementAndIdentifier(element, controllerName);
        if (!this.controller) throw new Error(`Controller '${controllerName}' not found.`);

        this.romajiData = this.controller.lyricsData?.typingRoma || [];
    }

    async simulateKeydown(key, isTrackKps = true, isMiss = false) {
        let code, keyCode, shiftKey = false;
        const upperKey = key.toUpperCase();

        if (key === "F4") { code = "F4"; keyCode = 115; }
        else if (key === "Escape") { code = "Escape"; keyCode = 27; }
        else if (key === " ") { code = "Space"; keyCode = 32; }
        else if (/^[a-zA-Z]$/.test(key)) {
            code = "Key" + upperKey; keyCode = upperKey.charCodeAt(0);
            if (key === upperKey && key !== key.toLowerCase()) shiftKey = true;
        }
        else if (/^[0-9]$/.test(key)) {
            code = "Digit" + key; keyCode = key.charCodeAt(0);
        }
        else {
            const data = SYMBOL_MAP[key];
            if (data) {
                code = data.c; keyCode = data.k; shiftKey = data.s || false;
            } else {
                code = "Key" + upperKey; keyCode = upperKey.charCodeAt(0);
            }
        }

        const event = new KeyboardEvent("keydown", { key, code, keyCode, shiftKey, bubbles: true, cancelable: true });

        if (this.controller && typeof this.controller._onKeydown === 'function') {
            await this.controller._onKeydown(event);

            // ★ UI側への通知
            this.ui.flashVirtualKey(key, isMiss);

            if (isTrackKps && key.length === 1 && key !== " " && this.isTypingLine) {
                const now = Date.now();
                if (this.lastKeyTime > 0) {
                    const interval = now - this.lastKeyTime;
                    if (interval < 3000) {
                        this.recentIntervals.push(interval);
                        if (this.recentIntervals.length > 5) this.recentIntervals.shift();
                        this.allKpsRecords.push(1000 / interval);
                    }
                }
                this.lastKeyTime = now;
            }
        }
    }

    generateKeysList() {
        if (!Array.isArray(this.romajiData)) return [];
        return this.romajiData.map(line => Array.isArray(line) ? line.join("").split("") : String(line).split(""));
    }

    // キャンセル判定用ヘルパー
    isCanceled() { return this.isCancelled; }

    async typeKeys(keysList) {
        const baseTitle = "Typing...";
        this.humanityStartTime = Date.now();

        for (let i = 0; i < keysList.length; i++) {
            if (this.isCancelled) break;
            const lineKeys = keysList[i];

            while (this.isPaused && !this.isCancelled) await delay(100, () => this.isCancelled);

            if (this.config.humanitySim && this.config.humanityFeatures.transPanic && this.isTransitionPanic) {
                const v = (Math.random() * 2 - 1) * this.config.panicDelayVar;
                let panicWait = Math.floor(this.config.panicDelayBase + v);
                if (panicWait > 0) await delay(panicWait, () => this.isCancelled);
                this.isTransitionPanic = false;
            }

            this.isTypingLine = true;
            this.lastKeyTime = 0;
            this.recentIntervals = this.recentIntervals.slice(-2);

            for (let j = 0; j < lineKeys.length; j++) {
                if (this.isCancelled) break;

                while (this.isPaused && !this.isCancelled) {
                    await delay(100, () => this.isCancelled);
                    this.lastKeyTime = 0;
                }
                if (this.isCancelled) break;

                if ((this.controller.count - 1) > i) {
                    this.isTransitionPanic = true; break;
                }

                const char = lineKeys[j];
                let currentMissRate = this.config.missRate;
                let weakPenalty = 1.0;

                if (this.config.humanitySim) {
                    currentMissRate *= this.humanityState.missMult;
                    if (this.config.humanityFeatures.weakKeys && this.config.weakKeysList.includes(char.toLowerCase())) {
                        const v = (Math.random() * 2 - 1) * this.config.weakKeysVar;
                        weakPenalty = Math.max(1.0, this.config.weakKeysBase + v);
                        currentMissRate *= weakPenalty;
                    }
                }

                if (currentMissRate > 0 && (Math.random() * 100 < currentMissRate)) {
                    const wrongChar = getRandomWrongChar(char);
                    document.title = `${baseTitle} ${wrongChar} (Miss!)`;

                    await this.simulateKeydown(wrongChar, false, true);
                    await delay(getRandomDelay(this.config, this.humanityState, weakPenalty), () => this.isCancelled);
                    j--;
                    continue;
                }

                document.title = `${baseTitle} ${char}`;
                await this.simulateKeydown(char, true, false);
                await delay(getRandomDelay(this.config, this.humanityState, weakPenalty), () => this.isCancelled);
            }

            this.isTypingLine = false;

            if (this.isCancelled) break;

            while (this.isPaused && !this.isCancelled) await delay(100, () => this.isCancelled);

            if (this.config.autoSkip && !this.isCancelled && !this.isTransitionPanic) {
                await this.simulateKeydown(" ", false, false);
            }

            while ((this.controller.count - 1) === i) {
                if (this.isCancelled) break;
                await delay(this.config.checkInterval, () => this.isCancelled);
            }
        }
    }

    async run() {
        try {
            this.init();

            // ★ UIの初期化を委譲
            this.ui.initAllUI();

            while (!this.controller._lyricsReady) {
                if (this.isCancelled) break;
                await delay(this.config.checkInterval, () => this.isCancelled);
            }

            if (!this.isCancelled) await this.simulateKeydown("F4", false, false);

            if (this.controller.youtubeController && this.controller.youtubeController.player) {
                while (this.controller.youtubeController.player.getCurrentTime() === 0) {
                    if (this.isCancelled) break;
                    await delay(this.config.checkInterval, () => this.isCancelled);
                }
            }

            await delay(this.config.startDelay, () => this.isCancelled);

            if (!this.isCancelled) {
                const keysList = this.generateKeysList();
                await this.typeKeys(keysList);
            }

            if (this.isCancelled) {
                if (!this.isPaused) await this.simulateKeydown("Escape", false, false);
                alert("AutoTyperをキャンセルしました。");
            } else {
                alert("tt-auto.js finished!");
            }
        } catch (e) {
            alert(`AutoTyper Error: ${e.message}`);
        } finally {
            document.title = this.originalTitle;
            this.ui.cleanupUI();
        }
    }
}
