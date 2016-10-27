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

interface EnemiesData {
    [index: string]: EnemyDefinition
};

interface WorldEnemy {
    def: EnemyDefinition,
    hp: Array<number>
}

let EnemyFactory = {
    enemies: <EnemiesData>{},

    loadData(enemies: any) {
        this.enemies = {};
        for (let i in enemies) {
            this.enemies[i] = enemies[i];
        }

        console.log(this.enemies);
    },

    getEnemy(code: string): WorldEnemy {
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