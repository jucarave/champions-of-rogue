'use strict';

var Prefabs = require('./Prefabs');
var ItemEffects = require('./ItemEffects');

var types = {
    POTION: 0,
    GOLD: 1
};

module.exports = {
    types: types,
    
    items: {
        redPotion: { tileCode: 'RED_POTION', name: 'Red potion', tile: null, type: types.POTION, desc: 'Red potion, unknown effect', discovered: false, stackable: true },
        greenPotion: { tileCode: 'GREEN_POTION', name: 'Green potion', tile: null, type: types.POTION, desc: 'Green potion, unknown effect', discovered: false, stackable: true },
        bluePotion: { tileCode: 'BLUE_POTION', name: 'Blue potion', tile: null, type: types.POTION, desc: 'Blue potion, unknown effect', discovered: false, stackable: true },
        yellowPotion: { tileCode: 'YELLOW_POTION', name: 'Yellow potion', tile: null, type: types.POTION, desc: 'Yellow potion, unknown effect', discovered: false, stackable: true },
        aquaPotion: { tileCode: 'AQUA_POTION', name: 'Aqua potion', tile: null, type: types.POTION, desc: 'Aqua potion, unknown effect', discovered: false, stackable: true },
        purplePotion: { tileCode: 'PURPLE_POTION', name: 'Purple potion', tile: null, type: types.POTION, desc: 'Purple potion, unknown effect', discovered: false, stackable: true },
        whitePotion: { tileCode: 'WHITE_POTION', name: 'White potion', tile: null, type: types.POTION, desc: 'White potion, unknown effect', discovered: false, stackable: true },
        tanPotion: { tileCode: 'TAN_POTION', name: 'Tan potion', tile: null, type: types.POTION, desc: 'Tan potion, unknown effect', discovered: false, stackable: true },
        orangePotion: { tileCode: 'ORANGE_POTION', name: 'Orange potion', tile: null, type: types.POTION, desc: 'Orange potion, unknown effect', discovered: false, stackable: true },
        
        gold: { tileCode: 'GOLD', name: 'Gold piece', tile: null, type: types.GOLD, desc: 'X Gold piece', stackable: true}
    },
    
    potions: [
        { name: 'Health Potion', desc: 'Restores 3D10 health points when drink.', effect: ItemEffects.items.hpPotion }
    ],
    
    useItem: function(item, instance) {
        var msg = null;
        
        if (item.type == types.POTION) {
            msg = "";
            if (!item.discovered) {
                var index = (Math.random() * this.potions.length) << 0;
                var potion = this.potions[index];
                
                item.name = potion.name;
                item.desc = potion.desc;
                item.effect = potion.effect;
                item.discovered = true;
                
                msg = "It was a " + item.name + ". ";
            }
            
            msg += ItemEffects.executeCommand(item.effect, {instance: instance});
        }
        
        return msg;
    },
    
    getItem: function(code, amount = 1) {
        if (!this.items[code]){ throw new Error("Invalid item code: [" + code + "]"); }
        
        var item = this.items[code];
        if (!item.tile){ 
            item.code = code;
            item.tile = Prefabs.ITEMS[item.tileCode]; 
        }
        
        var ret = {
            amount: amount,
            def: item
        };
        
        return ret;
    }
};