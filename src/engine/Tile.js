'use strict';

var black = [0, 0, 0];
var emptyChar = [0, 0];

class Tile {
    constructor(backgroundColor=black, foregroundColor=black, character=emptyChar) {
        this.background = backgroundColor;
        this.foreground = foregroundColor;
        this.character = character;
    }
}

module.exports = Tile;