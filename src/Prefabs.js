'use strict';

var Effects = require('./engine/Effects');
var Colors = require('./Colors');
var Tiles = require('./Tiles');

module.exports = {
    TILES: {},
    
    init: function(renderer) {
        var t = this.TILES;
        
        // Blank
        t.BLANK = renderer.getTile(Colors.BLACK, Colors.BLACK, Tiles.BLANK, Effects.NONE);
        
        // Walls
        t.WALL = renderer.getTile(Colors.GRAY, Colors.WHITE, Tiles.HASH, Effects.NONE);
        
        // Floors
        t.FLOOR = renderer.getTile(Colors.BLACK, Colors.WHITE, Tiles.DOT_C, Effects.NONE);
        t.WATER = renderer.getTile(Colors.AQUA, Colors.WHITE, Tiles.WATER, Effects.WATER);
        t.WATER_DEEP = renderer.getTile(Colors.BLUE, Colors.WHITE, Tiles.WATRD, Effects.WATER);
        
        // Player
        
        this.PLAYER = renderer.getTile(Colors.BLACK, Colors.WHITE, Tiles.PLAYR, Effects.NONE);
    }
};