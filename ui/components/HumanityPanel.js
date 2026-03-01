import { setupDraggable } from '../../utils/domUtils.js';
import { getHumanityStyle, getHumanityHTML } from '../templates/HumanityTemplate.js';

export class HumanityPanel {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.container = null;
        this.cleanupDrag = null;

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
        this.container.style.cssText = getHumanityStyle();
        this.container.innerHTML = getHumanityHTML(this.config);
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
