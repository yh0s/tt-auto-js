export const getExecutionStyle = () => `
    position: fixed; top: 20px; right: 20px; width: 310px; height: 320px; min-width: 280px; min-height: 290px;
    background: rgba(20, 20, 20, 0.85); color: #fff; padding: 10px; border-radius: 8px; z-index: 99999;
    font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5); backdrop-filter: blur(4px);
    display: flex; flex-direction: column; resize: both; overflow: hidden;
`;

export const getExecutionHTML = (config) => {
    const inputStyle = `width: 45px; padding: 2px; font-size: 11px; background: #333; color: white; border: 1px solid #555; border-radius: 3px;`;
    return `
        <div id="tt-drag-handle" style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #4CAF50; cursor: move; user-select: none; flex-shrink: 0;">● AutoTyper Running (Drag)</div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px; flex-shrink: 0;">
            <div title="直近5打鍵の移動平均KPS" style="font-size: 12px;">Live KPS: <br><span id="tt-kps-val" style="font-size:16px; font-weight:bold; color: #00FF00;">0.00</span></div>
            <div title="全体の平均KPSと標準偏差(ばらつき)" style="font-size: 11px; text-align: right; color: #ccc;">Life KPS: <span id="tt-lifetime-kps" style="font-size:14px; font-weight:bold; color: #fff;">0.00</span><br>StdDev: ±<span id="tt-kps-stddev">0.00</span></div>
        </div>
        <div style="display: flex; gap: 4px; margin-bottom: 4px; flex-shrink: 0; font-size: 11px; align-items: center; flex-wrap: wrap;">
            Step:<input type="number" id="tt-exec-step" value="10" min="1" style="width: 35px; padding: 2px; font-size: 11px; background: #333; color: white; border: 1px solid #555; border-radius: 3px;">
            Delay:<input type="number" id="tt-exec-min" value="${config.minDelay}" step="10" style="${inputStyle}"> - <input type="number" id="tt-exec-max" value="${config.maxDelay}" step="10" style="${inputStyle}">
        </div>
        <div style="display: flex; gap: 4px; margin-bottom: 8px; flex-shrink: 0; font-size: 11px; align-items: center; flex-wrap: wrap;">
            Miss(%):<input type="number" id="tt-exec-miss" value="${config.missRate}" min="0" max="100" step="1" style="${inputStyle}">
            <label style="cursor: pointer; display: flex; align-items: center; margin-left: auto; background: #333; padding: 2px 4px; border-radius: 3px; border: 1px solid #555;"><input type="checkbox" id="tt-exec-autoskip" ${config.autoSkip ? 'checked' : ''} style="margin: 0 4px 0 0;"> Skip</label>
            <label style="cursor: pointer; display: flex; align-items: center; background: #422; padding: 2px 4px; border-radius: 3px; border: 1px solid #744; color: #ff8888;"><input type="checkbox" id="tt-exec-force-autoskip" ${config.forceAutoSkip ? 'checked' : ''} style="margin: 0 4px 0 0;"> Force</label>
        </div>
        <div style="margin-bottom: 8px; flex-shrink: 0; font-size: 11px; border-top: 1px solid #444; padding-top: 6px; display: flex; flex-direction: column; gap: 4px;">
            <label style="cursor: pointer; display: flex; align-items: center; color: #d63384; font-weight: bold;"><input type="checkbox" id="tt-exec-humanity" ${config.humanitySim ? 'checked' : ''} style="margin-right: 6px;"> Humanity Simulation</label>
            <label style="cursor: pointer; display: flex; align-items: center; color: #00bcd4; font-weight: bold;"><input type="checkbox" id="tt-exec-keyboard" ${config.showKeyboard ? 'checked' : ''} style="margin-right: 6px;"> Virtual Keyboard</label>
            <label style="cursor: pointer; display: flex; align-items: center; color: #ff9800; font-weight: bold;"><input type="checkbox" id="tt-exec-debug" ${config.debugMode ? 'checked' : ''} style="margin-right: 6px;"> Debug Mode (dev)</label>
        </div>
        <canvas id="tt-kps-graph" style="background: #000; border: 1px solid #444; border-radius: 4px; margin-bottom: 8px; flex-grow: 1; min-height: 0; width: 100%; box-sizing: border-box;"></canvas>
        <div style="display: flex; gap: 5px; flex-shrink: 0; width: 100%;">
            <button id="tt-exec-suspend" style="flex: 1; padding: 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Auto: ON</button>
            <button id="tt-exec-pause" style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Pause</button>
            <button id="tt-exec-cancel" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">STOP</button>
        </div>
    `;
};
