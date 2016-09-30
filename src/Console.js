'use strict';

var Colors = require('./Colors');
var Tiles = require('./Tiles');

class Console {
    constructor(game) {
        this.game = game;
        this.renderer = game.renderer;
        
        this.messages = [];
        this.maxMessages = 4;
        
        this.consolePosition = [0, 25];
    }
    
    addMessage(text, color = Colors.WHITE) {
        this.messages.push({text: text, color: color});
        
        if (this.messages.length > this.maxMessages) {
            this.messages.splice(0, 1);
        }
        
        this.renderer.clearRect(0, 26, 85, 4);
        this.render();
    }
    
    static getTile(renderer, chara, color, backColor=Colors.BLACK) {
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
        if (tile >= "0" && tile <= "9"){ tile = "N" + tile; }
        
        return renderer.getTile(backColor, color, Tiles[tile]);
    }
    
    render() {
        var length = this.messages.length - 1;
        for (var i=0,m;m=this.messages[length - i];i++) {
            for (var j=0,c;c=m.text[j];j++){
                this.renderer.plot(this.consolePosition[0] + j, this.consolePosition[1] + this.maxMessages - i, Console.getTile(this.renderer, c, m.color));
            }
        }
    }
}

module.exports = Console;