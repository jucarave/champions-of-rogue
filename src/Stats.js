'use strict';

var Colors = require('./Colors');
var Console = require('./Console');

module.exports = {
    name: 'KRAM',
    class: 'ROGUE',
    
    level: 1,
    
    hp: [45, 80],
    mp: [18, 20],
    status: null,
    
    str: '3D5',
    def: '2D4',
    spd: 2,
    
    gold: 0,
    
    inventory: [],
    equipment: [],
    
    renderText: function(renderer, x, y, text, color=Colors.WHITE, backColor=Colors.BLACK) {
        for (var i=0,t;t=text[i];i++) {
            renderer.plot(x + i, y, Console.getTile(renderer, t, color, backColor));
        }
    },
    
    render: function(renderer) {
        renderer.clearRect(65, 0, 20, 25);
        
        // Player Name
        var name = this.name + " (" + this.class + ")";
        
        var x = (75 - name.length / 2) << 0;
        var ni = 0;
        for (var i=65;i<85;i++) {
            var n = '';
            if (i >= x && ni < name.length){ n = name[ni++]; }
            
            renderer.plot(i, 0, Console.getTile(renderer, n, Colors.WHITE, Colors.BLUE));
        }
        
        // Dungeon Depth
        this.renderText(renderer, 65, 1, "LEVEL: " + this.level);
        
        // Health Points
        var hp = ((this.hp[0] / this.hp[1] * 20) << 0) + 65;
        for (var i=65;i<hp;i++){
            renderer.plot(i, 2, renderer.getTile(Colors.GREEN));
        }
        
        this.renderText(renderer, 65, 2, "HP: " + this.hp[0] + "/" + this.hp[1], Colors.WHITE, Colors.GREEN);
        
        // Magic Points
        var mp = ((this.mp[0] / this.mp[1] * 20) << 0) + 65;
        for (var i=65;i<mp;i++){
            renderer.plot(i, 3, renderer.getTile(Colors.AQUA));
        }
        
        this.renderText(renderer, 65, 3, "MP: " + this.mp[0] + "/" + this.mp[1], Colors.WHITE, Colors.AQUA);
    }
};