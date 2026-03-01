/**
 * UI管理
 */

import { QWERTY_KEYS } from '../config/constants.js';
import { setupDraggable } from '../utils/domUtils.js';

export class UIManager {
    constructor(typer) {
        this.typer = typer;
        this.config = typer.config;

        this.execUiContainer = null;
        this.humanityUiContainer = null;
        this.keyboardUiContainer = null;
        this.debugUiContainer = null;

        this.vkKeyElements = new Map();
        this.canvasCtx = null;
        this.graphInterval = null;
        this.cleanupCallbacks = [];
    }

    initAllUI() {
        this.createExecutionUI();
        if (this.config.humanitySim) this.createHumanityUI();
        if (this.config.showKeyboard) this.createKeyboardUI();
        if (this.config.debugMode) this.createDebugUI();
        this.graphInterval = setInterval(() => this.updateGraph(), 200);
    }

    updatePauseUI(isPaused) {
        if (this.execUiContainer) {
            const pauseBtn = this.execUiContainer.querySelector('#tt-exec-pause');
            if (pauseBtn) {
                pauseBtn.textContent = isPaused ? "Resume" : "Pause";
                pauseBtn.style.background = isPaused ? "#28a745" : "#007bff";
            }
        }
    }

    createExecutionUI() {
        if (this.execUiContainer) return;

        this.execUiContainer = document.createElement('div');
        this.execUiContainer.style.cssText = `
            position: fixed; top: 20px; right: 20px; width: 310px; height: 320px;
            min-width: 280px; min-height: 290px;
            background: rgba(20, 20, 20, 0.85); color: #fff; padding: 10px; border-radius: 8px; z-index: 99999;
            font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5); backdrop-filter: blur(4px);
            display: flex; flex-direction: column; resize: both; overflow: hidden;
        `;

        const inputStyle = `width: 45px; padding: 2px; font-size: 11px; background: #333; color: white; border: 1px solid #555; border-radius: 3px;`;

        this.execUiContainer.innerHTML = `
            <div id="tt-drag-handle" style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #4CAF50; cursor: move; user-select: none; flex-shrink: 0;">● AutoTyper Running (Drag)</div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px; flex-shrink: 0;">
                <div title="直近5打鍵の移動平均KPS" style="font-size: 12px;">Live KPS: <br><span id="tt-kps-val" style="font-size:16px; font-weight:bold; color: #00FF00;">0.00</span></div>
                <div title="全体の平均KPSと標準偏差(ばらつき)" style="font-size: 11px; text-align: right; color: #ccc;">Life KPS: <span id="tt-lifetime-kps" style="font-size:14px; font-weight:bold; color: #fff;">0.00</span><br>StdDev: ±<span id="tt-kps-stddev">0.00</span></div>
            </div>
            <div style="display: flex; gap: 4px; margin-bottom: 4px; flex-shrink: 0; font-size: 11px; align-items: center; flex-wrap: wrap;">
                Step:<input type="number" id="tt-exec-step" value="10" min="1" style="width: 35px; padding: 2px; font-size: 11px; background: #333; color: white; border: 1px solid #555; border-radius: 3px;">
                Delay:<input type="number" id="tt-exec-min" value="${this.config.minDelay}" step="10" style="${inputStyle}"> - <input type="number" id="tt-exec-max" value="${this.config.maxDelay}" step="10" style="${inputStyle}">
            </div>
            <div style="display: flex; gap: 4px; margin-bottom: 8px; flex-shrink: 0; font-size: 11px; align-items: center; flex-wrap: wrap;">
                Miss(%):<input type="number" id="tt-exec-miss" value="${this.config.missRate}" min="0" max="100" step="1" style="${inputStyle}">
                <label style="cursor: pointer; display: flex; align-items: center; margin-left: auto; background: #333; padding: 2px 4px; border-radius: 3px; border: 1px solid #555;"><input type="checkbox" id="tt-exec-autoskip" ${this.config.autoSkip ? 'checked' : ''} style="margin: 0 4px 0 0;"> Skip</label>
            </div>

            <div style="margin-bottom: 8px; flex-shrink: 0; font-size: 11px; border-top: 1px solid #444; padding-top: 6px; display: flex; flex-direction: column; gap: 4px;">
                <label style="cursor: pointer; display: flex; align-items: center; color: #d63384; font-weight: bold;">
                    <input type="checkbox" id="tt-exec-humanity" ${this.config.humanitySim ? 'checked' : ''} style="margin-right: 6px;"> Humanity Simulation
                </label>
                <label style="cursor: pointer; display: flex; align-items: center; color: #00bcd4; font-weight: bold;">
                    <input type="checkbox" id="tt-exec-keyboard" ${this.config.showKeyboard ? 'checked' : ''} style="margin-right: 6px;"> Virtual Keyboard
                </label>
                <label style="cursor: pointer; display: flex; align-items: center; color: #ff9800; font-weight: bold;">
                    <input type="checkbox" id="tt-exec-debug" ${this.config.debugMode ? 'checked' : ''} style="margin-right: 6px;"> Debug Mode (dev)
                </label>
            </div>

            <canvas id="tt-kps-graph" style="background: #000; border: 1px solid #444; border-radius: 4px; margin-bottom: 8px; flex-grow: 1; min-height: 0; width: 100%; box-sizing: border-box;"></canvas>
            <div style="display: flex; gap: 5px; flex-shrink: 0; width: 100%;">
                <button id="tt-exec-pause" style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Pause</button>
                <button id="tt-exec-cancel" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">STOP</button>
            </div>
        `;
        document.body.appendChild(this.execUiContainer);

        this.cleanupCallbacks.push(setupDraggable(this.execUiContainer, this.execUiContainer.querySelector('#tt-drag-handle')));

        const getEl = id => this.execUiContainer.querySelector(`#${id}`);
        getEl('tt-exec-step').addEventListener('change', e => {
            const val = parseInt(e.target.value, 10);
            if (val > 0) { getEl('tt-exec-min').step = val; getEl('tt-exec-max').step = val; }
        });
        getEl('tt-exec-min').addEventListener('change', e => { const val = parseInt(e.target.value, 10); if (val > 0) this.config.minDelay = val; });
        getEl('tt-exec-max').addEventListener('change', e => { const val = parseInt(e.target.value, 10); if (val > 0) this.config.maxDelay = val; });
        getEl('tt-exec-miss').addEventListener('change', e => { let val = parseFloat(e.target.value); this.config.missRate = isNaN(val) ? 0 : Math.max(0, Math.min(100, val)); });
        getEl('tt-exec-autoskip').addEventListener('change', e => this.config.autoSkip = e.target.checked);

        getEl('tt-exec-humanity').addEventListener('change', e => {
            this.config.humanitySim = e.target.checked;
            this.config.humanitySim ? this.createHumanityUI() : this.removeHumanityUI();
        });

        getEl('tt-exec-keyboard').addEventListener('change', e => {
            this.config.showKeyboard = e.target.checked;
            this.config.showKeyboard ? this.createKeyboardUI() : this.removeKeyboardUI();
        });

        getEl('tt-exec-debug').addEventListener('change', e => {
            this.config.debugMode = e.target.checked;
            this.config.debugMode ? this.createDebugUI() : this.removeDebugUI();
        });

        getEl('tt-exec-pause').onclick = async () => {
            await this.typer.setPauseState(!this.typer.isPaused);
        };

        getEl('tt-exec-cancel').onclick = () => {
            this.typer.isCancelled = true;
            getEl('tt-exec-cancel').textContent = "Stopping...";
            getEl('tt-exec-cancel').style.background = "#6c757d";
        };

        this.canvasCtx = getEl('tt-kps-graph').getContext('2d');
    }

