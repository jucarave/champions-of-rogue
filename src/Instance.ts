import { TilePrefab } from './Prefabs';
import { Map } from './Map';

abstract class Instance {
    name: string;

    destroy: boolean;
    discovered: boolean;
    inShadow: boolean;
    stopOnDiscover: boolean;
    visibleInShadow: boolean;

    constructor(public x: number, public y: number, public map: Map, public tile: TilePrefab) {
        this.name = '';
        this.destroy = false;
        this.discovered = false;
        this.inShadow = false;
        this.stopOnDiscover = false;
        this.visibleInShadow = false;
    }

    moveTo(xTo: number, yTo: number): boolean {
        this.x += xTo;
        this.y += yTo;

        return true;
    };

    update() {}
}

export { Instance };