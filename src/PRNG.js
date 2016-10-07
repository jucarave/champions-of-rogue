'use strict';

class Random {
    constructor(seed = null) {
        this.max = 2 << 15;
        this.count = 1;
        this.setSeed(seed);
    }
    
    setSeed(seed) {
        this.seed = (seed == null)? Math.round(Math.random() * this.max) : seed;
        this.orSeed = this.seed;
        
        this.seed = this.seed | 24;
    }
    
    random() {
        this.count = ((this.count * 1.5) % 50) >> 0;
        this.seed = ((this.seed + (this.seed * this.seed) | this.count) >>> 32) % this.max;
        
        var ret = this.seed / this.max;
        
        return ret;
    }
}

module.exports = Random;