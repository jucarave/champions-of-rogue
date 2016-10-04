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
        this.targetLastPosition = {x: 0, y: 0};
        this.targetPath = null;
        
        this.destroy = false;
        
        this.discovered = false;
        this.inShadow = true;
        this.stopOnDiscover = true;
        
        this.movementBudget = 0.0;
    }
    
    moveTo(xTo, yTo) {
        var tile = this.map.getTileAt(this.x + xTo, this.y + yTo);
        var solid = (tile && tile.type == Prefabs.types.WALL);
        
        if (!this.enemy.def.canSwim && tile.type == Prefabs.types.WATER_DEEP) {
            solid = true;
        }
        
        if (!solid){
            this.x += xTo;
            this.y += yTo;
        }
    }
    
    followPath() {
        if (!this.targetPath || this.targetPath.length == 0){ return; }
        
        var xTo = this.targetPath.shift() - this.x;
        var yTo = this.targetPath.shift() - this.y;
        
        this.moveTo(xTo, yTo);
        
        if (this.targetPath.length == 0) {
            this.targetPath = null;
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
            if (this.target.x != this.targetLastPosition.x || this.target.y != this.targetLastPosition.y) {
                this.targetLastPosition.x = this.target.x;
                this.targetLastPosition.y = this.target.y;
                
                this.targetPath = this.map.getPath(this.x, this.y, this.target.x, this.target.y);
                this.targetPath.pop();
                this.targetPath.pop();
            }
            
            this.followPath();
        }else{
            this.wander();
        }
    }
    
    update() {
        this.inShadow = true;
        
        var p = this.map.player;
        
        if (this.map.map[this.y][this.x].visible == 2){
            this.inShadow = false;
            if (!this.target && (Math.abs(p.x - this.x) <= this.enemy.def.viewDistance || Math.abs(p.y - this.y) <= this.enemy.def.viewDistance)) {
                this.target = p;
            }
            
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