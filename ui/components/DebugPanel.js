import { setupDraggable } from '../../utils/domUtils.js';
import { getDebugStyle, getDebugHTML } from '../templates/DebugTemplate.js';

export class DebugPanel {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.container = null;
        this.cleanupDrag = null;
    }

    create() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.style.cssText = getDebugStyle();
        this.container.innerHTML = getDebugHTML();
        document.body.appendChild(this.container);

        this.cleanupDrag = setupDraggable(this.container, this.container.querySelector('#tt-debug-drag'));

        const exposeBtn = this.container.querySelector('#tt-debug-btn-expose');
        if (exposeBtn) {
            if (window.ttDebug) {
                this.setButtonExposed(exposeBtn);
            } else {
                exposeBtn.addEventListener('click', () => {
                    if (exposeBtn.disabled) return;
                    this.eventBus.emit('debug:exposeVariables');
                    this.setButtonExposed(exposeBtn);
                });
            }
        }

        // ★追加: デバッグキーボード起動イベント
        const kbBtn = this.container.querySelector('#tt-debug-btn-keyboard');
        if (kbBtn) {
            kbBtn.addEventListener('click', () => {
                this.eventBus.emit('debug:openKeyboard');
            });
        }
    }

    // ★追加: ボタンを「使用済み」の見た目に変更するヘルパー
    setButtonExposed(btn) {
        btn.disabled = true;
        btn.textContent = 'Exposed! (Check F12 Console)';
        btn.style.background = '#444';
        btn.style.color = '#888';
        btn.style.cursor = 'default';
        btn.style.border = '1px solid #555';
    }

    remove() {
        if (this.cleanupDrag) this.cleanupDrag();
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}
