import { ExecutionPanel } from './components/ExecutionPanel.js';
import { DebugPanel } from './components/DebugPanel.js';
import { KeyboardPanel } from './components/KeyboardPanel.js';
import { HumanityPanel } from './components/HumanityPanel.js';
import { WeakKeysModal } from './components/WeakKeysModal.js';

export class UIManager {
    constructor(typer) {
        this.typer = typer;
        this.config = typer.config;

        // 各UIコンポーネントのインスタンス化
        this.executionPanel = new ExecutionPanel(this.typer, this);
        this.debugPanel = new DebugPanel(this.config);
        this.keyboardPanel = new KeyboardPanel(this.config);
        this.humanityPanel = new HumanityPanel(this.typer, this);
        this.weakKeysModal = new WeakKeysModal(this.typer, this);

        this.graphInterval = null;
    }

    initAllUI() {
        this.executionPanel.create();
        if (this.config.humanitySim) this.humanityPanel.create();
        if (this.config.showKeyboard) this.keyboardPanel.create();
        if (this.config.debugMode) this.debugPanel.create();

        this.graphInterval = setInterval(() => this.updateGraph(), 200);
    }

    updatePauseUI(isPaused) {
        this.executionPanel.updatePauseUI(isPaused);
    }

    flashVirtualKey(key, isMiss) {
        this.keyboardPanel.flashKey(key, isMiss);
    }

    updateGraph() {
        if (this.typer.isCancelled || this.typer.isPaused || !this.typer.isTypingLine) return;

        // 人間性UIの更新
        if (this.config.humanitySim) {
            this.humanityPanel.updateStatus();
        }

        // メインKPSグラフの更新
        this.executionPanel.updateGraph();
    }

    // --- コンポーネントからのトグル指示を受け受けるメソッド ---

    toggleHumanity(show) {
        if (show) this.humanityPanel.create();
        else this.humanityPanel.remove();
    }

    toggleKeyboard(show) {
        if (show) this.keyboardPanel.create();
        else this.keyboardPanel.remove();
    }

    toggleDebug(show) {
        if (show) this.debugPanel.create();
        else this.debugPanel.remove();
    }

    openWeakKeysModal() {
        this.weakKeysModal.open();
    }

    cleanupUI() {
        if (this.graphInterval) clearInterval(this.graphInterval);
        this.executionPanel.remove();
        this.humanityPanel.remove();
        this.keyboardPanel.remove();
        this.debugPanel.remove();
        this.weakKeysModal.remove();
    }
}
