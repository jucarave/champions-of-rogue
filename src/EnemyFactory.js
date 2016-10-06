'use strict';

var Prefabs = require('./Prefabs');
var Utils = require('./Utils');

module.exports = {
    enemies: {
        rat: { tileCode: 'RAT', name: 'Giant rat', hp: '2D3', str: '1D4', def: '1D3', spd: 2, luk: 10, canSwim: false, viewDistance: 7, tile: null },
        spider: { tileCode: 'SPIDER', name: 'Spider', hp: '2D3+3', str: '1D10+2', def: '1D5', spd: 3, luk: 10, canSwim: false, viewDistance: 5, tile: null },
        kobold: { tileCode: 'KOBOLD', name: 'Kobold', hp: '1D6+6', str: '2D4', def: '2D4', spd: 2, luk: 15, canSwim: false, viewDistance: 5, tile: null },
        imp: { tileCode: 'IMP', name: 'Imp', hp: '2D4+7', str: '2D4+2', def: '2D6', spd: 2, luk: 15, canSwim: true, viewDistance: 7, tile: null },
        goblin: { tileCode: 'GOBLIN', name: 'Goblin', hp: '4D4+4', str: '3D4+2', def: '3D6', spd: 2, luk: 20, canSwim: false, viewDistance: 7, tile: null },
        zombie: { tileCode: 'ZOMBIE', name: 'Zombie', hp: '2D4+7', str: '2D5', def: '2D4', spd: 1, luk: 10, canSwim: false, viewDistance: 3, tile: null },
        ogre: { tileCode: 'OGRE', name: 'Ogre', hp: '4D5+5', str: '3D5+4', def: '3D4', spd: 1, luk: 15, canSwim: false, viewDistance: 5, tile: null },
        rogue: { tileCode: 'ROGUE', name: 'Rogue', hp: '4D5+7', str: '2D6+3', def: '2D6', spd: 2, luk: 20, canSwim: true, viewDistance: 10, tile: null },
    },
    
    getEnemy: function(code) {
        if (!this.enemies[code]){ throw new Error("Invalid enemy code: [" + code + "]"); }
        
        var enemy = this.enemies[code];
        if (!enemy.tile){ enemy.tile = Prefabs.ENEMIES[enemy.tileCode]; }
        
        var hp = Utils.rollDice(enemy.hp);
        
        var ret = {
            def: enemy,
            hp: [hp, hp]
        };
        
        return ret;
    }
};