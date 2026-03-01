export const getDebugStyle = () => `
    position: fixed; top: 350px; right: 20px; width: 260px; height: 250px; min-width: 230px; min-height: 200px;
    background: rgba(40, 30, 20, 0.95); color: #ffb74d; padding: 10px; border-radius: 8px; z-index: 99998;
    font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5); backdrop-filter: blur(4px); border: 1px solid #ff9800;
    display: flex; flex-direction: column; resize: both; overflow: hidden;
`;

export const getDebugHTML = () => `
    <div id="tt-debug-drag" style="font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #ff9800; cursor: move; user-select: none; border-bottom: 1px solid #ff9800; padding-bottom: 4px; flex-shrink: 0;">🐛 Debug Console (Drag)</div>
    <div style="font-size: 11px; margin-bottom: 10px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-shrink: 0;">
        <div style="color: #aaa; margin-bottom: 6px;">[ Actions ]</div>
        <button id="tt-debug-btn-expose" style="padding: 6px 8px; font-size: 11px; background: #ff9800; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; transition: background 0.2s; margin-bottom: 6px;">
            Expose to window.ttDebug
        </button>
        <button id="tt-debug-btn-keyboard" style="padding: 6px 8px; font-size: 11px; background: #FF4500; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; transition: background 0.2s;">
            Open Debug Keyboard
        </button>
    </div>
    <div id="tt-debug-info-area" style="font-size: 11px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-grow: 1; display: flex; flex-direction: column; min-height: 0; overflow-y: auto;">
        <div style="color: #aaa; margin-bottom: 4px; flex-shrink: 0;">[ Information ]</div>
        <div id="tt-debug-info-none" style="color: #666; text-align: center; margin-top: 10px; flex-shrink: 0;">
            Open F12 Console after expose.
        </div>
    </div>
`;
