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

        const eventBus = new EventEmitter();
        const typer = new AutoTyper(userConfig, eventBus);
        const uiManager = new UIManager(userConfig, eventBus);

        // ★追加: デバッグUIからの変数露出リクエストを受信
        eventBus.on('debug:exposeVariables', () => {
            if (!window.ttDebug) {
                window.ttDebug = { typer, uiManager, eventBus, config: userConfig };
                console.log('%c[AutoTyper Debug]  "ttDebug" successfully exposed!', 'color: #ff9800; font-weight: bold; font-size: 14px;');
                console.log(window.ttDebug);
            }
        });

        uiManager.initAllUI();
        await typer.run();
    } catch (e) { }
})();
