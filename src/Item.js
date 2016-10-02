'use strict';

var PlayerStats = require('./Stats');

class Item {
    constructor(x, y, map, item) {
        this.map = map;
        
        this.x = x;
        this.y = y;
        this.item = item;
        this.tile = item.def.tile;
        
        this.destroy = false;
        this.playerOnTile = false;
    }
    
    update() {
        var p = this.map.player;
        if (p.x == this.x && p.y == this.y) {
            if (!this.playerOnTile && !p.movePath && PlayerStats.pickItem(this.item)){
                this.destroy = true;
                return;
            }
            
            this.playerOnTile = true;
        }else if (this.playerOnTile) {
            this.playerOnTile = false;
        }
        
        if (this.map.map[this.y][this.x].visible == 2){
            p = this.map.mousePosition;
            if (p[0] == this.x && p[1] == this.y) {
                this.map.tileDescription = this.item.def.desc;
            }
        }
    }
}

module.exports = Item;