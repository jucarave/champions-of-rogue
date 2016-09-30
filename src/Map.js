'use strict';

var Prefabs = require('./Prefabs');
var Player = require('./Player');
var Tiles = require('./Tiles');

class Map {
    constructor(game) {
        this.game = game;
        this.renderer = game.renderer;
        
        this.map = [];
        this.view = [0, 0];
        this.player = new Player(10, 10, this);
        this.instances = [this.player];
        
        this.mapPosition = [0, 2];
        this.fovUpdated = false;
        this.fovDistance = 30;
        
        this.createMap();
        
        this.updateFOV(this.player.x, this.player.y);
    }
    
    createMap() {
        var map = require('./TestWorld');
        
        for (var y=0,yl=map.length;y<yl;y++) {
            this.map[y] = new Array(map[y].length);
            
            for (var x=0,xl=map[y].length;x<xl;x++) {
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

                this.map[y][x] = {
                    tile: tile,
                    visible: 0
                };
            }
        }
    }
    
    isSolid(x, y) {
        var chara = (this.map[y][x].tile.light & (255 << 8)) >> 8;
        
        if (chara == Tiles.HASH) {
            return true;
        }
        
        return false;
    }
    
    copyMapIntoTexture() {
        var xs = this.view[0],
            ys = this.view[1],
            xe = xs + 60,
            ye = ys + 23,
            mp = this.mapPosition,
            tile;
        
        for (var y=ys;y<ye;y++) {
            for (var x=xs;x<xe;x++) {
                tile = this.map[y][x];
                
                var renderTile = tile.tile.light;
                if (tile.visible == 0){
                    renderTile = Prefabs.BLANK;
                }else if (tile.visible == 1) {
                    renderTile = tile.tile.dark;
                    tile.visible = 1;
                }else if (tile.visible == 2 && this.fovUpdated) {
                    renderTile = tile.tile.dark;
                    tile.visible = 1;
                }else if (tile.visible == 3) {
                    renderTile = tile.tile.light;
                    tile.visible = 2;
                }
                
                this.renderer.plot(x - xs + mp[0], y - ys + mp[1], renderTile);
            }
        }
        
        this.fovUpdated = false;
    }
    
    castLightRay(x1, y1, x2, y2) {
        var x = x2 - x1,
            y = y1 - y2,
            angle = Math.atan2(y, x),
            jx = Math.cos(angle) * 0.5,
            jy = -Math.sin(angle) * 0.5,
            rx = x1 + 0.5,
            ry = y1 + 0.5,
            cx, cy,
            search = true,
            d = 0,
            md = this.fovDistance / 2;
        
        while (search) {
            cx = rx << 0;
            cy = ry << 0;
            
            if (!this.map[cy]){ search = false; }
            if (!this.map[cy][cx]){ search = false; }
            
            this.map[cy][cx].visible = 3;
            if (this.isSolid(cx, cy)){
                search = false;
            }
            
            if (d++ >= md) {
                search = false;
            }
            
            rx += jx;
            ry += jy;
        }
    }
    
    updateFOV(x, y) {
        var distance = this.fovDistance;
        for (var i=0;i<=distance;i+=1) {
            this.castLightRay(x, y, x - distance / 2, y - distance / 2 + i);
            this.castLightRay(x, y, x + distance / 2, y - distance / 2 + i);
            this.castLightRay(x, y, x - distance / 2 + i, y - distance / 2);
            this.castLightRay(x, y, x - distance / 2 + i, y + distance / 2);
        }
        
        this.fovUpdated = true;
    }
    
    updateView() {
        this.view[0] = Math.max(this.player.x - 33, 0);
        this.view[1] = Math.max(this.player.y - 11, 0);
        
        if (this.view[0] + 65 > this.map[0].length){
            this.view[0] = this.map[0].length - 65;
        }
        
        if (this.view[1] + 23 > this.map.length){
            this.view[1] = this.map.length - 23;
        }
    }
    
    render() {
        this.copyMapIntoTexture();
        
        for (var i=0,ins;ins=this.instances[i];i++) {
            ins.update();
            
            if (this.map[ins.y][ins.x].visible >= 2){
                this.renderer.plotCharacter(ins.x - this.view[0] + this.mapPosition[0], ins.y - this.view[1] + this.mapPosition[1], ins.tile.light);
            }
        }
    }
}

module.exports = Map;