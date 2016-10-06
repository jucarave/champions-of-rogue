'use strict';

var Input = require('./engine/Input');
var Utils = require('./Utils');
var Colors = require('./Colors');
var PlayerStats = require('./Stats');

class MainMenu {
    constructor(game) {
        this.game = game;
        this.renderer = this.game.renderer;
        this.name = '';
        
        Input.addKeyDownListener((keyCode, stat) => { this.handleKeyEvent(keyCode, stat); });
    }
    
    handleKeyEvent(keyCode, stat) {
        if (stat != 0){ return; }
        
        if (keyCode >= 65 && keyCode <= 90) {
            this.name += String.fromCharCode(keyCode);
        }else if (keyCode == 8 && this.name.length > 0) {
            this.name = this.name.substring(0, this.name.length - 1);
        }else if (keyCode == 13) {
            PlayerStats.name = this.name;
            this.renderer.clearRect(0, 0, 85, 30);
            this.game.gotoLevel(1);
        }
        
        if (this.name.length > 10) {
            this.name = this.name.substring(0, 10);
        }
    }
    
    render() {
        this.renderer.clearRect(0, 0, 85, 30);
        
        Utils.renderText(this.renderer, 1, 1, "CHAMPIONS OF ROGUE", Colors.RED, Colors.BLACK);
        Utils.renderText(this.renderer, 59, 1, "By Camilo Ramirez (Fedic)", Colors.GOLD, Colors.BLACK);
        
        Utils.renderText(this.renderer, 1, 3, "An entry for the \"Roguelike Caos #1\" jam", Colors.WHITE, Colors.BLACK);
        
        Utils.renderText(this.renderer, 1, 4, "===================================================================================", Colors.WHITE, Colors.BLACK);
        
        Utils.renderText(this.renderer, 1, 6, "The world has entered a new age of oportunities, with the fall of the dark lord Ias", Colors.GRAY, Colors.BLACK);
        Utils.renderText(this.renderer, 1, 7, "many adventures around the world have taken that oportunity to loot the treasures", Colors.GRAY, Colors.BLACK);
        Utils.renderText(this.renderer, 1, 8, "hidden within his fortress. Several lords and kings have appear thanks to this   ", Colors.GRAY, Colors.BLACK);
        Utils.renderText(this.renderer, 1, 9, "massive amount of fortune, but it was a matter of time before a new lord appear  ", Colors.GRAY, Colors.BLACK);
        Utils.renderText(this.renderer, 1,10, "and decided to take this fortune for himself, a new champion: 'Rogue'.", Colors.GRAY, Colors.BLACK);
        
        Utils.renderText(this.renderer, 1,25, "===================================================================================", Colors.WHITE, Colors.BLACK);
        
        Utils.renderText(this.renderer, 1,27, "ENTER YOUR NAME ADVENTURER: " + this.name, Colors.WHITE, Colors.BLACK);
    }
}

module.exports = MainMenu;