    createDebugUI() {
        if (this.debugUiContainer) return;

        this.debugUiContainer = document.createElement('div');
        this.debugUiContainer.style.cssText = `
            position: fixed; top: 350px; right: 20px; width: 260px; height: 250px;
            min-width: 230px; min-height: 200px;
            background: rgba(40, 30, 20, 0.95); color: #ffb74d; padding: 10px; border-radius: 8px; z-index: 99998;
            font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5); backdrop-filter: blur(4px); border: 1px solid #ff9800;
            display: flex; flex-direction: column; resize: both; overflow: hidden;
        `;

        this.debugUiContainer.innerHTML = `
            <div id="tt-debug-drag" style="font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #ff9800; cursor: move; user-select: none; border-bottom: 1px solid #ff9800; padding-bottom: 4px; flex-shrink: 0;">🐛 Debug Console (Drag)</div>
            <div style="font-size: 11px; margin-bottom: 10px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-shrink: 0;">
                <div style="color: #aaa; margin-bottom: 4px;">[ Toggles ]</div>
                <div style="color: #666; font-size: 9px; margin-left: 10px;">(今後追加予定のデバッグ機能が並びます)</div>
            </div>
            <div id="tt-debug-info-area" style="font-size: 11px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-grow: 1; display: flex; flex-direction: column; min-height: 0; overflow-y: auto;">
                <div style="color: #aaa; margin-bottom: 4px; flex-shrink: 0;">[ Information ]</div>
                <div id="tt-debug-info-none" style="color: #666; text-align: center; margin-top: 10px; flex-shrink: 0;">No debug features enabled.</div>
            </div>
        `;
        document.body.appendChild(this.debugUiContainer);

        this.cleanupCallbacks.push(setupDraggable(this.debugUiContainer, this.debugUiContainer.querySelector('#tt-debug-drag')));
    }

