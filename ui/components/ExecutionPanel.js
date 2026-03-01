import { setupDraggable } from '../../utils/domUtils.js';

export class ExecutionPanel {
    constructor(typer, uiManager) {
        this.typer = typer;
        this.uiManager = uiManager;
        this.config = typer.config;
        this.container = null;
        this.canvasCtx = null;
        this.cleanupDrag = null;
    }

    create() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed; top: 20px; right: 20px; width: 310px; height: 320px;
            min-width: 280px; min-height: 290px;
            background: rgba(20, 20, 20, 0.85); color: #fff; padding: 10px; border-radius: 8px; z-index: 99999;
            font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5); backdrop-filter: blur(4px);
            display: flex; flex-direction: column; resize: both; overflow: hidden;
        `;

        const inputStyle = `width: 45px; padding: 2px; font-size: 11px; background: #333; color: white; border: 1px solid #555; border-radius: 3px;`;

        this.container.innerHTML = `
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
            <div style="margin-bottom: 8px; flex-shrink: 0; font-size: 11px; border-top: 1px solid #444; padding-top: 6px; display: flex; flex-direction: column; gap: 4px;">
                <label style="cursor: pointer; display: flex; align-items: center; color: #d63384; font-weight: bold;">
                    <input type="checkbox" id="tt-exec-humanity" ${this.config.humanitySim ? 'checked' : ''} style="margin-right: 6px;"> Humanity Simulation
                </label>
                <label style="cursor: pointer; display: flex; align-items: center; color: #00bcd4; font-weight: bold;">
                    <input type="checkbox" id="tt-exec-keyboard" ${this.config.showKeyboard ? 'checked' : ''} style="margin-right: 6px;"> Virtual Keyboard
                </label>
                <label style="cursor: pointer; display: flex; align-items: center; color: #ff9800; font-weight: bold;">
                    <input type="checkbox" id="tt-exec-debug" ${this.config.debugMode ? 'checked' : ''} style="margin-right: 6px;"> Debug Mode (dev)
                </label>
            </div>
            <canvas id="tt-kps-graph" style="background: #000; border: 1px solid #444; border-radius: 4px; margin-bottom: 8px; flex-grow: 1; min-height: 0; width: 100%; box-sizing: border-box;"></canvas>
            <div style="display: flex; gap: 5px; flex-shrink: 0; width: 100%;">
                <button id="tt-exec-pause" style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Pause</button>
                <button id="tt-exec-cancel" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">STOP</button>
            </div>
        `;
        document.body.appendChild(this.container);

        this.cleanupDrag = setupDraggable(this.container, this.container.querySelector('#tt-drag-handle'));
        this.bindEvents();
        this.canvasCtx = this.container.querySelector('#tt-kps-graph').getContext('2d');
    }

    bindEvents() {
        const getEl = id => this.container.querySelector(`#${id}`);
        getEl('tt-exec-step').addEventListener('change', e => {
            const val = parseInt(e.target.value, 10);
            if (val > 0) { getEl('tt-exec-min').step = val; getEl('tt-exec-max').step = val; }
        });
        getEl('tt-exec-min').addEventListener('change', e => { const val = parseInt(e.target.value, 10); if (val > 0) this.config.minDelay = val; });
        getEl('tt-exec-max').addEventListener('change', e => { const val = parseInt(e.target.value, 10); if (val > 0) this.config.maxDelay = val; });
        getEl('tt-exec-miss').addEventListener('change', e => { let val = parseFloat(e.target.value); this.config.missRate = isNaN(val) ? 0 : Math.max(0, Math.min(100, val)); });
        getEl('tt-exec-autoskip').addEventListener('change', e => this.config.autoSkip = e.target.checked);

        // UIManagerにトグル処理を委譲
        getEl('tt-exec-humanity').addEventListener('change', e => {
            this.config.humanitySim = e.target.checked;
            this.uiManager.toggleHumanity(e.target.checked);
        });

        getEl('tt-exec-keyboard').addEventListener('change', e => {
            this.config.showKeyboard = e.target.checked;
            this.uiManager.toggleKeyboard(e.target.checked);
        });

        getEl('tt-exec-debug').addEventListener('change', e => {
            this.config.debugMode = e.target.checked;
            this.uiManager.toggleDebug(e.target.checked);
        });

        getEl('tt-exec-pause').onclick = async () => {
            await this.typer.setPauseState(!this.typer.isPaused);
        };

        getEl('tt-exec-cancel').onclick = () => {
            this.typer.isCancelled = true;
            getEl('tt-exec-cancel').textContent = "Stopping...";
            getEl('tt-exec-cancel').style.background = "#6c757d";
        };
    }

    updatePauseUI(isPaused) {
        if (!this.container) return;
        const pauseBtn = this.container.querySelector('#tt-exec-pause');
        if (pauseBtn) {
            pauseBtn.textContent = isPaused ? "Resume" : "Pause";
            pauseBtn.style.background = isPaused ? "#28a745" : "#007bff";
        }
    }

    updateGraph() {
        if (!this.container) return;

        let kpsVal = 0;
        if (this.typer.recentIntervals.length > 0) {
            const sum = this.typer.recentIntervals.reduce((a, b) => a + b, 0);
            if (sum > 0) kpsVal = 1000 / (sum / this.typer.recentIntervals.length);
        }

        this.typer.kpsHistory.push(kpsVal);
        if (this.typer.kpsHistory.length > 50) this.typer.kpsHistory.shift();

        const kpsText = this.container.querySelector('#tt-kps-val');
        if (kpsText) kpsText.textContent = kpsVal.toFixed(2);

        if (this.typer.allKpsRecords.length > 0) {
            const sumAll = this.typer.allKpsRecords.reduce((a, b) => a + b, 0);
            const lifetimeKps = sumAll / this.typer.allKpsRecords.length;
            const variance = this.typer.allKpsRecords.reduce((a, b) => a + Math.pow(b - lifetimeKps, 2), 0) / this.typer.allKpsRecords.length;
            const stdDev = Math.sqrt(variance);

            const lifetimeEl = this.container.querySelector('#tt-lifetime-kps');
            const stddevEl = this.container.querySelector('#tt-kps-stddev');
            if (lifetimeEl) lifetimeEl.textContent = lifetimeKps.toFixed(2);
            if (stddevEl) stddevEl.textContent = stdDev.toFixed(2);
        }

        const canvas = this.container.querySelector('#tt-kps-graph');
        if (this.canvasCtx && canvas) {
            canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
            const width = canvas.width, height = canvas.height;
            const ctx = this.canvasCtx;

            ctx.clearRect(0, 0, width, height);
            const maxKps = Math.max(10, Math.ceil(Math.max(...this.typer.kpsHistory)));

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; ctx.font = '10px monospace';
            ctx.textBaseline = 'top'; ctx.fillText(`Max: ${maxKps}`, 4, 4);
            ctx.textBaseline = 'bottom'; ctx.fillText(`0`, 4, height - 2);

            ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, height); ctx.lineTo(width, height); ctx.stroke();

            ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 2;
            ctx.beginPath();
            this.typer.kpsHistory.forEach((val, i) => {
                const x = (i / (this.typer.kpsHistory.length - 1)) * width;
                const y = height - (val / maxKps) * height;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();
        }
    }

    remove() {
        if (this.cleanupDrag) this.cleanupDrag();
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}
