'use strict';

var Input = {
    keyCodes: new Uint8ClampedArray(255),
    keys: {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
    },
    
    kdListeners: [],
    kuListeners: [],
    
    init: function() {
        document.body.onkeydown = (event) => {
            this.keyCodes[event.keyCode] = 1;
            
            for (var i=0,kd;kd=this.kdListeners[i];i++) {
                this.kdListeners[i](event.keyCode, 1);
            }
        };
        
        document.body.onkeyup = (event) => {
            this.keyCodes[event.keyCode] = 0;
            
            for (var i=0,kd;kd=this.kdListeners[i];i++) {
                this.kuListeners[i](event.keyCode, 0);
            }
        };
    },
    
    addKeyDownListener: function(callback) {
        this.kdListeners.push(callback);
    },
    
    addKeyUpListener: function(callback) {
        this.kuListeners.push(callback);
    }
};

for (var i=65;i<=90;i++) {
    Input.keys[String.fromCharCode(i)] = i;
}

module.exports = Input;