import { Color } from './engine/Color';
import { Tile } from './engine/Tile';
import { Renderer } from './engine/Renderer';
import { Character } from './engine/Character';

let Colors = {
    BLACK: {r: 0, g: 0, b: 0},
    WHITE: {r: 255 / 255, g: 255 / 255, b: 255 / 255},
    RED: { r: 255 / 255, g: 0, b: 0 },
    GREEN: { r: 0, g: 160 / 255, b: 0 },
    BLUE: { r: 0, g: 0, b: 160 / 255 },
    YELLOW: { r: 160 / 255, g: 160 / 255, b: 0 },
    PURPLE: { r: 160 / 255, g: 0 / 255, b: 160 / 255 },
    AQUA: { r: 0, g: 80 / 255, b: 200 / 255 },
    GRAY: { r: 122 / 255, g: 122 / 255, b: 122 / 255 },
    TAN: { r: 205 / 255, g: 133 / 255, b: 63 / 255 },
    ORANGE: { r: 255 / 255, g: 100 / 255, b: 0 },
    GOLD: { r: 255 / 255, g: 215 / 255, b: 0 / 255 },
    DARK_BLUE: { r: 0 / 255, g: 0 / 255, b: 50 / 255 },
    BROWN: { r: 139 / 255, g: 69 / 255, b: 19 / 255 }
};

interface TileType {
    [index: string]: Character;
}

