/*globals Stats*/

'use strict';

var Renderer = require('./engine/Renderer');
var Effects = require('./engine/Effects');
var Colors = require('./Colors');
var Tiles = require('./Tiles');

class Game {
    constructor() {
        this.renderer = new Renderer(850, 480, document.getElementById("divGame"));
        
        this.font = this.renderer.setFontTexture('img/ascii-rl-font.png');
        
        this.createSimpleMap();
        
        this.createStats();
        
        this.drawScene();
    }
    
    createSimpleMap() {
        for (var x=0;x<85;x++) {
            for (var y=0;y<85;y++) {
                this.renderer.plot(x, y, this.renderer.getTile(Colors.BLACK, Colors.WHITE, Tiles.DOT_C));
            }
        }
        
        this.renderer.plot(5, 7, this.renderer.getTile(Colors.BLACK, Colors.WHITE, Tiles.PLAYR));
        
        var aqua = [
            [0, 0, 0, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 2, 2, 2, 1, 1, 0],
            [0, 1, 1, 2, 2, 2, 2, 2, 1, 1],
            [0, 1, 2, 2, 2, 2, 2, 2, 2, 1],
            [0, 1, 1, 2, 2, 2, 2, 2, 1, 1],
            [0, 0, 1, 1, 2, 2, 2, 1, 1, 0],
            [0, 0, 0, 1, 1, 1, 1, 1, 0, 0]
        ];
        
        for (x=0;x<10;x++) {
            for (y=0;y<7;y++){
                var t = aqua[y][x];
                if (t == 1) {
                    this.renderer.plot(6 + x, 4 + y, this.renderer.getTile(Colors.AQUA, Colors.WHITE, Tiles.WATER, Effects.WATER));
                }else if (t == 2) {
                    this.renderer.plot(6 + x, 4 + y, this.renderer.getTile(Colors.BLUE, Colors.WHITE, Tiles.WATRD, Effects.WATER));
                }
            }
        }
    }
    
    createStats() {
        this.stats = new Stats();
        this.stats.showPanel(1);
        document.body.appendChild( this.stats.dom );
    }
    
    drawScene() {
        this.stats.begin();
        
        if (this.font.ready){
            // Random characters colors party test!
            /*for (var i=0;i<500;i++) {
                this.renderer.plot((Math.random() * 85) << 0, (Math.random() * 30) << 0, this.renderer.getTile(this.colors[(Math.random() *255) << 0], this.colors[(Math.random() *255) << 0], (Math.random() * 78) << 0));
            }*/
            
            this.renderer.render();
        }
        
        this.stats.end();
        
        requestAnimationFrame(() => { this.drawScene(); });
    }
}

module.exports = Game;