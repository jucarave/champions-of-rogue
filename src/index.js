'use strict';

window.onload = () => {
    var Game = require('./Game');
    var Input = require('./engine/Input');
    
    Input.init();
    
    var game = new Game();
};