'use strict';

class Stairs {
    constructor(x, y, map, target, tile) {
        this.x = x;
        this.y = y;
        this.map = map;
        this.target = target;
        this.tile = tile;
        this.dir = (target - map.level > 0)? 1 : 0;
        this.name = (this.dir == 1)? "Stairs down" : "Stairs up";
        
        this.playerOnTile = true;
        
        this.discovered = false;
        this.inShadow = true;
        this.stopOnDiscover = true;
        
        this.visibleInShadow = true;
    }
    
    update() {
        this.inShadow = true;
        
        var p = this.map.player;
        if (p.x == this.x && p.y == this.y) {
            if (!this.playerOnTile && !p.movePath){
                this.map.game.gotoLevel(this.target, this.dir);
                return;
            }
            
            this.playerOnTile = true;
        }else if (this.playerOnTile) {
            this.playerOnTile = false;
        }
        
        if (this.map.map[this.y][this.x].visible == 2){
            this.inShadow = false;
            
            p = this.map.mousePosition;
            if (p[0] == this.x && p[1] == this.y) {
                this.map.tileDescription = this.name;
            }
        }else if (this.map.map[this.y][this.x].visible <= 1){
            this.discovered = false;
        }
    }
}

module.exports = Stairs;