import { ExecutionPanel } from './components/ExecutionPanel.js';
import { DebugPanel } from './components/DebugPanel.js';
import { KeyboardPanel } from './components/KeyboardPanel.js';
import { HumanityPanel } from './components/HumanityPanel.js';
import { WeakKeysModal } from './components/WeakKeysModal.js';
import { DebugKeyboardPanel } from './components/DebugKeyboardPanel.js'; // ★追加

export class UIManager {
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;

        this.executionPanel = new ExecutionPanel(config, eventBus);
        this.debugPanel = new DebugPanel(config, eventBus);
        this.keyboardPanel = new KeyboardPanel(config, eventBus);
        this.humanityPanel = new HumanityPanel(config, eventBus);
        this.weakKeysModal = new WeakKeysModal(config, eventBus);
        this.debugKeyboardPanel = new DebugKeyboardPanel(config, eventBus); // ★追加

        // --- AutoTyperからのイベントをパネルにルーティング ---
        this.eventBus.on('typer:pauseChanged', (isPaused) => this.executionPanel.updatePauseUI(isPaused));
        this.eventBus.on('typer:keydown', (data) => this.keyboardPanel.flashKey(data.key, data.isMiss));
        this.eventBus.on('typer:finished', () => this.cleanupUI());

        this.eventBus.on('typer:tick', (state) => {
            if (this.config.humanitySim) this.humanityPanel.updateStatus(state);
            this.executionPanel.updateGraph(state);
        });

        // --- パネルから発火されるUI表示切替イベントのハンドリング ---
        this.eventBus.on('ui:toggleHumanity', (show) => show ? this.humanityPanel.create() : this.humanityPanel.remove());
        this.eventBus.on('ui:toggleKeyboard', (show) => show ? this.keyboardPanel.create() : this.keyboardPanel.remove());
        this.eventBus.on('ui:toggleDebug', (show) => show ? this.debugPanel.create() : this.debugPanel.remove());
        this.eventBus.on('ui:openWeakKeys', () => this.weakKeysModal.open());

        // ★追加: デバッグキーボードのルーティング
        this.eventBus.on('debug:openKeyboard', () => this.debugKeyboardPanel.create());
    }

    initAllUI() {
        this.executionPanel.create();
        if (this.config.humanitySim) this.humanityPanel.create();
        if (this.config.showKeyboard) this.keyboardPanel.create();
        if (this.config.debugMode) this.debugPanel.create();
    }

    cleanupUI() {
        this.executionPanel.remove();
        this.humanityPanel.remove();
        this.keyboardPanel.remove();
        this.debugPanel.remove();
        this.weakKeysModal.remove();
        this.debugKeyboardPanel.remove(); // ★追加
    }
}
