'use strict';

var Prefabs = require('./Prefabs');
var Utils = require('./Utils');

module.exports = {
    enemies: {
        kobold: { tileCode: 'KOBOLD', name: 'Kobold', hp: '1D6+6', str: '2D4', def: '2D4', spd: 2, luk: 15, canSwim: false, viewDistance: 5, tile: null }
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