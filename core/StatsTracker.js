import { SYSTEM } from '../config/constants.js';

/**
 * タイピング統計（KPSや標準偏差など）の計算と履歴管理を行うクラス
 */
export class StatsTracker {
    constructor() {
        this.lastKeyTime = 0;
        this.recentIntervals = [];
        this.kpsHistory = new Array(SYSTEM.GRAPH_HISTORY_SIZE).fill(0);
        this.allKpsRecords = [];
    }

    recordKey(now = Date.now()) {
        if (this.lastKeyTime > 0) {
            const interval = now - this.lastKeyTime;
            if (interval < SYSTEM.MAX_VALID_KEY_INTERVAL) {
                this.recentIntervals.push(interval);
                if (this.recentIntervals.length > SYSTEM.RECENT_KPS_SAMPLE_SIZE) {
                    this.recentIntervals.shift();
                }
                this.allKpsRecords.push(1000 / interval);
            }
        }
        this.lastKeyTime = now;
    }

    resetLine() {
        this.lastKeyTime = 0;
        this.recentIntervals = this.recentIntervals.slice(-SYSTEM.LINE_RESET_RETAIN);
    }

    getStats() {
        let kpsVal = 0;
        if (this.recentIntervals.length > 0) {
            const sum = this.recentIntervals.reduce((a, b) => a + b, 0);
            if (sum > 0) kpsVal = 1000 / (sum / this.recentIntervals.length);
        }

        this.kpsHistory.push(kpsVal);
        if (this.kpsHistory.length > SYSTEM.GRAPH_HISTORY_SIZE) {
            this.kpsHistory.shift();
        }

        let lifetimeKps = 0;
        let stdDev = 0;
        if (this.allKpsRecords.length > 0) {
            const sumAll = this.allKpsRecords.reduce((a, b) => a + b, 0);
            lifetimeKps = sumAll / this.allKpsRecords.length;
            const variance = this.allKpsRecords.reduce((a, b) => a + Math.pow(b - lifetimeKps, 2), 0) / this.allKpsRecords.length;
            stdDev = Math.sqrt(variance);
        }

        return {
            kpsVal,
            kpsHistory: [...this.kpsHistory],
            lifetimeKps,
            stdDev
        };
    }
}
