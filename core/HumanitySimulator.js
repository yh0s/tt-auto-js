/**
 * 人間らしい揺らぎ（集中力・苦手キー）のシミュレーション計算を行うクラス
 */
export class HumanitySimulator {
    constructor(config) {
        this.config = config;
        this.startTime = Date.now();
        this.concHistory = new Array(50).fill(100);
        // 現在の状態をキャッシュして保持
        this.state = {
            conc: 100,
            delayMult: 1.0,
            missMult: 1.0,
            concHistory: [...this.concHistory]
        };
    }

    /**
     * 一定間隔（Tick）ごとに集中力と補正倍率を再計算する
     */
    tick() {
        if (!this.config.humanitySim) {
            // シミュレーションOFF時も一貫したデータを返す
            this.state = { conc: 100, delayMult: 1.0, missMult: 1.0, concHistory: [...this.concHistory] };
            return this.state;
        }

        let currentDelayMult = 1.0;
        let currentMissMult = 1.0;
        let conc = 100;

        if (this.config.humanityFeatures.concentration) {
            const elapsedSec = (Date.now() - this.startTime) / 1000;
            // 30秒と120秒のサイン波を組み合わせたバイオリズム
            const wave1 = Math.sin(elapsedSec / 30 * Math.PI * 2);
            const wave2 = Math.sin(elapsedSec / 120 * Math.PI * 2);
            conc = Math.max(0, Math.min(100, 75 + (wave1 * 15) + (wave2 * 10) + (Math.random() * 4 - 2)));

            this.concHistory.push(conc);
            if (this.concHistory.length > 50) this.concHistory.shift();

            // 集中力が低いほど遅延とミス率が上昇
            currentDelayMult *= 1.5 - (conc / 100) * 0.7;
            currentMissMult *= 2.5 - (conc / 100) * 2.0;
        }

        this.state = {
            conc,
            delayMult: currentDelayMult,
            missMult: currentMissMult,
            concHistory: [...this.concHistory]
        };

        return this.state;
    }

    /**
     * 指定された文字が苦手キーか判定し、ペナルティ倍率を返す
     */
    getWeakPenalty(char) {
        if (!this.config.humanitySim || !this.config.humanityFeatures.weakKeys) return 1.0;

        if (this.config.weakKeysList.includes(char.toLowerCase())) {
            const v = (Math.random() * 2 - 1) * this.config.weakKeysVar;
            return Math.max(1.0, this.config.weakKeysBase + v);
        }
        return 1.0;
    }
}
