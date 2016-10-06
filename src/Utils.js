'use strict';

var Colors = require('./Colors');
var Tiles = require('./Tiles');

module.exports = {
    rollDice: function(value) {
        var array = value.split(/[D\+*]/),
            a = parseInt(array[0], 10),
            b = parseInt(array[1], 10),
            c = parseInt(array[2], 10) || 0;
        
        var ret = c;
        for (var i=0;i<a;i++) {
            ret += (Math.round(Math.random() * (b - 1))) + 1;
        }
        
        return ret;
    },
    
    formatText: function(text, width) {
        var ret = [];
        var words = text.split(" ");
        var line = "";
        
        for (var i=0,w;w=words[i];i++) {
            if (line.length + w.length + 1 <= width) {
                line += " " + w;
            }else{
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
    
    getTile: function(renderer, chara, color, backColor=Colors.BLACK) {
        var tile = chara;
        
        if (tile == "!"){ tile = "EXCLA"; }else
        if (tile == "."){ tile = "POINT"; }else
        if (tile == ":"){ tile = "COLON"; }else
        if (tile == ","){ tile = "COMMA"; }else
        if (tile == "?"){ tile = "QUEST"; }else
        if (tile == "<"){ tile = "STRUP"; }else
        if (tile == ">"){ tile = "STRDN"; }else
        if (tile == "+"){ tile = "PLUS"; }else
        if (tile == "-"){ tile = "MINUS"; }else
        if (tile == "$"){ tile = "MONEY"; }else
        if (tile == "("){ tile = "PAREO"; }else
        if (tile == ")"){ tile = "PAREC"; }else
        if (tile == "'"){ tile = "QUOTS"; }else
        if (tile == '"'){ tile = "QUOTD"; }else
        if (tile == "/"){ tile = "SLASH"; }else
        if (tile == "%"){ tile = "PERCT"; }else
        if (tile == "="){ tile = "EQUAL"; }else
        if (tile == "#"){ tile = "HASH"; }else
        if (tile >= "0" && tile <= "9"){ tile = "N" + tile; }
        
        return renderer.getTile(backColor, color, Tiles[tile]);
    },
    
    renderText: function(renderer, x, y, text, color=Colors.WHITE, backColor=Colors.BLACK) {
        for (var i=0,t;t=text[i];i++) {
            if (backColor == null) {
                renderer.plotCharacter(x + i, y, this.getTile(renderer, t, color, backColor));
            }else{
                renderer.plot(x + i, y, this.getTile(renderer, t, color, backColor));
            }
        }
    }
};