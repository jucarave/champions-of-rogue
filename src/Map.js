/*globals astar Graph*/

'use strict';

var Console = require('./Console');
var Prefabs = require('./Prefabs');
var Colors = require('./Colors');
var Player = require('./Player');
var Item = require('./Item');
var ItemFactory = require('./ItemFactory');

class Map {
    constructor(game) {
        this.game = game;
        this.renderer = game.renderer;
        
        this.graph = null;
        this.mousePath = null;
        this.mouseDown = 0;
        this.mousePosition = [-1, -1];
        
        this.map = [];
        this.view = [0, 0];
        this.player = null;
        this.instances = [];
        
        this.mapPosition = [0, 2, 60, 23];
        this.fovUpdated = false;
        this.fovDistance = 30;
        
        this.tileDescription = null;
        
        this.createMap();
        
        this.updateFOV(this.player.x, this.player.y);
    }
    
    createMap() {
        var map = require('./TestWorld');
        
        var solidMap = new Array(map[0].length);
        for (var i=0;i<solidMap.length;i++) {
            solidMap[i] = new Array(map.length);
        }
        
        for (var y=0,yl=map.length;y<yl;y++) {
            this.map[y] = new Array(map[y].length);
            
            for (var x=0,xl=map[y].length;x<xl;x++) {
                var t = map[y][x];
                var tile = Prefabs.TILES.BLANK;
                var weight = 1;
                
                if (t == 1){
                    tile = Prefabs.TILES.FLOOR;
                }else if (t == 2){
                    tile = Prefabs.TILES.WATER;
                    weight = 1.5;
                }else if (t == 3){
                    tile = Prefabs.TILES.WATER_DEEP;
                    weight = 2;
                }else if (t == 4){
                    tile = Prefabs.TILES.WALL;
                    weight = 0;
                }
                
                this.map[y][x] = {
                    tile: tile,
                    visible: 0
                };
                
                
                solidMap[x][y] = weight;
            }
        }
        
        this.graph = new Graph(solidMap, {diagonal: true});
        
        this.player = new Player(10, 10, this);
        this.instances.push(this.player);
        
        var item = new Item(13, 13, this, ItemFactory.getItem("redPotion"));
        this.instances.push(item);
        
        item = new Item(15, 15, this, ItemFactory.getItem("redPotion"));
        this.instances.push(item);
        
        item = new Item(13, 15, this, ItemFactory.getItem("greenPotion"));
        this.instances.push(item);
        
        item = new Item(13, 14, this, ItemFactory.getItem("bluePotion"));
        this.instances.push(item);
        
        item = new Item(12, 16, this, ItemFactory.getItem("yellowPotion"));
        this.instances.push(item);
        
        item = new Item(11, 16, this, ItemFactory.getItem("aquaPotion"));
        this.instances.push(item);
        
        item = new Item(10, 17, this, ItemFactory.getItem("purplePotion"));
        this.instances.push(item);
        
        item = new Item(11, 17, this, ItemFactory.getItem("whitePotion"));
        this.instances.push(item);
        
        item = new Item(12, 17, this, ItemFactory.getItem("tanPotion"));
        this.instances.push(item);
        
        item = new Item(13, 18, this, ItemFactory.getItem("orangePotion"));
        this.instances.push(item);
    }
    
    isSolid(x, y) {
        return this.map[y][x].tile.solid;
    }
    
    onMouseMove(x, y) {
        if (x == null) {
            this.mousePath = null;
            this.mousePosition = [-1, -1];
            return;
        }
        
        var x1 = this.player.x,
            y1 = this.player.y,
            x2 = x + this.view[0],
            y2 = y + this.view[1];
        
        var start = this.graph.grid[x1][y1];
        var end = this.graph.grid[x2][y2];
        var result = astar.search(this.graph, start, end, { heuristic: astar.heuristics.diagonal });
        
        this.mousePath = [];
        for (var i=0,r;r=result[i];i++) {
            this.mousePath.push(r.x);
            this.mousePath.push(r.y);
        }
        
        this.mousePosition = [x2, y2];
    }
    
    onMouseHandler(x, y, stat) {
        if (this.mouseDown == 2 && stat == 1) return;
        
        this.mouseDown = stat;
        if (this.mouseDown == 1) {
            this.mouseDown = 2;
            
            if (this.player.movePath) return;
            
            this.onMouseMove(x, y);
            if (this.mousePath.length > 0){
                this.player.movePath = this.mousePath.slice(0, this.mousePath.length);
            }
        }
    }
    
    copyMapIntoTexture() {
        var xs = this.view[0],
            ys = this.view[1],
            xe = xs + this.mapPosition[2],
            ye = ys + this.mapPosition[3],
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
        this.mousePath = null;
    }
    
    updateView() {
        this.view[0] = Math.max(this.player.x - 33, 0);
        this.view[1] = Math.max(this.player.y - 11, 0);
        
        if (this.view[0] + this.mapPosition[2] > this.map[0].length){
            this.view[0] = this.map[0].length - this.mapPosition[2];
        }
        
        if (this.view[1] + this.mapPosition[3] > this.map.length){
            this.view[1] = this.map.length - this.mapPosition[3];
        }
    }
    
    renderMousePath() {
        if (!this.mousePath) return;
        if (this.player.movePath) return;
        
        var x, y;
        for (var i=0,l=this.mousePath.length;i<l;i+=2) {
            var tile = this.map[this.mousePath[i + 1]][this.mousePath[i]];
            if (!tile.visible){ return; }
            
            x = this.mousePath[i] - this.view[0] + this.mapPosition[0];
            y = this.mousePath[i + 1] - this.view[1] + this.mapPosition[1];
            
            if (x < 0 || y < 0 || x >= this.mapPosition[2] + this.mapPosition[0] || y >= this.mapPosition[3] + this.mapPosition[1]){ continue; }
            
            this.renderer.plotBackground(x, y, Colors.YELLOW);
        }
    }
    
    renderDescription() {
        this.renderer.clearRect(0,1,this.mapPosition[2],1);
        
        if (!this.tileDescription){ return; }
        
        var x = (this.mapPosition[2] / 2 - this.tileDescription.length / 2) << 0;
        for (var i=0,c;c=this.tileDescription[i];i++) {
            this.renderer.plot(x + i, 1, Console.getTile(this.renderer, c, Colors.WHITE, Colors.BLACK));
        }
    }
    
    render() {
        this.tileDescription = null;
        
        this.copyMapIntoTexture();
        this.renderMousePath();
        
        for (var i=0,ins;ins=this.instances[i];i++) {
            ins.update();
            
            if (ins.destroy) {
                this.instances.splice(i, 1);
                i--;
                continue;
            }
            
            if (this.map[ins.y][ins.x].visible >= 2){
                this.renderer.plotCharacter(ins.x - this.view[0] + this.mapPosition[0], ins.y - this.view[1] + this.mapPosition[1], ins.tile.light);
            }
        }
        
        this.renderer.plotCharacter(this.player.x - this.view[0] + this.mapPosition[0], this.player.y - this.view[1] + this.mapPosition[1], this.player.tile.light);
        
        this.renderDescription();
    }
}

module.exports = Map;