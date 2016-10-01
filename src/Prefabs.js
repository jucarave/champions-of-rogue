'use strict';

var Effects = require('./engine/Effects');
var Colors = require('./Colors');
var Tiles = require('./Tiles');

function getTile(renderer, backColor, frontColor, tile, effect, solid=false) {
    return {
        light: renderer.getTile(backColor, frontColor, tile, effect),
        dark: renderer.getTile(backColor.multiply(0.1, 0.1, 0.5), frontColor.multiply(0.1, 0.1, 0.5), tile, effect),
        solid: solid
    };
}

module.exports = {
    TILES: {},
    ITEMS: {},
    
    init: function(renderer) {
        var t = this.TILES;
        var i = this.ITEMS;
        
        // Blank
        t.BLANK = getTile(renderer, Colors.BLACK, Colors.BLACK, Tiles.BLANK, Effects.NONE);
        
        // Walls
        t.WALL = getTile(renderer, Colors.GRAY, Colors.WHITE, Tiles.HASH, Effects.NONE, true);
        
        // Floors
        t.FLOOR = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.DOT_C, Effects.NONE);
        t.WATER = getTile(renderer, Colors.AQUA, Colors.WHITE, Tiles.WATER, Effects.WATER);
        t.WATER_DEEP = getTile(renderer, Colors.BLUE, Colors.WHITE, Tiles.WATRD, Effects.WATER);
        
        // Items
        i.RED_POTION = getTile(renderer, Colors.BLACK, Colors.RED, Tiles.EXCLA);
        
        // Player
        this.PLAYER = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.PLAYR, Effects.NONE);
    }
};