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
        
        this.renderer.clearRect(0, 25, 85, 5);
        this.render();
    }
    
    static formatText(text, width) {
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
    
    static renderText(renderer, x, y, text, color=Colors.WHITE, backColor=Colors.BLACK) {
        for (var i=0,t;t=text[i];i++) {
            renderer.plot(x + i, y, Console.getTile(renderer, t, color, backColor));
        }
    }
    
    render() {
        var length = this.messages.length - 1;
        for (var i=0,m;m=this.messages[length - i];i++) {
            Console.renderText(this.renderer, this.consolePosition[0], this.consolePosition[1] + this.maxMessages - i, m.text, m.color)
        }
    }
}

module.exports = Console;