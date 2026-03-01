import { QWERTY_KEYS } from '../../config/constants.js';

export const getKeyboardStyle = (initLeft, initTop) => `
    position: fixed; left: ${initLeft}px; top: ${initTop}px; 
    background: rgba(30, 20, 40, 0.9); padding: 10px; border-radius: 8px; z-index: 99997;
    font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: 1px solid #00bcd4;
    user-select: none; display: flex; flex-direction: column;
`;

export const getKeyboardHTML = (weakKeysList = []) => {
    let gridHtml = QWERTY_KEYS.map(row =>
        `<div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 4px;">` +
        row.map(k => {
            const safeK = k.replace(/"/g, '&quot;');

            // ★追加: 不得意キーかどうかの判定とスタイルの分岐
            const isWeak = weakKeysList.includes(k);
            const borderCol = isWeak ? '#d63384' : '#444';
            const bgCol = isWeak ? '#4a2a38' : '#333';
            const textCol = isWeak ? '#ffb3d9' : '#fff';

            return `<div class="tt-vk-key" data-key="${safeK}" style="width: 28px; height: 28px; border: 1px solid ${borderCol}; border-radius: 4px; background: ${bgCol}; color: ${textCol}; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 12px; transition: background 0.1s, transform 0.05s;">${k.toUpperCase()}</div>`;
        }).join('') + `</div>`
    ).join('');

    gridHtml += `<div style="display: flex; justify-content: center; gap: 4px; margin-top: 4px;">
        <div class="tt-vk-key" data-key="space" style="width: 200px; height: 28px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 12px; transition: background 0.1s, transform 0.05s;">SPACE</div>
    </div>`;

    return `
        <div id="tt-vk-drag-handle" style="font-size: 12px; color: #00bcd4; text-align: center; margin-bottom: 8px; cursor: move; border-bottom: 1px dashed #00bcd4; padding-bottom: 4px; font-weight: bold;">
            ⌨️ Virtual Keyboard (Drag)
        </div>
        <div>${gridHtml}</div>
    `;
};
