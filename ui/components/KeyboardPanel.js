import { QWERTY_KEYS } from '../../config/constants.js';
import { setupDraggable } from '../../utils/domUtils.js';

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

        this.container.style.cssText = `
            position: fixed; left: ${initLeft}px; top: ${initTop}px; 
            background: rgba(30, 20, 40, 0.9); padding: 10px; border-radius: 8px; z-index: 99997;
            font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: 1px solid #00bcd4;
            user-select: none; display: flex; flex-direction: column;
        `;

        let gridHtml = QWERTY_KEYS.map(row =>
            `<div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 4px;">` +
            row.map(k => {
                const safeK = k.replace(/"/g, '&quot;');
                return `<div class="tt-vk-key" data-key="${safeK}" style="width: 28px; height: 28px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 12px; transition: background 0.1s, transform 0.05s;">${k.toUpperCase()}</div>`;
            }).join('') + `</div>`
        ).join('');

        gridHtml += `<div style="display: flex; justify-content: center; gap: 4px; margin-top: 4px;">
            <div class="tt-vk-key" data-key="space" style="width: 200px; height: 28px; border: 1px solid #444; border-radius: 4px; background: #333; color: #fff; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 12px; transition: background 0.1s, transform 0.05s;">SPACE</div>
        </div>`;

        this.container.innerHTML = `
            <div id="tt-vk-drag-handle" style="font-size: 12px; color: #00bcd4; text-align: center; margin-bottom: 8px; cursor: move; border-bottom: 1px dashed #00bcd4; padding-bottom: 4px; font-weight: bold;">
                ⌨️ Virtual Keyboard (Drag)
            </div>
            <div>${gridHtml}</div>
        `;

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