    removeDebugUI() {
        if (this.debugUiContainer) {
            this.debugUiContainer.remove();
            this.debugUiContainer = null;
        }
    }

    createKeyboardUI() {
        if (this.keyboardUiContainer) return;

        this.keyboardUiContainer = document.createElement('div');
        const initLeft = Math.max(0, (window.innerWidth - 450) / 2);
        const initTop = Math.max(0, window.innerHeight - 250);

        this.keyboardUiContainer.style.cssText = `
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

        this.keyboardUiContainer.innerHTML = `
            <div id="tt-vk-drag-handle" style="font-size: 12px; color: #00bcd4; text-align: center; margin-bottom: 8px; cursor: move; border-bottom: 1px dashed #00bcd4; padding-bottom: 4px; font-weight: bold;">
                ⌨️ Virtual Keyboard (Drag)
            </div>
            <div>${gridHtml}</div>
        `;

        document.body.appendChild(this.keyboardUiContainer);

        this.vkKeyElements.clear();
        this.keyboardUiContainer.querySelectorAll('.tt-vk-key').forEach(el => {
            this.vkKeyElements.set(el.getAttribute('data-key'), el);
        });

        this.cleanupCallbacks.push(setupDraggable(this.keyboardUiContainer, this.keyboardUiContainer.querySelector('#tt-vk-drag-handle')));
    }

    removeKeyboardUI() {
        if (this.keyboardUiContainer) {
            this.keyboardUiContainer.remove();
            this.keyboardUiContainer = null;
            this.vkKeyElements.clear();
        }
    }

    createHumanityUI() {
        if (this.humanityUiContainer) return;

        this.humanityUiContainer = document.createElement('div');
        this.humanityUiContainer.style.cssText = `
            position: fixed; top: 20px; left: 20px; width: 260px; height: 420px;
            min-width: 230px; min-height: 250px;
            background: rgba(30, 20, 40, 0.9); color: #f8cce5; padding: 10px; border-radius: 8px; z-index: 99998;
            font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.5); backdrop-filter: blur(4px); border: 1px solid #d63384;
            display: flex; flex-direction: column; resize: both; overflow: hidden;
        `;

        this.humanityUiContainer.innerHTML = `
            <div id="tt-humanity-drag" style="font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #d63384; cursor: move; user-select: none; border-bottom: 1px solid #d63384; padding-bottom: 4px; flex-shrink: 0;">🧬 Humanity Simulation (Drag)</div>
            <div style="font-size: 11px; margin-bottom: 10px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-shrink: 0;">
                <div style="color: #aaa; margin-bottom: 4px;">[ Toggles ]</div>
                <label style="cursor: pointer; display: flex; align-items: center; margin-bottom: 4px;"><input type="checkbox" id="tt-hum-toggle-conc" ${this.config.humanityFeatures.concentration ? 'checked' : ''} style="margin-right: 6px;"> Concentration (集中力)</label>
                <label style="cursor: pointer; display: flex; align-items: center; margin-bottom: 4px;"><input type="checkbox" id="tt-hum-toggle-weak" ${this.config.humanityFeatures.weakKeys ? 'checked' : ''} style="margin-right: 6px;"> Weak Keys (不得意キー)</label>
                <label style="cursor: pointer; display: flex; align-items: center;"><input type="checkbox" id="tt-hum-toggle-panic" ${this.config.humanityFeatures.transPanic ? 'checked' : ''} style="margin-right: 6px;"> Trans. Panic (強制遷移対応)</label>
            </div>
            <div id="tt-hum-info-area" style="font-size: 11px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; flex-grow: 1; display: flex; flex-direction: column; min-height: 0;">
                <div style="color: #aaa; margin-bottom: 4px; flex-shrink: 0;">[ Information ]</div>
                <div id="tt-hum-overall-status" style="margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #666; flex-shrink: 0;">
                    <div style="display: flex; justify-content: space-between; color: #00FF00; font-weight: bold;"><span>Eff. KPS:</span> <span id="tt-hum-eff-kps">0.00 - 0.00</span></div>
                    <div style="display: flex; justify-content: space-between; color: #ddd;"><span>Eff. Delay:</span> <span id="tt-hum-eff-delay">0 - 0 ms</span></div>
                    <div style="display: flex; justify-content: space-between; color: #FF4500;"><span>Eff. Miss:</span> <span id="tt-hum-eff-miss">0.0%</span></div>
                </div>
                <div id="tt-hum-info-conc" style="display: ${this.config.humanityFeatures.concentration ? 'flex' : 'none'}; flex-direction: column; flex-grow: 1; min-height: 0;">
                    <div style="display: flex; justify-content: space-between; flex-shrink: 0;"><span>Focus Level:</span> <span id="tt-hum-val-conc" style="font-weight: bold; color: #fff;">100%</span></div>
                    <div style="width: 100%; background: #444; height: 6px; border-radius: 3px; margin: 3px 0 6px 0; overflow: hidden; flex-shrink: 0;"><div id="tt-hum-bar-conc" style="width: 100%; height: 100%; background: #00FF00; transition: width 0.5s, background-color 0.5s;"></div></div>
                    <canvas id="tt-hum-conc-graph" style="background: #000; border: 1px solid #444; border-radius: 4px; margin-bottom: 6px; flex-grow: 1; min-height: 0; width: 100%; box-sizing: border-box;"></canvas>
                    <div style="display: flex; justify-content: space-between; color: #ccc; flex-shrink: 0;"><span>Delay Fix:</span> <span id="tt-hum-val-delay">x1.00</span></div>
                    <div style="display: flex; justify-content: space-between; color: #ccc; flex-shrink: 0;"><span>Miss Fix:</span> <span id="tt-hum-val-miss">x1.00</span></div>
                </div>
                <div id="tt-hum-info-weak" style="display: ${this.config.humanityFeatures.weakKeys ? 'flex' : 'none'}; flex-direction: column; margin-top: 8px; border-top: 1px dashed #666; padding-top: 6px; flex-shrink: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;"><span>Weak: <span id="tt-hum-wk-list" style="color: #FFD700; word-break: break-all;">${this.config.weakKeysList.join(',').toUpperCase() || 'None'}</span></span><button id="tt-hum-btn-wk-edit" style="padding: 2px 6px; font-size: 10px; background: #d63384; color: white; border: none; border-radius: 3px; cursor: pointer;">Edit</button></div>
                    <div style="display: flex; gap: 4px; align-items: center;">Base:x<input type="number" id="tt-hum-wk-base" value="${this.config.weakKeysBase}" step="0.1" min="1.0" style="width: 40px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"> Var:±<input type="number" id="tt-hum-wk-var" value="${this.config.weakKeysVar}" step="0.1" min="0" style="width: 40px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"></div>
                </div>
                <div id="tt-hum-info-panic" style="display: ${this.config.humanityFeatures.transPanic ? 'flex' : 'none'}; flex-direction: column; margin-top: 8px; border-top: 1px dashed #666; padding-top: 6px; flex-shrink: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="color: #FF6347;">⚠️ Transition Panic</span>
                        <span id="tt-hum-panic-status" style="font-size: 10px; font-weight: bold; color: #666;">Ready</span>
                    </div>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        Delay: <input type="number" id="tt-hum-panic-base" value="${this.config.panicDelayBase}" step="50" min="0" style="width: 45px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"> ms
                        ±<input type="number" id="tt-hum-panic-var" value="${this.config.panicDelayVar}" step="50" min="0" style="width: 45px; padding: 1px; font-size: 10px; background: #333; color: #fff; border: 1px solid #555;"> ms
                    </div>
                </div>
                <div id="tt-hum-info-none" style="display: ${(this.config.humanityFeatures.concentration || this.config.humanityFeatures.weakKeys || this.config.humanityFeatures.transPanic) ? 'none' : 'block'}; color: #666; text-align: center; margin-top: 10px; flex-shrink: 0;">No features enabled.</div>
            </div>
        `;
        document.body.appendChild(this.humanityUiContainer);

        this.cleanupCallbacks.push(setupDraggable(this.humanityUiContainer, this.humanityUiContainer.querySelector('#tt-humanity-drag')));

        const getEl = id => this.humanityUiContainer.querySelector(`#${id}`);
        const updateInfoDisplay = () => {
            const anyEnabled = this.config.humanityFeatures.concentration || this.config.humanityFeatures.weakKeys || this.config.humanityFeatures.transPanic;
            getEl('tt-hum-info-none').style.display = anyEnabled ? 'none' : 'block';
            getEl('tt-hum-info-conc').style.display = this.config.humanityFeatures.concentration ? 'flex' : 'none';
            getEl('tt-hum-info-weak').style.display = this.config.humanityFeatures.weakKeys ? 'flex' : 'none';
            getEl('tt-hum-info-panic').style.display = this.config.humanityFeatures.transPanic ? 'flex' : 'none';
        };

