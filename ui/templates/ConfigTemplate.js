export const getConfigStyle = () => `
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

export const getConfigHTML = (config) => `
    <div class="tt-auto-modal">
        <h2>AutoTyper Settings</h2>
        <div class="tt-auto-form-group"><label>Min Delay (ms)</label><input type="number" id="tt-min-delay" value="${config.minDelay}"></div>
        <div class="tt-auto-form-group" style="margin-bottom: 5px;"><label>Max Delay (ms)</label><input type="number" id="tt-max-delay" value="${config.maxDelay}"></div>
        <div style="font-size: 12px; margin-bottom: 10px; color: #666; text-align: right;">Est. KPS: <span id="tt-est-kps">0.00 - 0.00</span> (Avg: <span id="tt-avg-kps">0.00</span>)</div>
        <div class="tt-auto-form-group"><label>Miss Rate (%)</label><input type="number" id="tt-miss-rate" value="${config.missRate}" min="0" max="100"></div>
        <div class="tt-auto-form-group checkbox-group"><label><input type="checkbox" id="tt-auto-skip" ${config.autoSkip ? 'checked' : ''}>Auto Skip (ON / OFF)</label></div>
        <div class="tt-auto-form-group checkbox-group"><label style="color: #FF4500;"><input type="checkbox" id="tt-force-auto-skip" ${config.forceAutoSkip ? 'checked' : ''}>Force Auto Skip</label></div>

        <div class="tt-auto-form-group checkbox-group" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
            <label style="color: #d63384; font-weight: bold;"><input type="checkbox" id="tt-humanity-sim" ${config.humanitySim ? 'checked' : ''}>Humanity Simulation</label>
        </div>
        <div class="tt-auto-form-group checkbox-group">
            <label style="color: #00bcd4; font-weight: bold;"><input type="checkbox" id="tt-show-keyboard" ${config.showKeyboard ? 'checked' : ''}>Show Virtual Keyboard</label>
        </div>
        <div class="tt-auto-form-group checkbox-group" style="border-top: 1px solid #eee; padding-top: 10px;">
            <label style="color: #ff9800; font-weight: bold;"><input type="checkbox" id="tt-debug-mode" ${config.debugMode ? 'checked' : ''}>Debug Mode (dev)</label>
        </div>
        <div class="tt-auto-actions">
            <button class="tt-auto-btn cancel" id="tt-cancel-btn">Cancel</button>
            <button class="tt-auto-btn" id="tt-start-btn">Start</button>
        </div>
    </div>
`;
