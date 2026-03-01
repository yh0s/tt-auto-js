import { QWERTY_KEYS, SHIFT_MAP } from '../../config/constants.js';

export const getDebugKeyboardStyle = () => `
    position: fixed; background: rgba(40, 20, 20, 0.95); padding: 15px; border-radius: 8px; z-index: 100000;
    font-family: monospace; box-shadow: 0 4px 15px rgba(0,0,0,0.7); border: 2px solid #FF4500;
    user-select: none; display: flex; flex-direction: column;
`;

export const getDebugKeyboardHTML = (isShift) => {
    const getChar = (k) => {
        if (isShift) {
            if (/[a-z]/.test(k)) return k.toUpperCase();
            return SHIFT_MAP[k] !== undefined ? SHIFT_MAP[k] : k;
        }
        return k;
    };

    let gridHtml = QWERTY_KEYS.map(row =>
        `<div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 4px;">` +
        row.map(k => {
            const char = getChar(k);
            if (char === '') return ''; // Shift+0 など存在しないキーはスキップ
            const safeChar = char.replace(/"/g, '&quot;');
            return `<div class="tt-debug-vk-key" data-key="${safeChar}" style="width: 32px; height: 32px; border: 1px solid #777; border-radius: 4px; background: #222; color: #fff; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 14px; cursor: pointer; transition: background 0.1s, transform 0.05s;">${char}</div>`;
        }).join('') + `</div>`
    ).join('');

    const shiftBg = isShift ? '#FF4500' : '#444';

    gridHtml += `<div style="display: flex; justify-content: center; gap: 4px; margin-top: 4px;">
        <div id="tt-debug-vk-shift" style="width: 60px; height: 32px; border: 1px solid #777; border-radius: 4px; background: ${shiftBg}; color: #fff; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 12px; cursor: pointer; transition: background 0.2s;">SHIFT</div>
        <div class="tt-debug-vk-key" data-key="space" style="width: 200px; height: 32px; border: 1px solid #777; border-radius: 4px; background: #222; color: #fff; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 12px; cursor: pointer;">SPACE</div>
    </div>`;

    return `
        <div id="tt-debug-vk-drag" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px dashed #FF4500; padding-bottom: 5px;">
            <div style="font-size: 14px; color: #FF4500; font-weight: bold; cursor: move; flex-grow: 1;">🛠 Debug Keyboard</div>
            <button id="tt-debug-vk-close" style="background: #FF4500; color: white; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-weight: bold;">X</button>
        </div>
        <div id="tt-debug-vk-keys-container">${gridHtml}</div>
    `;
};
