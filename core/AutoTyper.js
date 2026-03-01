import { SYMBOL_MAP } from '../config/constants.js';
import { delay, getRandomDelay, getRandomWrongChar } from '../utils/typingUtils.js';
import { StatsTracker } from './StatsTracker.js';
import { HumanitySimulator } from './HumanitySimulator.js';

export class AutoTyper {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.controller = null;
        this.romajiData = [];
        this.originalTitle = document.title;

        this.isCancelled = false;
        this.isPaused = false;
        this.isTypingLine = false;
        this.isTransitionPanic = false;
        this.tickerInterval = null;

        // ★ 状態管理を専門クラスに委譲
        this.stats = new StatsTracker();
        this.humanity = new HumanitySimulator(this.config);

        // UIからの操作リクエストを購読
        this.eventBus.on('ui:action_pauseToggle', () => this.setPauseState(!this.isPaused));
        this.eventBus.on('ui:action_forcePause', (state) => this.setPauseState(state));
        this.eventBus.on('ui:action_cancel', () => { this.isCancelled = true; });
        this.eventBus.on('ui:weakKeysSave', (keys) => {
            this.config.weakKeysList = keys;
            this.eventBus.emit('ui:weakKeysUpdated', keys);
        });
    }

    async setPauseState(state) {
        if (this.controller && this.controller.youtubeController && this.controller.youtubeController.player && this.controller.youtubeController.player.getCurrentTime() === 0) return;
        if (this.isCancelled || this.isPaused === state) return;
        this.isPaused = state;

        this.eventBus.emit('typer:pauseChanged', this.isPaused);
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

    startTicker() {
        this.tickerInterval = setInterval(() => {
            if (this.isCancelled || this.isPaused || !this.isTypingLine) return;

            // ★ 各専門クラスから最新状態を取得してマージするだけ
            const humState = this.humanity.tick();
            const stState = this.stats.getStats();

            this.eventBus.emit('typer:tick', {
                isTransitionPanic: this.isTransitionPanic,
                ...humState,
                ...stState
            });
        }, 200);
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
        else if (/^[0-9]$/.test(key)) { code = "Digit" + key; keyCode = key.charCodeAt(0); }
        else {
            const data = SYMBOL_MAP[key];
            if (data) { code = data.c; keyCode = data.k; shiftKey = data.s || false; }
            else { code = "Key" + upperKey; keyCode = upperKey.charCodeAt(0); }
        }

        const event = new KeyboardEvent("keydown", { key, code, keyCode, shiftKey, bubbles: true, cancelable: true });

        if (this.controller && typeof this.controller._onKeydown === 'function') {
            await this.controller._onKeydown(event);

            this.eventBus.emit('typer:keydown', { key, isMiss });

            if (isTrackKps && key.length === 1 && key !== " " && this.isTypingLine) {
                // ★ 打鍵の記録をStatsTrackerに委譲
                this.stats.recordKey();
            }
        }
    }

    generateKeysList() {
        if (!Array.isArray(this.romajiData)) return [];
        return this.romajiData.map(line => Array.isArray(line) ? line.join("").split("") : String(line).split(""));
    }

    async typeKeys(keysList) {
        const baseTitle = "Typing...";

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
            this.stats.resetLine(); // ★ 行の切り替わりでのリセット処理を委譲

            for (let j = 0; j < lineKeys.length; j++) {
                if (this.isCancelled) break;
                while (this.isPaused && !this.isCancelled) {
                    await delay(100, () => this.isCancelled);
                    this.stats.resetLine(); // ★ ポーズ中の間隔リセット
                }
                if (this.isCancelled) break;

                if ((this.controller.count - 1) > i) { this.isTransitionPanic = true; break; }

                const char = lineKeys[j];
                let currentMissRate = this.config.missRate;
                let weakPenalty = 1.0;

                if (this.config.humanitySim) {
                    // ★ HumanitySimulatorから状態とペナルティを取得
                    currentMissRate *= this.humanity.state.missMult;
                    weakPenalty = this.humanity.getWeakPenalty(char);
                    currentMissRate *= weakPenalty;
                }

                if (currentMissRate > 0 && (Math.random() * 100 < currentMissRate)) {
                    const wrongChar = getRandomWrongChar(char);
                    document.title = `${baseTitle} ${wrongChar} (Miss!)`;

                    await this.simulateKeydown(wrongChar, false, true);
                    await delay(getRandomDelay(this.config, this.humanity.state, weakPenalty), () => this.isCancelled);
                    j--;
                    continue;
                }

                document.title = `${baseTitle} ${char}`;
                await this.simulateKeydown(char, true, false);
                await delay(getRandomDelay(this.config, this.humanity.state, weakPenalty), () => this.isCancelled);
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
            this.startTicker(); // ★ 状態送信ループ開始

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
            if (this.tickerInterval) clearInterval(this.tickerInterval);
            this.eventBus.emit('typer:finished');
        }
    }
}
