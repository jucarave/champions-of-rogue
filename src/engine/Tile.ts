import { Color } from './Color';
import { Character } from './Character';

let black: Color = { r: 0, g: 0, b: 0 };
let emptyChar: Character = { x: 0, y: 0 };

class Tile {
    constructor(public background: Color = black, public foreground: Color = black, public character: Character = emptyChar) {}
}

export { Tile };