// 設定モーダル
export class ConfigModal {
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
                        <div class="tt-auto-form-group checkbox-group">
                            <label style="color: #00bcd4; font-weight: bold;"><input type="checkbox" id="tt-show-keyboard" ${this.config.showKeyboard ? 'checked' : ''}>Show Virtual Keyboard</label>
                        </div>
                        <div class="tt-auto-form-group checkbox-group" style="border-top: 1px solid #eee; padding-top: 10px;">
                            <label style="color: #ff9800; font-weight: bold;"><input type="checkbox" id="tt-debug-mode" ${this.config.debugMode ? 'checked' : ''}>Debug Mode (dev)</label>
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
                this.config.showKeyboard = getEl('tt-show-keyboard').checked;
                this.config.debugMode = getEl('tt-debug-mode').checked; // ★追加

                cleanup();
                resolve(this.config);
            };

            getEl('tt-cancel-btn').onclick = () => { cleanup(); reject(new Error("User cancelled")); };

            function cleanup() { overlay.remove(); styleEl.remove(); }
        });
    }
}
