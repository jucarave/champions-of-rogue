/*globals Stats*/

'use strict';

var Renderer = require('./engine/Renderer');
var Prefabs = require('./Prefabs');
var Map = require('./Map');
var Console = require('./Console');

class Game {
    constructor() {
        this.renderer = new Renderer(850, 480, document.getElementById("divGame"));
        this.resolution = [85, 30];
        
        this.font = this.renderer.setFontTexture('img/ascii-rl-font.png');
        Prefabs.init(this.renderer);
        
        this.map = new Map(this);
        
        this.console = new Console(this);
        this.console.addMessage("Hello adventurer! wellcome to the world of Champions of Rogue.");
        this.console.addMessage("Press the keys 'QWEADZXC' to move", [255, 0, 0]);
        
        this.createStats();
        
        this.drawScene();
    }
    
    createStats() {
        this.stats = new Stats();
        this.stats.showPanel(1);
        document.body.appendChild( this.stats.dom );
    }
    
    drawScene() {
        this.stats.begin();
        
        if (this.font.ready){
            this.map.render();
            this.renderer.render();
        }
        
        this.stats.end();
        
        requestAnimationFrame(() => { this.drawScene(); });
    }
}

module.exports = Game;