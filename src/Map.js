'use strict';

var Prefabs = require('./Prefabs');
var Player = require('./Player');

class Map {
    constructor(game) {
        this.game = game;
        this.renderer = game.renderer;
        
        this.map = [];
        this.view = [0, 0];
        this.player = new Player(10, 10, this);
        this.instances = [this.player];
        
        this.createMap();
    }
    
    createMap() {
        var map = require('./TestWorld');
        for (var y=0;y<30;y++) {
            this.map[y] = new Uint32Array(85);
            
            for (var x=0;x<85;x++) {
                var t = map[y][x];
                var tile = Prefabs.TILES.BLANK;
                
                if (t == 1){
                    tile = Prefabs.TILES.FLOOR;
                }else if (t == 2){
                    tile = Prefabs.TILES.WATER;
                }else if (t == 3){
                    tile = Prefabs.TILES.WATER_DEEP;
                }else if (t == 4){
                    tile = Prefabs.TILES.WALL;
                }

                this.map[y][x] = tile;
            }
        }
    }
    
    copyMapIntoTexture() {
        var xs = this.view[0],
            ys = this.view[1],
            xe = xs + 85,
            ye = ys + 15;
        
        for (var y=ys;y<ye;y++) {
            for (var x=xs;x<xe;x++) {
                this.renderer.plot(x - xs, y - ys, this.map[y][x]);
            }
        }
    }
    
    updateView() {
        this.view[0] = Math.max(this.player.x - 42, 0);
        this.view[1] = Math.max(this.player.y - 7, 0);
        
        if (this.view[0] + 85 > this.map[0].length){
            this.view[0] = this.map[0].length - 85;
        }
        
        if (this.view[1] + 15 > this.map.length){
            this.view[1] = this.map.length - 15;
        }
    }
    
    render() {
        this.copyMapIntoTexture();
        
        for (var i=0,ins;ins=this.instances[i];i++){
            ins.update();
            this.renderer.plotCharacter(ins.x - this.view[0], ins.y - this.view[1], ins.tile);
        }
    }
}

module.exports = Map;