        getEl('tt-hum-toggle-conc').addEventListener('change', e => { this.config.humanityFeatures.concentration = e.target.checked; updateInfoDisplay(); });
        getEl('tt-hum-toggle-weak').addEventListener('change', e => { this.config.humanityFeatures.weakKeys = e.target.checked; updateInfoDisplay(); });
        getEl('tt-hum-toggle-panic').addEventListener('change', e => { this.config.humanityFeatures.transPanic = e.target.checked; updateInfoDisplay(); });

        getEl('tt-hum-btn-wk-edit').addEventListener('click', () => this.openWeakKeysModal());
        getEl('tt-hum-wk-base').addEventListener('change', e => { let v = parseFloat(e.target.value); this.config.weakKeysBase = isNaN(v) ? 1.0 : Math.max(1.0, v); });
        getEl('tt-hum-wk-var').addEventListener('change', e => { let v = parseFloat(e.target.value); this.config.weakKeysVar = isNaN(v) ? 0 : Math.max(0, v); });

        getEl('tt-hum-panic-base').addEventListener('change', e => { let v = parseInt(e.target.value, 10); this.config.panicDelayBase = isNaN(v) ? 0 : Math.max(0, v); });
        getEl('tt-hum-panic-var').addEventListener('change', e => { let v = parseInt(e.target.value, 10); this.config.panicDelayVar = isNaN(v) ? 0 : Math.max(0, v); });
    }

    async openWeakKeysModal() {
        if (document.getElementById('tt-wk-modal')) return;

        await this.typer.setPauseState(true);

        const overlay = document.createElement('div');
        overlay.id = 'tt-wk-modal';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.7); z-index: 100000;
            display: flex; justify-content: center; align-items: center; font-family: sans-serif;
        `;

        let gridHtml = QWERTY_KEYS.map(row =>
            `<div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 4px;">` +
            row.map(k => {
                const bg = this.config.weakKeysList.includes(k) ? '#d63384' : '#444';
                return `<button class="tt-wk-key-btn" data-key="${k}" style="width: 28px; height: 28px; border: 1px solid #222; border-radius: 4px; background: ${bg}; color: white; cursor: pointer; font-weight: bold; font-size: 12px; padding: 0;">${k.toUpperCase()}</button>`;
            }).join('') + `</div>`
        ).join('');

        overlay.innerHTML = `
            <div style="background: #222; padding: 20px; border-radius: 8px; border: 1px solid #d63384; color: white; width: 440px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; color: #d63384;">Select Weak Keys</h3>
                <div style="margin-bottom: 20px;">${gridHtml}</div>
                <div style="text-align: right;">
                    <button id="tt-wk-cancel" style="padding: 6px 12px; border: none; border-radius: 4px; background: #666; color: white; cursor: pointer; margin-right: 8px; font-weight: bold;">Cancel</button>
                    <button id="tt-wk-save" style="padding: 6px 12px; border: none; border-radius: 4px; background: #d63384; color: white; cursor: pointer; font-weight: bold;">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        let currentSelection = [...this.config.weakKeysList];
        overlay.querySelectorAll('.tt-wk-key-btn').forEach(b => {
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

        const closeModalAndResume = async () => {
            overlay.remove();
            await this.typer.setPauseState(false);
        };

        overlay.querySelector('#tt-wk-cancel').onclick = () => closeModalAndResume();

        overlay.querySelector('#tt-wk-save').onclick = () => {
            this.config.weakKeysList = currentSelection;
            const listEl = document.getElementById('tt-hum-wk-list');
            if (listEl) listEl.textContent = this.config.weakKeysList.join(',').toUpperCase() || 'None';
            closeModalAndResume();
        };
    }

    removeHumanityUI() {
        if (this.humanityUiContainer) {
            this.humanityUiContainer.remove();
            this.humanityUiContainer = null;
        }
    }

    flashVirtualKey(key, isMiss) {
        if (!this.config.showKeyboard || !this.keyboardUiContainer) return;

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

    updateGraph() {
        if (this.typer.isCancelled || this.typer.isPaused || !this.typer.isTypingLine) return;

        if (this.config.humanitySim) {
            let currentDelayMult = 1.0;
            let currentMissMult = 1.0;

            if (this.humanityUiContainer && this.config.humanityFeatures.transPanic) {
                const panicStatusEl = this.humanityUiContainer.querySelector('#tt-hum-panic-status');
                if (panicStatusEl) {
                    if (this.typer.isTransitionPanic) {
                        panicStatusEl.textContent = "PANICKING!";
                        panicStatusEl.style.color = "#FF4500";
                    } else {
                        panicStatusEl.textContent = "Ready";
                        panicStatusEl.style.color = "#666";
                    }
                }
            }

            if (this.config.humanityFeatures.concentration) {
                const elapsedSec = (Date.now() - this.typer.humanityStartTime) / 1000;
                const wave1 = Math.sin(elapsedSec / 30 * Math.PI * 2);
                const wave2 = Math.sin(elapsedSec / 120 * Math.PI * 2);
                let conc = 75 + (wave1 * 15) + (wave2 * 10) + (Math.random() * 4 - 2);

                conc = Math.max(0, Math.min(100, conc));
                this.typer.humanityState.concentration = conc;

                this.typer.concHistory.push(conc);
                if (this.typer.concHistory.length > 50) this.typer.concHistory.shift();

                const concDelayMult = 1.5 - (conc / 100) * 0.7;
                const concMissMult = 2.5 - (conc / 100) * 2.0;

                currentDelayMult *= concDelayMult;
                currentMissMult *= concMissMult;

                if (this.humanityUiContainer) {
                    const getEl = id => this.humanityUiContainer.querySelector(`#${id}`);

                    const concValEl = getEl('tt-hum-val-conc');
                    const concBarEl = getEl('tt-hum-bar-conc');
                    if (concValEl) concValEl.textContent = `${Math.round(conc)}%`;
                    if (getEl('tt-hum-val-delay')) getEl('tt-hum-val-delay').textContent = `x${concDelayMult.toFixed(2)}`;
                    if (getEl('tt-hum-val-miss')) getEl('tt-hum-val-miss').textContent = `x${concMissMult.toFixed(2)}`;

                    let concColor = conc <= 30 ? '#FF4500' : (conc <= 60 ? '#FFD700' : '#00FF00');

                    if (concBarEl) {
                        concBarEl.style.width = `${conc}%`;
                        concBarEl.style.backgroundColor = concColor;
                    }

                    const concCanvas = getEl('tt-hum-conc-graph');
                    if (concCanvas) {
                        const ctx = concCanvas.getContext('2d');
                        concCanvas.width = concCanvas.clientWidth;
                        concCanvas.height = concCanvas.clientHeight;
                        const cw = concCanvas.width, ch = concCanvas.height;

                        ctx.clearRect(0, 0, cw, ch);
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.font = '9px monospace';
                        ctx.textBaseline = 'top'; ctx.fillText(`100%`, 2, 2);
                        ctx.textBaseline = 'bottom'; ctx.fillText(`0%`, 2, ch - 1);
                        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(0, ch); ctx.lineTo(cw, ch); ctx.stroke();

                        ctx.strokeStyle = concColor; ctx.lineWidth = 2;
                        ctx.beginPath();
                        this.typer.concHistory.forEach((val, i) => {
                            const x = (i / (this.typer.concHistory.length - 1)) * cw;
                            const y = ch - (val / 100) * ch;
                            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                        });
                        ctx.stroke();
                    }
                }
            }

            this.typer.humanityState.delayMult = currentDelayMult;
            this.typer.humanityState.missMult = currentMissMult;

            if (this.humanityUiContainer) {
                const effMinDelay = Math.round(this.config.minDelay * currentDelayMult);
                const effMaxDelay = Math.round(this.config.maxDelay * currentDelayMult);
                let effKpsMin = "---", effKpsMax = "---";
                if (effMaxDelay > 0) effKpsMin = (1000 / effMaxDelay).toFixed(2);
                if (effMinDelay > 0) effKpsMax = (1000 / effMinDelay).toFixed(2);
                const effMissRate = (this.config.missRate * currentMissMult).toFixed(1);

                const getEl = id => this.humanityUiContainer.querySelector(`#${id}`);
                if (getEl('tt-hum-eff-delay')) getEl('tt-hum-eff-delay').textContent = `${effMinDelay} - ${effMaxDelay} ms`;
                if (getEl('tt-hum-eff-kps')) getEl('tt-hum-eff-kps').textContent = `${effKpsMin} - ${effKpsMax}`;
                if (getEl('tt-hum-eff-miss')) getEl('tt-hum-eff-miss').textContent = `${effMissRate}%`;
            }
        }

        let kpsVal = 0;
        if (this.typer.recentIntervals.length > 0) {
            const sum = this.typer.recentIntervals.reduce((a, b) => a + b, 0);
            if (sum > 0) kpsVal = 1000 / (sum / this.typer.recentIntervals.length);
        }

        this.typer.kpsHistory.push(kpsVal);
        if (this.typer.kpsHistory.length > 50) this.typer.kpsHistory.shift();

        const kpsText = this.execUiContainer.querySelector('#tt-kps-val');
        if (kpsText) kpsText.textContent = kpsVal.toFixed(2);

        if (this.typer.allKpsRecords.length > 0) {
            const sumAll = this.typer.allKpsRecords.reduce((a, b) => a + b, 0);
            const lifetimeKps = sumAll / this.typer.allKpsRecords.length;
            const variance = this.typer.allKpsRecords.reduce((a, b) => a + Math.pow(b - lifetimeKps, 2), 0) / this.typer.allKpsRecords.length;
            const stdDev = Math.sqrt(variance);

            const lifetimeEl = this.execUiContainer.querySelector('#tt-lifetime-kps');
            const stddevEl = this.execUiContainer.querySelector('#tt-kps-stddev');
            if (lifetimeEl) lifetimeEl.textContent = lifetimeKps.toFixed(2);
            if (stddevEl) stddevEl.textContent = stdDev.toFixed(2);
        }

        const canvas = this.execUiContainer.querySelector('#tt-kps-graph');
        if (this.canvasCtx && canvas) {
            canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
            const width = canvas.width, height = canvas.height;
            const ctx = this.canvasCtx;

            ctx.clearRect(0, 0, width, height);
            const maxKps = Math.max(10, Math.ceil(Math.max(...this.typer.kpsHistory)));

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; ctx.font = '10px monospace';
            ctx.textBaseline = 'top'; ctx.fillText(`Max: ${maxKps}`, 4, 4);
            ctx.textBaseline = 'bottom'; ctx.fillText(`0`, 4, height - 2);

            ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, height); ctx.lineTo(width, height); ctx.stroke();

            ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 2;
            ctx.beginPath();
            this.typer.kpsHistory.forEach((val, i) => {
                const x = (i / (this.typer.kpsHistory.length - 1)) * width;
                const y = height - (val / maxKps) * height;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();
        }
    }

    cleanupUI() {
        if (this.graphInterval) clearInterval(this.graphInterval);

        this.cleanupCallbacks.forEach(cb => cb());
        this.cleanupCallbacks = [];

        if (this.execUiContainer) this.execUiContainer.remove();
        this.removeHumanityUI();
        this.removeKeyboardUI();
        this.removeDebugUI();

        const wkModal = document.getElementById('tt-wk-modal');
        if (wkModal) wkModal.remove();
    }
}
