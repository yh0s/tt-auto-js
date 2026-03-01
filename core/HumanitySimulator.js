import { SYSTEM, HUMANITY_MATH } from '../config/constants.js';

/**
 * 人間らしい揺らぎ（集中力・苦手キー）のシミュレーション計算を行うクラス
 */
export class HumanitySimulator {
    constructor(config) {
        this.config = config;
        this.startTime = Date.now();
        this.concHistory = new Array(SYSTEM.GRAPH_HISTORY_SIZE).fill(100);
        this.state = {
            conc: 100,
            delayMult: 1.0,
            missMult: 1.0,
            concHistory: [...this.concHistory]
        };
    }

    tick() {
        if (!this.config.humanitySim) {
            this.state = { conc: 100, delayMult: 1.0, missMult: 1.0, concHistory: [...this.concHistory] };
            return this.state;
        }

        let currentDelayMult = 1.0;
        let currentMissMult = 1.0;
        let conc = 100;

        if (this.config.humanityFeatures.concentration) {
            const elapsedSec = (Date.now() - this.startTime) / 1000;
            const wave1 = Math.sin(elapsedSec / HUMANITY_MATH.WAVE1_SEC * Math.PI * 2);
            const wave2 = Math.sin(elapsedSec / HUMANITY_MATH.WAVE2_SEC * Math.PI * 2);
            const noise = (Math.random() * HUMANITY_MATH.NOISE_AMP) - HUMANITY_MATH.NOISE_OFFSET;

            conc = Math.max(0, Math.min(100, HUMANITY_MATH.CONC_BASE + (wave1 * HUMANITY_MATH.WAVE1_AMP) + (wave2 * HUMANITY_MATH.WAVE2_AMP) + noise));

            this.concHistory.push(conc);
            if (this.concHistory.length > SYSTEM.GRAPH_HISTORY_SIZE) {
                this.concHistory.shift();
            }

            currentDelayMult *= HUMANITY_MATH.DELAY_MULT_BASE - (conc / 100) * HUMANITY_MATH.DELAY_MULT_FACTOR;
            currentMissMult *= HUMANITY_MATH.MISS_MULT_BASE - (conc / 100) * HUMANITY_MATH.MISS_MULT_FACTOR;
        }

        this.state = {
            conc,
            delayMult: currentDelayMult,
            missMult: currentMissMult,
            concHistory: [...this.concHistory]
        };

        return this.state;
    }

    getWeakPenalty(char) {
        if (!this.config.humanitySim || !this.config.humanityFeatures.weakKeys) return 1.0;

        if (this.config.weakKeysList.includes(char.toLowerCase())) {
            const v = (Math.random() * 2 - 1) * this.config.weakKeysVar;
            return Math.max(1.0, this.config.weakKeysBase + v);
        }
        return 1.0;
    }
}
