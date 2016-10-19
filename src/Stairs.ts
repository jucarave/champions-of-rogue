import { TilePrefab } from './Prefabs';
import { Instance } from './Instance';
import { Map } from './Map';
import { Vector2 } from './engine/Vector2';

class Stairs extends Instance {
    dir: number;

    playerOnTile: boolean;

    constructor(x: number, y: number, map: Map, public target: number, tile: TilePrefab) {
        super(x, y, map, tile);

        this.target = target;
        this.dir = (target - map.level > 0) ? 1 : 0;
        this.name = (this.dir == 1) ? "Stairs down" : "Stairs up";

        this.playerOnTile = true;

        this.discovered = false;
        this.inShadow = true;
        this.stopOnDiscover = true;
        this.visibleInShadow = true;
    }

    update() {
        this.inShadow = true;

        var p = this.map.player;
        if (p.x == this.x && p.y == this.y) {
            if (!this.playerOnTile && !p.movePath) {
                this.map.game.gotoLevel(this.target, this.dir);
                return;
            }

            this.playerOnTile = true;
        } else if (this.playerOnTile) {
            this.playerOnTile = false;
        }

        if (this.map.map[this.y][this.x].visible == 2) {
            this.inShadow = false;

            let mp: Vector2 = this.map.mousePosition;
            if (mp.x == this.x && mp.y == this.y) {
                this.map.tileDescription = this.name;
            }
        } else if (this.map.map[this.y][this.x].visible <= 1) {
            this.discovered = false;
        }
    }
}

export { Stairs };