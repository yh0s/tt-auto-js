import { QWERTY_KEYS } from '../../config/constants.js';

export class WeakKeysModal {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.overlay = null;
    }

    open() {
        if (this.overlay) return;

        // ★UI側から強制Pauseイベントを発火
        this.eventBus.emit('ui:action_forcePause', true);

        this.overlay = document.createElement('div');
        this.overlay.id = 'tt-wk-modal';
        this.overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.7); z-index: 100000;
            display: flex; justify-content: center; align-items: center; font-family: sans-serif;
        `;

        let gridHtml = QWERTY_KEYS.map(row =>
            `<div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 4px;">` +
            row.map(k => {
                const bg = this.config.weakKeysList.includes(k) ? '#d63384' : '#444';
                return `<button class="tt-wk-key-btn" data-key="${k}" style="width: 28px; height: 28px; border: 1px solid #222; border-radius: 4px; background: ${bg}; color: white; cursor: pointer; font-weight: bold; font-size: 12px; padding: 0;">${k.toUpperCase()}</button>`;
            }).join('') + `</div>`
        ).join('');

        this.overlay.innerHTML = `
            <div style="background: #222; padding: 20px; border-radius: 8px; border: 1px solid #d63384; color: white; width: 440px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; color: #d63384;">Select Weak Keys</h3>
                <div style="margin-bottom: 20px;">${gridHtml}</div>
                <div style="text-align: right;">
                    <button id="tt-wk-cancel" style="padding: 6px 12px; border: none; border-radius: 4px; background: #666; color: white; cursor: pointer; margin-right: 8px; font-weight: bold;">Cancel</button>
                    <button id="tt-wk-save" style="padding: 6px 12px; border: none; border-radius: 4px; background: #d63384; color: white; cursor: pointer; font-weight: bold;">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        let currentSelection = [...this.config.weakKeysList];
        this.overlay.querySelectorAll('.tt-wk-key-btn').forEach(b => {
            b.onclick = () => {
                const k = b.getAttribute('data-key');
                if (currentSelection.includes(k)) {
                    currentSelection = currentSelection.filter(x => x !== k);
                    b.style.background = '#444';
                } else {
                    currentSelection.push(k);
                    b.style.background = '#d63384';
                }
            };
        });

        this.overlay.querySelector('#tt-wk-cancel').onclick = () => this.close();

        this.overlay.querySelector('#tt-wk-save').onclick = () => {
            // ★保存完了イベントを送信
            this.eventBus.emit('ui:weakKeysSave', currentSelection);
            this.close();
        };
    }

    close() {
        this.remove();
        this.eventBus.emit('ui:action_forcePause', false);
    }

    remove() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
}
