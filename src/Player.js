'use strict';

var Prefabs = require('./Prefabs');
var Input = require('./engine/Input');

class Player {
    constructor(x, y, map) {
        this.map = map;
        
        this.x = x;
        this.y = y;
        this.tile = Prefabs.PLAYER;
        
        this.movePath = null;
        this.autoMoveDelay = 0;
        this.moveWait = 4;
        
        this.keys = {
            UP: 0,
            LEFT: 0,
            DOWN: 0,
            RIGHT: 0
        };
        
        this.mouse = {
            x: -1,
            y: 0,
            stat: -1
        };
        
        Input.addKeyDownListener((keyCode, stat) => { this.handleKeyEvent(keyCode, stat); });
        Input.addMouseMoveListener((x, y) => { this.onMouseMove(x, y); });
        Input.addMouseDownListener((x, y, stat) => { this.onMouseHandler(x, y, stat); });
        
        this.destroy = false;
    }
    
    onMouseMove(x, y) {
        this.mouse.x = x;
        this.mouse.y = y;
    }
    
    onMouseHandler(x, y, stat) {
        if (this.mouse.stat == 2 && stat == 1){ return; }
            
        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.stat = stat;
    }
    
    handleKeyEvent(keyCode, stat) {
        var key = null;
        
        switch (keyCode) {
            case Input.keys.W:
            case Input.keys.UP:
                key = 'UP';
                break;
                
            case Input.keys.A:
            case Input.keys.LEFT:
                key = 'LEFT';
                break;
                
            case Input.keys.X:
            case Input.keys.DOWN:
                key = 'DOWN';
                break;
                
            case Input.keys.D:
            case Input.keys.RIGHT:
                key = 'RIGHT';
                break;
                
            case Input.keys.Q:
                this.handleKeyEvent(Input.keys.LEFT, stat);
                key = 'UP';
                break;
                
            case Input.keys.E:
                this.handleKeyEvent(Input.keys.RIGHT, stat);
                key = 'UP';
                break;
                
            case Input.keys.Z:
                this.handleKeyEvent(Input.keys.LEFT, stat);
                key = 'DOWN';
                break;
                
            case Input.keys.C:
                this.handleKeyEvent(Input.keys.RIGHT, stat);
                key = 'DOWN';
                break;
        }
        
        if (key == null){ return; }
        if (stat == 1 && this.keys[key] >= 2){ 
            this.keys[key] -= 1; 
            return; 
        }
        
        this.keys[key] = stat;
    }
    
    act() {
        this.map.playerTurn = false;
    }
    
    moveTo(xTo, yTo) {
        if (!this.map.isSolid(this.x + xTo, this.y + yTo)){
            this.x += xTo;
            this.y += yTo;
            
            this.map.updateFOV(this.x, this.y);
            this.act();
        }
    }
    
    checkMovement() {
        var xTo = 0, 
            yTo = 0;
            
        if (this.keys.UP == 1) {
            yTo = -1;
            this.keys.UP = this.moveWait;
        }else if (this.keys.DOWN == 1) {
            yTo = +1;
            this.keys.DOWN = this.moveWait;
        }
        
        if (this.keys.LEFT == 1) {
            xTo = -1;
            this.keys.LEFT = this.moveWait;
        }else if (this.keys.RIGHT == 1) {
            xTo = +1;
            this.keys.RIGHT = this.moveWait;
        }
        
        if (xTo != 0 || yTo != 0){
            this.moveTo(xTo, yTo);
        }
    }
    
    followPath() {
        if (this.autoMoveDelay-- > 0){ return; }
        
        var xTo = this.movePath[0] - this.x;
        var yTo = this.movePath[1] - this.y;
        
        this.moveTo(xTo, yTo);
        this.autoMoveDelay = this.moveWait;
        
        this.movePath.splice(0, 2);
        if (this.movePath.length == 0) {
            this.movePath = null;
        }
    }
    
    updateMouse() {
        if (this.mouse.x == -1) { return; }
        
        this.map.game.onMouseMove(this.mouse.x, this.mouse.y);
        if (this.mouse.stat != 2){
            this.map.game.onMouseHandler(this.mouse.x, this.mouse.y, this.mouse.stat);
            if (this.mouse.stat == 1){
                this.mouse.stat = 2;
            }
        }
        
        this.mouse.x = -1;
    }
    
    update() {
        if (!this.map.playerTurn){ return; }
        
        this.updateMouse();
        
        if (this.map.game.itemDesc){ return; }
        
        if (this.movePath){
            this.followPath();
        }else{
            this.checkMovement();
        }
        
        this.map.updateView();
    }
}

module.exports = Player;