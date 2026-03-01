/**
 * 定数定義ファイル
 */

export const DEFAULT_CONFIG = {
    minDelay: 200,
    maxDelay: 300,
    startDelay: 1000,
    checkInterval: 100,
    autoSkip: true,
    missRate: 0,
    humanitySim: false,
    humanityFeatures: {
        concentration: true,
        weakKeys: false,
        transPanic: false
    },
    weakKeysList: [],
    weakKeysBase: 1.5,
    weakKeysVar: 0.2,
    panicDelayBase: 600,
    panicDelayVar: 200,
    // ★追加: オーバーラン（打ち過ぎ）設定
    panicOverrunProb: 70, // 発生確率(%)
    panicOverrunMin: 1,   // 最小文字数
    panicOverrunMax: 3,   // 最大文字数
    showKeyboard: false,
    debugMode: false,
    debugFeatures: {}
};

// ★ 新規追加: システム設定とマジックナンバー
export const SYSTEM = {
    TICK_INTERVAL_MS: 200,          // 状態更新ループの周期
    POLL_INTERVAL_MS: 100,          // 一時停止中などの待機ポーリング間隔
    MAX_VALID_KEY_INTERVAL: 3000,   // KPS計算に含める最大打鍵間隔(ms)
    RECENT_KPS_SAMPLE_SIZE: 5,      // Live KPS計算に使用する直近の打鍵数
    LINE_RESET_RETAIN: 2,           // 行リセット時に保持する打鍵間隔の数
    GRAPH_HISTORY_SIZE: 50,         // グラフ描画用の履歴保持数
    MIN_GRAPH_Y_AXIS_KPS: 10        // KPSグラフY軸の最小最大値
};

// ★ 新規追加: 人間性シミュレーションの数学的係数
export const HUMANITY_MATH = {
    CONC_BASE: 75,             // 集中力の基準値
    WAVE1_SEC: 30,             // サイン波1の周期(秒)
    WAVE1_AMP: 15,             // サイン波1の振幅
    WAVE2_SEC: 120,            // サイン波2の周期(秒)
    WAVE2_AMP: 10,             // サイン波2の振幅
    NOISE_AMP: 4,              // ランダムノイズの振幅
    NOISE_OFFSET: 2,           // ランダムノイズのオフセット
    DELAY_MULT_BASE: 1.5,      // 遅延倍率のベース
    DELAY_MULT_FACTOR: 0.7,    // 遅延倍率の集中力影響係数
    MISS_MULT_BASE: 2.5,       // ミス率倍率のベース
    MISS_MULT_FACTOR: 2.0      // ミス率倍率の集中力影響係数
};

// キーボードレイアウト定義
export const QWERTY_KEYS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '^', '\\'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '@', '['],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', ':', ']'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', '_']
];

// キーの隣接関係定義
export const ADJACENT_KEYS = {
    '1': ['2', 'q'],
    '2': ['1', '3', 'q', 'w'],
    '3': ['2', '4', 'w', 'e'],
    '4': ['3', '5', 'e', 'r'],
    '5': ['4', '6', 'r', 't'],
    '6': ['5', '7', 't', 'y'],
    '7': ['6', '8', 'y', 'u'],
    '8': ['7', '9', 'u', 'i'],
    '9': ['8', '0', 'i', 'o'],
    '0': ['9', '-', 'o', 'p'],
    '-': ['0', '^', 'p', '@'],
    '^': ['-', '\\', '@', '['],
    'q': ['1', '2', 'w', 'a'],
    'w': ['2', '3', 'q', 'e', 'a', 's'],
    'e': ['3', '4', 'w', 'r', 's', 'd'],
    'r': ['4', '5', 'e', 't', 'd', 'f'],
    't': ['5', '6', 'r', 'y', 'f', 'g'],
    'y': ['6', '7', 't', 'u', 'g', 'h'],
    'u': ['7', '8', 'y', 'i', 'h', 'j'],
    'i': ['8', '9', 'u', 'o', 'j', 'k'],
    'o': ['9', '0', 'i', 'p', 'k', 'l'],
    'p': ['0', '-', 'o', '@', 'l', ';'],
    '@': ['-', '^', 'p', '[', ';', ':'],
    '[': ['^', '\\', '@', ':', ']'],
    'a': ['q', 'w', 's', 'z'],
    's': ['w', 'e', 'a', 'd', 'z', 'x'],
    'd': ['e', 'r', 's', 'f', 'x', 'c'],
    'f': ['r', 't', 'd', 'g', 'c', 'v'],
    'g': ['t', 'y', 'f', 'h', 'v', 'b'],
    'h': ['y', 'u', 'g', 'j', 'b', 'n'],
    'j': ['u', 'i', 'h', 'k', 'n', 'm'],
    'k': ['i', 'o', 'j', 'l', 'm', ','],
    'l': ['o', 'p', 'k', ';', ',', '.'],
    ';': ['p', '@', 'l', ':', '.', '/'],
    ':': ['@', '[', ';', ']', '/', '\\'],
    ']': ['[', ':', '\\'],
    'z': ['a', 's', 'x'],
    'x': ['s', 'd', 'z', 'c'],
    'c': ['d', 'f', 'x', 'v'],
    'v': ['f', 'g', 'c', 'b'],
    'b': ['g', 'h', 'v', 'n'],
    'n': ['h', 'j', 'b', 'm'],
    'm': ['j', 'k', 'n', ','],
    ',': ['k', 'l', 'm', '.'],
    '.': ['l', ';', ',', '/'],
    '/': [';', ':', '.', '\\'],
    '\!': ['1', '2', 'q', '\"'],
    '\"': ['1', '\!', '2', '3', '\#', 'q', 'w'],
    '\'': ['6', '\&', '7', '8', '\(', 'y', 'u'],
    '\?': ['\>', '.', '/', '\_', '\\']
};

// 特殊記号のキーコードとコード名のマッピング
export const SYMBOL_MAP = {
    '-': { c: 'Minus', k: 189 },
    '^': { c: 'Equal', k: 222 },
    '\\': { c: 'IntlYen', k: 220 },
    '@': { c: 'BracketLeft', k: 192 },
    '[': { c: 'BracketLeft', k: 219 },
    ';': { c: 'Semicolon', k: 187 },
    ':': { c: 'Quote', k: 186 },
    ']': { c: 'BracketRight', k: 221 },
    ',': { c: 'Comma', k: 188 },
    '.': { c: 'Period', k: 190 },
    '/': { c: 'Slash', k: 191 },
    '_': { c: 'IntlRo', k: 226 },
    '!': { c: 'Digit1', k: 49, s: true },
    '"': { c: 'Digit2', k: 50, s: true },
    '\'': { c: 'Digit7', k: 55, s: true },
    '?': { c: 'Slash', k: 191, s: true }
};

export const SHIFT_MAP = {
    '1': '!',
    '2': '"',
    '3': '#',
    '4': '$',
    '5': '%',
    '6': '&',
    '7': "'",
    '8': '(',
    '9': ')',
    '0': '',
    '-': '=',
    '^': '~',
    '\\': '|',
    '@': '`',
    '[': '{',
    ';': '+',
    ':': '*',
    ']': '}',
    ',': '<',
    '.': '>',
    '/': '?',
    '_': '_'
};
