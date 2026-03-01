import { DEFAULT_CONFIG } from './config/constants.js';
import { ConfigModal } from './ui/ConfigModal.js';
import { AutoTyper } from './core/AutoTyper.js';
import { UIManager } from './ui/UIManager.js';
import { EventEmitter } from './utils/EventEmitter.js';

(async function () {
    if (!document.location.href.match(/typing-tube\.net\/play\/typing\/\d+/)) {
        alert("このスクリプトは typing-tube.net の動画ページでのみ動作します。");
        return;
    }
    try {
        const modal = new ConfigModal(DEFAULT_CONFIG);
        const userConfig = await modal.promptUser();

        // イベントバスの生成
        const eventBus = new EventEmitter();

        // ロジックとUIの完全分離（イベントバスのみ共有）
        const typer = new AutoTyper(userConfig, eventBus);
        const uiManager = new UIManager(userConfig, eventBus);

        uiManager.initAllUI();
        await typer.run();
    } catch (e) { }
})();
