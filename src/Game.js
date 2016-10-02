/*globals Stats*/

'use strict';

var Renderer = require('./engine/Renderer');
var Prefabs = require('./Prefabs');
var Map = require('./Map');
var Console = require('./Console');
var Input = require('./engine/Input');

class Game {
    constructor() {
        this.renderer = new Renderer(850, 480, document.getElementById("divGame"));
        this.resolution = [85, 30];
        
        this.font = this.renderer.setFontTexture('img/ascii-rl-font.png');
        Prefabs.init(this.renderer);
        
        this.playerStats = null;
        this.map = null;
        this.console = null;
        
        this.panels = {
            map: [0, 2, 60, 25],
            inventory: [60, 12, 85, 20]
        };
        
        this.createStats();
        this.newGame();
    }
    
    newGame() {
        this.playerStats = require('./Stats');
        this.playerStats.game = this;
        
        this.map = new Map(this);
        
        this.console = new Console(this);
        this.console.addMessage("Hello adventurer! wellcome to the world of Champions of Rogue.");
        this.console.addMessage("Press the keys 'QWEADZXC' to move", [255, 0, 0]);
        
        this.playerStats.render(this.renderer);
        
        Input.addMouseMoveListener((x, y) => { this.onMouseMove(x, y); });
        Input.addMouseDownListener((x, y, stat) => { this.onMouseHandler(x, y, stat); });
        
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
        
        if (this.isPointInPanel(x, y, this.panels.map)) {
            this.map.onMouseHandler(x - this.panels.map[0], y - this.panels.map[1], stat);
        }
        
        if (this.isPointInPanel(x, y, this.panels.inventory)) {
            this.playerStats.onMouseHandler(x - this.panels.inventory[0], y - this.panels.inventory[1], stat);
        }
    }
    
    loopGame() {
        this.stats.begin();
        
        if (this.font.ready){
            this.map.render();
            this.renderer.render();
        }
        
        this.stats.end();
        
        requestAnimationFrame(() => { this.loopGame(); });
    }
}

module.exports = Game;