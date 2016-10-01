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
    mmListeners: [],
    mdListeners: [],
    
    init: function(canvas) {
        document.body.onkeydown = (event) => {
            this.keyCodes[event.keyCode] = 1;
            
            for (var i=0,kd;kd=this.kdListeners[i];i++) {
                kd(event.keyCode, 1);
            }
        };
        
        document.body.onkeyup = (event) => {
            this.keyCodes[event.keyCode] = 0;
            
            for (var i=0,kd;kd=this.kdListeners[i];i++) {
                kd(event.keyCode, 0);
            }
        };
        
        canvas.onmousemove = (event) => {
            var x = event.clientX - canvas.offsetLeft,
                y = event.clientY - canvas.offsetTop;
            
            for (var i=0,mm;mm=this.mmListeners[i];i++) {
                mm(x, y);
            }
        };
        
        canvas.onmousedown = (event) => {
            var x = event.clientX - canvas.offsetLeft,
                y = event.clientY - canvas.offsetTop;
            
            for (var i=0,md;md=this.mdListeners[i];i++) {
                md(x, y, 1);
            }
        };
        
        canvas.onmouseup = (event) => {
            var x = event.clientX - canvas.offsetLeft,
                y = event.clientY - canvas.offsetTop;
            
            for (var i=0,md;md=this.mdListeners[i];i++) {
                md(x, y, 0);
            }
        };
    },
    
    addKeyDownListener: function(callback) {
        this.kdListeners.push(callback);
    },
    
    addMouseMoveListener: function(callback) {
        this.mmListeners.push(callback);
    },
    
    addMouseDownListener: function(callback) {
        this.mdListeners.push(callback);
    }
};

for (var i=65;i<=90;i++) {
    Input.keys[String.fromCharCode(i)] = i;
}

module.exports = Input;