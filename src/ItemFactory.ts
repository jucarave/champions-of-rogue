import { TilePrefab, TilesPrefabs } from './Prefabs';
import { ItemEffects } from './ItemEffects';
import { Instance } from './Instance';

enum ItemTypes {
    POTION = 0,
    GOLD = 1,
    WEAPON = 2,
    ARMOR = 3
};

interface ItemDefinition {
    code: string,
    tileCode: string,
    name: string,
    tile: TilePrefab,
    type: ItemTypes,
    desc: string,
    discovered: boolean,
    stackable: boolean,
    str: string,
    def: string,
    wear: string,
    effect: any
};

interface ItemData {
    [index: string]: ItemDefinition;
}

interface WorldItem {
    def: ItemDefinition,
    amount: number,
    status: number
};

interface PotionDefinition {
    name: string,
    desc: string,
    effect: any
};

let ItemFactory = {
    items: <ItemData>{},

    potions: <Array<PotionDefinition>>[],

    loadData: function(items: any, potions: Array<any>) {
        this.items = {};
        for (let i in items) {
            if (i == "type") {
                this.items[i] = ItemTypes[items[i]];
            }else{
                this.items[i] = items[i];
            }
        }

        this.potions = [];
        for (let i=0;i<potions.length;i++) {
            let potion = potions[i];

            this.potions.push(potion);
        }
    },

    useItem: function (item: ItemDefinition, instance: Instance) {
        let msg: string = null;

        if (item.type == ItemTypes.POTION) {
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

            msg += ItemEffects.executeCommand(item.effect, { instance: instance });
        }

        return msg;
    },

    getItem: function (code: string, amount: number = 1): WorldItem {
        if (!this.items[code]) { throw new Error("Invalid item code: [" + code + "]"); }

        let item: ItemDefinition = this.items[code];
        if (!item.tile) {
            item.code = code;
            item.tile = TilesPrefabs.ITEMS[item.tileCode];
        }

        let ret: WorldItem = {
            amount: amount,
            def: item,
            status: 100
        };

        if (item.type == ItemTypes.WEAPON || item.type == ItemTypes.ARMOR) {
            ret.status = Math.min(60 + Math.floor(Math.random() * 40) + 1, 100);
        }

        return ret;
    }
};

export { ItemFactory, WorldItem, ItemTypes };