let Tiles: TileType = {};
let names: Array<Array<string>> = [
    ['BLANK', 'DOT_C', 'POINT', 'COLON', 'COMMA', 'EXCLA', 'QUEST', 'STRUP', 'STRDN', 'MONEY', 'STAR', 'SLASH', 'PLUS', 'MINUS', 'UNDER', 'EQUAL', 'HASH', 'SQBRO', 'SQBRC', 'PAREO', 'PAREC', 'BRACO', 'BRACC', 'WATER', 'WATRD',],
    ['AMPER', 'PERCT', 'QUOTD', 'GRASH', 'QUOTS', 'GRASS', 'PLAYR', 'PAGEUP', 'PAGEDWN', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',],
    ['q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',],
    ['P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'N0', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9']
];

for (let y = 0, ylen = names.length; y < ylen; y++) {
    for (let x = 0, xlen = names[y].length; x < xlen; x++) {
        let name: string = names[y][x];
        Tiles[name] = { x: x, y: y };
    }
}

enum TileTypes {
    GROUND,
    WALL,
    WATER,
    WATER_DEEP
};

interface TilePrefab {
    light: Tile,
    dark: Tile,
    type: TileTypes
};

interface PrefabItem {
    [index: string]: TilePrefab
};

function multiplyColor(color: Color, amount: Color): Color {
    return {
        r: color.r * amount.r,
        g: color.g * amount.g,
        b: color.b * amount.b
    };
}

function getTile(renderer: Renderer, backColor: Color, frontColor: Color, tile: Character, effect?: void, type: TileTypes = TileTypes.GROUND): TilePrefab {
    return {
        light: renderer.getTile(backColor, frontColor, tile, effect),
        dark: renderer.getTile(multiplyColor(backColor, { r: 0.1, g: 0.1, b: 0.5 }), multiplyColor(frontColor, { r: 0.1, g: 0.1, b: 0.5 }), tile, effect),
        type: type
    };
}

let TilesPrefabs = {
    TILES: <PrefabItem>{},
    ITEMS: <PrefabItem>{},
    ENEMIES: <PrefabItem>{},
    PLAYER: <TilePrefab>null,

    init: function (renderer: Renderer) {
        let t = this.TILES;
        let i = this.ITEMS;
        let e = this.ENEMIES;

        // Blank
        t.BLANK = getTile(renderer, Colors.BLACK, Colors.BLACK, Tiles["BLANK"], null);

        // Walls
        t.WALL = getTile(renderer, Colors.GRAY, Colors.WHITE, Tiles["HASH"], null, TileTypes.WALL);

        // Floors
        t.FLOOR = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles["DOT_C"], null);
        t.WATER = getTile(renderer, Colors.AQUA, Colors.WHITE, Tiles["WATER"], null, TileTypes.WATER);
        t.WATER_DEEP = getTile(renderer, Colors.BLUE, Colors.WHITE, Tiles["WATRD"], null, TileTypes.WATER_DEEP);

        // Stairs
        t.STAIRS_UP = getTile(renderer, Colors.BLACK, Colors.YELLOW, Tiles["STRUP"]);
        t.STAIRS_DOWN = getTile(renderer, Colors.BLACK, Colors.YELLOW, Tiles["STRDN"]);

        // Gold
        i.GOLD = getTile(renderer, Colors.BLACK, Colors.GOLD, Tiles["MONEY"], null);

        // Items
        i.RED_POTION = getTile(renderer, Colors.BLACK, Colors.RED, Tiles["EXCLA"]);
        i.GREEN_POTION = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles["EXCLA"]);
        i.BLUE_POTION = getTile(renderer, Colors.BLACK, Colors.BLUE, Tiles["EXCLA"]);
        i.YELLOW_POTION = getTile(renderer, Colors.BLACK, Colors.YELLOW, Tiles["EXCLA"]);
        i.AQUA_POTION = getTile(renderer, Colors.BLACK, Colors.AQUA, Tiles["EXCLA"]);
        i.WHITE_POTION = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles["EXCLA"]);
        i.PURPLE_POTION = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles["EXCLA"]);
        i.TAN_POTION = getTile(renderer, Colors.BLACK, Colors.TAN, Tiles["EXCLA"]);
        i.ORANGE_POTION = getTile(renderer, Colors.BLACK, Colors.ORANGE, Tiles["EXCLA"]);

        // Weapons
        i.DAGGER = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles["MINUS"]);
        i.SWORD = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles["SLASH"]);
        i.LONG_SWORD = getTile(renderer, Colors.BLACK, Colors.AQUA, Tiles["SLASH"]);
        i.MACE = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles["UNDER"]);
        i.SPEAR = getTile(renderer, Colors.BLACK, Colors.BROWN, Tiles["SLASH"]);
        i.AXE = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles["MINUS"]);

        // Armors
        i.LEATHER_ARMOR = getTile(renderer, Colors.BLACK, Colors.BROWN, Tiles["SQBRO"]);
        i.SCALE_MAIL = getTile(renderer, Colors.BLACK, Colors.GRAY, Tiles["SQBRO"]);
        i.CHAIN_MAIL = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles["SQBRO"]);
        i.PLATE_ARMOR = getTile(renderer, Colors.BLACK, Colors.GOLD, Tiles["SQBRO"]);

        // Enemies
        e.RAT = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles["r"]);
        e.SPIDER = getTile(renderer, Colors.BLACK, Colors.GRAY, Tiles["s"]);
        e.KOBOLD = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles["k"]);
        e.IMP = getTile(renderer, Colors.BLACK, Colors.RED, Tiles["i"]);
        e.GOBLIN = getTile(renderer, Colors.BLACK, Colors.AQUA, Tiles["g"]);
        e.ZOMBIE = getTile(renderer, Colors.BLACK, Colors.RED, Tiles["z"]);
        e.OGRE = getTile(renderer, Colors.BLACK, Colors.BROWN, Tiles["o"]);
        e.ROGUE = getTile(renderer, Colors.BLACK, Colors.RED, Tiles["R"]);
        e.BEGGAR = getTile(renderer, Colors.BLACK, Colors.BROWN, Tiles["b"]);
        e.SHADOW = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles["S"]);
        e.THIEF = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles["t"]);
        e.CAOS_KNIGHT = getTile(renderer, Colors.BLACK, Colors.RED, Tiles["K"]);
        e.LIZARD_WARRIOR = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles["l"]);
        e.OPHIDIAN = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles["O"]);
        e.CAOS_SERVANT = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles["C"]);
        e.WYVERN_KNIGHT = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles["W"]);
        e.CAOS_LORD = getTile(renderer, Colors.BLACK, Colors.RED, Tiles["L"]);
        e.SODI = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles["PLAYR"]);

        // Player
        this.PLAYER = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles["PLAYR"], null);
    }
};

export { Colors, Tiles, TilePrefab, TilesPrefabs, TileTypes };