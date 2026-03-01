import { getWeakKeysOverlayStyle, getWeakKeysHTML } from '../templates/WeakKeysTemplate.js';

export class WeakKeysModal {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.overlay = null;
    }

    open() {
        if (this.overlay) return;

        this.eventBus.emit('ui:action_forcePause', true);

        this.overlay = document.createElement('div');
        this.overlay.id = 'tt-wk-modal';
        this.overlay.style.cssText = getWeakKeysOverlayStyle();

        let currentSelection = [...this.config.weakKeysList];

        this.overlay.innerHTML = getWeakKeysHTML(currentSelection);
        document.body.appendChild(this.overlay);

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
