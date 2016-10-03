'use strict';

class Enemy {
    constructor(x, y, map, enemy) {
        this.map = map;
        
        this.x = x;
        this.y = y;
        this.enemy = enemy;
        this.tile = enemy.def.tile;
        this.name = enemy.def.name;
        
        this.destroy = false;
        
        this.discovered = false;
        this.inShadow = true;
        this.stopOnDiscover = true;
    }
    
    update() {
        this.inShadow = true;
        
        var p = this.map.player;
        
        if (this.map.map[this.y][this.x].visible == 2){
            this.inShadow = false;
            p = this.map.mousePosition;
            if (p[0] == this.x && p[1] == this.y) {
                this.map.tileDescription = this.enemy.def.name;
            }
        }else if (this.map.map[this.y][this.x].visible <= 1){
            this.discovered = false;
        }
    }
}

module.exports = Enemy;