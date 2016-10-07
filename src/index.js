'use strict';

window.onload = () => {
    var Game = require('./Game');
    var Input = require('./engine/Input');
    
    var game = new Game();
    
    Input.init(game.renderer.canvas);
};