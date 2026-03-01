import { setupDraggable } from '../../utils/domUtils.js';
import { getExecutionStyle, getExecutionHTML } from '../templates/ExecutionTemplate.js';

export class ExecutionPanel {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.container = null;
        this.canvasCtx = null;
        this.cleanupDrag = null;
    }

    create() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.style.cssText = getExecutionStyle();
        this.container.innerHTML = getExecutionHTML(this.config);
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
        getEl('tt-exec-miss').addEventListener('change', e => { this.config.missRate = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)); });
        getEl('tt-exec-autoskip').addEventListener('change', e => this.config.autoSkip = e.target.checked);

        getEl('tt-exec-humanity').addEventListener('change', e => {
            this.config.humanitySim = e.target.checked;
            this.eventBus.emit('ui:toggleHumanity', e.target.checked);
        });
        getEl('tt-exec-keyboard').addEventListener('change', e => {
            this.config.showKeyboard = e.target.checked;
            this.eventBus.emit('ui:toggleKeyboard', e.target.checked);
        });
        getEl('tt-exec-debug').addEventListener('change', e => {
            this.config.debugMode = e.target.checked;
            this.eventBus.emit('ui:toggleDebug', e.target.checked);
        });

        getEl('tt-exec-pause').onclick = () => this.eventBus.emit('ui:action_pauseToggle');
        getEl('tt-exec-cancel').onclick = () => {
            this.eventBus.emit('ui:action_cancel');
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

    updateGraph(state) {
        if (!this.container) return;

        const kpsText = this.container.querySelector('#tt-kps-val');
        if (kpsText) kpsText.textContent = state.kpsVal.toFixed(2);

        const lifetimeEl = this.container.querySelector('#tt-lifetime-kps');
        const stddevEl = this.container.querySelector('#tt-kps-stddev');
        if (lifetimeEl) lifetimeEl.textContent = state.lifetimeKps.toFixed(2);
        if (stddevEl) stddevEl.textContent = state.stdDev.toFixed(2);

        const canvas = this.container.querySelector('#tt-kps-graph');
        if (this.canvasCtx && canvas && state.kpsHistory.length > 0) {
            canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
            const width = canvas.width, height = canvas.height;
            const ctx = this.canvasCtx;

            ctx.clearRect(0, 0, width, height);
            const maxKps = Math.max(10, Math.ceil(Math.max(...state.kpsHistory)));

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; ctx.font = '10px monospace';
            ctx.textBaseline = 'top'; ctx.fillText(`Max: ${maxKps}`, 4, 4);
            ctx.textBaseline = 'bottom'; ctx.fillText(`0`, 4, height - 2);

            ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, height); ctx.lineTo(width, height); ctx.stroke();

            ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 2;
            ctx.beginPath();
            state.kpsHistory.forEach((val, i) => {
                const x = (i / (state.kpsHistory.length - 1)) * width;
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
