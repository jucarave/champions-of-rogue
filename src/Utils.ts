import { Colors, Tiles } from './Prefabs';
import { Renderer } from './engine/Renderer';
import { Color } from './engine/Color';
import { Tile } from './engine/Tile';
import { Character } from './engine/Character';

let Utils = {
    rollDice: function (value: string): number {
        let array: Array<string> = value.split(/[D\+*]/),
            a: number = parseInt(array[0], 10),
            b: number = parseInt(array[1], 10),
            c: number = parseInt(array[2], 10) || 0;

        let ret: number = c;
        for (let i = 0; i < a; i++) {
            ret += (Math.round(Math.random() * (b - 1))) + 1;
        }

        return ret;
    },

    formatText: function (text: string, width: number): Array<string> {
        let ret: Array<string> = [],
            words: Array<string> = text.split(" "),
            line: string = "";

        for (let i = 0; i < words.length; i++) {
            let w: string = words[i];

            if (line.length + w.length + 1 <= width) {
                line += " " + w;
            } else {
                ret.push(line.trim());
                line = "";
                i--;
            }
        }

        if (line != "") {
            ret.push(line.trim());
        }

        return ret;
    },

    getTile: function (renderer: Renderer, chara: string, color: Color, backColor: Color = Colors.BLACK): Tile {
        var tile = chara;

        if (tile == "!") { tile = "EXCLA"; } else
        if (tile == ".") { tile = "POINT"; } else
        if (tile == ":") { tile = "COLON"; } else
        if (tile == ",") { tile = "COMMA"; } else
        if (tile == "?") { tile = "QUEST"; } else
        if (tile == "<") { tile = "STRUP"; } else
        if (tile == ">") { tile = "STRDN"; } else
        if (tile == "+") { tile = "PLUS"; } else
        if (tile == "-") { tile = "MINUS"; } else
        if (tile == "$") { tile = "MONEY"; } else
        if (tile == "(") { tile = "PAREO"; } else
        if (tile == ")") { tile = "PAREC"; } else
        if (tile == "'") { tile = "QUOTS"; } else
        if (tile == '"') { tile = "QUOTD"; } else
        if (tile == "/") { tile = "SLASH"; } else
        if (tile == "%") { tile = "PERCT"; } else
        if (tile == "=") { tile = "EQUAL"; } else
        if (tile == "#") { tile = "HASH"; } else
        if (tile >= "0" && tile <= "9") { tile = "N" + tile; }

        return renderer.getTile(backColor, color, <Character>Tiles[tile]);
    },

    renderText: function (renderer: Renderer, x: number, y: number, text: string, color: Color = Colors.WHITE, backColor: Color = Colors.BLACK) {
        for (let i = 0; i < text.length; i++) {
            let t: string = text[i];

            if (backColor == null) {
                renderer.plotCharacter(x + i, y, this.getTile(renderer, t, color, backColor));
            } else {
                renderer.plot(x + i, y, this.getTile(renderer, t, color, backColor));
            }
        }
    }
};

export { Utils };