import { Colors, TilesPrefabs } from './Prefabs';
import { PlayerStats } from './PlayerStats';
import { Input } from './engine/Input';
import { Utils } from './Utils';
import { Map } from './Map';
import { Vector2 } from './engine/Vector2';
import { Instance } from './Instance';
import { Enemy } from './Enemy';
import { WorldEnemy } from './EnemyFactory';

interface MousePosition extends Vector2 {
    stat: number
};

interface Key {
    [index: string] : number
};

class Player extends Instance {
    movePath: Array<number>;
    autoMoveDelay: number;
    moveWait: number;

    keys:Key = {
        UP: 0,
        LEFT: 0,
        DOWN: 0,
        RIGHT: 0,
        REST: 0
    };

    mouse: MousePosition;

    constructor(x: number, y: number, map: Map) {
        super(x, y, map, TilesPrefabs.PLAYER);

        this.movePath = null;
        this.autoMoveDelay = 0;
        this.moveWait = 4;

        this.keys = {
            UP: 0,
            LEFT: 0,
            DOWN: 0,
            RIGHT: 0,

            REST: 0
        };

        this.mouse = {
            x: -1,
            y: 0,
            stat: -1
        };

        Input.addKeyDownListener((keyCode: number, stat: number) => { this.handleKeyEvent(keyCode, stat); });
        Input.addMouseMoveListener((x: number, y: number) => { this.onMouseMove(x, y); });
        Input.addMouseDownListener((x: number, y: number, stat: number) => { this.onMouseHandler(x, y, stat); });
    }

    onMouseMove(x: number, y: number) {
        if (!this.map.active) return;
        this.mouse.x = x;
        this.mouse.y = y;
    }

    onMouseHandler(x: number, y: number, stat: number) {
        if (!this.map.active) return;
        if (this.mouse.stat == 2 && stat == 1) { return; }

        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.stat = stat;
    }

    handleKeyEvent(keyCode: number, stat: number) {
        if (PlayerStats.dead && keyCode == 13) {
            this.map.game.restartGame = true;
        }

        if (!this.map.active) return;
        let key: string = null;

        switch (keyCode) {
            case Input.keys.W:
            case Input.keys.UP:
                key = 'UP';
                break;

            case Input.keys.A:
            case Input.keys.LEFT:
                key = 'LEFT';
                break;

            case Input.keys.X:
            case Input.keys.DOWN:
                key = 'DOWN';
                break;

            case Input.keys.D:
            case Input.keys.RIGHT:
                key = 'RIGHT';
                break;

            case Input.keys.Q:
                this.handleKeyEvent(Input.keys.LEFT, stat);
                key = 'UP';
                break;

            case Input.keys.E:
                this.handleKeyEvent(Input.keys.RIGHT, stat);
                key = 'UP';
                break;

            case Input.keys.Z:
                this.handleKeyEvent(Input.keys.LEFT, stat);
                key = 'DOWN';
                break;

            case Input.keys.C:
                this.handleKeyEvent(Input.keys.RIGHT, stat);
                key = 'DOWN';
                break;

            case Input.keys.S:
            case Input.keys.SPACE:
                key = 'REST';
                break;
        }

        if (key == null) { return; }
        if (stat == 1 && this.keys[key] >= 2) {
            this.keys[key] -= 1;
            return;
        }

        this.keys[key] = stat;
    }

    act() {
        this.map.playerTurn = false;
        PlayerStats.updateStatus();
    }

    attackTo(ins: Enemy) {
        let enemy: WorldEnemy = ins.enemy;
        let missed: boolean = (Math.random() * 100) < enemy.def.luk;
        let msg: string = "You attack the " + enemy.def.name;

        if (missed) {
            return this.map.game.console.addMessage(msg + ", missed!", Colors.RED);
        }

        let str: number = Utils.rollDice(PlayerStats.getStr());
        let def: number = Utils.rollDice(enemy.def.def);
        let dmg: number = Math.max(str - def, 1);

        if (ins.receiveDamage(dmg)) {
            this.map.game.console.addMessage("You killed the " + enemy.def.name, Colors.WHITE);
        } else {
            this.map.game.console.addMessage(msg + ", hit by " + dmg + " points", Colors.GREEN);
        }

        PlayerStats.wearWeapon();
        this.act();
    }

    moveTo(xTo: number, yTo: number): boolean {
        if (PlayerStats.paralyzed) {
            this.act();
            return false;
        }

        if (this.map.isSolid(this.x + xTo, this.y + yTo)) { return; }

        let ins: Instance = this.map.getInstanceAt(this.x + xTo, this.y + yTo);
        if (ins && (<Enemy>ins).enemy) {
            this.attackTo(<Enemy>ins);
            this.movePath = null;
            return false;
        }

        super.moveTo(xTo, yTo);

        this.map.updateFOV(this.x, this.y);
        this.act();

        return true;
    }

    checkMovement() {
        let xTo: number = 0,
            yTo: number = 0;

        if (this.keys['UP'] == 1) {
            yTo = -1;
            this.keys['UP'] = this.moveWait;
        } else if (this.keys['DOWN'] == 1) {
            yTo = +1;
            this.keys['DOWN'] = this.moveWait;
        }

        if (this.keys['LEFT'] == 1) {
            xTo = -1;
            this.keys['LEFT'] = this.moveWait;
        } else if (this.keys['RIGHT'] == 1) {
            xTo = +1;
            this.keys['RIGHT'] = this.moveWait;
        }

        if (xTo != 0 || yTo != 0) {
            this.moveTo(xTo, yTo);
        }
    }

    followPath() {
        if (this.autoMoveDelay-- > 0) { return; }

        let xTo: number = this.movePath.shift() - this.x;
        let yTo: number = this.movePath.shift() - this.y;

        if (!this.moveTo(xTo, yTo)) { return; }
        this.autoMoveDelay = this.moveWait;

        if (this.movePath.length == 0) {
            this.movePath = null;
        }
    }

    updateMouse() {
        if (this.mouse.x == -1) { return; }

        this.map.game.onMouseMove(this.mouse.x, this.mouse.y);
        if (this.mouse.stat != 2) {
            this.map.game.onMouseHandler(this.mouse.x, this.mouse.y, this.mouse.stat);
            if (this.mouse.stat == 1) {
                this.mouse.stat = 2;
            }
        }

        this.mouse.x = -1;
    }

    checkSkip() {
        if (this.keys["REST"] == 1) {
            this.keys["REST"] = this.moveWait;
            this.act();
            return true;
        }

        return false;
    }

    update() {
        if (PlayerStats.dead) { return; }
        if (!this.map.playerTurn) { return; }

        if (this.checkSkip()) { return; }

        this.updateMouse();

        if (this.map.game.itemDesc) { return; }

        if (this.movePath) {
            this.followPath();
        } else {
            this.checkMovement();
        }

        this.map.updateView();
    }
}

export { Player };