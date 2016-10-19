import { Instance } from './Instance';
import { EnemyFactory, WorldEnemy } from './EnemyFactory';
import { Map } from './Map';
import { TilePrefab, TileTypes, Colors } from './Prefabs';
import { Player } from './Player';
import { Vector2 } from './engine/Vector2';
import { PlayerStats } from './PlayerStats';
import { Utils } from './Utils';

class Enemy extends Instance {
    target: Player;
    targetLastPosition: Vector2;
    targetPath: Array<number>;
    
    attackedByPlayer: boolean;

    movementBudget: number;

    constructor(x: number, y: number, map: Map, public enemy: WorldEnemy) {
        super(x, y, map, enemy.def.tile);
        
        this.name = enemy.def.name;

        this.target = null;
        this.targetLastPosition = { x: 0, y: 0 };
        this.targetPath = null;
        
        this.discovered = false;
        this.inShadow = true;
        this.stopOnDiscover = true;

        this.attackedByPlayer = false;

        this.movementBudget = 0.0;
    }

    receiveDamage(dmg: number): boolean {
        this.attackedByPlayer = true;

        this.enemy.hp[0] -= dmg;
        if (this.enemy.hp[0] <= 0) {
            this.destroy = true;
            return true;
        }

        return false;
    }

    moveTo(xTo: number, yTo: number): boolean {
        let tile = this.map.getTileAt(this.x + xTo, this.y + yTo);
        let solid: boolean = (tile && tile.type == TileTypes.WALL);

        if (!this.enemy.def.canSwim && tile.type == TileTypes.WATER_DEEP) {
            solid = true;
        }

        let ins: Instance = this.map.getInstanceAt(this.x + xTo, this.y + yTo);
        if (ins && (<Enemy>ins).enemy) {
            solid = true;
        }

        if (!solid) {
            return super.moveTo(xTo, yTo);
        }

        return false;
    }

    followPath() {
        if (!this.targetPath || this.targetPath.length == 0) { return; }

        let xTo: number = this.targetPath.shift() - this.x;
        let yTo: number = this.targetPath.shift() - this.y;

        this.moveTo(xTo, yTo);

        if (this.targetPath.length == 0) {
            this.targetPath = null;
        }
    }

    wander() {
        let shouldMove: boolean = (Math.random() * 10) < 7;
        if (shouldMove) {
            let xTo: number = Math.round((Math.random() * 2.0) - 1.0);
            let yTo: number = Math.round((Math.random() * 2.0) - 1.0);

            if (xTo != 0 || yTo != 0) {
                this.moveTo(xTo, yTo);
            }
        }
    }

    checkAttack(): boolean {
        if (Math.abs(this.target.x - this.x) > 1 || Math.abs(this.target.y - this.y) > 1) {
            return false;
        }

        let player = PlayerStats;
        let missed: boolean = (Math.random() * 100) < player.luk;
        let msg: string = this.enemy.def.name + " attacks you";

        if (missed) {
            this.map.game.console.addMessage(msg + ", missed!", Colors.GREEN);
            return false;
        }

        let str: number = Utils.rollDice(this.enemy.def.str);
        let def: number = Utils.rollDice(player.getDef());
        let dmg: number = Math.max(str - def, 1);

        this.map.game.console.addMessage(msg + ", hit by " + dmg + " points", Colors.RED);
        player.receiveDamage(dmg);

        return true;
    }

    updateMovement(): boolean {
        if (this.target) {
            if (this.checkAttack()) {
                return true;
            }

            if (this.target.x != this.targetLastPosition.x || this.target.y != this.targetLastPosition.y) {
                this.targetLastPosition.x = this.target.x;
                this.targetLastPosition.y = this.target.y;

                this.targetPath = this.map.getPath(this.x, this.y, this.target.x, this.target.y);
                this.targetPath.pop();
                this.targetPath.pop();
            }

            this.followPath();
        } else {
            this.wander();
        }

        return false;
    }

    update(): boolean {
        if (this.destroy) return false;

        this.inShadow = true;

        let p: Player = this.map.player;

        if (this.map.map[this.y][this.x].visible == 2) {
            this.inShadow = false;
            let playerInvisible: boolean = (PlayerStats.invisible && !this.attackedByPlayer);
            if (!this.target && !playerInvisible && (Math.abs(p.x - this.x) <= this.enemy.def.viewDistance || Math.abs(p.y - this.y) <= this.enemy.def.viewDistance)) {
                this.target = p;
            }

            let mp: Vector2 = this.map.mousePosition;
            if (mp.x == this.x && mp.y == this.y) {
                this.map.tileDescription = this.name;
            }
        } else if (this.map.map[this.y][this.x].visible <= 1) {
            this.discovered = false;
        }

        if (this.map.playerTurn) { return false; }

        var turns = this.enemy.def.spd / PlayerStats.spd + this.movementBudget;
        this.movementBudget = turns - (turns << 0);
        turns = turns << 0;

        for (var i = 0; i < turns; i++) {
            if (this.updateMovement()) { return false; }
        }

        return true;
    }
};

export { Enemy };