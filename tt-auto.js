/**
 * タイピングゲーム自動化スクリプト (人間性シミュレート導入版 + 実効値表示 + 集中力グラフ + 不得意キー特性 + 物理隣接ミスアルゴリズム)
 * [Refactored Version]
 */
(async function () {
    const DEFAULT_CONFIG = {
        minDelay: 200,
        maxDelay: 300,
        startDelay: 1000,
        checkInterval: 100,
        autoSkip: true,
        missRate: 0,
        humanitySim: false,
        humanityFeatures: {
            concentration: true,
            weakKeys: false
        },
        weakKeysList: [],
        weakKeysBase: 1.5,
        weakKeysVar: 0.2
    };

    // --- 定数データ ---
    // QWERTYキー配列 (不得意キー選択UI用)
    const QWERTY_KEYS = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '^', '\\'],
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '@', '['],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', ':', ']'],
        ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', '_']
    ];

    // 物理的に隣接するキーのマップ (ミスアルゴリズム用)
    const ADJACENT_KEYS = {
        '1': ['2', 'q'],
        '2': ['1', '3', 'q', 'w'],
        '3': ['2', '4', 'w', 'e'],
        '4': ['3', '5', 'e', 'r'],
        '5': ['4', '6', 'r', 't'],
        '6': ['5', '7', 't', 'y'],
        '7': ['6', '8', 'y', 'u'],
        '8': ['7', '9', 'u', 'i'],
        '9': ['8', '0', 'i', 'o'],
        '0': ['9', '-', 'o', 'p'],
        '-': ['0', '^', 'p', '@'],
        '^': ['-', '\\', '@', '['],
        'q': ['1', '2', 'w', 'a'],
        'w': ['2', '3', 'q', 'e', 'a', 's'],
        'e': ['3', '4', 'w', 'r', 's', 'd'],
        'r': ['4', '5', 'e', 't', 'd', 'f'],
        't': ['5', '6', 'r', 'y', 'f', 'g'],
        'y': ['6', '7', 't', 'u', 'g', 'h'],
        'u': ['7', '8', 'y', 'i', 'h', 'j'],
        'i': ['8', '9', 'u', 'o', 'j', 'k'],
        'o': ['9', '0', 'i', 'p', 'k', 'l'],
        'p': ['0', '-', 'o', '@', 'l', ';'],
        '@': ['-', '^', 'p', '[', ';', ':'],
        '[': ['^', '\\', '@', ':', ']'],
        'a': ['q', 'w', 's', 'z'],
        's': ['w', 'e', 'a', 'd', 'z', 'x'],
        'd': ['e', 'r', 's', 'f', 'x', 'c'],
        'f': ['r', 't', 'd', 'g', 'c', 'v'],
        'g': ['t', 'y', 'f', 'h', 'v', 'b'],
        'h': ['y', 'u', 'g', 'j', 'b', 'n'],
        'j': ['u', 'i', 'h', 'k', 'n', 'm'],
        'k': ['i', 'o', 'j', 'l', 'm', ','],
        'l': ['o', 'p', 'k', ';', ',', '.'],
        ';': ['p', '@', 'l', ':', '.', '/'],
        ':': ['@', '[', ';', ']', '/', '\\'],
        ']': ['[', ':', '\\'],
        'z': ['a', 's', 'x'],
        'x': ['s', 'd', 'z', 'c'],
        'c': ['d', 'f', 'x', 'v'],
        'v': ['f', 'g', 'c', 'b'],
        'b': ['g', 'h', 'v', 'n'],
        'n': ['h', 'j', 'b', 'm'],
        'm': ['j', 'k', 'n', ','],
        ',': ['k', 'l', 'm', '.'],
        '.': ['l', ';', ',', '/'],
        '/': [';', ':', '.', '\\'],
        '\!': ['1', '2', 'q', '\"'],
        '\"': ['1', '\!', '2', '3', '\#', 'q', 'w'],
        '\'': ['6', '\&', '7', '8', '\(', 'y', 'u'],
        '\?': ['\>', '.', '/', '\_', '\\']
    };


    // --- 初期設定用UI作成クラス ---
    class ConfigModal {
        constructor(defaultConfig) {
            this.config = { ...defaultConfig };
        }

        createStyle() {
            return `
                .tt-auto-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 10000; display: flex; justify-content: center; align-items: center; }
                .tt-auto-modal { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); width: 300px; font-family: sans-serif; }
                .tt-auto-modal h2 { margin-top: 0; font-size: 18px; margin-bottom: 15px; }
                .tt-auto-form-group { margin-bottom: 15px; }
                .tt-auto-form-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px; }
                .tt-auto-form-group input[type="number"] { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
                .tt-auto-form-group.checkbox-group label { display: flex; align-items: center; font-weight: normal; cursor: pointer; }
                .tt-auto-form-group.checkbox-group input[type="checkbox"] { width: auto; margin-right: 10px; cursor: pointer; transform: scale(1.2); }
                .tt-auto-actions { text-align: right; margin-top: 20px; }
                .tt-auto-btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; color: white; background-color: #007bff; }
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
                        <div class="tt-auto-form-group"><label>Min Delay (ms)</label><input type="number" id="tt-min-delay" value="${this.config.minDelay}"></div>
                        <div class="tt-auto-form-group" style="margin-bottom: 5px;"><label>Max Delay (ms)</label><input type="number" id="tt-max-delay" value="${this.config.maxDelay}"></div>
                        <div style="font-size: 12px; margin-bottom: 10px; color: #666; text-align: right;">Est. KPS: <span id="tt-est-kps">0.00 - 0.00</span> (Avg: <span id="tt-avg-kps">0.00</span>)</div>
                        <div class="tt-auto-form-group"><label>Miss Rate (%)</label><input type="number" id="tt-miss-rate" value="${this.config.missRate}" min="0" max="100"></div>
                        <div class="tt-auto-form-group checkbox-group"><label><input type="checkbox" id="tt-auto-skip" ${this.config.autoSkip ? 'checked' : ''}>Auto Skip (ON / OFF)</label></div>
                        <div class="tt-auto-form-group checkbox-group" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
                            <label style="color: #d63384; font-weight: bold;"><input type="checkbox" id="tt-humanity-sim" ${this.config.humanitySim ? 'checked' : ''}>Humanity Simulation</label>
                        </div>
                        <div class="tt-auto-actions">
                            <button class="tt-auto-btn cancel" id="tt-cancel-btn">Cancel</button>
                            <button class="tt-auto-btn" id="tt-start-btn">Start</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(overlay);

                const getEl = id => overlay.querySelector(`#${id}`);
                const updateKpsEstimate = () => {
                    const min = parseInt(getEl('tt-min-delay').value, 10);
                    const max = parseInt(getEl('tt-max-delay').value, 10);
                    if (min > 0 && max > 0 && min <= max) {
                        getEl('tt-est-kps').textContent = `${(1000 / max).toFixed(2)} - ${(1000 / min).toFixed(2)}`;
                        getEl('tt-avg-kps').textContent = (1000 / ((min + max) / 2)).toFixed(2);
                    } else {
                        getEl('tt-est-kps').textContent = `---`;
                        getEl('tt-avg-kps').textContent = `---`;
                    }
                };

                getEl('tt-min-delay').addEventListener('input', updateKpsEstimate);
                getEl('tt-max-delay').addEventListener('input', updateKpsEstimate);
                updateKpsEstimate();

                getEl('tt-start-btn').onclick = () => {
                    const newMin = parseInt(getEl('tt-min-delay').value, 10);
                    const newMax = parseInt(getEl('tt-max-delay').value, 10);
                    let newMiss = parseFloat(getEl('tt-miss-rate').value);

                    if (isNaN(newMin) || isNaN(newMax)) return alert("数値を入力してください");
                    if (newMin > newMax) return alert("Min Delay は Max Delay 以下の値にしてください");

                    this.config.minDelay = newMin;
                    this.config.maxDelay = newMax;
                    this.config.missRate = isNaN(newMiss) ? 0 : Math.max(0, Math.min(100, newMiss));
                    this.config.autoSkip = getEl('tt-auto-skip').checked;
                    this.config.humanitySim = getEl('tt-humanity-sim').checked;

                    cleanup();
                    resolve(this.config);
                };

                getEl('tt-cancel-btn').onclick = () => { cleanup(); reject(new Error("User cancelled")); };

                function cleanup() { overlay.remove(); styleEl.remove(); }
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
            this.humanityUiContainer = null;
            this.canvasCtx = null;
            this.graphInterval = null;

            this.humanityStartTime = Date.now();
            this.concHistory = new Array(50).fill(100);
            this.humanityState = { concentration: 100, delayMult: 1.0, missMult: 1.0 };

            // クリーンアップ用コールバック配列
            this.cleanupCallbacks = [];
        }

        // ==========================================
        //  UI / DOM 操作ヘルパー
        // ==========================================

        /**
         * モーダルをドラッグ可能にする共通処理
         */
        setupDraggable(modalElement, handleElement) {
            let isDragging = false;
            let offsetX = 0, offsetY = 0;

            const onMouseDown = (e) => {
                isDragging = true;
                const rect = modalElement.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
            };

            const onMouseMove = (e) => {
                if (!isDragging) return;
                let newX = e.clientX - offsetX;
                let newY = e.clientY - offsetY;

                const rect = modalElement.getBoundingClientRect();
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;

                newX = Math.max(0, Math.min(newX, maxX));
                newY = Math.max(0, Math.min(newY, maxY));

                modalElement.style.right = 'auto';
                modalElement.style.bottom = 'auto';
                modalElement.style.left = `${newX}px`;
                modalElement.style.top = `${newY}px`;
            };

            const onMouseUp = () => { isDragging = false; };

            handleElement.addEventListener('mousedown', onMouseDown);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            this.cleanupCallbacks.push(() => {
                handleElement.removeEventListener('mousedown', onMouseDown);
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            });
        }

        // ==========================================
        //  UI作成: メイン実行モーダル
        // ==========================================
        createExecutionUI() {
            this.execUiContainer = document.createElement('div');
            this.execUiContainer.style.cssText = `
                position: fixed; top: 20px; right: 20px; width: 310px; height: 280px;
                min-width: 280px; min-height: 250px;
                background: rgba(20, 20, 20, 0.85); color: #fff; padding: 10px; border-radius: 8px; z-index: 99999;
                font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5); backdrop-filter: blur(4px);
                display: flex; flex-direction: column; resize: both; overflow: hidden;
            `;

            const inputStyle = `width: 45px; padding: 2px; font-size: 11px; background: #333; color: white; border: 1px solid #555; border-radius: 3px;`;

            this.execUiContainer.innerHTML = `
                <div id="tt-drag-handle" style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #4CAF50; cursor: move; user-select: none; flex-shrink: 0;">● AutoTyper Running (Drag)</div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px; flex-shrink: 0;">
                    <div title="直近5打鍵の移動平均KPS" style="font-size: 12px;">Live KPS: <br><span id="tt-kps-val" style="font-size:16px; font-weight:bold; color: #00FF00;">0.00</span></div>
                    <div title="全体の平均KPSと標準偏差(ばらつき)" style="font-size: 11px; text-align: right; color: #ccc;">Life KPS: <span id="tt-lifetime-kps" style="font-size:14px; font-weight:bold; color: #fff;">0.00</span><br>StdDev: ±<span id="tt-kps-stddev">0.00</span></div>
                </div>
                <div style="display: flex; gap: 4px; margin-bottom: 4px; flex-shrink: 0; font-size: 11px; align-items: center; flex-wrap: wrap;">
                    Step:<input type="number" id="tt-exec-step" value="10" min="1" style="width: 35px; padding: 2px; font-size: 11px; background: #333; color: white; border: 1px solid #555; border-radius: 3px;">
                    Delay:<input type="number" id="tt-exec-min" value="${this.config.minDelay}" step="10" style="${inputStyle}"> - <input type="number" id="tt-exec-max" value="${this.config.maxDelay}" step="10" style="${inputStyle}">
                </div>
                <div style="display: flex; gap: 4px; margin-bottom: 8px; flex-shrink: 0; font-size: 11px; align-items: center; flex-wrap: wrap;">
                    Miss(%):<input type="number" id="tt-exec-miss" value="${this.config.missRate}" min="0" max="100" step="1" style="${inputStyle}">
                    <label style="cursor: pointer; display: flex; align-items: center; margin-left: auto; background: #333; padding: 2px 4px; border-radius: 3px; border: 1px solid #555;"><input type="checkbox" id="tt-exec-autoskip" ${this.config.autoSkip ? 'checked' : ''} style="margin: 0 4px 0 0;"> Skip</label>
                </div>
                <div style="margin-bottom: 8px; flex-shrink: 0; font-size: 11px; border-top: 1px solid #444; padding-top: 6px;">
                    <label style="cursor: pointer; display: flex; align-items: center; color: #d63384; font-weight: bold;"><input type="checkbox" id="tt-exec-humanity" ${this.config.humanitySim ? 'checked' : ''} style="margin-right: 6px;"> Humanity Simulation</label>
                </div>
                <canvas id="tt-kps-graph" style="background: #000; border: 1px solid #444; border-radius: 4px; margin-bottom: 8px; flex-grow: 1; min-height: 0; width: 100%; box-sizing: border-box;"></canvas>
                <div style="display: flex; gap: 5px; flex-shrink: 0; width: 100%;">
                    <button id="tt-exec-pause" style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Pause</button>
                    <button id="tt-exec-cancel" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">STOP</button>
                </div>
            `;
            document.body.appendChild(this.execUiContainer);

            // ドラッグ設定
            this.setupDraggable(this.execUiContainer, this.execUiContainer.querySelector('#tt-drag-handle'));

            // イベント設定
            const getEl = id => this.execUiContainer.querySelector(`#${id}`);
            getEl('tt-exec-step').addEventListener('change', e => {
                const val = parseInt(e.target.value, 10);
                if (val > 0) { getEl('tt-exec-min').step = val; getEl('tt-exec-max').step = val; }
            });
            getEl('tt-exec-min').addEventListener('change', e => { const val = parseInt(e.target.value, 10); if (val > 0) this.config.minDelay = val; });
            getEl('tt-exec-max').addEventListener('change', e => { const val = parseInt(e.target.value, 10); if (val > 0) this.config.maxDelay = val; });
            getEl('tt-exec-miss').addEventListener('change', e => { let val = parseFloat(e.target.value); this.config.missRate = isNaN(val) ? 0 : Math.max(0, Math.min(100, val)); });
            getEl('tt-exec-autoskip').addEventListener('change', e => this.config.autoSkip = e.target.checked);

            getEl('tt-exec-humanity').addEventListener('change', e => {
                this.config.humanitySim = e.target.checked;
                this.config.humanitySim ? this.createHumanityUI() : this.removeHumanityUI();
            });

            const pauseBtn = getEl('tt-exec-pause');
            pauseBtn.onclick = async () => {
                if (this.isCancelled) return;
                this.isPaused = !this.isPaused;
                pauseBtn.textContent = this.isPaused ? "Resume" : "Pause";
                pauseBtn.style.background = this.isPaused ? "#28a745" : "#007bff";
                await this.simulateKeydown("Escape", false);
            };

            const cancelBtn = getEl('tt-exec-cancel');
            cancelBtn.onclick = () => {
                this.isCancelled = true;
                cancelBtn.textContent = "Stopping...";
                cancelBtn.style.background = "#6c757d";
            };

            this.canvasCtx = getEl('tt-kps-graph').getContext('2d');
            this.graphInterval = setInterval(() => this.updateGraph(), 200);

            if (this.config.humanitySim) this.createHumanityUI();
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
                background: rgba(30, 20, 40, 0.9); color: #f8cce5; padding: 10px; border-radius: 8px; z-index: 99998;
                font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5); backdrop-filter: blur(4px); border: 1px solid #d63384;
                display: flex; flex-direction: column; resize: both; overflow: hidden;
            `;

            this.humanityUiContainer.innerHTML = `
                <div id="tt-humanity-drag" style="font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #d63384; cursor: move; user-select: none; border-bottom: 1px solid #d63384; padding-bottom: 4px; flex-shrink: 0;">🧬 Humanity Simulation (Drag)</div>
                <div style="font-size: 11px; margin-bottom: 10px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-shrink: 0;">
                    <div style="color: #aaa; margin-bottom: 4px;">[ Toggles ]</div>
                    <label style="cursor: pointer; display: flex; align-items: center; margin-bottom: 4px;"><input type="checkbox" id="tt-hum-toggle-conc" ${this.config.humanityFeatures.concentration ? 'checked' : ''} style="margin-right: 6px;"> Concentration (集中力)</label>
                    <label style="cursor: pointer; display: flex; align-items: center;"><input type="checkbox" id="tt-hum-toggle-weak" ${this.config.humanityFeatures.weakKeys ? 'checked' : ''} style="margin-right: 6px;"> Weak Keys (不得意キー)</label>
                </div>
                <div id="tt-hum-info-area" style="font-size: 11px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-grow: 1; display: flex; flex-direction: column; min-height: 0;">
                    <div style="color: #aaa; margin-bottom: 4px; flex-shrink: 0;">[ Information ]</div>
                    <div id="tt-hum-overall-status" style="margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #666; flex-shrink: 0;">
                        <div style="display: flex; justify-content: space-between; color: #00FF00; font-weight: bold;"><span>Eff. KPS:</span> <span id="tt-hum-eff-kps">0.00 - 0.00</span></div>
                        <div style="display: flex; justify-content: space-between; color: #ddd;"><span>Eff. Delay:</span> <span id="tt-hum-eff-delay">0 - 0 ms</span></div>
                        <div style="display: flex; justify-content: space-between; color: #FF4500;"><span>Eff. Miss:</span> <span id="tt-hum-eff-miss">0.0%</span></div>
                    </div>
                    <div id="tt-hum-info-conc" style="display: ${this.config.humanityFeatures.concentration ? 'flex' : 'none'}; flex-direction: column; flex-grow: 1; min-height: 0;">
                        <div style="display: flex; justify-content: space-between; flex-shrink: 0;"><span>Focus Level:</span> <span id="tt-hum-val-conc" style="font-weight: bold; color: #fff;">100%</span></div>
                        <div style="width: 100%; background: #444; height: 6px; border-radius: 3px; margin: 3px 0 6px 0; overflow: hidden; flex-shrink: 0;"><div id="tt-hum-bar-conc" style="width: 100%; height: 100%; background: #00FF00; transition: width 0.5s, background-color 0.5s;"></div></div>
                        <canvas id="tt-hum-conc-graph" style="background: #000; border: 1px solid #444; border-radius: 4px; margin-bottom: 6px; flex-grow: 1; min-height: 0; width: 100%; box-sizing: border-box;"></canvas>
                        <div style="display: flex; justify-content: space-between; color: #ccc; flex-shrink: 0;"><span>Delay Fix:</span> <span id="tt-hum-val-delay">x1.00</span></div>
                        <div style="display: flex; justify-content: space-between; color: #ccc; flex-shrink: 0;"><span>Miss Fix:</span> <span id="tt-hum-val-miss">x1.00</span></div>
                    </div>
                    <div id="tt-hum-info-weak" style="display: ${this.config.humanityFeatures.weakKeys ? 'flex' : 'none'}; flex-direction: column; margin-top: 8px; border-top: 1px dashed #666; padding-top: 6px; flex-shrink: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;"><span>Weak: <span id="tt-hum-wk-list" style="color: #FFD700; word-break: break-all;">${this.config.weakKeysList.join(',').toUpperCase() || 'None'}</span></span><button id="tt-hum-btn-wk-edit" style="padding: 2px 6px; font-size: 10px; background: #d63384; color: white; border: none; border-radius: 3px; cursor: pointer;">Edit</button></div>
                        <div style="display: flex; gap: 4px; align-items: center;">Base:x<input type="number" id="tt-hum-wk-base" value="${this.config.weakKeysBase}" step="0.1" min="1.0" style="width: 40px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"> Var:±<input type="number" id="tt-hum-wk-var" value="${this.config.weakKeysVar}" step="0.1" min="0" style="width: 40px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"></div>
                    </div>
                    <div id="tt-hum-info-none" style="display: ${(this.config.humanityFeatures.concentration || this.config.humanityFeatures.weakKeys) ? 'none' : 'block'}; color: #666; text-align: center; margin-top: 10px; flex-shrink: 0;">No features enabled.</div>
                </div>
            `;
            document.body.appendChild(this.humanityUiContainer);

            this.setupDraggable(this.humanityUiContainer, this.humanityUiContainer.querySelector('#tt-humanity-drag'));

            const getEl = id => this.humanityUiContainer.querySelector(`#${id}`);
            const updateInfoDisplay = () => {
                const anyEnabled = this.config.humanityFeatures.concentration || this.config.humanityFeatures.weakKeys;
                getEl('tt-hum-info-none').style.display = anyEnabled ? 'none' : 'block';
                getEl('tt-hum-info-conc').style.display = this.config.humanityFeatures.concentration ? 'flex' : 'none';
                getEl('tt-hum-info-weak').style.display = this.config.humanityFeatures.weakKeys ? 'flex' : 'none';
            };

            getEl('tt-hum-toggle-conc').addEventListener('change', e => { this.config.humanityFeatures.concentration = e.target.checked; updateInfoDisplay(); });
            getEl('tt-hum-toggle-weak').addEventListener('change', e => { this.config.humanityFeatures.weakKeys = e.target.checked; updateInfoDisplay(); });

            getEl('tt-hum-btn-wk-edit').addEventListener('click', () => this.openWeakKeysModal());
            getEl('tt-hum-wk-base').addEventListener('change', e => { let v = parseFloat(e.target.value); this.config.weakKeysBase = isNaN(v) ? 1.0 : Math.max(1.0, v); });
            getEl('tt-hum-wk-var').addEventListener('change', e => { let v = parseFloat(e.target.value); this.config.weakKeysVar = isNaN(v) ? 0 : Math.max(0, v); });
        }

        openWeakKeysModal() {
            if (document.getElementById('tt-wk-modal')) return;

            const overlay = document.createElement('div');
            overlay.id = 'tt-wk-modal';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.7); z-index: 100000;
                display: flex; justify-content: center; align-items: center; font-family: sans-serif;
            `;

            let gridHtml = QWERTY_KEYS.map(row =>
                `<div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 4px;">` +
                row.map(k => {
                    const bg = this.config.weakKeysList.includes(k) ? '#d63384' : '#444';
                    return `<button class="tt-wk-key-btn" data-key="${k}" style="width: 28px; height: 28px; border: 1px solid #222; border-radius: 4px; background: ${bg}; color: white; cursor: pointer; font-weight: bold; font-size: 12px; padding: 0;">${k.toUpperCase()}</button>`;
                }).join('') + `</div>`
            ).join('');

            overlay.innerHTML = `
                <div style="background: #222; padding: 20px; border-radius: 8px; border: 1px solid #d63384; color: white; width: 440px;">
                    <h3 style="margin-top: 0; margin-bottom: 15px; color: #d63384;">Select Weak Keys</h3>
                    <div style="margin-bottom: 20px;">${gridHtml}</div>
                    <div style="text-align: right;">
                        <button id="tt-wk-cancel" style="padding: 6px 12px; border: none; border-radius: 4px; background: #666; color: white; cursor: pointer; margin-right: 8px; font-weight: bold;">Cancel</button>
                        <button id="tt-wk-save" style="padding: 6px 12px; border: none; border-radius: 4px; background: #d63384; color: white; cursor: pointer; font-weight: bold;">Save</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            let currentSelection = [...this.config.weakKeysList];
            overlay.querySelectorAll('.tt-wk-key-btn').forEach(b => {
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

            overlay.querySelector('#tt-wk-cancel').onclick = () => overlay.remove();
            overlay.querySelector('#tt-wk-save').onclick = () => {
                this.config.weakKeysList = currentSelection;
                const listEl = document.getElementById('tt-hum-wk-list');
                if (listEl) listEl.textContent = this.config.weakKeysList.join(',').toUpperCase() || 'None';
                overlay.remove();
            };
        }

        removeHumanityUI() {
            if (this.humanityUiContainer) {
                this.humanityUiContainer.remove();
                this.humanityUiContainer = null;
            }
        }

        // ==========================================
        //  状態更新 & グラフ描画
        // ==========================================
        updateGraph() {
            if (this.isCancelled || this.isPaused || !this.isTypingLine) return;

            // --- 人間性シミュレーションのリアルタイム計算 ---
            if (this.config.humanitySim) {
                let currentDelayMult = 1.0;
                let currentMissMult = 1.0;

                if (this.config.humanityFeatures.concentration) {
                    const elapsedSec = (Date.now() - this.humanityStartTime) / 1000;
                    const wave1 = Math.sin(elapsedSec / 30 * Math.PI * 2);
                    const wave2 = Math.sin(elapsedSec / 120 * Math.PI * 2);
                    let conc = 75 + (wave1 * 15) + (wave2 * 10) + (Math.random() * 4 - 2);

                    conc = Math.max(0, Math.min(100, conc));
                    this.humanityState.concentration = conc;

                    this.concHistory.push(conc);
                    if (this.concHistory.length > 50) this.concHistory.shift();

                    const concDelayMult = 1.5 - (conc / 100) * 0.7;
                    const concMissMult = 2.5 - (conc / 100) * 2.0;

                    currentDelayMult *= concDelayMult;
                    currentMissMult *= concMissMult;

                    if (this.humanityUiContainer) {
                        const getEl = id => this.humanityUiContainer.querySelector(`#${id}`);

                        const concValEl = getEl('tt-hum-val-conc');
                        const concBarEl = getEl('tt-hum-bar-conc');
                        if (concValEl) concValEl.textContent = `${Math.round(conc)}%`;
                        if (getEl('tt-hum-val-delay')) getEl('tt-hum-val-delay').textContent = `x${concDelayMult.toFixed(2)}`;
                        if (getEl('tt-hum-val-miss')) getEl('tt-hum-val-miss').textContent = `x${concMissMult.toFixed(2)}`;

                        let concColor = conc <= 30 ? '#FF4500' : (conc <= 60 ? '#FFD700' : '#00FF00');

                        if (concBarEl) {
                            concBarEl.style.width = `${conc}%`;
                            concBarEl.style.backgroundColor = concColor;
                        }

                        const concCanvas = getEl('tt-hum-conc-graph');
                        if (concCanvas) {
                            const ctx = concCanvas.getContext('2d');
                            concCanvas.width = concCanvas.clientWidth;
                            concCanvas.height = concCanvas.clientHeight;
                            const cw = concCanvas.width, ch = concCanvas.height;

                            ctx.clearRect(0, 0, cw, ch);
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                            ctx.font = '9px monospace';
                            ctx.textBaseline = 'top'; ctx.fillText(`100%`, 2, 2);
                            ctx.textBaseline = 'bottom'; ctx.fillText(`0%`, 2, ch - 1);
                            ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
                            ctx.beginPath(); ctx.moveTo(0, ch); ctx.lineTo(cw, ch); ctx.stroke();

                            ctx.strokeStyle = concColor; ctx.lineWidth = 2;
                            ctx.beginPath();
                            this.concHistory.forEach((val, i) => {
                                const x = (i / (this.concHistory.length - 1)) * cw;
                                const y = ch - (val / 100) * ch;
                                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                            });
                            ctx.stroke();
                        }
                    }
                }

                this.humanityState.delayMult = currentDelayMult;
                this.humanityState.missMult = currentMissMult;

                if (this.humanityUiContainer) {
                    const effMinDelay = Math.round(this.config.minDelay * currentDelayMult);
                    const effMaxDelay = Math.round(this.config.maxDelay * currentDelayMult);
                    let effKpsMin = "---", effKpsMax = "---";
                    if (effMaxDelay > 0) effKpsMin = (1000 / effMaxDelay).toFixed(2);
                    if (effMinDelay > 0) effKpsMax = (1000 / effMinDelay).toFixed(2);
                    const effMissRate = (this.config.missRate * currentMissMult).toFixed(1);

                    const getEl = id => this.humanityUiContainer.querySelector(`#${id}`);
                    if (getEl('tt-hum-eff-delay')) getEl('tt-hum-eff-delay').textContent = `${effMinDelay} - ${effMaxDelay} ms`;
                    if (getEl('tt-hum-eff-kps')) getEl('tt-hum-eff-kps').textContent = `${effKpsMin} - ${effKpsMax}`;
                    if (getEl('tt-hum-eff-miss')) getEl('tt-hum-eff-miss').textContent = `${effMissRate}%`;
                }
            }

            // --- Live KPS 計算 ---
            let kpsVal = 0;
            if (this.recentIntervals.length > 0) {
                const sum = this.recentIntervals.reduce((a, b) => a + b, 0);
                if (sum > 0) kpsVal = 1000 / (sum / this.recentIntervals.length);
            }

            this.kpsHistory.push(kpsVal);
            if (this.kpsHistory.length > 50) this.kpsHistory.shift();

            const kpsText = this.execUiContainer.querySelector('#tt-kps-val');
            if (kpsText) kpsText.textContent = kpsVal.toFixed(2);

            // --- Lifetime KPS & ばらつき 計算 ---
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
                canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
                const width = canvas.width, height = canvas.height;
                const ctx = this.canvasCtx;

                ctx.clearRect(0, 0, width, height);
                const maxKps = Math.max(10, Math.ceil(Math.max(...this.kpsHistory)));

                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; ctx.font = '10px monospace';
                ctx.textBaseline = 'top'; ctx.fillText(`Max: ${maxKps}`, 4, 4);
                ctx.textBaseline = 'bottom'; ctx.fillText(`0`, 4, height - 2);

                ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(0, height); ctx.lineTo(width, height); ctx.stroke();

                ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 2;
                ctx.beginPath();
                this.kpsHistory.forEach((val, i) => {
                    const x = (i / (this.kpsHistory.length - 1)) * width;
                    const y = height - (val / maxKps) * height;
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                });
                ctx.stroke();
            }
        }

        cleanupUI() {
            if (this.graphInterval) clearInterval(this.graphInterval);

            // 登録した全イベントリスナーを解除
            this.cleanupCallbacks.forEach(cb => cb());
            this.cleanupCallbacks = [];

            if (this.execUiContainer) this.execUiContainer.remove();
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
            const target = (correctChar || "").toLowerCase();
            const adjacents = ADJACENT_KEYS[target];

            if (adjacents && adjacents.length > 0) {
                return adjacents[Math.floor(Math.random() * adjacents.length)];
            }

            const chars = "abcdefghijklmnopqrstuvwxyz";
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
            let code = `Key${key.toUpperCase()}`;
            let keyCode = key.toUpperCase().charCodeAt(0);

            if (key === "F4") { code = "F4"; keyCode = 115; }
            else if (key === "Escape") { code = "Escape"; keyCode = 27; }
            else if (key === " ") { code = "Space"; keyCode = 32; }

            const event = new KeyboardEvent("keydown", { key, code, keyCode, bubbles: true, cancelable: true });

            if (this.controller && typeof this.controller._onKeydown === 'function') {
                await this.controller._onKeydown(event);

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

        async typeKeys(keysList) {
            const baseTitle = "Typing...";
            this.humanityStartTime = Date.now();

            for (let i = 0; i < keysList.length; i++) {
                if (this.isCancelled) break;
                const lineKeys = keysList[i];

                while (this.isPaused && !this.isCancelled) await this.delay(100);

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

                    if ((this.controller.count - 1) > i) break;

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
                        const wrongChar = this.getRandomWrongChar(char);
                        document.title = `${baseTitle} ${wrongChar} (Miss!)`;

                        await this.simulateKeydown(wrongChar, false);
                        await this.delay(this.getRandomDelay(weakPenalty));
                        j--;
                        continue;
                    }

                    document.title = `${baseTitle} ${char}`;
                    await this.simulateKeydown(char, true);
                    await this.delay(this.getRandomDelay(weakPenalty));
                }

                this.isTypingLine = false;

                if (this.isCancelled) break;

                while (this.isPaused && !this.isCancelled) await this.delay(100);

                if (this.config.autoSkip && !this.isCancelled) await this.simulateKeydown(" ", false);

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

                if (!this.isCancelled) await this.simulateKeydown("F4", false);

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
                    if (!this.isPaused) await this.simulateKeydown("Escape", false);
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
