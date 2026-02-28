(async function () {
    const DEFAULT_CONFIG = {
        minDelay: 200,
        maxDelay: 300,
        startDelay: 1000,
        checkInterval: 100,
        autoSkip: true,
        missRate: 0,
    };

    // --- 初期設定用UI作成クラス ---
    class ConfigModal {
        constructor(defaultConfig) {
            this.config = { ...defaultConfig };
        }

        createStyle() {
            return `
                .tt-auto-modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.5); z-index: 10000;
                    display: flex; justify-content: center; align-items: center;
                }
                .tt-auto-modal {
                    background: white; padding: 20px; border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2); width: 300px;
                    font-family: sans-serif;
                }
                .tt-auto-modal h2 { margin-top: 0; font-size: 18px; margin-bottom: 15px; }
                .tt-auto-form-group { margin-bottom: 15px; }
                .tt-auto-form-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px; }
                .tt-auto-form-group input[type="number"] { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }

                .tt-auto-form-group.checkbox-group label { display: flex; align-items: center; font-weight: normal; cursor: pointer; }
                .tt-auto-form-group.checkbox-group input[type="checkbox"] { width: auto; margin-right: 10px; cursor: pointer; transform: scale(1.2); }

                .tt-auto-actions { text-align: right; margin-top: 20px; }
                .tt-auto-btn {
                    padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;
                    color: white; background-color: #007bff;
                }
                .tt-auto-btn:hover { background-color: #0056b3; }
                .tt-auto-btn.cancel { background-color: #6c757d; margin-right: 10px; }
                .tt-auto-btn.cancel:hover { background-color: #545b62; }
            `;
        }

        async promptUser() {
            return new Promise((resolve, reject) => {
                const styleEl = document.createElement('style');
                styleEl.textContent = this.createStyle();
                document.head.appendChild(styleEl);

                const overlay = document.createElement('div');
                overlay.className = 'tt-auto-modal-overlay';
                overlay.innerHTML = `
                    <div class="tt-auto-modal">
                        <h2>AutoTyper Settings</h2>
                        <div class="tt-auto-form-group">
                            <label>Min Delay (ms)</label>
                            <input type="number" id="tt-min-delay" value="${this.config.minDelay}">
                        </div>
                        <div class="tt-auto-form-group" style="margin-bottom: 5px;">
                            <label>Max Delay (ms)</label>
                            <input type="number" id="tt-max-delay" value="${this.config.maxDelay}">
                        </div>
                        <div style="font-size: 12px; margin-bottom: 10px; color: #666; text-align: right;">
                            Est. KPS: <span id="tt-est-kps">0.00 - 0.00</span> (Avg: <span id="tt-avg-kps">0.00</span>)
                        </div>

                        <div class="tt-auto-form-group">
                            <label>Miss Rate (%)</label>
                            <input type="number" id="tt-miss-rate" value="${this.config.missRate}" min="0" max="100">
                        </div>

                        <div class="tt-auto-form-group checkbox-group">
                            <label>
                                <input type="checkbox" id="tt-auto-skip" ${this.config.autoSkip ? 'checked' : ''}>
                                Auto Skip (ON / OFF)
                            </label>
                        </div>
                        <div class="tt-auto-actions">
                            <button class="tt-auto-btn cancel" id="tt-cancel-btn">Cancel</button>
                            <button class="tt-auto-btn" id="tt-start-btn">Start</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(overlay);

                const minInput = overlay.querySelector('#tt-min-delay');
                const maxInput = overlay.querySelector('#tt-max-delay');
                const missInput = overlay.querySelector('#tt-miss-rate');
                const autoSkipInput = overlay.querySelector('#tt-auto-skip');
                const startBtn = overlay.querySelector('#tt-start-btn');
                const cancelBtn = overlay.querySelector('#tt-cancel-btn');

                const updateKpsEstimate = () => {
                    const min = parseInt(minInput.value, 10);
                    const max = parseInt(maxInput.value, 10);
                    if (min > 0 && max > 0 && min <= max) {
                        const kpsMin = (1000 / max).toFixed(2);
                        const kpsMax = (1000 / min).toFixed(2);
                        const kpsAvg = (1000 / ((min + max) / 2)).toFixed(2);
                        overlay.querySelector('#tt-est-kps').textContent = `${kpsMin} - ${kpsMax}`;
                        overlay.querySelector('#tt-avg-kps').textContent = kpsAvg;
                    } else {
                        overlay.querySelector('#tt-est-kps').textContent = `---`;
                        overlay.querySelector('#tt-avg-kps').textContent = `---`;
                    }
                };

                minInput.addEventListener('input', updateKpsEstimate);
                maxInput.addEventListener('input', updateKpsEstimate);
                updateKpsEstimate();

                startBtn.onclick = () => {
                    const newMin = parseInt(minInput.value, 10);
                    const newMax = parseInt(maxInput.value, 10);
                    let newMiss = parseFloat(missInput.value);

                    if (isNaN(newMin) || isNaN(newMax)) {
                        alert("数値を入力してください");
                        return;
                    }
                    if (newMin > newMax) {
                        alert("Min Delay は Max Delay 以下の値にしてください");
                        return;
                    }
                    if (isNaN(newMiss) || newMiss < 0) newMiss = 0;
                    if (newMiss > 100) newMiss = 100;

                    this.config.minDelay = newMin;
                    this.config.maxDelay = newMax;
                    this.config.missRate = newMiss;
                    this.config.autoSkip = autoSkipInput.checked;

                    cleanup();
                    resolve(this.config);
                };

                cancelBtn.onclick = () => {
                    cleanup();
                    reject(new Error("User cancelled"));
                };

                function cleanup() {
                    document.body.removeChild(overlay);
                    document.head.removeChild(styleEl);
                }
            });
        }
    }

    // --- 自動化ロジック ---
    class AutoTyper {
        constructor(config) {
            this.config = config;
            this.controller = null;
            this.romajiData = [];
            this.originalTitle = document.title;

            this.isCancelled = false;
            this.isPaused = false;

            // Live KPS計算用 (移動平均方式)
            this.isTypingLine = false;
            this.lastKeyTime = 0;
            this.recentIntervals = [];

            // グラフ描画履歴
            this.kpsHistory = new Array(50).fill(0);

            // Lifetime KPS と ばらつき計算用
            this.allKpsRecords = [];

            this.execUiContainer = null;
            this.canvasCtx = null;
            this.graphInterval = null;

            this.isDragging = false;
            this.dragOffsetX = 0;
            this.dragOffsetY = 0;

            this.onMouseMove = this.handleMouseMove.bind(this);
            this.onMouseUp = this.handleMouseUp.bind(this);
        }

        createExecutionUI() {
            this.execUiContainer = document.createElement('div');
            // 要素が増えたため少し高さを拡張
            this.execUiContainer.style.cssText = `
                position: fixed; top: 20px; right: 20px; width: 310px; height: 260px;
                min-width: 280px; min-height: 220px;
                background: rgba(20, 20, 20, 0.85); color: #fff;
                padding: 10px; border-radius: 8px; z-index: 99999;
                font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                backdrop-filter: blur(4px);
                display: flex; flex-direction: column;
                resize: both; overflow: hidden;
            `;

            const inputStyle = `width: 45px; padding: 2px; font-size: 11px; background: #333; color: white; border: 1px solid #555; border-radius: 3px;`;

            this.execUiContainer.innerHTML = `
                <div id="tt-drag-handle" style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #4CAF50; cursor: move; user-select: none; flex-shrink: 0;">
                    ● AutoTyper Running (Drag)
                </div>

                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px; flex-shrink: 0;">
                    <div title="直近5打鍵の移動平均KPS" style="font-size: 12px;">
                        Live KPS: <br><span id="tt-kps-val" style="font-size:16px; font-weight:bold; color: #00FF00;">0.00</span>
                    </div>
                    <div title="全体の平均KPSと標準偏差(ばらつき)" style="font-size: 11px; text-align: right; color: #ccc;">
                        Life KPS: <span id="tt-lifetime-kps" style="font-size:14px; font-weight:bold; color: #fff;">0.00</span><br>
                        StdDev: ±<span id="tt-kps-stddev">0.00</span>
                    </div>
                </div>

                <div style="display: flex; gap: 4px; margin-bottom: 4px; flex-shrink: 0; font-size: 11px; align-items: center; flex-wrap: wrap;">
                    Step:<input type="number" id="tt-exec-step" value="10" min="1" style="width: 35px; padding: 2px; font-size: 11px; background: #333; color: white; border: 1px solid #555; border-radius: 3px;">
                    Delay:<input type="number" id="tt-exec-min" value="${this.config.minDelay}" step="10" style="${inputStyle}" title="Min Delay">
                    - <input type="number" id="tt-exec-max" value="${this.config.maxDelay}" step="10" style="${inputStyle}" title="Max Delay">
                </div>

                <div style="display: flex; gap: 4px; margin-bottom: 8px; flex-shrink: 0; font-size: 11px; align-items: center; flex-wrap: wrap;">
                    Miss(%):<input type="number" id="tt-exec-miss" value="${this.config.missRate}" min="0" max="100" step="1" style="${inputStyle}">

                    <label style="cursor: pointer; display: flex; align-items: center; margin-left: auto; background: #333; padding: 2px 4px; border-radius: 3px; border: 1px solid #555;" title="Auto Skip">
                        <input type="checkbox" id="tt-exec-autoskip" ${this.config.autoSkip ? 'checked' : ''} style="margin: 0 4px 0 0;"> Skip
                    </label>
                </div>

                <canvas id="tt-kps-graph" style="background: #000; border: 1px solid #444; border-radius: 4px; margin-bottom: 8px; flex-grow: 1; min-height: 0; width: 100%; box-sizing: border-box;"></canvas>

                <div style="display: flex; gap: 5px; flex-shrink: 0; width: 100%;">
                    <button id="tt-exec-pause" style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Pause</button>
                    <button id="tt-exec-cancel" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">STOP</button>
                </div>
            `;
            document.body.appendChild(this.execUiContainer);

            const stepInput = this.execUiContainer.querySelector('#tt-exec-step');
            const minExecInput = this.execUiContainer.querySelector('#tt-exec-min');
            const maxExecInput = this.execUiContainer.querySelector('#tt-exec-max');
            const missExecInput = this.execUiContainer.querySelector('#tt-exec-miss');
            const autoSkipExec = this.execUiContainer.querySelector('#tt-exec-autoskip');
            const pauseBtn = this.execUiContainer.querySelector('#tt-exec-pause');
            const cancelBtn = this.execUiContainer.querySelector('#tt-exec-cancel');
            const dragHandle = this.execUiContainer.querySelector('#tt-drag-handle');

            stepInput.addEventListener('change', (e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                    minExecInput.step = val;
                    maxExecInput.step = val;
                }
            });

            minExecInput.addEventListener('change', (e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) this.config.minDelay = val;
            });
            maxExecInput.addEventListener('change', (e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) this.config.maxDelay = val;
            });

            missExecInput.addEventListener('change', (e) => {
                let val = parseFloat(e.target.value);
                if (isNaN(val) || val < 0) val = 0;
                if (val > 100) val = 100;
                this.config.missRate = val;
            });

            autoSkipExec.addEventListener('change', (e) => {
                this.config.autoSkip = e.target.checked;
            });

            pauseBtn.onclick = async () => {
                if (this.isCancelled) return;
                this.isPaused = !this.isPaused;
                if (this.isPaused) {
                    pauseBtn.textContent = "Resume";
                    pauseBtn.style.background = "#28a745";
                    await this.simulateKeydown("Escape", false);
                } else {
                    pauseBtn.textContent = "Pause";
                    pauseBtn.style.background = "#007bff";
                    await this.simulateKeydown("Escape", false);
                }
            };

            cancelBtn.onclick = () => {
                this.isCancelled = true;
                cancelBtn.textContent = "Stopping...";
                cancelBtn.style.background = "#6c757d";
            };

            dragHandle.addEventListener('mousedown', (e) => {
                this.isDragging = true;
                const rect = this.execUiContainer.getBoundingClientRect();
                this.dragOffsetX = e.clientX - rect.left;
                this.dragOffsetY = e.clientY - rect.top;
            });
            document.addEventListener('mousemove', this.onMouseMove);
            document.addEventListener('mouseup', this.onMouseUp);

            const canvas = this.execUiContainer.querySelector('#tt-kps-graph');
            this.canvasCtx = canvas.getContext('2d');
            this.graphInterval = setInterval(() => this.updateGraph(), 200);
        }

        handleMouseMove(e) {
            if (!this.isDragging) return;

            let newX = e.clientX - this.dragOffsetX;
            let newY = e.clientY - this.dragOffsetY;

            const rect = this.execUiContainer.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;

            if (newX < 0) newX = 0;
            if (newY < 0) newY = 0;
            if (newX > maxX) newX = maxX;
            if (newY > maxY) newY = maxY;

            this.execUiContainer.style.right = 'auto';
            this.execUiContainer.style.bottom = 'auto';
            this.execUiContainer.style.left = `${newX}px`;
            this.execUiContainer.style.top = `${newY}px`;
        }

        handleMouseUp() {
            this.isDragging = false;
        }

        updateGraph() {
            if (this.isCancelled || this.isPaused || !this.isTypingLine) return;

            // --- Live KPS 計算 ---
            let kpsVal = 0;
            if (this.recentIntervals.length > 0) {
                const sum = this.recentIntervals.reduce((a, b) => a + b, 0);
                const avgInterval = sum / this.recentIntervals.length;
                if (avgInterval > 0) {
                    kpsVal = 1000 / avgInterval;
                }
            }

            this.kpsHistory.push(kpsVal);
            if (this.kpsHistory.length > 50) this.kpsHistory.shift();

            const kpsText = this.execUiContainer.querySelector('#tt-kps-val');
            if (kpsText) kpsText.textContent = kpsVal.toFixed(2);

            // --- Lifetime KPS & ばらつき(標準偏差) 計算 ---
            if (this.allKpsRecords.length > 0) {
                const sumAll = this.allKpsRecords.reduce((a, b) => a + b, 0);
                const lifetimeKps = sumAll / this.allKpsRecords.length;

                // 標準偏差の計算 (分散の平方根)
                const variance = this.allKpsRecords.reduce((a, b) => a + Math.pow(b - lifetimeKps, 2), 0) / this.allKpsRecords.length;
                const stdDev = Math.sqrt(variance);

                const lifetimeEl = this.execUiContainer.querySelector('#tt-lifetime-kps');
                const stddevEl = this.execUiContainer.querySelector('#tt-kps-stddev');
                if (lifetimeEl) lifetimeEl.textContent = lifetimeKps.toFixed(2);
                if (stddevEl) stddevEl.textContent = stdDev.toFixed(2);
            }

            // --- グラフ描画 ---
            const canvas = this.execUiContainer.querySelector('#tt-kps-graph');
            if (this.canvasCtx && canvas) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;

                const width = canvas.width;
                const height = canvas.height;
                const ctx = this.canvasCtx;

                ctx.clearRect(0, 0, width, height);

                const maxKps = Math.max(10, Math.ceil(Math.max(...this.kpsHistory)));

                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '10px monospace';
                ctx.textBaseline = 'top';
                ctx.fillText(`Max: ${maxKps}`, 4, 4);

                ctx.textBaseline = 'bottom';
                ctx.fillText(`0`, 4, height - 2);

                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, height);
                ctx.lineTo(width, height);
                ctx.stroke();

                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                this.kpsHistory.forEach((val, i) => {
                    const x = (i / (this.kpsHistory.length - 1)) * width;
                    const y = height - (val / maxKps) * height;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
            }
        }

        cleanupUI() {
            if (this.graphInterval) clearInterval(this.graphInterval);
            document.removeEventListener('mousemove', this.onMouseMove);
            document.removeEventListener('mouseup', this.onMouseUp);

            if (this.execUiContainer && this.execUiContainer.parentNode) {
                this.execUiContainer.parentNode.removeChild(this.execUiContainer);
            }
        }

        async delay(ms) {
            return new Promise(resolve => {
                const start = Date.now();
                const interval = setInterval(() => {
                    if (this.isCancelled || Date.now() - start >= ms) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 10);
            });
        }

        getRandomDelay() {
            const min = Math.min(this.config.minDelay, this.config.maxDelay);
            const max = Math.max(this.config.minDelay, this.config.maxDelay);
            return Math.floor(Math.random() * (max - min)) + min;
        }

        getRandomWrongChar(correctChar) {
            const chars = "abcdefghijklmnopqrstuvwxyz";
            const target = (correctChar || "").toLowerCase();
            let wrongChar = target;
            for (let i = 0; i < 10; i++) {
                wrongChar = chars.charAt(Math.floor(Math.random() * chars.length));
                if (wrongChar !== target) break;
            }
            return wrongChar;
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

        async simulateKeydown(key, isTrackKps = true) {
            let code, keyCode;

            if (key === "F4") {
                code = "F4"; keyCode = 115;
            } else if (key === "Escape") {
                code = "Escape"; keyCode = 27;
            } else if (key === " ") {
                code = "Space"; keyCode = 32;
            } else {
                code = `Key${key.toUpperCase()}`;
                keyCode = key.toUpperCase().charCodeAt(0);
            }

            const event = new KeyboardEvent("keydown", {
                key: key,
                code: code,
                keyCode: keyCode,
                bubbles: true,
                cancelable: true
            });

            if (this.controller && typeof this.controller._onKeydown === 'function') {
                await this.controller._onKeydown(event);

                if (isTrackKps && key.length === 1 && key !== " " && this.isTypingLine) {
                    const now = Date.now();
                    if (this.lastKeyTime > 0) {
                        const interval = now - this.lastKeyTime;
                        // 異常な間隔（一時停止直後など）は排除
                        if (interval < 3000) {
                            // Live KPS用の間隔記録
                            this.recentIntervals.push(interval);
                            if (this.recentIntervals.length > 5) {
                                this.recentIntervals.shift();
                            }

                            // Lifetime KPS用の全記録
                            const instantKps = 1000 / interval;
                            this.allKpsRecords.push(instantKps);
                        }
                    }
                    this.lastKeyTime = now;
                }
            }
        }

        generateKeysList() {
            if (!Array.isArray(this.romajiData)) return [];
            return this.romajiData.map(line => {
                if (Array.isArray(line)) return line.join("").split("");
                return String(line).split("");
            });
        }

        async typeKeys(keysList) {
            const baseTitle = "Typing...";

            for (let i = 0; i < keysList.length; i++) {
                if (this.isCancelled) break;

                const lineKeys = keysList[i];

                while (this.isPaused && !this.isCancelled) {
                    await this.delay(100);
                }

                // 行開始時の初期化
                this.isTypingLine = true;
                this.lastKeyTime = 0;
                this.recentIntervals = this.recentIntervals.slice(-2);

                for (let j = 0; j < lineKeys.length; j++) {
                    if (this.isCancelled) break;

                    while (this.isPaused && !this.isCancelled) {
                        await this.delay(100);
                        this.lastKeyTime = 0;
                    }
                    if (this.isCancelled) break;

                    const currentLineIndex = this.controller.count - 1;
                    if (currentLineIndex > i) break;

                    const char = lineKeys[j];

                    if (this.config.missRate > 0 && (Math.random() * 100 < this.config.missRate)) {
                        const wrongChar = this.getRandomWrongChar(char);
                        document.title = `${baseTitle} ${wrongChar} (Miss!)`;

                        await this.simulateKeydown(wrongChar, false);
                        await this.delay(this.getRandomDelay());

                        j--;
                        continue;
                    }

                    document.title = `${baseTitle} ${char}`;
                    await this.simulateKeydown(char, true);
                    await this.delay(this.getRandomDelay());
                }

                this.isTypingLine = false;

                if (this.isCancelled) break;

                while (this.isPaused && !this.isCancelled) {
                    await this.delay(100);
                }

                if (this.config.autoSkip && !this.isCancelled) {
                    await this.simulateKeydown(" ", false);
                }

                while ((this.controller.count - 1) === i) {
                    if (this.isCancelled) break;
                    await this.delay(this.config.checkInterval);
                }
            }
        }

        async run() {
            try {
                this.init();
                this.createExecutionUI();

                while (!this.controller._lyricsReady) {
                    if (this.isCancelled) break;
                    await this.delay(this.config.checkInterval);
                }

                if (!this.isCancelled) {
                    await this.simulateKeydown("F4", false);
                }

                if (this.controller.youtubeController && this.controller.youtubeController.player) {
                    while (this.controller.youtubeController.player.getCurrentTime() === 0) {
                        if (this.isCancelled) break;
                        await this.delay(this.config.checkInterval);
                    }
                }

                await this.delay(this.config.startDelay);

                if (!this.isCancelled) {
                    const keysList = this.generateKeysList();
                    await this.typeKeys(keysList);
                }

                if (this.isCancelled) {
                    if (!this.isPaused) {
                        await this.simulateKeydown("Escape", false);
                    }
                    alert("AutoTyperをキャンセルしました。");
                } else {
                    alert("tt-auto.js finished!");
                }

            } catch (e) {
                console.error(e);
                alert(`AutoTyper Error: ${e.message}`);
            } finally {
                document.title = this.originalTitle;
                this.cleanupUI();
            }
        }
    }

    // --- エントリーポイント ---
    if (!document.location.href.match(/typing-tube\.net\/play\/typing\/\d+/)) {
        alert("このスクリプトは typing-tube.net の動画ページでのみ動作します。");
        return;
    }

    try {
        const modal = new ConfigModal(DEFAULT_CONFIG);
        const userConfig = await modal.promptUser();

        const typer = new AutoTyper(userConfig);
        await typer.run();

    } catch (e) {
    }

})();
