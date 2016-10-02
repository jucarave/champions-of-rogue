'use strict';

var Prefabs = require('./Prefabs');

var types = {
    POTION: 0
};

module.exports = {
    types: types,
    
    items: {
        redPotion: { code: 'RED_POTION', name: 'Red potion', tile: null, type: types.POTION, desc: 'Red potion, unknown effect', discovered: false, stackable: true },
        greenPotion: { code: 'GREEN_POTION', name: 'Green potion', tile: null, type: types.POTION, desc: 'Green potion, unknown effect', discovered: false, stackable: true },
        bluePotion: { code: 'BLUE_POTION', name: 'Blue potion', tile: null, type: types.POTION, desc: 'Blue potion, unknown effect', discovered: false, stackable: true },
        yellowPotion: { code: 'YELLOW_POTION', name: 'Yellow potion', tile: null, type: types.POTION, desc: 'Yellow potion, unknown effect', discovered: false, stackable: true },
        aquaPotion: { code: 'AQUA_POTION', name: 'Aqua potion', tile: null, type: types.POTION, desc: 'Aqua potion, unknown effect', discovered: false, stackable: true },
        purplePotion: { code: 'PURPLE_POTION', name: 'Purple potion', tile: null, type: types.POTION, desc: 'Purple potion, unknown effect', discovered: false, stackable: true },
        whitePotion: { code: 'WHITE_POTION', name: 'White potion', tile: null, type: types.POTION, desc: 'White potion, unknown effect', discovered: false, stackable: true },
        tanPotion: { code: 'TAN_POTION', name: 'Tan potion', tile: null, type: types.POTION, desc: 'Tan potion, unknown effect', discovered: false, stackable: true },
        orangePotion: { code: 'ORANGE_POTION', name: 'Orange potion', tile: null, type: types.POTION, desc: 'Orange potion, unknown effect', discovered: false, stackable: true }
    },
    
    getItem: function(code) {
        if (!this.items[code]){ throw new Error("Invalid item code: [" + code + "]"); }
        
        var item = this.items[code];
        if (!item.tile){ item.tile = Prefabs.ITEMS[item.code]; }
        
        var ret = {
            amount: 1,
            def: item
        };
        
        return ret;
    }
};