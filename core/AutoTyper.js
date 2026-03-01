import { SYMBOL_MAP, SYSTEM } from '../config/constants.js';
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
        this.isSuspended = false;
        this.isTypingLine = false;
        this.isTransitionPanic = false;
        this.tickerInterval = null;

        this.stats = new StatsTracker();
        this.humanity = new HumanitySimulator(this.config);

        this.eventBus.on('ui:action_pauseToggle', () => this.setPauseState(!this.isPaused));
        this.eventBus.on('ui:action_forcePause', (state) => this.setPauseState(state));
        this.eventBus.on('ui:action_cancel', () => { this.isCancelled = true; });
        this.eventBus.on('ui:weakKeysSave', (keys) => {
            this.config.weakKeysList = keys;
            this.eventBus.emit('ui:weakKeysUpdated', keys);
        });

        this.eventBus.on('debug:simulateKeydown', (key) => {
            this.simulateKeydown(key, false, false);
        });

        this.eventBus.on('ui:action_suspendToggle', () => this.setSuspendState(!this.isSuspended));
        this.eventBus.on('debug:suspendAutoTyping', (state) => this.setSuspendState(state));
    }

    async setPauseState(state) {
        if (this.controller && this.controller.youtubeController && this.controller.youtubeController.player && this.controller.youtubeController.player.getCurrentTime() === 0) return;
        if (this.isCancelled || this.isPaused === state) return;
        this.isPaused = state;

        this.eventBus.emit('typer:pauseChanged', this.isPaused);
        await this.simulateKeydown("Escape", false, false);
    }

    setSuspendState(state) {
        if (this.isCancelled || this.isSuspended === state) return;
        this.isSuspended = state;
        this.eventBus.emit('typer:suspendChanged', this.isSuspended);
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
            if (this.isCancelled || this.isPaused || this.isSuspended || !this.isTypingLine) return;

            const humState = this.humanity.tick();
            const stState = this.stats.getStats();

            this.eventBus.emit('typer:tick', {
                isTransitionPanic: this.isTransitionPanic,
                ...humState,
                ...stState
            });
        }, SYSTEM.TICK_INTERVAL_MS);
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
                this.stats.recordKey();
            }
        }
    }

    // ★変更: 文字単体ではなく、{ char, isComboNext } のオブジェクト配列を返す
    generateKeysList() {
        if (!Array.isArray(this.romajiData)) return [];
        return this.romajiData.map(line => {
            let keys = [];
            if (Array.isArray(line)) {
                // TypingTubeのルビ単位配列（例: ["ka", "n", "ji"]）を処理
                line.forEach(chunk => {
                    const chars = String(chunk).split("");
                    chars.forEach((c, idx) => {
                        keys.push({
                            char: c,
                            isComboNext: idx > 0 // 2文字目以降は高速コンボ
                        });
                    });
                });
            } else {
                // 文字列の場合はフォールバック
                const chars = String(line).split("");
                chars.forEach(c => keys.push({ char: c, isComboNext: false }));
            }
            return keys;
        });
    }

    async typeKeys(keysList) {
        const baseTitle = "Typing...";

        for (let i = 0; i < keysList.length; i++) {
            if (this.isCancelled) break;
            const lineKeys = keysList[i];

            while ((this.isPaused || this.isSuspended) && !this.isCancelled) {
                await delay(SYSTEM.POLL_INTERVAL_MS, () => this.isCancelled);
            }

            if (this.config.humanitySim && this.config.humanityFeatures.transPanic && this.isTransitionPanic) {
                const v = (Math.random() * 2 - 1) * this.config.panicDelayVar;
                let panicWait = Math.floor(this.config.panicDelayBase + v);
                if (panicWait > 0) await delay(panicWait, () => this.isCancelled);
                this.isTransitionPanic = false;
            }

            this.isTypingLine = true;
            this.stats.resetLine();

            for (let j = 0; j < lineKeys.length; j++) {
                if (this.isCancelled) break;
                while ((this.isPaused || this.isSuspended) && !this.isCancelled) {
                    await delay(SYSTEM.POLL_INTERVAL_MS, () => this.isCancelled);
                    this.stats.resetLine();
                }
                if (this.isCancelled) break;

                // 強制遷移時のオーバーラン
                if ((this.controller.count - 1) > i) {
                    if (this.config.humanitySim && this.config.humanityFeatures.transPanic) {
                        if (Math.random() * 100 < this.config.panicOverrunProb) {
                            const overrunCount = Math.floor(Math.random() * (this.config.panicOverrunMax - this.config.panicOverrunMin + 1)) + this.config.panicOverrunMin;
                            const endIdx = Math.min(j + overrunCount, lineKeys.length);
                            for (let k = j; k < endIdx; k++) {
                                if (this.isCancelled || this.isPaused || this.isSuspended) break;

                                const charObj = lineKeys[k];
                                const char = charObj.char;
                                const isCombo = charObj.isComboNext && this.config.humanityFeatures.romajiCombo;

                                document.title = `${baseTitle} ${char} (Overrun!)`;
                                await this.simulateKeydown(char, false, true);
                                // オーバーラン時の焦り(0.8倍)とコンボ判定を組み合わせて遅延
                                await delay(getRandomDelay(this.config, this.humanity.state, 0.8, isCombo), () => this.isCancelled);
                            }
                        }
                    }
                    this.isTransitionPanic = true; break;
                }

                // ★変更: オブジェクトから文字とコンボフラグを取り出す
                const charObj = lineKeys[j];
                const char = charObj.char;
                const isCombo = charObj.isComboNext && this.config.humanitySim && this.config.humanityFeatures.romajiCombo;

                let currentMissRate = this.config.missRate;
                let weakPenalty = 1.0;

                if (this.config.humanitySim) {
                    currentMissRate *= this.humanity.state.missMult;
                    weakPenalty = this.humanity.getWeakPenalty(char);
                    currentMissRate *= weakPenalty;
                }

                // ミスタイプ発生
                if (currentMissRate > 0 && (Math.random() * 100 < currentMissRate)) {
                    const wrongChar = getRandomWrongChar(char);
                    document.title = `${baseTitle} ${wrongChar} (Miss!)`;

                    await this.simulateKeydown(wrongChar, false, true);
                    // ミスするとリズムが崩れるため、コンボは無効(false)として遅延を発生させる
                    await delay(getRandomDelay(this.config, this.humanity.state, weakPenalty, false), () => this.isCancelled);
                    j--;
                    continue;
                }

                // 正常入力
                document.title = `${baseTitle} ${char}`;
                await this.simulateKeydown(char, true, false);

                // ★変更: isCombo を引数に渡して遅延を決定する
                await delay(getRandomDelay(this.config, this.humanity.state, weakPenalty, isCombo), () => this.isCancelled);
            }

            this.isTypingLine = false;

            if (this.isCancelled) break;
            while ((this.isPaused || this.isSuspended) && !this.isCancelled) {
                await delay(SYSTEM.POLL_INTERVAL_MS, () => this.isCancelled);
            }

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
            this.startTicker();

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
                this.eventBus.emit('typer:gameStarted');
                const keysList = this.generateKeysList();
                await this.typeKeys(keysList);
            }

            if (this.isCancelled) {
                if (!this.isPaused) await this.simulateKeydown("Escape", false, false);
                while (this.controller.youtubeController.player.getPlayerState() == 1) {
                    await delay(SYSTEM.POLL_INTERVAL_MS, () => this.isCancelled);
                }
                alert("AutoTyperを停止しました。");
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
