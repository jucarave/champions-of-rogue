/*globals Stats*/

'use strict';

var Renderer = require('./engine/Renderer');
var Colors = require('./Colors');
var Prefabs = require('./Prefabs');
var Map = require('./Map');
var Console = require('./Console');
var Utils = require('./Utils');
var ItemFactory = require('./ItemFactory');
var MainMenu = require('./MainMenu');
var Input = require('./engine/Input');

class Game {
    constructor() {
        this.renderer = new Renderer(850, 480, document.getElementById("divGame"));
        this.resolution = [85, 30];
        
        this.font = this.renderer.setFontTexture('img/ascii-rl-font.png');
        Prefabs.init(this.renderer);
        
        this.playerStats = null;
        this.maps = [];
        this.map = null;
        this.console = null;
        
        //this.panelTile = this.renderer.getTile(Colors.DARK_BLUE, Colors.WHITE, "");
        this.itemDesc = null;
        
        this.restartGame = false;
        
        this.panels = {
            map: [0, 2, 60, 25],
            inventory: [60, 0, 85, 20],
            itemDesc: [10, 4, 49, 20]
        };
        
        this.createStats();
        this.newGame();
    }
    
    newRenderTest() {
        this.stats.begin();
        
        if (this.font.ready){
            for (var x=0;x<85;x++) {
                for (var y=0;y<30;y++) {
                    var tile = this.renderer.getTile([Math.random(), Math.random(), Math.random()], [Math.random(), Math.random(), Math.random()], [Math.floor(Math.random() * 25), Math.floor(Math.random() * 4)]);
                    this.renderer.plot(x, y, tile);
                }
            }
            
            this.renderer.render();
        }
        
        this.stats.end();
        
        requestAnimationFrame(() => { this.newRenderTest(); });
    }
    
    newGame() {
        this.restartGame = false;
        
        Input.clearListeners();
        
        this.gameSeed = Math.floor(Math.random() * 1500);
        console.log("SEED: " + this.gameSeed);
        
        this.playerStats = require('./Stats');
        this.playerStats.initStats(this);
        this.playerStats.equipment.weapon = ItemFactory.getItem("dagger");
        this.playerStats.equipment.armor = ItemFactory.getItem("leatherArmor");
        
        this.map = new MainMenu(this);
        this.maps = [];
        
        this.console = new Console(this);
        //this.console.addMessage("Hello adventurer! wellcome to the world of Champions of Rogue.");
        //this.console.addMessage("Press the keys 'QWEADZXC' to move", [255, 0, 0]);
        
        //this.playerStats.render(this.renderer);
        
        this.loopGame();
    }
    
    createStats() {
        this.stats = new Stats();
        this.stats.showPanel(1);
        document.body.appendChild( this.stats.dom );
    }
    
    isPointInPanel(x, y, panel) {
        return (x >= panel[0] && y >= panel[1] && x < panel[2] && y < panel[3]);
    }
    
    onMouseMove(x, y) {
        if (this.itemDesc) return;
        
        x = (x / this.renderer.pixelSize[0]) << 0;
        y = (y / this.renderer.pixelSize[1]) << 0;
        
        if (this.isPointInPanel(x, y, this.panels.map)) {
            this.map.onMouseMove(x - this.panels.map[0], y - this.panels.map[1]);
        }else{
            this.map.onMouseMove(null);
        }

        if (this.isPointInPanel(x, y, this.panels.inventory)) {
            this.playerStats.onMouseMove(x - this.panels.inventory[0], y - this.panels.inventory[1]);
        }else{
            this.playerStats.onMouseMove(null);
        }
    }
    
    onMouseHandler(x, y, stat) {
        x = (x / this.renderer.pixelSize[0]) << 0;
        y = (y / this.renderer.pixelSize[1]) << 0;
        
        if (this.itemDesc && stat == 1) {
            if (this.isPointInPanel(x, y, this.panels.itemDesc)) {
                this.onItemPanelAction(x - this.panels.itemDesc[0], y - this.panels.itemDesc[1]);
                return;
            }else{
                this.itemDesc = null;
                this.onMouseMove(x, y);
                return;
            }
        }
        
        if (this.isPointInPanel(x, y, this.panels.map)) {
            this.map.onMouseHandler(x - this.panels.map[0], y - this.panels.map[1], stat);
        }
        
        if (this.isPointInPanel(x, y, this.panels.inventory)) {
            this.playerStats.onMouseHandler(x - this.panels.inventory[0], y - this.panels.inventory[1], stat);
        }
    }
    
    onItemPanelAction(x, y) {
        if (y != 14) return;
        
        if (x >= 2 && x < 13) {
            this.playerStats.useItem(this.itemDesc);
        }else  if (x >= 26 && x < 37) {
            this.playerStats.dropItem(this.itemDesc);
        }
    }
    
    gotoLevel(level, dir) {
        this.map.active = false;
        
        if (this.maps[level - 1]) {
            this.map = this.maps[level - 1];
        }else{
            this.map = new Map(this, level);
            this.maps[level - 1] = this.map;
        }
        
        this.map.active = true;
        
        if (dir == 1) {
            this.map.player.x = this.map.stairsUp.x;
            this.map.player.y = this.map.stairsUp.y;
            this.map.stairsUp.playerOnTile = true;
        }else if (dir == 0) {
            this.map.player.x = this.map.stairsDown.x;
            this.map.player.y = this.map.stairsDown.y;
            this.map.stairsDown.playerOnTile = true;
        }
        
        this.playerStats.render(this.renderer);
        this.console.render(this.renderer);
    }
    
    renderItemPanel() {
        if (!this.itemDesc){ return; }
        
        for (var x=10;x<49;x++) {
            for (var y=4;y<20;y++) {
                this.renderer.plot(x, y, this.panelTile);
            }
        }
        
        var msg = this.itemDesc.def.desc;
        msg = Utils.formatText(msg, 38);
        
        var title = this.itemDesc.def.name + ((this.itemDesc.amount > 1)? " (x" + this.itemDesc.amount + ")" : "");
        Utils.renderText(this.renderer, (30 - title.length / 2) << 0, 5, title, Colors.WHITE, Colors.DARK_BLUE);
        
        for (var i=0,m;m=msg[i];i++) {
            Utils.renderText(this.renderer, 11, 7+i, m, Colors.WHITE, Colors.DARK_BLUE);
        }
        
        Utils.renderText(this.renderer, 12, 18, "    USE    ", Colors.WHITE, Colors.BLUE);
        //Utils.renderText(this.renderer, 24, 18, "   THROW   ", Colors.WHITE, Colors.BLUE);
        Utils.renderText(this.renderer, 36, 18, "   DROP    ", Colors.WHITE, Colors.BLUE);
    }
    
    loopGame() {
        this.stats.begin();
        
        if (this.font.ready){
            this.map.render();
            this.renderItemPanel();
            this.renderer.render();
        }
        
        this.stats.end();
        
        if (this.restartGame) {
            this.newGame();
        }else{
            requestAnimationFrame(() => { this.loopGame(); });
        }
    }
}

module.exports = Game;