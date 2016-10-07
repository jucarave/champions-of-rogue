'use strict';

var Effects = require('./engine/Effects');
var Colors = require('./Colors');
var Tiles = require('./Tiles');

var types = {
    GROUND: 0,
    WALL: 1,
    WATER: 2,
    WATER_DEEP: 3
};

function getTile(renderer, backColor, frontColor, tile, effect, type=types.GROUND) {
    return {
        light: renderer.getTile(backColor, frontColor, tile, effect),
        dark: renderer.getTile(backColor.multiply(0.1, 0.1, 0.5), frontColor.multiply(0.1, 0.1, 0.5), tile, effect),
        type: type
    };
}

module.exports = {
    types: types,
    
    TILES: {},
    ITEMS: {},
    ENEMIES: {},
    
    init: function(renderer) {
        var t = this.TILES;
        var i = this.ITEMS;
        var e = this.ENEMIES;
        
        // Blank
        t.BLANK = getTile(renderer, Colors.BLACK, Colors.BLACK, Tiles.BLANK, Effects.NONE);
        
        // Walls
        t.WALL = getTile(renderer, Colors.GRAY, Colors.WHITE, Tiles.HASH, Effects.NONE, types.WALL);
        
        // Floors
        t.FLOOR = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.DOT_C, Effects.NONE);
        t.WATER = getTile(renderer, Colors.AQUA, Colors.WHITE, Tiles.WATER, Effects.WATER, types.WATER);
        t.WATER_DEEP = getTile(renderer, Colors.BLUE, Colors.WHITE, Tiles.WATRD, Effects.WATER, types.WATER_DEEP);
        
        // Stairs
        t.STAIRS_UP = getTile(renderer, Colors.BLACK, Colors.YELLOW, Tiles.STRUP);
        t.STAIRS_DOWN = getTile(renderer, Colors.BLACK, Colors.YELLOW, Tiles.STRDN);
        
        // Gold
        i.GOLD = getTile(renderer, Colors.BLACK, Colors.GOLD, Tiles.MONEY, Effects.NONE);
        
        // Items
        i.RED_POTION = getTile(renderer, Colors.BLACK, Colors.RED, Tiles.EXCLA);
        i.GREEN_POTION = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles.EXCLA);
        i.BLUE_POTION = getTile(renderer, Colors.BLACK, Colors.BLUE, Tiles.EXCLA);
        i.YELLOW_POTION = getTile(renderer, Colors.BLACK, Colors.YELLOW, Tiles.EXCLA);
        i.AQUA_POTION = getTile(renderer, Colors.BLACK, Colors.AQUA, Tiles.EXCLA);
        i.WHITE_POTION = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.EXCLA);
        i.PURPLE_POTION = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles.EXCLA);
        i.TAN_POTION = getTile(renderer, Colors.BLACK, Colors.TAN, Tiles.EXCLA);
        i.ORANGE_POTION = getTile(renderer, Colors.BLACK, Colors.ORANGE, Tiles.EXCLA);
        
        // Weapons
        i.DAGGER = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.MINUS);
        i.SWORD = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.SLASH);
        i.LONG_SWORD = getTile(renderer, Colors.BLACK, Colors.AQUA, Tiles.SLASH);
        i.MACE = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.UNDER);
        i.SPEAR = getTile(renderer, Colors.BLACK, Colors.BROWN, Tiles.SLASH);
        i.AXE = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles.MINUS);
        
        // Armors
        i.LEATHER_ARMOR = getTile(renderer, Colors.BLACK, Colors.BROWN, Tiles.SQBRO);
        i.SCALE_MAIL = getTile(renderer, Colors.BLACK, Colors.GRAY, Tiles.SQBRO);
        i.CHAIN_MAIL = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.SQBRO);
        i.PLATE_ARMOR = getTile(renderer, Colors.BLACK, Colors.GOLD, Tiles.SQBRO);
        
        // Enemies
        e.RAT = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.r);
        e.SPIDER = getTile(renderer, Colors.BLACK, Colors.GRAY, Tiles.s);
        e.KOBOLD = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles.k);
        e.IMP = getTile(renderer, Colors.BLACK, Colors.RED, Tiles.i);
        e.GOBLIN = getTile(renderer, Colors.BLACK, Colors.AQUA, Tiles.g);
        e.ZOMBIE = getTile(renderer, Colors.BLACK, Colors.RED, Tiles.z);
        e.OGRE = getTile(renderer, Colors.BLACK, Colors.BROWN, Tiles.o);
        e.ROGUE = getTile(renderer, Colors.BLACK, Colors.RED, Tiles.R);
        e.BEGGAR = getTile(renderer, Colors.BLACK, Colors.BROWN, Tiles.b);
        e.SHADOW = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles.S);
        e.THIEF = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles.t);
        e.CAOS_KNIGHT = getTile(renderer, Colors.BLACK, Colors.RED, Tiles.K);
        e.LIZARD_WARRIOR = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles.l);
        e.OPHIDIAN = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles.O);
        e.CAOS_SERVANT = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles.C);
        e.WYVERN_KNIGHT = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles.W);
        e.CAOS_LORD = getTile(renderer, Colors.BLACK, Colors.RED, Tiles.L);
        e.SODI = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles.PLAYR);
        
        // Player
        this.PLAYER = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.PLAYR, Effects.NONE);
    }
};