import { setupDraggable } from '../../utils/domUtils.js';
import { getDebugKeyboardStyle, getDebugKeyboardHTML } from '../templates/DebugKeyboardTemplate.js';

export class DebugKeyboardPanel {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.container = null;
        this.cleanupDrag = null;
        this.isShift = false;
        this.wasShowKeyboardEnabled = false;
    }

    create() {
        if (this.container) return;

        // 1. 既存のキーボードが表示されているかを記憶し、非表示にする
        this.wasShowKeyboardEnabled = this.config.showKeyboard;
        if (this.wasShowKeyboardEnabled) {
            this.eventBus.emit('ui:toggleKeyboard', false);
        }

        // ★修正: 開かれると「自動入力機能のみ」を停止する（ゲームはPauseしない）
        this.eventBus.emit('debug:suspendAutoTyping', true);

        this.container = document.createElement('div');
        this.container.style.cssText = getDebugKeyboardStyle();

        const initLeft = Math.max(0, (window.innerWidth - 480) / 2);
        const initTop = Math.max(0, (window.innerHeight - 300) / 2);
        this.container.style.left = `${initLeft}px`;
        this.container.style.top = `${initTop}px`;

        document.body.appendChild(this.container);
        this.updateKeys();
    }

    updateKeys() {
        if (this.cleanupDrag) this.cleanupDrag();

        this.container.innerHTML = getDebugKeyboardHTML(this.isShift);
        this.cleanupDrag = setupDraggable(this.container, this.container.querySelector('#tt-debug-vk-drag'));
        this.bindEvents();
    }

    bindEvents() {
        this.container.querySelectorAll('.tt-debug-vk-key').forEach(el => {
            el.onmousedown = (e) => {
                e.preventDefault();
                let key = el.getAttribute('data-key');
                if (key === 'space') key = ' ';

                this.eventBus.emit('debug:simulateKeydown', key);

                el.style.background = '#FF4500';
                el.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    if (el) {
                        el.style.background = '#222';
                        el.style.transform = 'scale(1.0)';
                    }
                }, 100);
            };
        });

        const shiftBtn = this.container.querySelector('#tt-debug-vk-shift');
        if (shiftBtn) {
            shiftBtn.onclick = () => {
                this.isShift = !this.isShift;
                this.updateKeys();
            };
        }

        const closeBtn = this.container.querySelector('#tt-debug-vk-close');
        if (closeBtn) {
            closeBtn.onclick = () => this.close();
        }
    }

    close() {
        this.remove();

        // 閉じられた時、元々キーボードが開かれていたなら復元する
        if (this.wasShowKeyboardEnabled) {
            this.eventBus.emit('ui:toggleKeyboard', true);
        }

        // ★修正: 閉じたら「自動入力」を再開する
        this.eventBus.emit('debug:suspendAutoTyping', false);
    }

    remove() {
        if (this.cleanupDrag) this.cleanupDrag();
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}
