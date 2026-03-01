import { setupDraggable } from '../../utils/domUtils.js';

export class HumanityPanel {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.container = null;
        this.cleanupDrag = null;

        // WeakKeysの変更を購読して表示を更新
        this.eventBus.on('ui:weakKeysUpdated', (keys) => {
            if (this.container) {
                const listEl = this.container.querySelector('#tt-hum-wk-list');
                if (listEl) listEl.textContent = keys.join(',').toUpperCase() || 'None';
            }
        });
    }

    create() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed; top: 20px; left: 20px; width: 260px; height: 420px; min-width: 230px; min-height: 250px;
            background: rgba(30, 20, 40, 0.9); color: #f8cce5; padding: 10px; border-radius: 8px; z-index: 99998;
            font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5); backdrop-filter: blur(4px); border: 1px solid #d63384;
            display: flex; flex-direction: column; resize: both; overflow: hidden;
        `;
        this.container.innerHTML = `
            <div id="tt-humanity-drag" style="font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #d63384; cursor: move; border-bottom: 1px solid #d63384; padding-bottom: 4px; flex-shrink: 0;">🧬 Humanity Simulation (Drag)</div>
            <div style="font-size: 11px; margin-bottom: 10px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-shrink: 0;">
                <label style="cursor: pointer; display: flex; align-items: center; margin-bottom: 4px;"><input type="checkbox" id="tt-hum-toggle-conc" ${this.config.humanityFeatures.concentration ? 'checked' : ''} style="margin-right: 6px;"> Concentration (集中力)</label>
                <label style="cursor: pointer; display: flex; align-items: center; margin-bottom: 4px;"><input type="checkbox" id="tt-hum-toggle-weak" ${this.config.humanityFeatures.weakKeys ? 'checked' : ''} style="margin-right: 6px;"> Weak Keys (不得意キー)</label>
                <label style="cursor: pointer; display: flex; align-items: center;"><input type="checkbox" id="tt-hum-toggle-panic" ${this.config.humanityFeatures.transPanic ? 'checked' : ''} style="margin-right: 6px;"> Trans. Panic (強制遷移対応)</label>
            </div>
            <div id="tt-hum-info-area" style="font-size: 11px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-grow: 1; display: flex; flex-direction: column; min-height: 0;">
                <div id="tt-hum-overall-status" style="margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #666; flex-shrink: 0;">
                    <div style="display: flex; justify-content: space-between; color: #00FF00; font-weight: bold;"><span>Eff. KPS:</span> <span id="tt-hum-eff-kps">0.00 - 0.00</span></div>
                    <div style="display: flex; justify-content: space-between; color: #ddd;"><span>Eff. Delay:</span> <span id="tt-hum-eff-delay">0 - 0 ms</span></div>
                    <div style="display: flex; justify-content: space-between; color: #FF4500;"><span>Eff. Miss:</span> <span id="tt-hum-eff-miss">0.0%</span></div>
                </div>
                <div id="tt-hum-info-conc" style="display: ${this.config.humanityFeatures.concentration ? 'flex' : 'none'}; flex-direction: column; flex-grow: 1; min-height: 0;">
                    <div style="display: flex; justify-content: space-between; flex-shrink: 0;"><span>Focus Level:</span> <span id="tt-hum-val-conc" style="font-weight: bold; color: #fff;">100%</span></div>
                    <div style="width: 100%; background: #444; height: 6px; border-radius: 3px; margin: 3px 0 6px 0; overflow: hidden; flex-shrink: 0;"><div id="tt-hum-bar-conc" style="height: 100%; background: #00FF00;"></div></div>
                    <canvas id="tt-hum-conc-graph" style="background: #000; border: 1px solid #444; border-radius: 4px; margin-bottom: 6px; flex-grow: 1; min-height: 0; width: 100%; box-sizing: border-box;"></canvas>
                    <div style="display: flex; justify-content: space-between; color: #ccc; flex-shrink: 0;"><span>Delay Fix:</span> <span id="tt-hum-val-delay">x1.00</span></div>
                    <div style="display: flex; justify-content: space-between; color: #ccc; flex-shrink: 0;"><span>Miss Fix:</span> <span id="tt-hum-val-miss">x1.00</span></div>
                </div>
                <div id="tt-hum-info-weak" style="display: ${this.config.humanityFeatures.weakKeys ? 'flex' : 'none'}; flex-direction: column; margin-top: 8px; border-top: 1px dashed #666; padding-top: 6px; flex-shrink: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;"><span>Weak: <span id="tt-hum-wk-list" style="color: #FFD700; word-break: break-all;">${this.config.weakKeysList.join(',').toUpperCase() || 'None'}</span></span><button id="tt-hum-btn-wk-edit" style="padding: 2px 6px; font-size: 10px; background: #d63384; color: white; border: none; border-radius: 3px; cursor: pointer;">Edit</button></div>
                    <div style="display: flex; gap: 4px; align-items: center;">Base:x<input type="number" id="tt-hum-wk-base" value="${this.config.weakKeysBase}" step="0.1" min="1.0" style="width: 40px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"> Var:±<input type="number" id="tt-hum-wk-var" value="${this.config.weakKeysVar}" step="0.1" min="0" style="width: 40px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"></div>
                </div>
                <div id="tt-hum-info-panic" style="display: ${this.config.humanityFeatures.transPanic ? 'flex' : 'none'}; flex-direction: column; margin-top: 8px; border-top: 1px dashed #666; padding-top: 6px; flex-shrink: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;"><span style="color: #FF6347;">⚠️ Transition Panic</span><span id="tt-hum-panic-status" style="font-size: 10px; font-weight: bold; color: #666;">Ready</span></div>
                    <div style="display: flex; gap: 4px; align-items: center;">Delay: <input type="number" id="tt-hum-panic-base" value="${this.config.panicDelayBase}" step="50" min="0" style="width: 45px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"> ms ±<input type="number" id="tt-hum-panic-var" value="${this.config.panicDelayVar}" step="50" min="0" style="width: 45px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"> ms</div>
                </div>
                <div id="tt-hum-info-none" style="display: ${(this.config.humanityFeatures.concentration || this.config.humanityFeatures.weakKeys || this.config.humanityFeatures.transPanic) ? 'none' : 'block'}; color: #666; text-align: center; margin-top: 10px; flex-shrink: 0;">No features enabled.</div>
            </div>
        `;
        document.body.appendChild(this.container);
        this.cleanupDrag = setupDraggable(this.container, this.container.querySelector('#tt-humanity-drag'));
        this.bindEvents();
    }

    bindEvents() {
        const getEl = id => this.container.querySelector(`#${id}`);
        const updateInfoDisplay = () => {
            const anyE = this.config.humanityFeatures.concentration || this.config.humanityFeatures.weakKeys || this.config.humanityFeatures.transPanic;
            getEl('tt-hum-info-none').style.display = anyE ? 'none' : 'block';
            getEl('tt-hum-info-conc').style.display = this.config.humanityFeatures.concentration ? 'flex' : 'none';
            getEl('tt-hum-info-weak').style.display = this.config.humanityFeatures.weakKeys ? 'flex' : 'none';
            getEl('tt-hum-info-panic').style.display = this.config.humanityFeatures.transPanic ? 'flex' : 'none';
        };

        getEl('tt-hum-toggle-conc').addEventListener('change', e => { this.config.humanityFeatures.concentration = e.target.checked; updateInfoDisplay(); });
        getEl('tt-hum-toggle-weak').addEventListener('change', e => { this.config.humanityFeatures.weakKeys = e.target.checked; updateInfoDisplay(); });
        getEl('tt-hum-toggle-panic').addEventListener('change', e => { this.config.humanityFeatures.transPanic = e.target.checked; updateInfoDisplay(); });

        getEl('tt-hum-btn-wk-edit').addEventListener('click', () => this.eventBus.emit('ui:openWeakKeys'));

        getEl('tt-hum-wk-base').addEventListener('change', e => { let v = parseFloat(e.target.value); this.config.weakKeysBase = isNaN(v) ? 1.0 : Math.max(1.0, v); });
        getEl('tt-hum-wk-var').addEventListener('change', e => { let v = parseFloat(e.target.value); this.config.weakKeysVar = isNaN(v) ? 0 : Math.max(0, v); });
        getEl('tt-hum-panic-base').addEventListener('change', e => { let v = parseInt(e.target.value, 10); this.config.panicDelayBase = isNaN(v) ? 0 : Math.max(0, v); });
        getEl('tt-hum-panic-var').addEventListener('change', e => { let v = parseInt(e.target.value, 10); this.config.panicDelayVar = isNaN(v) ? 0 : Math.max(0, v); });
    }

    updateStatus(state) {
        if (!this.container) return;

        if (this.config.humanityFeatures.transPanic) {
            const pEl = this.container.querySelector('#tt-hum-panic-status');
            if (pEl) {
                pEl.textContent = state.isTransitionPanic ? "PANICKING!" : "Ready";
                pEl.style.color = state.isTransitionPanic ? "#FF4500" : "#666";
            }
        }

        if (this.config.humanityFeatures.concentration) {
            const getEl = id => this.container.querySelector(`#${id}`);
            const concValEl = getEl('tt-hum-val-conc'), concBarEl = getEl('tt-hum-bar-conc');
            if (concValEl) concValEl.textContent = `${Math.round(state.conc)}%`;
            if (getEl('tt-hum-val-delay')) getEl('tt-hum-val-delay').textContent = `x${state.delayMult.toFixed(2)}`;
            if (getEl('tt-hum-val-miss')) getEl('tt-hum-val-miss').textContent = `x${state.missMult.toFixed(2)}`;

            let cCol = state.conc <= 30 ? '#FF4500' : (state.conc <= 60 ? '#FFD700' : '#00FF00');
            if (concBarEl) { concBarEl.style.width = `${state.conc}%`; concBarEl.style.backgroundColor = cCol; }

            const cvs = getEl('tt-hum-conc-graph');
            if (cvs && state.concHistory.length > 0) {
                const ctx = cvs.getContext('2d'); cvs.width = cvs.clientWidth; cvs.height = cvs.clientHeight;
                const cw = cvs.width, ch = cvs.height;
                ctx.clearRect(0, 0, cw, ch);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.font = '9px monospace';
                ctx.textBaseline = 'top'; ctx.fillText(`100%`, 2, 2); ctx.textBaseline = 'bottom'; ctx.fillText(`0%`, 2, ch - 1);
                ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, ch); ctx.lineTo(cw, ch); ctx.stroke();
                ctx.strokeStyle = cCol; ctx.lineWidth = 2; ctx.beginPath();
                state.concHistory.forEach((val, i) => {
                    const x = (i / (state.concHistory.length - 1)) * cw, y = ch - (val / 100) * ch;
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                });
                ctx.stroke();
            }
        }

        const effMin = Math.round(this.config.minDelay * state.delayMult), effMax = Math.round(this.config.maxDelay * state.delayMult);
        const getEl = id => this.container.querySelector(`#${id}`);
        if (getEl('tt-hum-eff-delay')) getEl('tt-hum-eff-delay').textContent = `${effMin} - ${effMax} ms`;
        if (getEl('tt-hum-eff-kps')) getEl('tt-hum-eff-kps').textContent = `${effMax > 0 ? (1000 / effMax).toFixed(2) : '---'} - ${effMin > 0 ? (1000 / effMin).toFixed(2) : '---'}`;
        if (getEl('tt-hum-eff-miss')) getEl('tt-hum-eff-miss').textContent = `${(this.config.missRate * state.missMult).toFixed(1)}%`;
    }

    remove() {
        if (this.cleanupDrag) this.cleanupDrag();
        if (this.container) { this.container.remove(); this.container = null; }
    }
}
