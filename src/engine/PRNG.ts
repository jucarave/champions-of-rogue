class Random {
    seed: number;
    orSeed: number;
    max: number;
    count: number;

    constructor(seed: number = null) {
        this.max = 2 << 15;
        this.count = 1;
        this.setSeed(seed);
    }

    setSeed(seed: number) {
        this.seed = (seed == null) ? Math.round(Math.random() * this.max) : seed;
        this.orSeed = this.seed;

        this.seed = this.seed | 24;
    }

    random(): number {
        this.count = ((this.count * 1.5) % 50) >> 0;
        this.seed = ((this.seed + (this.seed * this.seed) | this.count) >>> 32) % this.max;

        let ret: number = this.seed / this.max;

        return ret;
    }
}

export { Random as PRNG };