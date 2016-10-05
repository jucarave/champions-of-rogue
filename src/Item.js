'use strict';

var PlayerStats = require('./Stats');
var ItemFactory = require('./ItemFactory');

class Item {
    constructor(x, y, map, item) {
        this.map = map;
        
        this.x = x;
        this.y = y;
        this.item = item;
        this.tile = item.def.tile;
        this.name = item.def.name;
        
        if (item.def.type == ItemFactory.types.GOLD) {
            this.name = item.def.desc.replace("X", item.amount);
            if (item.amount > 1){ this.name += "s"; }
        }
        
        this.destroy = false;
        this.playerOnTile = false;
        
        this.discovered = false;
        this.inShadow = true;
        this.stopOnDiscover = true;
    }
    
    update() {
        if (this.item.def.discovered) {
            this.name = this.item.def.name;
        }
        
        this.inShadow = true;
        
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

module.exports = Item;