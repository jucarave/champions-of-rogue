'use strict';

var Prefabs = require('./Prefabs');
var Input = require('./engine/Input');

class Player {
    constructor(x, y, map) {
        this.map = map;
        
        this.x = x;
        this.y = y;
        this.tile = Prefabs.PLAYER;
        
        this.keys = {
            UP: 0,
            LEFT: 0,
            DOWN: 0,
            RIGHT: 0,
            
            UL: 0,
            UR: 0,
            DL: 0,
            DR: 0
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
                key = 'UL';
                break;
                
            case Input.keys.E:
                key = 'UR';
                break;
                
            case Input.keys.Z:
                key = 'DL';
                break;
                
            case Input.keys.C:
                key = 'DR';
                break;
        }
        
        if (key == null){ return; }
        if (stat == 1 && this.keys[key] == 2 ){ return; }
        
        this.keys[key] = stat;
    }
    
    moveTo(xTo, yTo) {
        this.x += xTo;
        this.y += yTo;
    }
    
    checkMovement() {
        var xTo = 0, 
            yTo = 0;
            
        if (this.keys.UP == 1) {
            yTo = -1;
            this.keys.UP = 2;
        }else if (this.keys.LEFT == 1) {
            xTo = -1;
            this.keys.LEFT = 2;
        }else if (this.keys.DOWN == 1) {
            yTo = +1;
            this.keys.DOWN = 2;
        }else if (this.keys.RIGHT == 1) {
            xTo = +1;
            this.keys.RIGHT = 2;
        }else if (this.keys.UL == 1) {
            xTo = -1;
            yTo = -1;
            this.keys.UL = 2;
        }else if (this.keys.UR == 1) {
            xTo = +1;
            yTo = -1;
            this.keys.UR = 2;
        }else if (this.keys.DL == 1) {
            xTo = -1;
            yTo = +1;
            this.keys.DL = 2;
        }else if (this.keys.DR == 1) {
            xTo = +1;
            yTo = +1;
            this.keys.DR = 2;
        }
        
        if (xTo != 0 || yTo != 0){
            this.moveTo(xTo, yTo);
        }
    }
    
    update() {
        this.checkMovement();
    }
}

module.exports = Player;