export const getHumanityStyle = () => `
    position: fixed; top: 20px; left: 20px; width: 260px; height: 420px; min-width: 230px; min-height: 250px;
    background: rgba(30, 20, 40, 0.9); color: #f8cce5; padding: 10px; border-radius: 8px; z-index: 99998;
    font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5); backdrop-filter: blur(4px); border: 1px solid #d63384;
    display: flex; flex-direction: column; resize: both; overflow: hidden;
`;

export const getHumanityHTML = (config) => `
    <div id="tt-humanity-drag" style="font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #d63384; cursor: move; border-bottom: 1px solid #d63384; padding-bottom: 4px; flex-shrink: 0;">🧬 Humanity Simulation (Drag)</div>
    <div style="font-size: 11px; margin-bottom: 10px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-shrink: 0;">
        <label style="cursor: pointer; display: flex; align-items: center; margin-bottom: 4px;"><input type="checkbox" id="tt-hum-toggle-conc" ${config.humanityFeatures.concentration ? 'checked' : ''} style="margin-right: 6px;"> Concentration (集中力)</label>
        <label style="cursor: pointer; display: flex; align-items: center; margin-bottom: 4px;"><input type="checkbox" id="tt-hum-toggle-weak" ${config.humanityFeatures.weakKeys ? 'checked' : ''} style="margin-right: 6px;"> Weak Keys (不得意キー)</label>
        <label style="cursor: pointer; display: flex; align-items: center;"><input type="checkbox" id="tt-hum-toggle-panic" ${config.humanityFeatures.transPanic ? 'checked' : ''} style="margin-right: 6px;"> Trans. Panic (強制遷移対応)</label>
    </div>
    <div id="tt-hum-info-area" style="font-size: 11px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-grow: 1; display: flex; flex-direction: column; min-height: 0;">
        <div id="tt-hum-overall-status" style="margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #666; flex-shrink: 0;">
            <div style="display: flex; justify-content: space-between; color: #00FF00; font-weight: bold;"><span>Eff. KPS:</span> <span id="tt-hum-eff-kps">0.00 - 0.00</span></div>
            <div style="display: flex; justify-content: space-between; color: #ddd;"><span>Eff. Delay:</span> <span id="tt-hum-eff-delay">0 - 0 ms</span></div>
            <div style="display: flex; justify-content: space-between; color: #FF4500;"><span>Eff. Miss:</span> <span id="tt-hum-eff-miss">0.0%</span></div>
        </div>
        <div id="tt-hum-info-conc" style="display: ${config.humanityFeatures.concentration ? 'flex' : 'none'}; flex-direction: column; flex-grow: 1; min-height: 0;">
            <div style="display: flex; justify-content: space-between; flex-shrink: 0;"><span>Focus Level:</span> <span id="tt-hum-val-conc" style="font-weight: bold; color: #fff;">100%</span></div>
            <div style="width: 100%; background: #444; height: 6px; border-radius: 3px; margin: 3px 0 6px 0; overflow: hidden; flex-shrink: 0;"><div id="tt-hum-bar-conc" style="width: 100%; height: 100%; background: #00FF00; transition: width 0.5s, background-color 0.5s;"></div></div>
            <canvas id="tt-hum-conc-graph" style="background: #000; border: 1px solid #444; border-radius: 4px; margin-bottom: 6px; flex-grow: 1; min-height: 0; width: 100%; box-sizing: border-box;"></canvas>
            <div style="display: flex; justify-content: space-between; color: #ccc; flex-shrink: 0;"><span>Delay Fix:</span> <span id="tt-hum-val-delay">x1.00</span></div>
            <div style="display: flex; justify-content: space-between; color: #ccc; flex-shrink: 0;"><span>Miss Fix:</span> <span id="tt-hum-val-miss">x1.00</span></div>
        </div>
        <div id="tt-hum-info-weak" style="display: ${config.humanityFeatures.weakKeys ? 'flex' : 'none'}; flex-direction: column; margin-top: 8px; border-top: 1px dashed #666; padding-top: 6px; flex-shrink: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span>Weak: <span id="tt-hum-wk-list" style="color: #FFD700; word-break: break-all;">${config.weakKeysList.join(',').toUpperCase() || 'None'}</span></span>
                <button id="tt-hum-btn-wk-edit" disabled style="padding: 2px 6px; font-size: 10px; background: #555; color: #888; border: none; border-radius: 3px; cursor: not-allowed;">Edit</button>
            </div>
            <div style="display: flex; gap: 4px; align-items: center;">Base:x<input type="number" id="tt-hum-wk-base" value="${config.weakKeysBase}" step="0.1" min="1.0" style="width: 35px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"> Var:±<input type="number" id="tt-hum-wk-var" value="${config.weakKeysVar}" step="0.1" min="0" style="width: 35px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"></div>
        </div>
        <div id="tt-hum-info-panic" style="display: ${config.humanityFeatures.transPanic ? 'flex' : 'none'}; flex-direction: column; margin-top: 8px; border-top: 1px dashed #666; padding-top: 6px; flex-shrink: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;"><span style="color: #FF6347;">⚠️ Transition Panic</span><span id="tt-hum-panic-status" style="font-size: 10px; font-weight: bold; color: #666;">Ready</span></div>
            <div style="display: flex; gap: 4px; align-items: center; margin-bottom: 4px;">
                Wait: <input type="number" id="tt-hum-panic-base" value="${config.panicDelayBase}" step="50" min="0" style="width: 40px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"> ms
                ±<input type="number" id="tt-hum-panic-var" value="${config.panicDelayVar}" step="50" min="0" style="width: 40px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"> ms
            </div>
            <div style="display: flex; gap: 4px; align-items: center;">
                Overrun: <input type="number" id="tt-hum-panic-or-prob" value="${config.panicOverrunProb}" step="10" min="0" max="100" style="width: 35px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"> %
                ( <input type="number" id="tt-hum-panic-or-min" value="${config.panicOverrunMin}" step="1" min="0" style="width: 25px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"> -
                <input type="number" id="tt-hum-panic-or-max" value="${config.panicOverrunMax}" step="1" min="0" style="width: 25px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"> ch )
            </div>
        </div>
        <div id="tt-hum-info-none" style="display: ${(config.humanityFeatures.concentration || config.humanityFeatures.weakKeys || config.humanityFeatures.transPanic) ? 'none' : 'block'}; color: #666; text-align: center; margin-top: 10px; flex-shrink: 0;">No features enabled.</div>
    </div>
`;
