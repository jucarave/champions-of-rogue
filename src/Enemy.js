'use strict';

var Prefabs = require('./Prefabs');
var PlayerStats = require('./Stats');

class Enemy {
    constructor(x, y, map, enemy) {
        this.map = map;
        
        this.x = x;
        this.y = y;
        this.enemy = enemy;
        this.tile = enemy.def.tile;
        this.name = enemy.def.name;
        
        this.target = null;
        
        this.destroy = false;
        
        this.discovered = false;
        this.inShadow = true;
        this.stopOnDiscover = true;
        
        this.movementBudget = 0.0;
    }
    
    moveTo(xTo, yTo) {
        var tile = this.map.getTileAt(this.x + xTo, this.y + yTo);
        var solid = (tile && tile.type == Prefabs.types.WALL);
        
        if (!this.enemy.def.canSwim && tile.type == Prefabs.types.WATER) {
            solid = true;
        }
        
        if (!solid){
            this.x += xTo;
            this.y += yTo;
        }
    }
    
    wander() {
        var shouldMove = (Math.random() * 10) < 7;
        if (shouldMove) {
            var xTo = Math.round((Math.random() * 2.0) - 1.0);
            var yTo = Math.round((Math.random() * 2.0) - 1.0);
            
            if (xTo != 0 || yTo != 0) {
                this.moveTo(xTo, yTo);
            }
        }
    }
    
    updateMovement() {
        if (this.target) {
            
        }else{
            this.wander();
        }
    }
    
    update() {
        this.inShadow = true;
        
        var p = this.map.player;
        
        if (this.map.map[this.y][this.x].visible == 2){
            this.inShadow = false;
            p = this.map.mousePosition;
            if (p[0] == this.x && p[1] == this.y) {
                this.map.tileDescription = this.name;
            }
        }else if (this.map.map[this.y][this.x].visible <= 1){
            this.discovered = false;
        }
        
        if (this.map.playerTurn){ return; }
        
        var turns = this.enemy.def.spd / PlayerStats.spd + this.movementBudget;
        this.movementBudget = turns - (turns << 0);
        turns = turns << 0;
        
        for (var i=0;i<turns;i++) {
            this.updateMovement();
        }
    }
}

module.exports = Enemy;