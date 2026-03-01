import { setupDraggable } from '../../utils/domUtils.js';
import { getKeyboardStyle, getKeyboardHTML } from '../templates/KeyboardTemplate.js';

export class KeyboardPanel {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.container = null;
        this.vkKeyElements = new Map();
        this.cleanupDrag = null;
    }

    create() {
        if (this.container) return;

        this.container = document.createElement('div');
        const initLeft = Math.max(0, (window.innerWidth - 450) / 2);
        const initTop = Math.max(0, window.innerHeight - 250);

        this.container.style.cssText = getKeyboardStyle(initLeft, initTop);
        this.container.innerHTML = getKeyboardHTML();
        document.body.appendChild(this.container);

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

            setTimeout(() => {
                if (el) {
                    el.style.background = '#333';
                    el.style.color = '#fff';
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
