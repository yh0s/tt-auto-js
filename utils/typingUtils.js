/**
 * タイピング関連のユーティリティ関数
 */

import { ADJACENT_KEYS } from '../config/constants.js';

export async function delay(ms, isCancelledFn) {
    return new Promise(resolve => {
        const start = Date.now();
        const interval = setInterval(() => {
            if (isCancelledFn() || Date.now() - start >= ms) {
                clearInterval(interval);
                resolve();
            }
        }, 10);
    });
}

export function getRandomDelay(config, humanityState, extraPenalty = 1.0) {
    const min = Math.min(config.minDelay, config.maxDelay);
    const max = Math.max(config.minDelay, config.maxDelay);
    let baseDelay = Math.floor(Math.random() * (max - min)) + min;

    if (config.humanitySim) {
        baseDelay = Math.floor(baseDelay * humanityState.delayMult);
        baseDelay = Math.floor(baseDelay * extraPenalty);
    }
    return baseDelay;
}

export function getRandomWrongChar(correctChar) {
    const target = (correctChar || "").toLowerCase();
    const adjacents = ADJACENT_KEYS[target];

    if (adjacents && adjacents.length > 0) {
        return adjacents[Math.floor(Math.random() * adjacents.length)];
    }

    const chars = "abcdefghijklmnopqrstuvwxyz";
    let wrongChar = target;
    for (let i = 0; i < 10; i++) {
        wrongChar = chars.charAt(Math.floor(Math.random() * chars.length));
        if (wrongChar !== target) break;
    }
    return wrongChar;
}
