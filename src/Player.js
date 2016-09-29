'use strict';

var Prefabs = require('./Prefabs');
var Input = require('./engine/Input');

class Player {
    constructor(x, y, map) {
        this.map = map;
        
        this.x = x;
        this.y = y;
        this.tile = Prefabs.PLAYER;
        
        this.moveWait = 4;
        
        this.keys = {
            UP: 0,
            LEFT: 0,
            DOWN: 0,
            RIGHT: 0
        };
        
        Input.addKeyDownListener((keyCode, stat) => { this.handleKeyEvent(keyCode, stat); });
        Input.addKeyUpListener((keyCode, stat) => { this.handleKeyEvent(keyCode, stat); });
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
    
    moveTo(xTo, yTo) {
        if (!this.map.isSolid(this.x + xTo, this.y + yTo)){
            this.x += xTo;
            this.y += yTo;
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
    
    update() {
        this.checkMovement();
        this.map.updateView();
    }
}

module.exports = Player;