import { TilePrefab, TilesPrefabs } from './Prefabs';
import { Utils } from './Utils';

interface EnemyDefinition {
    tileCode: string,
    name: string,
    hp: string,
    str: string,
    def: string,
    spd: number,
    luk: number,
    viewDistance: number,
    canSwim: boolean,
    tile: TilePrefab
};

interface Enemies {
    [index: string]: EnemyDefinition
};

interface WorldEnemy {
    def: EnemyDefinition,
    hp: Array<number>
}

let EnemyFactory = {
    enemies: <Enemies>{
        rat: { tileCode: 'RAT', name: 'Giant rat', hp: '2D3+5', str: '1D4', def: '1D3', spd: 10, luk: 10, canSwim: false, viewDistance: 7, tile: null },
        spider: { tileCode: 'SPIDER', name: 'Spider', hp: '2D3+8', str: '1D10+2', def: '1D5', spd: 12, luk: 10, canSwim: false, viewDistance: 5, tile: null },
        kobold: { tileCode: 'KOBOLD', name: 'Kobold', hp: '3D3+8', str: '2D4', def: '2D4', spd: 10, luk: 15, canSwim: false, viewDistance: 5, tile: null },
        imp: { tileCode: 'IMP', name: 'Imp', hp: '2D4+7', str: '2D4+2', def: '2D6', spd: 10, luk: 15, canSwim: true, viewDistance: 7, tile: null },
        goblin: { tileCode: 'GOBLIN', name: 'Goblin', hp: '4D4+4', str: '3D4+2', def: '3D6', spd: 10, luk: 20, canSwim: false, viewDistance: 7, tile: null },
        zombie: { tileCode: 'ZOMBIE', name: 'Zombie', hp: '2D4+7', str: '2D5', def: '2D4', spd: 8, luk: 10, canSwim: false, viewDistance: 3, tile: null },
        ogre: { tileCode: 'OGRE', name: 'Ogre', hp: '4D5+5', str: '3D5+4', def: '3D4', spd: 8, luk: 15, canSwim: false, viewDistance: 5, tile: null },
        rogue: { tileCode: 'ROGUE', name: 'Rogue', hp: '4D5+7', str: '2D6+3', def: '2D6', spd: 10, luk: 20, canSwim: true, viewDistance: 10, tile: null },

        beggar: { tileCode: 'BEGGAR', name: 'Beggar', hp: '3D4+4', str: '2D4+2', def: '1D6', spd: 13, luk: 10, canSwim: true, viewDistance: 10, tile: null },
        shadow: { tileCode: 'SHADOW', name: 'Shadow', hp: '4D5+7', str: '2D6+3', def: '2D6', spd: 15, luk: 15, canSwim: true, viewDistance: 10, tile: null },
        thief: { tileCode: 'THIEF', name: 'Thief', hp: '3D5+6', str: '3D4+4', def: '3D3', spd: 15, luk: 20, canSwim: true, viewDistance: 10, tile: null },
        caosKnight: { tileCode: 'CAOS_KNIGHT', name: 'Caos knight', hp: '4D6+8', str: '2D10+5', def: '3D7+4', spd: 10, luk: 20, canSwim: true, viewDistance: 10, tile: null },
        lizardWarrior: { tileCode: 'LIZARD_WARRIOR', name: 'Lizard warrior', hp: '4D6+6', str: '2D7+5', def: '2D8', spd: 15, luk: 25, canSwim: true, viewDistance: 10, tile: null },
        ophidian: { tileCode: 'OPHIDIAN', name: 'Ophidian', hp: '4D8+8', str: '3D6+3', def: '3D6+3', spd: 15, luk: 25, canSwim: true, viewDistance: 10, tile: null },
        caosServant: { tileCode: 'CAOS_SERVANT', name: 'Caos servant', hp: '3D5+6', str: '3D3+3', def: '2D6', spd: 13, luk: 30, canSwim: true, viewDistance: 10, tile: null },
        wyvernKnight: { tileCode: 'WYVERN_KNIGHT', name: 'Wyvern knight', hp: '5D8+10', str: '4D6+5', def: '4D6+3', spd: 15, luk: 30, canSwim: true, viewDistance: 10, tile: null },
        caosLord: { tileCode: 'CAOS_LORD', name: 'Caos Lord', hp: '5D10+10', str: '4D10+7', def: '4D6+5', spd: 15, luk: 35, canSwim: true, viewDistance: 10, tile: null },

        sodi: { tileCode: 'SODI', name: 'Sodi', hp: '5D5+11', str: '2D6+3', def: '2D6', spd: 15, luk: 40, canSwim: true, viewDistance: 10, tile: null },
    },

    getEnemy: function (code: string): WorldEnemy {
        if (!this.enemies[code]) { throw new Error("Invalid enemy code: [" + code + "]"); }

        let enemy: EnemyDefinition = this.enemies[code];
        if (!enemy.tile) { enemy.tile = TilesPrefabs.ENEMIES[enemy.tileCode]; }

        let hp: number = Utils.rollDice(enemy.hp);

        let ret: WorldEnemy = {
            def: enemy,
            hp: [hp, hp]
        };

        return ret;
    }
};

export { EnemyFactory, WorldEnemy };