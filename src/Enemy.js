'use strict';

var Prefabs = require('./Prefabs');
var PlayerStats = require('./Stats');
var Colors = require('./Colors');
var Utils = require('./Utils');

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
    
    receiveDamage(dmg) {
        this.enemy.hp[0] -= dmg;
        if (this.enemy.hp[0] <= 0) {
            this.destroy = true;
            return true;
        }
        
        return false;
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
    
    checkAttack() {
        if (Math.abs(this.target.x - this.x) > 1 || Math.abs(this.target.y - this.y) > 1) {
            return false;
        }
        
        var player = PlayerStats;
        var missed = (Math.random() * 100) < player.luk;
        var msg = this.enemy.def.name + " attacks you";
        
        if (missed) {
            this.map.game.console.addMessage(msg + ", missed!", Colors.GREEN);
            return false;
        }
        
        var str = Utils.rollDice(this.enemy.def.str);
        var def = Utils.rollDice(player.def);
        var dmg = Math.max(str - def, 1);
        
        this.map.game.console.addMessage(msg + ", hit by " + dmg + " points", Colors.RED);
        player.receiveDamage(dmg);
        
        return true;
    }
    
    updateMovement() {
        if (this.target) {
            if (this.checkAttack()) {
                return true;
            }
            
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
        
        return false;
    }
    
    update() {
        if (this.destroy) return;
        
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
            if (this.updateMovement()){ return; }
        }
    }
}

module.exports = Enemy;