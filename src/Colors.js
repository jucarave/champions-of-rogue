'use strict';

class Color extends Array {
    constructor(r, g, b) {
        super(3);
        
        this[0] = r;
        this[1] = g;
        this[2] = b;
    }
    
    multiply(vr, vg=vr, vb=vr) {
        var r = (this[0] * vr) << 0,
            g = (this[1] * vg) << 0,
            b = (this[2] * vb) << 0;
            
        return new Color(r, g, b);
    }
}

module.exports = {
    BLACK: new Color(0, 0, 0),
    WHITE: new Color(255, 255, 255),
    RED: new Color(255, 0, 0),
    GREEN: new Color(0, 160, 0),
    BLUE: new Color(0, 0, 160),
    YELLOW: new Color(160, 160, 0),
    PURPLE: new Color(160, 0, 160),
    AQUA: new Color(0, 80, 200),
    GRAY: new Color(122, 122, 122),
    TAN: new Color(205, 133, 63),
    ORANGE: new Color(255, 100, 0),
    GOLD: new Color(255, 215, 0),
    DARK_BLUE: new Color(0, 0, 50)
};