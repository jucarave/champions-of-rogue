'use strict';

var Tiles = {};
var names = [
    ['BLANK', 'DOT_C', 'POINT', 'COLON', 'COMMA', 'EXCLA', 'QUEST', 'STRUP', 'STRDN', 'MONEY', 'STAR', 'SLASH', 'PLUS', 'MINUS', 'UNDER', 'EQUAL', 'HASH', 'SQBRO', 'SQBRC', 'PAREO', 'PAREC', 'BRACO', 'BRACC', 'WATER', 'WATRD', ],
    ['AMPER', 'PERCT', 'QUOTD', 'GRASH', 'QUOTS', 'GRASS', 'PLAYR', 'PAGEUP', 'PAGEDWN', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', ],
    ['q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', ],
    ['P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'N0', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9']
];

for (var y=0,ylen=names.length;y<ylen;y++) {
    for (var x=0,xlen=names[y].length;x<xlen;x++) {
        Tiles[names[y][x]] = [x, y];
    }
}

module.exports = Tiles;