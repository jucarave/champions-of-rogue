'use strict';

var Prefabs = require('./Prefabs');
var ItemEffects = require('./ItemEffects');

var types = {
    POTION:     0,
    GOLD:       1,
    WEAPON:     2,
    ARMOR:      3
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
        
        gold: { tileCode: 'GOLD', name: 'Gold piece', tile: null, type: types.GOLD, desc: 'X Gold piece', stackable: true},
        
        dagger: { tileCode: 'DAGGER', name: 'Dagger', tile: null, type: types.WEAPON, desc: 'Standard iron dagger, easy to handle.', str: '3D5', wear: '1D6' },
        
        leatherArmor: { tileCode: 'LEATHER_ARMOR', name: 'Leather armor', tile: null, type: types.ARMOR, desc: 'It\'s light and brings medium protection.', def: '2D6', wear: '1D5' },
    },
    
    potions: [
        { name: 'Health Potion', desc: 'Restores 2D10+10 health points when drink.', effect: ItemEffects.items.hpPotion },
        { name: 'Life Potion', desc: 'Restores all health points when drink.', effect: ItemEffects.items.lifePotion },
        { name: 'Poison Potion', desc: 'Poisons the consumer by 1D3 for 10 turns.', effect: ItemEffects.items.poisonPotion },
        { name: 'Blind Potion', desc: 'Blinds the consumer by 2D8+15 turns.', effect: ItemEffects.items.blindPotion },
        { name: 'Paralysis Potion', desc: 'Paralyses the consumer by 2D10+10 turns.', effect: ItemEffects.items.paralysisPotion },
        { name: 'Invisibility Potion', desc: 'Makes the consumer invisible by 3D10+15 except for enemies he attacks.', effect: ItemEffects.items.invisibilityPotion },
        { name: 'Cure Potion', desc: 'Removes all damaging effects of the status.', effect: ItemEffects.items.curePotion },
        { name: 'Strength Potion', desc: 'Adds +3 Damage to the attack.', effect: ItemEffects.items.strengthPotion },
        { name: 'Defense Potion', desc: 'Adds +3 to the overall defense.', effect: ItemEffects.items.defensePotion },
        { name: 'Speed Potion', desc: 'Adds +1 to the speed.', effect: ItemEffects.items.speedPotion },
    ],
    
    useItem: function(item, instance) {
        var msg = null;
        
        if (item.type == types.POTION) {
            msg = "";
            if (!item.discovered) {
                var index = (Math.random() * this.potions.length) << 0;
                var potion = this.potions[index];
                this.potions.splice(index, 1);
                
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
        
        if (item.type == types.WEAPON || item.type == types.ARMOR) {
            ret.status = Math.min(60 + Math.floor(Math.random() * 40) + 1, 100);
        }
        
        return ret;
    }
};