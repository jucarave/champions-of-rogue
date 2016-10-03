'use strict';

var Colors = require('./Colors');
var Utils = require('./Utils');

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
    
    render() {
        var length = this.messages.length - 1;
        for (var i=0,m;m=this.messages[length - i];i++) {
            Utils.renderText(this.renderer, this.consolePosition[0], this.consolePosition[1] + this.maxMessages - i, m.text, m.color)
        }
    }
}

module.exports = Console;