/**
 * タイピング統計（KPSや標準偏差など）の計算と履歴管理を行うクラス
 */
export class StatsTracker {
    constructor() {
        this.lastKeyTime = 0;
        this.recentIntervals = [];
        this.kpsHistory = new Array(50).fill(0);
        this.allKpsRecords = [];
    }

    /**
     * 打鍵タイミングを記録し、間隔を保存する
     */
    recordKey(now = Date.now()) {
        if (this.lastKeyTime > 0) {
            const interval = now - this.lastKeyTime;
            // 3秒以上の空白（行の切り替わりなど）は統計から除外
            if (interval < 3000) {
                this.recentIntervals.push(interval);
                // 直近5打鍵の移動平均用
                if (this.recentIntervals.length > 5) this.recentIntervals.shift();
                // 全体の統計（Life KPS / StdDev）用
                this.allKpsRecords.push(1000 / interval);
            }
        }
        this.lastKeyTime = now;
    }

    /**
     * 待機時や行の切り替わり時にタイミングをリセットする
     */
    resetLine() {
        this.lastKeyTime = 0;
        // グラフのスムーズな継続のため、直近2件だけを残す
        this.recentIntervals = this.recentIntervals.slice(-2);
    }

    /**
     * 現在の統計情報（UI描画用データ）を計算して返す
     */
    getStats() {
        let kpsVal = 0;
        if (this.recentIntervals.length > 0) {
            const sum = this.recentIntervals.reduce((a, b) => a + b, 0);
            if (sum > 0) kpsVal = 1000 / (sum / this.recentIntervals.length);
        }

        this.kpsHistory.push(kpsVal);
        if (this.kpsHistory.length > 50) this.kpsHistory.shift();

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
