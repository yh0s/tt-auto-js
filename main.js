import { DEFAULT_CONFIG } from './config/constants.js';
import { ConfigModal } from './ui/ConfigModal.js';
import { AutoTyper } from './core/AutoTyper.js';

(async function () {
    if (!document.location.href.match(/typing-tube\.net\/play\/typing\/\d+/)) {
        alert("このスクリプトは typing-tube.net の動画ページでのみ動作します。");
        return;
    }
    try {
        const modal = new ConfigModal(DEFAULT_CONFIG);
        const userConfig = await modal.promptUser();
        const typer = new AutoTyper(userConfig);
        await typer.run();
    } catch (e) { }
})();
