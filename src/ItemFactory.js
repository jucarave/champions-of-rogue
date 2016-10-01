'use strict';

var Prefabs = require('./Prefabs');

var types = {
    POTION: 0
};

module.exports = {
    types: types,
    
    items: {
        redPotion: { code: 'RED_POTION', name: 'Red potion', tile: null, type: types.POTION, desc: 'Red potion, unknown effect', discovered: false, stackable: true }
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