'use strict';

class Color extends Array {
    constructor(r, g, b) {
        super(3);
        
        this[0] = r;
        this[1] = g;
        this[2] = b;
    }
    
    toFloat32() {
        this[0] /= 255;
        this[1] /= 255;
        this[2] /= 255;
        
        return this;
    }
    
    multiply(vr, vg=vr, vb=vr) {
        return new Color(this[0] * vr, this[1] * vg, this[2] * vb);
    }
}

module.exports = {
    BLACK: new Color(0, 0, 0).toFloat32(),
    WHITE: new Color(255, 255, 255).toFloat32(),
    RED: new Color(255, 0, 0).toFloat32(),
    GREEN: new Color(0, 160, 0).toFloat32(),
    BLUE: new Color(0, 0, 160).toFloat32(),
    YELLOW: new Color(160, 160, 0).toFloat32(),
    PURPLE: new Color(160, 0, 160).toFloat32(),
    AQUA: new Color(0, 80, 200).toFloat32(),
    GRAY: new Color(122, 122, 122).toFloat32(),
    TAN: new Color(205, 133, 63).toFloat32(),
    ORANGE: new Color(255, 100, 0).toFloat32(),
    GOLD: new Color(255, 215, 0).toFloat32(),
    DARK_BLUE: new Color(0, 0, 50).toFloat32(),
    BROWN: new Color(139, 69, 19).toFloat32()
};