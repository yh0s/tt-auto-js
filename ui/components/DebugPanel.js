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
    }

    remove() {
        if (this.cleanupDrag) this.cleanupDrag();
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}
