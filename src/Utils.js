'use strict';

module.exports = {
    rollDice: function(value) {
        var array = value.split(/D\+/),
            a = parseInt(array[0], 10),
            b = parseInt(array[1], 10),
            c = parseInt(array[2], 10) || 0;
        
        var ret = c;
        for (var i=0;i<a;i++) {
            ret += ((Math.random() * (b - 1)) << 0) + 1;
        }
        
        return ret;
    },
    
    formatText: function(text, width) {
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
};