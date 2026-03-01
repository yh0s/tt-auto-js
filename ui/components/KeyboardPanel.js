import { setupDraggable } from '../../utils/domUtils.js';
import { getKeyboardStyle, getKeyboardHTML } from '../templates/KeyboardTemplate.js';

export class KeyboardPanel {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.container = null;
        this.vkKeyElements = new Map();
        this.cleanupDrag = null;

        // ★追加: 苦手キーが更新されたらキーボードの見た目も再描画する
        this.eventBus.on('ui:weakKeysUpdated', () => {
            if (this.container) this.updateKeys();
        });
    }

    create() {
        if (this.container) return;

        this.container = document.createElement('div');
        const initLeft = Math.max(0, (window.innerWidth - 450) / 2);
        const initTop = Math.max(0, window.innerHeight - 250);

        this.container.style.cssText = getKeyboardStyle(initLeft, initTop);
        document.body.appendChild(this.container);

        this.updateKeys();
    }

    // ★追加: DOMの再描画を行うメソッド
    updateKeys() {
        if (this.cleanupDrag) this.cleanupDrag();

        this.container.innerHTML = getKeyboardHTML(this.config.weakKeysList);

        this.vkKeyElements.clear();
        this.container.querySelectorAll('.tt-vk-key').forEach(el => {
            this.vkKeyElements.set(el.getAttribute('data-key'), el);
        });

        this.cleanupDrag = setupDraggable(this.container, this.container.querySelector('#tt-vk-drag-handle'));
    }

    flashKey(key, isMiss) {
        if (!this.container) return;

        let keyId = key.toLowerCase();
        if (keyId === ' ') keyId = 'space';

        const el = this.vkKeyElements.get(keyId);
        if (el) {
            el.style.background = isMiss ? '#FF4500' : '#00FF00';
            el.style.color = '#000';
            el.style.transform = 'scale(0.9)';

            // ★変更: 戻るべき元の色を計算する
            const isWeak = keyId !== 'space' && this.config.weakKeysList.includes(keyId);
            const origBg = isWeak ? '#4a2a38' : '#333';
            const origColor = isWeak ? '#ffb3d9' : '#fff';

            setTimeout(() => {
                if (el) {
                    el.style.background = origBg;
                    el.style.color = origColor;
                    el.style.transform = 'scale(1.0)';
                }
            }, 100);
        }
    }

    remove() {
        if (this.cleanupDrag) this.cleanupDrag();
        if (this.container) {
            this.container.remove();
            this.container = null;
            this.vkKeyElements.clear();
        }
    }
}
