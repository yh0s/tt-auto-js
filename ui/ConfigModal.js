import { getConfigStyle, getConfigHTML } from './templates/ConfigTemplate.js';

export class ConfigModal {
    constructor(defaultConfig) {
        this.config = { ...defaultConfig };
    }

    async promptUser() {
        return new Promise((resolve, reject) => {
            const styleEl = document.createElement('style');
            styleEl.textContent = getConfigStyle();
            document.head.appendChild(styleEl);

            const overlay = document.createElement('div');
            overlay.className = 'tt-auto-modal-overlay';
            overlay.innerHTML = getConfigHTML(this.config);
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
                // ★追加: forceAutoSkip の保存
                this.config.forceAutoSkip = getEl('tt-force-auto-skip').checked;
                this.config.humanitySim = getEl('tt-humanity-sim').checked;
                this.config.showKeyboard = getEl('tt-show-keyboard').checked;
                this.config.debugMode = getEl('tt-debug-mode').checked;

                cleanup();
                resolve(this.config);
            };

            getEl('tt-cancel-btn').onclick = () => { cleanup(); reject(new Error("User cancelled")); };

            function cleanup() { overlay.remove(); styleEl.remove(); }
        });
    }
}
