/**
 * タイピングゲーム自動化スクリプト (人間性シミュレート導入版 + 実効値表示 + 集中力グラフ + 不得意キー特性)
 */
(async function () {
    const DEFAULT_CONFIG = {
        minDelay: 200,
        maxDelay: 300,
        startDelay: 1000,
        checkInterval: 100,
        autoSkip: true,
        missRate: 0,
        // --- 人間性シミュレーション設定 ---
        humanitySim: false,
        humanityFeatures: {
            concentration: true, // 集中力シミュレーション
            weakKeys: false      // 不得意キーシミュレーション
        },
        weakKeysList: [],        // 例: ['q', 'p', '-', '1']
        weakKeysBase: 1.5,       // ペナルティの基準倍率
        weakKeysVar: 0.2         // ペナルティのランダム変動幅 (±)
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

                        <div class="tt-auto-form-group checkbox-group" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
                            <label style="color: #d63384; font-weight: bold;">
                                <input type="checkbox" id="tt-humanity-sim" ${this.config.humanitySim ? 'checked' : ''}>
                                Humanity Simulation
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
                const humanityInput = overlay.querySelector('#tt-humanity-sim');
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
                    this.config.humanitySim = humanityInput.checked;

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

            this.isTypingLine = false;
            this.lastKeyTime = 0;
            this.recentIntervals = [];

            this.kpsHistory = new Array(50).fill(0);
            this.allKpsRecords = [];

            this.execUiContainer = null;
            this.canvasCtx = null;
            this.graphInterval = null;

            this.isDragging = false;
            this.dragOffsetX = 0;
            this.dragOffsetY = 0;
            this.onMouseMove = this.handleMouseMove.bind(this);
            this.onMouseUp = this.handleMouseUp.bind(this);

            // 人間性シミュレーション用の状態管理
            this.humanityStartTime = Date.now();
            this.concHistory = new Array(50).fill(100);
            this.humanityState = {
                concentration: 100,
                delayMult: 1.0,
                missMult: 1.0
            };
            this.humanityUiContainer = null;
            this.isHumanityDragging = false;
            this.humanityDragOffsetX = 0;
            this.humanityDragOffsetY = 0;
            this.onHumanityMouseMove = this.handleHumanityMouseMove.bind(this);
            this.onHumanityMouseUp = this.handleHumanityMouseUp.bind(this);
        }

        // ==========================================
        //  UI作成: メイン実行モーダル
        // ==========================================
        createExecutionUI() {
            this.execUiContainer = document.createElement('div');
            this.execUiContainer.style.cssText = `
                position: fixed; top: 20px; right: 20px; width: 310px; height: 280px;
                min-width: 280px; min-height: 250px;
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

                <div style="margin-bottom: 8px; flex-shrink: 0; font-size: 11px; border-top: 1px solid #444; padding-top: 6px;">
                    <label style="cursor: pointer; display: flex; align-items: center; color: #d63384; font-weight: bold;">
                        <input type="checkbox" id="tt-exec-humanity" ${this.config.humanitySim ? 'checked' : ''} style="margin-right: 6px;"> 
                        Humanity Simulation
                    </label>
                </div>

                <canvas id="tt-kps-graph" style="background: #000; border: 1px solid #444; border-radius: 4px; margin-bottom: 8px; flex-grow: 1; min-height: 0; width: 100%; box-sizing: border-box;"></canvas>

                <div style="display: flex; gap: 5px; flex-shrink: 0; width: 100%;">
                    <button id="tt-exec-pause" style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Pause</button>
                    <button id="tt-exec-cancel" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">STOP</button>
                </div>
            `;
            document.body.appendChild(this.execUiContainer);

            // メインUIのイベント設定
            const stepInput = this.execUiContainer.querySelector('#tt-exec-step');
            const minExecInput = this.execUiContainer.querySelector('#tt-exec-min');
            const maxExecInput = this.execUiContainer.querySelector('#tt-exec-max');
            const missExecInput = this.execUiContainer.querySelector('#tt-exec-miss');
            const autoSkipExec = this.execUiContainer.querySelector('#tt-exec-autoskip');
            const humanityExec = this.execUiContainer.querySelector('#tt-exec-humanity');
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

            humanityExec.addEventListener('change', (e) => {
                this.config.humanitySim = e.target.checked;
                if (this.config.humanitySim) {
                    this.createHumanityUI();
                } else {
                    this.removeHumanityUI();
                }
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

            if (this.config.humanitySim) {
                this.createHumanityUI();
            }
        }

        // ==========================================
        //  UI作成: 人間性シミュレーション情報モーダル
        // ==========================================
        createHumanityUI() {
            if (this.humanityUiContainer) return;

            this.humanityUiContainer = document.createElement('div');
            this.humanityUiContainer.style.cssText = `
                position: fixed; top: 20px; left: 20px; width: 260px; height: 360px;
                min-width: 230px; min-height: 250px;
                background: rgba(30, 20, 40, 0.9); color: #f8cce5;
                padding: 10px; border-radius: 8px; z-index: 99998;
                font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                backdrop-filter: blur(4px); border: 1px solid #d63384;
                display: flex; flex-direction: column;
                resize: both; overflow: hidden;
            `;

            this.humanityUiContainer.innerHTML = `
                <div id="tt-humanity-drag" style="font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #d63384; cursor: move; user-select: none; border-bottom: 1px solid #d63384; padding-bottom: 4px; flex-shrink: 0;">
                    🧬 Humanity Simulation (Drag)
                </div>

                <div style="font-size: 11px; margin-bottom: 10px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-shrink: 0;">
                    <div style="color: #aaa; margin-bottom: 4px;">[ Toggles ]</div>
                    <label style="cursor: pointer; display: flex; align-items: center; margin-bottom: 4px;">
                        <input type="checkbox" id="tt-hum-toggle-conc" ${this.config.humanityFeatures.concentration ? 'checked' : ''} style="margin-right: 6px;"> 
                        Concentration (集中力)
                    </label>
                    <label style="cursor: pointer; display: flex; align-items: center;">
                        <input type="checkbox" id="tt-hum-toggle-weak" ${this.config.humanityFeatures.weakKeys ? 'checked' : ''} style="margin-right: 6px;"> 
                        Weak Keys (不得意キー)
                    </label>
                </div>

                <div id="tt-hum-info-area" style="font-size: 11px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-grow: 1; display: flex; flex-direction: column; min-height: 0;">
                    <div style="color: #aaa; margin-bottom: 4px; flex-shrink: 0;">[ Information ]</div>

                    <div id="tt-hum-overall-status" style="margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #666; flex-shrink: 0;">
                        <div style="display: flex; justify-content: space-between; color: #00FF00; font-weight: bold;">
                            <span>Eff. KPS:</span> <span id="tt-hum-eff-kps">0.00 - 0.00</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #ddd;">
                            <span>Eff. Delay:</span> <span id="tt-hum-eff-delay">0 - 0 ms</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #FF4500;">
                            <span>Eff. Miss:</span> <span id="tt-hum-eff-miss">0.0%</span>
                        </div>
                    </div>

                    <div id="tt-hum-info-conc" style="display: ${this.config.humanityFeatures.concentration ? 'flex' : 'none'}; flex-direction: column; flex-grow: 1; min-height: 0;">
                        <div style="display: flex; justify-content: space-between; flex-shrink: 0;">
                            <span>Focus Level:</span>
                            <span id="tt-hum-val-conc" style="font-weight: bold; color: #fff;">100%</span>
                        </div>
                        <div style="width: 100%; background: #444; height: 6px; border-radius: 3px; margin: 3px 0 6px 0; overflow: hidden; flex-shrink: 0;">
                            <div id="tt-hum-bar-conc" style="width: 100%; height: 100%; background: #00FF00; transition: width 0.5s, background-color 0.5s;"></div>
                        </div>
                        <canvas id="tt-hum-conc-graph" style="background: #000; border: 1px solid #444; border-radius: 4px; margin-bottom: 6px; flex-grow: 1; min-height: 0; width: 100%; box-sizing: border-box;"></canvas>
                        <div style="display: flex; justify-content: space-between; color: #ccc; flex-shrink: 0;">
                            <span>Delay Fix:</span> <span id="tt-hum-val-delay">x1.00</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #ccc; flex-shrink: 0;">
                            <span>Miss Fix:</span> <span id="tt-hum-val-miss">x1.00</span>
                        </div>
                    </div>

                    <div id="tt-hum-info-weak" style="display: ${this.config.humanityFeatures.weakKeys ? 'flex' : 'none'}; flex-direction: column; margin-top: 8px; border-top: 1px dashed #666; padding-top: 6px; flex-shrink: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <span>Weak: <span id="tt-hum-wk-list" style="color: #FFD700; word-break: break-all;">${this.config.weakKeysList.join(',').toUpperCase() || 'None'}</span></span>
                            <button id="tt-hum-btn-wk-edit" style="padding: 2px 6px; font-size: 10px; background: #d63384; color: white; border: none; border-radius: 3px; cursor: pointer;">Edit</button>
                        </div>
                        <div style="display: flex; gap: 4px; align-items: center;">
                            Base:x<input type="number" id="tt-hum-wk-base" value="${this.config.weakKeysBase}" step="0.1" min="1.0" style="width: 40px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;">
                            Var:±<input type="number" id="tt-hum-wk-var" value="${this.config.weakKeysVar}" step="0.1" min="0" style="width: 40px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;">
                        </div>
                    </div>

                    <div id="tt-hum-info-none" style="display: ${(this.config.humanityFeatures.concentration || this.config.humanityFeatures.weakKeys) ? 'none' : 'block'}; color: #666; text-align: center; margin-top: 10px; flex-shrink: 0;">
                        No features enabled.
                    </div>
                </div>
            `;
            document.body.appendChild(this.humanityUiContainer);

            // 要素取得
            const concToggle = this.humanityUiContainer.querySelector('#tt-hum-toggle-conc');
            const weakToggle = this.humanityUiContainer.querySelector('#tt-hum-toggle-weak');

            const infoConc = this.humanityUiContainer.querySelector('#tt-hum-info-conc');
            const infoWeak = this.humanityUiContainer.querySelector('#tt-hum-info-weak');
            const infoNone = this.humanityUiContainer.querySelector('#tt-hum-info-none');

            const btnWkEdit = this.humanityUiContainer.querySelector('#tt-hum-btn-wk-edit');
            const inWkBase = this.humanityUiContainer.querySelector('#tt-hum-wk-base');
            const inWkVar = this.humanityUiContainer.querySelector('#tt-hum-wk-var');

            const updateInfoDisplay = () => {
                const anyEnabled = this.config.humanityFeatures.concentration || this.config.humanityFeatures.weakKeys;
                infoNone.style.display = anyEnabled ? 'none' : 'block';
                infoConc.style.display = this.config.humanityFeatures.concentration ? 'flex' : 'none';
                infoWeak.style.display = this.config.humanityFeatures.weakKeys ? 'flex' : 'none';
            };

            // トグルイベント
            concToggle.addEventListener('change', (e) => {
                this.config.humanityFeatures.concentration = e.target.checked;
                updateInfoDisplay();
            });
            weakToggle.addEventListener('change', (e) => {
                this.config.humanityFeatures.weakKeys = e.target.checked;
                updateInfoDisplay();
            });

            // 不得意キー設定イベント
            btnWkEdit.addEventListener('click', () => {
                this.openWeakKeysModal();
            });
            inWkBase.addEventListener('change', (e) => {
                let v = parseFloat(e.target.value);
                if (isNaN(v) || v < 1.0) v = 1.0;
                this.config.weakKeysBase = v;
            });
            inWkVar.addEventListener('change', (e) => {
                let v = parseFloat(e.target.value);
                if (isNaN(v) || v < 0) v = 0;
                this.config.weakKeysVar = v;
            });

            // ドラッグイベント
            const dragHandle = this.humanityUiContainer.querySelector('#tt-humanity-drag');
            dragHandle.addEventListener('mousedown', (e) => {
                this.isHumanityDragging = true;
                const rect = this.humanityUiContainer.getBoundingClientRect();
                this.humanityDragOffsetX = e.clientX - rect.left;
                this.humanityDragOffsetY = e.clientY - rect.top;
            });
            document.addEventListener('mousemove', this.onHumanityMouseMove);
            document.addEventListener('mouseup', this.onHumanityMouseUp);
        }

        // --- 不得意キー選択モーダル ---
        openWeakKeysModal() {
            if (document.getElementById('tt-wk-modal')) return;

            const overlay = document.createElement('div');
            overlay.id = 'tt-wk-modal';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.7); z-index: 100000;
                display: flex; justify-content: center; align-items: center; font-family: sans-serif;
            `;

            // QWERTYキー配列
            const keys = [
                ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '^', '\\'],
                ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '@', '['],
                ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', ':', ']'],
                ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', '_']
            ];

            let gridHtml = '';
            keys.forEach(row => {
                gridHtml += `<div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 4px;">`;
                row.forEach(k => {
                    const isSel = this.config.weakKeysList.includes(k);
                    const bg = isSel ? '#d63384' : '#444';
                    gridHtml += `<button class="tt-wk-key-btn" data-key="${k}" style="width: 28px; height: 28px; border: 1px solid #222; border-radius: 4px; background: ${bg}; color: white; cursor: pointer; font-weight: bold; font-size: 12px; padding: 0;">${k.toUpperCase()}</button>`;
                });
                gridHtml += `</div>`;
            });

            overlay.innerHTML = `
                <div style="background: #222; padding: 20px; border-radius: 8px; border: 1px solid #d63384; color: white; width: 440px;">
                    <h3 style="margin-top: 0; margin-bottom: 15px; color: #d63384;">Select Weak Keys</h3>
                    <div style="margin-bottom: 20px;">
                        ${gridHtml}
                    </div>
                    <div style="text-align: right;">
                        <button id="tt-wk-cancel" style="padding: 6px 12px; border: none; border-radius: 4px; background: #666; color: white; cursor: pointer; margin-right: 8px; font-weight: bold;">Cancel</button>
                        <button id="tt-wk-save" style="padding: 6px 12px; border: none; border-radius: 4px; background: #d63384; color: white; cursor: pointer; font-weight: bold;">Save</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            let currentSelection = [...this.config.weakKeysList];
            const btns = overlay.querySelectorAll('.tt-wk-key-btn');
            btns.forEach(b => {
                b.onclick = () => {
                    const k = b.getAttribute('data-key');
                    if (currentSelection.includes(k)) {
                        currentSelection = currentSelection.filter(x => x !== k);
                        b.style.background = '#444';
                    } else {
                        currentSelection.push(k);
                        b.style.background = '#d63384';
                    }
                };
            });

            overlay.querySelector('#tt-wk-cancel').onclick = () => {
                overlay.remove();
            };
            overlay.querySelector('#tt-wk-save').onclick = () => {
                this.config.weakKeysList = currentSelection;
                const listEl = document.getElementById('tt-hum-wk-list');
                if (listEl) listEl.textContent = this.config.weakKeysList.join(',').toUpperCase() || 'None';
                overlay.remove();
            };
        }

        removeHumanityUI() {
            if (this.humanityUiContainer) {
                document.removeEventListener('mousemove', this.onHumanityMouseMove);
                document.removeEventListener('mouseup', this.onHumanityMouseUp);
                this.humanityUiContainer.remove();
                this.humanityUiContainer = null;
            }
        }

        // --- ドラッグ制御 (メインUI) ---
        handleMouseMove(e) {
            if (!this.isDragging) return;
            let newX = e.clientX - this.dragOffsetX;
            let newY = e.clientY - this.dragOffsetY;
            const rect = this.execUiContainer.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            if (newX < 0) newX = 0; if (newY < 0) newY = 0;
            if (newX > maxX) newX = maxX; if (newY > maxY) newY = maxY;
            this.execUiContainer.style.right = 'auto'; this.execUiContainer.style.bottom = 'auto';
            this.execUiContainer.style.left = `${newX}px`; this.execUiContainer.style.top = `${newY}px`;
        }
        handleMouseUp() { this.isDragging = false; }

        // --- ドラッグ制御 (人間性UI) ---
        handleHumanityMouseMove(e) {
            if (!this.isHumanityDragging || !this.humanityUiContainer) return;
            let newX = e.clientX - this.humanityDragOffsetX;
            let newY = e.clientY - this.humanityDragOffsetY;
            const rect = this.humanityUiContainer.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            if (newX < 0) newX = 0; if (newY < 0) newY = 0;
            if (newX > maxX) newX = maxX; if (newY > maxY) newY = maxY;
            this.humanityUiContainer.style.right = 'auto'; this.humanityUiContainer.style.bottom = 'auto';
            this.humanityUiContainer.style.left = `${newX}px`; this.humanityUiContainer.style.top = `${newY}px`;
        }
        handleHumanityMouseUp() { this.isHumanityDragging = false; }

        // ==========================================
        //  状態更新 & グラフ描画
        // ==========================================
        updateGraph() {
            if (this.isCancelled || this.isPaused || !this.isTypingLine) return;

            // --- 人間性シミュレーションのリアルタイム計算 ---
            if (this.config.humanitySim) {
                let currentDelayMult = 1.0;
                let currentMissMult = 1.0;

                // 1. 集中力シミュレーション
                if (this.config.humanityFeatures.concentration) {
                    const elapsedSec = (Date.now() - this.humanityStartTime) / 1000;
                    const wave1 = Math.sin(elapsedSec / 30 * Math.PI * 2);
                    const wave2 = Math.sin(elapsedSec / 120 * Math.PI * 2);
                    let conc = 75 + (wave1 * 15) + (wave2 * 10) + (Math.random() * 4 - 2);

                    if (conc > 100) conc = 100;
                    if (conc < 0) conc = 0;

                    this.humanityState.concentration = conc;

                    this.concHistory.push(conc);
                    if (this.concHistory.length > 50) this.concHistory.shift();

                    const concDelayMult = 1.5 - (conc / 100) * 0.7;
                    const concMissMult = 2.5 - (conc / 100) * 2.0;

                    currentDelayMult *= concDelayMult;
                    currentMissMult *= concMissMult;

                    if (this.humanityUiContainer) {
                        const concValEl = this.humanityUiContainer.querySelector('#tt-hum-val-conc');
                        const concBarEl = this.humanityUiContainer.querySelector('#tt-hum-bar-conc');
                        const delayValEl = this.humanityUiContainer.querySelector('#tt-hum-val-delay');
                        const missValEl = this.humanityUiContainer.querySelector('#tt-hum-val-miss');

                        if (concValEl) concValEl.textContent = `${Math.round(conc)}%`;
                        if (delayValEl) delayValEl.textContent = `x${concDelayMult.toFixed(2)}`;
                        if (missValEl) missValEl.textContent = `x${concMissMult.toFixed(2)}`;

                        let concColor = '#00FF00';
                        if (conc <= 30) concColor = '#FF4500';
                        else if (conc <= 60) concColor = '#FFD700';

                        if (concBarEl) {
                            concBarEl.style.width = `${conc}%`;
                            concBarEl.style.backgroundColor = concColor;
                        }

                        // 集中力グラフの描画
                        const concCanvas = this.humanityUiContainer.querySelector('#tt-hum-conc-graph');
                        if (concCanvas) {
                            const ctx = concCanvas.getContext('2d');
                            concCanvas.width = concCanvas.clientWidth;
                            concCanvas.height = concCanvas.clientHeight;
                            const cw = concCanvas.width;
                            const ch = concCanvas.height;

                            ctx.clearRect(0, 0, cw, ch);

                            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                            ctx.font = '9px monospace';
                            ctx.textBaseline = 'top';
                            ctx.fillText(`100%`, 2, 2);
                            ctx.textBaseline = 'bottom';
                            ctx.fillText(`0%`, 2, ch - 1);

                            ctx.strokeStyle = '#333';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(0, ch);
                            ctx.lineTo(cw, ch);
                            ctx.stroke();

                            ctx.strokeStyle = concColor;
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            this.concHistory.forEach((val, i) => {
                                const x = (i / (this.concHistory.length - 1)) * cw;
                                const y = ch - (val / 100) * ch;
                                if (i === 0) ctx.moveTo(x, y);
                                else ctx.lineTo(x, y);
                            });
                            ctx.stroke();
                        }
                    }
                }

                // 最終的な補正値をStateに保存
                this.humanityState.delayMult = currentDelayMult;
                this.humanityState.missMult = currentMissMult;

                // --- Overall Status (Effective 値) の更新 ---
                // ※ ここにはWeakKeys(一打ごとのランダム要素)は含めず、ベースとなる実効値を表示する
                if (this.humanityUiContainer) {
                    const effMinDelay = Math.round(this.config.minDelay * currentDelayMult);
                    const effMaxDelay = Math.round(this.config.maxDelay * currentDelayMult);

                    let effKpsMin = "---";
                    let effKpsMax = "---";
                    if (effMaxDelay > 0) effKpsMin = (1000 / effMaxDelay).toFixed(2);
                    if (effMinDelay > 0) effKpsMax = (1000 / effMinDelay).toFixed(2);

                    const effMissRate = (this.config.missRate * currentMissMult).toFixed(1);

                    const effDelayEl = this.humanityUiContainer.querySelector('#tt-hum-eff-delay');
                    const effKpsEl = this.humanityUiContainer.querySelector('#tt-hum-eff-kps');
                    const effMissEl = this.humanityUiContainer.querySelector('#tt-hum-eff-miss');

                    if (effDelayEl) effDelayEl.textContent = `${effMinDelay} - ${effMaxDelay} ms`;
                    if (effKpsEl) effKpsEl.textContent = `${effKpsMin} - ${effKpsMax}`;
                    if (effMissEl) effMissEl.textContent = `${effMissRate}%`;
                }
            }

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

                const variance = this.allKpsRecords.reduce((a, b) => a + Math.pow(b - lifetimeKps, 2), 0) / this.allKpsRecords.length;
                const stdDev = Math.sqrt(variance);

                const lifetimeEl = this.execUiContainer.querySelector('#tt-lifetime-kps');
                const stddevEl = this.execUiContainer.querySelector('#tt-kps-stddev');
                if (lifetimeEl) lifetimeEl.textContent = lifetimeKps.toFixed(2);
                if (stddevEl) stddevEl.textContent = stdDev.toFixed(2);
            }

            // --- メイングラフ描画 ---
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
            this.removeHumanityUI();
            const wkModal = document.getElementById('tt-wk-modal');
            if (wkModal) wkModal.remove();
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

        // 引数に不得意キー等による追加のペナルティ倍率を受け取る
        getRandomDelay(extraPenalty = 1.0) {
            const min = Math.min(this.config.minDelay, this.config.maxDelay);
            const max = Math.max(this.config.minDelay, this.config.maxDelay);
            let baseDelay = Math.floor(Math.random() * (max - min)) + min;

            if (this.config.humanitySim) {
                baseDelay = Math.floor(baseDelay * this.humanityState.delayMult);
                baseDelay = Math.floor(baseDelay * extraPenalty);
            }

            return baseDelay;
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
                        if (interval < 3000) {
                            this.recentIntervals.push(interval);
                            if (this.recentIntervals.length > 5) {
                                this.recentIntervals.shift();
                            }
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

            this.humanityStartTime = Date.now();

            for (let i = 0; i < keysList.length; i++) {
                if (this.isCancelled) break;

                const lineKeys = keysList[i];

                while (this.isPaused && !this.isCancelled) {
                    await this.delay(100);
                }

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

                    // --- 補正値の計算 ---
                    let currentMissRate = this.config.missRate;
                    let weakPenalty = 1.0;
                    let isWeakKey = false;

                    if (this.config.humanitySim) {
                        currentMissRate *= this.humanityState.missMult; // 集中力によるMiss補正

                        // ★不得意キーの判定とペナルティ適用
                        if (this.config.humanityFeatures.weakKeys && this.config.weakKeysList.includes(char.toLowerCase())) {
                            isWeakKey = true;
                            // 基準値 ± 変動幅 (例: 1.5 ± 0.2 -> 1.3〜1.7)
                            const v = (Math.random() * 2 - 1) * this.config.weakKeysVar;
                            weakPenalty = this.config.weakKeysBase + v;
                            if (weakPenalty < 1.0) weakPenalty = 1.0; // ペナルティで逆に速くなるのを防止

                            currentMissRate *= weakPenalty; // Miss Rateにも悪影響を及ぼす
                        }
                    }

                    // --- 打鍵実行 ---
                    if (currentMissRate > 0 && (Math.random() * 100 < currentMissRate)) {
                        const wrongChar = this.getRandomWrongChar(char);
                        document.title = `${baseTitle} ${wrongChar} (Miss!)`;

                        await this.simulateKeydown(wrongChar, false);
                        await this.delay(this.getRandomDelay(weakPenalty)); // ミス時も引っかかりを再現

                        j--;
                        continue;
                    }

                    document.title = `${baseTitle} ${char}`;
                    await this.simulateKeydown(char, true);
                    await this.delay(this.getRandomDelay(weakPenalty));
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
