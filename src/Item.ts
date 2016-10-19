import { PlayerStats } from './PlayerStats';
import { WorldItem, ItemTypes } from './ItemFactory';
import { Instance } from './Instance';
import { Map } from './Map';
import { Vector2 } from './engine/Vector2';

class Item extends Instance {
    playerOnTile: boolean;

    constructor(x: number, y: number, map: Map, public item: WorldItem) {
        super(x, y, map, item.def.tile);

        this.name = item.def.name;

        if (item.def.type == ItemTypes.GOLD) {
            this.name = item.def.desc.replace(/X/g, item.amount.toString());
            if (item.amount > 1) { this.name += "s"; }
        }

        this.playerOnTile = false;

        this.discovered = false;
        this.inShadow = true;
        this.stopOnDiscover = true;
    }

    update() {
        if (this.item.def.discovered) {
            this.name = this.item.def.name;
        }

        this.inShadow = true;

        var p = this.map.player;
        if (p.x == this.x && p.y == this.y) {
            if (!this.playerOnTile && !p.movePath && PlayerStats.pickItem(this.item)) {
                this.destroy = true;
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

export { Item };