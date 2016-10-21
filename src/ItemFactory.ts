import { TilePrefab, TilesPrefabs } from './Prefabs';
import { ItemEffects } from './ItemEffects';
import { Tile } from './engine/Tile';
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
    items: {
        redPotion: <ItemDefinition>{ tileCode: 'RED_POTION', name: 'Red potion', tile: null, type: ItemTypes.POTION, desc: 'Red potion, unknown effect', discovered: false, stackable: true },
        greenPotion: <ItemDefinition>{ tileCode: 'GREEN_POTION', name: 'Green potion', tile: null, type: ItemTypes.POTION, desc: 'Green potion, unknown effect', discovered: false, stackable: true },
        bluePotion: <ItemDefinition>{ tileCode: 'BLUE_POTION', name: 'Blue potion', tile: null, type: ItemTypes.POTION, desc: 'Blue potion, unknown effect', discovered: false, stackable: true },
        yellowPotion: <ItemDefinition>{ tileCode: 'YELLOW_POTION', name: 'Yellow potion', tile: null, type: ItemTypes.POTION, desc: 'Yellow potion, unknown effect', discovered: false, stackable: true },
        aquaPotion: <ItemDefinition>{ tileCode: 'AQUA_POTION', name: 'Aqua potion', tile: null, type: ItemTypes.POTION, desc: 'Aqua potion, unknown effect', discovered: false, stackable: true },
        purplePotion: <ItemDefinition>{ tileCode: 'PURPLE_POTION', name: 'Purple potion', tile: null, type: ItemTypes.POTION, desc: 'Purple potion, unknown effect', discovered: false, stackable: true },
        whitePotion: <ItemDefinition>{ tileCode: 'WHITE_POTION', name: 'White potion', tile: null, type: ItemTypes.POTION, desc: 'White potion, unknown effect', discovered: false, stackable: true },
        tanPotion: <ItemDefinition>{ tileCode: 'TAN_POTION', name: 'Tan potion', tile: null, type: ItemTypes.POTION, desc: 'Tan potion, unknown effect', discovered: false, stackable: true },
        orangePotion: <ItemDefinition>{ tileCode: 'ORANGE_POTION', name: 'Orange potion', tile: null, type: ItemTypes.POTION, desc: 'Orange potion, unknown effect', discovered: false, stackable: true },

        gold: <ItemDefinition>{ tileCode: 'GOLD', name: 'Gold piece', tile: null, type: ItemTypes.GOLD, desc: 'X Gold piece', stackable: true },

        dagger: <ItemDefinition>{ tileCode: 'DAGGER', name: 'Dagger', tile: null, type: ItemTypes.WEAPON, desc: 'Standard iron dagger, easy to handle.', str: '3D5', wear: '1D6' },
        shortSword: <ItemDefinition>{ tileCode: 'SWORD', name: 'Short sword', tile: null, type: ItemTypes.WEAPON, desc: 'Pending description', str: '3D6', wear: '1D4' },
        longSword: <ItemDefinition>{ tileCode: 'LONG_SWORD', name: 'Long sword', tile: null, type: ItemTypes.WEAPON, desc: 'Pending description', str: '3D10', wear: '1D5' },
        mace: <ItemDefinition>{ tileCode: 'MACE', name: 'Mace', tile: null, type: ItemTypes.WEAPON, desc: 'Pending description', str: '4D8', wear: '1D6' },
        spear: <ItemDefinition>{ tileCode: 'SPEAR', name: 'Spear', tile: null, type: ItemTypes.WEAPON, desc: 'Pending description', str: '3D8', wear: '1D4' },
        axe: <ItemDefinition>{ tileCode: 'AXE', name: 'Battle axe', tile: null, type: ItemTypes.WEAPON, desc: 'Pending description', str: '5D5', wear: '1D4' },

        leatherArmor: <ItemDefinition>{ tileCode: 'LEATHER_ARMOR', name: 'Leather armor', tile: null, type: ItemTypes.ARMOR, desc: 'It\'s light and brings medium protection.', def: '2D6', wear: '1D5' },
        scaleMail: <ItemDefinition>{ tileCode: 'SCALE_MAIL', name: 'Scale mail', tile: null, type: ItemTypes.ARMOR, desc: 'Pending description', def: '3D6', wear: '1D5' },
        chainMail: <ItemDefinition>{ tileCode: 'CHAIN_MAIL', name: 'Chain mail', tile: null, type: ItemTypes.ARMOR, desc: 'Pending description', def: '3D8', wear: '1D4' },
        plateArmor: <ItemDefinition>{ tileCode: 'PLATE_ARMOR', name: 'Plate armor', tile: null, type: ItemTypes.ARMOR, desc: 'Pending description', def: '4D8', wear: '1D3' }
    },

    potions: <Array<PotionDefinition>>[
        { name: 'Health Potion', desc: 'Restores 2D10+10 health points when drink.', effect: ItemEffects.items.hpPotion },
        { name: 'Life Potion', desc: 'Restores all health points when drink.', effect: ItemEffects.items.lifePotion },
        { name: 'Poison Potion', desc: 'Poisons the consumer by 1D3 for 10 turns.', effect: ItemEffects.items.poisonPotion },
        { name: 'Blind Potion', desc: 'Blinds the consumer by 2D8+15 turns.', effect: ItemEffects.items.blindPotion },
        { name: 'Paralysis Potion', desc: 'Paralyses the consumer by 2D10+10 turns.', effect: ItemEffects.items.paralysisPotion },
        { name: 'Invisibility Potion', desc: 'Makes the consumer invisible by 3D10+15 except for enemies he attacks.', effect: ItemEffects.items.invisibilityPotion },
        { name: 'Cure Potion', desc: 'Removes all damaging effects of the status.', effect: ItemEffects.items.curePotion },
        { name: 'Strength Potion', desc: 'Adds +3 Damage to the attack.', effect: ItemEffects.items.strengthPotion },
        { name: 'Defense Potion', desc: 'Adds +3 to the overall defense.', effect: ItemEffects.items.defensePotion },
        { name: 'Speed Potion', desc: 'Adds +1 to the speed.', effect: ItemEffects.items.speedPotion },
    ],

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