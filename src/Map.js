/*globals astar Graph*/

'use strict';

var Console = require('./Console');
var Prefabs = require('./Prefabs');
var Colors = require('./Colors');
var Player = require('./Player');
var Item = require('./Item');
var ItemFactory = require('./ItemFactory');
var Enemy = require('./Enemy');
var EnemyFactory = require('./EnemyFactory');
var Utils = require('./Utils');
var MapGenerator = require('./MapGenerator');
var Stairs = require('./Stairs');
var PlayerStats = require('./Stats');

class Map {
    constructor(game, level = 1) {
        this.game = game;
        this.renderer = game.renderer;
        
        this.active = true;
        
        this.level = level;
        
        this.graph = null;
        this.mousePath = null;
        this.mouseDown = 0;
        this.mousePosition = [-1, -1];
        
        this.map = [];
        this.view = [0, 0];
        this.player = null;
        this.instances = [];
        
        this.stairsUp = null;
        this.stairsDown = null;
        
        this.mapPosition = [0, 2, 60, 23];
        this.fovUpdated = false;
        this.fovDistance = 30;
        
        this.playerTurn = true;
        this.tileDescription = null;
        
        this.createMap();
        
        this.updateFOV(this.player.x, this.player.y);
    }
    
    createMap() {
        MapGenerator.init(parseInt(this.game.gameSeed + "" + this.level, 10));
        var newMap = MapGenerator.generateMap(this.level);
        var map = newMap.map;
        
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
        
        this.player = new Player(newMap.player.x, newMap.player.y, this);
        this.instances.push(this.player);
        
        var ins;
        if (newMap.stairsUp) {
            ins = new Stairs(newMap.stairsUp.x, newMap.stairsUp.y, this, this.level - 1, Prefabs.TILES.STAIRS_UP);
            this.stairsUp = ins;
            this.instances.push(ins);
        }
        
        if (newMap.stairsDown) {
            ins = new Stairs(newMap.stairsDown.x, newMap.stairsDown.y, this, this.level + 1, Prefabs.TILES.STAIRS_DOWN);
            this.stairsDown = ins;
            this.instances.push(ins);
        }
        
        for (var i=0,ins;ins=newMap.instances[i];i++) {
            var instance;
            if (ins.type == "item"){ 
                instance = new Item(ins.x, ins.y, this, ItemFactory.getItem(ins.code));
            }else
            if (ins.type == "enemy"){ 
                instance = new Enemy(ins.x, ins.y, this, EnemyFactory.getEnemy(ins.code));
            }
            
            this.instances.push(instance);
        }
        
        /*var item = new Item(this.player.x + 1, this.player.y, this, ItemFactory.getItem("redPotion"));
        this.instances.push(item);
        item = new Item(this.player.x + 1, this.player.y - 1, this, ItemFactory.getItem("greenPotion"));
        this.instances.push(item);
        item = new Item(this.player.x - 1, this.player.y, this, ItemFactory.getItem("bluePotion"));
        this.instances.push(item);
        item = new Item(this.player.x - 1, this.player.y - 1, this, ItemFactory.getItem("yellowPotion"));
        this.instances.push(item);
        item = new Item(this.player.x - 1, this.player.y - 2, this, ItemFactory.getItem("aquaPotion"));
        this.instances.push(item);
        
        item = new Item(this.player.x + 1, this.player.y - 2, this, ItemFactory.getItem("plateArmor"));
        this.instances.push(item);
        
        /*var item = new Item(13, 13, this, ItemFactory.getItem("redPotion"));
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
        
        item = new Item(12, 10, this, ItemFactory.getItem("gold", 33));
        this.instances.push(item);
        
        var enemy = new Enemy(23, 10, this, EnemyFactory.getEnemy("kobold"));
        this.instances.push(enemy);*/
    }
    
    getInstanceAt(x, y) {
        for (var i=1,ins;ins=this.instances[i];i++) {
            if (ins.x == x && ins.y == y) {
                return ins;
            }
        }
        
        return null;
    }
    
    createItem(x, y, item) {
        var newItem = new Item(x, y, this, item);
        newItem.playerOnTile = true;
        this.instances.push(newItem);
    }
    
    isSolid(x, y) {
        return (this.map[y][x].tile.type == Prefabs.types.WALL);
    }
    
    getTileAt(x, y) {
        return this.map[y][x].tile;
    }
    
    getPath(x1, y1, x2, y2) {
        var start = this.graph.grid[x1][y1];
        var end = this.graph.grid[x2][y2];
        var result = astar.search(this.graph, start, end, { heuristic: astar.heuristics.diagonal });
        
        var ret = [];
        for (var i=0,r;r=result[i];i++) {
            ret.push(r.x);
            ret.push(r.y);
        }
        
        return ret;
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
        
        this.mousePath = this.getPath(x1, y1, x2, y2);
        
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
        this.renderer.clearRect(0,0,this.mapPosition[2],2);
        
        if (!this.tileDescription){ return; }
        
        var x = (this.mapPosition[2] / 2 - this.tileDescription.length / 2) << 0;
        for (var i=0,c;c=this.tileDescription[i];i++) {
            this.renderer.plot(x + i, 1, Utils.getTile(this.renderer, c, Colors.WHITE, Colors.BLACK));
        }
    }
    
    render() {
        this.playerTurn = true;
        this.tileDescription = null;
        
        this.copyMapIntoTexture();
        this.renderMousePath();
        
        var discover = null;
        for (var i=0,ins;ins=this.instances[i];i++) {
            ins.update();
            
            if (ins.destroy) {
                this.instances.splice(i, 1);
                i--;
                continue;
            }
            
            if (this.map[ins.y][ins.x].visible >= 2){
                this.renderer.plotCharacter(ins.x - this.view[0] + this.mapPosition[0], ins.y - this.view[1] + this.mapPosition[1], ins.tile.light);
                
                if (ins.stopOnDiscover && !ins.inShadow && !ins.discovered) {
                    ins.discovered = true;
                    if (discover == null) {
                        discover = "You see a " + ins.name;
                    }else{
                        discover += ", " + ins.name;
                    }
                }
            }else if (ins.visibleInShadow && this.map[ins.y][ins.x].visible == 1) {
                this.renderer.plotCharacter(ins.x - this.view[0] + this.mapPosition[0], ins.y - this.view[1] + this.mapPosition[1], ins.tile.dark);
            }
        }
        
        if (discover != null && !PlayerStats.blind) {
            discover = Utils.formatText(discover + ".", 85);
            for (var i=0,line;line=discover[i];i++){
                this.game.console.addMessage(line, [255, 255, 255]);
            }
            
            this.player.movePath = null;
        }
        
        if (PlayerStats.blind) {
            this.renderer.clearRect(this.mapPosition[0], this.mapPosition[1], this.mapPosition[2], this.mapPosition[3]);
        }
        
        this.renderer.plotCharacter(this.player.x - this.view[0] + this.mapPosition[0], this.player.y - this.view[1] + this.mapPosition[1], this.player.tile.light);
        
        this.renderDescription();
    }
}

module.exports = Map;