import { Colors, Tiles } from './Prefabs';
import { Renderer } from './engine/Renderer';
import { Color } from './engine/Color';
import { Tile } from './engine/Tile';
import { Character } from './engine/Character';

let Utils = {
    /**
     * Rolls a 'y' sided dice 'x' times and sum the results
     * to z
     * 
     * @param dice String: Dice with the format "xDy+z" 
     * 
     * @return Number: Result of the rolled 
     */
    rollDice(dice: string): number {
        let array: Array<string> = dice.split(/[D\+*]/),
            x: number = parseInt(array[0], 10),
            y: number = parseInt(array[1], 10),
            z: number = parseInt(array[2], 10) || 0;

        let ret: number = z;
        for (let i = 0; i < x; i++) {
            ret += (Math.round(Math.random() * (y - 1))) + 1;
        }

        return ret;
    },

    /**
     * Separates a single string line into multiple lines
     * defined by a monospaced width. 
     *  
     * @param text String: Full string that has to be splitted.
     * @param width Number: Maximum width per line.
     * 
     * @return Array<String>: Array containing the string separated.
     */
    formatText(text: string, width: number): Array<string> {
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

    /**
     * Transform a invalid variable code name like "!" into 
     * its valid form ("EXCLA") and returns the tile using 
     * the correct name.
     * 
     * @param Renderer: Renderer instance to obtain the final tile. 
     * @param chara String: Character to represent the tile.
     * @param Color: Foreground color of the tile.
     * @param backColor?: Background color of the tile (Default BLACK).
     * 
     * @return Tile: Tile served by the rendering class.
     */
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

    /**
     * Plots a string line into the canvas.
     * 
     * @param Renderer: Renderer instance to plot the characters.
     * @param x Number: X position of the text.
     * @param y Number: Y position of the text.
     * @param text String: Text to render on the canvas.
     * @param Color?: Foreground color of the text (Default WHITE).
     * @param backColor?: BackgroundColor of the text (Default BLACK).
     */
    renderText(renderer: Renderer, x: number, y: number, text: string, color: Color = Colors.WHITE, backColor: Color = Colors.BLACK) {
        for (let i = 0; i < text.length; i++) {
            let t: string = text[i];

            if (backColor == null) {
                renderer.plotCharacter(x + i, y, this.getTile(renderer, t, color, backColor));
            } else {
                renderer.plot(x + i, y, this.getTile(renderer, t, color, backColor));
            }
        }
    },

    /**
     * Makes a GET Http request call and tries to obtain a
     * JSON object from the response.
     * 
     * @param url String: Absolute url to perform the call
     * @param callback Function(jsonObject): Callback function 
     *         to return the data 
     */
    loadJSON(url: string, callback: Function) {
        let http: XMLHttpRequest = new XMLHttpRequest();
        http.open("GET", url, true);
        http.onreadystatechange = () => {
            if (http.readyState == 4) {
                try {
                    let data: any = JSON.parse(http.responseText);
                    if (http.status == 200) {
                        callback(data);
                    } else {
                        alert("Error while obtaining the JSON");
                        console.error(data);
                    }
                } catch(error) {
                    alert("Error while parsing the JSON: " + error.message);
                }
            }
        };
        http.send();
    }
};

export { Utils };