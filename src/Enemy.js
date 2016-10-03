'use strict';

class Enemy {
    constructor(x, y, map, enemy) {
        this.map = map;
        
        this.x = x;
        this.y = y;
        this.enemy;
        this.tile = enemy.def.tile;
        
        this.destroy = false;
    }
    
    update() {
        
    }
}

module.exports = Enemy;