'use strict';

var Prefabs = require('./Prefabs');
var Player = require('./Player');

class Map {
    constructor(game) {
        this.game = game;
        this.renderer = game.renderer;
        
        this.map = new Uint8Array(85 * 30 * 4);
        this.player = new Player(10, 10, this);
        this.instances = [this.player];
        
        this.createMap();
    }
    
    createMap() {
        var map = require('./TestWorld');
        var ind = 0;
        for (var y=0;y<30;y++) {
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
                
                this.map[ind++] = (tile & (255 << 24)) >> 24;
                this.map[ind++] = (tile & (255 << 16)) >> 16;
                this.map[ind++] = (tile & (255 << 8)) >> 8;
                this.map[ind++] = (tile & 255);
            }
        }
    }
    
    copyMapIntoTexture() {
        this.renderer.mainSurface.content.table.set(this.map, 256 * 4);
        this.renderer.mainSurface.updated = false;
    }
    
    render() {
        this.copyMapIntoTexture();
        
        for (var i=0,ins;ins=this.instances[i];i++){
            ins.update();
            this.renderer.plotCharacter(ins.x, ins.y, ins.tile);
        }
    }
}

module.exports = Map;