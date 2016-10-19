(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var Prefabs_1 = require('./Prefabs');
var Utils_1 = require('./Utils');
;
var Console = (function () {
    function Console(game) {
        this.game = game;
        this.renderer = game.renderer;
        this.messages = [];
        this.maxMessages = 4;
        this.consolePosition = { x: 0, y: 25 };
    }
    Console.prototype.clear = function () {
        this.messages = [];
        this.render();
    };
    Console.prototype.addMessage = function (text, color) {
        if (color === void 0) { color = Prefabs_1.Colors.WHITE; }
        this.messages.push({ text: text, color: color });
        if (this.messages.length > this.maxMessages) {
            this.messages.splice(0, 1);
        }
        this.render();
    };
    Console.prototype.render = function () {
        this.renderer.clearRect(0, 25, 85, 5);
        var length = this.messages.length - 1;
        for (var i = 0, m = void 0; m = this.messages[length - i]; i++) {
            Utils_1.Utils.renderText(this.renderer, this.consolePosition.x, this.consolePosition.y + this.maxMessages - i, m.text, m.color);
        }
    };
    return Console;
}());
exports.Console = Console;
},{"./Prefabs":14,"./Utils":17}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Instance_1 = require('./Instance');
var Prefabs_1 = require('./Prefabs');
var PlayerStats_1 = require('./PlayerStats');
var Utils_1 = require('./Utils');
var Enemy = (function (_super) {
    __extends(Enemy, _super);
    function Enemy(x, y, map, enemy) {
        _super.call(this, x, y, map, enemy.def.tile);
        this.enemy = enemy;
        this.name = enemy.def.name;
        this.target = null;
        this.targetLastPosition = { x: 0, y: 0 };
        this.targetPath = null;
        this.discovered = false;
        this.inShadow = true;
        this.stopOnDiscover = true;
        this.attackedByPlayer = false;
        this.movementBudget = 0.0;
    }
    Enemy.prototype.receiveDamage = function (dmg) {
        this.attackedByPlayer = true;
        this.enemy.hp[0] -= dmg;
        if (this.enemy.hp[0] <= 0) {
            this.destroy = true;
            return true;
        }
        return false;
    };
    Enemy.prototype.moveTo = function (xTo, yTo) {
        var tile = this.map.getTileAt(this.x + xTo, this.y + yTo);
        var solid = (tile && tile.type == Prefabs_1.TileTypes.WALL);
        if (!this.enemy.def.canSwim && tile.type == Prefabs_1.TileTypes.WATER_DEEP) {
            solid = true;
        }
        var ins = this.map.getInstanceAt(this.x + xTo, this.y + yTo);
        if (ins && ins.enemy) {
            solid = true;
        }
        if (!solid) {
            return _super.prototype.moveTo.call(this, xTo, yTo);
        }
        return false;
    };
    Enemy.prototype.followPath = function () {
        if (!this.targetPath || this.targetPath.length == 0) {
            return;
        }
        var xTo = this.targetPath.shift() - this.x;
        var yTo = this.targetPath.shift() - this.y;
        this.moveTo(xTo, yTo);
        if (this.targetPath.length == 0) {
            this.targetPath = null;
        }
    };
    Enemy.prototype.wander = function () {
        var shouldMove = (Math.random() * 10) < 7;
        if (shouldMove) {
            var xTo = Math.round((Math.random() * 2.0) - 1.0);
            var yTo = Math.round((Math.random() * 2.0) - 1.0);
            if (xTo != 0 || yTo != 0) {
                this.moveTo(xTo, yTo);
            }
        }
    };
    Enemy.prototype.checkAttack = function () {
        if (Math.abs(this.target.x - this.x) > 1 || Math.abs(this.target.y - this.y) > 1) {
            return false;
        }
        var player = PlayerStats_1.PlayerStats;
        var missed = (Math.random() * 100) < player.luk;
        var msg = this.enemy.def.name + " attacks you";
        if (missed) {
            this.map.game.console.addMessage(msg + ", missed!", Prefabs_1.Colors.GREEN);
            return false;
        }
        var str = Utils_1.Utils.rollDice(this.enemy.def.str);
        var def = Utils_1.Utils.rollDice(player.getDef());
        var dmg = Math.max(str - def, 1);
        this.map.game.console.addMessage(msg + ", hit by " + dmg + " points", Prefabs_1.Colors.RED);
        player.receiveDamage(dmg);
        return true;
    };
    Enemy.prototype.updateMovement = function () {
        if (this.target) {
            if (this.checkAttack()) {
                return true;
            }
            if (this.target.x != this.targetLastPosition.x || this.target.y != this.targetLastPosition.y) {
                this.targetLastPosition.x = this.target.x;
                this.targetLastPosition.y = this.target.y;
                this.targetPath = this.map.getPath(this.x, this.y, this.target.x, this.target.y);
                this.targetPath.pop();
                this.targetPath.pop();
            }
            this.followPath();
        }
        else {
            this.wander();
        }
        return false;
    };
    Enemy.prototype.update = function () {
        if (this.destroy)
            return false;
        this.inShadow = true;
        var p = this.map.player;
        if (this.map.map[this.y][this.x].visible == 2) {
            this.inShadow = false;
            var playerInvisible = (PlayerStats_1.PlayerStats.invisible && !this.attackedByPlayer);
            if (!this.target && !playerInvisible && (Math.abs(p.x - this.x) <= this.enemy.def.viewDistance || Math.abs(p.y - this.y) <= this.enemy.def.viewDistance)) {
                this.target = p;
            }
            var mp = this.map.mousePosition;
            if (mp.x == this.x && mp.y == this.y) {
                this.map.tileDescription = this.name;
            }
        }
        else if (this.map.map[this.y][this.x].visible <= 1) {
            this.discovered = false;
        }
        if (this.map.playerTurn) {
            return false;
        }
        var turns = this.enemy.def.spd / PlayerStats_1.PlayerStats.spd + this.movementBudget;
        this.movementBudget = turns - (turns << 0);
        turns = turns << 0;
        for (var i = 0; i < turns; i++) {
            if (this.updateMovement()) {
                return false;
            }
        }
        return true;
    };
    return Enemy;
}(Instance_1.Instance));
exports.Enemy = Enemy;
;
},{"./Instance":5,"./PlayerStats":13,"./Prefabs":14,"./Utils":17}],3:[function(require,module,exports){
"use strict";
var Prefabs_1 = require('./Prefabs');
var Utils_1 = require('./Utils');
;
;
var EnemyFactory = {
    enemies: {
        rat: { tileCode: 'RAT', name: 'Giant rat', hp: '2D3+5', str: '1D4', def: '1D3', spd: 10, luk: 10, canSwim: false, viewDistance: 7, tile: null },
        spider: { tileCode: 'SPIDER', name: 'Spider', hp: '2D3+8', str: '1D10+2', def: '1D5', spd: 12, luk: 10, canSwim: false, viewDistance: 5, tile: null },
        kobold: { tileCode: 'KOBOLD', name: 'Kobold', hp: '3D3+8', str: '2D4', def: '2D4', spd: 10, luk: 15, canSwim: false, viewDistance: 5, tile: null },
        imp: { tileCode: 'IMP', name: 'Imp', hp: '2D4+7', str: '2D4+2', def: '2D6', spd: 10, luk: 15, canSwim: true, viewDistance: 7, tile: null },
        goblin: { tileCode: 'GOBLIN', name: 'Goblin', hp: '4D4+4', str: '3D4+2', def: '3D6', spd: 10, luk: 20, canSwim: false, viewDistance: 7, tile: null },
        zombie: { tileCode: 'ZOMBIE', name: 'Zombie', hp: '2D4+7', str: '2D5', def: '2D4', spd: 8, luk: 10, canSwim: false, viewDistance: 3, tile: null },
        ogre: { tileCode: 'OGRE', name: 'Ogre', hp: '4D5+5', str: '3D5+4', def: '3D4', spd: 8, luk: 15, canSwim: false, viewDistance: 5, tile: null },
        rogue: { tileCode: 'ROGUE', name: 'Rogue', hp: '4D5+7', str: '2D6+3', def: '2D6', spd: 10, luk: 20, canSwim: true, viewDistance: 10, tile: null },
        beggar: { tileCode: 'BEGGAR', name: 'Beggar', hp: '3D4+4', str: '2D4+2', def: '1D6', spd: 13, luk: 10, canSwim: true, viewDistance: 10, tile: null },
        shadow: { tileCode: 'SHADOW', name: 'Shadow', hp: '4D5+7', str: '2D6+3', def: '2D6', spd: 15, luk: 15, canSwim: true, viewDistance: 10, tile: null },
        thief: { tileCode: 'THIEF', name: 'Thief', hp: '3D5+6', str: '3D4+4', def: '3D3', spd: 15, luk: 20, canSwim: true, viewDistance: 10, tile: null },
        caosKnight: { tileCode: 'CAOS_KNIGHT', name: 'Caos knight', hp: '4D6+8', str: '2D10+5', def: '3D7+4', spd: 10, luk: 20, canSwim: true, viewDistance: 10, tile: null },
        lizardWarrior: { tileCode: 'LIZARD_WARRIOR', name: 'Lizard warrior', hp: '4D6+6', str: '2D7+5', def: '2D8', spd: 15, luk: 25, canSwim: true, viewDistance: 10, tile: null },
        ophidian: { tileCode: 'OPHIDIAN', name: 'Ophidian', hp: '4D8+8', str: '3D6+3', def: '3D6+3', spd: 15, luk: 25, canSwim: true, viewDistance: 10, tile: null },
        caosServant: { tileCode: 'CAOS_SERVANT', name: 'Caos servant', hp: '3D5+6', str: '3D3+3', def: '2D6', spd: 13, luk: 30, canSwim: true, viewDistance: 10, tile: null },
        wyvernKnight: { tileCode: 'WYVERN_KNIGHT', name: 'Wyvern knight', hp: '5D8+10', str: '4D6+5', def: '4D6+3', spd: 15, luk: 30, canSwim: true, viewDistance: 10, tile: null },
        caosLord: { tileCode: 'CAOS_LORD', name: 'Caos Lord', hp: '5D10+10', str: '4D10+7', def: '4D6+5', spd: 15, luk: 35, canSwim: true, viewDistance: 10, tile: null },
        sodi: { tileCode: 'SODI', name: 'Sodi', hp: '5D5+11', str: '2D6+3', def: '2D6', spd: 15, luk: 40, canSwim: true, viewDistance: 10, tile: null },
    },
    getEnemy: function (code) {
        if (!this.enemies[code]) {
            throw new Error("Invalid enemy code: [" + code + "]");
        }
        var enemy = this.enemies[code];
        if (!enemy.tile) {
            enemy.tile = Prefabs_1.TilesPrefabs.ENEMIES[enemy.tileCode];
        }
        var hp = Utils_1.Utils.rollDice(enemy.hp);
        var ret = {
            def: enemy,
            hp: [hp, hp]
        };
        return ret;
    }
};
exports.EnemyFactory = EnemyFactory;
},{"./Prefabs":14,"./Utils":17}],4:[function(require,module,exports){
"use strict";
var Renderer_1 = require('./engine/Renderer');
var Prefabs_1 = require('./Prefabs');
var Map_1 = require('./Map');
var Console_1 = require('./Console');
var Utils_1 = require('./Utils');
var ItemFactory_1 = require('./ItemFactory');
var MainMenu_1 = require('./MainMenu');
var Input_1 = require('./engine/Input');
var PlayerStats_1 = require('./PlayerStats');
;
var Game = (function () {
    function Game() {
        this.renderer = new Renderer_1.Renderer(850, 480, document.getElementById("divGame"));
        this.resolution = { x: 85, y: 30 };
        this.font = this.renderer.setFontTexture('img/ascii-rl-font.png');
        Prefabs_1.TilesPrefabs.init(this.renderer);
        this.maps = [];
        this.map = null;
        this.console = null;
        this.panelTile = this.renderer.getTile(Prefabs_1.Colors.DARK_BLUE, Prefabs_1.Colors.WHITE, { x: 0, y: 0 });
        this.itemDesc = null;
        this.restartGame = false;
        this.panels = {
            map: [0, 2, 60, 25],
            inventory: [60, 0, 85, 20],
            itemDesc: [10, 4, 49, 20]
        };
        this.createStats();
        this.newGame();
    }
    Game.prototype.newGame = function () {
        this.restartGame = false;
        Input_1.Input.clearListeners();
        this.gameSeed = Math.floor(Math.random() * 1500);
        console.log("SEED: " + this.gameSeed);
        PlayerStats_1.PlayerStats.initStats(this);
        PlayerStats_1.PlayerStats.equipment.weapon = ItemFactory_1.ItemFactory.getItem("dagger");
        PlayerStats_1.PlayerStats.equipment.armor = ItemFactory_1.ItemFactory.getItem("leatherArmor");
        this.map = new MainMenu_1.MainMenu(this);
        this.maps = [];
        this.console = new Console_1.Console(this);
        this.loopGame();
    };
    Game.prototype.createStats = function () {
        this.stats = new Stats();
        this.stats.showPanel(1);
        document.body.appendChild(this.stats.dom);
    };
    Game.prototype.isPointInPanel = function (x, y, panel) {
        return (x >= panel[0] && y >= panel[1] && x < panel[2] && y < panel[3]);
    };
    Game.prototype.onMouseMove = function (x, y) {
        if (this.itemDesc)
            return;
        x = (x / this.renderer.pixelSize[0]) << 0;
        y = (y / this.renderer.pixelSize[1]) << 0;
        if (this.isPointInPanel(x, y, this.panels.map)) {
            this.map.onMouseMove(x - this.panels.map[0], y - this.panels.map[1]);
        }
        else {
            this.map.onMouseMove(null, null);
        }
        if (this.isPointInPanel(x, y, this.panels.inventory)) {
            PlayerStats_1.PlayerStats.onMouseMove(x - this.panels.inventory[0], y - this.panels.inventory[1]);
        }
        else {
            PlayerStats_1.PlayerStats.onMouseMove(null, null);
        }
    };
    Game.prototype.onMouseHandler = function (x, y, stat) {
        x = (x / this.renderer.pixelSize[0]) << 0;
        y = (y / this.renderer.pixelSize[1]) << 0;
        if (this.itemDesc && stat == 1) {
            if (this.isPointInPanel(x, y, this.panels.itemDesc)) {
                this.onItemPanelAction(x - this.panels.itemDesc[0], y - this.panels.itemDesc[1]);
                return;
            }
            else {
                this.itemDesc = null;
                this.onMouseMove(x, y);
                return;
            }
        }
        if (this.isPointInPanel(x, y, this.panels.map)) {
            this.map.onMouseHandler(x - this.panels.map[0], y - this.panels.map[1], stat);
        }
        if (this.isPointInPanel(x, y, this.panels.inventory)) {
            PlayerStats_1.PlayerStats.onMouseHandler(x - this.panels.inventory[0], y - this.panels.inventory[1], stat);
        }
    };
    Game.prototype.onItemPanelAction = function (x, y) {
        if (y != 14)
            return;
        if (x >= 2 && x < 13) {
            PlayerStats_1.PlayerStats.useItem(this.itemDesc);
        }
        else if (x >= 26 && x < 37) {
            PlayerStats_1.PlayerStats.dropItem(this.itemDesc);
        }
    };
    Game.prototype.gotoLevel = function (level, dir) {
        var map = this.map;
        map.active = false;
        if (this.maps[level - 1]) {
            this.map = this.maps[level - 1];
        }
        else {
            this.map = new Map_1.Map(this, level);
            this.maps[level - 1] = this.map;
        }
        map.active = true;
        if (dir == 1) {
            map.player.x = map.stairsUp.x;
            map.player.y = map.stairsUp.y;
            map.stairsUp.playerOnTile = true;
        }
        else if (dir == 0) {
            map.player.x = map.stairsDown.x;
            map.player.y = map.stairsDown.y;
            map.stairsDown.playerOnTile = true;
        }
        PlayerStats_1.PlayerStats.render(this.renderer);
        this.console.render();
    };
    Game.prototype.renderItemPanel = function () {
        if (!this.itemDesc) {
            return;
        }
        for (var x = 10; x < 49; x++) {
            for (var y = 4; y < 20; y++) {
                this.renderer.plot(x, y, this.panelTile);
            }
        }
        var msg = this.itemDesc.def.desc;
        var formatted = Utils_1.Utils.formatText(msg, 38);
        var title = this.itemDesc.def.name + ((this.itemDesc.amount > 1) ? " (x" + this.itemDesc.amount + ")" : "");
        Utils_1.Utils.renderText(this.renderer, (30 - title.length / 2) << 0, 5, title, Prefabs_1.Colors.WHITE, Prefabs_1.Colors.DARK_BLUE);
        for (var i = 0, m = void 0; m = formatted[i]; i++) {
            Utils_1.Utils.renderText(this.renderer, 11, 7 + i, m, Prefabs_1.Colors.WHITE, Prefabs_1.Colors.DARK_BLUE);
        }
        Utils_1.Utils.renderText(this.renderer, 12, 18, "    USE    ", Prefabs_1.Colors.WHITE, Prefabs_1.Colors.BLUE);
        Utils_1.Utils.renderText(this.renderer, 36, 18, "   DROP    ", Prefabs_1.Colors.WHITE, Prefabs_1.Colors.BLUE);
    };
    Game.prototype.loopGame = function () {
        var _this = this;
        this.stats.begin();
        if (this.renderer.fontReady) {
            this.map.render();
            this.renderItemPanel();
            this.renderer.render();
        }
        this.stats.end();
        if (this.restartGame) {
            this.newGame();
        }
        else {
            requestAnimationFrame(function () { _this.loopGame(); });
        }
    };
    return Game;
}());
exports.Game = Game;
},{"./Console":1,"./ItemFactory":8,"./MainMenu":9,"./Map":10,"./PlayerStats":13,"./Prefabs":14,"./Utils":17,"./engine/Input":18,"./engine/Renderer":20}],5:[function(require,module,exports){
"use strict";
var Instance = (function () {
    function Instance(x, y, map, tile) {
        this.x = x;
        this.y = y;
        this.map = map;
        this.tile = tile;
        this.name = '';
        this.destroy = false;
        this.discovered = false;
        this.inShadow = false;
        this.stopOnDiscover = false;
        this.visibleInShadow = false;
    }
    Instance.prototype.moveTo = function (xTo, yTo) {
        this.x += xTo;
        this.y += yTo;
        return true;
    };
    ;
    Instance.prototype.update = function () { };
    return Instance;
}());
exports.Instance = Instance;
},{}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var PlayerStats_1 = require('./PlayerStats');
var ItemFactory_1 = require('./ItemFactory');
var Instance_1 = require('./Instance');
var Item = (function (_super) {
    __extends(Item, _super);
    function Item(x, y, map, item) {
        _super.call(this, x, y, map, item.def.tile);
        this.item = item;
        this.name = item.def.name;
        if (item.def.type == ItemFactory_1.ItemTypes.GOLD) {
            this.name = item.def.desc.replace(/X/g, item.amount.toString());
            if (item.amount > 1) {
                this.name += "s";
            }
        }
        this.playerOnTile = false;
        this.discovered = false;
        this.inShadow = true;
        this.stopOnDiscover = true;
    }
    Item.prototype.update = function () {
        if (this.item.def.discovered) {
            this.name = this.item.def.name;
        }
        this.inShadow = true;
        var p = this.map.player;
        if (p.x == this.x && p.y == this.y) {
            if (!this.playerOnTile && !p.movePath && PlayerStats_1.PlayerStats.pickItem(this.item)) {
                this.destroy = true;
                return;
            }
            this.playerOnTile = true;
        }
        else if (this.playerOnTile) {
            this.playerOnTile = false;
        }
        if (this.map.map[this.y][this.x].visible == 2) {
            this.inShadow = false;
            var mp = this.map.mousePosition;
            if (mp.x == this.x && mp.y == this.y) {
                this.map.tileDescription = this.name;
            }
        }
        else if (this.map.map[this.y][this.x].visible <= 1) {
            this.discovered = false;
        }
    };
    return Item;
}(Instance_1.Instance));
exports.Item = Item;
},{"./Instance":5,"./ItemFactory":8,"./PlayerStats":13}],7:[function(require,module,exports){
"use strict";
var Utils_1 = require('./Utils');
var Instructions;
(function (Instructions) {
    Instructions[Instructions["LITERAL"] = 0] = "LITERAL";
    Instructions[Instructions["DICE"] = 1] = "DICE";
    Instructions[Instructions["SUM"] = 2] = "SUM";
    Instructions[Instructions["STORE_VAL"] = 3] = "STORE_VAL";
    Instructions[Instructions["GET_INSTANCE_USE_NAME"] = 4] = "GET_INSTANCE_USE_NAME";
    Instructions[Instructions["GET_INSTANCE_HEALTH"] = 5] = "GET_INSTANCE_HEALTH";
    Instructions[Instructions["GET_INSTANCE_FULL_HEALTH"] = 6] = "GET_INSTANCE_FULL_HEALTH";
    Instructions[Instructions["SET_INSTANCE_HEALTH"] = 7] = "SET_INSTANCE_HEALTH";
    Instructions[Instructions["ADD_INSTANCE_STATUS"] = 8] = "ADD_INSTANCE_STATUS";
    Instructions[Instructions["REMOVE_INSTANCE_STATUS"] = 9] = "REMOVE_INSTANCE_STATUS";
    Instructions[Instructions["BOOST_INSTANCE_STAT"] = 10] = "BOOST_INSTANCE_STAT";
    Instructions[Instructions["RETURN_MSG"] = 11] = "RETURN_MSG";
})(Instructions || (Instructions = {}));
;
var ItemEffects = {
    executeCommand: function (command, params) {
        var copy = command.slice(0, command.length), stack = [], storedVals = [], ins, msg = "";
        while (copy.length > 0) {
            ins = copy.shift();
            switch (ins) {
                case Instructions.LITERAL:
                    stack.push(copy.shift());
                    break;
                case Instructions.DICE:
                    stack.push(Utils_1.Utils.rollDice(copy.shift()));
                    break;
                case Instructions.SUM:
                    stack.push(stack.pop() + stack.pop());
                    break;
                case Instructions.STORE_VAL:
                    storedVals.push(stack[stack.length - 1]);
                    break;
                case Instructions.GET_INSTANCE_USE_NAME:
                    stack.push(params.instance.useName || params.instance.name);
                    break;
                case Instructions.GET_INSTANCE_HEALTH:
                    stack.push(params.instance.hp[0]);
                    break;
                case Instructions.GET_INSTANCE_FULL_HEALTH:
                    stack.push(params.instance.hp[1]);
                    break;
                case Instructions.SET_INSTANCE_HEALTH:
                    params.instance.hp[0] = Math.min(stack.pop(), params.instance.hp[1]);
                    break;
                case Instructions.ADD_INSTANCE_STATUS:
                    var type = stack.pop();
                    var duration = stack.pop();
                    var value = stack.pop() || 0;
                    var found = false;
                    for (i = 0, st; st = params.instance.status[i]; i++) {
                        if (st.type == type) {
                            duration = Math.max(duration, st.duration[1]);
                            st.duration = [duration, duration];
                            found = true;
                            i = params.instance.status.length;
                        }
                    }
                    if (!found) {
                        params.instance.status.push({
                            type: type,
                            duration: [duration, duration],
                            value: value
                        });
                    }
                    break;
                case Instructions.REMOVE_INSTANCE_STATUS:
                    var type = stack.pop();
                    for (var i = 0, st; st = params.instance.status[i]; i++) {
                        if (st.type == type) {
                            params.instance.status.splice(i, 1);
                            break;
                        }
                    }
                    break;
                case Instructions.BOOST_INSTANCE_STAT:
                    var val = stack.pop();
                    var stat = stack.pop();
                    params.instance[stat] += val;
                    break;
                case Instructions.RETURN_MSG:
                    msg = copy.shift();
                    msg = msg.replace(/\%s[0-9]+/g, function (m, v) {
                        var ind = parseInt(m.replace("%s", ""), 10);
                        return storedVals[ind] || m;
                    });
                    break;
            }
        }
        return msg;
    },
    items: {
        hpPotion: [Instructions.GET_INSTANCE_USE_NAME, Instructions.STORE_VAL, Instructions.GET_INSTANCE_HEALTH, Instructions.DICE, '2D10+10', Instructions.STORE_VAL, Instructions.SUM, Instructions.SET_INSTANCE_HEALTH, Instructions.RETURN_MSG, "%s0 recovered %s1 health points."],
        lifePotion: [Instructions.GET_INSTANCE_USE_NAME, Instructions.STORE_VAL, Instructions.GET_INSTANCE_FULL_HEALTH, Instructions.SET_INSTANCE_HEALTH, Instructions.RETURN_MSG, "%s0 recovered all health points."],
        poisonPotion: [Instructions.LITERAL, '1D3', Instructions.LITERAL, 10, Instructions.LITERAL, 'poison', Instructions.ADD_INSTANCE_STATUS, Instructions.GET_INSTANCE_USE_NAME, Instructions.STORE_VAL, Instructions.RETURN_MSG, "%s0 are poisoned"],
        blindPotion: [Instructions.DICE, '2D8+15', Instructions.LITERAL, 'blind', Instructions.ADD_INSTANCE_STATUS, Instructions.GET_INSTANCE_USE_NAME, Instructions.STORE_VAL, Instructions.RETURN_MSG, "%s0 are blinded"],
        paralysisPotion: [Instructions.DICE, '1D10+10', Instructions.LITERAL, 'paralysis', Instructions.ADD_INSTANCE_STATUS, Instructions.GET_INSTANCE_USE_NAME, Instructions.STORE_VAL, Instructions.RETURN_MSG, "%s0 are paralyzed"],
        invisibilityPotion: [Instructions.DICE, '3D10+15', Instructions.LITERAL, 'invisible', Instructions.ADD_INSTANCE_STATUS, Instructions.GET_INSTANCE_USE_NAME, Instructions.STORE_VAL, Instructions.RETURN_MSG, "%s0 are invisible"],
        curePotion: [Instructions.LITERAL, 'poison', Instructions.REMOVE_INSTANCE_STATUS, Instructions.LITERAL, 'blind', Instructions.REMOVE_INSTANCE_STATUS, Instructions.LITERAL, 'paralysis', Instructions.REMOVE_INSTANCE_STATUS, Instructions.RETURN_MSG, "Status cured"],
        strengthPotion: [Instructions.LITERAL, 'strAdd', Instructions.LITERAL, 2, Instructions.BOOST_INSTANCE_STAT, Instructions.RETURN_MSG, "Strength +2"],
        defensePotion: [Instructions.LITERAL, 'defAdd', Instructions.LITERAL, 1, Instructions.BOOST_INSTANCE_STAT, Instructions.RETURN_MSG, "Defense +1"],
        speedPotion: [Instructions.LITERAL, 'spd', Instructions.LITERAL, 1, Instructions.BOOST_INSTANCE_STAT, Instructions.RETURN_MSG, "Speed +1"]
    }
};
exports.ItemEffects = ItemEffects;
},{"./Utils":17}],8:[function(require,module,exports){
"use strict";
var Prefabs_1 = require('./Prefabs');
var ItemEffects_1 = require('./ItemEffects');
var ItemTypes;
(function (ItemTypes) {
    ItemTypes[ItemTypes["POTION"] = 0] = "POTION";
    ItemTypes[ItemTypes["GOLD"] = 1] = "GOLD";
    ItemTypes[ItemTypes["WEAPON"] = 2] = "WEAPON";
    ItemTypes[ItemTypes["ARMOR"] = 3] = "ARMOR";
})(ItemTypes || (ItemTypes = {}));
exports.ItemTypes = ItemTypes;
;
;
;
;
var ItemFactory = {
    items: {
        redPotion: { tileCode: 'RED_POTION', name: 'Red potion', tile: null, type: ItemTypes.POTION, desc: 'Red potion, unknown effect', discovered: false, stackable: true },
        greenPotion: { tileCode: 'GREEN_POTION', name: 'Green potion', tile: null, type: ItemTypes.POTION, desc: 'Green potion, unknown effect', discovered: false, stackable: true },
        bluePotion: { tileCode: 'BLUE_POTION', name: 'Blue potion', tile: null, type: ItemTypes.POTION, desc: 'Blue potion, unknown effect', discovered: false, stackable: true },
        yellowPotion: { tileCode: 'YELLOW_POTION', name: 'Yellow potion', tile: null, type: ItemTypes.POTION, desc: 'Yellow potion, unknown effect', discovered: false, stackable: true },
        aquaPotion: { tileCode: 'AQUA_POTION', name: 'Aqua potion', tile: null, type: ItemTypes.POTION, desc: 'Aqua potion, unknown effect', discovered: false, stackable: true },
        purplePotion: { tileCode: 'PURPLE_POTION', name: 'Purple potion', tile: null, type: ItemTypes.POTION, desc: 'Purple potion, unknown effect', discovered: false, stackable: true },
        whitePotion: { tileCode: 'WHITE_POTION', name: 'White potion', tile: null, type: ItemTypes.POTION, desc: 'White potion, unknown effect', discovered: false, stackable: true },
        tanPotion: { tileCode: 'TAN_POTION', name: 'Tan potion', tile: null, type: ItemTypes.POTION, desc: 'Tan potion, unknown effect', discovered: false, stackable: true },
        orangePotion: { tileCode: 'ORANGE_POTION', name: 'Orange potion', tile: null, type: ItemTypes.POTION, desc: 'Orange potion, unknown effect', discovered: false, stackable: true },
        gold: { tileCode: 'GOLD', name: 'Gold piece', tile: null, type: ItemTypes.GOLD, desc: 'X Gold piece', stackable: true },
        dagger: { tileCode: 'DAGGER', name: 'Dagger', tile: null, type: ItemTypes.WEAPON, desc: 'Standard iron dagger, easy to handle.', str: '3D5', wear: '1D6' },
        shortSword: { tileCode: 'SWORD', name: 'Short sword', tile: null, type: ItemTypes.WEAPON, desc: 'Pending description', str: '3D6', wear: '1D4' },
        longSword: { tileCode: 'LONG_SWORD', name: 'Long sword', tile: null, type: ItemTypes.WEAPON, desc: 'Pending description', str: '3D10', wear: '1D5' },
        mace: { tileCode: 'MACE', name: 'Mace', tile: null, type: ItemTypes.WEAPON, desc: 'Pending description', str: '4D8', wear: '1D6' },
        spear: { tileCode: 'SPEAR', name: 'Spear', tile: null, type: ItemTypes.WEAPON, desc: 'Pending description', str: '3D8', wear: '1D4' },
        axe: { tileCode: 'AXE', name: 'Battle axe', tile: null, type: ItemTypes.WEAPON, desc: 'Pending description', str: '5D5', wear: '1D4' },
        leatherArmor: { tileCode: 'LEATHER_ARMOR', name: 'Leather armor', tile: null, type: ItemTypes.ARMOR, desc: 'It\'s light and brings medium protection.', def: '2D6', wear: '1D5' },
        scaleMail: { tileCode: 'SCALE_MAIL', name: 'Scale mail', tile: null, type: ItemTypes.ARMOR, desc: 'Pending description', def: '3D6', wear: '1D5' },
        chainMail: { tileCode: 'CHAIN_MAIL', name: 'Chain mail', tile: null, type: ItemTypes.ARMOR, desc: 'Pending description', def: '3D8', wear: '1D4' },
        plateArmor: { tileCode: 'PLATE_ARMOR', name: 'Plate armor', tile: null, type: ItemTypes.ARMOR, desc: 'Pending description', def: '4D8', wear: '1D3' }
    },
    potions: [
        { name: 'Health Potion', desc: 'Restores 2D10+10 health points when drink.', effect: ItemEffects_1.ItemEffects.items.hpPotion },
        { name: 'Life Potion', desc: 'Restores all health points when drink.', effect: ItemEffects_1.ItemEffects.items.lifePotion },
        { name: 'Poison Potion', desc: 'Poisons the consumer by 1D3 for 10 turns.', effect: ItemEffects_1.ItemEffects.items.poisonPotion },
        { name: 'Blind Potion', desc: 'Blinds the consumer by 2D8+15 turns.', effect: ItemEffects_1.ItemEffects.items.blindPotion },
        { name: 'Paralysis Potion', desc: 'Paralyses the consumer by 2D10+10 turns.', effect: ItemEffects_1.ItemEffects.items.paralysisPotion },
        { name: 'Invisibility Potion', desc: 'Makes the consumer invisible by 3D10+15 except for enemies he attacks.', effect: ItemEffects_1.ItemEffects.items.invisibilityPotion },
        { name: 'Cure Potion', desc: 'Removes all damaging effects of the status.', effect: ItemEffects_1.ItemEffects.items.curePotion },
        { name: 'Strength Potion', desc: 'Adds +3 Damage to the attack.', effect: ItemEffects_1.ItemEffects.items.strengthPotion },
        { name: 'Defense Potion', desc: 'Adds +3 to the overall defense.', effect: ItemEffects_1.ItemEffects.items.defensePotion },
        { name: 'Speed Potion', desc: 'Adds +1 to the speed.', effect: ItemEffects_1.ItemEffects.items.speedPotion },
    ],
    useItem: function (item, instance) {
        var msg = null;
        if (item.type == ItemTypes.POTION) {
            msg = "";
            if (!item.discovered) {
                var index = (Math.random() * this.potions.length) << 0;
                var potion = this.potions[index];
                this.potions.splice(index, 1);
                item.name = potion.name;
                item.desc = potion.desc;
                item.effect = potion.effect;
                item.discovered = true;
                msg = "It was a " + item.name + ". ";
            }
            msg += ItemEffects_1.ItemEffects.executeCommand(item.effect, { instance: instance });
        }
        return msg;
    },
    getItem: function (code, amount) {
        if (amount === void 0) { amount = 1; }
        if (!this.items[code]) {
            throw new Error("Invalid item code: [" + code + "]");
        }
        var item = this.items[code];
        if (!item.tile) {
            item.code = code;
            item.tile = Prefabs_1.TilesPrefabs.ITEMS[item.code];
        }
        var ret = {
            amount: amount,
            def: item,
            status: 100
        };
        if (item.type == ItemTypes.WEAPON || item.type == ItemTypes.ARMOR) {
            ret.status = Math.min(60 + Math.floor(Math.random() * 40) + 1, 100);
        }
        return ret;
    }
};
exports.ItemFactory = ItemFactory;
},{"./ItemEffects":7,"./Prefabs":14}],9:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Input_1 = require('./engine/Input');
var Utils_1 = require('./Utils');
var Prefabs_1 = require('./Prefabs');
var PlayerStats_1 = require('./PlayerStats');
var Scenario_1 = require('./Scenario');
var MainMenu = (function (_super) {
    __extends(MainMenu, _super);
    function MainMenu(game) {
        var _this = this;
        _super.call(this);
        this.game = game;
        this.renderer = this.game.renderer;
        this.name = '';
        Input_1.Input.addKeyDownListener(function (keyCode, stat) { _this.handleKeyEvent(keyCode, stat); });
    }
    MainMenu.prototype.handleKeyEvent = function (keyCode, stat) {
        if (stat != 0) {
            return;
        }
        if (keyCode >= 65 && keyCode <= 90) {
            this.name += String.fromCharCode(keyCode);
        }
        else if (keyCode == 8 && this.name.length > 0) {
            this.name = this.name.substring(0, this.name.length - 1);
        }
        else if (keyCode == 13 && this.name.length > 0) {
            PlayerStats_1.PlayerStats.name = this.name;
            this.renderer.clearRect(0, 0, 85, 30);
            this.game.gotoLevel(1, null);
        }
        if (this.name.length > 10) {
            this.name = this.name.substring(0, 10);
        }
    };
    MainMenu.prototype.render = function () {
        this.renderer.clearRect(0, 0, 85, 30);
        Utils_1.Utils.renderText(this.renderer, 1, 1, "CHAMPIONS OF ROGUE", Prefabs_1.Colors.RED, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 59, 1, "By Camilo Ramirez (Fedic)", Prefabs_1.Colors.GOLD, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 3, "An entry for the \"Roguelike Caos #1\" jam", Prefabs_1.Colors.WHITE, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 4, "===================================================================================", Prefabs_1.Colors.WHITE, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 6, "The world has entered a new age of oportunities, with the fall of the dark lord Ias", Prefabs_1.Colors.GRAY, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 7, "many adventures around the world have taken that oportunity to loot the treasures", Prefabs_1.Colors.GRAY, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 8, "hidden within his fortress. Several lords and kings have appear thanks to this   ", Prefabs_1.Colors.GRAY, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 9, "massive amount of fortune, but it was a matter of time before a new lord appear  ", Prefabs_1.Colors.GRAY, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 10, "and decided to take this fortune for himself, a new champion: 'Rogue'.", Prefabs_1.Colors.GRAY, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 12, "Rogue ruled the land for several years and grew an army and fortune but just like", Prefabs_1.Colors.GRAY, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 13, "Ias before him he was destined to doom, defeated by the ones like him, several ", Prefabs_1.Colors.GRAY, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 14, "new champions arrive to the fortress to steal gold and to challenge the current", Prefabs_1.Colors.GRAY, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 15, "champion. ", Prefabs_1.Colors.GRAY, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 17, "Years have passed and a new champion: 'Sodi' has taken the place. You arrive at", Prefabs_1.Colors.GRAY, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 18, "the doors of the fortress, the same which Rogue and many others crossed, will you", Prefabs_1.Colors.GRAY, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 19, "defeat sodi and claim the title of champion? or will you perish along with the  ", Prefabs_1.Colors.GRAY, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 20, "others before you.", Prefabs_1.Colors.GRAY, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 25, "===================================================================================", Prefabs_1.Colors.WHITE, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(this.renderer, 1, 27, "ENTER YOUR NAME ADVENTURER: " + this.name, Prefabs_1.Colors.WHITE, Prefabs_1.Colors.BLACK);
    };
    return MainMenu;
}(Scenario_1.Scenario));
exports.MainMenu = MainMenu;
},{"./PlayerStats":13,"./Prefabs":14,"./Scenario":15,"./Utils":17,"./engine/Input":18}],10:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Prefabs_1 = require('./Prefabs');
var Player_1 = require('./Player');
var Item_1 = require('./Item');
var ItemFactory_1 = require('./ItemFactory');
var Enemy_1 = require('./Enemy');
var EnemyFactory_1 = require('./EnemyFactory');
var Utils_1 = require('./Utils');
var MapGenerator_1 = require('./MapGenerator');
var Stairs_1 = require('./Stairs');
var PlayerStats_1 = require('./PlayerStats');
var Scenario_1 = require('./Scenario');
;
var Map = (function (_super) {
    __extends(Map, _super);
    function Map(game, level) {
        if (level === void 0) { level = 1; }
        _super.call(this);
        this.game = game;
        this.level = level;
        this.renderer = game.renderer;
        this.active = true;
        this.graph = null;
        this.mousePath = null;
        this.mouseDown = 0;
        this.mousePosition = { x: -1, y: -1 };
        this.mousePathTile = this.renderer.getTile(Prefabs_1.Colors.YELLOW, Prefabs_1.Colors.WHITE, { x: 0, y: 0 });
        this.map = [];
        this.view = { x: 0, y: 0 };
        this.player = null;
        this.instances = [];
        this.stairsUp = null;
        this.stairsDown = null;
        this.mapPosition = [0, 2, 60, 23];
        this.fovUpdated = false;
        this.fovDistance = 30;
        this.playerTurn = true;
        this.tileDescription = null;
        this.createMap();
        this.updateFOV(this.player.x, this.player.y);
    }
    Map.prototype.createMap = function () {
        MapGenerator_1.MapGenerator.init(parseInt(this.game.gameSeed + "" + this.level, 10));
        var newMap = MapGenerator_1.MapGenerator.generateMap(this.level);
        var map = newMap.map;
        var solidMap = new Array(map[0].length);
        for (var i = 0; i < solidMap.length; i++) {
            solidMap[i] = new Array(map.length);
        }
        for (var y = 0, yl = map.length; y < yl; y++) {
            this.map[y] = new Array(map[y].length);
            for (var x = 0, xl = map[y].length; x < xl; x++) {
                var t = map[y][x];
                var tile = Prefabs_1.TilesPrefabs.TILES["BLANK"];
                var weight = 1;
                if (t == 1) {
                    tile = Prefabs_1.TilesPrefabs.TILES["FLOOR"];
                }
                else if (t == 2) {
                    tile = Prefabs_1.TilesPrefabs.TILES["WATER"];
                    weight = 1.5;
                }
                else if (t == 3) {
                    tile = Prefabs_1.TilesPrefabs.TILES["WATER_DEEP"];
                    weight = 2;
                }
                else if (t == 4) {
                    tile = Prefabs_1.TilesPrefabs.TILES["WALL"];
                    weight = 0;
                }
                this.map[y][x] = {
                    tile: tile,
                    visible: 0
                };
                solidMap[x][y] = weight;
            }
        }
        this.graph = new Graph(solidMap, { diagonal: true });
        this.player = new Player_1.Player(newMap.player.x, newMap.player.y, this);
        this.instances.push(this.player);
        var newInstance;
        if (newMap.stairsUp) {
            newInstance = new Stairs_1.Stairs(newMap.stairsUp.x, newMap.stairsUp.y, this, this.level - 1, Prefabs_1.TilesPrefabs.TILES["STAIRS_UP"]);
            this.stairsUp = newInstance;
            this.instances.push(newInstance);
        }
        if (newMap.stairsDown) {
            newInstance = new Stairs_1.Stairs(newMap.stairsDown.x, newMap.stairsDown.y, this, this.level + 1, Prefabs_1.TilesPrefabs.TILES["STAIRS_DOWN"]);
            this.stairsDown = newInstance;
            this.instances.push(newInstance);
        }
        for (var i = 0, ins = void 0; ins = newMap.instances[i]; i++) {
            if (ins.type == "item") {
                newInstance = new Item_1.Item(ins.x, ins.y, this, ItemFactory_1.ItemFactory.getItem(ins.code));
            }
            else if (ins.type == "enemy") {
                newInstance = new Enemy_1.Enemy(ins.x, ins.y, this, EnemyFactory_1.EnemyFactory.getEnemy(ins.code));
            }
            else if (ins.type == "gold") {
                newInstance = new Item_1.Item(ins.x, ins.y, this, ItemFactory_1.ItemFactory.getItem("gold", ins.amount));
            }
            this.instances.push(newInstance);
        }
    };
    Map.prototype.getInstanceAt = function (x, y) {
        for (var i = 1, ins = void 0; ins = this.instances[i]; i++) {
            if (ins.x == x && ins.y == y) {
                return ins;
            }
        }
        return null;
    };
    Map.prototype.createItem = function (x, y, item) {
        var newItem = new Item_1.Item(x, y, this, item);
        newItem.playerOnTile = true;
        this.instances.push(newItem);
    };
    Map.prototype.isSolid = function (x, y) {
        return (this.map[y][x].tile.type == Prefabs_1.TileTypes.WALL);
    };
    Map.prototype.getTileAt = function (x, y) {
        return this.map[y][x].tile;
    };
    Map.prototype.getPath = function (x1, y1, x2, y2) {
        var start = this.graph.grid[x1][y1];
        var end = this.graph.grid[x2][y2];
        var result = astar.search(this.graph, start, end, { heuristic: astar.heuristics.diagonal });
        var ret = [];
        for (var i = 0, r = void 0; r = result[i]; i++) {
            ret.push(r.x);
            ret.push(r.y);
        }
        return ret;
    };
    Map.prototype.onMouseMove = function (x, y) {
        if (x == null) {
            this.mousePath = null;
            this.mousePosition = { x: -1, y: -1 };
            return false;
        }
        var x1 = this.player.x, y1 = this.player.y, x2 = x + this.view.x, y2 = y + this.view.y;
        this.mousePath = this.getPath(x1, y1, x2, y2);
        this.mousePosition = { x: x2, y: y2 };
        return true;
    };
    Map.prototype.onMouseHandler = function (x, y, stat) {
        if (this.mouseDown == 2 && stat == 1)
            return;
        this.mouseDown = stat;
        if (this.mouseDown == 1) {
            this.mouseDown = 2;
            if (this.player.movePath)
                return;
            this.onMouseMove(x, y);
            if (this.mousePath.length > 0) {
                this.player.movePath = this.mousePath.slice(0, this.mousePath.length);
            }
        }
    };
    Map.prototype.copyMapIntoTexture = function () {
        var xs = this.view.x, ys = this.view.y, xe = xs + this.mapPosition[2], ye = ys + this.mapPosition[3], mp = this.mapPosition, tile;
        for (var y = ys; y < ye; y++) {
            for (var x = xs; x < xe; x++) {
                tile = this.map[y][x];
                var renderTile = tile.tile.light;
                if (tile.visible == 0) {
                    renderTile = Prefabs_1.TilesPrefabs.TILES["BLANK"].light;
                }
                else if (tile.visible == 1) {
                    renderTile = tile.tile.dark;
                    tile.visible = 1;
                }
                else if (tile.visible == 2 && this.fovUpdated) {
                    renderTile = tile.tile.dark;
                    tile.visible = 1;
                }
                else if (tile.visible == 3) {
                    renderTile = tile.tile.light;
                    tile.visible = 2;
                }
                this.renderer.plot(x - xs + mp[0], y - ys + mp[1], renderTile);
            }
        }
        this.fovUpdated = false;
    };
    Map.prototype.castLightRay = function (x1, y1, x2, y2) {
        var x = x2 - x1, y = y1 - y2, angle = Math.atan2(y, x), jx = Math.cos(angle) * 0.5, jy = -Math.sin(angle) * 0.5, rx = x1 + 0.5, ry = y1 + 0.5, cx, cy, search = true, d = 0, md = this.fovDistance / 2;
        while (search) {
            cx = rx << 0;
            cy = ry << 0;
            if (!this.map[cy]) {
                search = false;
            }
            if (!this.map[cy][cx]) {
                search = false;
            }
            this.map[cy][cx].visible = 3;
            if (this.isSolid(cx, cy)) {
                search = false;
            }
            if (d++ >= md) {
                search = false;
            }
            rx += jx;
            ry += jy;
        }
    };
    Map.prototype.updateFOV = function (x, y) {
        var distance = this.fovDistance;
        for (var i = 0; i <= distance; i += 1) {
            this.castLightRay(x, y, x - distance / 2, y - distance / 2 + i);
            this.castLightRay(x, y, x + distance / 2, y - distance / 2 + i);
            this.castLightRay(x, y, x - distance / 2 + i, y - distance / 2);
            this.castLightRay(x, y, x - distance / 2 + i, y + distance / 2);
        }
        this.fovUpdated = true;
        this.mousePath = null;
    };
    Map.prototype.updateView = function () {
        this.view.x = Math.max(this.player.x - 33, 0);
        this.view.y = Math.max(this.player.y - 11, 0);
        if (this.view.x + this.mapPosition[2] > this.map[0].length) {
            this.view.x = this.map[0].length - this.mapPosition[2];
        }
        if (this.view.y + this.mapPosition[3] > this.map.length) {
            this.view.y = this.map.length - this.mapPosition[3];
        }
    };
    Map.prototype.renderMousePath = function () {
        if (!this.mousePath)
            return;
        if (this.player.movePath)
            return;
        var x, y;
        for (var i = 0, l = this.mousePath.length; i < l; i += 2) {
            var tile = this.map[this.mousePath[i + 1]][this.mousePath[i]];
            if (!tile.visible) {
                return;
            }
            x = this.mousePath[i] - this.view.x + this.mapPosition[0];
            y = this.mousePath[i + 1] - this.view.y + this.mapPosition[1];
            if (x < 0 || y < 0 || x >= this.mapPosition[2] + this.mapPosition[0] || y >= this.mapPosition[3] + this.mapPosition[1]) {
                continue;
            }
            this.renderer.plotBackground(x, y, this.mousePathTile);
        }
    };
    Map.prototype.renderDescription = function () {
        this.renderer.clearRect(0, 0, this.mapPosition[2], 2);
        if (!this.tileDescription) {
            return;
        }
        var x = (this.mapPosition[2] / 2 - this.tileDescription.length / 2) << 0;
        for (var i = 0, c = void 0; c = this.tileDescription[i]; i++) {
            this.renderer.plot(x + i, 1, Utils_1.Utils.getTile(this.renderer, c, Prefabs_1.Colors.WHITE, Prefabs_1.Colors.BLACK));
        }
    };
    Map.prototype.render = function () {
        this.playerTurn = true;
        this.tileDescription = null;
        this.copyMapIntoTexture();
        this.renderMousePath();
        var discover = null;
        for (var i = 0, ins = void 0; ins = this.instances[i]; i++) {
            ins.update();
            if (ins.destroy) {
                this.instances.splice(i, 1);
                i--;
                continue;
            }
            if (this.map[ins.y][ins.x].visible >= 2) {
                this.renderer.plotCharacter(ins.x - this.view.x + this.mapPosition[0], ins.y - this.view.y + this.mapPosition[1], ins.tile.light);
                if (ins.stopOnDiscover && !ins.inShadow && !ins.discovered) {
                    ins.discovered = true;
                    if (discover == null) {
                        discover = "You see a " + ins.name;
                    }
                    else {
                        discover += ", " + ins.name;
                    }
                }
            }
            else if (ins.visibleInShadow && this.map[ins.y][ins.x].visible == 1) {
                this.renderer.plotCharacter(ins.x - this.view.x + this.mapPosition[0], ins.y - this.view.y + this.mapPosition[1], ins.tile.dark);
            }
        }
        if (discover != null && !PlayerStats_1.PlayerStats.blind) {
            var text = Utils_1.Utils.formatText(discover + ".", 85);
            for (var i = 0, line = void 0; line = discover[i]; i++) {
                this.game.console.addMessage(line, Prefabs_1.Colors.WHITE);
            }
            this.player.movePath = null;
        }
        if (PlayerStats_1.PlayerStats.blind) {
            this.renderer.clearRect(this.mapPosition[0], this.mapPosition[1], this.mapPosition[2], this.mapPosition[3]);
        }
        this.renderer.plotCharacter(this.player.x - this.view.x + this.mapPosition[0], this.player.y - this.view.y + this.mapPosition[1], this.player.tile.light);
        this.renderDescription();
    };
    return Map;
}(Scenario_1.Scenario));
exports.Map = Map;
},{"./Enemy":2,"./EnemyFactory":3,"./Item":6,"./ItemFactory":8,"./MapGenerator":11,"./Player":12,"./PlayerStats":13,"./Prefabs":14,"./Scenario":15,"./Stairs":16,"./Utils":17}],11:[function(require,module,exports){
"use strict";
var PRNG_1 = require('./engine/PRNG');
var Room = (function () {
    function Room(x, y, w, h, room) {
        if (room === void 0) { room = true; }
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.room = room;
        this.doors = [];
        this.north = false;
        this.west = false;
        this.south = false;
        this.east = false;
        this.active = true;
    }
    Room.prototype.checkSide = function (side) {
        if (side == 0 && this.west) {
            return false;
        }
        else if (side == 1 && this.north) {
            return false;
        }
        else if (side == 2 && this.east) {
            return false;
        }
        else if (side == 3 && this.south) {
            return false;
        }
        return true;
    };
    Room.prototype.hasSides = function () {
        return !(this.west && this.north && this.south && this.east);
    };
    Room.prototype.setSide = function (side) {
        if (side == 0) {
            this.west = true;
        }
        else if (side == 1) {
            this.north = true;
        }
        else if (side == 2) {
            this.east = true;
        }
        else if (side == 3) {
            this.south = true;
        }
        return false;
    };
    return Room;
}());
var MapGenerator = {
    seed: null,
    prng: null,
    map: null,
    rooms: null,
    player: null,
    stairsUp: null,
    stairsDown: null,
    instances: null,
    init: function (seed) {
        if (seed === void 0) { seed = null; }
        this.map = null;
        this.rooms = null;
        this.player = null;
        this.stairsUp = null;
        this.stairsDown = null;
        this.instances = [];
        this.prng = new PRNG_1.PRNG(seed);
        this.seed = this.prng.seed;
    },
    createGrid: function (size) {
        var grid = new Array(size[1]);
        for (var y = 0; y < size[1]; y++) {
            grid[y] = new Array(size[0]);
            for (var x = 0; x < size[0]; x++) {
                grid[y][x] = 0;
            }
        }
        return grid;
    },
    createStartRoom: function (level) {
        var room;
        if (level == 1) {
            room = new Room(40, 24, 6, 6);
            room.south = true;
        }
        else {
            var x = void 0, y = void 0, w = void 0, h = void 0;
            x = Math.floor(this.prng.random() * 60);
            y = Math.floor(this.prng.random() * 10);
            w = 5 + Math.floor(this.prng.random() * 5);
            h = 5 + Math.floor(this.prng.random() * 5);
            room = new Room(x, y, w, h);
        }
        return room;
    },
    isOutOfBounds: function (x, y, w, h) {
        return (x < 0 || y < 0 || x + w >= 85 || y + h >= 30);
    },
    isCollision: function (x, y, w, h, ignore) {
        for (var i = 0, r = void 0; r = this.rooms[i]; i++) {
            if (r == ignore) {
                continue;
            }
            if (x + w < r.x) {
                continue;
            }
            if (y + h < r.y) {
                continue;
            }
            if (x >= r.x + r.w) {
                continue;
            }
            if (y >= r.y + r.h) {
                continue;
            }
            return true;
        }
        return false;
    },
    createRoom: function (room, side, isRoom) {
        if (isRoom === void 0) { isRoom = true; }
        var door_x, door_y, x, y, w, h;
        if (side == 0) {
            door_x = room.x;
            door_y = room.y + 1 + Math.floor(this.prng.random() * (room.h - 2));
            w = 5 + Math.floor(this.prng.random() * 5);
            h = (!isRoom) ? 3 : 5 + Math.floor(this.prng.random() * 5);
            x = room.x - w + 1;
            y = door_y - Math.floor(h / 2);
            if (this.isOutOfBounds(x, y, w, h)) {
                return null;
            }
            if (this.isCollision(x, y, w, h, room)) {
                return null;
            }
            side = 2;
            room.west = true;
        }
        else if (side == 1) {
            door_x = room.x + 1 + Math.floor(this.prng.random() * (room.w - 2));
            door_y = room.y;
            w = (!isRoom) ? 3 : 5 + Math.floor(this.prng.random() * 5);
            h = 5 + Math.floor(this.prng.random() * 5);
            x = door_x - Math.floor(w / 2);
            y = room.y - h + 1;
            if (this.isOutOfBounds(x, y, w, h)) {
                return null;
            }
            if (this.isCollision(x, y, w, h, room)) {
                return null;
            }
            side = 3;
            room.north = true;
        }
        else if (side == 2) {
            door_x = room.x + room.w - 1;
            door_y = room.y + 1 + Math.floor(this.prng.random() * (room.h - 2));
            w = 5 + Math.floor(this.prng.random() * 5);
            h = (!isRoom) ? 3 : 5 + Math.floor(this.prng.random() * 5);
            x = room.x + room.w - 1;
            y = door_y - Math.floor(h / 2);
            if (this.isOutOfBounds(x, y, w, h)) {
                return null;
            }
            if (this.isCollision(x, y, w, h, room)) {
                return null;
            }
            side = 0;
            room.east = true;
        }
        else if (side == 3) {
            door_x = room.x + 1 + Math.floor(this.prng.random() * (room.w - 2));
            door_y = room.y + room.h - 1;
            w = (!isRoom) ? 3 : 5 + Math.floor(this.prng.random() * 5);
            h = 5 + Math.floor(this.prng.random() * 5);
            x = door_x - Math.floor(w / 2);
            y = room.y + room.h - 1;
            if (this.isOutOfBounds(x, y, w, h)) {
                return null;
            }
            if (this.isCollision(x, y, w, h, room)) {
                return null;
            }
            side = 1;
            room.south = true;
        }
        var hall = new Room(x, y, w, h, isRoom);
        hall.setSide(side);
        room.doors.push({ x: door_x, y: door_y, room: hall });
        hall.doors.push({ x: door_x, y: door_y, room: room });
        return hall;
    },
    connectEmptyHallways: function () {
        for (var i = 0, r = void 0; r = this.rooms[i]; i++) {
            if (r.room) {
                continue;
            }
            if (r.doors.length > 1) {
                continue;
            }
            var newRoom = null;
            var tries = 0;
            while (!newRoom && tries++ < 10) {
                var side = Math.floor(this.prng.random() * 4);
                while (!r.checkSide(side)) {
                    side = Math.floor(this.prng.random() * 4);
                }
                newRoom = this.createRoom(r, side);
            }
            if (newRoom) {
                this.rooms.push(newRoom);
            }
        }
    },
    renderOnMap: function () {
        var map = this.map;
        for (var i = 0, r = void 0; r = this.rooms[i]; i++) {
            for (var y = r.y; y < r.y + r.h; y++) {
                for (var x = r.x; x < r.x + r.w; x++) {
                    var t = (y == r.y || x == r.x || y == r.y + r.h - 1 || x == r.x + r.w - 1) ? 4 : 1;
                    map[y][x] = t;
                }
            }
            for (var j = 0, dr = void 0; dr = r.doors[j]; j++) {
                if (!dr.room.active) {
                    continue;
                }
                map[dr.y][dr.x] = 1;
            }
        }
    },
    createPlayerPosition: function (level) {
        var r = this.rooms[0];
        if (level == 1) {
            this.player = {
                x: 43,
                y: 28
            };
        }
        else {
            this.player = {
                x: r.x + 2 + Math.floor(this.prng.random() * (r.w - 4)),
                y: r.y + 2 + Math.floor(this.prng.random() * (r.h - 4))
            };
        }
    },
    createStairs: function (level) {
        if (level > 1 && level < 20) {
            this.stairsUp = {
                x: this.player.x,
                y: this.player.y
            };
        }
        if (level < 20) {
            var room = this.rooms[1 + ((this.prng.random() * (this.rooms.length - 1)) << 0)];
            while (!room.room) {
                room = this.rooms[1 + ((this.prng.random() * (this.rooms.length - 1)) << 0)];
            }
            this.stairsDown = {
                x: room.x + 2 + Math.floor(this.prng.random() * (room.w - 4)),
                y: room.y + 2 + Math.floor(this.prng.random() * (room.h - 4))
            };
        }
    },
    isSolid: function (x, y) {
        if (this.stairsDown && this.stairsDown.x == x && this.stairsDown.y == y) {
            return true;
        }
        if (this.stairsUp && this.stairsUp.x == x && this.stairsUp.y == y) {
            return true;
        }
        if (this.player && this.player.x == x && this.player.y == y) {
            return true;
        }
        for (var i = 0, ins = void 0; ins = this.instances[i]; i++) {
            if (ins.x == x && ins.y == y) {
                return true;
            }
        }
        return false;
    },
    createInstances: function (level) {
        var items, enemies, numItems, numEnemies, gold, room, x, y;
        if (level == 1) {
            items = [["redPotion", 15], ["bluePotion", 15], ["greenPotion", 15], ["dagger", 15], ["shortSword", 5], ["leatherArmor", 10]];
            enemies = [["rat", 60], ["spider", 15], ["kobold", 50]];
            numItems = 5;
            numEnemies = 5;
            gold = 3;
        }
        else if (level == 2) {
            items = [["redPotion", 10], ["bluePotion", 10], ["yellowPotion", 10], ["greenPotion", 10], ["dagger", 15], ["shortSword", 5], ["leatherArmor", 10]];
            enemies = [["rat", 50], ["spider", 30], ["kobold", 50]];
            numItems = 5;
            numEnemies = 7;
            gold = 3;
        }
        else if (level == 3) {
            items = [["redPotion", 8], ["bluePotion", 8], ["yellowPotion", 8], ["greenPotion", 8], ["aquaPotion", 8], ["dagger", 10], ["shortSword", 10], ["leatherArmor", 6]];
            enemies = [["imp", 30], ["spider", 50], ["kobold", 70]];
            numItems = 4;
            numEnemies = 8;
            gold = 4;
        }
        else if (level == 4) {
            items = [["redPotion", 5], ["bluePotion", 5], ["yellowPotion", 5], ["greenPotion", 6], ["aquaPotion", 5], ["purplePotion", 5], ["dagger", 10], ["shortSword", 20], ["longSword", 10], ["mace", 10], ["leatherArmor", 10], ["scaleMail", 10]];
            enemies = [["imp", 50], ["spider", 20], ["kobold", 50]];
            numItems = 8;
            numEnemies = 10;
            gold = 5;
        }
        else if (level == 5) {
            items = [["redPotion", 5], ["bluePotion", 5], ["yellowPotion", 5], ["greenPotion", 6], ["aquaPotion", 5], ["purplePotion", 5], ["whitePotion", 5], ["dagger", 10], ["shortSword", 20], ["longSword", 10], ["mace", 10], ["leatherArmor", 10], ["scaleMail", 10]];
            enemies = [["imp", 50], ["spider", 10], ["kobold", 50], ["goblin", 40], ["zombie", 20]];
            numItems = 8;
            numEnemies = 12;
            gold = 7;
        }
        else if (level == 6) {
            items = [["redPotion", 5], ["bluePotion", 5], ["yellowPotion", 5], ["greenPotion", 6], ["aquaPotion", 5], ["purplePotion", 5], ["whitePotion", 5], ["tanPotion", 5], ["spear", 10], ["shortSword", 20], ["longSword", 10], ["mace", 10], ["leatherArmor", 10], ["scaleMail", 10]];
            enemies = [["imp", 40], ["rogue", 10], ["kobold", 50], ["goblin", 40], ["zombie", 20]];
            numItems = 10;
            numEnemies = 12;
            gold = 8;
        }
        else if (level == 7) {
            items = [["redPotion", 5], ["bluePotion", 5], ["yellowPotion", 5], ["greenPotion", 6], ["aquaPotion", 5], ["purplePotion", 5], ["whitePotion", 5], ["tanPotion", 5], ["orangePotion", 5], ["spear", 10], ["shortSword", 20], ["longSword", 10], ["mace", 10], ["leatherArmor", 10], ["scaleMail", 10]];
            enemies = [["imp", 30], ["rogue", 20], ["beggar", 50], ["goblin", 40], ["zombie", 30]];
            numItems = 10;
            numEnemies = 14;
            gold = 8;
        }
        else if (level == 8) {
            items = [["redPotion", 5], ["bluePotion", 5], ["yellowPotion", 5], ["greenPotion", 6], ["aquaPotion", 5], ["purplePotion", 5], ["whitePotion", 5], ["tanPotion", 5], ["orangePotion", 5], ["spear", 10], ["shortSword", 20], ["longSword", 10], ["mace", 10], ["axe", 10], ["chaimMail", 5], ["scaleMail", 10]];
            enemies = [["imp", 30], ["rogue", 20], ["beggar", 50], ["goblin", 40], ["zombie", 30], ["shadow", 10], ["thief", 30]];
            numItems = 11;
            numEnemies = 16;
            gold = 10;
        }
        else if (level == 9) {
            items = [["redPotion", 5], ["bluePotion", 5], ["yellowPotion", 5], ["greenPotion", 6], ["aquaPotion", 5], ["purplePotion", 5], ["whitePotion", 5], ["tanPotion", 5], ["orangePotion", 5], ["spear", 10], ["shortSword", 20], ["longSword", 10], ["mace", 10], ["axe", 10], ["chaimMail", 5], ["scaleMail", 10]];
            enemies = [["rogue", 20], ["beggar", 50], ["goblin", 40], ["zombie", 30], ["shadow", 30], ["thief", 30]];
            numItems = 11;
            numEnemies = 17;
            gold = 10;
        }
        else if (level >= 10 && level <= 14) {
            items = [["redPotion", 5], ["bluePotion", 5], ["yellowPotion", 5], ["greenPotion", 6], ["aquaPotion", 5], ["purplePotion", 5], ["whitePotion", 5], ["tanPotion", 5], ["orangePotion", 5], ["spear", 10], ["shortSword", 20], ["longSword", 10], ["mace", 10], ["axe", 10], ["chaimMail", 5], ["scaleMail", 10]];
            enemies = [["rat", 3], ["spider", 3], ["kobold", 3], ["imp", 3], ["goblin", 5], ["zombie", 7], ["ogre", 10], ["beggar", 10], ["shadow", 20], ["thief", 20], ["rogue", 30], ["caosKnight", 30], ["lizardWarrior", 10], ["ophidian", 10], ["caosServant", 7], ["wyvernKnight", 5], ["caosLord", 3]];
            numItems = 13;
            numEnemies = 17 + (level - 10) * 2;
            gold = 12;
        }
        else if (level >= 15 && level <= 19) {
            items = [["redPotion", 5], ["bluePotion", 5], ["yellowPotion", 5], ["greenPotion", 6], ["aquaPotion", 5], ["purplePotion", 5], ["whitePotion", 5], ["tanPotion", 5], ["orangePotion", 5], ["spear", 10], ["shortSword", 20], ["longSword", 10], ["mace", 10], ["axe", 10], ["chaimMail", 5], ["scaleMail", 10]];
            enemies = [["rat", 1], ["spider", 1], ["kobold", 1], ["imp", 1], ["goblin", 3], ["zombie", 5], ["ogre", 7], ["beggar", 3], ["shadow", 10], ["thief", 30], ["rogue", 40], ["caosKnight", 40], ["lizardWarrior", 20], ["ophidian", 20], ["caosServant", 20], ["wyvernKnight", 20], ["caosLord", 20]];
            numItems = 15;
            numEnemies = 20 + (level - 15) * 2;
            gold = 14;
        }
        else if (level == 20) {
            items = [];
            enemies = [["sodi", 200]];
            numItems = 0;
            numEnemies = 1;
            gold = 0;
        }
        for (var i = 0; i < numItems; i++) {
            var itemCode = items[Math.floor(Math.random() * items.length)];
            if (this.prng.random() * 100 > itemCode[1]) {
                i--;
                continue;
            }
            room = this.rooms[1 + ((this.prng.random() * (this.rooms.length - 1)) << 0)];
            while (!room.room) {
                room = this.rooms[1 + ((this.prng.random() * (this.rooms.length - 1)) << 0)];
            }
            x = room.x + 1 + Math.floor(this.prng.random() * (room.w - 2));
            y = room.y + 1 + Math.floor(this.prng.random() * (room.h - 2));
            if (this.isSolid(x, y)) {
                i--;
                continue;
            }
            this.instances.push({
                x: x,
                y: y,
                type: 'item',
                code: itemCode[0]
            });
        }
        for (var i = 0; i < numEnemies; i++) {
            var enemyCode = enemies[Math.floor(Math.random() * enemies.length)];
            if (this.prng.random() * 100 > enemyCode[1]) {
                i--;
                continue;
            }
            room = this.rooms[1 + ((this.prng.random() * (this.rooms.length - 1)) << 0)];
            while (!room.room) {
                room = this.rooms[1 + ((this.prng.random() * (this.rooms.length - 1)) << 0)];
            }
            x = room.x + 1 + Math.floor(this.prng.random() * (room.w - 2));
            y = room.y + 1 + Math.floor(this.prng.random() * (room.h - 2));
            if (this.isSolid(x, y)) {
                i--;
                continue;
            }
            this.instances.push({
                x: x,
                y: y,
                type: 'enemy',
                code: enemyCode[0]
            });
        }
        for (var i_1 = 0; i_1 < gold; i_1++) {
            room = this.rooms[1 + ((this.prng.random() * (this.rooms.length - 1)) << 0)];
            while (!room.room) {
                room = this.rooms[1 + ((this.prng.random() * (this.rooms.length - 1)) << 0)];
            }
            x = room.x + 1 + Math.floor(this.prng.random() * (room.w - 2));
            y = room.y + 1 + Math.floor(this.prng.random() * (room.h - 2));
            if (this.isSolid(x, y)) {
                i_1--;
                continue;
            }
            var amount = 10 + Math.floor(this.prng.random() * 30);
            this.instances.push({
                x: x,
                y: y,
                type: 'gold',
                amount: amount
            });
        }
    },
    generateMap: function (level) {
        var size = [75 + 20 * level, 20 + 10 * level];
        this.map = this.createGrid(size);
        this.rooms = [this.createStartRoom(level)];
        var roomsTarget = 14 + level;
        var roomsCreated = 1;
        var tries = 0;
        while (roomsCreated < roomsTarget) {
            if (tries++ >= 100) {
                break;
            }
            var r = this.rooms[(this.prng.random() * this.rooms.length) << 0];
            while (!r.hasSides()) {
                r = this.rooms[(this.prng.random() * this.rooms.length) << 0];
            }
            var side = Math.floor(this.prng.random() * 4);
            while (!r.checkSide(side)) {
                side = Math.floor(this.prng.random() * 4);
            }
            var feature = Math.floor(this.prng.random() * 2);
            var newRoom = void 0;
            if (feature == 0) {
                newRoom = this.createRoom(r, side, false);
                if (newRoom) {
                    tries = 0;
                    this.rooms.push(newRoom);
                }
            }
            else {
                newRoom = this.createRoom(r, side);
                if (newRoom) {
                    tries = 0;
                    this.rooms.push(newRoom);
                    roomsCreated += 1;
                }
            }
        }
        this.connectEmptyHallways();
        this.createPlayerPosition(level);
        this.createStairs(level);
        this.createInstances(level);
        this.renderOnMap();
        return {
            map: this.map,
            player: this.player,
            stairsUp: this.stairsUp,
            stairsDown: this.stairsDown,
            instances: this.instances
        };
    }
};
exports.MapGenerator = MapGenerator;
},{"./engine/PRNG":19}],12:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Prefabs_1 = require('./Prefabs');
var PlayerStats_1 = require('./PlayerStats');
var Input_1 = require('./engine/Input');
var Utils_1 = require('./Utils');
var Instance_1 = require('./Instance');
;
;
var Player = (function (_super) {
    __extends(Player, _super);
    function Player(x, y, map) {
        var _this = this;
        _super.call(this, x, y, map, Prefabs_1.TilesPrefabs.PLAYER);
        this.keys = {
            UP: 0,
            LEFT: 0,
            DOWN: 0,
            RIGHT: 0,
            REST: 0
        };
        this.movePath = null;
        this.autoMoveDelay = 0;
        this.moveWait = 4;
        this.keys = {
            UP: 0,
            LEFT: 0,
            DOWN: 0,
            RIGHT: 0,
            REST: 0
        };
        this.mouse = {
            x: -1,
            y: 0,
            stat: -1
        };
        Input_1.Input.addKeyDownListener(function (keyCode, stat) { _this.handleKeyEvent(keyCode, stat); });
        Input_1.Input.addMouseMoveListener(function (x, y) { _this.onMouseMove(x, y); });
        Input_1.Input.addMouseDownListener(function (x, y, stat) { _this.onMouseHandler(x, y, stat); });
    }
    Player.prototype.onMouseMove = function (x, y) {
        if (!this.map.active)
            return;
        this.mouse.x = x;
        this.mouse.y = y;
    };
    Player.prototype.onMouseHandler = function (x, y, stat) {
        if (!this.map.active)
            return;
        if (this.mouse.stat == 2 && stat == 1) {
            return;
        }
        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.stat = stat;
    };
    Player.prototype.handleKeyEvent = function (keyCode, stat) {
        if (PlayerStats_1.PlayerStats.dead && keyCode == 13) {
            this.map.game.restartGame = true;
        }
        if (!this.map.active)
            return;
        var key = null;
        switch (keyCode) {
            case Input_1.Input.keys.W:
            case Input_1.Input.keys.UP:
                key = 'UP';
                break;
            case Input_1.Input.keys.A:
            case Input_1.Input.keys.LEFT:
                key = 'LEFT';
                break;
            case Input_1.Input.keys.X:
            case Input_1.Input.keys.DOWN:
                key = 'DOWN';
                break;
            case Input_1.Input.keys.D:
            case Input_1.Input.keys.RIGHT:
                key = 'RIGHT';
                break;
            case Input_1.Input.keys.Q:
                this.handleKeyEvent(Input_1.Input.keys.LEFT, stat);
                key = 'UP';
                break;
            case Input_1.Input.keys.E:
                this.handleKeyEvent(Input_1.Input.keys.RIGHT, stat);
                key = 'UP';
                break;
            case Input_1.Input.keys.Z:
                this.handleKeyEvent(Input_1.Input.keys.LEFT, stat);
                key = 'DOWN';
                break;
            case Input_1.Input.keys.C:
                this.handleKeyEvent(Input_1.Input.keys.RIGHT, stat);
                key = 'DOWN';
                break;
            case Input_1.Input.keys.S:
            case Input_1.Input.keys.SPACE:
                key = 'REST';
                break;
        }
        if (key == null) {
            return;
        }
        if (stat == 1 && this.keys[key] >= 2) {
            this.keys[key] -= 1;
            return;
        }
        this.keys[key] = stat;
    };
    Player.prototype.act = function () {
        this.map.playerTurn = false;
        PlayerStats_1.PlayerStats.updateStatus();
    };
    Player.prototype.attackTo = function (ins) {
        var enemy = ins.enemy;
        var missed = (Math.random() * 100) < enemy.def.luk;
        var msg = "You attack the " + enemy.def.name;
        if (missed) {
            return this.map.game.console.addMessage(msg + ", missed!", Prefabs_1.Colors.RED);
        }
        var str = Utils_1.Utils.rollDice(PlayerStats_1.PlayerStats.getStr());
        var def = Utils_1.Utils.rollDice(enemy.def.def);
        var dmg = Math.max(str - def, 1);
        if (ins.receiveDamage(dmg)) {
            this.map.game.console.addMessage("You killed the " + enemy.def.name, Prefabs_1.Colors.WHITE);
        }
        else {
            this.map.game.console.addMessage(msg + ", hit by " + dmg + " points", Prefabs_1.Colors.GREEN);
        }
        PlayerStats_1.PlayerStats.wearWeapon();
        this.act();
    };
    Player.prototype.moveTo = function (xTo, yTo) {
        if (PlayerStats_1.PlayerStats.paralyzed) {
            this.act();
            return false;
        }
        if (this.map.isSolid(this.x + xTo, this.y + yTo)) {
            return;
        }
        var ins = this.map.getInstanceAt(this.x + xTo, this.y + yTo);
        if (ins && ins.enemy) {
            this.attackTo(ins);
            this.movePath = null;
            return false;
        }
        _super.prototype.moveTo.call(this, xTo, yTo);
        this.map.updateFOV(this.x, this.y);
        this.act();
        return true;
    };
    Player.prototype.checkMovement = function () {
        var xTo = 0, yTo = 0;
        if (this.keys['UP'] == 1) {
            yTo = -1;
            this.keys['UP'] = this.moveWait;
        }
        else if (this.keys['DOWN'] == 1) {
            yTo = +1;
            this.keys['DOWN'] = this.moveWait;
        }
        if (this.keys['LEFT'] == 1) {
            xTo = -1;
            this.keys['LEFT'] = this.moveWait;
        }
        else if (this.keys['RIGHT'] == 1) {
            xTo = +1;
            this.keys['RIGHT'] = this.moveWait;
        }
        if (xTo != 0 || yTo != 0) {
            this.moveTo(xTo, yTo);
        }
    };
    Player.prototype.followPath = function () {
        if (this.autoMoveDelay-- > 0) {
            return;
        }
        var xTo = this.movePath.shift() - this.x;
        var yTo = this.movePath.shift() - this.y;
        if (!this.moveTo(xTo, yTo)) {
            return;
        }
        this.autoMoveDelay = this.moveWait;
        if (this.movePath.length == 0) {
            this.movePath = null;
        }
    };
    Player.prototype.updateMouse = function () {
        if (this.mouse.x == -1) {
            return;
        }
        this.map.game.onMouseMove(this.mouse.x, this.mouse.y);
        if (this.mouse.stat != 2) {
            this.map.game.onMouseHandler(this.mouse.x, this.mouse.y, this.mouse.stat);
            if (this.mouse.stat == 1) {
                this.mouse.stat = 2;
            }
        }
        this.mouse.x = -1;
    };
    Player.prototype.checkSkip = function () {
        if (this.keys["REST"] == 1) {
            this.keys["REST"] = this.moveWait;
            this.act();
            return true;
        }
        return false;
    };
    Player.prototype.update = function () {
        if (PlayerStats_1.PlayerStats.dead) {
            return;
        }
        if (!this.map.playerTurn) {
            return;
        }
        if (this.checkSkip()) {
            return;
        }
        this.updateMouse();
        if (this.map.game.itemDesc) {
            return;
        }
        if (this.movePath) {
            this.followPath();
        }
        else {
            this.checkMovement();
        }
        this.map.updateView();
    };
    return Player;
}(Instance_1.Instance));
exports.Player = Player;
},{"./Instance":5,"./PlayerStats":13,"./Prefabs":14,"./Utils":17,"./engine/Input":18}],13:[function(require,module,exports){
"use strict";
var Prefabs_1 = require('./Prefabs');
var Utils_1 = require('./Utils');
var ItemFactory_1 = require('./ItemFactory');
var MAX_INVENTORY = 20;
;
var PlayerStats = {
    game: null,
    name: '',
    useName: 'You',
    class: 'ROGUE',
    hp: [100, 100],
    mp: [20, 20],
    status: [],
    str: '2D2',
    def: '2D2',
    strAdd: 0,
    defAdd: 0,
    spd: 10,
    luk: 38,
    gold: 0,
    blind: false,
    paralyzed: false,
    invisible: false,
    dead: false,
    inventory: [],
    equipment: {
        weapon: null,
        armor: null,
        amulet: null
    },
    statsPosition: [60, 0, 25, 25, 73],
    inventoryScroll: 0,
    mousePosition: null,
    itemSelected: -1,
    initStats: function (game) {
        this.game = game;
        this.name = '';
        this.useName = 'You';
        this.class = 'ROGUE';
        this.hp = [100, 100];
        this.mp = [20, 20];
        this.status = [];
        this.str = '2D2';
        this.def = '2D2';
        this.strAdd = 0;
        this.defAdd = 0;
        this.spd = 10;
        this.luk = 38;
        this.gold = 0;
        this.blind = false;
        this.paralyzed = false;
        this.invisible = false;
        this.dead = false;
        this.inventory = [];
        this.equipment = {
            weapon: null,
            armor: null,
            amulet: null
        };
    },
    wearWeapon: function () {
        if (!this.equipment.weapon) {
            return;
        }
        var amount = Utils_1.Utils.rollDice(this.equipment.weapon.def.wear);
        this.equipment.weapon.status -= amount;
        if (this.equipment.weapon.status <= 0) {
            this.game.console.addMessage(this.equipment.weapon.def.name + " destroyed", Prefabs_1.Colors.GOLD);
            this.equipment.weapon = null;
        }
    },
    wearArmor: function () {
        if (!this.equipment.armor) {
            return;
        }
        var amount = Utils_1.Utils.rollDice(this.equipment.armor.def.wear);
        this.equipment.armor.status -= amount;
        if (this.equipment.armor.status <= 0) {
            this.game.console.addMessage(this.equipment.armor.def.name + " destroyed", Prefabs_1.Colors.GOLD);
            this.equipment.armor = null;
        }
    },
    updateStatus: function () {
        this.blind = false;
        this.paralyzed = false;
        this.invisible = false;
        for (var i = 0, st = void 0; st = this.status[i]; i++) {
            if (st.type == 'poison') {
                this.receiveDamage(Utils_1.Utils.rollDice(st.value));
            }
            else if (st.type == 'blind' && st.duration[0] > 1) {
                this.blind = true;
            }
            else if (st.type == 'paralysis' && st.duration[0] > 1) {
                this.paralyzed = true;
            }
            else if (st.type == 'invisible' && st.duration[0] > 1) {
                this.invisible = true;
            }
            st.duration[0] -= 1;
            if (st.duration[0] == 0) {
                this.status.splice(i, 1);
                i--;
            }
        }
        this.render(this.game.renderer);
    },
    receiveDamage: function (dmg) {
        this.hp[0] -= dmg;
        if (this.hp[0] <= 0) {
            this.hp[0] = 0;
            this.dead = true;
            this.game.console.clear();
            this.game.console.addMessage("You died, press enter to restart", Prefabs_1.Colors.PURPLE);
        }
        this.render(this.game.renderer);
        this.wearArmor();
    },
    equipItem: function (item, type) {
        var ind = this.inventory.indexOf(item);
        if (this.equipment[type]) {
            this.inventory[ind] = this.equipment[type];
        }
        else {
            this.inventory.splice(ind, 1);
        }
        this.equipment[type] = item;
        this.game.itemDesc = null;
    },
    useItem: function (item) {
        if (!this.game.map.playerTurn)
            return;
        var msg = '';
        if (item.def.stackable) {
            if (item.amount > 1) {
                item.amount -= 1;
            }
            else {
                this.game.itemDesc = null;
                this.inventory.splice(this.itemSelected, 1);
            }
            msg = ItemFactory_1.ItemFactory.useItem(item.def, this);
        }
        else if (item.def.type == ItemFactory_1.ItemTypes.WEAPON) {
            this.equipItem(item, 'weapon');
            msg = item.def.name + " equipped!";
        }
        else if (item.def.type == ItemFactory_1.ItemTypes.ARMOR) {
            this.equipItem(item, 'armor');
            msg = item.def.name + " equipped!";
        }
        this.game.console.addMessage(msg, Prefabs_1.Colors.WHITE);
        this.game.map.player.act();
    },
    dropItem: function (item) {
        if (!this.game.map.playerTurn)
            return false;
        var map = this.game.map;
        var player = map.player;
        var x = player.x;
        var y = player.y;
        var nx, ny;
        var tries = 0;
        while (map.getInstanceAt(x, y)) {
            nx = (player.x - 2 + Math.random() * 4) << 0;
            ny = (player.y - 2 + Math.random() * 4) << 0;
            if (map.map[ny][nx].visible == 2 && !map.isSolid(nx, ny)) {
                x = nx;
                y = ny;
            }
            if (tries++ == 20) {
                this.game.console.addMessage("Can't drop it here!", Prefabs_1.Colors.RED);
                this.render(this.game.renderer);
                return false;
            }
        }
        if (item.amount > 1) {
            item.amount -= 1;
        }
        else {
            this.game.itemDesc = null;
            this.inventory.splice(this.itemSelected, 1);
        }
        map.createItem(x, y, ItemFactory_1.ItemFactory.getItem(item.def.code));
        this.game.console.addMessage(item.def.name + " dropped", Prefabs_1.Colors.AQUA);
        this.render(this.game.renderer);
        this.game.map.player.act();
        return true;
    },
    pickItem: function (item) {
        if (item.def.type == ItemFactory_1.ItemTypes.GOLD) {
            var msg = "Picked " + item.amount + " Gold piece";
            if (item.amount > 1) {
                msg += "s";
            }
            this.game.console.addMessage(msg, Prefabs_1.Colors.GOLD);
            this.gold += item.amount;
            this.render(this.game.renderer);
            return true;
        }
        if (this.inventory.length == MAX_INVENTORY) {
            this.game.console.addMessage("Inventory full!", Prefabs_1.Colors.RED);
            return false;
        }
        var added = false;
        if (item.def.stackable) {
            for (var i = 0, inv = void 0; inv = this.inventory[i]; i++) {
                if (inv.def.code == item.def.code) {
                    inv.amount += 1;
                    added = true;
                    i = this.inventory.length;
                }
            }
        }
        if (!added) {
            this.inventory.push(item);
        }
        this.game.console.addMessage(item.def.name + " picked!", Prefabs_1.Colors.YELLOW);
        this.render(this.game.renderer);
        this.game.map.player.act();
        return true;
    },
    getStr: function () {
        var val = this.str;
        if (this.equipment.weapon) {
            val = this.equipment.weapon.def.str;
        }
        if (this.strAdd > 0) {
            val += "+" + this.strAdd;
        }
        return val;
    },
    getDef: function () {
        var val = this.def;
        if (this.equipment.armor) {
            val = this.equipment.armor.def.def;
        }
        if (this.defAdd > 0) {
            val += "+" + this.defAdd;
        }
        return val;
    },
    onMouseMove: function (x, y) {
        if (x == null) {
            this.mousePosition = null;
            this.render(this.game.renderer);
            return;
        }
        this.mousePosition = [x, y];
        this.render(this.game.renderer);
    },
    onMouseHandler: function (x, y, stat) {
        if (stat <= 0)
            return;
        if (x == 24) {
            if (y == 13 && this.inventoryScroll > 0) {
                this.inventoryScroll -= 1;
            }
            else if (y == 19 && this.inventoryScroll + 7 < this.inventory.length) {
                this.inventoryScroll += 1;
            }
            this.render(this.game.renderer);
        }
        else if (y >= 9 && y <= 10) {
            if (this.inventory.length >= MAX_INVENTORY) {
                this.game.console.addMessage("Can't remove, Inventory full!", Prefabs_1.Colors.RED);
                return;
            }
            var type = (y == 9) ? 'weapon' : 'armor';
            this.game.console.addMessage(this.equipment[type].def.name + " removed", Prefabs_1.Colors.YELLOW);
            this.inventory.push(this.equipment[type]);
            this.equipment[type] = null;
        }
        else if (y >= 13 && y <= 19) {
            var index = y - 13 + this.inventoryScroll;
            var item = this.inventory[index];
            if (item) {
                this.itemSelected = index;
                this.game.itemDesc = item;
            }
        }
    },
    renderStatus: function (renderer) {
        var sp = this.statsPosition, length = this.status.length, tabSize = sp[0] + sp[2];
        for (var i = sp[0], l_1 = tabSize; i < l_1; i++) {
            renderer.plot(i, 3, renderer.getTile(Prefabs_1.Colors.BLACK));
        }
        var l = Math.floor(sp[2] / length);
        for (var j = 0, st = void 0; st = this.status[j]; j++) {
            var color = Prefabs_1.Colors.BLACK;
            if (st.type == 'poison') {
                color = Prefabs_1.Colors.PURPLE;
            }
            else if (st.type == 'blind') {
                color = Prefabs_1.Colors.TAN;
            }
            else if (st.type == 'paralysis') {
                color = Prefabs_1.Colors.GOLD;
            }
            else if (st.type == 'invisible') {
                color = Prefabs_1.Colors.GRAY;
            }
            var start = l * j;
            var end = Math.floor(start + l * (st.duration[0] / st.duration[1]));
            if (j == length - 1 && start + end != sp[2]) {
                end += 1;
            }
            for (var i = start; i < end; i++) {
                renderer.plot(i + sp[0], 3, renderer.getTile(color));
            }
        }
        var status = "FINE";
        if (length == 1) {
            status = this.status[0].type.toUpperCase();
        }
        else if (length > 1) {
            status = "VARIOUS";
        }
        Utils_1.Utils.renderText(renderer, sp[0], 3, "STATUS: " + status, Prefabs_1.Colors.WHITE, null);
    },
    render: function (renderer) {
        var sp = this.statsPosition;
        renderer.clearRect(sp[0], sp[1], sp[2], sp[3]);
        var name = this.name + " (" + this.class + ")";
        var x = (sp[4] - name.length / 2) << 0;
        var ni = 0;
        for (var i = sp[0], l = sp[0] + sp[2]; i < l; i++) {
            var n = '';
            if (i >= x && ni < name.length) {
                n = name[ni++];
            }
            renderer.plot(i, 0, Utils_1.Utils.getTile(renderer, n, Prefabs_1.Colors.WHITE, Prefabs_1.Colors.BLUE));
        }
        Utils_1.Utils.renderText(renderer, sp[0], 1, "LEVEL: " + this.game.map.level);
        var hp = ((this.hp[0] / this.hp[1] * sp[2]) << 0) + sp[0];
        for (var i = sp[0]; i < hp; i++) {
            renderer.plot(i, 2, renderer.getTile(Prefabs_1.Colors.GREEN));
        }
        Utils_1.Utils.renderText(renderer, sp[0], 2, "HP: " + this.hp[0] + "/" + this.hp[1], Prefabs_1.Colors.WHITE, null);
        this.renderStatus(renderer);
        Utils_1.Utils.renderText(renderer, sp[0], 5, "ATK: " + this.getStr(), Prefabs_1.Colors.WHITE, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(renderer, (sp[0] + sp[2] / 2) << 0, 5, "DEF: " + this.getDef(), Prefabs_1.Colors.WHITE, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(renderer, sp[0], 6, "SPD: " + this.spd, Prefabs_1.Colors.WHITE, Prefabs_1.Colors.BLACK);
        Utils_1.Utils.renderText(renderer, (sp[0] + sp[2] / 2 - 1) << 0, 6, "GOLD: " + this.gold, Prefabs_1.Colors.GOLD, Prefabs_1.Colors.BLACK);
        for (var i = sp[0], l = sp[0] + sp[2]; i < l; i++) {
            renderer.plot(i, 8, renderer.getTile(Prefabs_1.Colors.BLUE));
        }
        Utils_1.Utils.renderText(renderer, sp[0] + 8, 8, "EQUIPMENT", Prefabs_1.Colors.WHITE, Prefabs_1.Colors.BLUE);
        var equip = (this.equipment.weapon) ? this.equipment.weapon.def.name + ' (' + this.equipment.weapon.status + '%)' : 'NO WEAPON';
        var backColor = Prefabs_1.Colors.BLACK;
        if (this.equipment.weapon && this.mousePosition && this.mousePosition[1] == 9) {
            backColor = Prefabs_1.Colors.GRAY;
            equip = equip + ("                   ").substr(0, 25 - equip.length);
        }
        Utils_1.Utils.renderText(renderer, sp[0], 9, equip, Prefabs_1.Colors.WHITE, backColor);
        equip = (this.equipment.armor) ? this.equipment.armor.def.name + ' (' + this.equipment.armor.status + '%)' : 'NO ARMOR';
        backColor = Prefabs_1.Colors.BLACK;
        if (this.equipment.armor && this.mousePosition && this.mousePosition[1] == 10) {
            backColor = Prefabs_1.Colors.GRAY;
            equip = equip + ("                   ").substr(0, 25 - equip.length);
        }
        Utils_1.Utils.renderText(renderer, sp[0], 10, equip, Prefabs_1.Colors.WHITE, backColor);
        for (var i = sp[0], l = sp[0] + sp[2]; i < l; i++) {
            renderer.plot(i, 12, renderer.getTile(Prefabs_1.Colors.BLUE));
        }
        Utils_1.Utils.renderText(renderer, sp[0] + 8, 12, "INVENTORY", Prefabs_1.Colors.WHITE, Prefabs_1.Colors.BLUE);
        for (var i = 0, l = Math.min(7, this.inventory.length); i < l; i++) {
            var inv = this.inventory[i + this.inventoryScroll];
            name = inv.def.name + ((inv.amount > 1) ? ' (x' + inv.amount + ')' : '');
            backColor = Prefabs_1.Colors.BLACK;
            if (this.mousePosition && this.mousePosition[1] - 13 == i && this.mousePosition[0] < 24) {
                backColor = Prefabs_1.Colors.GRAY;
                name = name + ("                   ").substr(0, 24 - name.length);
            }
            Utils_1.Utils.renderText(renderer, sp[0], 13 + i, name, Prefabs_1.Colors.WHITE, backColor);
        }
        for (var i = 0; i < 7; i++) {
            name = " ";
            if (i == 0) {
                name = "PAGEUP";
            }
            else if (i == 6) {
                name = "PAGEDWN";
            }
            renderer.plot(84, 13 + i, Utils_1.Utils.getTile(renderer, name, Prefabs_1.Colors.WHITE, Prefabs_1.Colors.GRAY));
        }
    }
};
exports.PlayerStats = PlayerStats;
},{"./ItemFactory":8,"./Prefabs":14,"./Utils":17}],14:[function(require,module,exports){
"use strict";
var Colors = {
    BLACK: { r: 0, g: 0, b: 0 },
    WHITE: { r: 255 / 255, g: 255 / 255, b: 255 / 255 },
    RED: { r: 255 / 255, g: 0, b: 0 },
    GREEN: { r: 0, g: 160 / 255, b: 0 },
    BLUE: { r: 0, g: 0, b: 160 / 255 },
    YELLOW: { r: 160 / 255, g: 160 / 255, b: 0 },
    PURPLE: { r: 160 / 255, g: 0 / 255, b: 160 / 255 },
    AQUA: { r: 0, g: 80 / 255, b: 200 / 255 },
    GRAY: { r: 122 / 255, g: 122 / 255, b: 122 / 255 },
    TAN: { r: 205 / 255, g: 133 / 255, b: 63 / 255 },
    ORANGE: { r: 255 / 255, g: 100 / 255, b: 0 },
    GOLD: { r: 255 / 255, g: 215 / 255, b: 0 / 255 },
    DARK_BLUE: { r: 0 / 255, g: 0 / 255, b: 50 / 255 },
    BROWN: { r: 139 / 255, g: 69 / 255, b: 19 / 255 }
};
exports.Colors = Colors;
var Tiles = {};
exports.Tiles = Tiles;
var names = [
    ['BLANK', 'DOT_C', 'POINT', 'COLON', 'COMMA', 'EXCLA', 'QUEST', 'STRUP', 'STRDN', 'MONEY', 'STAR', 'SLASH', 'PLUS', 'MINUS', 'UNDER', 'EQUAL', 'HASH', 'SQBRO', 'SQBRC', 'PAREO', 'PAREC', 'BRACO', 'BRACC', 'WATER', 'WATRD',],
    ['AMPER', 'PERCT', 'QUOTD', 'GRASH', 'QUOTS', 'GRASS', 'PLAYR', 'PAGEUP', 'PAGEDWN', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',],
    ['q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',],
    ['P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'N0', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9']
];
for (var y = 0, ylen = names.length; y < ylen; y++) {
    for (var x = 0, xlen = names[y].length; x < xlen; x++) {
        var name_1 = names[y][x];
        Tiles[name_1] = { x: x, y: y };
    }
}
var TileTypes;
(function (TileTypes) {
    TileTypes[TileTypes["GROUND"] = 0] = "GROUND";
    TileTypes[TileTypes["WALL"] = 1] = "WALL";
    TileTypes[TileTypes["WATER"] = 2] = "WATER";
    TileTypes[TileTypes["WATER_DEEP"] = 3] = "WATER_DEEP";
})(TileTypes || (TileTypes = {}));
exports.TileTypes = TileTypes;
;
;
;
function multiplyColor(color, amount) {
    return {
        r: color.r * amount.r,
        g: color.g * amount.g,
        b: color.b * amount.b
    };
}
function getTile(renderer, backColor, frontColor, tile, effect, type) {
    if (type === void 0) { type = TileTypes.GROUND; }
    return {
        light: renderer.getTile(backColor, frontColor, tile.character, effect),
        dark: renderer.getTile(multiplyColor(backColor, { r: 0.1, g: 0.1, b: 0.5 }), multiplyColor(frontColor, { r: 0.1, g: 0.1, b: 0.5 }), tile.character, effect),
        type: type
    };
}
;
var TilesPrefabs = {
    TILES: {},
    ITEMS: {},
    ENEMIES: {},
    PLAYER: null,
    init: function (renderer) {
        var t = this.TILES;
        var i = this.ITEMS;
        var e = this.ENEMIES;
        t.BLANK = getTile(renderer, Colors.BLACK, Colors.BLACK, Tiles.BLANK, null);
        t.WALL = getTile(renderer, Colors.GRAY, Colors.WHITE, Tiles.HASH, null, TileTypes.WALL);
        t.FLOOR = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.DOT_C, null);
        t.WATER = getTile(renderer, Colors.AQUA, Colors.WHITE, Tiles.WATER, null, TileTypes.WATER);
        t.WATER_DEEP = getTile(renderer, Colors.BLUE, Colors.WHITE, Tiles.WATRD, null, TileTypes.WATER_DEEP);
        t.STAIRS_UP = getTile(renderer, Colors.BLACK, Colors.YELLOW, Tiles.STRUP);
        t.STAIRS_DOWN = getTile(renderer, Colors.BLACK, Colors.YELLOW, Tiles.STRDN);
        i.GOLD = getTile(renderer, Colors.BLACK, Colors.GOLD, Tiles.MONEY, null);
        i.RED_POTION = getTile(renderer, Colors.BLACK, Colors.RED, Tiles.EXCLA);
        i.GREEN_POTION = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles.EXCLA);
        i.BLUE_POTION = getTile(renderer, Colors.BLACK, Colors.BLUE, Tiles.EXCLA);
        i.YELLOW_POTION = getTile(renderer, Colors.BLACK, Colors.YELLOW, Tiles.EXCLA);
        i.AQUA_POTION = getTile(renderer, Colors.BLACK, Colors.AQUA, Tiles.EXCLA);
        i.WHITE_POTION = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.EXCLA);
        i.PURPLE_POTION = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles.EXCLA);
        i.TAN_POTION = getTile(renderer, Colors.BLACK, Colors.TAN, Tiles.EXCLA);
        i.ORANGE_POTION = getTile(renderer, Colors.BLACK, Colors.ORANGE, Tiles.EXCLA);
        i.DAGGER = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.MINUS);
        i.SWORD = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.SLASH);
        i.LONG_SWORD = getTile(renderer, Colors.BLACK, Colors.AQUA, Tiles.SLASH);
        i.MACE = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.UNDER);
        i.SPEAR = getTile(renderer, Colors.BLACK, Colors.BROWN, Tiles.SLASH);
        i.AXE = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles.MINUS);
        i.LEATHER_ARMOR = getTile(renderer, Colors.BLACK, Colors.BROWN, Tiles.SQBRO);
        i.SCALE_MAIL = getTile(renderer, Colors.BLACK, Colors.GRAY, Tiles.SQBRO);
        i.CHAIN_MAIL = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.SQBRO);
        i.PLATE_ARMOR = getTile(renderer, Colors.BLACK, Colors.GOLD, Tiles.SQBRO);
        e.RAT = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.r);
        e.SPIDER = getTile(renderer, Colors.BLACK, Colors.GRAY, Tiles.s);
        e.KOBOLD = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles.k);
        e.IMP = getTile(renderer, Colors.BLACK, Colors.RED, Tiles.i);
        e.GOBLIN = getTile(renderer, Colors.BLACK, Colors.AQUA, Tiles.g);
        e.ZOMBIE = getTile(renderer, Colors.BLACK, Colors.RED, Tiles.z);
        e.OGRE = getTile(renderer, Colors.BLACK, Colors.BROWN, Tiles.o);
        e.ROGUE = getTile(renderer, Colors.BLACK, Colors.RED, Tiles.R);
        e.BEGGAR = getTile(renderer, Colors.BLACK, Colors.BROWN, Tiles.b);
        e.SHADOW = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles.S);
        e.THIEF = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles.t);
        e.CAOS_KNIGHT = getTile(renderer, Colors.BLACK, Colors.RED, Tiles.K);
        e.LIZARD_WARRIOR = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles.l);
        e.OPHIDIAN = getTile(renderer, Colors.BLACK, Colors.GREEN, Tiles.O);
        e.CAOS_SERVANT = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles.C);
        e.WYVERN_KNIGHT = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles.W);
        e.CAOS_LORD = getTile(renderer, Colors.BLACK, Colors.RED, Tiles.L);
        e.SODI = getTile(renderer, Colors.BLACK, Colors.PURPLE, Tiles.PLAYR);
        this.PLAYER = getTile(renderer, Colors.BLACK, Colors.WHITE, Tiles.PLAYR, null);
    }
};
exports.TilesPrefabs = TilesPrefabs;
},{}],15:[function(require,module,exports){
"use strict";
var Scenario = (function () {
    function Scenario() {
    }
    Scenario.prototype.onMouseMove = function (x, y) { };
    Scenario.prototype.onMouseHandler = function (x, y, stat) { };
    Scenario.prototype.render = function () { };
    return Scenario;
}());
exports.Scenario = Scenario;
},{}],16:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Instance_1 = require('./Instance');
var Stairs = (function (_super) {
    __extends(Stairs, _super);
    function Stairs(x, y, map, target, tile) {
        _super.call(this, x, y, map, tile);
        this.target = target;
        this.target = target;
        this.dir = (target - map.level > 0) ? 1 : 0;
        this.name = (this.dir == 1) ? "Stairs down" : "Stairs up";
        this.playerOnTile = true;
        this.discovered = false;
        this.inShadow = true;
        this.stopOnDiscover = true;
        this.visibleInShadow = true;
    }
    Stairs.prototype.update = function () {
        this.inShadow = true;
        var p = this.map.player;
        if (p.x == this.x && p.y == this.y) {
            if (!this.playerOnTile && !p.movePath) {
                this.map.game.gotoLevel(this.target, this.dir);
                return;
            }
            this.playerOnTile = true;
        }
        else if (this.playerOnTile) {
            this.playerOnTile = false;
        }
        if (this.map.map[this.y][this.x].visible == 2) {
            this.inShadow = false;
            var mp = this.map.mousePosition;
            if (mp.x == this.x && mp.y == this.y) {
                this.map.tileDescription = this.name;
            }
        }
        else if (this.map.map[this.y][this.x].visible <= 1) {
            this.discovered = false;
        }
    };
    return Stairs;
}(Instance_1.Instance));
exports.Stairs = Stairs;
},{"./Instance":5}],17:[function(require,module,exports){
"use strict";
var Prefabs_1 = require('./Prefabs');
var Utils = {
    rollDice: function (value) {
        var array = value.split(/[D\+*]/), a = parseInt(array[0], 10), b = parseInt(array[1], 10), c = parseInt(array[2], 10) || 0;
        var ret = c;
        for (var i = 0; i < a; i++) {
            ret += (Math.round(Math.random() * (b - 1))) + 1;
        }
        return ret;
    },
    formatText: function (text, width) {
        var ret = [], words = text.split(" "), line = "";
        for (var i = 0; i < words.length; i++) {
            var w = words[i];
            if (line.length + w.length + 1 <= width) {
                line += " " + w;
            }
            else {
                ret.push(line.trim());
                line = "";
                i--;
            }
        }
        if (line != "") {
            ret.push(line.trim());
        }
        return ret;
    },
    getTile: function (renderer, chara, color, backColor) {
        if (backColor === void 0) { backColor = Prefabs_1.Colors.BLACK; }
        var tile = chara;
        if (tile == "!") {
            tile = "EXCLA";
        }
        else if (tile == ".") {
            tile = "POINT";
        }
        else if (tile == ":") {
            tile = "COLON";
        }
        else if (tile == ",") {
            tile = "COMMA";
        }
        else if (tile == "?") {
            tile = "QUEST";
        }
        else if (tile == "<") {
            tile = "STRUP";
        }
        else if (tile == ">") {
            tile = "STRDN";
        }
        else if (tile == "+") {
            tile = "PLUS";
        }
        else if (tile == "-") {
            tile = "MINUS";
        }
        else if (tile == "$") {
            tile = "MONEY";
        }
        else if (tile == "(") {
            tile = "PAREO";
        }
        else if (tile == ")") {
            tile = "PAREC";
        }
        else if (tile == "'") {
            tile = "QUOTS";
        }
        else if (tile == '"') {
            tile = "QUOTD";
        }
        else if (tile == "/") {
            tile = "SLASH";
        }
        else if (tile == "%") {
            tile = "PERCT";
        }
        else if (tile == "=") {
            tile = "EQUAL";
        }
        else if (tile == "#") {
            tile = "HASH";
        }
        else if (tile >= "0" && tile <= "9") {
            tile = "N" + tile;
        }
        return renderer.getTile(backColor, color, Prefabs_1.Tiles[tile]);
    },
    renderText: function (renderer, x, y, text, color, backColor) {
        if (color === void 0) { color = Prefabs_1.Colors.WHITE; }
        if (backColor === void 0) { backColor = Prefabs_1.Colors.BLACK; }
        for (var i = 0; i < text.length; i++) {
            var t = text[i];
            if (backColor == null) {
                renderer.plotCharacter(x + i, y, this.getTile(renderer, t, color, backColor));
            }
            else {
                renderer.plot(x + i, y, this.getTile(renderer, t, color, backColor));
            }
        }
    }
};
exports.Utils = Utils;
},{"./Prefabs":14}],18:[function(require,module,exports){
"use strict";
var Input = {
    keyCodes: new Uint8ClampedArray(255),
    keys: {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        SPACE: 32
    },
    kdListeners: [],
    mmListeners: [],
    mdListeners: [],
    init: function (canvas) {
        var _this = this;
        document.body.onkeydown = function (event) {
            _this.keyCodes[event.keyCode] = 1;
            for (var i = 0, kd = void 0; kd = _this.kdListeners[i]; i++) {
                kd(event.keyCode, 1);
            }
        };
        document.body.onkeyup = function (event) {
            _this.keyCodes[event.keyCode] = 0;
            for (var i = 0, kd; kd = _this.kdListeners[i]; i++) {
                kd(event.keyCode, 0);
            }
        };
        canvas.onmousemove = function (event) {
            var x = event.clientX - canvas.offsetLeft, y = event.clientY - canvas.offsetTop;
            for (var i = 0, mm = void 0; mm = _this.mmListeners[i]; i++) {
                mm(x, y);
            }
        };
        canvas.onmousedown = function (event) {
            var x = event.clientX - canvas.offsetLeft, y = event.clientY - canvas.offsetTop;
            for (var i = 0, md = void 0; md = _this.mdListeners[i]; i++) {
                md(x, y, 1);
            }
        };
        canvas.onmouseup = function (event) {
            var x = event.clientX - canvas.offsetLeft, y = event.clientY - canvas.offsetTop;
            for (var i = 0, md = void 0; md = _this.mdListeners[i]; i++) {
                md(x, y, 0);
            }
        };
    },
    clearListeners: function () {
        this.kdListeners = [];
        this.mmListeners = [];
        this.mdListeners = [];
    },
    addKeyDownListener: function (callback) {
        this.kdListeners.push(callback);
    },
    addMouseMoveListener: function (callback) {
        this.mmListeners.push(callback);
    },
    addMouseDownListener: function (callback) {
        this.mdListeners.push(callback);
    }
};
exports.Input = Input;
for (var i = 65; i <= 90; i++) {
    Input.keys[String.fromCharCode(i)] = i;
}
},{}],19:[function(require,module,exports){
"use strict";
var Random = (function () {
    function Random(seed) {
        if (seed === void 0) { seed = null; }
        this.max = 2 << 15;
        this.count = 1;
        this.setSeed(seed);
    }
    Random.prototype.setSeed = function (seed) {
        this.seed = (seed == null) ? Math.round(Math.random() * this.max) : seed;
        this.orSeed = this.seed;
        this.seed = this.seed | 24;
    };
    Random.prototype.random = function () {
        this.count = ((this.count * 1.5) % 50) >> 0;
        this.seed = ((this.seed + (this.seed * this.seed) | this.count) >>> 32) % this.max;
        var ret = this.seed / this.max;
        return ret;
    };
    return Random;
}());
exports.PRNG = Random;
},{}],20:[function(require,module,exports){
"use strict";
var Tile_1 = require('./Tile');
var Shader_1 = require('./Shader');
var Basic_1 = require('./shaders/Basic');
;
function createCanvas(width, height, container) {
    if (container === void 0) { container = null; }
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    if (container) {
        container.appendChild(canvas);
    }
    return canvas;
}
function getContext(canvas) {
    var gl = canvas.getContext("webgl");
    if (!gl) {
        throw new Error("Your browser doesn't support the use of WebGL");
    }
    return gl;
}
var Renderer = (function () {
    function Renderer(width, height, container) {
        this.canvas = createCanvas(width, height, container);
        this.gl = getContext(this.canvas);
        this.pixelSize = [10.0, 16.0];
        this.resolution = [this.canvas.width / this.pixelSize[0], this.canvas.height / this.pixelSize[1]];
        this.fontTexture = null;
        this.black = new Tile_1.Tile();
        this.time = 0.0;
        this.lastTime = (new Date()).getTime();
        this.setupBasicProperties();
        this.shaders = {
            basic: new Shader_1.Shader(this.gl, Basic_1.BasicShader)
        };
        this.mainSurface = this.createRenderingTarget();
        this.shaders.basic.useProgram();
    }
    Renderer.prototype.setupBasicProperties = function () {
        var gl = this.gl;
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
    };
    Renderer.prototype.setFontTexture = function (src) {
        var _this = this;
        this.fontImage = new Image();
        this.fontImage.src = src;
        this.fontReady = false;
        this.fontTexture = null;
        this.fontImage.onload = function () {
            var gl = _this.gl;
            _this.fontTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, _this.fontTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, _this.fontImage);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);
            _this.fontReady = true;
        };
        return this.fontImage;
    };
    Renderer.prototype.createRenderingTarget = function () {
        var gl = this.gl;
        var screenWidth = gl.canvas.width / this.pixelSize[0];
        var screenHeight = gl.canvas.height / this.pixelSize[1];
        var triangleWidth = this.pixelSize[0] / gl.canvas.width * 2.0;
        var triangleHeight = this.pixelSize[1] / gl.canvas.height * 2.0;
        var vertices = [];
        var indices = [];
        var background = [];
        var foreground = [];
        var characters = [];
        var index = 0;
        for (var x = 0; x < screenWidth; x += 1) {
            for (var y = 0; y < screenHeight; y += 1) {
                vertices.push(x * triangleWidth);
                vertices.push((y + 1) * triangleHeight);
                vertices.push((x + 1) * triangleWidth);
                vertices.push((y + 1) * triangleHeight);
                vertices.push(x * triangleWidth);
                vertices.push(y * triangleHeight);
                vertices.push((x + 1) * triangleWidth);
                vertices.push(y * triangleHeight);
                for (var j = 0; j < 12; j++) {
                    background.push(0.0);
                    foreground.push(0.0);
                    if (j < 8) {
                        characters.push(0.0);
                    }
                }
                var topL = void 0, topR = void 0, botL = void 0, botR = void 0;
                topL = index;
                topR = index + 1;
                botL = index + 2;
                botR = index + 3;
                indices.push(botL);
                indices.push(topL);
                indices.push(botR);
                indices.push(topL);
                indices.push(topR);
                indices.push(botR);
                index += 4;
            }
        }
        var vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        var vertexBackgroundBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBackgroundBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(background), gl.STATIC_DRAW);
        var vertexForegroundBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexForegroundBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(foreground), gl.STATIC_DRAW);
        var vertexCharacterBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexCharacterBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(characters), gl.STATIC_DRAW);
        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        return {
            vertexPositionBuffer: vertexPositionBuffer,
            vertexBackgroundBuffer: vertexBackgroundBuffer,
            vertexForegroundBuffer: vertexForegroundBuffer,
            vertexCharacterBuffer: vertexCharacterBuffer,
            indexBuffer: indexBuffer,
            background: background,
            foreground: foreground,
            characters: characters,
            indexNumber: indices.length,
            updated: true
        };
    };
    Renderer.prototype.getTile = function (bColor, fColor, chara, effect) {
        if (bColor === void 0) { bColor = this.black.background; }
        if (fColor === void 0) { fColor = this.black.foreground; }
        if (chara === void 0) { chara = { x: 0, y: 0 }; }
        if (effect === void 0) { effect = null; }
        return new Tile_1.Tile(bColor, fColor, chara);
    };
    Renderer.prototype.plotCharacter = function (x, y, tile, surface) {
        if (surface === void 0) { surface = this.mainSurface; }
        var topL, topR, botL, botR, cw, ch, cx, cy, index;
        var color;
        var character;
        index = (x * this.resolution[1] + y) * 12;
        color = tile.foreground;
        character = tile.character;
        for (var i = 0; i < 4; i++) {
            surface.foreground[index + i * 3] = color.r;
            surface.foreground[index + i * 3 + 1] = color.g;
            surface.foreground[index + i * 3 + 2] = color.b;
        }
        cw = this.pixelSize[0] / this.fontImage.width;
        ch = this.pixelSize[1] / this.fontImage.height;
        cx = character.x * cw;
        cy = character.y * ch;
        index = (x * this.resolution[1] + y) * 8;
        topL = index;
        topR = index + 2;
        botL = index + 4;
        botR = index + 6;
        surface.characters[topL] = cx;
        surface.characters[topL + 1] = cy + ch;
        surface.characters[topR] = cx + cw;
        surface.characters[topR + 1] = cy + ch;
        surface.characters[botL] = cx;
        surface.characters[botL + 1] = cy;
        surface.characters[botR] = cx + cw;
        surface.characters[botR + 1] = cy;
        surface.updated = false;
    };
    Renderer.prototype.plotBackground = function (x, y, tile, surface) {
        if (surface === void 0) { surface = this.mainSurface; }
        var index = (x * this.resolution[1] + y) * 12, color = tile.background;
        for (var i = 0; i < 4; i++) {
            surface.background[index + i * 3] = color.r;
            surface.background[index + i * 3 + 1] = color.g;
            surface.background[index + i * 3 + 2] = color.b;
        }
        surface.updated = false;
    };
    Renderer.prototype.plot = function (x, y, tile, surface) {
        if (surface === void 0) { surface = this.mainSurface; }
        this.plotBackground(x, y, tile, surface);
        this.plotCharacter(x, y, tile, surface);
    };
    Renderer.prototype.clearRect = function (x, y, w, h, surface) {
        if (surface === void 0) { surface = this.mainSurface; }
        w = x + w;
        h = y + h;
        for (var i = x; i < w; i++) {
            for (var j = y; j < h; j++) {
                this.plot(i, j, this.black, surface);
            }
        }
    };
    Renderer.prototype.updateSurface = function (surface) {
        var gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexBackgroundBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surface.background), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexForegroundBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surface.foreground), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexCharacterBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surface.characters), gl.STATIC_DRAW);
        surface.updated = true;
    };
    Renderer.prototype.updateTime = function () {
        var now = (new Date()).getTime();
        this.time += now - this.lastTime;
        this.lastTime = now;
    };
    Renderer.prototype.render = function (surface) {
        if (surface === void 0) { surface = this.mainSurface; }
        var gl = this.gl, shader = this.shaders.basic;
        if (!surface.updated) {
            this.updateSurface(surface);
        }
        this.updateTime();
        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexPositionBuffer);
        gl.vertexAttribPointer(shader.attributes.aVertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexBackgroundBuffer);
        gl.vertexAttribPointer(shader.attributes.aVertexBackground, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexForegroundBuffer);
        gl.vertexAttribPointer(shader.attributes.aVertexForeground, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexCharacterBuffer);
        gl.vertexAttribPointer(shader.attributes.aVertexCharacter, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surface.indexBuffer);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.fontTexture);
        gl.uniform1i(shader.uniforms.uFont, 0);
        gl.drawElements(gl.TRIANGLES, surface.indexNumber, gl.UNSIGNED_SHORT, 0);
    };
    return Renderer;
}());
exports.Renderer = Renderer;
},{"./Shader":21,"./Tile":22,"./shaders/Basic":23}],21:[function(require,module,exports){
"use strict";
;
var Shader = (function () {
    function Shader(gl, shader) {
        this.gl = gl;
        this.compileShaders(shader);
        this.getShaderAttributes(shader);
        this.getShaderUniforms(shader);
    }
    Shader.prototype.compileShaders = function (shader) {
        var gl = this.gl;
        var vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vShader, shader.vertexShader);
        gl.compileShader(vShader);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fShader, shader.fragmentShader);
        gl.compileShader(fShader);
        this.program = gl.createProgram();
        gl.attachShader(this.program, vShader);
        gl.attachShader(this.program, fShader);
        gl.linkProgram(this.program);
        if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(vShader));
            throw new Error("Error compiling vertex shader");
        }
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(fShader));
            throw new Error("Error compiling fragment shader");
        }
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.log(gl.getProgramInfoLog(this.program));
            throw new Error("Error linking the program");
        }
    };
    Shader.prototype.getShaderAttributes = function (shader) {
        var code = shader.vertexShader.split(/\n/g);
        var gl = this.gl;
        var attribute;
        var location;
        for (var i = 0, len = code.length; i < len; i++) {
            var c = code[i].trim().split(/ /g);
            if (c[0] == 'attribute') {
                attribute = c.pop().replace(/;/g, "");
                location = gl.getAttribLocation(this.program, attribute);
                gl.enableVertexAttribArray(location);
                this.attributes[attribute] = location;
            }
        }
        Shader.maxAttribLength = Math.max(Shader.maxAttribLength, this.attributes.length);
    };
    Shader.prototype.getShaderUniforms = function (shader) {
        var code = shader.vertexShader.split(/\n/g);
        code = code.concat(shader.fragmentShader.split(/\n/g));
        var gl = this.gl;
        var uniform;
        var location;
        var usedUniforms = [];
        for (var i = 0, len = code.length; i < len; i++) {
            var c = code[i].trim().split(/ /g);
            if (c[0] == "uniform") {
                uniform = c.pop().replace(/;/g, "");
                if (usedUniforms.indexOf(uniform) != -1) {
                    continue;
                }
                location = gl.getUniformLocation(this.program, uniform);
                usedUniforms.push(uniform);
                this.uniforms[uniform] = location;
            }
        }
    };
    Shader.prototype.useProgram = function () {
        if (Shader.lastProgram == this) {
            return;
        }
        var gl = this.gl;
        gl.useProgram(this.program);
        Shader.lastProgram = this;
        var attribLength = this.attributes.length;
        for (var i = 0, len = Shader.maxAttribLength; i < len; i++) {
            if (i < attribLength) {
                gl.enableVertexAttribArray(i);
            }
            else {
                gl.disableVertexAttribArray(i);
            }
        }
    };
    return Shader;
}());
exports.Shader = Shader;
Shader.maxAttribLength = 0;
Shader.lastProgram = null;
},{}],22:[function(require,module,exports){
"use strict";
var black = { r: 0, g: 0, b: 0 };
var emptyChar = { x: 0, y: 0 };
var Tile = (function () {
    function Tile(background, foreground, character) {
        if (background === void 0) { background = black; }
        if (foreground === void 0) { foreground = black; }
        if (character === void 0) { character = emptyChar; }
        this.background = background;
        this.foreground = foreground;
        this.character = character;
    }
    return Tile;
}());
exports.Tile = Tile;
},{}],23:[function(require,module,exports){
"use strict";
var BasicShader = {
    vertexShader: "\n        precision mediump float;\n        \n        attribute vec2 aVertexPosition;\n        attribute vec3 aVertexBackground;\n        attribute vec3 aVertexForeground;\n        attribute vec2 aVertexCharacter;\n        \n        varying vec3 vBackground;\n        varying vec3 vForeground;\n        varying vec2 vCharacter;\n        \n        void main(void) {\n            vec2 position = aVertexPosition;\n            position.y = 2.0 - position.y;\n            \n            gl_Position = vec4(position - 1.0, 0.0, 1.0);\n            \n            vBackground = aVertexBackground;\n            vForeground = aVertexForeground;\n            vCharacter = aVertexCharacter;\n        }\n    ",
    fragmentShader: "\n        precision mediump float;\n        \n        uniform sampler2D uTexture;\n        \n        varying vec3 vBackground;\n        varying vec3 vForeground;\n        varying vec2 vCharacter;\n        \n        void main(void) {\n            vec4 characterColor = texture2D(uTexture, vCharacter);\n            characterColor.rgb = vForeground;\n        \n            gl_FragColor = vec4(mix(vBackground, characterColor.rgb, characterColor.a), 1.0);\n        }\n    "
};
exports.BasicShader = BasicShader;
},{}],24:[function(require,module,exports){
"use strict";
var Game_1 = require('./Game');
var Input_1 = require('./engine/Input');
window.onload = function () {
    var game = new Game_1.Game();
    Input_1.Input.init(game.renderer.canvas);
};
},{"./Game":4,"./engine/Input":18}]},{},[24])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQ29uc29sZS50cyIsInNyYy9FbmVteS50cyIsInNyYy9FbmVteUZhY3RvcnkudHMiLCJzcmMvR2FtZS50cyIsInNyYy9JbnN0YW5jZS50cyIsInNyYy9JdGVtLnRzIiwic3JjL0l0ZW1FZmZlY3RzLnRzIiwic3JjL0l0ZW1GYWN0b3J5LnRzIiwic3JjL01haW5NZW51LnRzIiwic3JjL01hcC50cyIsInNyYy9NYXBHZW5lcmF0b3IudHMiLCJzcmMvUGxheWVyLnRzIiwic3JjL1BsYXllclN0YXRzLnRzIiwic3JjL1ByZWZhYnMudHMiLCJzcmMvU2NlbmFyaW8udHMiLCJzcmMvU3RhaXJzLnRzIiwic3JjL1V0aWxzLnRzIiwic3JjL2VuZ2luZS9JbnB1dC50cyIsInNyYy9lbmdpbmUvUFJORy50cyIsInNyYy9lbmdpbmUvUmVuZGVyZXIudHMiLCJzcmMvZW5naW5lL1NoYWRlci50cyIsInNyYy9lbmdpbmUvVGlsZS50cyIsInNyYy9lbmdpbmUvc2hhZGVycy9CYXNpYy50cyIsInNyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQyx3QkFBdUIsV0FBVyxDQUFDLENBQUE7QUFDcEMsc0JBQXNCLFNBQVMsQ0FBQyxDQUFBO0FBUy9CLENBQUM7QUFFRjtJQVFJLGlCQUFtQixJQUFVO1FBQVYsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUN6QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFFOUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7UUFFckIsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRCx1QkFB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LE9BQU8sRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO1FBQ2xKLEdBQUcsRUFBRSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7UUFDMUksTUFBTSxFQUFFLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtRQUNwSixNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO1FBQ2pKLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7UUFDN0ksS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtRQUVqSixNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO1FBQ3BKLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7UUFDcEosS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxF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SSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSx5QkFBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN2RSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDcEIsTUFBTSxDQUFDO1lBQ1gsQ0FBQztZQUVELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQzdCLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDOUIsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7WUFDdEIsSUFBSSxFQUFFLEdBQVksSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUM7WUFDekMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDekMsQ0FBQztRQUNMLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FB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RUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFO1FBQ2pNLFVBQVUsRUFBa0IsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsNkJBQTZCLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFO1FBQ3pMLFlBQVksRUFBa0IsRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFO1FBQ2pNLFdBQVcsRUFBa0IsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsOEJBQThCLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFO1FBQzdMLFNBQVMsRUFBa0IsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsNEJBQTRCLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFO1FBQ3JMLFlBQVksRUFBa0IsRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFO1FBRWpNLElBQUksRUFBa0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUU7UUFFdkksTUFBTSxFQUFrQixFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSx1Q0FBdUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7UUFDMUssVUFBVSxFQUFrQixFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7UUFDaEssU0FBUyxFQUFrQixFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7UUFDcEssSUFBSSxFQUFrQixFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7UUFDbEosS0FBSyxFQUFrQixFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7UUFDckosR0FBRyxFQUFrQixFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7UUFFdEosWUFBWSxFQUFrQixFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSwyQ0FBMkMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7UUFDak0sU0FBUyxFQUFrQixFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7UUFDbEssU0FBUyxFQUFrQixFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUks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SUFBSSxFQUFFLENBQUM7UUFDYixDQUFDO0lBQ0wsQ0FBQztJQUVELHVCQUFTLEdBQVQsVUFBVSxDQUFTLEVBQUUsQ0FBUztRQUMxQixJQUFJLFFBQVEsR0FBVyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3hDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNwQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUVELElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0lBQzFCLENBQUM7SUFFRCx3QkFBVSxHQUFWO1FBQ0ksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFOUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RCxDQUFDO0lBQ0wsQ0FBQztJQUVELDZCQUFlLEdBQWY7UUFDSSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFBQyxNQUFNLENBQUM7UUFDNUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFBQyxNQUFNLENBQUM7UUFFakMsSUFBSSxDQUFTLEVBQUUsQ0FBUyxDQUFDO1FBQ3pCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFH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R0FBRyxLQUFLLENBQUM7UUFDbEIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7UUFFbEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7SUFDdkIsQ0FBQztJQUVELHdCQUFTLEdBQVQsVUFBVSxJQUFZO1FBQ2xCLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQUMsQ0FBQztRQUFDLElBQUksQ0FDbEQsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFBQyxDQUFDO1FBQUMsSUFBSSxDQUNuRCxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUFDLENBQUM7UUFBQyxJQUFJLENBQ2xELEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQUMsQ0FBQztRQUU5QyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCx1QkFBUSxHQUFSO1FBQ0ksTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVELHNCQUFPLEdBQVAsVUFBUSxJQUFZO1FBQ2hCLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7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LENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUN4QyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3hDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzNDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRTNDLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsYUFBYSxFQUFFLFVBQVUsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUztRQUMvRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRUQsV0FBVyxFQUFFLFVBQVUsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUyxFQUFFLE1BQVk7UUFDM0UsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsU0FBTSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDOUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQUMsUUFB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RyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEUsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMzRCxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMzQyxDQUFDLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQy9CLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXhCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFBQyxDQUFDO1lBQ3BELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQUMsQ0FBQztZQUV4RCxJQUFJLEdBQUcsQ0FBQyxDQUFDO1lBQ1QsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDdEIsQ0FBQztRQUVELElBQUksSUFBSSxHQUFTLElB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QyxXQUFXLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwSixPQUFPLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hELFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDYixVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNiLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsS0FBSyxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuSyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hELFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDYixVQUFVLEdBQUcsQ0FB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RUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0SCxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ2QsVUFBVSxHQUFHLEVBQUUsQ0FBQztZQUNoQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2QsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQixLQUFLLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hULE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekcsUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUNkLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFDaEIsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNkLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUUsSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hULE9BQU8sR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbFMsUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUNkLFVBQVUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25DLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZCxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLElBQUksS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEMsS0FBSyxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoVCxPQUFPLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25TLFFBQVEsR0FBRyxFQUFFLENBQUM7WUFDZCxVQUFVLEdBQUcsRUFBRSxHQUFHLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2QsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQixLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ1gsT0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMxQixRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBQ2IsVUFBVSxHQUFHLENBQUMsQ0FBQztZQUNmLElBQUksR0FBRyxDQUFDLENBQUM7UUFDYixDQUFDO1FBRUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNoQyxJQUFJLFFBQVEsR0FBcUIsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pDLENBQUMsRUFBRSxDQUFDO2dCQUNKLFFBQVEsQ0FBQztZQUNiLENBQUM7WUFFRCxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0UsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLENBQUM7WUFFRCxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9ELENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFL0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixDQUFDLEVBQUUsQ0FBQztnQkFDSixRQUFRLENBQUM7WUFDYixDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7Z0JBQ2hCLENBQUMsRUFBRSxDQUFDO2dCQUNKLENBQUMsRUFBRSxDQUFDO2dCQUNKLElBQUksRUFBRSxNQUFNO2dCQUNaLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2FBQ3BCLENBQUMsQ0FBQztRQUNQLENBQUM7UUFFRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2xDLElBQUksU0FBUyxHQUFxQixPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDdEYsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ0osUUFBUSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoQixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakYsQ0FBQztZQUVELENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0QsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUvRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JCLENBQUMsRUFBRSxDQUFDO2dCQUNKLFFBQVEsQ0FBQztZQUNiLENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDaEIsQ0FBQyxFQUFFLENBQUM7Z0JBQ0osQ0FBQyxFQUFFLENBQUM7Z0JBQ0osSUFBSSxFQUFFLE9BQU87Z0JBQ2IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7YUFDckIsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUVELEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBQyxHQUFHLENBQUMsRUFBRSxHQUFDLEdBQUcsSUFBSSxFQUFFLEdBQUMsRUFBRSxFQUFFLENBQUM7WUFDNUIsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdFLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2hCLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRixDQUFDO1lBRUQsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRCxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRS9ELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckIsR0FBQyxFQUFFLENBQUM7Z0JBQ0osUUFBUSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksTUFBTSxHQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7Z0JBQ2hCLENBQUMsRUFBRSxDQUFDO2dCQUNKLENBQUMsRUFBRSxDQUFDO2dCQUNKLElBQUksRUFBRSxNQUFNO2dCQUNaLE1BQU0sRUFBRSxNQUFNO2FBQ2pCLENBQUMsQ0FBQztRQUNQLENBQUM7SUFDTCxDQUFDO0lBRUQsV0FBVyxFQUFFLFVBQVUsS0FBYTtRQUNoQyxJQUFJLElBQUksR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFM0MsSUFBSSxXQUFXLEdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUNyQyxJQUFJLFlBQVksR0FBVyxDQUFDLENBQUM7UUFFN0IsSUFBSSxLQUFLLEdBQVcsQ0FBQyxDQUFDO1FBQ3RCLE9BQU8sWUFBWSxHQUFHLFdBQVcsRUFBRSxDQUFDO1lBQ2hDLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pCLEtBQUssQ0FBQztZQUNWLENBQUM7WUFFRCxJQUFJLENBQUMsR0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDbkIsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbEUsQ0FBQztZQUVELElBQUksSUFBSSxHQUFXLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN0RCxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN4QixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzlDLENBQUM7WUFFRCxJQUFJLE9BQU8sR0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDekQsSUFBSSxPQUFPLFNBQU0sQ0FBQztZQUNsQixFQUFFLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDZixPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMxQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUNWLEtBQUssR0FBRyxDQUFDLENBQUM7b0JBQ1YsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzdCLENBQUM7WUFDTCxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNuQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUNWLEtBQUssR0FBRyxDQUFDLENBQUM7b0JBQ1YsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3pCLFlBQVksSUFBSSxDQUFDLENBQUM7Z0JBQ3RCLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQztRQUVELElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBRTVCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFNUIsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRW5CLE1BQU0sQ0FBQztZQUNILEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztZQUNiLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtZQUNuQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDdkIsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO1lBQzNCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztTQUM1QixDQUFDO0lBQ04sQ0FBQztDQUNKO0FBRVEsb0JBQVksZ0JBRm5CO0FBRTZEOzs7Ozs7O0FDbGdCOUQsd0JBQWlELFdBQVcsQ0FBQyxDQUFBO0FBQzlELDRCQUE0QixlQUFlLENBQUMsQ0FBQTtBQUM1QyxzQkFBc0IsZ0JBQWdCLENBQUMsQ0FBQTtBQUN2QyxzQkFBc0IsU0FBUyxDQUFDLENBQUE7QUFHaEMseUJBQXlCLFlBQVksQ0FBQyxDQUFBO0FBTXJDLENBQUM7QUFJRCxDQUFDO0FBRUY7SUFBcUIsMEJBQVE7SUFlekIsZ0JBQVksQ0FBUyxFQUFFLENBQVMsRUFBRSxHQUFRO1FBZjlDLGlCQTZQQztRQTdPTyxrQkFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxzQkFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBWDFDLFNBQUksR0FBTztZQUNQLEVBQUUsRUFBRSxDQUFDO1lBQ0wsSUFBSSxFQUFFLENBQUM7WUFDUCxJQUFJLEVBQUUsQ0FBQztZQUNQLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxFQUFFLENBQUM7U0FDVixDQUFDO1FBT0UsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDckIsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUM7UUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFFbEIsSUFBSSxDQUFDLElBQUksR0FBRztZQUNSLEVBQUUsRUFBRSxDQUFDO1lBQ0wsSUFBSSxFQUFFLENBQUM7WUFDUCxJQUFJLEVBQUUsQ0FBQztZQUNQLEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxFQUFFLENBQUM7U0FDVixDQUFDO1FBRUYsSUFBSSxDQUFDLEtBQUssR0FBRztZQUNULENBQUMsRUFBRSxDQUFDLENBQUM7WUFDTCxDQUFDLEVBQUUsQ0FBQztZQUNKLElBQUksRUFBRSxDQUFDLENBQUM7U0FDWCxDQUFDO1FBRUYsYUFBSyxDQUFDLGtCQUFrQixDQUFDLFVBQUMsT0FBZSxFQUFFLElBQVksSUFBTyxLQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JHLGFBQUssQ0FBQyxvQkFBb0IsQ0FBQyxVQUFDLENBQVMsRUFBRSxDQUFTLElBQU8sS0FBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRixhQUFLLENBQUMsb0JBQW9CLENBQUMsVUFBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLElBQVksSUFBTyxLQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RyxDQUFDO0lBRUQsNEJBQVcsR0FBWCxVQUFZLENBQVMsRUFBRSxDQUFTO1FBQzVCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7WUFBQyxNQUFNLENBQUM7UUFDN0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBRUQsK0JBQWMsR0FBZCxVQUFlLENBQVMsRUFBRSxDQUFTLEVBQUUsSUFBWTtRQUM3QyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBQzdCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQztRQUFDLENBQUM7UUFFbEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQUVELCtCQUFjLEdBQWQsVUFBZSxPQUFlLEVBQUUsSUFBWTtRQUN4QyxFQUFFLENBQUMsQ0FBQyx5QkFBVyxDQUFDLElBQUksSUFBSSxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3JDLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBQzdCLElBQUksR0FBRyxHQUFXLElBQUksQ0FBQztRQUV2QixNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2QsS0FBSyxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNsQixLQUFLLGFBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDZCxHQUFHLEdBQUcsSUFBSSxDQUFDO2dCQUNYLEtBQUssQ0FBQztZQUVWLEtBQUssYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbEIsS0FBSyxhQUFLLENBQUMsSUFBSSxDQUFDLElBQUk7Z0JBQ2hCLEdBQUcsR0FBRyxNQUFNLENBQUM7Z0JBQ2IsS0FBSyxDQUFDO1lBRVYsS0FBSyxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNsQixLQUFLLGFBQUssQ0FBQyxJQUFJLENBQUMsSUFBSTtnQkFDaEIsR0FBRyxHQUFHLE1BQU0sQ0FBQztnQkFDYixLQUFLLENBQUM7WUFFVixLQUFLLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLEtBQUssYUFBSyxDQUFDLElBQUksQ0FBQyxLQUFLO2dCQUNqQixHQUFHLEdBQUcsT0FBTyxDQUFDO2dCQUNkLEtBQUssQ0FBQztZQUVWLEtBQUssYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNiLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzNDLEdBQUcsR0FBRyxJQUFJLENBQUM7Z0JBQ1gsS0FBSyxDQUFDO1lBRVYsS0FBSyxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDNUMsR0FBRyxHQUFHLElBQUksQ0FBQztnQkFDWCxLQUFLLENBQUM7WUFFVixLQUFLLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDYixJQUFJLENBQUMsY0FBYyxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMzQyxHQUFHLEdBQUcsTUFBTSxDQUFDO2dCQUNiLEtBQUssQ0FBQztZQUVWLEtBQUssYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNiLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVDLEdBQUcsR0FBRyxNQUFNLENBQUM7Z0JBQ2IsS0FBSyxDQUFDO1lBRVYsS0FBSyxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNsQixLQUFLLGFBQUssQ0FBQyxJQUFJLENBQUMsS0FBSztnQkFDakIsR0FBRyxHQUFHLE1BQU0sQ0FBQztnQkFDYixLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUM7UUFBQyxDQUFDO1FBQzVCLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BCLE1BQU0sQ0FBQztRQUNYLENBQUM7UUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztJQUMxQixDQUFDO0lBRUQsb0JBQUcsR0FBSDtRQUNJLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUM1Qix5QkFBVyxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFFRCx5QkFBUSxHQUFSLFVBQVMsR0FBVTtRQUNmLElBQUksS0FBSyxHQUFlLEdBQUcsQ0FBQyxLQUFLLENBQUM7UUFDbEMsSUFBSSxNQUFNLEdBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7UUFDNUQsSUFBSSxHQUFHLEdBQVcsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFFckQsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNULE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxXQUFXLEVBQUUsZ0JBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBRUQsSUFBSSxHQUFHLEdBQVcsYUFBSyxDQUFDLFFBQVEsQ0FBQyx5QkFBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdkQsSUFBSSxHQUFHLEdBQVcsYUFBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hELElBQUksR0FBRyxHQUFXLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUV6QyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGdCQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkYsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsV0FBVyxHQUFHLEdBQUcsR0FBRyxTQUFTLEVBQUUsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBRUQseUJBQVcsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDZixDQUFDO0lBRUQsdUJBQU0sR0FBTixVQUFPLEdBQVcsRUFBRSxHQUFXO1FBQzNCLEVBQUUsQ0FBQyxDQUFDLHlCQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDWCxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQztRQUFDLENBQUM7UUFFN0QsSUFBSSxHQUFHLEdBQWEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUN2RSxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQVksR0FBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLFFBQVEsQ0FBUSxHQUFHLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUNyQixNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxnQkFBSyxDQUFDLE1BQU0sWUFBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFFdkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRVgsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsOEJBQWEsR0FBYjtRQUNJLElBQUksR0FBRyxHQUFXLENBQUMsRUFDZixHQUFHLEdBQVcsQ0FBQyxDQUFDO1FBRXBCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDVCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDcEMsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ1QsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RDLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekIsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ1QsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RDLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNULElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN2QyxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMxQixDQUFDO0lBQ0wsQ0FBQztJQUVELDJCQUFVLEdBQVY7UUFDSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQztRQUFDLENBQUM7UUFFekMsSUFBSSxHQUFHLEdBQVcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2pELElBQUksR0FBRyxHQUFXLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUVqRCxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQztRQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBRW5DLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDekIsQ0FBQztJQUNMLENBQUM7SUFFRCw0QkFBVyxHQUFYO1FBQ0ksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBQUMsQ0FBQztRQUVuQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztZQUN4QixDQUFDO1FBQ0wsQ0FBQztRQUVELElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFFRCwwQkFBUyxHQUFUO1FBQ0ksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNsQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDWCxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRCx1QkFBTSxHQUFOO1FBQ0ksRUFBRSxDQUFDLENBQUMseUJBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBQUMsQ0FBQztRQUNqQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQztRQUFDLENBQUM7UUFFckMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQztRQUFDLENBQUM7UUFFakMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRW5CLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUM7UUFBQyxDQUFDO1FBRXZDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN0QixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDekIsQ0FBQztRQUVELElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUNMLGFBQUM7QUFBRCxDQTdQQSxBQTZQQyxDQTdQb0IsbUJBQVEsR0E2UDVCO0FBRVEsY0FBTSxVQUZkO0FBRWlCOztBQ2pSakIsd0JBQXVCLFdBQVcsQ0FBQyxDQUFBO0FBRXBDLHNCQUFzQixTQUFTLENBQUMsQ0FBQTtBQUdoQyw0QkFBa0QsZUFBZSxDQUFDLENBQUE7QUFLbEUsSUFBTSxhQUFhLEdBQVcsRUFBRSxDQUFDO0FBTWhDLENBQUM7QUFFRixJQUFJLFdBQVcsR0FBRztJQUNkLElBQUksRUFBUSxJQUFJO0lBRWhCLElBQUksRUFBVSxFQUFFO0lBQ2hCLE9BQU8sRUFBVSxLQUFLO0lBRXRCLEtBQUssRUFBVSxPQUFPO0lBRXRCLEVBQUUsRUFBaUIsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO0lBQzdCLEVBQUUsRUFBaUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQzNCLE1BQU0sRUFBaUIsRUFBRTtJQUV6QixHQUFHLEVBQVUsS0FBSztJQUNsQixHQUFHLEVBQVUsS0FBSztJQUVsQixNQUFNLEVBQVUsQ0FBQztJQUNqQixNQUFNLEVBQVUsQ0FBQztJQUNqQixHQUFHLEVBQVUsRUFBRTtJQUNmLEdBQUcsRUFBVSxFQUFFO0lBRWYsSUFBSSxFQUFVLENBQUM7SUFFZixLQUFLLEVBQVcsS0FBSztJQUNyQixTQUFTLEVBQVcsS0FBSztJQUN6QixTQUFTLEVBQVcsS0FBSztJQUN6QixJQUFJLEVBQVcsS0FBSztJQUVwQixTQUFTLEVBQW9CLEVBQUU7SUFDL0IsU0FBUyxFQUFFO1FBQ1AsTUFBTSxFQUFhLElBQUk7UUFDdkIsS0FBSyxFQUFhLElBQUk7UUFDdEIsTUFBTSxFQUFhLElBQUk7S0FDMUI7SUFFRCxhQUFhLEVBQWlCLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUNqRCxlQUFlLEVBQVUsQ0FBQztJQUMxQixhQUFhLEVBQVcsSUFBSTtJQUM1QixZQUFZLEVBQVUsQ0FBQyxDQUFDO0lBRXhCLFNBQVMsRUFBRSxVQUFVLElBQVU7UUFDM0IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFFakIsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUVyQixJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQztRQUVyQixJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFFakIsSUFBSSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUM7UUFDakIsSUFBSSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUM7UUFFakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDaEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDaEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDZCxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUVkLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBRWQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7UUFFbEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDcEIsSUFBSSxDQUFDLFNBQVMsR0FBRztZQUNiLE1BQU0sRUFBRSxJQUFJO1lBQ1osS0FBSyxFQUFFLElBQUk7WUFDWCxNQUFNLEVBQUUsSUFBSTtTQUNmLENBQUM7SUFDTixDQUFDO0lBRUQsVUFBVSxFQUFFO1FBQ1IsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUM7UUFBQyxDQUFDO1FBRXZDLElBQUksTUFBTSxHQUFVLGFBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25FLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUM7UUFFdkMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsWUFBWSxFQUFFLGdCQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ2pDLENBQUM7SUFDTCxDQUFDO0lBRUQsU0FBUyxFQUFFO1FBQ1AsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUM7UUFBQyxDQUFDO1FBRXRDLElBQUksTUFBTSxHQUFVLGFBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUM7UUFFdEMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsWUFBWSxFQUFFLGdCQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2hDLENBQUM7SUFDTCxDQUFDO0lBRUQsWUFBWSxFQUFFO1FBQ1YsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFFdkIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLEVBQUUsU0FBUSxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDM0QsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUN0QixJQUFJLENBQUMsYUFBYSxDQUFDLGFBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLE9BQU8sSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLENBQUM7WUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxXQUFXLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUMxQixDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksV0FBVyxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDMUIsQ0FBQztZQUVELEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN6QixDQUFDLEVBQUUsQ0FBQztZQUNSLENBQUM7UUFDTCxDQUFDO1FBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxhQUFhLEVBQUUsVUFBVSxHQUFVO1FBQy9CLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDO1FBQ2xCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQixJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBRWpCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxrQ0FBa0MsRUFBRSxnQkFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BGLENBQUM7UUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFRCxTQUFTLEVBQUUsVUFBVSxJQUFlLEVBQUUsSUFBWTtRQUM5QyxJQUFJLEdBQUcsR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztRQUU1QixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7SUFDOUIsQ0FBQztJQUVELE9BQU8sRUFBRSxVQUFVLElBQWU7UUFDOUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7WUFBQyxNQUFNLENBQUM7UUFFdEMsSUFBSSxHQUFHLEdBQVcsRUFBRSxDQUFDO1FBQ3JCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNyQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO1lBQ3JCLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEQsQ0FBQztZQUVELEdBQUcsR0FBRyx5QkFBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksdUJBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQy9CLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxZQUFZLENBQUM7UUFDdkMsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSx1QkFBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUIsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQztRQUN2QyxDQUFDO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxnQkFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRWhELElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUQsUUFBUSxFQUFFLFVBQVUsSUFBZTtRQUMvQixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztZQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFFNUMsSUFBSSxHQUFHLEdBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDN0IsSUFBSSxNQUFNLEdBQVcsR0FBRyxDQUFDLE1BQU0sQ0FBQztRQUVoQyxJQUFJLENBQUMsR0FBVyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxHQUFXLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFFekIsSUFBSSxFQUFVLEVBQUUsRUFBVSxDQUFDO1FBQzNCLElBQUksS0FBSyxHQUFXLENBQUMsQ0FBQztRQUV0QixPQUFPLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDN0IsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTdDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkQsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDUCxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsRUFBRSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDakIsQ0FBQztRQUNMLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEIsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7UUFDckIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQzFCLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVELEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSx5QkFBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFekQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLFVBQVUsRUFBRSxnQkFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVoQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFM0IsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsUUFBUSxFQUFFLFVBQVUsSUFBZTtRQUMvQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSx1QkFBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbEMsSUFBSSxHQUFHLEdBQVcsU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsYUFBYSxDQUFDO1lBQzFELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFBQyxHQUFHLElBQUksR0FBRyxDQUFDO1lBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLGdCQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFL0MsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVoQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDakIsQ0FBQztRQUVELElBQUksS0FBSyxHQUFZLEtBQUssQ0FBQztRQUMzQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDckIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsU0FBVyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzNELEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDaEMsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7b0JBQ2hCLEtBQUssR0FBRyxJQUFJLENBQUM7b0JBQ2IsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO2dCQUM5QixDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDVCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLFVBQVUsRUFBRSxnQkFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVoQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFM0IsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsTUFBTSxFQUFFO1FBQ0osSUFBSSxHQUFHLEdBQVcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUMzQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDeEIsR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7UUFDeEMsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQixHQUFHLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDN0IsQ0FBQztRQUVELE1BQU0sQ0FBQyxHQUFHLENBQUM7SUFDZixDQUFDO0lBRUQsTUFBTSxFQUFFO1FBQ0osSUFBSSxHQUFHLEdBQVcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUMzQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdkIsR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7UUFDdkMsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQixHQUFHLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDN0IsQ0FBQztRQUVELE1BQU0sQ0FBQyxHQUFHLENBQUM7SUFDZixDQUFDO0lBRUQsV0FBVyxFQUFFLFVBQVUsQ0FBUyxFQUFFLENBQVM7UUFDdkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDWixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztZQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDO1FBQ1gsQ0FBQztRQUVELElBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxjQUFjLEVBQUUsVUFBVSxDQUFTLEVBQUUsQ0FBUyxFQUFFLElBQVk7UUFDeEQsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQztRQUV0QixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNWLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxJQUFJLENBQUMsZUFBZSxJQUFJLENBQUMsQ0FBQztZQUM5QixDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNyRSxJQUFJLENBQUMsZUFBZSxJQUFJLENBQUMsQ0FBQztZQUM5QixDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsK0JBQStCLEVBQUUsZ0JBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDMUUsTUFBTSxDQUFDO1lBQ1gsQ0FBQztZQUVELElBQUksSUFBSSxHQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDakQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxVQUFVLEVBQUUsZ0JBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4RixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7UUFFaEMsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVCLElBQUksS0FBSyxHQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNsRCxJQUFJLElBQUksR0FBYyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUM5QixDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFFRCxZQUFZLEVBQUUsVUFBVSxRQUFrQjtRQUN0QyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUN2QixNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQzNCLE9BQU8sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTVCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFDLEdBQUcsT0FBTyxFQUFFLENBQUMsR0FBRyxHQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUMxQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxnQkFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1FBQ25DLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFNBQVEsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ25ELElBQUksS0FBSyxHQUFHLGdCQUFNLENBQUMsS0FBSyxDQUFDO1lBQ3pCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFBQyxLQUFLLEdBQUcsZ0JBQU0sQ0FBQyxNQUFNLENBQUM7WUFBQyxDQUFDO1lBQUMsSUFBSSxDQUNwRCxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQUMsS0FBSyxHQUFHLGdCQUFNLENBQUMsR0FBRyxDQUFDO1lBQUMsQ0FBQztZQUFDLElBQUksQ0FDaEQsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUFDLEtBQUssR0FBRyxnQkFBTSxDQUFDLElBQUksQ0FBQztZQUFDLENBQUM7WUFBQyxJQUFJLENBQ3JELEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFBQyxLQUFLLEdBQUcsZ0JBQU0sQ0FBQyxJQUFJLENBQUM7WUFBQyxDQUFDO1lBRWhFLElBQUksS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUFDLENBQUM7WUFFMUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDL0IsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDekQsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLE1BQU0sR0FBVyxNQUFNLENBQUM7UUFDNUIsRUFBRSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFBQyxDQUFDO1FBQUMsSUFBSSxDQUNqRSxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7UUFBQyxDQUFDO1FBRTNDLGFBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxHQUFHLE1BQU0sRUFBRSxnQkFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNsRixDQUFDO0lBRUQsTUFBTSxFQUFFLFVBQVUsUUFBa0I7UUFDaEMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUU1QixRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRy9DLElBQUksSUFBSSxHQUFXLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1FBRXZELElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNYLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDaEQsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ1gsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQUMsQ0FBQztZQUVuRCxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsYUFBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLGdCQUFNLENBQUMsS0FBSyxFQUFFLGdCQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBR0QsYUFBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFHdEUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM5QixRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxnQkFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVELGFBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsZ0JBQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFVakcsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUU1QixhQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxLQUFLLEVBQUUsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxRixhQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLGdCQUFNLENBQUMsS0FBSyxFQUFFLGdCQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFN0csYUFBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxnQkFBTSxDQUFDLEtBQUssRUFBRSxnQkFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JGLGFBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxnQkFBTSxDQUFDLElBQUksRUFBRSxnQkFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRzdHLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDaEQsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFDRCxhQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsZ0JBQU0sQ0FBQyxLQUFLLEVBQUUsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVqRixJQUFJLEtBQUssR0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxXQUFXLENBQUM7UUFDeEksSUFBSSxTQUFTLEdBQUcsZ0JBQU0sQ0FBQyxLQUFLLENBQUM7UUFDN0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUUsU0FBUyxHQUFHLGdCQUFNLENBQUMsSUFBSSxDQUFDO1lBQ3hCLEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBRUQsYUFBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsZ0JBQU0sQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFckUsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLFVBQVUsQ0FBQztRQUN4SCxTQUFTLEdBQUcsZ0JBQU0sQ0FBQyxLQUFLLENBQUM7UUFDekIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUUsU0FBUyxHQUFHLGdCQUFNLENBQUMsSUFBSSxDQUFDO1lBQ3hCLEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBRUQsYUFBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsZ0JBQU0sQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFNdEUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFB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LENBQUMsRUFBRSxDQUFDLEVBQUM7SUFDekIsS0FBSyxFQUFFLEVBQUMsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUM7SUFDakQsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0lBQ2pDLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtJQUNuQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUU7SUFDbEMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtJQUM1QyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRTtJQUNsRCxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFO0lBQ3pDLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFO0lBQ2xELEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsR0FBRyxFQUFFO0lBQ2hELE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7SUFDNUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUU7SUFDaEQsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxHQUFHLEVBQUU7SUFDbEQsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxHQUFHLEVBQUU7Q0FDcEQ7QUEySVEsY0FBTSxVQTNJYjtBQUVGLElBQUksS0FBSyxHQUFRLEVBQUU7QUF5SUYsYUFBSyxTQXpJRjtBQUNwQixJQUFJLEtBQUssR0FBeUI7SUFDOUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUU7SUFDL04sQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7SUFDckssQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7SUFDOUgsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQztDQUN0SCxDQUFDO0FBRUYsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUNqRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFB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RSxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzRixDQUFDLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUdyRyxDQUFDLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxRSxDQUFDLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUc1RSxDQUFDLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFHekUsQ0FBQyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEUsQ0FBQyxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUUsQ0FBQyxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUUsQ0FBQyxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDOUUsQ0FBQyxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUUsQ0FBQyxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUUsQ0FBQyxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDOUUsQ0FBQyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEUsQ0FBQyxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFHOUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEUsQ0FBQyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckUsQ0FBQyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekUsQ0FBQyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEUsQ0FBQyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFHbkUsQ0FBQyxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0UsQ0FBQyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekUsQ0FBQyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUUsQ0FBQyxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFHMUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0QsQ0FBQyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEUsQ0FBQyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEUsQ0FBQyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkUsQ0FBQyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckUsQ0FBQyxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUUsQ0FBQyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQyxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekUsQ0FBQyxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUUsQ0FBQyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FB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QUFFLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztZQUFDLElBQUksR0FBRyxNQUFNLENBQUM7UUFBQyxDQUFDO1FBQUMsSUFBSSxDQUN4QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztZQUFDLElBQUksR0FBRyxPQUFPLENBQUM7UUFBQyxDQUFDO1FBQUMsSUFBSSxDQUN6QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztZQUFDLElBQUksR0FBRyxPQUFPLENBQUM7UUFBQyxDQUFDO1FBQUMsSUFBSSxDQUN6QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztZQUFDLElBQUksR0FBRyxPQUFPLENBQUM7UUFBQyxDQUFDO1FBQUMsSUFBSSxDQUN6QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztZQUFDLElBQUksR0FBRyxPQUFPLENBQUM7UUFBQyxDQUFDO1FBQUMsSUFBSSxDQUN6QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztZQUFDLElBQUksR0FBRyxPQUFPLENBQUM7UUFBQyxDQUFDO1FBQUMsSUFBSSxDQUN6QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztZQUFDLElBQUksR0FBRyxPQUFPLENBQUM7UUFBQyxDQUFDO1FBQUMsSUFBSSxDQUN6QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztZQUFDLElBQUksR0FBRyxPQUFPLENBQUM7UUFBQyxDQUFDO1FBQUMsSUFBSSxDQUN6QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztZQUFDLElBQUksR0FBRyxPQUFPLENBQUM7UUFBQyxDQUFDO1FBQUMsSUFBSSxDQUN6QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLENB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QUF5QixFQUFTLFNBQWdDO1FBQTNHLDBCQUFnQyxHQUFoQyxrQkFBZ0M7UUFBRSwwQkFBZ0MsR0FBaEMsa0JBQWdDO1FBQUUseUJBQXVDLEdBQXZDLHFCQUF1QztRQUFwRyxlQUFVLEdBQVYsVUFBVSxDQUFlO1FBQVMsZUFBVSxHQUFWLFVBQVUsQ0FBZTtRQUFTLGNBQVMsR0FBVCxTQUFTLENBQXVCO0lBQUcsQ0FBQztJQUMvSCxXQUFDO0FBQUQsQ0FGQSxBQUVDLElBQUE7QUFFUSxZQUFJLFFBRlo7QUFFZTs7QUNSaEIsSUFBSSxXQUFXLEdBQW9CO0lBQy9CLFlBQVksRUFBRSx3ckJBc0JiO0lBRUQsY0FBYyxFQUFFLHVkQWVmO0NBQ0o7QUFFUSxtQkFBVyxlQUZsQjtBQUVxQjs7QUM3Q3RCLHFCQUFxQixRQUFRLENBQUMsQ0FBQTtBQUMvQixzQkFBc0IsZ0JBQWdCLENBQUMsQ0FBQTtBQU12QyxNQUFNLENBQUMsTUFBTSxHQUFHO0lBQ1osSUFBSSxJQUFJLEdBQUcsSUFBSSxXQUFJLEVBQUUsQ0FBQztJQUV0QixhQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIu+7v2ltcG9ydCB7IENvbG9ycyB9IGZyb20gJy4vUHJlZmFicyc7XG5pbXBvcnQgeyBVdGlscyB9IGZyb20gJy4vVXRpbHMnO1xuaW1wb3J0IHsgR2FtZSB9IGZyb20gJy4vR2FtZSc7XG5pbXBvcnQgeyBSZW5kZXJlciB9IGZyb20gJy4vZW5naW5lL1JlbmRlcmVyJztcbmltcG9ydCB7IFZlY3RvcjIgfSBmcm9tICcuL2VuZ2luZS9WZWN0b3IyJztcbmltcG9ydCB7IENvbG9yIH0gZnJvbSAnLi9lbmdpbmUvQ29sb3InO1xuXG5pbnRlcmZhY2UgTWVzc2FnZSB7XG4gICAgdGV4dDogc3RyaW5nLFxuICAgIGNvbG9yOiBDb2xvclxufTtcblxuY2xhc3MgQ29uc29sZSB7XG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyO1xuXG4gICAgbWVzc2FnZXM6IEFycmF5PE1lc3NhZ2U+O1xuICAgIG1heE1lc3NhZ2VzOiBudW1iZXI7XG5cbiAgICBjb25zb2xlUG9zaXRpb246IFZlY3RvcjI7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZ2FtZTogR2FtZSkge1xuICAgICAgICB0aGlzLnJlbmRlcmVyID0gZ2FtZS5yZW5kZXJlcjtcblxuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gW107XG4gICAgICAgIHRoaXMubWF4TWVzc2FnZXMgPSA0O1xuXG4gICAgICAgIHRoaXMuY29uc29sZVBvc2l0aW9uID0ge3g6IDAsIHk6IDI1fTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IFtdO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cblxuICAgIGFkZE1lc3NhZ2UodGV4dDogc3RyaW5nLCBjb2xvcjogQ29sb3IgPSBDb2xvcnMuV0hJVEUpIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlcy5wdXNoKHsgdGV4dDogdGV4dCwgY29sb3I6IGNvbG9yIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLm1lc3NhZ2VzLmxlbmd0aCA+IHRoaXMubWF4TWVzc2FnZXMpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXMuc3BsaWNlKDAsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuY2xlYXJSZWN0KDAsIDI1LCA4NSwgNSk7XG5cbiAgICAgICAgbGV0IGxlbmd0aDogbnVtYmVyID0gdGhpcy5tZXNzYWdlcy5sZW5ndGggLSAxO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbTogTWVzc2FnZTsgbSA9IHRoaXMubWVzc2FnZXNbbGVuZ3RoIC0gaV07IGkrKykge1xuICAgICAgICAgICAgVXRpbHMucmVuZGVyVGV4dCh0aGlzLnJlbmRlcmVyLCB0aGlzLmNvbnNvbGVQb3NpdGlvbi54LCB0aGlzLmNvbnNvbGVQb3NpdGlvbi55ICsgdGhpcy5tYXhNZXNzYWdlcyAtIGksIG0udGV4dCwgbS5jb2xvcilcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgQ29uc29sZSB9OyIsIu+7v2ltcG9ydCB7IEluc3RhbmNlIH0gZnJvbSAnLi9JbnN0YW5jZSc7XHJcbmltcG9ydCB7IEVuZW15RmFjdG9yeSwgV29ybGRFbmVteSB9IGZyb20gJy4vRW5lbXlGYWN0b3J5JztcclxuaW1wb3J0IHsgTWFwIH0gZnJvbSAnLi9NYXAnO1xyXG5pbXBvcnQgeyBUaWxlUHJlZmFiLCBUaWxlVHlwZXMsIENvbG9ycyB9IGZyb20gJy4vUHJlZmFicyc7XHJcbmltcG9ydCB7IFBsYXllciB9IGZyb20gJy4vUGxheWVyJztcclxuaW1wb3J0IHsgVmVjdG9yMiB9IGZyb20gJy4vZW5naW5lL1ZlY3RvcjInO1xyXG5pbXBvcnQgeyBQbGF5ZXJTdGF0cyB9IGZyb20gJy4vUGxheWVyU3RhdHMnO1xyXG5pbXBvcnQgeyBVdGlscyB9IGZyb20gJy4vVXRpbHMnO1xyXG5cclxuY2xhc3MgRW5lbXkgZXh0ZW5kcyBJbnN0YW5jZSB7XHJcbiAgICB0YXJnZXQ6IFBsYXllcjtcclxuICAgIHRhcmdldExhc3RQb3NpdGlvbjogVmVjdG9yMjtcclxuICAgIHRhcmdldFBhdGg6IEFycmF5PG51bWJlcj47XHJcbiAgICBcclxuICAgIGF0dGFja2VkQnlQbGF5ZXI6IGJvb2xlYW47XHJcblxyXG4gICAgbW92ZW1lbnRCdWRnZXQ6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlciwgbWFwOiBNYXAsIHB1YmxpYyBlbmVteTogV29ybGRFbmVteSkge1xyXG4gICAgICAgIHN1cGVyKHgsIHksIG1hcCwgZW5lbXkuZGVmLnRpbGUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubmFtZSA9IGVuZW15LmRlZi5uYW1lO1xyXG5cclxuICAgICAgICB0aGlzLnRhcmdldCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy50YXJnZXRMYXN0UG9zaXRpb24gPSB7IHg6IDAsIHk6IDAgfTtcclxuICAgICAgICB0aGlzLnRhcmdldFBhdGggPSBudWxsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuZGlzY292ZXJlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaW5TaGFkb3cgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuc3RvcE9uRGlzY292ZXIgPSB0cnVlO1xyXG5cclxuICAgICAgICB0aGlzLmF0dGFja2VkQnlQbGF5ZXIgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5tb3ZlbWVudEJ1ZGdldCA9IDAuMDtcclxuICAgIH1cclxuXHJcbiAgICByZWNlaXZlRGFtYWdlKGRtZzogbnVtYmVyKTogYm9vbGVhbiB7XHJcbiAgICAgICAgdGhpcy5hdHRhY2tlZEJ5UGxheWVyID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdGhpcy5lbmVteS5ocFswXSAtPSBkbWc7XHJcbiAgICAgICAgaWYgKHRoaXMuZW5lbXkuaHBbMF0gPD0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLmRlc3Ryb3kgPSB0cnVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBtb3ZlVG8oeFRvOiBudW1iZXIsIHlUbzogbnVtYmVyKTogYm9vbGVhbiB7XHJcbiAgICAgICAgbGV0IHRpbGUgPSB0aGlzLm1hcC5nZXRUaWxlQXQodGhpcy54ICsgeFRvLCB0aGlzLnkgKyB5VG8pO1xyXG4gICAgICAgIGxldCBzb2xpZDogYm9vbGVhbiA9ICh0aWxlICYmIHRpbGUudHlwZSA9PSBUaWxlVHlwZXMuV0FMTCk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5lbmVteS5kZWYuY2FuU3dpbSAmJiB0aWxlLnR5cGUgPT0gVGlsZVR5cGVzLldBVEVSX0RFRVApIHtcclxuICAgICAgICAgICAgc29saWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGluczogSW5zdGFuY2UgPSB0aGlzLm1hcC5nZXRJbnN0YW5jZUF0KHRoaXMueCArIHhUbywgdGhpcy55ICsgeVRvKTtcclxuICAgICAgICBpZiAoaW5zICYmICg8RW5lbXk+aW5zKS5lbmVteSkge1xyXG4gICAgICAgICAgICBzb2xpZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXNvbGlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdXBlci5tb3ZlVG8oeFRvLCB5VG8pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGZvbGxvd1BhdGgoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnRhcmdldFBhdGggfHwgdGhpcy50YXJnZXRQYXRoLmxlbmd0aCA9PSAwKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICBsZXQgeFRvOiBudW1iZXIgPSB0aGlzLnRhcmdldFBhdGguc2hpZnQoKSAtIHRoaXMueDtcclxuICAgICAgICBsZXQgeVRvOiBudW1iZXIgPSB0aGlzLnRhcmdldFBhdGguc2hpZnQoKSAtIHRoaXMueTtcclxuXHJcbiAgICAgICAgdGhpcy5tb3ZlVG8oeFRvLCB5VG8pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy50YXJnZXRQYXRoLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0UGF0aCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHdhbmRlcigpIHtcclxuICAgICAgICBsZXQgc2hvdWxkTW92ZTogYm9vbGVhbiA9IChNYXRoLnJhbmRvbSgpICogMTApIDwgNztcclxuICAgICAgICBpZiAoc2hvdWxkTW92ZSkge1xyXG4gICAgICAgICAgICBsZXQgeFRvOiBudW1iZXIgPSBNYXRoLnJvdW5kKChNYXRoLnJhbmRvbSgpICogMi4wKSAtIDEuMCk7XHJcbiAgICAgICAgICAgIGxldCB5VG86IG51bWJlciA9IE1hdGgucm91bmQoKE1hdGgucmFuZG9tKCkgKiAyLjApIC0gMS4wKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh4VG8gIT0gMCB8fCB5VG8gIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlVG8oeFRvLCB5VG8pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNoZWNrQXR0YWNrKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmIChNYXRoLmFicyh0aGlzLnRhcmdldC54IC0gdGhpcy54KSA+IDEgfHwgTWF0aC5hYnModGhpcy50YXJnZXQueSAtIHRoaXMueSkgPiAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBwbGF5ZXIgPSBQbGF5ZXJTdGF0cztcclxuICAgICAgICBsZXQgbWlzc2VkOiBib29sZWFuID0gKE1hdGgucmFuZG9tKCkgKiAxMDApIDwgcGxheWVyLmx1aztcclxuICAgICAgICBsZXQgbXNnOiBzdHJpbmcgPSB0aGlzLmVuZW15LmRlZi5uYW1lICsgXCIgYXR0YWNrcyB5b3VcIjtcclxuXHJcbiAgICAgICAgaWYgKG1pc3NlZCkge1xyXG4gICAgICAgICAgICB0aGlzLm1hcC5nYW1lLmNvbnNvbGUuYWRkTWVzc2FnZShtc2cgKyBcIiwgbWlzc2VkIVwiLCBDb2xvcnMuR1JFRU4pO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc3RyOiBudW1iZXIgPSBVdGlscy5yb2xsRGljZSh0aGlzLmVuZW15LmRlZi5zdHIpO1xyXG4gICAgICAgIGxldCBkZWY6IG51bWJlciA9IFV0aWxzLnJvbGxEaWNlKHBsYXllci5nZXREZWYoKSk7XHJcbiAgICAgICAgbGV0IGRtZzogbnVtYmVyID0gTWF0aC5tYXgoc3RyIC0gZGVmLCAxKTtcclxuXHJcbiAgICAgICAgdGhpcy5tYXAuZ2FtZS5jb25zb2xlLmFkZE1lc3NhZ2UobXNnICsgXCIsIGhpdCBieSBcIiArIGRtZyArIFwiIHBvaW50c1wiLCBDb2xvcnMuUkVEKTtcclxuICAgICAgICBwbGF5ZXIucmVjZWl2ZURhbWFnZShkbWcpO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVNb3ZlbWVudCgpOiBib29sZWFuIHtcclxuICAgICAgICBpZiAodGhpcy50YXJnZXQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2hlY2tBdHRhY2soKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldC54ICE9IHRoaXMudGFyZ2V0TGFzdFBvc2l0aW9uLnggfHwgdGhpcy50YXJnZXQueSAhPSB0aGlzLnRhcmdldExhc3RQb3NpdGlvbi55KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhcmdldExhc3RQb3NpdGlvbi54ID0gdGhpcy50YXJnZXQueDtcclxuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0TGFzdFBvc2l0aW9uLnkgPSB0aGlzLnRhcmdldC55O1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0UGF0aCA9IHRoaXMubWFwLmdldFBhdGgodGhpcy54LCB0aGlzLnksIHRoaXMudGFyZ2V0LngsIHRoaXMudGFyZ2V0LnkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXRQYXRoLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXRQYXRoLnBvcCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmZvbGxvd1BhdGgoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLndhbmRlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZSgpOiBib29sZWFuIHtcclxuICAgICAgICBpZiAodGhpcy5kZXN0cm95KSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuaW5TaGFkb3cgPSB0cnVlO1xyXG5cclxuICAgICAgICBsZXQgcDogUGxheWVyID0gdGhpcy5tYXAucGxheWVyO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tYXAubWFwW3RoaXMueV1bdGhpcy54XS52aXNpYmxlID09IDIpIHtcclxuICAgICAgICAgICAgdGhpcy5pblNoYWRvdyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBsZXQgcGxheWVySW52aXNpYmxlOiBib29sZWFuID0gKFBsYXllclN0YXRzLmludmlzaWJsZSAmJiAhdGhpcy5hdHRhY2tlZEJ5UGxheWVyKTtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLnRhcmdldCAmJiAhcGxheWVySW52aXNpYmxlICYmIChNYXRoLmFicyhwLnggLSB0aGlzLngpIDw9IHRoaXMuZW5lbXkuZGVmLnZpZXdEaXN0YW5jZSB8fCBNYXRoLmFicyhwLnkgLSB0aGlzLnkpIDw9IHRoaXMuZW5lbXkuZGVmLnZpZXdEaXN0YW5jZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gcDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IG1wOiBWZWN0b3IyID0gdGhpcy5tYXAubW91c2VQb3NpdGlvbjtcclxuICAgICAgICAgICAgaWYgKG1wLnggPT0gdGhpcy54ICYmIG1wLnkgPT0gdGhpcy55KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1hcC50aWxlRGVzY3JpcHRpb24gPSB0aGlzLm5hbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubWFwLm1hcFt0aGlzLnldW3RoaXMueF0udmlzaWJsZSA8PSAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzY292ZXJlZCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMubWFwLnBsYXllclR1cm4pIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgIHZhciB0dXJucyA9IHRoaXMuZW5lbXkuZGVmLnNwZCAvIFBsYXllclN0YXRzLnNwZCArIHRoaXMubW92ZW1lbnRCdWRnZXQ7XHJcbiAgICAgICAgdGhpcy5tb3ZlbWVudEJ1ZGdldCA9IHR1cm5zIC0gKHR1cm5zIDw8IDApO1xyXG4gICAgICAgIHR1cm5zID0gdHVybnMgPDwgMDtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0dXJuczsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnVwZGF0ZU1vdmVtZW50KCkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCB7IEVuZW15IH07Iiwi77u/aW1wb3J0IHsgVGlsZVByZWZhYiwgVGlsZXNQcmVmYWJzIH0gZnJvbSAnLi9QcmVmYWJzJztcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSAnLi9VdGlscyc7XG5cbmludGVyZmFjZSBFbmVteURlZmluaXRpb24ge1xuICAgIHRpbGVDb2RlOiBzdHJpbmcsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGhwOiBzdHJpbmcsXG4gICAgc3RyOiBzdHJpbmcsXG4gICAgZGVmOiBzdHJpbmcsXG4gICAgc3BkOiBudW1iZXIsXG4gICAgbHVrOiBudW1iZXIsXG4gICAgdmlld0Rpc3RhbmNlOiBudW1iZXIsXG4gICAgY2FuU3dpbTogYm9vbGVhbixcbiAgICB0aWxlOiBUaWxlUHJlZmFiXG59O1xuXG5pbnRlcmZhY2UgRW5lbWllcyB7XG4gICAgW2luZGV4OiBzdHJpbmddOiBFbmVteURlZmluaXRpb25cbn07XG5cbmludGVyZmFjZSBXb3JsZEVuZW15IHtcbiAgICBkZWY6IEVuZW15RGVmaW5pdGlvbixcbiAgICBocDogQXJyYXk8bnVtYmVyPlxufVxuXG5sZXQgRW5lbXlGYWN0b3J5ID0ge1xuICAgIGVuZW1pZXM6IDxFbmVtaWVzPntcbiAgICAgICAgcmF0OiB7IHRpbGVDb2RlOiAnUkFUJywgbmFtZTogJ0dpYW50IHJhdCcsIGhwOiAnMkQzKzUnLCBzdHI6ICcxRDQnLCBkZWY6ICcxRDMnLCBzcGQ6IDEwLCBsdWs6IDEwLCBjYW5Td2ltOiBmYWxzZSwgdmlld0Rpc3RhbmNlOiA3LCB0aWxlOiBudWxsIH0sXG4gICAgICAgIHNwaWRlcjogeyB0aWxlQ29kZTogJ1NQSURFUicsIG5hbWU6ICdTcGlkZXInLCBocDogJzJEMys4Jywgc3RyOiAnMUQxMCsyJywgZGVmOiAnMUQ1Jywgc3BkOiAxMiwgbHVrOiAxMCwgY2FuU3dpbTogZmFsc2UsIHZpZXdEaXN0YW5jZTogNSwgdGlsZTogbnVsbCB9LFxuICAgICAgICBrb2JvbGQ6IHsgdGlsZUNvZGU6ICdLT0JPTEQnLCBuYW1lOiAnS29ib2xkJywgaHA6ICczRDMrOCcsIHN0cjogJzJENCcsIGRlZjogJzJENCcsIHNwZDogMTAsIGx1azogMTUsIGNhblN3aW06IGZhbHNlLCB2aWV3RGlzdGFuY2U6IDUsIHRpbGU6IG51bGwgfSxcbiAgICAgICAgaW1wOiB7IHRpbGVDb2RlOiAnSU1QJywgbmFtZTogJ0ltcCcsIGhwOiAnMkQ0KzcnLCBzdHI6ICcyRDQrMicsIGRlZjogJzJENicsIHNwZDogMTAsIGx1azogMTUsIGNhblN3aW06IHRydWUsIHZpZXdEaXN0YW5jZTogNywgdGlsZTogbnVsbCB9LFxuICAgICAgICBnb2JsaW46IHsgdGlsZUNvZGU6ICdHT0JMSU4nLCBuYW1lOiAnR29ibGluJywgaHA6ICc0RDQrNCcsIHN0cjogJzNENCsyJywgZGVmOiAnM0Q2Jywgc3BkOiAxMCwgbHVrOiAyMCwgY2FuU3dpbTogZmFsc2UsIHZpZXdEaXN0YW5jZTogNywgdGlsZTogbnVsbCB9LFxuICAgICAgICB6b21iaWU6IHsgdGlsZUNvZGU6ICdaT01CSUUnLCBuYW1lOiAnWm9tYmllJywgaHA6ICcyRDQrNycsIHN0cjogJzJENScsIGRlZjogJzJENCcsIHNwZDogOCwgbHVrOiAxMCwgY2FuU3dpbTogZmFsc2UsIHZpZXdEaXN0YW5jZTogMywgdGlsZTogbnVsbCB9LFxuICAgICAgICBvZ3JlOiB7IHRpbGVDb2RlOiAnT0dSRScsIG5hbWU6ICdPZ3JlJywgaHA6ICc0RDUrNScsIHN0cjogJzNENSs0JywgZGVmOiAnM0Q0Jywgc3BkOiA4LCBsdWs6IDE1LCBjYW5Td2ltOiBmYWxzZSwgdmlld0Rpc3RhbmNlOiA1LCB0aWxlOiBudWxsIH0sXG4gICAgICAgIHJvZ3VlOiB7IHRpbGVDb2RlOiAnUk9HVUUnLCBuYW1lOiAnUm9ndWUnLCBocDogJzRENSs3Jywgc3RyOiAnMkQ2KzMnLCBkZWY6ICcyRDYnLCBzcGQ6IDEwLCBsdWs6IDIwLCBjYW5Td2ltOiB0cnVlLCB2aWV3RGlzdGFuY2U6IDEwLCB0aWxlOiBudWxsIH0sXG5cbiAgICAgICAgYmVnZ2FyOiB7IHRpbGVDb2RlOiAnQkVHR0FSJywgbmFtZTogJ0JlZ2dhcicsIGhwOiAnM0Q0KzQnLCBzdHI6ICcyRDQrMicsIGRlZjogJzFENicsIHNwZDogMTMsIGx1azogMTAsIGNhblN3aW06IHRydWUsIHZpZXdEaXN0YW5jZTogMTAsIHRpbGU6IG51bGwgfSxcbiAgICAgICAgc2hhZG93OiB7IHRpbGVDb2RlOiAnU0hBRE9XJywgbmFtZTogJ1NoYWRvdycsIGhwOiAnNEQ1KzcnLCBzdHI6ICcyRDYrMycsIGRlZjogJzJENicsIHNwZDogMTUsIGx1azogMTUsIGNhblN3aW06IHRydWUsIHZpZXdEaXN0YW5jZTogMTAsIHRpbGU6IG51bGwgfSxcbiAgICAgICAgdGhpZWY6IHsgdGlsZUNvZGU6ICdUSElFRicsIG5hbWU6ICdUaGllZicsIGhwOiAnM0Q1KzYnLCBzdHI6ICczRDQrNCcsIGRlZjogJzNEMycsIHNwZDogMTUsIGx1azogMjAsIGNhblN3aW06IHRydWUsIHZpZXdEaXN0YW5jZTogMTAsIHRpbGU6IG51bGwgfSxcbiAgICAgICAgY2Fvc0tuaWdodDogeyB0aWxlQ29kZTogJ0NBT1NfS05JR0hUJywgbmFtZTogJ0Nhb3Mga25pZ2h0JywgaHA6ICc0RDYrOCcsIHN0cjogJzJEMTArNScsIGRlZjogJzNENys0Jywgc3BkOiAxMCwgbHVrOiAyMCwgY2FuU3dpbTogdHJ1ZSwgdmlld0Rpc3RhbmNlOiAxMCwgdGlsZTogbnVsbCB9LFxuICAgICAgICBsaXphcmRXYXJyaW9yOiB7IHRpbGVDb2RlOiAnTElaQVJEX1dBUlJJT1InLCBuYW1lOiAnTGl6YXJkIHdhcnJpb3InLCBocDogJzRENis2Jywgc3RyOiAnMkQ3KzUnLCBkZWY6ICcyRDgnLCBzcGQ6IDE1LCBsdWs6IDI1LCBjYW5Td2ltOiB0cnVlLCB2aWV3RGlzdGFuY2U6IDEwLCB0aWxlOiBudWxsIH0sXG4gICAgICAgIG9waGlkaWFuOiB7IHRpbGVDb2RlOiAnT1BISURJQU4nLCBuYW1lOiAnT3BoaWRpYW4nLCBocDogJzREOCs4Jywgc3RyOiAnM0Q2KzMnLCBkZWY6ICczRDYrMycsIHNwZDogMTUsIGx1azogMjUsIGNhblN3aW06IHRydWUsIHZpZXdEaXN0YW5jZTogMTAsIHRpbGU6IG51bGwgfSxcbiAgICAgICAgY2Fvc1NlcnZhbnQ6IHsgdGlsZUNvZGU6ICdDQU9TX1NFUlZBTlQnLCBuYW1lOiAnQ2FvcyBzZXJ2YW50JywgaHA6ICczRDUrNicsIHN0cjogJzNEMyszJywgZGVmOiAnMkQ2Jywgc3BkOiAxMywgbHVrOiAzMCwgY2FuU3dpbTogdHJ1ZSwgdmlld0Rpc3RhbmNlOiAxMCwgdGlsZTogbnVsbCB9LFxuICAgICAgICB3eXZlcm5LbmlnaHQ6IHsgdGlsZUNvZGU6ICdXWVZFUk5fS05JR0hUJywgbmFtZTogJ1d5dmVybiBrbmlnaHQnLCBocDogJzVEOCsxMCcsIHN0cjogJzRENis1JywgZGVmOiAnNEQ2KzMnLCBzcGQ6IDE1LCBsdWs6IDMwLCBjYW5Td2ltOiB0cnVlLCB2aWV3RGlzdGFuY2U6IDEwLCB0aWxlOiBudWxsIH0sXG4gICAgICAgIGNhb3NMb3JkOiB7IHRpbGVDb2RlOiAnQ0FPU19MT1JEJywgbmFtZTogJ0Nhb3MgTG9yZCcsIGhwOiAnNUQxMCsxMCcsIHN0cjogJzREMTArNycsIGRlZjogJzRENis1Jywgc3BkOiAxNSwgbHVrOiAzNSwgY2FuU3dpbTogdHJ1ZSwgdmlld0Rpc3RhbmNlOiAxMCwgdGlsZTogbnVsbCB9LFxuXG4gICAgICAgIHNvZGk6IHsgdGlsZUNvZGU6ICdTT0RJJywgbmFtZTogJ1NvZGknLCBocDogJzVENSsxMScsIHN0cjogJzJENiszJywgZGVmOiAnMkQ2Jywgc3BkOiAxNSwgbHVrOiA0MCwgY2FuU3dpbTogdHJ1ZSwgdmlld0Rpc3RhbmNlOiAxMCwgdGlsZTogbnVsbCB9LFxuICAgIH0sXG5cbiAgICBnZXRFbmVteTogZnVuY3Rpb24gKGNvZGU6IHN0cmluZyk6IFdvcmxkRW5lbXkge1xuICAgICAgICBpZiAoIXRoaXMuZW5lbWllc1tjb2RlXSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGVuZW15IGNvZGU6IFtcIiArIGNvZGUgKyBcIl1cIik7IH1cblxuICAgICAgICBsZXQgZW5lbXk6IEVuZW15RGVmaW5pdGlvbiA9IHRoaXMuZW5lbWllc1tjb2RlXTtcbiAgICAgICAgaWYgKCFlbmVteS50aWxlKSB7IGVuZW15LnRpbGUgPSBUaWxlc1ByZWZhYnMuRU5FTUlFU1tlbmVteS50aWxlQ29kZV07IH1cblxuICAgICAgICBsZXQgaHA6IG51bWJlciA9IFV0aWxzLnJvbGxEaWNlKGVuZW15LmhwKTtcblxuICAgICAgICBsZXQgcmV0OiBXb3JsZEVuZW15ID0ge1xuICAgICAgICAgICAgZGVmOiBlbmVteSxcbiAgICAgICAgICAgIGhwOiBbaHAsIGhwXVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxufTtcblxuZXhwb3J0IHsgRW5lbXlGYWN0b3J5LCBXb3JsZEVuZW15IH07Iiwi77u/ZGVjbGFyZSB2YXIgU3RhdHM6IGFueTtcblxuaW1wb3J0IHsgVGlsZSB9IGZyb20gJy4vZW5naW5lL1RpbGUnO1xuaW1wb3J0IHsgUmVuZGVyZXIgfSBmcm9tICcuL2VuZ2luZS9SZW5kZXJlcic7XG5pbXBvcnQgeyBDb2xvcnMsIFRpbGVzUHJlZmFicyB9IGZyb20gJy4vUHJlZmFicyc7XG5pbXBvcnQgeyBNYXAgfSBmcm9tICcuL01hcCc7XG5pbXBvcnQgeyBDb25zb2xlIH0gZnJvbSAnLi9Db25zb2xlJztcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSAnLi9VdGlscyc7XG5pbXBvcnQgeyBJdGVtRmFjdG9yeSwgV29ybGRJdGVtIH0gZnJvbSAnLi9JdGVtRmFjdG9yeSc7XG5pbXBvcnQgeyBNYWluTWVudSB9IGZyb20gJy4vTWFpbk1lbnUnO1xuaW1wb3J0IHsgSW5wdXQgfSBmcm9tICcuL2VuZ2luZS9JbnB1dCc7XG5pbXBvcnQgeyBWZWN0b3IyIH0gZnJvbSAnLi9lbmdpbmUvVmVjdG9yMic7XG5pbXBvcnQgeyBQbGF5ZXJTdGF0cyB9IGZyb20gJy4vUGxheWVyU3RhdHMnO1xuaW1wb3J0IHsgU2NlbmFyaW8gfSBmcm9tICcuL1NjZW5hcmlvJztcblxuaW50ZXJmYWNlIFBhbmVscyB7XG4gICAgbWFwOiBBcnJheTxudW1iZXI+O1xuICAgIGludmVudG9yeTogQXJyYXk8bnVtYmVyPjtcbiAgICBpdGVtRGVzYzogQXJyYXk8bnVtYmVyPjtcbn07XG5cbmNsYXNzIEdhbWUge1xuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjtcblxuICAgIHJlc29sdXRpb246IFZlY3RvcjI7XG5cbiAgICBmb250OiBIVE1MSW1hZ2VFbGVtZW50O1xuICAgIFxuICAgIG1hcDogU2NlbmFyaW87XG4gICAgbWFwczogQXJyYXk8U2NlbmFyaW8+O1xuICAgIGNvbnNvbGU6IENvbnNvbGU7XG5cbiAgICBpdGVtRGVzYzogV29ybGRJdGVtO1xuXG4gICAgZ2FtZVNlZWQ6IG51bWJlcjtcbiAgICByZXN0YXJ0R2FtZTogYm9vbGVhbjtcblxuICAgIHBhbmVsVGlsZTogVGlsZTtcbiAgICBwYW5lbHM6IFBhbmVscztcblxuICAgIHN0YXRzOiBhbnk7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlciA9IG5ldyBSZW5kZXJlcig4NTAsIDQ4MCwgPEhUTUxEaXZFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGl2R2FtZVwiKSk7XG4gICAgICAgIHRoaXMucmVzb2x1dGlvbiA9IHsgeDogODUsIHk6IDMwIH07XG5cbiAgICAgICAgdGhpcy5mb250ID0gdGhpcy5yZW5kZXJlci5zZXRGb250VGV4dHVyZSgnaW1nL2FzY2lpLXJsLWZvbnQucG5nJyk7XG4gICAgICAgIFRpbGVzUHJlZmFicy5pbml0KHRoaXMucmVuZGVyZXIpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5tYXBzID0gW107XG4gICAgICAgIHRoaXMubWFwID0gbnVsbDtcbiAgICAgICAgdGhpcy5jb25zb2xlID0gbnVsbDtcblxuICAgICAgICB0aGlzLnBhbmVsVGlsZSA9IHRoaXMucmVuZGVyZXIuZ2V0VGlsZShDb2xvcnMuREFSS19CTFVFLCBDb2xvcnMuV0hJVEUsIHt4OiAwLCB5OiAwfSk7XG4gICAgICAgIHRoaXMuaXRlbURlc2MgPSBudWxsO1xuXG4gICAgICAgIHRoaXMucmVzdGFydEdhbWUgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLnBhbmVscyA9IHtcbiAgICAgICAgICAgIG1hcDogWzAsIDIsIDYwLCAyNV0sXG4gICAgICAgICAgICBpbnZlbnRvcnk6IFs2MCwgMCwgODUsIDIwXSxcbiAgICAgICAgICAgIGl0ZW1EZXNjOiBbMTAsIDQsIDQ5LCAyMF1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmNyZWF0ZVN0YXRzKCk7XG4gICAgICAgIHRoaXMubmV3R2FtZSgpO1xuICAgIH1cblxuICAgIG5ld0dhbWUoKSB7XG4gICAgICAgIHRoaXMucmVzdGFydEdhbWUgPSBmYWxzZTtcblxuICAgICAgICBJbnB1dC5jbGVhckxpc3RlbmVycygpO1xuXG4gICAgICAgIHRoaXMuZ2FtZVNlZWQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxNTAwKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJTRUVEOiBcIiArIHRoaXMuZ2FtZVNlZWQpO1xuICAgICAgICBcbiAgICAgICAgUGxheWVyU3RhdHMuaW5pdFN0YXRzKHRoaXMpO1xuICAgICAgICBQbGF5ZXJTdGF0cy5lcXVpcG1lbnQud2VhcG9uID0gSXRlbUZhY3RvcnkuZ2V0SXRlbShcImRhZ2dlclwiKTtcbiAgICAgICAgUGxheWVyU3RhdHMuZXF1aXBtZW50LmFybW9yID0gSXRlbUZhY3RvcnkuZ2V0SXRlbShcImxlYXRoZXJBcm1vclwiKTtcblxuICAgICAgICB0aGlzLm1hcCA9IG5ldyBNYWluTWVudSh0aGlzKTtcbiAgICAgICAgdGhpcy5tYXBzID0gW107XG5cbiAgICAgICAgdGhpcy5jb25zb2xlID0gbmV3IENvbnNvbGUodGhpcyk7XG4gICAgICAgIC8vdGhpcy5jb25zb2xlLmFkZE1lc3NhZ2UoXCJIZWxsbyBhZHZlbnR1cmVyISB3ZWxsY29tZSB0byB0aGUgd29ybGQgb2YgQ2hhbXBpb25zIG9mIFJvZ3VlLlwiKTtcbiAgICAgICAgLy90aGlzLmNvbnNvbGUuYWRkTWVzc2FnZShcIlByZXNzIHRoZSBrZXlzICdRV0VBRFpYQycgdG8gbW92ZVwiLCBbMjU1LCAwLCAwXSk7XG5cbiAgICAgICAgLy90aGlzLnBsYXllclN0YXRzLnJlbmRlcih0aGlzLnJlbmRlcmVyKTtcblxuICAgICAgICB0aGlzLmxvb3BHYW1lKCk7XG4gICAgfVxuXG4gICAgY3JlYXRlU3RhdHMoKSB7XG4gICAgICAgIHRoaXMuc3RhdHMgPSBuZXcgU3RhdHMoKTtcbiAgICAgICAgdGhpcy5zdGF0cy5zaG93UGFuZWwoMSk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5zdGF0cy5kb20pO1xuICAgIH1cblxuICAgIGlzUG9pbnRJblBhbmVsKHg6IG51bWJlciwgeTogbnVtYmVyLCBwYW5lbDogQXJyYXk8bnVtYmVyPikge1xuICAgICAgICByZXR1cm4gKHggPj0gcGFuZWxbMF0gJiYgeSA+PSBwYW5lbFsxXSAmJiB4IDwgcGFuZWxbMl0gJiYgeSA8IHBhbmVsWzNdKTtcbiAgICB9XG5cbiAgICBvbk1vdXNlTW92ZSh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgICAgICBpZiAodGhpcy5pdGVtRGVzYykgcmV0dXJuO1xuXG4gICAgICAgIHggPSAoeCAvIHRoaXMucmVuZGVyZXIucGl4ZWxTaXplWzBdKSA8PCAwO1xuICAgICAgICB5ID0gKHkgLyB0aGlzLnJlbmRlcmVyLnBpeGVsU2l6ZVsxXSkgPDwgMDtcblxuICAgICAgICBpZiAodGhpcy5pc1BvaW50SW5QYW5lbCh4LCB5LCB0aGlzLnBhbmVscy5tYXApKSB7XG4gICAgICAgICAgICB0aGlzLm1hcC5vbk1vdXNlTW92ZSh4IC0gdGhpcy5wYW5lbHMubWFwWzBdLCB5IC0gdGhpcy5wYW5lbHMubWFwWzFdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubWFwLm9uTW91c2VNb3ZlKG51bGwsIG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaXNQb2ludEluUGFuZWwoeCwgeSwgdGhpcy5wYW5lbHMuaW52ZW50b3J5KSkge1xuICAgICAgICAgICAgUGxheWVyU3RhdHMub25Nb3VzZU1vdmUoeCAtIHRoaXMucGFuZWxzLmludmVudG9yeVswXSwgeSAtIHRoaXMucGFuZWxzLmludmVudG9yeVsxXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBQbGF5ZXJTdGF0cy5vbk1vdXNlTW92ZShudWxsLCBudWxsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uTW91c2VIYW5kbGVyKHg6IG51bWJlciwgeTogbnVtYmVyLCBzdGF0OiBudW1iZXIpIHtcbiAgICAgICAgeCA9ICh4IC8gdGhpcy5yZW5kZXJlci5waXhlbFNpemVbMF0pIDw8IDA7XG4gICAgICAgIHkgPSAoeSAvIHRoaXMucmVuZGVyZXIucGl4ZWxTaXplWzFdKSA8PCAwO1xuXG4gICAgICAgIGlmICh0aGlzLml0ZW1EZXNjICYmIHN0YXQgPT0gMSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNQb2ludEluUGFuZWwoeCwgeSwgdGhpcy5wYW5lbHMuaXRlbURlc2MpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkl0ZW1QYW5lbEFjdGlvbih4IC0gdGhpcy5wYW5lbHMuaXRlbURlc2NbMF0sIHkgLSB0aGlzLnBhbmVscy5pdGVtRGVzY1sxXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1EZXNjID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLm9uTW91c2VNb3ZlKHgsIHkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmlzUG9pbnRJblBhbmVsKHgsIHksIHRoaXMucGFuZWxzLm1hcCkpIHtcbiAgICAgICAgICAgIHRoaXMubWFwLm9uTW91c2VIYW5kbGVyKHggLSB0aGlzLnBhbmVscy5tYXBbMF0sIHkgLSB0aGlzLnBhbmVscy5tYXBbMV0sIHN0YXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaXNQb2ludEluUGFuZWwoeCwgeSwgdGhpcy5wYW5lbHMuaW52ZW50b3J5KSkge1xuICAgICAgICAgICAgUGxheWVyU3RhdHMub25Nb3VzZUhhbmRsZXIoeCAtIHRoaXMucGFuZWxzLmludmVudG9yeVswXSwgeSAtIHRoaXMucGFuZWxzLmludmVudG9yeVsxXSwgc3RhdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkl0ZW1QYW5lbEFjdGlvbih4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgICAgICBpZiAoeSAhPSAxNCkgcmV0dXJuO1xuXG4gICAgICAgIGlmICh4ID49IDIgJiYgeCA8IDEzKSB7XG4gICAgICAgICAgICBQbGF5ZXJTdGF0cy51c2VJdGVtKHRoaXMuaXRlbURlc2MpO1xuICAgICAgICB9IGVsc2UgaWYgKHggPj0gMjYgJiYgeCA8IDM3KSB7XG4gICAgICAgICAgICBQbGF5ZXJTdGF0cy5kcm9wSXRlbSh0aGlzLml0ZW1EZXNjKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdvdG9MZXZlbChsZXZlbDogbnVtYmVyLCBkaXI6IG51bWJlcikge1xuICAgICAgICBsZXQgbWFwOiBNYXAgPSA8TWFwPnRoaXMubWFwO1xuICAgICAgICBtYXAuYWN0aXZlID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKHRoaXMubWFwc1tsZXZlbCAtIDFdKSB7XG4gICAgICAgICAgICB0aGlzLm1hcCA9IHRoaXMubWFwc1tsZXZlbCAtIDFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tYXAgPSBuZXcgTWFwKHRoaXMsIGxldmVsKTtcbiAgICAgICAgICAgIHRoaXMubWFwc1tsZXZlbCAtIDFdID0gdGhpcy5tYXA7XG4gICAgICAgIH1cblxuICAgICAgICBtYXAuYWN0aXZlID0gdHJ1ZTtcblxuICAgICAgICBpZiAoZGlyID09IDEpIHtcbiAgICAgICAgICAgIG1hcC5wbGF5ZXIueCA9IG1hcC5zdGFpcnNVcC54O1xuICAgICAgICAgICAgbWFwLnBsYXllci55ID0gbWFwLnN0YWlyc1VwLnk7XG4gICAgICAgICAgICBtYXAuc3RhaXJzVXAucGxheWVyT25UaWxlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChkaXIgPT0gMCkge1xuICAgICAgICAgICAgbWFwLnBsYXllci54ID0gbWFwLnN0YWlyc0Rvd24ueDtcbiAgICAgICAgICAgIG1hcC5wbGF5ZXIueSA9IG1hcC5zdGFpcnNEb3duLnk7XG4gICAgICAgICAgICBtYXAuc3RhaXJzRG93bi5wbGF5ZXJPblRpbGUgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgUGxheWVyU3RhdHMucmVuZGVyKHRoaXMucmVuZGVyZXIpO1xuICAgICAgICB0aGlzLmNvbnNvbGUucmVuZGVyKCk7XG4gICAgfVxuXG4gICAgcmVuZGVySXRlbVBhbmVsKCkge1xuICAgICAgICBpZiAoIXRoaXMuaXRlbURlc2MpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgZm9yICh2YXIgeCA9IDEwOyB4IDwgNDk7IHgrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgeSA9IDQ7IHkgPCAyMDsgeSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5wbG90KHgsIHksIHRoaXMucGFuZWxUaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBtc2c6IHN0cmluZyA9IHRoaXMuaXRlbURlc2MuZGVmLmRlc2M7XG4gICAgICAgIGxldCBmb3JtYXR0ZWQ6IEFycmF5PHN0cmluZz4gPSBVdGlscy5mb3JtYXRUZXh0KG1zZywgMzgpO1xuXG4gICAgICAgIHZhciB0aXRsZSA9IHRoaXMuaXRlbURlc2MuZGVmLm5hbWUgKyAoKHRoaXMuaXRlbURlc2MuYW1vdW50ID4gMSkgPyBcIiAoeFwiICsgdGhpcy5pdGVtRGVzYy5hbW91bnQgKyBcIilcIiA6IFwiXCIpO1xuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHRoaXMucmVuZGVyZXIsICgzMCAtIHRpdGxlLmxlbmd0aCAvIDIpIDw8IDAsIDUsIHRpdGxlLCBDb2xvcnMuV0hJVEUsIENvbG9ycy5EQVJLX0JMVUUpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBtOiBzdHJpbmc7IG0gPSBmb3JtYXR0ZWRbaV07IGkrKykge1xuICAgICAgICAgICAgVXRpbHMucmVuZGVyVGV4dCh0aGlzLnJlbmRlcmVyLCAxMSwgNyArIGksIG0sIENvbG9ycy5XSElURSwgQ29sb3JzLkRBUktfQkxVRSk7XG4gICAgICAgIH1cblxuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHRoaXMucmVuZGVyZXIsIDEyLCAxOCwgXCIgICAgVVNFICAgIFwiLCBDb2xvcnMuV0hJVEUsIENvbG9ycy5CTFVFKTtcbiAgICAgICAgLy9VdGlscy5yZW5kZXJUZXh0KHRoaXMucmVuZGVyZXIsIDI0LCAxOCwgXCIgICBUSFJPVyAgIFwiLCBDb2xvcnMuV0hJVEUsIENvbG9ycy5CTFVFKTtcbiAgICAgICAgVXRpbHMucmVuZGVyVGV4dCh0aGlzLnJlbmRlcmVyLCAzNiwgMTgsIFwiICAgRFJPUCAgICBcIiwgQ29sb3JzLldISVRFLCBDb2xvcnMuQkxVRSk7XG4gICAgfVxuXG4gICAgbG9vcEdhbWUoKSB7XG4gICAgICAgIHRoaXMuc3RhdHMuYmVnaW4oKTtcblxuICAgICAgICBpZiAodGhpcy5yZW5kZXJlci5mb250UmVhZHkpIHtcbiAgICAgICAgICAgIHRoaXMubWFwLnJlbmRlcigpO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJJdGVtUGFuZWwoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIucmVuZGVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0YXRzLmVuZCgpO1xuXG4gICAgICAgIGlmICh0aGlzLnJlc3RhcnRHYW1lKSB7XG4gICAgICAgICAgICB0aGlzLm5ld0dhbWUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7IHRoaXMubG9vcEdhbWUoKTsgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7IEdhbWUgfTsiLCLvu79pbXBvcnQgeyBUaWxlUHJlZmFiIH0gZnJvbSAnLi9QcmVmYWJzJztcclxuaW1wb3J0IHsgTWFwIH0gZnJvbSAnLi9NYXAnO1xyXG5cclxuYWJzdHJhY3QgY2xhc3MgSW5zdGFuY2Uge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG5cclxuICAgIGRlc3Ryb3k6IGJvb2xlYW47XHJcbiAgICBkaXNjb3ZlcmVkOiBib29sZWFuO1xyXG4gICAgaW5TaGFkb3c6IGJvb2xlYW47XHJcbiAgICBzdG9wT25EaXNjb3ZlcjogYm9vbGVhbjtcclxuICAgIHZpc2libGVJblNoYWRvdzogYm9vbGVhbjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgeDogbnVtYmVyLCBwdWJsaWMgeTogbnVtYmVyLCBwdWJsaWMgbWFwOiBNYXAsIHB1YmxpYyB0aWxlOiBUaWxlUHJlZmFiKSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gJyc7XHJcbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kaXNjb3ZlcmVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5pblNoYWRvdyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuc3RvcE9uRGlzY292ZXIgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnZpc2libGVJblNoYWRvdyA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIG1vdmVUbyh4VG86IG51bWJlciwgeVRvOiBudW1iZXIpOiBib29sZWFuIHtcclxuICAgICAgICB0aGlzLnggKz0geFRvO1xyXG4gICAgICAgIHRoaXMueSArPSB5VG87XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICB1cGRhdGUoKSB7fVxyXG59XHJcblxyXG5leHBvcnQgeyBJbnN0YW5jZSB9OyIsIu+7v2ltcG9ydCB7IFBsYXllclN0YXRzIH0gZnJvbSAnLi9QbGF5ZXJTdGF0cyc7XG5pbXBvcnQgeyBXb3JsZEl0ZW0sIEl0ZW1UeXBlcyB9IGZyb20gJy4vSXRlbUZhY3RvcnknO1xuaW1wb3J0IHsgSW5zdGFuY2UgfSBmcm9tICcuL0luc3RhbmNlJztcbmltcG9ydCB7IE1hcCB9IGZyb20gJy4vTWFwJztcbmltcG9ydCB7IFZlY3RvcjIgfSBmcm9tICcuL2VuZ2luZS9WZWN0b3IyJztcblxuY2xhc3MgSXRlbSBleHRlbmRzIEluc3RhbmNlIHtcbiAgICBwbGF5ZXJPblRpbGU6IGJvb2xlYW47XG5cbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlciwgbWFwOiBNYXAsIHB1YmxpYyBpdGVtOiBXb3JsZEl0ZW0pIHtcbiAgICAgICAgc3VwZXIoeCwgeSwgbWFwLCBpdGVtLmRlZi50aWxlKTtcblxuICAgICAgICB0aGlzLm5hbWUgPSBpdGVtLmRlZi5uYW1lO1xuXG4gICAgICAgIGlmIChpdGVtLmRlZi50eXBlID09IEl0ZW1UeXBlcy5HT0xEKSB7XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBpdGVtLmRlZi5kZXNjLnJlcGxhY2UoL1gvZywgaXRlbS5hbW91bnQudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICBpZiAoaXRlbS5hbW91bnQgPiAxKSB7IHRoaXMubmFtZSArPSBcInNcIjsgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wbGF5ZXJPblRpbGUgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmRpc2NvdmVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pblNoYWRvdyA9IHRydWU7XG4gICAgICAgIHRoaXMuc3RvcE9uRGlzY292ZXIgPSB0cnVlO1xuICAgIH1cblxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXRlbS5kZWYuZGlzY292ZXJlZCkge1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gdGhpcy5pdGVtLmRlZi5uYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pblNoYWRvdyA9IHRydWU7XG5cbiAgICAgICAgdmFyIHAgPSB0aGlzLm1hcC5wbGF5ZXI7XG4gICAgICAgIGlmIChwLnggPT0gdGhpcy54ICYmIHAueSA9PSB0aGlzLnkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5wbGF5ZXJPblRpbGUgJiYgIXAubW92ZVBhdGggJiYgUGxheWVyU3RhdHMucGlja0l0ZW0odGhpcy5pdGVtKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnBsYXllck9uVGlsZSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5wbGF5ZXJPblRpbGUpIHtcbiAgICAgICAgICAgIHRoaXMucGxheWVyT25UaWxlID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5tYXAubWFwW3RoaXMueV1bdGhpcy54XS52aXNpYmxlID09IDIpIHtcbiAgICAgICAgICAgIHRoaXMuaW5TaGFkb3cgPSBmYWxzZTtcbiAgICAgICAgICAgIGxldCBtcDogVmVjdG9yMiA9IHRoaXMubWFwLm1vdXNlUG9zaXRpb247XG4gICAgICAgICAgICBpZiAobXAueCA9PSB0aGlzLnggJiYgbXAueSA9PSB0aGlzLnkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1hcC50aWxlRGVzY3JpcHRpb24gPSB0aGlzLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXAubWFwW3RoaXMueV1bdGhpcy54XS52aXNpYmxlIDw9IDEpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzY292ZXJlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgeyBJdGVtIH07Iiwi77u/aW1wb3J0IHsgVXRpbHMgfSBmcm9tICcuL1V0aWxzJztcblxuZW51bSBJbnN0cnVjdGlvbnMge1xuICAgIExJVEVSQUwgPSAweDAwLFxuICAgIERJQ0UgPSAweDAxLFxuICAgIFNVTSA9IDB4MDIsXG4gICAgU1RPUkVfVkFMID0gMHgwMyxcbiAgICBHRVRfSU5TVEFOQ0VfVVNFX05BTUUgPSAweDA0LFxuICAgIEdFVF9JTlNUQU5DRV9IRUFMVEggPSAweDA1LFxuICAgIEdFVF9JTlNUQU5DRV9GVUxMX0hFQUxUSCA9IDB4MDYsXG4gICAgU0VUX0lOU1RBTkNFX0hFQUxUSCA9IDB4MDcsXG4gICAgQUREX0lOU1RBTkNFX1NUQVRVUyA9IDB4MDgsXG4gICAgUkVNT1ZFX0lOU1RBTkNFX1NUQVRVUyA9IDB4MDksXG4gICAgQk9PU1RfSU5TVEFOQ0VfU1RBVCA9IDB4MEEsXG4gICAgUkVUVVJOX01TRyA9IDB4MEJcbn07XG5cbmxldCBJdGVtRWZmZWN0cyA9IHtcbiAgICBleGVjdXRlQ29tbWFuZDogZnVuY3Rpb24gKGNvbW1hbmQ6IGFueSwgcGFyYW1zOiBhbnkpIHtcbiAgICAgICAgbGV0IGNvcHk6IGFueSA9IGNvbW1hbmQuc2xpY2UoMCwgY29tbWFuZC5sZW5ndGgpLFxuICAgICAgICAgICAgc3RhY2s6IEFycmF5PGFueT4gPSBbXSxcbiAgICAgICAgICAgIHN0b3JlZFZhbHM6IEFycmF5PGFueT4gPSBbXSxcbiAgICAgICAgICAgIGluczogSW5zdHJ1Y3Rpb25zLCBtc2c6IHN0cmluZyA9IFwiXCI7XG5cbiAgICAgICAgd2hpbGUgKGNvcHkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaW5zID0gY29weS5zaGlmdCgpO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGlucykge1xuICAgICAgICAgICAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLkxJVEVSQUw6XG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goY29weS5zaGlmdCgpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIEluc3RydWN0aW9ucy5ESUNFOlxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKFV0aWxzLnJvbGxEaWNlKGNvcHkuc2hpZnQoKSkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgSW5zdHJ1Y3Rpb25zLlNVTTpcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaChzdGFjay5wb3AoKSArIHN0YWNrLnBvcCgpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIEluc3RydWN0aW9ucy5TVE9SRV9WQUw6XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFZhbHMucHVzaChzdGFja1tzdGFjay5sZW5ndGggLSAxXSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuR0VUX0lOU1RBTkNFX1VTRV9OQU1FOlxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHBhcmFtcy5pbnN0YW5jZS51c2VOYW1lIHx8IHBhcmFtcy5pbnN0YW5jZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIEluc3RydWN0aW9ucy5HRVRfSU5TVEFOQ0VfSEVBTFRIOlxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHBhcmFtcy5pbnN0YW5jZS5ocFswXSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuR0VUX0lOU1RBTkNFX0ZVTExfSEVBTFRIOlxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHBhcmFtcy5pbnN0YW5jZS5ocFsxXSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuU0VUX0lOU1RBTkNFX0hFQUxUSDpcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zLmluc3RhbmNlLmhwWzBdID0gTWF0aC5taW4oc3RhY2sucG9wKCksIHBhcmFtcy5pbnN0YW5jZS5ocFsxXSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuQUREX0lOU1RBTkNFX1NUQVRVUzpcbiAgICAgICAgICAgICAgICAgICAgdmFyIHR5cGUgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gc3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHN0YWNrLnBvcCgpIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIHN0OyBzdCA9IHBhcmFtcy5pbnN0YW5jZS5zdGF0dXNbaV07IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0LnR5cGUgPT0gdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gTWF0aC5tYXgoZHVyYXRpb24sIHN0LmR1cmF0aW9uWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdC5kdXJhdGlvbiA9IFtkdXJhdGlvbiwgZHVyYXRpb25dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpID0gcGFyYW1zLmluc3RhbmNlLnN0YXR1cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXMuaW5zdGFuY2Uuc3RhdHVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IFtkdXJhdGlvbiwgZHVyYXRpb25dLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIEluc3RydWN0aW9ucy5SRU1PVkVfSU5TVEFOQ0VfU1RBVFVTOlxuICAgICAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgc3Q6YW55OyBzdCA9IHBhcmFtcy5pbnN0YW5jZS5zdGF0dXNbaV07IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0LnR5cGUgPT0gdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtcy5pbnN0YW5jZS5zdGF0dXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuQk9PU1RfSU5TVEFOQ0VfU1RBVDpcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbCA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhdCA9IHN0YWNrLnBvcCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcy5pbnN0YW5jZVtzdGF0XSArPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBJbnN0cnVjdGlvbnMuUkVUVVJOX01TRzpcbiAgICAgICAgICAgICAgICAgICAgbXNnID0gY29weS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBtc2cgPSBtc2cucmVwbGFjZSgvXFwlc1swLTldKy9nLCBmdW5jdGlvbiAobSwgdikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZCA9IHBhcnNlSW50KG0ucmVwbGFjZShcIiVzXCIsIFwiXCIpLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmVkVmFsc1tpbmRdIHx8IG07XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1zZztcbiAgICB9LFxuXG4gICAgaXRlbXM6IHtcbiAgICAgICAgaHBQb3Rpb246IFtJbnN0cnVjdGlvbnMuR0VUX0lOU1RBTkNFX1VTRV9OQU1FLCBJbnN0cnVjdGlvbnMuU1RPUkVfVkFMLCBJbnN0cnVjdGlvbnMuR0VUX0lOU1RBTkNFX0hFQUxUSCwgSW5zdHJ1Y3Rpb25zLkRJQ0UsICcyRDEwKzEwJywgSW5zdHJ1Y3Rpb25zLlNUT1JFX1ZBTCwgSW5zdHJ1Y3Rpb25zLlNVTSwgSW5zdHJ1Y3Rpb25zLlNFVF9JTlNUQU5DRV9IRUFMVEgsIEluc3RydWN0aW9ucy5SRVRVUk5fTVNHLCBcIiVzMCByZWNvdmVyZWQgJXMxIGhlYWx0aCBwb2ludHMuXCJdLFxuICAgICAgICBsaWZlUG90aW9uOiBbSW5zdHJ1Y3Rpb25zLkdFVF9JTlNUQU5DRV9VU0VfTkFNRSwgSW5zdHJ1Y3Rpb25zLlNUT1JFX1ZBTCwgSW5zdHJ1Y3Rpb25zLkdFVF9JTlNUQU5DRV9GVUxMX0hFQUxUSCwgSW5zdHJ1Y3Rpb25zLlNFVF9JTlNUQU5DRV9IRUFMVEgsIEluc3RydWN0aW9ucy5SRVRVUk5fTVNHLCBcIiVzMCByZWNvdmVyZWQgYWxsIGhlYWx0aCBwb2ludHMuXCJdLFxuICAgICAgICBwb2lzb25Qb3Rpb246IFtJbnN0cnVjdGlvbnMuTElURVJBTCwgJzFEMycsIEluc3RydWN0aW9ucy5MSVRFUkFMLCAxMCwgSW5zdHJ1Y3Rpb25zLkxJVEVSQUwsICdwb2lzb24nLCBJbnN0cnVjdGlvbnMuQUREX0lOU1RBTkNFX1NUQVRVUywgSW5zdHJ1Y3Rpb25zLkdFVF9JTlNUQU5DRV9VU0VfTkFNRSwgSW5zdHJ1Y3Rpb25zLlNUT1JFX1ZBTCwgSW5zdHJ1Y3Rpb25zLlJFVFVSTl9NU0csIFwiJXMwIGFyZSBwb2lzb25lZFwiXSxcbiAgICAgICAgYmxpbmRQb3Rpb246IFtJbnN0cnVjdGlvbnMuRElDRSwgJzJEOCsxNScsIEluc3RydWN0aW9ucy5MSVRFUkFMLCAnYmxpbmQnLCBJbnN0cnVjdGlvbnMuQUREX0lOU1RBTkNFX1NUQVRVUywgSW5zdHJ1Y3Rpb25zLkdFVF9JTlNUQU5DRV9VU0VfTkFNRSwgSW5zdHJ1Y3Rpb25zLlNUT1JFX1ZBTCwgSW5zdHJ1Y3Rpb25zLlJFVFVSTl9NU0csIFwiJXMwIGFyZSBibGluZGVkXCJdLFxuICAgICAgICBwYXJhbHlzaXNQb3Rpb246IFtJbnN0cnVjdGlvbnMuRElDRSwgJzFEMTArMTAnLCBJbnN0cnVjdGlvbnMuTElURVJBTCwgJ3BhcmFseXNpcycsIEluc3RydWN0aW9ucy5BRERfSU5TVEFOQ0VfU1RBVFVTLCBJbnN0cnVjdGlvbnMuR0VUX0lOU1RBTkNFX1VTRV9OQU1FLCBJbnN0cnVjdGlvbnMuU1RPUkVfVkFMLCBJbnN0cnVjdGlvbnMuUkVUVVJOX01TRywgXCIlczAgYXJlIHBhcmFseXplZFwiXSxcbiAgICAgICAgaW52aXNpYmlsaXR5UG90aW9uOiBbSW5zdHJ1Y3Rpb25zLkRJQ0UsICczRDEwKzE1JywgSW5zdHJ1Y3Rpb25zLkxJVEVSQUwsICdpbnZpc2libGUnLCBJbnN0cnVjdGlvbnMuQUREX0lOU1RBTkNFX1NUQVRVUywgSW5zdHJ1Y3Rpb25zLkdFVF9JTlNUQU5DRV9VU0VfTkFNRSwgSW5zdHJ1Y3Rpb25zLlNUT1JFX1ZBTCwgSW5zdHJ1Y3Rpb25zLlJFVFVSTl9NU0csIFwiJXMwIGFyZSBpbnZpc2libGVcIl0sXG4gICAgICAgIGN1cmVQb3Rpb246IFtJbnN0cnVjdGlvbnMuTElURVJBTCwgJ3BvaXNvbicsIEluc3RydWN0aW9ucy5SRU1PVkVfSU5TVEFOQ0VfU1RBVFVTLCBJbnN0cnVjdGlvbnMuTElURVJBTCwgJ2JsaW5kJywgSW5zdHJ1Y3Rpb25zLlJFTU9WRV9JTlNUQU5DRV9TVEFUVVMsIEluc3RydWN0aW9ucy5MSVRFUkFMLCAncGFyYWx5c2lzJywgSW5zdHJ1Y3Rpb25zLlJFTU9WRV9JTlNUQU5DRV9TVEFUVVMsIEluc3RydWN0aW9ucy5SRVRVUk5fTVNHLCBcIlN0YXR1cyBjdXJlZFwiXSxcbiAgICAgICAgc3RyZW5ndGhQb3Rpb246IFtJbnN0cnVjdGlvbnMuTElURVJBTCwgJ3N0ckFkZCcsIEluc3RydWN0aW9ucy5MSVRFUkFMLCAyLCBJbnN0cnVjdGlvbnMuQk9PU1RfSU5TVEFOQ0VfU1RBVCwgSW5zdHJ1Y3Rpb25zLlJFVFVSTl9NU0csIFwiU3RyZW5ndGggKzJcIl0sXG4gICAgICAgIGRlZmVuc2VQb3Rpb246IFtJbnN0cnVjdGlvbnMuTElURVJBTCwgJ2RlZkFkZCcsIEluc3RydWN0aW9ucy5MSVRFUkFMLCAxLCBJbnN0cnVjdGlvbnMuQk9PU1RfSU5TVEFOQ0VfU1RBVCwgSW5zdHJ1Y3Rpb25zLlJFVFVSTl9NU0csIFwiRGVmZW5zZSArMVwiXSxcbiAgICAgICAgc3BlZWRQb3Rpb246IFtJbnN0cnVjdGlvbnMuTElURVJBTCwgJ3NwZCcsIEluc3RydWN0aW9ucy5MSVRFUkFMLCAxLCBJbnN0cnVjdGlvbnMuQk9PU1RfSU5TVEFOQ0VfU1RBVCwgSW5zdHJ1Y3Rpb25zLlJFVFVSTl9NU0csIFwiU3BlZWQgKzFcIl1cbiAgICB9XG59O1xuXG5leHBvcnQgeyBJdGVtRWZmZWN0cyB9OyIsIu+7v2ltcG9ydCB7IFRpbGVQcmVmYWIsIFRpbGVzUHJlZmFicyB9IGZyb20gJy4vUHJlZmFicyc7XG5pbXBvcnQgeyBJdGVtRWZmZWN0cyB9IGZyb20gJy4vSXRlbUVmZmVjdHMnO1xuaW1wb3J0IHsgVGlsZSB9IGZyb20gJy4vZW5naW5lL1RpbGUnO1xuaW1wb3J0IHsgSW5zdGFuY2UgfSBmcm9tICcuL0luc3RhbmNlJztcblxuZW51bSBJdGVtVHlwZXMge1xuICAgIFBPVElPTiA9IDAsXG4gICAgR09MRCA9IDEsXG4gICAgV0VBUE9OID0gMixcbiAgICBBUk1PUiA9IDNcbn07XG5cbmludGVyZmFjZSBJdGVtRGVmaW5pdGlvbiB7XG4gICAgY29kZTogc3RyaW5nLFxuICAgIHRpbGVDb2RlOiBzdHJpbmcsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHRpbGU6IFRpbGVQcmVmYWIsXG4gICAgdHlwZTogSXRlbVR5cGVzLFxuICAgIGRlc2M6IHN0cmluZyxcbiAgICBkaXNjb3ZlcmVkOiBib29sZWFuLFxuICAgIHN0YWNrYWJsZTogYm9vbGVhbixcbiAgICBzdHI6IHN0cmluZyxcbiAgICBkZWY6IHN0cmluZyxcbiAgICB3ZWFyOiBzdHJpbmcsXG4gICAgZWZmZWN0OiBhbnlcbn07XG5cbmludGVyZmFjZSBXb3JsZEl0ZW0ge1xuICAgIGRlZjogSXRlbURlZmluaXRpb24sXG4gICAgYW1vdW50OiBudW1iZXIsXG4gICAgc3RhdHVzOiBudW1iZXJcbn07XG5cbmludGVyZmFjZSBQb3Rpb25EZWZpbml0aW9uIHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZGVzYzogc3RyaW5nLFxuICAgIGVmZmVjdDogYW55XG59O1xuXG5sZXQgSXRlbUZhY3RvcnkgPSB7XG4gICAgaXRlbXM6IHtcbiAgICAgICAgcmVkUG90aW9uOiA8SXRlbURlZmluaXRpb24+eyB0aWxlQ29kZTogJ1JFRF9QT1RJT04nLCBuYW1lOiAnUmVkIHBvdGlvbicsIHRpbGU6IG51bGwsIHR5cGU6IEl0ZW1UeXBlcy5QT1RJT04sIGRlc2M6ICdSZWQgcG90aW9uLCB1bmtub3duIGVmZmVjdCcsIGRpc2NvdmVyZWQ6IGZhbHNlLCBzdGFja2FibGU6IHRydWUgfSxcbiAgICAgICAgZ3JlZW5Qb3Rpb246IDxJdGVtRGVmaW5pdGlvbj57IHRpbGVDb2RlOiAnR1JFRU5fUE9USU9OJywgbmFtZTogJ0dyZWVuIHBvdGlvbicsIHRpbGU6IG51bGwsIHR5cGU6IEl0ZW1UeXBlcy5QT1RJT04sIGRlc2M6ICdHcmVlbiBwb3Rpb24sIHVua25vd24gZWZmZWN0JywgZGlzY292ZXJlZDogZmFsc2UsIHN0YWNrYWJsZTogdHJ1ZSB9LFxuICAgICAgICBibHVlUG90aW9uOiA8SXRlbURlZmluaXRpb24+eyB0aWxlQ29kZTogJ0JMVUVfUE9USU9OJywgbmFtZTogJ0JsdWUgcG90aW9uJywgdGlsZTogbnVsbCwgdHlwZTogSXRlbVR5cGVzLlBPVElPTiwgZGVzYzogJ0JsdWUgcG90aW9uLCB1bmtub3duIGVmZmVjdCcsIGRpc2NvdmVyZWQ6IGZhbHNlLCBzdGFja2FibGU6IHRydWUgfSxcbiAgICAgICAgeWVsbG93UG90aW9uOiA8SXRlbURlZmluaXRpb24+eyB0aWxlQ29kZTogJ1lFTExPV19QT1RJT04nLCBuYW1lOiAnWWVsbG93IHBvdGlvbicsIHRpbGU6IG51bGwsIHR5cGU6IEl0ZW1UeXBlcy5QT1RJT04sIGRlc2M6ICdZZWxsb3cgcG90aW9uLCB1bmtub3duIGVmZmVjdCcsIGRpc2NvdmVyZWQ6IGZhbHNlLCBzdGFja2FibGU6IHRydWUgfSxcbiAgICAgICAgYXF1YVBvdGlvbjogPEl0ZW1EZWZpbml0aW9uPnsgdGlsZUNvZGU6ICdBUVVBX1BPVElPTicsIG5hbWU6ICdBcXVhIHBvdGlvbicsIHRpbGU6IG51bGwsIHR5cGU6IEl0ZW1UeXBlcy5QT1RJT04sIGRlc2M6ICdBcXVhIHBvdGlvbiwgdW5rbm93biBlZmZlY3QnLCBkaXNjb3ZlcmVkOiBmYWxzZSwgc3RhY2thYmxlOiB0cnVlIH0sXG4gICAgICAgIHB1cnBsZVBvdGlvbjogPEl0ZW1EZWZpbml0aW9uPnsgdGlsZUNvZGU6ICdQVVJQTEVfUE9USU9OJywgbmFtZTogJ1B1cnBsZSBwb3Rpb24nLCB0aWxlOiBudWxsLCB0eXBlOiBJdGVtVHlwZXMuUE9USU9OLCBkZXNjOiAnUHVycGxlIHBvdGlvbiwgdW5rbm93biBlZmZlY3QnLCBkaXNjb3ZlcmVkOiBmYWxzZSwgc3RhY2thYmxlOiB0cnVlIH0sXG4gICAgICAgIHdoaXRlUG90aW9uOiA8SXRlbURlZmluaXRpb24+eyB0aWxlQ29kZTogJ1dISVRFX1BPVElPTicsIG5hbWU6ICdXaGl0ZSBwb3Rpb24nLCB0aWxlOiBudWxsLCB0eXBlOiBJdGVtVHlwZXMuUE9USU9OLCBkZXNjOiAnV2hpdGUgcG90aW9uLCB1bmtub3duIGVmZmVjdCcsIGRpc2NvdmVyZWQ6IGZhbHNlLCBzdGFja2FibGU6IHRydWUgfSxcbiAgICAgICAgdGFuUG90aW9uOiA8SXRlbURlZmluaXRpb24+eyB0aWxlQ29kZTogJ1RBTl9QT1RJT04nLCBuYW1lOiAnVGFuIHBvdGlvbicsIHRpbGU6IG51bGwsIHR5cGU6IEl0ZW1UeXBlcy5QT1RJT04sIGRlc2M6ICdUYW4gcG90aW9uLCB1bmtub3duIGVmZmVjdCcsIGRpc2NvdmVyZWQ6IGZhbHNlLCBzdGFja2FibGU6IHRydWUgfSxcbiAgICAgICAgb3JhbmdlUG90aW9uOiA8SXRlbURlZmluaXRpb24+eyB0aWxlQ29kZTogJ09SQU5HRV9QT1RJT04nLCBuYW1lOiAnT3JhbmdlIHBvdGlvbicsIHRpbGU6IG51bGwsIHR5cGU6IEl0ZW1UeXBlcy5QT1RJT04sIGRlc2M6ICdPcmFuZ2UgcG90aW9uLCB1bmtub3duIGVmZmVjdCcsIGRpc2NvdmVyZWQ6IGZhbHNlLCBzdGFja2FibGU6IHRydWUgfSxcblxuICAgICAgICBnb2xkOiA8SXRlbURlZmluaXRpb24+eyB0aWxlQ29kZTogJ0dPTEQnLCBuYW1lOiAnR29sZCBwaWVjZScsIHRpbGU6IG51bGwsIHR5cGU6IEl0ZW1UeXBlcy5HT0xELCBkZXNjOiAnWCBHb2xkIHBpZWNlJywgc3RhY2thYmxlOiB0cnVlIH0sXG5cbiAgICAgICAgZGFnZ2VyOiA8SXRlbURlZmluaXRpb24+eyB0aWxlQ29kZTogJ0RBR0dFUicsIG5hbWU6ICdEYWdnZXInLCB0aWxlOiBudWxsLCB0eXBlOiBJdGVtVHlwZXMuV0VBUE9OLCBkZXNjOiAnU3RhbmRhcmQgaXJvbiBkYWdnZXIsIGVhc3kgdG8gaGFuZGxlLicsIHN0cjogJzNENScsIHdlYXI6ICcxRDYnIH0sXG4gICAgICAgIHNob3J0U3dvcmQ6IDxJdGVtRGVmaW5pdGlvbj57IHRpbGVDb2RlOiAnU1dPUkQnLCBuYW1lOiAnU2hvcnQgc3dvcmQnLCB0aWxlOiBudWxsLCB0eXBlOiBJdGVtVHlwZXMuV0VBUE9OLCBkZXNjOiAnUGVuZGluZyBkZXNjcmlwdGlvbicsIHN0cjogJzNENicsIHdlYXI6ICcxRDQnIH0sXG4gICAgICAgIGxvbmdTd29yZDogPEl0ZW1EZWZpbml0aW9uPnsgdGlsZUNvZGU6ICdMT05HX1NXT1JEJywgbmFtZTogJ0xvbmcgc3dvcmQnLCB0aWxlOiBudWxsLCB0eXBlOiBJdGVtVHlwZXMuV0VBUE9OLCBkZXNjOiAnUGVuZGluZyBkZXNjcmlwdGlvbicsIHN0cjogJzNEMTAnLCB3ZWFyOiAnMUQ1JyB9LFxuICAgICAgICBtYWNlOiA8SXRlbURlZmluaXRpb24+eyB0aWxlQ29kZTogJ01BQ0UnLCBuYW1lOiAnTWFjZScsIHRpbGU6IG51bGwsIHR5cGU6IEl0ZW1UeXBlcy5XRUFQT04sIGRlc2M6ICdQZW5kaW5nIGRlc2NyaXB0aW9uJywgc3RyOiAnNEQ4Jywgd2VhcjogJzFENicgfSxcbiAgICAgICAgc3BlYXI6IDxJdGVtRGVmaW5pdGlvbj57IHRpbGVDb2RlOiAnU1BFQVInLCBuYW1lOiAnU3BlYXInLCB0aWxlOiBudWxsLCB0eXBlOiBJdGVtVHlwZXMuV0VBUE9OLCBkZXNjOiAnUGVuZGluZyBkZXNjcmlwdGlvbicsIHN0cjogJzNEOCcsIHdlYXI6ICcxRDQnIH0sXG4gICAgICAgIGF4ZTogPEl0ZW1EZWZpbml0aW9uPnsgdGlsZUNvZGU6ICdBWEUnLCBuYW1lOiAnQmF0dGxlIGF4ZScsIHRpbGU6IG51bGwsIHR5cGU6IEl0ZW1UeXBlcy5XRUFQT04sIGRlc2M6ICdQZW5kaW5nIGRlc2NyaXB0aW9uJywgc3RyOiAnNUQ1Jywgd2VhcjogJzFENCcgfSxcblxuICAgICAgICBsZWF0aGVyQXJtb3I6IDxJdGVtRGVmaW5pdGlvbj57IHRpbGVDb2RlOiAnTEVBVEhFUl9BUk1PUicsIG5hbWU6ICdMZWF0aGVyIGFybW9yJywgdGlsZTogbnVsbCwgdHlwZTogSXRlbVR5cGVzLkFSTU9SLCBkZXNjOiAnSXRcXCdzIGxpZ2h0IGFuZCBicmluZ3MgbWVkaXVtIHByb3RlY3Rpb24uJywgZGVmOiAnMkQ2Jywgd2VhcjogJzFENScgfSxcbiAgICAgICAgc2NhbGVNYWlsOiA8SXRlbURlZmluaXRpb24+eyB0aWxlQ29kZTogJ1NDQUxFX01BSUwnLCBuYW1lOiAnU2NhbGUgbWFpbCcsIHRpbGU6IG51bGwsIHR5cGU6IEl0ZW1UeXBlcy5BUk1PUiwgZGVzYzogJ1BlbmRpbmcgZGVzY3JpcHRpb24nLCBkZWY6ICczRDYnLCB3ZWFyOiAnMUQ1JyB9LFxuICAgICAgICBjaGFpbk1haWw6IDxJdGVtRGVmaW5pdGlvbj57IHRpbGVDb2RlOiAnQ0hBSU5fTUFJTCcsIG5hbWU6ICdDaGFpbiBtYWlsJywgdGlsZTogbnVsbCwgdHlwZTogSXRlbVR5cGVzLkFSTU9SLCBkZXNjOiAnUGVuZGluZyBkZXNjcmlwdGlvbicsIGRlZjogJzNEOCcsIHdlYXI6ICcxRDQnIH0sXG4gICAgICAgIHBsYXRlQXJtb3I6IDxJdGVtRGVmaW5pdGlvbj57IHRpbGVDb2RlOiAnUExBVEVfQVJNT1InLCBuYW1lOiAnUGxhdGUgYXJtb3InLCB0aWxlOiBudWxsLCB0eXBlOiBJdGVtVHlwZXMuQVJNT1IsIGRlc2M6ICdQZW5kaW5nIGRlc2NyaXB0aW9uJywgZGVmOiAnNEQ4Jywgd2VhcjogJzFEMycgfVxuICAgIH0sXG5cbiAgICBwb3Rpb25zOiA8QXJyYXk8UG90aW9uRGVmaW5pdGlvbj4+W1xuICAgICAgICB7IG5hbWU6ICdIZWFsdGggUG90aW9uJywgZGVzYzogJ1Jlc3RvcmVzIDJEMTArMTAgaGVhbHRoIHBvaW50cyB3aGVuIGRyaW5rLicsIGVmZmVjdDogSXRlbUVmZmVjdHMuaXRlbXMuaHBQb3Rpb24gfSxcbiAgICAgICAgeyBuYW1lOiAnTGlmZSBQb3Rpb24nLCBkZXNjOiAnUmVzdG9yZXMgYWxsIGhlYWx0aCBwb2ludHMgd2hlbiBkcmluay4nLCBlZmZlY3Q6IEl0ZW1FZmZlY3RzLml0ZW1zLmxpZmVQb3Rpb24gfSxcbiAgICAgICAgeyBuYW1lOiAnUG9pc29uIFBvdGlvbicsIGRlc2M6ICdQb2lzb25zIHRoZSBjb25zdW1lciBieSAxRDMgZm9yIDEwIHR1cm5zLicsIGVmZmVjdDogSXRlbUVmZmVjdHMuaXRlbXMucG9pc29uUG90aW9uIH0sXG4gICAgICAgIHsgbmFtZTogJ0JsaW5kIFBvdGlvbicsIGRlc2M6ICdCbGluZHMgdGhlIGNvbnN1bWVyIGJ5IDJEOCsxNSB0dXJucy4nLCBlZmZlY3Q6IEl0ZW1FZmZlY3RzLml0ZW1zLmJsaW5kUG90aW9uIH0sXG4gICAgICAgIHsgbmFtZTogJ1BhcmFseXNpcyBQb3Rpb24nLCBkZXNjOiAnUGFyYWx5c2VzIHRoZSBjb25zdW1lciBieSAyRDEwKzEwIHR1cm5zLicsIGVmZmVjdDogSXRlbUVmZmVjdHMuaXRlbXMucGFyYWx5c2lzUG90aW9uIH0sXG4gICAgICAgIHsgbmFtZTogJ0ludmlzaWJpbGl0eSBQb3Rpb24nLCBkZXNjOiAnTWFrZXMgdGhlIGNvbnN1bWVyIGludmlzaWJsZSBieSAzRDEwKzE1IGV4Y2VwdCBmb3IgZW5lbWllcyBoZSBhdHRhY2tzLicsIGVmZmVjdDogSXRlbUVmZmVjdHMuaXRlbXMuaW52aXNpYmlsaXR5UG90aW9uIH0sXG4gICAgICAgIHsgbmFtZTogJ0N1cmUgUG90aW9uJywgZGVzYzogJ1JlbW92ZXMgYWxsIGRhbWFnaW5nIGVmZmVjdHMgb2YgdGhlIHN0YXR1cy4nLCBlZmZlY3Q6IEl0ZW1FZmZlY3RzLml0ZW1zLmN1cmVQb3Rpb24gfSxcbiAgICAgICAgeyBuYW1lOiAnU3RyZW5ndGggUG90aW9uJywgZGVzYzogJ0FkZHMgKzMgRGFtYWdlIHRvIHRoZSBhdHRhY2suJywgZWZmZWN0OiBJdGVtRWZmZWN0cy5pdGVtcy5zdHJlbmd0aFBvdGlvbiB9LFxuICAgICAgICB7IG5hbWU6ICdEZWZlbnNlIFBvdGlvbicsIGRlc2M6ICdBZGRzICszIHRvIHRoZSBvdmVyYWxsIGRlZmVuc2UuJywgZWZmZWN0OiBJdGVtRWZmZWN0cy5pdGVtcy5kZWZlbnNlUG90aW9uIH0sXG4gICAgICAgIHsgbmFtZTogJ1NwZWVkIFBvdGlvbicsIGRlc2M6ICdBZGRzICsxIHRvIHRoZSBzcGVlZC4nLCBlZmZlY3Q6IEl0ZW1FZmZlY3RzLml0ZW1zLnNwZWVkUG90aW9uIH0sXG4gICAgXSxcblxuICAgIHVzZUl0ZW06IGZ1bmN0aW9uIChpdGVtOiBJdGVtRGVmaW5pdGlvbiwgaW5zdGFuY2U6IEluc3RhbmNlKSB7XG4gICAgICAgIGxldCBtc2c6IHN0cmluZyA9IG51bGw7XG5cbiAgICAgICAgaWYgKGl0ZW0udHlwZSA9PSBJdGVtVHlwZXMuUE9USU9OKSB7XG4gICAgICAgICAgICBtc2cgPSBcIlwiO1xuICAgICAgICAgICAgaWYgKCFpdGVtLmRpc2NvdmVyZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSAoTWF0aC5yYW5kb20oKSAqIHRoaXMucG90aW9ucy5sZW5ndGgpIDw8IDA7XG4gICAgICAgICAgICAgICAgdmFyIHBvdGlvbiA9IHRoaXMucG90aW9uc1tpbmRleF07XG4gICAgICAgICAgICAgICAgdGhpcy5wb3Rpb25zLnNwbGljZShpbmRleCwgMSk7XG5cbiAgICAgICAgICAgICAgICBpdGVtLm5hbWUgPSBwb3Rpb24ubmFtZTtcbiAgICAgICAgICAgICAgICBpdGVtLmRlc2MgPSBwb3Rpb24uZGVzYztcbiAgICAgICAgICAgICAgICBpdGVtLmVmZmVjdCA9IHBvdGlvbi5lZmZlY3Q7XG4gICAgICAgICAgICAgICAgaXRlbS5kaXNjb3ZlcmVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIG1zZyA9IFwiSXQgd2FzIGEgXCIgKyBpdGVtLm5hbWUgKyBcIi4gXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1zZyArPSBJdGVtRWZmZWN0cy5leGVjdXRlQ29tbWFuZChpdGVtLmVmZmVjdCwgeyBpbnN0YW5jZTogaW5zdGFuY2UgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbXNnO1xuICAgIH0sXG5cbiAgICBnZXRJdGVtOiBmdW5jdGlvbiAoY29kZTogc3RyaW5nLCBhbW91bnQ6IG51bWJlciA9IDEpOiBXb3JsZEl0ZW0ge1xuICAgICAgICBpZiAoIXRoaXMuaXRlbXNbY29kZV0pIHsgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpdGVtIGNvZGU6IFtcIiArIGNvZGUgKyBcIl1cIik7IH1cblxuICAgICAgICBsZXQgaXRlbTogSXRlbURlZmluaXRpb24gPSB0aGlzLml0ZW1zW2NvZGVdO1xuICAgICAgICBpZiAoIWl0ZW0udGlsZSkge1xuICAgICAgICAgICAgaXRlbS5jb2RlID0gY29kZTtcbiAgICAgICAgICAgIGl0ZW0udGlsZSA9IFRpbGVzUHJlZmFicy5JVEVNU1tpdGVtLmNvZGVdO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJldDogV29ybGRJdGVtID0ge1xuICAgICAgICAgICAgYW1vdW50OiBhbW91bnQsXG4gICAgICAgICAgICBkZWY6IGl0ZW0sXG4gICAgICAgICAgICBzdGF0dXM6IDEwMFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChpdGVtLnR5cGUgPT0gSXRlbVR5cGVzLldFQVBPTiB8fCBpdGVtLnR5cGUgPT0gSXRlbVR5cGVzLkFSTU9SKSB7XG4gICAgICAgICAgICByZXQuc3RhdHVzID0gTWF0aC5taW4oNjAgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA0MCkgKyAxLCAxMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG59O1xuXG5leHBvcnQgeyBJdGVtRmFjdG9yeSwgV29ybGRJdGVtLCBJdGVtVHlwZXMgfTsiLCLvu79pbXBvcnQgeyBJbnB1dCB9IGZyb20gJy4vZW5naW5lL0lucHV0JztcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSAnLi9VdGlscyc7XG5pbXBvcnQgeyBDb2xvcnMgfSBmcm9tICcuL1ByZWZhYnMnO1xuaW1wb3J0IHsgUGxheWVyU3RhdHMgfSBmcm9tICcuL1BsYXllclN0YXRzJztcbmltcG9ydCB7IFNjZW5hcmlvIH0gZnJvbSAnLi9TY2VuYXJpbyc7XG5pbXBvcnQgeyBHYW1lIH0gZnJvbSAnLi9HYW1lJztcbmltcG9ydCB7IFJlbmRlcmVyIH0gZnJvbSAnLi9lbmdpbmUvUmVuZGVyZXInO1xuXG5jbGFzcyBNYWluTWVudSBleHRlbmRzIFNjZW5hcmlvIHtcbiAgICByZW5kZXJlcjogUmVuZGVyZXI7XG4gICAgbmFtZTogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIGdhbWU6IEdhbWUpIHtcbiAgICAgICAgc3VwZXIoKTsgXG4gICAgICAgIFxuICAgICAgICB0aGlzLnJlbmRlcmVyID0gdGhpcy5nYW1lLnJlbmRlcmVyO1xuICAgICAgICB0aGlzLm5hbWUgPSAnJztcblxuICAgICAgICBJbnB1dC5hZGRLZXlEb3duTGlzdGVuZXIoKGtleUNvZGU6IG51bWJlciwgc3RhdDogbnVtYmVyKSA9PiB7IHRoaXMuaGFuZGxlS2V5RXZlbnQoa2V5Q29kZSwgc3RhdCk7IH0pO1xuICAgIH1cblxuICAgIGhhbmRsZUtleUV2ZW50KGtleUNvZGU6IG51bWJlciwgc3RhdDogbnVtYmVyKSB7XG4gICAgICAgIGlmIChzdGF0ICE9IDApIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgaWYgKGtleUNvZGUgPj0gNjUgJiYga2V5Q29kZSA8PSA5MCkge1xuICAgICAgICAgICAgdGhpcy5uYW1lICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoa2V5Q29kZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5Q29kZSA9PSA4ICYmIHRoaXMubmFtZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSB0aGlzLm5hbWUuc3Vic3RyaW5nKDAsIHRoaXMubmFtZS5sZW5ndGggLSAxKTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXlDb2RlID09IDEzICYmIHRoaXMubmFtZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBQbGF5ZXJTdGF0cy5uYW1lID0gdGhpcy5uYW1lO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJlci5jbGVhclJlY3QoMCwgMCwgODUsIDMwKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZS5nb3RvTGV2ZWwoMSwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5uYW1lLmxlbmd0aCA+IDEwKSB7XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSB0aGlzLm5hbWUuc3Vic3RyaW5nKDAsIDEwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5jbGVhclJlY3QoMCwgMCwgODUsIDMwKTtcblxuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHRoaXMucmVuZGVyZXIsIDEsIDEsIFwiQ0hBTVBJT05TIE9GIFJPR1VFXCIsIENvbG9ycy5SRUQsIENvbG9ycy5CTEFDSyk7XG4gICAgICAgIFV0aWxzLnJlbmRlclRleHQodGhpcy5yZW5kZXJlciwgNTksIDEsIFwiQnkgQ2FtaWxvIFJhbWlyZXogKEZlZGljKVwiLCBDb2xvcnMuR09MRCwgQ29sb3JzLkJMQUNLKTtcblxuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHRoaXMucmVuZGVyZXIsIDEsIDMsIFwiQW4gZW50cnkgZm9yIHRoZSBcXFwiUm9ndWVsaWtlIENhb3MgIzFcXFwiIGphbVwiLCBDb2xvcnMuV0hJVEUsIENvbG9ycy5CTEFDSyk7XG5cbiAgICAgICAgVXRpbHMucmVuZGVyVGV4dCh0aGlzLnJlbmRlcmVyLCAxLCA0LCBcIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XCIsIENvbG9ycy5XSElURSwgQ29sb3JzLkJMQUNLKTtcblxuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHRoaXMucmVuZGVyZXIsIDEsIDYsIFwiVGhlIHdvcmxkIGhhcyBlbnRlcmVkIGEgbmV3IGFnZSBvZiBvcG9ydHVuaXRpZXMsIHdpdGggdGhlIGZhbGwgb2YgdGhlIGRhcmsgbG9yZCBJYXNcIiwgQ29sb3JzLkdSQVksIENvbG9ycy5CTEFDSyk7XG4gICAgICAgIFV0aWxzLnJlbmRlclRleHQodGhpcy5yZW5kZXJlciwgMSwgNywgXCJtYW55IGFkdmVudHVyZXMgYXJvdW5kIHRoZSB3b3JsZCBoYXZlIHRha2VuIHRoYXQgb3BvcnR1bml0eSB0byBsb290IHRoZSB0cmVhc3VyZXNcIiwgQ29sb3JzLkdSQVksIENvbG9ycy5CTEFDSyk7XG4gICAgICAgIFV0aWxzLnJlbmRlclRleHQodGhpcy5yZW5kZXJlciwgMSwgOCwgXCJoaWRkZW4gd2l0aGluIGhpcyBmb3J0cmVzcy4gU2V2ZXJhbCBsb3JkcyBhbmQga2luZ3MgaGF2ZSBhcHBlYXIgdGhhbmtzIHRvIHRoaXMgICBcIiwgQ29sb3JzLkdSQVksIENvbG9ycy5CTEFDSyk7XG4gICAgICAgIFV0aWxzLnJlbmRlclRleHQodGhpcy5yZW5kZXJlciwgMSwgOSwgXCJtYXNzaXZlIGFtb3VudCBvZiBmb3J0dW5lLCBidXQgaXQgd2FzIGEgbWF0dGVyIG9mIHRpbWUgYmVmb3JlIGEgbmV3IGxvcmQgYXBwZWFyICBcIiwgQ29sb3JzLkdSQVksIENvbG9ycy5CTEFDSyk7XG4gICAgICAgIFV0aWxzLnJlbmRlclRleHQodGhpcy5yZW5kZXJlciwgMSwgMTAsIFwiYW5kIGRlY2lkZWQgdG8gdGFrZSB0aGlzIGZvcnR1bmUgZm9yIGhpbXNlbGYsIGEgbmV3IGNoYW1waW9uOiAnUm9ndWUnLlwiLCBDb2xvcnMuR1JBWSwgQ29sb3JzLkJMQUNLKTtcblxuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHRoaXMucmVuZGVyZXIsIDEsIDEyLCBcIlJvZ3VlIHJ1bGVkIHRoZSBsYW5kIGZvciBzZXZlcmFsIHllYXJzIGFuZCBncmV3IGFuIGFybXkgYW5kIGZvcnR1bmUgYnV0IGp1c3QgbGlrZVwiLCBDb2xvcnMuR1JBWSwgQ29sb3JzLkJMQUNLKTtcbiAgICAgICAgVXRpbHMucmVuZGVyVGV4dCh0aGlzLnJlbmRlcmVyLCAxLCAxMywgXCJJYXMgYmVmb3JlIGhpbSBoZSB3YXMgZGVzdGluZWQgdG8gZG9vbSwgZGVmZWF0ZWQgYnkgdGhlIG9uZXMgbGlrZSBoaW0sIHNldmVyYWwgXCIsIENvbG9ycy5HUkFZLCBDb2xvcnMuQkxBQ0spO1xuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHRoaXMucmVuZGVyZXIsIDEsIDE0LCBcIm5ldyBjaGFtcGlvbnMgYXJyaXZlIHRvIHRoZSBmb3J0cmVzcyB0byBzdGVhbCBnb2xkIGFuZCB0byBjaGFsbGVuZ2UgdGhlIGN1cnJlbnRcIiwgQ29sb3JzLkdSQVksIENvbG9ycy5CTEFDSyk7XG4gICAgICAgIFV0aWxzLnJlbmRlclRleHQodGhpcy5yZW5kZXJlciwgMSwgMTUsIFwiY2hhbXBpb24uIFwiLCBDb2xvcnMuR1JBWSwgQ29sb3JzLkJMQUNLKTtcblxuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHRoaXMucmVuZGVyZXIsIDEsIDE3LCBcIlllYXJzIGhhdmUgcGFzc2VkIGFuZCBhIG5ldyBjaGFtcGlvbjogJ1NvZGknIGhhcyB0YWtlbiB0aGUgcGxhY2UuIFlvdSBhcnJpdmUgYXRcIiwgQ29sb3JzLkdSQVksIENvbG9ycy5CTEFDSyk7XG4gICAgICAgIFV0aWxzLnJlbmRlclRleHQodGhpcy5yZW5kZXJlciwgMSwgMTgsIFwidGhlIGRvb3JzIG9mIHRoZSBmb3J0cmVzcywgdGhlIHNhbWUgd2hpY2ggUm9ndWUgYW5kIG1hbnkgb3RoZXJzIGNyb3NzZWQsIHdpbGwgeW91XCIsIENvbG9ycy5HUkFZLCBDb2xvcnMuQkxBQ0spO1xuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHRoaXMucmVuZGVyZXIsIDEsIDE5LCBcImRlZmVhdCBzb2RpIGFuZCBjbGFpbSB0aGUgdGl0bGUgb2YgY2hhbXBpb24/IG9yIHdpbGwgeW91IHBlcmlzaCBhbG9uZyB3aXRoIHRoZSAgXCIsIENvbG9ycy5HUkFZLCBDb2xvcnMuQkxBQ0spO1xuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHRoaXMucmVuZGVyZXIsIDEsIDIwLCBcIm90aGVycyBiZWZvcmUgeW91LlwiLCBDb2xvcnMuR1JBWSwgQ29sb3JzLkJMQUNLKTtcblxuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHRoaXMucmVuZGVyZXIsIDEsIDI1LCBcIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XCIsIENvbG9ycy5XSElURSwgQ29sb3JzLkJMQUNLKTtcblxuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHRoaXMucmVuZGVyZXIsIDEsIDI3LCBcIkVOVEVSIFlPVVIgTkFNRSBBRFZFTlRVUkVSOiBcIiArIHRoaXMubmFtZSwgQ29sb3JzLldISVRFLCBDb2xvcnMuQkxBQ0spO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgTWFpbk1lbnUgfTsiLCLvu79kZWNsYXJlIHZhciBHcmFwaDogYW55O1xuZGVjbGFyZSB2YXIgYXN0YXI6IGFueTtcblxuaW1wb3J0IHsgQ29uc29sZSB9IGZyb20gJy4vQ29uc29sZSc7XG5pbXBvcnQgeyBUaWxlUHJlZmFiLCBUaWxlc1ByZWZhYnMsIFRpbGVUeXBlcywgQ29sb3JzIH0gZnJvbSAnLi9QcmVmYWJzJztcbmltcG9ydCB7IFBsYXllciB9IGZyb20gJy4vUGxheWVyJztcbmltcG9ydCB7IEl0ZW0gfSBmcm9tICcuL0l0ZW0nO1xuaW1wb3J0IHsgSXRlbUZhY3RvcnksIFdvcmxkSXRlbSB9IGZyb20gJy4vSXRlbUZhY3RvcnknO1xuaW1wb3J0IHsgRW5lbXkgfSBmcm9tICcuL0VuZW15JztcbmltcG9ydCB7IEVuZW15RmFjdG9yeSB9IGZyb20gJy4vRW5lbXlGYWN0b3J5JztcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSAnLi9VdGlscyc7XG5pbXBvcnQgeyBNYXBHZW5lcmF0b3IsIE1hcERlZmluaXRpb24sIE1HSW5zdGFuY2UgfSBmcm9tICcuL01hcEdlbmVyYXRvcic7XG5pbXBvcnQgeyBTdGFpcnMgfSBmcm9tICcuL1N0YWlycyc7XG5pbXBvcnQgeyBQbGF5ZXJTdGF0cyB9IGZyb20gJy4vUGxheWVyU3RhdHMnO1xuaW1wb3J0IHsgR2FtZSB9IGZyb20gJy4vR2FtZSc7XG5pbXBvcnQgeyBJbnN0YW5jZSB9IGZyb20gJy4vSW5zdGFuY2UnO1xuaW1wb3J0IHsgUmVuZGVyZXIgfSBmcm9tICcuL2VuZ2luZS9SZW5kZXJlcic7XG5pbXBvcnQgeyBWZWN0b3IyIH0gZnJvbSAnLi9lbmdpbmUvVmVjdG9yMic7XG5pbXBvcnQgeyBUaWxlIH0gZnJvbSAnLi9lbmdpbmUvVGlsZSc7XG5pbXBvcnQgeyBTY2VuYXJpbyB9IGZyb20gJy4vU2NlbmFyaW8nO1xuXG5pbnRlcmZhY2UgRGlzcGxheVRpbGUge1xuICAgIHRpbGU6IFRpbGVQcmVmYWIsXG4gICAgdmlzaWJsZTogbnVtYmVyXG59O1xuXG5jbGFzcyBNYXAgZXh0ZW5kcyBTY2VuYXJpbyB7XG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyO1xuICAgIGFjdGl2ZTogYm9vbGVhbjtcbiAgICBncmFwaDogYW55O1xuXG4gICAgbW91c2VQYXRoOiBBcnJheTxudW1iZXI+O1xuICAgIG1vdXNlRG93bjogbnVtYmVyO1xuICAgIG1vdXNlUG9zaXRpb246IFZlY3RvcjI7XG4gICAgbW91c2VQYXRoVGlsZTogVGlsZTtcblxuICAgIG1hcDogQXJyYXk8QXJyYXk8RGlzcGxheVRpbGU+PjtcbiAgICB2aWV3OiBWZWN0b3IyO1xuICAgIHBsYXllcjogUGxheWVyO1xuICAgIGluc3RhbmNlczogQXJyYXk8SW5zdGFuY2U+O1xuXG4gICAgc3RhaXJzVXA6IFN0YWlycztcbiAgICBzdGFpcnNEb3duOiBTdGFpcnM7XG5cbiAgICBtYXBQb3NpdGlvbjogQXJyYXk8bnVtYmVyPjtcbiAgICBmb3ZVcGRhdGVkOiBib29sZWFuO1xuICAgIGZvdkRpc3RhbmNlOiBudW1iZXI7XG5cbiAgICBwbGF5ZXJUdXJuOiBib29sZWFuO1xuICAgIHRpbGVEZXNjcmlwdGlvbjogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIGdhbWU6IEdhbWUsIHB1YmxpYyBsZXZlbDogbnVtYmVyID0gMSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMucmVuZGVyZXIgPSBnYW1lLnJlbmRlcmVyO1xuXG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZ3JhcGggPSBudWxsO1xuICAgICAgICB0aGlzLm1vdXNlUGF0aCA9IG51bGw7XG4gICAgICAgIHRoaXMubW91c2VEb3duID0gMDtcbiAgICAgICAgdGhpcy5tb3VzZVBvc2l0aW9uID0geyB4OiAtMSwgeTogLSAxIH07XG4gICAgICAgIHRoaXMubW91c2VQYXRoVGlsZSA9IHRoaXMucmVuZGVyZXIuZ2V0VGlsZShDb2xvcnMuWUVMTE9XLCBDb2xvcnMuV0hJVEUsIHsgeDogMCwgeTogMCB9KTtcblxuICAgICAgICB0aGlzLm1hcCA9IFtdO1xuICAgICAgICB0aGlzLnZpZXcgPSB7IHg6IDAsIHk6IDAgfTtcbiAgICAgICAgdGhpcy5wbGF5ZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmluc3RhbmNlcyA9IFtdO1xuXG4gICAgICAgIHRoaXMuc3RhaXJzVXAgPSBudWxsO1xuICAgICAgICB0aGlzLnN0YWlyc0Rvd24gPSBudWxsO1xuXG4gICAgICAgIHRoaXMubWFwUG9zaXRpb24gPSBbMCwgMiwgNjAsIDIzXTtcbiAgICAgICAgdGhpcy5mb3ZVcGRhdGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZm92RGlzdGFuY2UgPSAzMDtcblxuICAgICAgICB0aGlzLnBsYXllclR1cm4gPSB0cnVlO1xuICAgICAgICB0aGlzLnRpbGVEZXNjcmlwdGlvbiA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGVNYXAoKTtcblxuICAgICAgICB0aGlzLnVwZGF0ZUZPVih0aGlzLnBsYXllci54LCB0aGlzLnBsYXllci55KTtcbiAgICB9XG5cbiAgICBjcmVhdGVNYXAoKSB7XG4gICAgICAgIE1hcEdlbmVyYXRvci5pbml0KHBhcnNlSW50KHRoaXMuZ2FtZS5nYW1lU2VlZCArIFwiXCIgKyB0aGlzLmxldmVsLCAxMCkpO1xuICAgICAgICBsZXQgbmV3TWFwOiBNYXBEZWZpbml0aW9uID0gTWFwR2VuZXJhdG9yLmdlbmVyYXRlTWFwKHRoaXMubGV2ZWwpO1xuICAgICAgICBsZXQgbWFwOiBBcnJheTxBcnJheTxudW1iZXI+PiA9IG5ld01hcC5tYXA7XG5cbiAgICAgICAgbGV0IHNvbGlkTWFwOiBBcnJheTxBcnJheTxudW1iZXI+PiA9IG5ldyBBcnJheShtYXBbMF0ubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb2xpZE1hcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc29saWRNYXBbaV0gPSBuZXcgQXJyYXkobWFwLmxlbmd0aCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCB5ID0gMCwgeWwgPSBtYXAubGVuZ3RoOyB5IDwgeWw7IHkrKykge1xuICAgICAgICAgICAgdGhpcy5tYXBbeV0gPSBuZXcgQXJyYXkobWFwW3ldLmxlbmd0aCk7XG5cbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwLCB4bCA9IG1hcFt5XS5sZW5ndGg7IHggPCB4bDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHQ6IG51bWJlciA9IG1hcFt5XVt4XTtcbiAgICAgICAgICAgICAgICBsZXQgdGlsZTogVGlsZVByZWZhYiA9IFRpbGVzUHJlZmFicy5USUxFU1tcIkJMQU5LXCJdO1xuICAgICAgICAgICAgICAgIHZhciB3ZWlnaHQgPSAxO1xuXG4gICAgICAgICAgICAgICAgaWYgKHQgPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0aWxlID0gVGlsZXNQcmVmYWJzLlRJTEVTW1wiRkxPT1JcIl07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0ID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGlsZSA9IFRpbGVzUHJlZmFicy5USUxFU1tcIldBVEVSXCJdO1xuICAgICAgICAgICAgICAgICAgICB3ZWlnaHQgPSAxLjU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0ID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGlsZSA9IFRpbGVzUHJlZmFicy5USUxFU1tcIldBVEVSX0RFRVBcIl07XG4gICAgICAgICAgICAgICAgICAgIHdlaWdodCA9IDI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0ID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGlsZSA9IFRpbGVzUHJlZmFicy5USUxFU1tcIldBTExcIl07XG4gICAgICAgICAgICAgICAgICAgIHdlaWdodCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5tYXBbeV1beF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbGU6IHRpbGUsXG4gICAgICAgICAgICAgICAgICAgIHZpc2libGU6IDBcbiAgICAgICAgICAgICAgICB9O1xuXG5cbiAgICAgICAgICAgICAgICBzb2xpZE1hcFt4XVt5XSA9IHdlaWdodDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ3JhcGggPSBuZXcgR3JhcGgoc29saWRNYXAsIHsgZGlhZ29uYWw6IHRydWUgfSk7XG5cbiAgICAgICAgdGhpcy5wbGF5ZXIgPSBuZXcgUGxheWVyKG5ld01hcC5wbGF5ZXIueCwgbmV3TWFwLnBsYXllci55LCB0aGlzKTtcbiAgICAgICAgdGhpcy5pbnN0YW5jZXMucHVzaCh0aGlzLnBsYXllcik7XG5cbiAgICAgICAgbGV0IG5ld0luc3RhbmNlOiBJbnN0YW5jZTtcbiAgICAgICAgaWYgKG5ld01hcC5zdGFpcnNVcCkge1xuICAgICAgICAgICAgbmV3SW5zdGFuY2UgPSBuZXcgU3RhaXJzKG5ld01hcC5zdGFpcnNVcC54LCBuZXdNYXAuc3RhaXJzVXAueSwgdGhpcywgdGhpcy5sZXZlbCAtIDEsIFRpbGVzUHJlZmFicy5USUxFU1tcIlNUQUlSU19VUFwiXSk7XG4gICAgICAgICAgICB0aGlzLnN0YWlyc1VwID0gPFN0YWlycz5uZXdJbnN0YW5jZTtcbiAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VzLnB1c2gobmV3SW5zdGFuY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5ld01hcC5zdGFpcnNEb3duKSB7XG4gICAgICAgICAgICBuZXdJbnN0YW5jZSA9IG5ldyBTdGFpcnMobmV3TWFwLnN0YWlyc0Rvd24ueCwgbmV3TWFwLnN0YWlyc0Rvd24ueSwgdGhpcywgdGhpcy5sZXZlbCArIDEsIFRpbGVzUHJlZmFicy5USUxFU1tcIlNUQUlSU19ET1dOXCJdKTtcbiAgICAgICAgICAgIHRoaXMuc3RhaXJzRG93biA9IDxTdGFpcnM+bmV3SW5zdGFuY2U7XG4gICAgICAgICAgICB0aGlzLmluc3RhbmNlcy5wdXNoKG5ld0luc3RhbmNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbnM6IE1HSW5zdGFuY2U7IGlucyA9IG5ld01hcC5pbnN0YW5jZXNbaV07IGkrKykge1xuICAgICAgICAgICAgaWYgKGlucy50eXBlID09IFwiaXRlbVwiKSB7XG4gICAgICAgICAgICAgICAgbmV3SW5zdGFuY2UgPSBuZXcgSXRlbShpbnMueCwgaW5zLnksIHRoaXMsIEl0ZW1GYWN0b3J5LmdldEl0ZW0oaW5zLmNvZGUpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5zLnR5cGUgPT0gXCJlbmVteVwiKSB7XG4gICAgICAgICAgICAgICAgbmV3SW5zdGFuY2UgPSBuZXcgRW5lbXkoaW5zLngsIGlucy55LCB0aGlzLCBFbmVteUZhY3RvcnkuZ2V0RW5lbXkoaW5zLmNvZGUpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5zLnR5cGUgPT0gXCJnb2xkXCIpIHtcbiAgICAgICAgICAgICAgICBuZXdJbnN0YW5jZSA9IG5ldyBJdGVtKGlucy54LCBpbnMueSwgdGhpcywgSXRlbUZhY3RvcnkuZ2V0SXRlbShcImdvbGRcIiwgaW5zLmFtb3VudCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmluc3RhbmNlcy5wdXNoKG5ld0luc3RhbmNlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldEluc3RhbmNlQXQoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBJbnN0YW5jZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAxLCBpbnM6IEluc3RhbmNlOyBpbnMgPSB0aGlzLmluc3RhbmNlc1tpXTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaW5zLnggPT0geCAmJiBpbnMueSA9PSB5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlucztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNyZWF0ZUl0ZW0oeDogbnVtYmVyLCB5OiBudW1iZXIsIGl0ZW06IFdvcmxkSXRlbSkge1xuICAgICAgICBsZXQgbmV3SXRlbTogSXRlbSA9IG5ldyBJdGVtKHgsIHksIHRoaXMsIGl0ZW0pO1xuICAgICAgICBuZXdJdGVtLnBsYXllck9uVGlsZSA9IHRydWU7XG4gICAgICAgIHRoaXMuaW5zdGFuY2VzLnB1c2gobmV3SXRlbSk7XG4gICAgfVxuXG4gICAgaXNTb2xpZCh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgICAgICByZXR1cm4gKHRoaXMubWFwW3ldW3hdLnRpbGUudHlwZSA9PSBUaWxlVHlwZXMuV0FMTCk7XG4gICAgfVxuXG4gICAgZ2V0VGlsZUF0KHg6IG51bWJlciwgeTogbnVtYmVyKTogVGlsZVByZWZhYiB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcFt5XVt4XS50aWxlO1xuICAgIH1cblxuICAgIGdldFBhdGgoeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcik6IEFycmF5PG51bWJlcj4ge1xuICAgICAgICBsZXQgc3RhcnQgPSB0aGlzLmdyYXBoLmdyaWRbeDFdW3kxXTtcbiAgICAgICAgbGV0IGVuZCA9IHRoaXMuZ3JhcGguZ3JpZFt4Ml1beTJdO1xuICAgICAgICBsZXQgcmVzdWx0ID0gYXN0YXIuc2VhcmNoKHRoaXMuZ3JhcGgsIHN0YXJ0LCBlbmQsIHsgaGV1cmlzdGljOiBhc3Rhci5oZXVyaXN0aWNzLmRpYWdvbmFsIH0pO1xuXG4gICAgICAgIGxldCByZXQ6IEFycmF5PG51bWJlcj4gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIHI6YW55OyByID0gcmVzdWx0W2ldOyBpKyspIHtcbiAgICAgICAgICAgIHJldC5wdXNoKDxudW1iZXI+ci54KTtcbiAgICAgICAgICAgIHJldC5wdXNoKDxudW1iZXI+ci55KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgb25Nb3VzZU1vdmUoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKHggPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5tb3VzZVBhdGggPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5tb3VzZVBvc2l0aW9uID0geyB4OiAtMSwgeTogLTEgfTtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHgxOiBudW1iZXIgPSB0aGlzLnBsYXllci54LFxuICAgICAgICAgICAgeTE6IG51bWJlciA9IHRoaXMucGxheWVyLnksXG4gICAgICAgICAgICB4MjogbnVtYmVyID0geCArIHRoaXMudmlldy54LFxuICAgICAgICAgICAgeTI6IG51bWJlciA9IHkgKyB0aGlzLnZpZXcueTtcblxuICAgICAgICB0aGlzLm1vdXNlUGF0aCA9IHRoaXMuZ2V0UGF0aCh4MSwgeTEsIHgyLCB5Mik7XG5cbiAgICAgICAgdGhpcy5tb3VzZVBvc2l0aW9uID0geyB4OiB4MiwgeTogeTIgfTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBvbk1vdXNlSGFuZGxlcih4OiBudW1iZXIsIHk6IG51bWJlciwgc3RhdDogbnVtYmVyKSB7XG4gICAgICAgIGlmICh0aGlzLm1vdXNlRG93biA9PSAyICYmIHN0YXQgPT0gMSkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMubW91c2VEb3duID0gc3RhdDtcbiAgICAgICAgaWYgKHRoaXMubW91c2VEb3duID09IDEpIHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gMjtcblxuICAgICAgICAgICAgaWYgKHRoaXMucGxheWVyLm1vdmVQYXRoKSByZXR1cm47XG5cbiAgICAgICAgICAgIHRoaXMub25Nb3VzZU1vdmUoeCwgeSk7XG4gICAgICAgICAgICBpZiAodGhpcy5tb3VzZVBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyLm1vdmVQYXRoID0gdGhpcy5tb3VzZVBhdGguc2xpY2UoMCwgdGhpcy5tb3VzZVBhdGgubGVuZ3RoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvcHlNYXBJbnRvVGV4dHVyZSgpIHtcbiAgICAgICAgbGV0IHhzOiBudW1iZXIgPSB0aGlzLnZpZXcueCxcbiAgICAgICAgICAgIHlzOiBudW1iZXIgPSB0aGlzLnZpZXcueSxcbiAgICAgICAgICAgIHhlOiBudW1iZXIgPSB4cyArIHRoaXMubWFwUG9zaXRpb25bMl0sXG4gICAgICAgICAgICB5ZTogbnVtYmVyID0geXMgKyB0aGlzLm1hcFBvc2l0aW9uWzNdLFxuICAgICAgICAgICAgbXA6IEFycmF5PG51bWJlcj4gPSB0aGlzLm1hcFBvc2l0aW9uLFxuICAgICAgICAgICAgdGlsZTogRGlzcGxheVRpbGU7XG5cbiAgICAgICAgZm9yIChsZXQgeSA9IHlzOyB5IDwgeWU7IHkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IHhzOyB4IDwgeGU7IHgrKykge1xuICAgICAgICAgICAgICAgIHRpbGUgPSB0aGlzLm1hcFt5XVt4XTtcblxuICAgICAgICAgICAgICAgIHZhciByZW5kZXJUaWxlID0gdGlsZS50aWxlLmxpZ2h0O1xuICAgICAgICAgICAgICAgIGlmICh0aWxlLnZpc2libGUgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJUaWxlID0gVGlsZXNQcmVmYWJzLlRJTEVTW1wiQkxBTktcIl0ubGlnaHQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aWxlLnZpc2libGUgPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJUaWxlID0gdGlsZS50aWxlLmRhcms7XG4gICAgICAgICAgICAgICAgICAgIHRpbGUudmlzaWJsZSA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aWxlLnZpc2libGUgPT0gMiAmJiB0aGlzLmZvdlVwZGF0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyVGlsZSA9IHRpbGUudGlsZS5kYXJrO1xuICAgICAgICAgICAgICAgICAgICB0aWxlLnZpc2libGUgPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGlsZS52aXNpYmxlID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyVGlsZSA9IHRpbGUudGlsZS5saWdodDtcbiAgICAgICAgICAgICAgICAgICAgdGlsZS52aXNpYmxlID0gMjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnBsb3QoeCAtIHhzICsgbXBbMF0sIHkgLSB5cyArIG1wWzFdLCByZW5kZXJUaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZm92VXBkYXRlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGNhc3RMaWdodFJheSh4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4MjogbnVtYmVyLCB5MjogbnVtYmVyKSB7XG4gICAgICAgIGxldCB4OiBudW1iZXIgPSB4MiAtIHgxLFxuICAgICAgICAgICAgeTogbnVtYmVyID0geTEgLSB5MixcbiAgICAgICAgICAgIGFuZ2xlOiBudW1iZXIgPSBNYXRoLmF0YW4yKHksIHgpLFxuICAgICAgICAgICAgang6IG51bWJlciA9IE1hdGguY29zKGFuZ2xlKSAqIDAuNSxcbiAgICAgICAgICAgIGp5OiBudW1iZXIgPSAtTWF0aC5zaW4oYW5nbGUpICogMC41LFxuICAgICAgICAgICAgcng6IG51bWJlciA9IHgxICsgMC41LFxuICAgICAgICAgICAgcnk6IG51bWJlciA9IHkxICsgMC41LFxuICAgICAgICAgICAgY3g6IG51bWJlciwgY3k6IG51bWJlcixcbiAgICAgICAgICAgIHNlYXJjaDogYm9vbGVhbiA9IHRydWUsXG4gICAgICAgICAgICBkOiBudW1iZXIgPSAwLFxuICAgICAgICAgICAgbWQ6IG51bWJlciA9IHRoaXMuZm92RGlzdGFuY2UgLyAyO1xuXG4gICAgICAgIHdoaWxlIChzZWFyY2gpIHtcbiAgICAgICAgICAgIGN4ID0gcnggPDwgMDtcbiAgICAgICAgICAgIGN5ID0gcnkgPDwgMDtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLm1hcFtjeV0pIHsgc2VhcmNoID0gZmFsc2U7IH1cbiAgICAgICAgICAgIGlmICghdGhpcy5tYXBbY3ldW2N4XSkgeyBzZWFyY2ggPSBmYWxzZTsgfVxuXG4gICAgICAgICAgICB0aGlzLm1hcFtjeV1bY3hdLnZpc2libGUgPSAzO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNTb2xpZChjeCwgY3kpKSB7XG4gICAgICAgICAgICAgICAgc2VhcmNoID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkKysgPj0gbWQpIHtcbiAgICAgICAgICAgICAgICBzZWFyY2ggPSBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcnggKz0gang7XG4gICAgICAgICAgICByeSArPSBqeTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZUZPVih4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgICAgICBsZXQgZGlzdGFuY2U6IG51bWJlciA9IHRoaXMuZm92RGlzdGFuY2U7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IGRpc3RhbmNlOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHRoaXMuY2FzdExpZ2h0UmF5KHgsIHksIHggLSBkaXN0YW5jZSAvIDIsIHkgLSBkaXN0YW5jZSAvIDIgKyBpKTtcbiAgICAgICAgICAgIHRoaXMuY2FzdExpZ2h0UmF5KHgsIHksIHggKyBkaXN0YW5jZSAvIDIsIHkgLSBkaXN0YW5jZSAvIDIgKyBpKTtcbiAgICAgICAgICAgIHRoaXMuY2FzdExpZ2h0UmF5KHgsIHksIHggLSBkaXN0YW5jZSAvIDIgKyBpLCB5IC0gZGlzdGFuY2UgLyAyKTtcbiAgICAgICAgICAgIHRoaXMuY2FzdExpZ2h0UmF5KHgsIHksIHggLSBkaXN0YW5jZSAvIDIgKyBpLCB5ICsgZGlzdGFuY2UgLyAyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZm92VXBkYXRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMubW91c2VQYXRoID0gbnVsbDtcbiAgICB9XG5cbiAgICB1cGRhdGVWaWV3KCkge1xuICAgICAgICB0aGlzLnZpZXcueCA9IE1hdGgubWF4KHRoaXMucGxheWVyLnggLSAzMywgMCk7XG4gICAgICAgIHRoaXMudmlldy55ID0gTWF0aC5tYXgodGhpcy5wbGF5ZXIueSAtIDExLCAwKTtcblxuICAgICAgICBpZiAodGhpcy52aWV3LnggKyB0aGlzLm1hcFBvc2l0aW9uWzJdID4gdGhpcy5tYXBbMF0ubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcueCA9IHRoaXMubWFwWzBdLmxlbmd0aCAtIHRoaXMubWFwUG9zaXRpb25bMl07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy52aWV3LnkgKyB0aGlzLm1hcFBvc2l0aW9uWzNdID4gdGhpcy5tYXAubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcueSA9IHRoaXMubWFwLmxlbmd0aCAtIHRoaXMubWFwUG9zaXRpb25bM107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXJNb3VzZVBhdGgoKSB7XG4gICAgICAgIGlmICghdGhpcy5tb3VzZVBhdGgpIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMucGxheWVyLm1vdmVQYXRoKSByZXR1cm47XG5cbiAgICAgICAgbGV0IHg6IG51bWJlciwgeTogbnVtYmVyO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IHRoaXMubW91c2VQYXRoLmxlbmd0aDsgaSA8IGw7IGkgKz0gMikge1xuICAgICAgICAgICAgbGV0IHRpbGU6IERpc3BsYXlUaWxlID0gdGhpcy5tYXBbdGhpcy5tb3VzZVBhdGhbaSArIDFdXVt0aGlzLm1vdXNlUGF0aFtpXV07XG4gICAgICAgICAgICBpZiAoIXRpbGUudmlzaWJsZSkgeyByZXR1cm47IH1cblxuICAgICAgICAgICAgeCA9IHRoaXMubW91c2VQYXRoW2ldIC0gdGhpcy52aWV3LnggKyB0aGlzLm1hcFBvc2l0aW9uWzBdO1xuICAgICAgICAgICAgeSA9IHRoaXMubW91c2VQYXRoW2kgKyAxXSAtIHRoaXMudmlldy55ICsgdGhpcy5tYXBQb3NpdGlvblsxXTtcblxuICAgICAgICAgICAgaWYgKHggPCAwIHx8IHkgPCAwIHx8IHggPj0gdGhpcy5tYXBQb3NpdGlvblsyXSArIHRoaXMubWFwUG9zaXRpb25bMF0gfHwgeSA+PSB0aGlzLm1hcFBvc2l0aW9uWzNdICsgdGhpcy5tYXBQb3NpdGlvblsxXSkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnBsb3RCYWNrZ3JvdW5kKHgsIHksIHRoaXMubW91c2VQYXRoVGlsZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW5kZXJEZXNjcmlwdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5jbGVhclJlY3QoMCwgMCwgdGhpcy5tYXBQb3NpdGlvblsyXSwgMik7XG5cbiAgICAgICAgaWYgKCF0aGlzLnRpbGVEZXNjcmlwdGlvbikgeyByZXR1cm47IH1cblxuICAgICAgICBsZXQgeDogbnVtYmVyID0gKHRoaXMubWFwUG9zaXRpb25bMl0gLyAyIC0gdGhpcy50aWxlRGVzY3JpcHRpb24ubGVuZ3RoIC8gMikgPDwgMDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGM6IHN0cmluZzsgYyA9IHRoaXMudGlsZURlc2NyaXB0aW9uW2ldOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIucGxvdCh4ICsgaSwgMSwgVXRpbHMuZ2V0VGlsZSh0aGlzLnJlbmRlcmVyLCBjLCBDb2xvcnMuV0hJVEUsIENvbG9ycy5CTEFDSykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICB0aGlzLnBsYXllclR1cm4gPSB0cnVlO1xuICAgICAgICB0aGlzLnRpbGVEZXNjcmlwdGlvbiA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jb3B5TWFwSW50b1RleHR1cmUoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJNb3VzZVBhdGgoKTtcblxuICAgICAgICBsZXQgZGlzY292ZXI6IHN0cmluZyA9IG51bGw7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbnM6IEluc3RhbmNlOyBpbnMgPSB0aGlzLmluc3RhbmNlc1tpXTsgaSsrKSB7XG4gICAgICAgICAgICBpbnMudXBkYXRlKCk7XG5cbiAgICAgICAgICAgIGlmIChpbnMuZGVzdHJveSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm1hcFtpbnMueV1baW5zLnhdLnZpc2libGUgPj0gMikge1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyZXIucGxvdENoYXJhY3RlcihpbnMueCAtIHRoaXMudmlldy54ICsgdGhpcy5tYXBQb3NpdGlvblswXSwgaW5zLnkgLSB0aGlzLnZpZXcueSArIHRoaXMubWFwUG9zaXRpb25bMV0sIGlucy50aWxlLmxpZ2h0KTtcblxuICAgICAgICAgICAgICAgIGlmIChpbnMuc3RvcE9uRGlzY292ZXIgJiYgIWlucy5pblNoYWRvdyAmJiAhaW5zLmRpc2NvdmVyZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zLmRpc2NvdmVyZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzY292ZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzY292ZXIgPSBcIllvdSBzZWUgYSBcIiArIGlucy5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzY292ZXIgKz0gXCIsIFwiICsgaW5zLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlucy52aXNpYmxlSW5TaGFkb3cgJiYgdGhpcy5tYXBbaW5zLnldW2lucy54XS52aXNpYmxlID09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmVyLnBsb3RDaGFyYWN0ZXIoaW5zLnggLSB0aGlzLnZpZXcueCArIHRoaXMubWFwUG9zaXRpb25bMF0sIGlucy55IC0gdGhpcy52aWV3LnkgKyB0aGlzLm1hcFBvc2l0aW9uWzFdLCBpbnMudGlsZS5kYXJrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkaXNjb3ZlciAhPSBudWxsICYmICFQbGF5ZXJTdGF0cy5ibGluZCkge1xuICAgICAgICAgICAgbGV0IHRleHQ6IEFycmF5PHN0cmluZz4gPSBVdGlscy5mb3JtYXRUZXh0KGRpc2NvdmVyICsgXCIuXCIsIDg1KTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsaW5lOiBzdHJpbmc7IGxpbmUgPSBkaXNjb3ZlcltpXTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lLmNvbnNvbGUuYWRkTWVzc2FnZShsaW5lLCBDb2xvcnMuV0hJVEUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnBsYXllci5tb3ZlUGF0aCA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoUGxheWVyU3RhdHMuYmxpbmQpIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyZXIuY2xlYXJSZWN0KHRoaXMubWFwUG9zaXRpb25bMF0sIHRoaXMubWFwUG9zaXRpb25bMV0sIHRoaXMubWFwUG9zaXRpb25bMl0sIHRoaXMubWFwUG9zaXRpb25bM10pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZW5kZXJlci5wbG90Q2hhcmFjdGVyKHRoaXMucGxheWVyLnggLSB0aGlzLnZpZXcueCArIHRoaXMubWFwUG9zaXRpb25bMF0sIHRoaXMucGxheWVyLnkgLSB0aGlzLnZpZXcueSArIHRoaXMubWFwUG9zaXRpb25bMV0sIHRoaXMucGxheWVyLnRpbGUubGlnaHQpO1xuXG4gICAgICAgIHRoaXMucmVuZGVyRGVzY3JpcHRpb24oKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IE1hcCB9OyIsIu+7v2ltcG9ydCB7IFBSTkcgfSBmcm9tICcuL2VuZ2luZS9QUk5HJztcbmltcG9ydCB7IFZlY3RvcjIgfSBmcm9tICcuL2VuZ2luZS9WZWN0b3IyJztcblxuaW50ZXJmYWNlIERvb3IgZXh0ZW5kcyBWZWN0b3IyIHtcbiAgICByb29tOiBSb29tXG59XG5cbmludGVyZmFjZSBJbnN0YW5jZSBleHRlbmRzIFZlY3RvcjIge1xuICAgIHR5cGU6IHN0cmluZyxcbiAgICBjb2RlOiBzdHJpbmcsXG4gICAgYW1vdW50OiBudW1iZXJcbn1cblxuaW50ZXJmYWNlIE1hcERlZmluaXRpb24ge1xuICAgIG1hcDogQXJyYXk8QXJyYXk8bnVtYmVyPj4sXG4gICAgcGxheWVyOiBWZWN0b3IyLFxuICAgIHN0YWlyc1VwOiBWZWN0b3IyLFxuICAgIHN0YWlyc0Rvd246IFZlY3RvcjIsXG4gICAgaW5zdGFuY2VzOiBBcnJheTxJbnN0YW5jZT5cbn1cblxuY2xhc3MgUm9vbSB7XG4gICAgZG9vcnM6IEFycmF5PERvb3I+O1xuICAgIG5vcnRoOiBib29sZWFuO1xuICAgIHdlc3Q6IGJvb2xlYW47XG4gICAgc291dGg6IGJvb2xlYW47XG4gICAgZWFzdDogYm9vbGVhbjtcbiAgICBhY3RpdmU6IGJvb2xlYW47XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgeDogbnVtYmVyLCBwdWJsaWMgeTogbnVtYmVyLCBwdWJsaWMgdzogbnVtYmVyLCBwdWJsaWMgaDogbnVtYmVyLCBwdWJsaWMgcm9vbTogYm9vbGVhbiA9IHRydWUpIHtcbiAgICAgICAgdGhpcy5kb29ycyA9IFtdO1xuXG4gICAgICAgIHRoaXMubm9ydGggPSBmYWxzZTtcbiAgICAgICAgdGhpcy53ZXN0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc291dGggPSBmYWxzZTtcbiAgICAgICAgdGhpcy5lYXN0ID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgIH1cblxuICAgIGNoZWNrU2lkZShzaWRlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKHNpZGUgPT0gMCAmJiB0aGlzLndlc3QpIHsgcmV0dXJuIGZhbHNlOyB9IGVsc2VcbiAgICAgICAgaWYgKHNpZGUgPT0gMSAmJiB0aGlzLm5vcnRoKSB7IHJldHVybiBmYWxzZTsgfSBlbHNlXG4gICAgICAgIGlmIChzaWRlID09IDIgJiYgdGhpcy5lYXN0KSB7IHJldHVybiBmYWxzZTsgfSBlbHNlXG4gICAgICAgIGlmIChzaWRlID09IDMgJiYgdGhpcy5zb3V0aCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBoYXNTaWRlcygpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuICEodGhpcy53ZXN0ICYmIHRoaXMubm9ydGggJiYgdGhpcy5zb3V0aCAmJiB0aGlzLmVhc3QpO1xuICAgIH1cblxuICAgIHNldFNpZGUoc2lkZTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgICAgIGlmIChzaWRlID09IDApIHsgdGhpcy53ZXN0ID0gdHJ1ZTsgfSBlbHNlXG4gICAgICAgIGlmIChzaWRlID09IDEpIHsgdGhpcy5ub3J0aCA9IHRydWU7IH0gZWxzZVxuICAgICAgICBpZiAoc2lkZSA9PSAyKSB7IHRoaXMuZWFzdCA9IHRydWU7IH0gZWxzZVxuICAgICAgICBpZiAoc2lkZSA9PSAzKSB7IHRoaXMuc291dGggPSB0cnVlOyB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxubGV0IE1hcEdlbmVyYXRvciA9IHtcbiAgICBzZWVkOiA8bnVtYmVyPm51bGwsXG4gICAgcHJuZzogPFBSTkc+bnVsbCxcblxuICAgIG1hcDogPEFycmF5PEFycmF5PG51bWJlcj4+Pm51bGwsXG4gICAgcm9vbXM6IDxBcnJheTxSb29tPj5udWxsLFxuICAgIHBsYXllcjogPFZlY3RvcjI+bnVsbCxcbiAgICBzdGFpcnNVcDogPFZlY3RvcjI+bnVsbCxcbiAgICBzdGFpcnNEb3duOiA8VmVjdG9yMj5udWxsLFxuICAgIGluc3RhbmNlczogPEFycmF5PEluc3RhbmNlPj5udWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKHNlZWQ6IG51bWJlciA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5tYXAgPSBudWxsO1xuICAgICAgICB0aGlzLnJvb21zID0gbnVsbDtcbiAgICAgICAgdGhpcy5wbGF5ZXIgPSBudWxsO1xuICAgICAgICB0aGlzLnN0YWlyc1VwID0gbnVsbDtcbiAgICAgICAgdGhpcy5zdGFpcnNEb3duID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbnN0YW5jZXMgPSBbXTtcblxuICAgICAgICB0aGlzLnBybmcgPSBuZXcgUFJORyhzZWVkKTtcbiAgICAgICAgdGhpcy5zZWVkID0gdGhpcy5wcm5nLnNlZWQ7XG4gICAgfSxcblxuICAgIGNyZWF0ZUdyaWQ6IGZ1bmN0aW9uIChzaXplOiBBcnJheTxudW1iZXI+KTogQXJyYXk8QXJyYXk8bnVtYmVyPj4ge1xuICAgICAgICBsZXQgZ3JpZDogQXJyYXk8QXJyYXk8bnVtYmVyPj4gPSBuZXcgQXJyYXkoc2l6ZVsxXSk7XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHNpemVbMV07IHkrKykge1xuICAgICAgICAgICAgZ3JpZFt5XSA9IG5ldyBBcnJheShzaXplWzBdKTtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgc2l6ZVswXTsgeCsrKSB7XG4gICAgICAgICAgICAgICAgZ3JpZFt5XVt4XSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ3JpZDtcbiAgICB9LFxuXG4gICAgY3JlYXRlU3RhcnRSb29tOiBmdW5jdGlvbiAobGV2ZWw6IG51bWJlcik6IFJvb20ge1xuICAgICAgICBsZXQgcm9vbTogUm9vbTtcbiAgICAgICAgaWYgKGxldmVsID09IDEpIHtcbiAgICAgICAgICAgIHJvb20gPSBuZXcgUm9vbSg0MCwgMjQsIDYsIDYpO1xuICAgICAgICAgICAgcm9vbS5zb3V0aCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgeDogbnVtYmVyLCB5OiBudW1iZXIsIHc6IG51bWJlciwgaDogbnVtYmVyO1xuICAgICAgICAgICAgeCA9IE1hdGguZmxvb3IodGhpcy5wcm5nLnJhbmRvbSgpICogNjApO1xuICAgICAgICAgICAgeSA9IE1hdGguZmxvb3IodGhpcy5wcm5nLnJhbmRvbSgpICogMTApO1xuICAgICAgICAgICAgdyA9IDUgKyBNYXRoLmZsb29yKHRoaXMucHJuZy5yYW5kb20oKSAqIDUpO1xuICAgICAgICAgICAgaCA9IDUgKyBNYXRoLmZsb29yKHRoaXMucHJuZy5yYW5kb20oKSAqIDUpO1xuXG4gICAgICAgICAgICByb29tID0gbmV3IFJvb20oeCwgeSwgdywgaCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcm9vbTtcbiAgICB9LFxuXG4gICAgaXNPdXRPZkJvdW5kczogZnVuY3Rpb24gKHg6IG51bWJlciwgeTogbnVtYmVyLCB3OiBudW1iZXIsIGg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gKHggPCAwIHx8IHkgPCAwIHx8IHggKyB3ID49IDg1IHx8IHkgKyBoID49IDMwKTtcbiAgICB9LFxuXG4gICAgaXNDb2xsaXNpb246IGZ1bmN0aW9uICh4OiBudW1iZXIsIHk6IG51bWJlciwgdzogbnVtYmVyLCBoOiBudW1iZXIsIGlnbm9yZTogUm9vbSk6IGJvb2xlYW4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgcjogUm9vbTsgciA9IHRoaXMucm9vbXNbaV07IGkrKykge1xuICAgICAgICAgICAgaWYgKHIgPT0gaWdub3JlKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICAgIGlmICh4ICsgdyA8IHIueCkgeyBjb250aW51ZTsgfVxuICAgICAgICAgICAgaWYgKHkgKyBoIDwgci55KSB7IGNvbnRpbnVlOyB9XG4gICAgICAgICAgICBpZiAoeCA+PSByLnggKyByLncpIHsgY29udGludWU7IH1cbiAgICAgICAgICAgIGlmICh5ID49IHIueSArIHIuaCkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgY3JlYXRlUm9vbTogZnVuY3Rpb24gKHJvb206IFJvb20sIHNpZGU6IG51bWJlciwgaXNSb29tOiBib29sZWFuID0gdHJ1ZSk6IFJvb20ge1xuICAgICAgICBsZXQgZG9vcl94OiBudW1iZXIsIGRvb3JfeTogbnVtYmVyLCB4OiBudW1iZXIsIHk6IG51bWJlciwgdzogbnVtYmVyLCBoOiBudW1iZXI7XG4gICAgICAgIGlmIChzaWRlID09IDApIHtcbiAgICAgICAgICAgIGRvb3JfeCA9IHJvb20ueDtcbiAgICAgICAgICAgIGRvb3JfeSA9IHJvb20ueSArIDEgKyBNYXRoLmZsb29yKHRoaXMucHJuZy5yYW5kb20oKSAqIChyb29tLmggLSAyKSk7XG4gICAgICAgICAgICB3ID0gNSArIE1hdGguZmxvb3IodGhpcy5wcm5nLnJhbmRvbSgpICogNSk7XG4gICAgICAgICAgICBoID0gKCFpc1Jvb20pID8gMyA6IDUgKyBNYXRoLmZsb29yKHRoaXMucHJuZy5yYW5kb20oKSAqIDUpO1xuICAgICAgICAgICAgeCA9IHJvb20ueCAtIHcgKyAxO1xuICAgICAgICAgICAgeSA9IGRvb3JfeSAtIE1hdGguZmxvb3IoaCAvIDIpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5pc091dE9mQm91bmRzKHgsIHksIHcsIGgpKSB7IHJldHVybiBudWxsOyB9XG4gICAgICAgICAgICBpZiAodGhpcy5pc0NvbGxpc2lvbih4LCB5LCB3LCBoLCByb29tKSkgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgICAgICAgICBzaWRlID0gMjtcbiAgICAgICAgICAgIHJvb20ud2VzdCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAoc2lkZSA9PSAxKSB7XG4gICAgICAgICAgICBkb29yX3ggPSByb29tLnggKyAxICsgTWF0aC5mbG9vcih0aGlzLnBybmcucmFuZG9tKCkgKiAocm9vbS53IC0gMikpO1xuICAgICAgICAgICAgZG9vcl95ID0gcm9vbS55O1xuICAgICAgICAgICAgdyA9ICghaXNSb29tKSA/IDMgOiA1ICsgTWF0aC5mbG9vcih0aGlzLnBybmcucmFuZG9tKCkgKiA1KTtcbiAgICAgICAgICAgIGggPSA1ICsgTWF0aC5mbG9vcih0aGlzLnBybmcucmFuZG9tKCkgKiA1KTtcbiAgICAgICAgICAgIHggPSBkb29yX3ggLSBNYXRoLmZsb29yKHcgLyAyKTtcbiAgICAgICAgICAgIHkgPSByb29tLnkgLSBoICsgMTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNPdXRPZkJvdW5kcyh4LCB5LCB3LCBoKSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgICAgICAgaWYgKHRoaXMuaXNDb2xsaXNpb24oeCwgeSwgdywgaCwgcm9vbSkpIHsgcmV0dXJuIG51bGw7IH1cblxuICAgICAgICAgICAgc2lkZSA9IDM7XG4gICAgICAgICAgICByb29tLm5vcnRoID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChzaWRlID09IDIpIHtcbiAgICAgICAgICAgIGRvb3JfeCA9IHJvb20ueCArIHJvb20udyAtIDE7XG4gICAgICAgICAgICBkb29yX3kgPSByb29tLnkgKyAxICsgTWF0aC5mbG9vcih0aGlzLnBybmcucmFuZG9tKCkgKiAocm9vbS5oIC0gMikpO1xuICAgICAgICAgICAgdyA9IDUgKyBNYXRoLmZsb29yKHRoaXMucHJuZy5yYW5kb20oKSAqIDUpO1xuICAgICAgICAgICAgaCA9ICghaXNSb29tKSA/IDMgOiA1ICsgTWF0aC5mbG9vcih0aGlzLnBybmcucmFuZG9tKCkgKiA1KTtcbiAgICAgICAgICAgIHggPSByb29tLnggKyByb29tLncgLSAxO1xuICAgICAgICAgICAgeSA9IGRvb3JfeSAtIE1hdGguZmxvb3IoaCAvIDIpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5pc091dE9mQm91bmRzKHgsIHksIHcsIGgpKSB7IHJldHVybiBudWxsOyB9XG4gICAgICAgICAgICBpZiAodGhpcy5pc0NvbGxpc2lvbih4LCB5LCB3LCBoLCByb29tKSkgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgICAgICAgICBzaWRlID0gMDtcbiAgICAgICAgICAgIHJvb20uZWFzdCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAoc2lkZSA9PSAzKSB7XG4gICAgICAgICAgICBkb29yX3ggPSByb29tLnggKyAxICsgTWF0aC5mbG9vcih0aGlzLnBybmcucmFuZG9tKCkgKiAocm9vbS53IC0gMikpO1xuICAgICAgICAgICAgZG9vcl95ID0gcm9vbS55ICsgcm9vbS5oIC0gMTtcbiAgICAgICAgICAgIHcgPSAoIWlzUm9vbSkgPyAzIDogNSArIE1hdGguZmxvb3IodGhpcy5wcm5nLnJhbmRvbSgpICogNSk7XG4gICAgICAgICAgICBoID0gNSArIE1hdGguZmxvb3IodGhpcy5wcm5nLnJhbmRvbSgpICogNSk7XG4gICAgICAgICAgICB4ID0gZG9vcl94IC0gTWF0aC5mbG9vcih3IC8gMik7XG4gICAgICAgICAgICB5ID0gcm9vbS55ICsgcm9vbS5oIC0gMTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNPdXRPZkJvdW5kcyh4LCB5LCB3LCBoKSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgICAgICAgaWYgKHRoaXMuaXNDb2xsaXNpb24oeCwgeSwgdywgaCwgcm9vbSkpIHsgcmV0dXJuIG51bGw7IH1cblxuICAgICAgICAgICAgc2lkZSA9IDE7XG4gICAgICAgICAgICByb29tLnNvdXRoID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBoYWxsOiBSb29tID0gbmV3IFJvb20oeCwgeSwgdywgaCwgaXNSb29tKTtcbiAgICAgICAgaGFsbC5zZXRTaWRlKHNpZGUpO1xuXG4gICAgICAgIHJvb20uZG9vcnMucHVzaCh7IHg6IGRvb3JfeCwgeTogZG9vcl95LCByb29tOiBoYWxsIH0pO1xuICAgICAgICBoYWxsLmRvb3JzLnB1c2goeyB4OiBkb29yX3gsIHk6IGRvb3JfeSwgcm9vbTogcm9vbSB9KTtcblxuICAgICAgICByZXR1cm4gaGFsbDtcbiAgICB9LFxuXG4gICAgY29ubmVjdEVtcHR5SGFsbHdheXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIHI6IFJvb207IHIgPSB0aGlzLnJvb21zW2ldOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChyLnJvb20pIHsgY29udGludWU7IH1cbiAgICAgICAgICAgIGlmIChyLmRvb3JzLmxlbmd0aCA+IDEpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgbGV0IG5ld1Jvb206IFJvb20gPSBudWxsO1xuICAgICAgICAgICAgbGV0IHRyaWVzOiBudW1iZXIgPSAwO1xuICAgICAgICAgICAgd2hpbGUgKCFuZXdSb29tICYmIHRyaWVzKysgPCAxMCkge1xuICAgICAgICAgICAgICAgIGxldCBzaWRlOiBudW1iZXIgPSBNYXRoLmZsb29yKHRoaXMucHJuZy5yYW5kb20oKSAqIDQpO1xuICAgICAgICAgICAgICAgIHdoaWxlICghci5jaGVja1NpZGUoc2lkZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2lkZSA9IE1hdGguZmxvb3IodGhpcy5wcm5nLnJhbmRvbSgpICogNCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbmV3Um9vbSA9IHRoaXMuY3JlYXRlUm9vbShyLCBzaWRlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5ld1Jvb20pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJvb21zLnB1c2gobmV3Um9vbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVuZGVyT25NYXA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IG1hcDogQXJyYXk8QXJyYXk8bnVtYmVyPj4gPSB0aGlzLm1hcDtcblxuICAgICAgICBmb3IgKGxldCBpID0gMCwgcjogUm9vbTsgciA9IHRoaXMucm9vbXNbaV07IGkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeSA9IHIueTsgeSA8IHIueSArIHIuaDsgeSsrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IHIueDsgeCA8IHIueCArIHIudzsgeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0OiBudW1iZXIgPSAoeSA9PSByLnkgfHwgeCA9PSByLnggfHwgeSA9PSByLnkgKyByLmggLSAxIHx8IHggPT0gci54ICsgci53IC0gMSkgPyA0IDogMTtcbiAgICAgICAgICAgICAgICAgICAgbWFwW3ldW3hdID0gdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwLCBkcjogRG9vcjsgZHIgPSByLmRvb3JzW2pdOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIWRyLnJvb20uYWN0aXZlKSB7IGNvbnRpbnVlOyB9XG4gICAgICAgICAgICAgICAgbWFwW2RyLnldW2RyLnhdID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjcmVhdGVQbGF5ZXJQb3NpdGlvbjogZnVuY3Rpb24gKGxldmVsOiBudW1iZXIpIHtcbiAgICAgICAgbGV0IHI6IFJvb20gPSB0aGlzLnJvb21zWzBdO1xuXG4gICAgICAgIGlmIChsZXZlbCA9PSAxKSB7XG4gICAgICAgICAgICB0aGlzLnBsYXllciA9IHtcbiAgICAgICAgICAgICAgICB4OiA0MyxcbiAgICAgICAgICAgICAgICB5OiAyOFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucGxheWVyID0ge1xuICAgICAgICAgICAgICAgIHg6IHIueCArIDIgKyBNYXRoLmZsb29yKHRoaXMucHJuZy5yYW5kb20oKSAqIChyLncgLSA0KSksXG4gICAgICAgICAgICAgICAgeTogci55ICsgMiArIE1hdGguZmxvb3IodGhpcy5wcm5nLnJhbmRvbSgpICogKHIuaCAtIDQpKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjcmVhdGVTdGFpcnM6IGZ1bmN0aW9uIChsZXZlbDogbnVtYmVyKSB7XG4gICAgICAgIGlmIChsZXZlbCA+IDEgJiYgbGV2ZWwgPCAyMCkge1xuICAgICAgICAgICAgdGhpcy5zdGFpcnNVcCA9IHtcbiAgICAgICAgICAgICAgICB4OiB0aGlzLnBsYXllci54LFxuICAgICAgICAgICAgICAgIHk6IHRoaXMucGxheWVyLnlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGV2ZWwgPCAyMCkge1xuICAgICAgICAgICAgbGV0IHJvb206IFJvb20gPSB0aGlzLnJvb21zWzEgKyAoKHRoaXMucHJuZy5yYW5kb20oKSAqICh0aGlzLnJvb21zLmxlbmd0aCAtIDEpKSA8PCAwKV07XG4gICAgICAgICAgICB3aGlsZSAoIXJvb20ucm9vbSkge1xuICAgICAgICAgICAgICAgIHJvb20gPSB0aGlzLnJvb21zWzEgKyAoKHRoaXMucHJuZy5yYW5kb20oKSAqICh0aGlzLnJvb21zLmxlbmd0aCAtIDEpKSA8PCAwKV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc3RhaXJzRG93biA9IHtcbiAgICAgICAgICAgICAgICB4OiByb29tLnggKyAyICsgTWF0aC5mbG9vcih0aGlzLnBybmcucmFuZG9tKCkgKiAocm9vbS53IC0gNCkpLFxuICAgICAgICAgICAgICAgIHk6IHJvb20ueSArIDIgKyBNYXRoLmZsb29yKHRoaXMucHJuZy5yYW5kb20oKSAqIChyb29tLmggLSA0KSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaXNTb2xpZDogZnVuY3Rpb24gKHg6IG51bWJlciwgeTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICh0aGlzLnN0YWlyc0Rvd24gJiYgdGhpcy5zdGFpcnNEb3duLnggPT0geCAmJiB0aGlzLnN0YWlyc0Rvd24ueSA9PSB5KSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgIGlmICh0aGlzLnN0YWlyc1VwICYmIHRoaXMuc3RhaXJzVXAueCA9PSB4ICYmIHRoaXMuc3RhaXJzVXAueSA9PSB5KSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgIGlmICh0aGlzLnBsYXllciAmJiB0aGlzLnBsYXllci54ID09IHggJiYgdGhpcy5wbGF5ZXIueSA9PSB5KSB7IHJldHVybiB0cnVlOyB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGluczogSW5zdGFuY2U7IGlucyA9IHRoaXMuaW5zdGFuY2VzW2ldOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpbnMueCA9PSB4ICYmIGlucy55ID09IHkpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgY3JlYXRlSW5zdGFuY2VzOiBmdW5jdGlvbiAobGV2ZWw6IG51bWJlcikge1xuICAgICAgICBsZXQgaXRlbXM6IEFycmF5PFtzdHJpbmcsIG51bWJlcl0+LFxuICAgICAgICAgICAgZW5lbWllczogQXJyYXk8W3N0cmluZywgbnVtYmVyXT4sXG4gICAgICAgICAgICBudW1JdGVtczogbnVtYmVyLFxuICAgICAgICAgICAgbnVtRW5lbWllczogbnVtYmVyLFxuICAgICAgICAgICAgZ29sZDogbnVtYmVyLFxuICAgICAgICAgICAgcm9vbTogUm9vbSxcbiAgICAgICAgICAgIHg6IG51bWJlcixcbiAgICAgICAgICAgIHk6IG51bWJlcjtcblxuICAgICAgICBpZiAobGV2ZWwgPT0gMSkge1xuICAgICAgICAgICAgaXRlbXMgPSBbW1wicmVkUG90aW9uXCIsIDE1XSwgW1wiYmx1ZVBvdGlvblwiLCAxNV0sIFtcImdyZWVuUG90aW9uXCIsIDE1XSwgW1wiZGFnZ2VyXCIsIDE1XSwgW1wic2hvcnRTd29yZFwiLCA1XSwgW1wibGVhdGhlckFybW9yXCIsIDEwXV07XG4gICAgICAgICAgICBlbmVtaWVzID0gW1tcInJhdFwiLCA2MF0sIFtcInNwaWRlclwiLCAxNV0sIFtcImtvYm9sZFwiLCA1MF1dO1xuICAgICAgICAgICAgbnVtSXRlbXMgPSA1O1xuICAgICAgICAgICAgbnVtRW5lbWllcyA9IDU7XG4gICAgICAgICAgICBnb2xkID0gMztcbiAgICAgICAgfSBlbHNlIGlmIChsZXZlbCA9PSAyKSB7XG4gICAgICAgICAgICBpdGVtcyA9IFtbXCJyZWRQb3Rpb25cIiwgMTBdLCBbXCJibHVlUG90aW9uXCIsIDEwXSwgW1wieWVsbG93UG90aW9uXCIsIDEwXSwgW1wiZ3JlZW5Qb3Rpb25cIiwgMTBdLCBbXCJkYWdnZXJcIiwgMTVdLCBbXCJzaG9ydFN3b3JkXCIsIDVdLCBbXCJsZWF0aGVyQXJtb3JcIiwgMTBdXTtcbiAgICAgICAgICAgIGVuZW1pZXMgPSBbW1wicmF0XCIsIDUwXSwgW1wic3BpZGVyXCIsIDMwXSwgW1wia29ib2xkXCIsIDUwXV07XG4gICAgICAgICAgICBudW1JdGVtcyA9IDU7XG4gICAgICAgICAgICBudW1FbmVtaWVzID0gNztcbiAgICAgICAgICAgIGdvbGQgPSAzO1xuICAgICAgICB9IGVsc2UgaWYgKGxldmVsID09IDMpIHtcbiAgICAgICAgICAgIGl0ZW1zID0gW1tcInJlZFBvdGlvblwiLCA4XSwgW1wiYmx1ZVBvdGlvblwiLCA4XSwgW1wieWVsbG93UG90aW9uXCIsIDhdLCBbXCJncmVlblBvdGlvblwiLCA4XSwgW1wiYXF1YVBvdGlvblwiLCA4XSwgW1wiZGFnZ2VyXCIsIDEwXSwgW1wic2hvcnRTd29yZFwiLCAxMF0sIFtcImxlYXRoZXJBcm1vclwiLCA2XV07XG4gICAgICAgICAgICBlbmVtaWVzID0gW1tcImltcFwiLCAzMF0sIFtcInNwaWRlclwiLCA1MF0sIFtcImtvYm9sZFwiLCA3MF1dO1xuICAgICAgICAgICAgbnVtSXRlbXMgPSA0O1xuICAgICAgICAgICAgbnVtRW5lbWllcyA9IDg7XG4gICAgICAgICAgICBnb2xkID0gNDtcbiAgICAgICAgfSBlbHNlIGlmIChsZXZlbCA9PSA0KSB7XG4gICAgICAgICAgICBpdGVtcyA9IFtbXCJyZWRQb3Rpb25cIiwgNV0sIFtcImJsdWVQb3Rpb25cIiwgNV0sIFtcInllbGxvd1BvdGlvblwiLCA1XSwgW1wiZ3JlZW5Qb3Rpb25cIiwgNl0sIFtcImFxdWFQb3Rpb25cIiwgNV0sIFtcInB1cnBsZVBvdGlvblwiLCA1XSwgW1wiZGFnZ2VyXCIsIDEwXSwgW1wic2hvcnRTd29yZFwiLCAyMF0sIFtcImxvbmdTd29yZFwiLCAxMF0sIFtcIm1hY2VcIiwgMTBdLCBbXCJsZWF0aGVyQXJtb3JcIiwgMTBdLCBbXCJzY2FsZU1haWxcIiwgMTBdXTtcbiAgICAgICAgICAgIGVuZW1pZXMgPSBbW1wiaW1wXCIsIDUwXSwgW1wic3BpZGVyXCIsIDIwXSwgW1wia29ib2xkXCIsIDUwXV07XG4gICAgICAgICAgICBudW1JdGVtcyA9IDg7XG4gICAgICAgICAgICBudW1FbmVtaWVzID0gMTA7XG4gICAgICAgICAgICBnb2xkID0gNTtcbiAgICAgICAgfSBlbHNlIGlmIChsZXZlbCA9PSA1KSB7XG4gICAgICAgICAgICBpdGVtcyA9IFtbXCJyZWRQb3Rpb25cIiwgNV0sIFtcImJsdWVQb3Rpb25cIiwgNV0sIFtcInllbGxvd1BvdGlvblwiLCA1XSwgW1wiZ3JlZW5Qb3Rpb25cIiwgNl0sIFtcImFxdWFQb3Rpb25cIiwgNV0sIFtcInB1cnBsZVBvdGlvblwiLCA1XSwgW1wid2hpdGVQb3Rpb25cIiwgNV0sIFtcImRhZ2dlclwiLCAxMF0sIFtcInNob3J0U3dvcmRcIiwgMjBdLCBbXCJsb25nU3dvcmRcIiwgMTBdLCBbXCJtYWNlXCIsIDEwXSwgW1wibGVhdGhlckFybW9yXCIsIDEwXSwgW1wic2NhbGVNYWlsXCIsIDEwXV07XG4gICAgICAgICAgICBlbmVtaWVzID0gW1tcImltcFwiLCA1MF0sIFtcInNwaWRlclwiLCAxMF0sIFtcImtvYm9sZFwiLCA1MF0sIFtcImdvYmxpblwiLCA0MF0sIFtcInpvbWJpZVwiLCAyMF1dO1xuICAgICAgICAgICAgbnVtSXRlbXMgPSA4O1xuICAgICAgICAgICAgbnVtRW5lbWllcyA9IDEyO1xuICAgICAgICAgICAgZ29sZCA9IDc7XG4gICAgICAgIH0gZWxzZSBpZiAobGV2ZWwgPT0gNikge1xuICAgICAgICAgICAgaXRlbXMgPSBbW1wicmVkUG90aW9uXCIsIDVdLCBbXCJibHVlUG90aW9uXCIsIDVdLCBbXCJ5ZWxsb3dQb3Rpb25cIiwgNV0sIFtcImdyZWVuUG90aW9uXCIsIDZdLCBbXCJhcXVhUG90aW9uXCIsIDVdLCBbXCJwdXJwbGVQb3Rpb25cIiwgNV0sIFtcIndoaXRlUG90aW9uXCIsIDVdLCBbXCJ0YW5Qb3Rpb25cIiwgNV0sIFtcInNwZWFyXCIsIDEwXSwgW1wic2hvcnRTd29yZFwiLCAyMF0sIFtcImxvbmdTd29yZFwiLCAxMF0sIFtcIm1hY2VcIiwgMTBdLCBbXCJsZWF0aGVyQXJtb3JcIiwgMTBdLCBbXCJzY2FsZU1haWxcIiwgMTBdXTtcbiAgICAgICAgICAgIGVuZW1pZXMgPSBbW1wiaW1wXCIsIDQwXSwgW1wicm9ndWVcIiwgMTBdLCBbXCJrb2JvbGRcIiwgNTBdLCBbXCJnb2JsaW5cIiwgNDBdLCBbXCJ6b21iaWVcIiwgMjBdXTtcbiAgICAgICAgICAgIG51bUl0ZW1zID0gMTA7XG4gICAgICAgICAgICBudW1FbmVtaWVzID0gMTI7XG4gICAgICAgICAgICBnb2xkID0gODtcbiAgICAgICAgfSBlbHNlIGlmIChsZXZlbCA9PSA3KSB7XG4gICAgICAgICAgICBpdGVtcyA9IFtbXCJyZWRQb3Rpb25cIiwgNV0sIFtcImJsdWVQb3Rpb25cIiwgNV0sIFtcInllbGxvd1BvdGlvblwiLCA1XSwgW1wiZ3JlZW5Qb3Rpb25cIiwgNl0sIFtcImFxdWFQb3Rpb25cIiwgNV0sIFtcInB1cnBsZVBvdGlvblwiLCA1XSwgW1wid2hpdGVQb3Rpb25cIiwgNV0sIFtcInRhblBvdGlvblwiLCA1XSwgW1wib3JhbmdlUG90aW9uXCIsIDVdLCBbXCJzcGVhclwiLCAxMF0sIFtcInNob3J0U3dvcmRcIiwgMjBdLCBbXCJsb25nU3dvcmRcIiwgMTBdLCBbXCJtYWNlXCIsIDEwXSwgW1wibGVhdGhlckFybW9yXCIsIDEwXSwgW1wic2NhbGVNYWlsXCIsIDEwXV07XG4gICAgICAgICAgICBlbmVtaWVzID0gW1tcImltcFwiLCAzMF0sIFtcInJvZ3VlXCIsIDIwXSwgW1wiYmVnZ2FyXCIsIDUwXSwgW1wiZ29ibGluXCIsIDQwXSwgW1wiem9tYmllXCIsIDMwXV07XG4gICAgICAgICAgICBudW1JdGVtcyA9IDEwO1xuICAgICAgICAgICAgbnVtRW5lbWllcyA9IDE0O1xuICAgICAgICAgICAgZ29sZCA9IDg7XG4gICAgICAgIH0gZWxzZSBpZiAobGV2ZWwgPT0gOCkge1xuICAgICAgICAgICAgaXRlbXMgPSBbW1wicmVkUG90aW9uXCIsIDVdLCBbXCJibHVlUG90aW9uXCIsIDVdLCBbXCJ5ZWxsb3dQb3Rpb25cIiwgNV0sIFtcImdyZWVuUG90aW9uXCIsIDZdLCBbXCJhcXVhUG90aW9uXCIsIDVdLCBbXCJwdXJwbGVQb3Rpb25cIiwgNV0sIFtcIndoaXRlUG90aW9uXCIsIDVdLCBbXCJ0YW5Qb3Rpb25cIiwgNV0sIFtcIm9yYW5nZVBvdGlvblwiLCA1XSwgW1wic3BlYXJcIiwgMTBdLCBbXCJzaG9ydFN3b3JkXCIsIDIwXSwgW1wibG9uZ1N3b3JkXCIsIDEwXSwgW1wibWFjZVwiLCAxMF0sIFtcImF4ZVwiLCAxMF0sIFtcImNoYWltTWFpbFwiLCA1XSwgW1wic2NhbGVNYWlsXCIsIDEwXV07XG4gICAgICAgICAgICBlbmVtaWVzID0gW1tcImltcFwiLCAzMF0sIFtcInJvZ3VlXCIsIDIwXSwgW1wiYmVnZ2FyXCIsIDUwXSwgW1wiZ29ibGluXCIsIDQwXSwgW1wiem9tYmllXCIsIDMwXSwgW1wic2hhZG93XCIsIDEwXSwgW1widGhpZWZcIiwgMzBdXTtcbiAgICAgICAgICAgIG51bUl0ZW1zID0gMTE7XG4gICAgICAgICAgICBudW1FbmVtaWVzID0gMTY7XG4gICAgICAgICAgICBnb2xkID0gMTA7XG4gICAgICAgIH0gZWxzZSBpZiAobGV2ZWwgPT0gOSkge1xuICAgICAgICAgICAgaXRlbXMgPSBbW1wicmVkUG90aW9uXCIsIDVdLCBbXCJibHVlUG90aW9uXCIsIDVdLCBbXCJ5ZWxsb3dQb3Rpb25cIiwgNV0sIFtcImdyZWVuUG90aW9uXCIsIDZdLCBbXCJhcXVhUG90aW9uXCIsIDVdLCBbXCJwdXJwbGVQb3Rpb25cIiwgNV0sIFtcIndoaXRlUG90aW9uXCIsIDVdLCBbXCJ0YW5Qb3Rpb25cIiwgNV0sIFtcIm9yYW5nZVBvdGlvblwiLCA1XSwgW1wic3BlYXJcIiwgMTBdLCBbXCJzaG9ydFN3b3JkXCIsIDIwXSwgW1wibG9uZ1N3b3JkXCIsIDEwXSwgW1wibWFjZVwiLCAxMF0sIFtcImF4ZVwiLCAxMF0sIFtcImNoYWltTWFpbFwiLCA1XSwgW1wic2NhbGVNYWlsXCIsIDEwXV07XG4gICAgICAgICAgICBlbmVtaWVzID0gW1tcInJvZ3VlXCIsIDIwXSwgW1wiYmVnZ2FyXCIsIDUwXSwgW1wiZ29ibGluXCIsIDQwXSwgW1wiem9tYmllXCIsIDMwXSwgW1wic2hhZG93XCIsIDMwXSwgW1widGhpZWZcIiwgMzBdXTtcbiAgICAgICAgICAgIG51bUl0ZW1zID0gMTE7XG4gICAgICAgICAgICBudW1FbmVtaWVzID0gMTc7XG4gICAgICAgICAgICBnb2xkID0gMTA7XG4gICAgICAgIH0gZWxzZSBpZiAobGV2ZWwgPj0gMTAgJiYgbGV2ZWwgPD0gMTQpIHtcbiAgICAgICAgICAgIGl0ZW1zID0gW1tcInJlZFBvdGlvblwiLCA1XSwgW1wiYmx1ZVBvdGlvblwiLCA1XSwgW1wieWVsbG93UG90aW9uXCIsIDVdLCBbXCJncmVlblBvdGlvblwiLCA2XSwgW1wiYXF1YVBvdGlvblwiLCA1XSwgW1wicHVycGxlUG90aW9uXCIsIDVdLCBbXCJ3aGl0ZVBvdGlvblwiLCA1XSwgW1widGFuUG90aW9uXCIsIDVdLCBbXCJvcmFuZ2VQb3Rpb25cIiwgNV0sIFtcInNwZWFyXCIsIDEwXSwgW1wic2hvcnRTd29yZFwiLCAyMF0sIFtcImxvbmdTd29yZFwiLCAxMF0sIFtcIm1hY2VcIiwgMTBdLCBbXCJheGVcIiwgMTBdLCBbXCJjaGFpbU1haWxcIiwgNV0sIFtcInNjYWxlTWFpbFwiLCAxMF1dO1xuICAgICAgICAgICAgZW5lbWllcyA9IFtbXCJyYXRcIiwgM10sIFtcInNwaWRlclwiLCAzXSwgW1wia29ib2xkXCIsIDNdLCBbXCJpbXBcIiwgM10sIFtcImdvYmxpblwiLCA1XSwgW1wiem9tYmllXCIsIDddLCBbXCJvZ3JlXCIsIDEwXSwgW1wiYmVnZ2FyXCIsIDEwXSwgW1wic2hhZG93XCIsIDIwXSwgW1widGhpZWZcIiwgMjBdLCBbXCJyb2d1ZVwiLCAzMF0sIFtcImNhb3NLbmlnaHRcIiwgMzBdLCBbXCJsaXphcmRXYXJyaW9yXCIsIDEwXSwgW1wib3BoaWRpYW5cIiwgMTBdLCBbXCJjYW9zU2VydmFudFwiLCA3XSwgW1wid3l2ZXJuS25pZ2h0XCIsIDVdLCBbXCJjYW9zTG9yZFwiLCAzXV07XG4gICAgICAgICAgICBudW1JdGVtcyA9IDEzO1xuICAgICAgICAgICAgbnVtRW5lbWllcyA9IDE3ICsgKGxldmVsIC0gMTApICogMjtcbiAgICAgICAgICAgIGdvbGQgPSAxMjtcbiAgICAgICAgfSBlbHNlIGlmIChsZXZlbCA+PSAxNSAmJiBsZXZlbCA8PSAxOSkge1xuICAgICAgICAgICAgaXRlbXMgPSBbW1wicmVkUG90aW9uXCIsIDVdLCBbXCJibHVlUG90aW9uXCIsIDVdLCBbXCJ5ZWxsb3dQb3Rpb25cIiwgNV0sIFtcImdyZWVuUG90aW9uXCIsIDZdLCBbXCJhcXVhUG90aW9uXCIsIDVdLCBbXCJwdXJwbGVQb3Rpb25cIiwgNV0sIFtcIndoaXRlUG90aW9uXCIsIDVdLCBbXCJ0YW5Qb3Rpb25cIiwgNV0sIFtcIm9yYW5nZVBvdGlvblwiLCA1XSwgW1wic3BlYXJcIiwgMTBdLCBbXCJzaG9ydFN3b3JkXCIsIDIwXSwgW1wibG9uZ1N3b3JkXCIsIDEwXSwgW1wibWFjZVwiLCAxMF0sIFtcImF4ZVwiLCAxMF0sIFtcImNoYWltTWFpbFwiLCA1XSwgW1wic2NhbGVNYWlsXCIsIDEwXV07XG4gICAgICAgICAgICBlbmVtaWVzID0gW1tcInJhdFwiLCAxXSwgW1wic3BpZGVyXCIsIDFdLCBbXCJrb2JvbGRcIiwgMV0sIFtcImltcFwiLCAxXSwgW1wiZ29ibGluXCIsIDNdLCBbXCJ6b21iaWVcIiwgNV0sIFtcIm9ncmVcIiwgN10sIFtcImJlZ2dhclwiLCAzXSwgW1wic2hhZG93XCIsIDEwXSwgW1widGhpZWZcIiwgMzBdLCBbXCJyb2d1ZVwiLCA0MF0sIFtcImNhb3NLbmlnaHRcIiwgNDBdLCBbXCJsaXphcmRXYXJyaW9yXCIsIDIwXSwgW1wib3BoaWRpYW5cIiwgMjBdLCBbXCJjYW9zU2VydmFudFwiLCAyMF0sIFtcInd5dmVybktuaWdodFwiLCAyMF0sIFtcImNhb3NMb3JkXCIsIDIwXV07XG4gICAgICAgICAgICBudW1JdGVtcyA9IDE1O1xuICAgICAgICAgICAgbnVtRW5lbWllcyA9IDIwICsgKGxldmVsIC0gMTUpICogMjtcbiAgICAgICAgICAgIGdvbGQgPSAxNDtcbiAgICAgICAgfSBlbHNlIGlmIChsZXZlbCA9PSAyMCkge1xuICAgICAgICAgICAgaXRlbXMgPSBbXTtcbiAgICAgICAgICAgIGVuZW1pZXMgPSBbW1wic29kaVwiLCAyMDBdXTtcbiAgICAgICAgICAgIG51bUl0ZW1zID0gMDtcbiAgICAgICAgICAgIG51bUVuZW1pZXMgPSAxO1xuICAgICAgICAgICAgZ29sZCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtSXRlbXM7IGkrKykge1xuICAgICAgICAgICAgbGV0IGl0ZW1Db2RlOiBbc3RyaW5nLCBudW1iZXJdID0gaXRlbXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogaXRlbXMubGVuZ3RoKV07XG4gICAgICAgICAgICBpZiAodGhpcy5wcm5nLnJhbmRvbSgpICogMTAwID4gaXRlbUNvZGVbMV0pIHtcbiAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJvb20gPSB0aGlzLnJvb21zWzEgKyAoKHRoaXMucHJuZy5yYW5kb20oKSAqICh0aGlzLnJvb21zLmxlbmd0aCAtIDEpKSA8PCAwKV07XG4gICAgICAgICAgICB3aGlsZSAoIXJvb20ucm9vbSkge1xuICAgICAgICAgICAgICAgIHJvb20gPSB0aGlzLnJvb21zWzEgKyAoKHRoaXMucHJuZy5yYW5kb20oKSAqICh0aGlzLnJvb21zLmxlbmd0aCAtIDEpKSA8PCAwKV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHggPSByb29tLnggKyAxICsgTWF0aC5mbG9vcih0aGlzLnBybmcucmFuZG9tKCkgKiAocm9vbS53IC0gMikpO1xuICAgICAgICAgICAgeSA9IHJvb20ueSArIDEgKyBNYXRoLmZsb29yKHRoaXMucHJuZy5yYW5kb20oKSAqIChyb29tLmggLSAyKSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzU29saWQoeCwgeSkpIHtcbiAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VzLnB1c2goe1xuICAgICAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgICAgICB0eXBlOiAnaXRlbScsXG4gICAgICAgICAgICAgICAgY29kZTogaXRlbUNvZGVbMF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1FbmVtaWVzOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBlbmVteUNvZGU6IFtzdHJpbmcsIG51bWJlcl0gPSBlbmVtaWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGVuZW1pZXMubGVuZ3RoKV07XG4gICAgICAgICAgICBpZiAodGhpcy5wcm5nLnJhbmRvbSgpICogMTAwID4gZW5lbXlDb2RlWzFdKSB7XG4gICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByb29tID0gdGhpcy5yb29tc1sxICsgKCh0aGlzLnBybmcucmFuZG9tKCkgKiAodGhpcy5yb29tcy5sZW5ndGggLSAxKSkgPDwgMCldO1xuICAgICAgICAgICAgd2hpbGUgKCFyb29tLnJvb20pIHtcbiAgICAgICAgICAgICAgICByb29tID0gdGhpcy5yb29tc1sxICsgKCh0aGlzLnBybmcucmFuZG9tKCkgKiAodGhpcy5yb29tcy5sZW5ndGggLSAxKSkgPDwgMCldO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB4ID0gcm9vbS54ICsgMSArIE1hdGguZmxvb3IodGhpcy5wcm5nLnJhbmRvbSgpICogKHJvb20udyAtIDIpKTtcbiAgICAgICAgICAgIHkgPSByb29tLnkgKyAxICsgTWF0aC5mbG9vcih0aGlzLnBybmcucmFuZG9tKCkgKiAocm9vbS5oIC0gMikpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5pc1NvbGlkKHgsIHkpKSB7XG4gICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmluc3RhbmNlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICAgICAgdHlwZTogJ2VuZW15JyxcbiAgICAgICAgICAgICAgICBjb2RlOiBlbmVteUNvZGVbMF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnb2xkOyBpKyspIHtcbiAgICAgICAgICAgIHJvb20gPSB0aGlzLnJvb21zWzEgKyAoKHRoaXMucHJuZy5yYW5kb20oKSAqICh0aGlzLnJvb21zLmxlbmd0aCAtIDEpKSA8PCAwKV07XG4gICAgICAgICAgICB3aGlsZSAoIXJvb20ucm9vbSkge1xuICAgICAgICAgICAgICAgIHJvb20gPSB0aGlzLnJvb21zWzEgKyAoKHRoaXMucHJuZy5yYW5kb20oKSAqICh0aGlzLnJvb21zLmxlbmd0aCAtIDEpKSA8PCAwKV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHggPSByb29tLnggKyAxICsgTWF0aC5mbG9vcih0aGlzLnBybmcucmFuZG9tKCkgKiAocm9vbS53IC0gMikpO1xuICAgICAgICAgICAgeSA9IHJvb20ueSArIDEgKyBNYXRoLmZsb29yKHRoaXMucHJuZy5yYW5kb20oKSAqIChyb29tLmggLSAyKSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzU29saWQoeCwgeSkpIHtcbiAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBhbW91bnQ6IG51bWJlciA9IDEwICsgTWF0aC5mbG9vcih0aGlzLnBybmcucmFuZG9tKCkgKiAzMCk7XG4gICAgICAgICAgICB0aGlzLmluc3RhbmNlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICAgICAgdHlwZTogJ2dvbGQnLFxuICAgICAgICAgICAgICAgIGFtb3VudDogYW1vdW50XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZW5lcmF0ZU1hcDogZnVuY3Rpb24gKGxldmVsOiBudW1iZXIpOiBNYXBEZWZpbml0aW9uIHtcbiAgICAgICAgdmFyIHNpemUgPSBbNzUgKyAyMCAqIGxldmVsLCAyMCArIDEwICogbGV2ZWxdO1xuICAgICAgICB0aGlzLm1hcCA9IHRoaXMuY3JlYXRlR3JpZChzaXplKTtcbiAgICAgICAgdGhpcy5yb29tcyA9IFt0aGlzLmNyZWF0ZVN0YXJ0Um9vbShsZXZlbCldO1xuXG4gICAgICAgIGxldCByb29tc1RhcmdldDogbnVtYmVyID0gMTQgKyBsZXZlbDtcbiAgICAgICAgbGV0IHJvb21zQ3JlYXRlZDogbnVtYmVyID0gMTtcblxuICAgICAgICBsZXQgdHJpZXM6IG51bWJlciA9IDA7XG4gICAgICAgIHdoaWxlIChyb29tc0NyZWF0ZWQgPCByb29tc1RhcmdldCkge1xuICAgICAgICAgICAgaWYgKHRyaWVzKysgPj0gMTAwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCByOiBSb29tID0gdGhpcy5yb29tc1sodGhpcy5wcm5nLnJhbmRvbSgpICogdGhpcy5yb29tcy5sZW5ndGgpIDw8IDBdO1xuICAgICAgICAgICAgd2hpbGUgKCFyLmhhc1NpZGVzKCkpIHtcbiAgICAgICAgICAgICAgICByID0gdGhpcy5yb29tc1sodGhpcy5wcm5nLnJhbmRvbSgpICogdGhpcy5yb29tcy5sZW5ndGgpIDw8IDBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgc2lkZTogbnVtYmVyID0gTWF0aC5mbG9vcih0aGlzLnBybmcucmFuZG9tKCkgKiA0KTtcbiAgICAgICAgICAgIHdoaWxlICghci5jaGVja1NpZGUoc2lkZSkpIHtcbiAgICAgICAgICAgICAgICBzaWRlID0gTWF0aC5mbG9vcih0aGlzLnBybmcucmFuZG9tKCkgKiA0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGZlYXR1cmU6IG51bWJlciA9IE1hdGguZmxvb3IodGhpcy5wcm5nLnJhbmRvbSgpICogMik7XG4gICAgICAgICAgICBsZXQgbmV3Um9vbTogUm9vbTtcbiAgICAgICAgICAgIGlmIChmZWF0dXJlID09IDApIHtcbiAgICAgICAgICAgICAgICBuZXdSb29tID0gdGhpcy5jcmVhdGVSb29tKHIsIHNpZGUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBpZiAobmV3Um9vbSkge1xuICAgICAgICAgICAgICAgICAgICB0cmllcyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm9vbXMucHVzaChuZXdSb29tKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5ld1Jvb20gPSB0aGlzLmNyZWF0ZVJvb20ociwgc2lkZSk7XG4gICAgICAgICAgICAgICAgaWYgKG5ld1Jvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgdHJpZXMgPSAwO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJvb21zLnB1c2gobmV3Um9vbSk7XG4gICAgICAgICAgICAgICAgICAgIHJvb21zQ3JlYXRlZCArPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29ubmVjdEVtcHR5SGFsbHdheXMoKTtcblxuICAgICAgICB0aGlzLmNyZWF0ZVBsYXllclBvc2l0aW9uKGxldmVsKTtcbiAgICAgICAgdGhpcy5jcmVhdGVTdGFpcnMobGV2ZWwpO1xuICAgICAgICB0aGlzLmNyZWF0ZUluc3RhbmNlcyhsZXZlbCk7XG5cbiAgICAgICAgdGhpcy5yZW5kZXJPbk1hcCgpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtYXA6IHRoaXMubWFwLFxuICAgICAgICAgICAgcGxheWVyOiB0aGlzLnBsYXllcixcbiAgICAgICAgICAgIHN0YWlyc1VwOiB0aGlzLnN0YWlyc1VwLFxuICAgICAgICAgICAgc3RhaXJzRG93bjogdGhpcy5zdGFpcnNEb3duLFxuICAgICAgICAgICAgaW5zdGFuY2VzOiB0aGlzLmluc3RhbmNlc1xuICAgICAgICB9O1xuICAgIH1cbn07XG5cbmV4cG9ydCB7IE1hcEdlbmVyYXRvciwgTWFwRGVmaW5pdGlvbiwgSW5zdGFuY2UgYXMgTUdJbnN0YW5jZSB9OyIsIu+7v2ltcG9ydCB7IENvbG9ycywgVGlsZVByZWZhYiwgVGlsZXNQcmVmYWJzIH0gZnJvbSAnLi9QcmVmYWJzJztcbmltcG9ydCB7IFBsYXllclN0YXRzIH0gZnJvbSAnLi9QbGF5ZXJTdGF0cyc7XG5pbXBvcnQgeyBJbnB1dCB9IGZyb20gJy4vZW5naW5lL0lucHV0JztcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSAnLi9VdGlscyc7XG5pbXBvcnQgeyBNYXAgfSBmcm9tICcuL01hcCc7XG5pbXBvcnQgeyBWZWN0b3IyIH0gZnJvbSAnLi9lbmdpbmUvVmVjdG9yMic7XG5pbXBvcnQgeyBJbnN0YW5jZSB9IGZyb20gJy4vSW5zdGFuY2UnO1xuaW1wb3J0IHsgRW5lbXkgfSBmcm9tICcuL0VuZW15JztcbmltcG9ydCB7IFdvcmxkRW5lbXkgfSBmcm9tICcuL0VuZW15RmFjdG9yeSc7XG5cbmludGVyZmFjZSBNb3VzZVBvc2l0aW9uIGV4dGVuZHMgVmVjdG9yMiB7XG4gICAgc3RhdDogbnVtYmVyXG59O1xuXG5pbnRlcmZhY2UgS2V5IHtcbiAgICBbaW5kZXg6IHN0cmluZ10gOiBudW1iZXJcbn07XG5cbmNsYXNzIFBsYXllciBleHRlbmRzIEluc3RhbmNlIHtcbiAgICBtb3ZlUGF0aDogQXJyYXk8bnVtYmVyPjtcbiAgICBhdXRvTW92ZURlbGF5OiBudW1iZXI7XG4gICAgbW92ZVdhaXQ6IG51bWJlcjtcblxuICAgIGtleXM6S2V5ID0ge1xuICAgICAgICBVUDogMCxcbiAgICAgICAgTEVGVDogMCxcbiAgICAgICAgRE9XTjogMCxcbiAgICAgICAgUklHSFQ6IDAsXG4gICAgICAgIFJFU1Q6IDBcbiAgICB9O1xuXG4gICAgbW91c2U6IE1vdXNlUG9zaXRpb247XG5cbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlciwgbWFwOiBNYXApIHtcbiAgICAgICAgc3VwZXIoeCwgeSwgbWFwLCBUaWxlc1ByZWZhYnMuUExBWUVSKTtcblxuICAgICAgICB0aGlzLm1vdmVQYXRoID0gbnVsbDtcbiAgICAgICAgdGhpcy5hdXRvTW92ZURlbGF5ID0gMDtcbiAgICAgICAgdGhpcy5tb3ZlV2FpdCA9IDQ7XG5cbiAgICAgICAgdGhpcy5rZXlzID0ge1xuICAgICAgICAgICAgVVA6IDAsXG4gICAgICAgICAgICBMRUZUOiAwLFxuICAgICAgICAgICAgRE9XTjogMCxcbiAgICAgICAgICAgIFJJR0hUOiAwLFxuXG4gICAgICAgICAgICBSRVNUOiAwXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5tb3VzZSA9IHtcbiAgICAgICAgICAgIHg6IC0xLFxuICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgIHN0YXQ6IC0xXG4gICAgICAgIH07XG5cbiAgICAgICAgSW5wdXQuYWRkS2V5RG93bkxpc3RlbmVyKChrZXlDb2RlOiBudW1iZXIsIHN0YXQ6IG51bWJlcikgPT4geyB0aGlzLmhhbmRsZUtleUV2ZW50KGtleUNvZGUsIHN0YXQpOyB9KTtcbiAgICAgICAgSW5wdXQuYWRkTW91c2VNb3ZlTGlzdGVuZXIoKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB7IHRoaXMub25Nb3VzZU1vdmUoeCwgeSk7IH0pO1xuICAgICAgICBJbnB1dC5hZGRNb3VzZURvd25MaXN0ZW5lcigoeDogbnVtYmVyLCB5OiBudW1iZXIsIHN0YXQ6IG51bWJlcikgPT4geyB0aGlzLm9uTW91c2VIYW5kbGVyKHgsIHksIHN0YXQpOyB9KTtcbiAgICB9XG5cbiAgICBvbk1vdXNlTW92ZSh4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMubWFwLmFjdGl2ZSkgcmV0dXJuO1xuICAgICAgICB0aGlzLm1vdXNlLnggPSB4O1xuICAgICAgICB0aGlzLm1vdXNlLnkgPSB5O1xuICAgIH1cblxuICAgIG9uTW91c2VIYW5kbGVyKHg6IG51bWJlciwgeTogbnVtYmVyLCBzdGF0OiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLm1hcC5hY3RpdmUpIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMubW91c2Uuc3RhdCA9PSAyICYmIHN0YXQgPT0gMSkgeyByZXR1cm47IH1cblxuICAgICAgICB0aGlzLm1vdXNlLnggPSB4O1xuICAgICAgICB0aGlzLm1vdXNlLnkgPSB5O1xuICAgICAgICB0aGlzLm1vdXNlLnN0YXQgPSBzdGF0O1xuICAgIH1cblxuICAgIGhhbmRsZUtleUV2ZW50KGtleUNvZGU6IG51bWJlciwgc3RhdDogbnVtYmVyKSB7XG4gICAgICAgIGlmIChQbGF5ZXJTdGF0cy5kZWFkICYmIGtleUNvZGUgPT0gMTMpIHtcbiAgICAgICAgICAgIHRoaXMubWFwLmdhbWUucmVzdGFydEdhbWUgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLm1hcC5hY3RpdmUpIHJldHVybjtcbiAgICAgICAgbGV0IGtleTogc3RyaW5nID0gbnVsbDtcblxuICAgICAgICBzd2l0Y2ggKGtleUNvZGUpIHtcbiAgICAgICAgICAgIGNhc2UgSW5wdXQua2V5cy5XOlxuICAgICAgICAgICAgY2FzZSBJbnB1dC5rZXlzLlVQOlxuICAgICAgICAgICAgICAgIGtleSA9ICdVUCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgSW5wdXQua2V5cy5BOlxuICAgICAgICAgICAgY2FzZSBJbnB1dC5rZXlzLkxFRlQ6XG4gICAgICAgICAgICAgICAga2V5ID0gJ0xFRlQnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIElucHV0LmtleXMuWDpcbiAgICAgICAgICAgIGNhc2UgSW5wdXQua2V5cy5ET1dOOlxuICAgICAgICAgICAgICAgIGtleSA9ICdET1dOJztcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBJbnB1dC5rZXlzLkQ6XG4gICAgICAgICAgICBjYXNlIElucHV0LmtleXMuUklHSFQ6XG4gICAgICAgICAgICAgICAga2V5ID0gJ1JJR0hUJztcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBJbnB1dC5rZXlzLlE6XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVLZXlFdmVudChJbnB1dC5rZXlzLkxFRlQsIHN0YXQpO1xuICAgICAgICAgICAgICAgIGtleSA9ICdVUCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgSW5wdXQua2V5cy5FOlxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlS2V5RXZlbnQoSW5wdXQua2V5cy5SSUdIVCwgc3RhdCk7XG4gICAgICAgICAgICAgICAga2V5ID0gJ1VQJztcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBJbnB1dC5rZXlzLlo6XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVLZXlFdmVudChJbnB1dC5rZXlzLkxFRlQsIHN0YXQpO1xuICAgICAgICAgICAgICAgIGtleSA9ICdET1dOJztcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBJbnB1dC5rZXlzLkM6XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVLZXlFdmVudChJbnB1dC5rZXlzLlJJR0hULCBzdGF0KTtcbiAgICAgICAgICAgICAgICBrZXkgPSAnRE9XTic7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgSW5wdXQua2V5cy5TOlxuICAgICAgICAgICAgY2FzZSBJbnB1dC5rZXlzLlNQQUNFOlxuICAgICAgICAgICAgICAgIGtleSA9ICdSRVNUJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZXkgPT0gbnVsbCkgeyByZXR1cm47IH1cbiAgICAgICAgaWYgKHN0YXQgPT0gMSAmJiB0aGlzLmtleXNba2V5XSA+PSAyKSB7XG4gICAgICAgICAgICB0aGlzLmtleXNba2V5XSAtPSAxO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5rZXlzW2tleV0gPSBzdGF0O1xuICAgIH1cblxuICAgIGFjdCgpIHtcbiAgICAgICAgdGhpcy5tYXAucGxheWVyVHVybiA9IGZhbHNlO1xuICAgICAgICBQbGF5ZXJTdGF0cy51cGRhdGVTdGF0dXMoKTtcbiAgICB9XG5cbiAgICBhdHRhY2tUbyhpbnM6IEVuZW15KSB7XG4gICAgICAgIGxldCBlbmVteTogV29ybGRFbmVteSA9IGlucy5lbmVteTtcbiAgICAgICAgbGV0IG1pc3NlZDogYm9vbGVhbiA9IChNYXRoLnJhbmRvbSgpICogMTAwKSA8IGVuZW15LmRlZi5sdWs7XG4gICAgICAgIGxldCBtc2c6IHN0cmluZyA9IFwiWW91IGF0dGFjayB0aGUgXCIgKyBlbmVteS5kZWYubmFtZTtcblxuICAgICAgICBpZiAobWlzc2VkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXAuZ2FtZS5jb25zb2xlLmFkZE1lc3NhZ2UobXNnICsgXCIsIG1pc3NlZCFcIiwgQ29sb3JzLlJFRCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3RyOiBudW1iZXIgPSBVdGlscy5yb2xsRGljZShQbGF5ZXJTdGF0cy5nZXRTdHIoKSk7XG4gICAgICAgIGxldCBkZWY6IG51bWJlciA9IFV0aWxzLnJvbGxEaWNlKGVuZW15LmRlZi5kZWYpO1xuICAgICAgICBsZXQgZG1nOiBudW1iZXIgPSBNYXRoLm1heChzdHIgLSBkZWYsIDEpO1xuXG4gICAgICAgIGlmIChpbnMucmVjZWl2ZURhbWFnZShkbWcpKSB7XG4gICAgICAgICAgICB0aGlzLm1hcC5nYW1lLmNvbnNvbGUuYWRkTWVzc2FnZShcIllvdSBraWxsZWQgdGhlIFwiICsgZW5lbXkuZGVmLm5hbWUsIENvbG9ycy5XSElURSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1hcC5nYW1lLmNvbnNvbGUuYWRkTWVzc2FnZShtc2cgKyBcIiwgaGl0IGJ5IFwiICsgZG1nICsgXCIgcG9pbnRzXCIsIENvbG9ycy5HUkVFTik7XG4gICAgICAgIH1cblxuICAgICAgICBQbGF5ZXJTdGF0cy53ZWFyV2VhcG9uKCk7XG4gICAgICAgIHRoaXMuYWN0KCk7XG4gICAgfVxuXG4gICAgbW92ZVRvKHhUbzogbnVtYmVyLCB5VG86IG51bWJlcik6IGJvb2xlYW4ge1xuICAgICAgICBpZiAoUGxheWVyU3RhdHMucGFyYWx5emVkKSB7XG4gICAgICAgICAgICB0aGlzLmFjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubWFwLmlzU29saWQodGhpcy54ICsgeFRvLCB0aGlzLnkgKyB5VG8pKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGxldCBpbnM6IEluc3RhbmNlID0gdGhpcy5tYXAuZ2V0SW5zdGFuY2VBdCh0aGlzLnggKyB4VG8sIHRoaXMueSArIHlUbyk7XG4gICAgICAgIGlmIChpbnMgJiYgKDxFbmVteT5pbnMpLmVuZW15KSB7XG4gICAgICAgICAgICB0aGlzLmF0dGFja1RvKDxFbmVteT5pbnMpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlUGF0aCA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBzdXBlci5tb3ZlVG8oeFRvLCB5VG8pO1xuXG4gICAgICAgIHRoaXMubWFwLnVwZGF0ZUZPVih0aGlzLngsIHRoaXMueSk7XG4gICAgICAgIHRoaXMuYWN0KCk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgY2hlY2tNb3ZlbWVudCgpIHtcbiAgICAgICAgbGV0IHhUbzogbnVtYmVyID0gMCxcbiAgICAgICAgICAgIHlUbzogbnVtYmVyID0gMDtcblxuICAgICAgICBpZiAodGhpcy5rZXlzWydVUCddID09IDEpIHtcbiAgICAgICAgICAgIHlUbyA9IC0xO1xuICAgICAgICAgICAgdGhpcy5rZXlzWydVUCddID0gdGhpcy5tb3ZlV2FpdDtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmtleXNbJ0RPV04nXSA9PSAxKSB7XG4gICAgICAgICAgICB5VG8gPSArMTtcbiAgICAgICAgICAgIHRoaXMua2V5c1snRE9XTiddID0gdGhpcy5tb3ZlV2FpdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmtleXNbJ0xFRlQnXSA9PSAxKSB7XG4gICAgICAgICAgICB4VG8gPSAtMTtcbiAgICAgICAgICAgIHRoaXMua2V5c1snTEVGVCddID0gdGhpcy5tb3ZlV2FpdDtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmtleXNbJ1JJR0hUJ10gPT0gMSkge1xuICAgICAgICAgICAgeFRvID0gKzE7XG4gICAgICAgICAgICB0aGlzLmtleXNbJ1JJR0hUJ10gPSB0aGlzLm1vdmVXYWl0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHhUbyAhPSAwIHx8IHlUbyAhPSAwKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVUbyh4VG8sIHlUbyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb2xsb3dQYXRoKCkge1xuICAgICAgICBpZiAodGhpcy5hdXRvTW92ZURlbGF5LS0gPiAwKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGxldCB4VG86IG51bWJlciA9IHRoaXMubW92ZVBhdGguc2hpZnQoKSAtIHRoaXMueDtcbiAgICAgICAgbGV0IHlUbzogbnVtYmVyID0gdGhpcy5tb3ZlUGF0aC5zaGlmdCgpIC0gdGhpcy55O1xuXG4gICAgICAgIGlmICghdGhpcy5tb3ZlVG8oeFRvLCB5VG8pKSB7IHJldHVybjsgfVxuICAgICAgICB0aGlzLmF1dG9Nb3ZlRGVsYXkgPSB0aGlzLm1vdmVXYWl0O1xuXG4gICAgICAgIGlmICh0aGlzLm1vdmVQYXRoLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVQYXRoID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZU1vdXNlKCkge1xuICAgICAgICBpZiAodGhpcy5tb3VzZS54ID09IC0xKSB7IHJldHVybjsgfVxuXG4gICAgICAgIHRoaXMubWFwLmdhbWUub25Nb3VzZU1vdmUodGhpcy5tb3VzZS54LCB0aGlzLm1vdXNlLnkpO1xuICAgICAgICBpZiAodGhpcy5tb3VzZS5zdGF0ICE9IDIpIHtcbiAgICAgICAgICAgIHRoaXMubWFwLmdhbWUub25Nb3VzZUhhbmRsZXIodGhpcy5tb3VzZS54LCB0aGlzLm1vdXNlLnksIHRoaXMubW91c2Uuc3RhdCk7XG4gICAgICAgICAgICBpZiAodGhpcy5tb3VzZS5zdGF0ID09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlLnN0YXQgPSAyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tb3VzZS54ID0gLTE7XG4gICAgfVxuXG4gICAgY2hlY2tTa2lwKCkge1xuICAgICAgICBpZiAodGhpcy5rZXlzW1wiUkVTVFwiXSA9PSAxKSB7XG4gICAgICAgICAgICB0aGlzLmtleXNbXCJSRVNUXCJdID0gdGhpcy5tb3ZlV2FpdDtcbiAgICAgICAgICAgIHRoaXMuYWN0KCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIGlmIChQbGF5ZXJTdGF0cy5kZWFkKSB7IHJldHVybjsgfVxuICAgICAgICBpZiAoIXRoaXMubWFwLnBsYXllclR1cm4pIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgaWYgKHRoaXMuY2hlY2tTa2lwKCkpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVNb3VzZSgpO1xuXG4gICAgICAgIGlmICh0aGlzLm1hcC5nYW1lLml0ZW1EZXNjKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGlmICh0aGlzLm1vdmVQYXRoKSB7XG4gICAgICAgICAgICB0aGlzLmZvbGxvd1BhdGgoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tNb3ZlbWVudCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tYXAudXBkYXRlVmlldygpO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgUGxheWVyIH07Iiwi77u/aW1wb3J0IHsgQ29sb3JzIH0gZnJvbSAnLi9QcmVmYWJzJztcbmltcG9ydCB7IENvbnNvbGUgfSBmcm9tICcuL0NvbnNvbGUnO1xuaW1wb3J0IHsgVXRpbHMgfSBmcm9tICcuL1V0aWxzJztcbmltcG9ydCB7IEdhbWUgfSBmcm9tICcuL0dhbWUnO1xuaW1wb3J0IHsgVmVjdG9yMiB9IGZyb20gJy4vZW5naW5lL1ZlY3RvcjInO1xuaW1wb3J0IHsgSXRlbUZhY3RvcnksIFdvcmxkSXRlbSwgSXRlbVR5cGVzIH0gZnJvbSAnLi9JdGVtRmFjdG9yeSc7XG5pbXBvcnQgeyBNYXAgfSBmcm9tICcuL01hcCc7XG5pbXBvcnQgeyBQbGF5ZXIgfSBmcm9tICcuL1BsYXllcic7XG5pbXBvcnQgeyBSZW5kZXJlciB9IGZyb20gJy4vZW5naW5lL1JlbmRlcmVyJztcblxuY29uc3QgTUFYX0lOVkVOVE9SWTogbnVtYmVyID0gMjA7XG5cbmludGVyZmFjZSBTdGF0dXMge1xuICAgIHR5cGU6IHN0cmluZyxcbiAgICBkdXJhdGlvbjogQXJyYXk8bnVtYmVyPixcbiAgICB2YWx1ZTogc3RyaW5nXG59O1xuXG5sZXQgUGxheWVyU3RhdHMgPSB7XG4gICAgZ2FtZTogPEdhbWU+bnVsbCxcblxuICAgIG5hbWU6IDxzdHJpbmc+JycsXG4gICAgdXNlTmFtZTogPHN0cmluZz4nWW91JyxcblxuICAgIGNsYXNzOiA8c3RyaW5nPidST0dVRScsXG5cbiAgICBocDogPEFycmF5PG51bWJlcj4+WzEwMCwgMTAwXSxcbiAgICBtcDogPEFycmF5PG51bWJlcj4+WzIwLCAyMF0sXG4gICAgc3RhdHVzOiA8QXJyYXk8U3RhdHVzPj5bXSxcblxuICAgIHN0cjogPHN0cmluZz4nMkQyJyxcbiAgICBkZWY6IDxzdHJpbmc+JzJEMicsXG5cbiAgICBzdHJBZGQ6IDxudW1iZXI+MCxcbiAgICBkZWZBZGQ6IDxudW1iZXI+MCxcbiAgICBzcGQ6IDxudW1iZXI+MTAsXG4gICAgbHVrOiA8bnVtYmVyPjM4LFxuXG4gICAgZ29sZDogPG51bWJlcj4wLFxuXG4gICAgYmxpbmQ6IDxib29sZWFuPmZhbHNlLFxuICAgIHBhcmFseXplZDogPGJvb2xlYW4+ZmFsc2UsXG4gICAgaW52aXNpYmxlOiA8Ym9vbGVhbj5mYWxzZSxcbiAgICBkZWFkOiA8Ym9vbGVhbj5mYWxzZSxcblxuICAgIGludmVudG9yeTogPEFycmF5PFdvcmxkSXRlbT4+W10sXG4gICAgZXF1aXBtZW50OiB7XG4gICAgICAgIHdlYXBvbjogPFdvcmxkSXRlbT5udWxsLFxuICAgICAgICBhcm1vcjogPFdvcmxkSXRlbT5udWxsLFxuICAgICAgICBhbXVsZXQ6IDxXb3JsZEl0ZW0+bnVsbFxuICAgIH0sXG5cbiAgICBzdGF0c1Bvc2l0aW9uOiA8QXJyYXk8bnVtYmVyPj5bNjAsIDAsIDI1LCAyNSwgNzNdLFxuICAgIGludmVudG9yeVNjcm9sbDogPG51bWJlcj4wLFxuICAgIG1vdXNlUG9zaXRpb246IDxWZWN0b3IyPm51bGwsXG4gICAgaXRlbVNlbGVjdGVkOiA8bnVtYmVyPi0xLFxuXG4gICAgaW5pdFN0YXRzOiBmdW5jdGlvbiAoZ2FtZTogR2FtZSkge1xuICAgICAgICB0aGlzLmdhbWUgPSBnYW1lO1xuXG4gICAgICAgIHRoaXMubmFtZSA9ICcnO1xuICAgICAgICB0aGlzLnVzZU5hbWUgPSAnWW91JztcblxuICAgICAgICB0aGlzLmNsYXNzID0gJ1JPR1VFJztcblxuICAgICAgICB0aGlzLmhwID0gWzEwMCwgMTAwXTtcbiAgICAgICAgdGhpcy5tcCA9IFsyMCwgMjBdO1xuICAgICAgICB0aGlzLnN0YXR1cyA9IFtdO1xuXG4gICAgICAgIHRoaXMuc3RyID0gJzJEMic7XG4gICAgICAgIHRoaXMuZGVmID0gJzJEMic7XG5cbiAgICAgICAgdGhpcy5zdHJBZGQgPSAwO1xuICAgICAgICB0aGlzLmRlZkFkZCA9IDA7XG4gICAgICAgIHRoaXMuc3BkID0gMTA7XG4gICAgICAgIHRoaXMubHVrID0gMzg7XG5cbiAgICAgICAgdGhpcy5nb2xkID0gMDtcblxuICAgICAgICB0aGlzLmJsaW5kID0gZmFsc2U7XG4gICAgICAgIHRoaXMucGFyYWx5emVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW52aXNpYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZGVhZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuaW52ZW50b3J5ID0gW107XG4gICAgICAgIHRoaXMuZXF1aXBtZW50ID0ge1xuICAgICAgICAgICAgd2VhcG9uOiBudWxsLFxuICAgICAgICAgICAgYXJtb3I6IG51bGwsXG4gICAgICAgICAgICBhbXVsZXQ6IG51bGxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgd2VhcldlYXBvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMuZXF1aXBtZW50LndlYXBvbikgeyByZXR1cm47IH1cblxuICAgICAgICBsZXQgYW1vdW50Om51bWJlciA9IFV0aWxzLnJvbGxEaWNlKHRoaXMuZXF1aXBtZW50LndlYXBvbi5kZWYud2Vhcik7XG4gICAgICAgIHRoaXMuZXF1aXBtZW50LndlYXBvbi5zdGF0dXMgLT0gYW1vdW50O1xuXG4gICAgICAgIGlmICh0aGlzLmVxdWlwbWVudC53ZWFwb24uc3RhdHVzIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZS5jb25zb2xlLmFkZE1lc3NhZ2UodGhpcy5lcXVpcG1lbnQud2VhcG9uLmRlZi5uYW1lICsgXCIgZGVzdHJveWVkXCIsIENvbG9ycy5HT0xEKTtcbiAgICAgICAgICAgIHRoaXMuZXF1aXBtZW50LndlYXBvbiA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgd2VhckFybW9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy5lcXVpcG1lbnQuYXJtb3IpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgbGV0IGFtb3VudDpudW1iZXIgPSBVdGlscy5yb2xsRGljZSh0aGlzLmVxdWlwbWVudC5hcm1vci5kZWYud2Vhcik7XG4gICAgICAgIHRoaXMuZXF1aXBtZW50LmFybW9yLnN0YXR1cyAtPSBhbW91bnQ7XG5cbiAgICAgICAgaWYgKHRoaXMuZXF1aXBtZW50LmFybW9yLnN0YXR1cyA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmdhbWUuY29uc29sZS5hZGRNZXNzYWdlKHRoaXMuZXF1aXBtZW50LmFybW9yLmRlZi5uYW1lICsgXCIgZGVzdHJveWVkXCIsIENvbG9ycy5HT0xEKTtcbiAgICAgICAgICAgIHRoaXMuZXF1aXBtZW50LmFybW9yID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB1cGRhdGVTdGF0dXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5ibGluZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnBhcmFseXplZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmludmlzaWJsZSA9IGZhbHNlO1xuXG4gICAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDAsIHN0OiBTdGF0dXM7IHN0ID0gdGhpcy5zdGF0dXNbaV07IGkrKykge1xuICAgICAgICAgICAgaWYgKHN0LnR5cGUgPT0gJ3BvaXNvbicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlY2VpdmVEYW1hZ2UoVXRpbHMucm9sbERpY2Uoc3QudmFsdWUpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3QudHlwZSA9PSAnYmxpbmQnICYmIHN0LmR1cmF0aW9uWzBdID4gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYmxpbmQgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdC50eXBlID09ICdwYXJhbHlzaXMnICYmIHN0LmR1cmF0aW9uWzBdID4gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGFyYWx5emVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3QudHlwZSA9PSAnaW52aXNpYmxlJyAmJiBzdC5kdXJhdGlvblswXSA+IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0LmR1cmF0aW9uWzBdIC09IDE7XG4gICAgICAgICAgICBpZiAoc3QuZHVyYXRpb25bMF0gPT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlbmRlcih0aGlzLmdhbWUucmVuZGVyZXIpO1xuICAgIH0sXG5cbiAgICByZWNlaXZlRGFtYWdlOiBmdW5jdGlvbiAoZG1nOm51bWJlcikge1xuICAgICAgICB0aGlzLmhwWzBdIC09IGRtZztcbiAgICAgICAgaWYgKHRoaXMuaHBbMF0gPD0gMCkge1xuICAgICAgICAgICAgdGhpcy5ocFswXSA9IDA7XG4gICAgICAgICAgICB0aGlzLmRlYWQgPSB0cnVlO1xuXG4gICAgICAgICAgICB0aGlzLmdhbWUuY29uc29sZS5jbGVhcigpO1xuICAgICAgICAgICAgdGhpcy5nYW1lLmNvbnNvbGUuYWRkTWVzc2FnZShcIllvdSBkaWVkLCBwcmVzcyBlbnRlciB0byByZXN0YXJ0XCIsIENvbG9ycy5QVVJQTEUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZW5kZXIodGhpcy5nYW1lLnJlbmRlcmVyKTtcbiAgICAgICAgdGhpcy53ZWFyQXJtb3IoKTtcbiAgICB9LFxuXG4gICAgZXF1aXBJdGVtOiBmdW5jdGlvbiAoaXRlbTogV29ybGRJdGVtLCB0eXBlOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IGluZDogbnVtYmVyID0gdGhpcy5pbnZlbnRvcnkuaW5kZXhPZihpdGVtKTtcbiAgICAgICAgaWYgKHRoaXMuZXF1aXBtZW50W3R5cGVdKSB7XG4gICAgICAgICAgICB0aGlzLmludmVudG9yeVtpbmRdID0gdGhpcy5lcXVpcG1lbnRbdHlwZV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmludmVudG9yeS5zcGxpY2UoaW5kLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZXF1aXBtZW50W3R5cGVdID0gaXRlbTtcblxuICAgICAgICB0aGlzLmdhbWUuaXRlbURlc2MgPSBudWxsO1xuICAgIH0sXG5cbiAgICB1c2VJdGVtOiBmdW5jdGlvbiAoaXRlbTogV29ybGRJdGVtKSB7XG4gICAgICAgIGlmICghdGhpcy5nYW1lLm1hcC5wbGF5ZXJUdXJuKSByZXR1cm47XG5cbiAgICAgICAgbGV0IG1zZzogc3RyaW5nID0gJyc7XG4gICAgICAgIGlmIChpdGVtLmRlZi5zdGFja2FibGUpIHtcbiAgICAgICAgICAgIGlmIChpdGVtLmFtb3VudCA+IDEpIHtcbiAgICAgICAgICAgICAgICBpdGVtLmFtb3VudCAtPSAxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWUuaXRlbURlc2MgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuaW52ZW50b3J5LnNwbGljZSh0aGlzLml0ZW1TZWxlY3RlZCwgMSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1zZyA9IEl0ZW1GYWN0b3J5LnVzZUl0ZW0oaXRlbS5kZWYsIHRoaXMpO1xuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uZGVmLnR5cGUgPT0gSXRlbVR5cGVzLldFQVBPTikge1xuICAgICAgICAgICAgdGhpcy5lcXVpcEl0ZW0oaXRlbSwgJ3dlYXBvbicpO1xuICAgICAgICAgICAgbXNnID0gaXRlbS5kZWYubmFtZSArIFwiIGVxdWlwcGVkIVwiO1xuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0uZGVmLnR5cGUgPT0gSXRlbVR5cGVzLkFSTU9SKSB7XG4gICAgICAgICAgICB0aGlzLmVxdWlwSXRlbShpdGVtLCAnYXJtb3InKTtcbiAgICAgICAgICAgIG1zZyA9IGl0ZW0uZGVmLm5hbWUgKyBcIiBlcXVpcHBlZCFcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ2FtZS5jb25zb2xlLmFkZE1lc3NhZ2UobXNnLCBDb2xvcnMuV0hJVEUpO1xuXG4gICAgICAgIHRoaXMuZ2FtZS5tYXAucGxheWVyLmFjdCgpO1xuICAgIH0sXG5cbiAgICBkcm9wSXRlbTogZnVuY3Rpb24gKGl0ZW06IFdvcmxkSXRlbSk6IGJvb2xlYW4ge1xuICAgICAgICBpZiAoIXRoaXMuZ2FtZS5tYXAucGxheWVyVHVybikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIGxldCBtYXA6IE1hcCA9IHRoaXMuZ2FtZS5tYXA7XG4gICAgICAgIGxldCBwbGF5ZXI6IFBsYXllciA9IG1hcC5wbGF5ZXI7XG5cbiAgICAgICAgbGV0IHg6IG51bWJlciA9IHBsYXllci54O1xuICAgICAgICBsZXQgeTogbnVtYmVyID0gcGxheWVyLnk7XG5cbiAgICAgICAgbGV0IG54OiBudW1iZXIsIG55OiBudW1iZXI7XG4gICAgICAgIGxldCB0cmllczogbnVtYmVyID0gMDtcblxuICAgICAgICB3aGlsZSAobWFwLmdldEluc3RhbmNlQXQoeCwgeSkpIHtcbiAgICAgICAgICAgIG54ID0gKHBsYXllci54IC0gMiArIE1hdGgucmFuZG9tKCkgKiA0KSA8PCAwO1xuICAgICAgICAgICAgbnkgPSAocGxheWVyLnkgLSAyICsgTWF0aC5yYW5kb20oKSAqIDQpIDw8IDA7XG5cbiAgICAgICAgICAgIGlmIChtYXAubWFwW255XVtueF0udmlzaWJsZSA9PSAyICYmICFtYXAuaXNTb2xpZChueCwgbnkpKSB7XG4gICAgICAgICAgICAgICAgeCA9IG54O1xuICAgICAgICAgICAgICAgIHkgPSBueTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRyaWVzKysgPT0gMjApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWUuY29uc29sZS5hZGRNZXNzYWdlKFwiQ2FuJ3QgZHJvcCBpdCBoZXJlIVwiLCBDb2xvcnMuUkVEKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcih0aGlzLmdhbWUucmVuZGVyZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpdGVtLmFtb3VudCA+IDEpIHtcbiAgICAgICAgICAgIGl0ZW0uYW1vdW50IC09IDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmdhbWUuaXRlbURlc2MgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5pbnZlbnRvcnkuc3BsaWNlKHRoaXMuaXRlbVNlbGVjdGVkLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1hcC5jcmVhdGVJdGVtKHgsIHksIEl0ZW1GYWN0b3J5LmdldEl0ZW0oaXRlbS5kZWYuY29kZSkpO1xuXG4gICAgICAgIHRoaXMuZ2FtZS5jb25zb2xlLmFkZE1lc3NhZ2UoaXRlbS5kZWYubmFtZSArIFwiIGRyb3BwZWRcIiwgQ29sb3JzLkFRVUEpO1xuICAgICAgICB0aGlzLnJlbmRlcih0aGlzLmdhbWUucmVuZGVyZXIpO1xuXG4gICAgICAgIHRoaXMuZ2FtZS5tYXAucGxheWVyLmFjdCgpO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICBwaWNrSXRlbTogZnVuY3Rpb24gKGl0ZW06IFdvcmxkSXRlbSkge1xuICAgICAgICBpZiAoaXRlbS5kZWYudHlwZSA9PSBJdGVtVHlwZXMuR09MRCkge1xuICAgICAgICAgICAgbGV0IG1zZzogc3RyaW5nID0gXCJQaWNrZWQgXCIgKyBpdGVtLmFtb3VudCArIFwiIEdvbGQgcGllY2VcIjtcbiAgICAgICAgICAgIGlmIChpdGVtLmFtb3VudCA+IDEpIHsgbXNnICs9IFwic1wiOyB9XG4gICAgICAgICAgICB0aGlzLmdhbWUuY29uc29sZS5hZGRNZXNzYWdlKG1zZywgQ29sb3JzLkdPTEQpO1xuXG4gICAgICAgICAgICB0aGlzLmdvbGQgKz0gaXRlbS5hbW91bnQ7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcih0aGlzLmdhbWUucmVuZGVyZXIpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmludmVudG9yeS5sZW5ndGggPT0gTUFYX0lOVkVOVE9SWSkge1xuICAgICAgICAgICAgdGhpcy5nYW1lLmNvbnNvbGUuYWRkTWVzc2FnZShcIkludmVudG9yeSBmdWxsIVwiLCBDb2xvcnMuUkVEKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhZGRlZDogYm9vbGVhbiA9IGZhbHNlO1xuICAgICAgICBpZiAoaXRlbS5kZWYuc3RhY2thYmxlKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgaW52OiBXb3JsZEl0ZW07IGludiA9IHRoaXMuaW52ZW50b3J5W2ldOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaW52LmRlZi5jb2RlID09IGl0ZW0uZGVmLmNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaW52LmFtb3VudCArPSAxO1xuICAgICAgICAgICAgICAgICAgICBhZGRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGkgPSB0aGlzLmludmVudG9yeS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFhZGRlZCkge1xuICAgICAgICAgICAgdGhpcy5pbnZlbnRvcnkucHVzaChpdGVtKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ2FtZS5jb25zb2xlLmFkZE1lc3NhZ2UoaXRlbS5kZWYubmFtZSArIFwiIHBpY2tlZCFcIiwgQ29sb3JzLllFTExPVyk7XG4gICAgICAgIHRoaXMucmVuZGVyKHRoaXMuZ2FtZS5yZW5kZXJlcik7XG5cbiAgICAgICAgdGhpcy5nYW1lLm1hcC5wbGF5ZXIuYWN0KCk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIGdldFN0cjogZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgdmFsOiBzdHJpbmcgPSB0aGlzLnN0cjtcbiAgICAgICAgaWYgKHRoaXMuZXF1aXBtZW50LndlYXBvbikge1xuICAgICAgICAgICAgdmFsID0gdGhpcy5lcXVpcG1lbnQud2VhcG9uLmRlZi5zdHI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zdHJBZGQgPiAwKSB7XG4gICAgICAgICAgICB2YWwgKz0gXCIrXCIgKyB0aGlzLnN0ckFkZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIGdldERlZjogZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgdmFsOiBzdHJpbmcgPSB0aGlzLmRlZjtcbiAgICAgICAgaWYgKHRoaXMuZXF1aXBtZW50LmFybW9yKSB7XG4gICAgICAgICAgICB2YWwgPSB0aGlzLmVxdWlwbWVudC5hcm1vci5kZWYuZGVmO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGVmQWRkID4gMCkge1xuICAgICAgICAgICAgdmFsICs9IFwiK1wiICsgdGhpcy5kZWZBZGQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICBvbk1vdXNlTW92ZTogZnVuY3Rpb24gKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XG4gICAgICAgIGlmICh4ID09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMubW91c2VQb3NpdGlvbiA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcih0aGlzLmdhbWUucmVuZGVyZXIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tb3VzZVBvc2l0aW9uID0gW3gsIHldO1xuICAgICAgICB0aGlzLnJlbmRlcih0aGlzLmdhbWUucmVuZGVyZXIpO1xuICAgIH0sXG5cbiAgICBvbk1vdXNlSGFuZGxlcjogZnVuY3Rpb24gKHg6IG51bWJlciwgeTogbnVtYmVyLCBzdGF0OiBudW1iZXIpIHtcbiAgICAgICAgaWYgKHN0YXQgPD0gMCkgcmV0dXJuO1xuXG4gICAgICAgIGlmICh4ID09IDI0KSB7XG4gICAgICAgICAgICBpZiAoeSA9PSAxMyAmJiB0aGlzLmludmVudG9yeVNjcm9sbCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmVudG9yeVNjcm9sbCAtPSAxO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh5ID09IDE5ICYmIHRoaXMuaW52ZW50b3J5U2Nyb2xsICsgNyA8IHRoaXMuaW52ZW50b3J5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW52ZW50b3J5U2Nyb2xsICs9IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucmVuZGVyKHRoaXMuZ2FtZS5yZW5kZXJlcik7XG4gICAgICAgIH0gZWxzZSBpZiAoeSA+PSA5ICYmIHkgPD0gMTApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmludmVudG9yeS5sZW5ndGggPj0gTUFYX0lOVkVOVE9SWSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZS5jb25zb2xlLmFkZE1lc3NhZ2UoXCJDYW4ndCByZW1vdmUsIEludmVudG9yeSBmdWxsIVwiLCBDb2xvcnMuUkVEKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCB0eXBlOiBzdHJpbmcgPSAoeSA9PSA5KSA/ICd3ZWFwb24nIDogJ2FybW9yJztcbiAgICAgICAgICAgIHRoaXMuZ2FtZS5jb25zb2xlLmFkZE1lc3NhZ2UodGhpcy5lcXVpcG1lbnRbdHlwZV0uZGVmLm5hbWUgKyBcIiByZW1vdmVkXCIsIENvbG9ycy5ZRUxMT1cpO1xuICAgICAgICAgICAgdGhpcy5pbnZlbnRvcnkucHVzaCh0aGlzLmVxdWlwbWVudFt0eXBlXSk7XG4gICAgICAgICAgICB0aGlzLmVxdWlwbWVudFt0eXBlXSA9IG51bGw7XG5cbiAgICAgICAgfSBlbHNlIGlmICh5ID49IDEzICYmIHkgPD0gMTkpIHtcbiAgICAgICAgICAgIGxldCBpbmRleDogbnVtYmVyID0geSAtIDEzICsgdGhpcy5pbnZlbnRvcnlTY3JvbGw7XG4gICAgICAgICAgICBsZXQgaXRlbTogV29ybGRJdGVtID0gdGhpcy5pbnZlbnRvcnlbaW5kZXhdO1xuICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1TZWxlY3RlZCA9IGluZGV4O1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZS5pdGVtRGVzYyA9IGl0ZW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVuZGVyU3RhdHVzOiBmdW5jdGlvbiAocmVuZGVyZXI6IFJlbmRlcmVyKSB7XG4gICAgICAgIGxldCBzcCA9IHRoaXMuc3RhdHNQb3NpdGlvbixcbiAgICAgICAgICAgIGxlbmd0aCA9IHRoaXMuc3RhdHVzLmxlbmd0aCxcbiAgICAgICAgICAgIHRhYlNpemUgPSBzcFswXSArIHNwWzJdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSBzcFswXSwgbCA9IHRhYlNpemU7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLnBsb3QoaSwgMywgcmVuZGVyZXIuZ2V0VGlsZShDb2xvcnMuQkxBQ0spKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBsID0gTWF0aC5mbG9vcihzcFsyXSAvIGxlbmd0aCk7XG4gICAgICAgIGZvciAobGV0IGogPSAwLCBzdDogU3RhdHVzOyBzdCA9IHRoaXMuc3RhdHVzW2pdOyBqKyspIHtcbiAgICAgICAgICAgIGxldCBjb2xvciA9IENvbG9ycy5CTEFDSztcbiAgICAgICAgICAgIGlmIChzdC50eXBlID09ICdwb2lzb24nKSB7IGNvbG9yID0gQ29sb3JzLlBVUlBMRTsgfSBlbHNlXG4gICAgICAgICAgICAgICAgaWYgKHN0LnR5cGUgPT0gJ2JsaW5kJykgeyBjb2xvciA9IENvbG9ycy5UQU47IH0gZWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3QudHlwZSA9PSAncGFyYWx5c2lzJykgeyBjb2xvciA9IENvbG9ycy5HT0xEOyB9IGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdC50eXBlID09ICdpbnZpc2libGUnKSB7IGNvbG9yID0gQ29sb3JzLkdSQVk7IH1cblxuICAgICAgICAgICAgbGV0IHN0YXJ0ID0gbCAqIGo7XG4gICAgICAgICAgICBsZXQgZW5kID0gTWF0aC5mbG9vcihzdGFydCArIGwgKiAoc3QuZHVyYXRpb25bMF0gLyBzdC5kdXJhdGlvblsxXSkpO1xuICAgICAgICAgICAgaWYgKGogPT0gbGVuZ3RoIC0gMSAmJiBzdGFydCArIGVuZCAhPSBzcFsyXSkgeyBlbmQgKz0gMTsgfVxuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgICAgICAgICAgIHJlbmRlcmVyLnBsb3QoaSArIHNwWzBdLCAzLCByZW5kZXJlci5nZXRUaWxlKGNvbG9yKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3RhdHVzOiBzdHJpbmcgPSBcIkZJTkVcIjtcbiAgICAgICAgaWYgKGxlbmd0aCA9PSAxKSB7IHN0YXR1cyA9IHRoaXMuc3RhdHVzWzBdLnR5cGUudG9VcHBlckNhc2UoKTsgfSBlbHNlXG4gICAgICAgICAgICBpZiAobGVuZ3RoID4gMSkgeyBzdGF0dXMgPSBcIlZBUklPVVNcIjsgfVxuXG4gICAgICAgIFV0aWxzLnJlbmRlclRleHQocmVuZGVyZXIsIHNwWzBdLCAzLCBcIlNUQVRVUzogXCIgKyBzdGF0dXMsIENvbG9ycy5XSElURSwgbnVsbCk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKHJlbmRlcmVyOiBSZW5kZXJlcikge1xuICAgICAgICBsZXQgc3AgPSB0aGlzLnN0YXRzUG9zaXRpb247XG5cbiAgICAgICAgcmVuZGVyZXIuY2xlYXJSZWN0KHNwWzBdLCBzcFsxXSwgc3BbMl0sIHNwWzNdKTtcblxuICAgICAgICAvLyBQbGF5ZXIgTmFtZVxuICAgICAgICBsZXQgbmFtZTogc3RyaW5nID0gdGhpcy5uYW1lICsgXCIgKFwiICsgdGhpcy5jbGFzcyArIFwiKVwiO1xuXG4gICAgICAgIGxldCB4ID0gKHNwWzRdIC0gbmFtZS5sZW5ndGggLyAyKSA8PCAwO1xuICAgICAgICBsZXQgbmkgPSAwO1xuICAgICAgICBmb3IgKGxldCBpID0gc3BbMF0sIGwgPSBzcFswXSArIHNwWzJdOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgbiA9ICcnO1xuICAgICAgICAgICAgaWYgKGkgPj0geCAmJiBuaSA8IG5hbWUubGVuZ3RoKSB7IG4gPSBuYW1lW25pKytdOyB9XG5cbiAgICAgICAgICAgIHJlbmRlcmVyLnBsb3QoaSwgMCwgVXRpbHMuZ2V0VGlsZShyZW5kZXJlciwgbiwgQ29sb3JzLldISVRFLCBDb2xvcnMuQkxVRSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRHVuZ2VvbiBEZXB0aFxuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHJlbmRlcmVyLCBzcFswXSwgMSwgXCJMRVZFTDogXCIgKyB0aGlzLmdhbWUubWFwLmxldmVsKTtcblxuICAgICAgICAvLyBIZWFsdGggUG9pbnRzXG4gICAgICAgIGxldCBocCA9ICgodGhpcy5ocFswXSAvIHRoaXMuaHBbMV0gKiBzcFsyXSkgPDwgMCkgKyBzcFswXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IHNwWzBdOyBpIDwgaHA7IGkrKykge1xuICAgICAgICAgICAgcmVuZGVyZXIucGxvdChpLCAyLCByZW5kZXJlci5nZXRUaWxlKENvbG9ycy5HUkVFTikpO1xuICAgICAgICB9XG5cbiAgICAgICAgVXRpbHMucmVuZGVyVGV4dChyZW5kZXJlciwgc3BbMF0sIDIsIFwiSFA6IFwiICsgdGhpcy5ocFswXSArIFwiL1wiICsgdGhpcy5ocFsxXSwgQ29sb3JzLldISVRFLCBudWxsKTtcblxuICAgICAgICAvLyBNYWdpYyBQb2ludHNcbiAgICAgICAgLyp2YXIgbXAgPSAoKHRoaXMubXBbMF0gLyB0aGlzLm1wWzFdICogc3BbMl0pIDw8IDApICsgc3BbMF07XG4gICAgICAgIGZvciAodmFyIGk9c3BbMF07aTxtcDtpKyspe1xuICAgICAgICAgICAgcmVuZGVyZXIucGxvdChpLCAzLCByZW5kZXJlci5nZXRUaWxlKENvbG9ycy5BUVVBKSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIFV0aWxzLnJlbmRlclRleHQocmVuZGVyZXIsIHNwWzBdLCAzLCBcIk1QOiBcIiArIHRoaXMubXBbMF0gKyBcIi9cIiArIHRoaXMubXBbMV0sIENvbG9ycy5XSElURSwgbnVsbCk7Ki9cblxuICAgICAgICB0aGlzLnJlbmRlclN0YXR1cyhyZW5kZXJlcik7XG5cbiAgICAgICAgVXRpbHMucmVuZGVyVGV4dChyZW5kZXJlciwgc3BbMF0sIDUsIFwiQVRLOiBcIiArIHRoaXMuZ2V0U3RyKCksIENvbG9ycy5XSElURSwgQ29sb3JzLkJMQUNLKTtcbiAgICAgICAgVXRpbHMucmVuZGVyVGV4dChyZW5kZXJlciwgKHNwWzBdICsgc3BbMl0gLyAyKSA8PCAwLCA1LCBcIkRFRjogXCIgKyB0aGlzLmdldERlZigpLCBDb2xvcnMuV0hJVEUsIENvbG9ycy5CTEFDSyk7XG5cbiAgICAgICAgVXRpbHMucmVuZGVyVGV4dChyZW5kZXJlciwgc3BbMF0sIDYsIFwiU1BEOiBcIiArIHRoaXMuc3BkLCBDb2xvcnMuV0hJVEUsIENvbG9ycy5CTEFDSyk7XG4gICAgICAgIFV0aWxzLnJlbmRlclRleHQocmVuZGVyZXIsIChzcFswXSArIHNwWzJdIC8gMiAtIDEpIDw8IDAsIDYsIFwiR09MRDogXCIgKyB0aGlzLmdvbGQsIENvbG9ycy5HT0xELCBDb2xvcnMuQkxBQ0spO1xuXG4gICAgICAgIC8vIEVRVUlQTUVOVFxuICAgICAgICBmb3IgKGxldCBpID0gc3BbMF0sIGwgPSBzcFswXSArIHNwWzJdOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICByZW5kZXJlci5wbG90KGksIDgsIHJlbmRlcmVyLmdldFRpbGUoQ29sb3JzLkJMVUUpKTtcbiAgICAgICAgfVxuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHJlbmRlcmVyLCBzcFswXSArIDgsIDgsIFwiRVFVSVBNRU5UXCIsIENvbG9ycy5XSElURSwgQ29sb3JzLkJMVUUpO1xuXG4gICAgICAgIGxldCBlcXVpcDogc3RyaW5nID0gKHRoaXMuZXF1aXBtZW50LndlYXBvbikgPyB0aGlzLmVxdWlwbWVudC53ZWFwb24uZGVmLm5hbWUgKyAnICgnICsgdGhpcy5lcXVpcG1lbnQud2VhcG9uLnN0YXR1cyArICclKScgOiAnTk8gV0VBUE9OJztcbiAgICAgICAgbGV0IGJhY2tDb2xvciA9IENvbG9ycy5CTEFDSztcbiAgICAgICAgaWYgKHRoaXMuZXF1aXBtZW50LndlYXBvbiAmJiB0aGlzLm1vdXNlUG9zaXRpb24gJiYgdGhpcy5tb3VzZVBvc2l0aW9uWzFdID09IDkpIHtcbiAgICAgICAgICAgIGJhY2tDb2xvciA9IENvbG9ycy5HUkFZO1xuICAgICAgICAgICAgZXF1aXAgPSBlcXVpcCArIChcIiAgICAgICAgICAgICAgICAgICBcIikuc3Vic3RyKDAsIDI1IC0gZXF1aXAubGVuZ3RoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIFV0aWxzLnJlbmRlclRleHQocmVuZGVyZXIsIHNwWzBdLCA5LCBlcXVpcCwgQ29sb3JzLldISVRFLCBiYWNrQ29sb3IpO1xuXG4gICAgICAgIGVxdWlwID0gKHRoaXMuZXF1aXBtZW50LmFybW9yKSA/IHRoaXMuZXF1aXBtZW50LmFybW9yLmRlZi5uYW1lICsgJyAoJyArIHRoaXMuZXF1aXBtZW50LmFybW9yLnN0YXR1cyArICclKScgOiAnTk8gQVJNT1InO1xuICAgICAgICBiYWNrQ29sb3IgPSBDb2xvcnMuQkxBQ0s7XG4gICAgICAgIGlmICh0aGlzLmVxdWlwbWVudC5hcm1vciAmJiB0aGlzLm1vdXNlUG9zaXRpb24gJiYgdGhpcy5tb3VzZVBvc2l0aW9uWzFdID09IDEwKSB7XG4gICAgICAgICAgICBiYWNrQ29sb3IgPSBDb2xvcnMuR1JBWTtcbiAgICAgICAgICAgIGVxdWlwID0gZXF1aXAgKyAoXCIgICAgICAgICAgICAgICAgICAgXCIpLnN1YnN0cigwLCAyNSAtIGVxdWlwLmxlbmd0aCk7XG4gICAgICAgIH1cblxuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHJlbmRlcmVyLCBzcFswXSwgMTAsIGVxdWlwLCBDb2xvcnMuV0hJVEUsIGJhY2tDb2xvcik7XG5cbiAgICAgICAgLy9lcXVpcCA9ICh0aGlzLmVxdWlwbWVudC5hbXVsZXQpPyB0aGlzLmVxdWlwbWVudC5hbXVsZXQuZGVmLm5hbWUgOiAnTk8gQU1VTEVUJztcbiAgICAgICAgLy9VdGlscy5yZW5kZXJUZXh0KHJlbmRlcmVyLCBzcFswXSwgMTAsIGVxdWlwLCBDb2xvcnMuV0hJVEUsIENvbG9ycy5CTEFDSyk7XG5cbiAgICAgICAgLy8gSU5WRU5UT1JZXG4gICAgICAgIGZvciAobGV0IGkgPSBzcFswXSwgbCA9IHNwWzBdICsgc3BbMl07IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLnBsb3QoaSwgMTIsIHJlbmRlcmVyLmdldFRpbGUoQ29sb3JzLkJMVUUpKTtcbiAgICAgICAgfVxuICAgICAgICBVdGlscy5yZW5kZXJUZXh0KHJlbmRlcmVyLCBzcFswXSArIDgsIDEyLCBcIklOVkVOVE9SWVwiLCBDb2xvcnMuV0hJVEUsIENvbG9ycy5CTFVFKTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IE1hdGgubWluKDcsIHRoaXMuaW52ZW50b3J5Lmxlbmd0aCk7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBpbnY6IFdvcmxkSXRlbSA9IHRoaXMuaW52ZW50b3J5W2kgKyB0aGlzLmludmVudG9yeVNjcm9sbF07XG4gICAgICAgICAgICBuYW1lID0gaW52LmRlZi5uYW1lICsgKChpbnYuYW1vdW50ID4gMSkgPyAnICh4JyArIGludi5hbW91bnQgKyAnKScgOiAnJyk7XG5cbiAgICAgICAgICAgIGJhY2tDb2xvciA9IENvbG9ycy5CTEFDSztcbiAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlUG9zaXRpb24gJiYgdGhpcy5tb3VzZVBvc2l0aW9uWzFdIC0gMTMgPT0gaSAmJiB0aGlzLm1vdXNlUG9zaXRpb25bMF0gPCAyNCkge1xuICAgICAgICAgICAgICAgIGJhY2tDb2xvciA9IENvbG9ycy5HUkFZO1xuICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lICsgKFwiICAgICAgICAgICAgICAgICAgIFwiKS5zdWJzdHIoMCwgMjQgLSBuYW1lLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFV0aWxzLnJlbmRlclRleHQocmVuZGVyZXIsIHNwWzBdLCAxMyArIGksIG5hbWUsIENvbG9ycy5XSElURSwgYmFja0NvbG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgICAgICBuYW1lID0gXCIgXCI7XG4gICAgICAgICAgICBpZiAoaSA9PSAwKSB7IG5hbWUgPSBcIlBBR0VVUFwiOyB9IGVsc2UgaWYgKGkgPT0gNikgeyBuYW1lID0gXCJQQUdFRFdOXCIgfVxuXG4gICAgICAgICAgICByZW5kZXJlci5wbG90KDg0LCAxMyArIGksIFV0aWxzLmdldFRpbGUocmVuZGVyZXIsIG5hbWUsIENvbG9ycy5XSElURSwgQ29sb3JzLkdSQVkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNLSUxMU1xuICAgICAgICAvKmZvciAoaT1zcFswXSxsPXNwWzBdK3NwWzJdO2k8bDtpKyspe1xuICAgICAgICAgICAgcmVuZGVyZXIucGxvdChpLCAyMCwgcmVuZGVyZXIuZ2V0VGlsZShDb2xvcnMuQkxVRSkpO1xuICAgICAgICB9XG4gICAgICAgIFV0aWxzLnJlbmRlclRleHQocmVuZGVyZXIsIHNwWzBdICsgOSwgMjAsIFwiU0tJTExTXCIsIENvbG9ycy5XSElURSwgQ29sb3JzLkJMVUUpOyovXG4gICAgfVxufTtcblxuZXhwb3J0IHsgUGxheWVyU3RhdHMgfTsiLCLvu79pbXBvcnQgeyBDb2xvciB9IGZyb20gJy4vZW5naW5lL0NvbG9yJztcbmltcG9ydCB7IFRpbGUgfSBmcm9tICcuL2VuZ2luZS9UaWxlJztcbmltcG9ydCB7IFJlbmRlcmVyIH0gZnJvbSAnLi9lbmdpbmUvUmVuZGVyZXInO1xuXG5sZXQgQ29sb3JzID0ge1xuICAgIEJMQUNLOiB7cjogMCwgZzogMCwgYjogMH0sXG4gICAgV0hJVEU6IHtyOiAyNTUgLyAyNTUsIGc6IDI1NSAvIDI1NSwgYjogMjU1IC8gMjU1fSxcbiAgICBSRUQ6IHsgcjogMjU1IC8gMjU1LCBnOiAwLCBiOiAwIH0sXG4gICAgR1JFRU46IHsgcjogMCwgZzogMTYwIC8gMjU1LCBiOiAwIH0sXG4gICAgQkxVRTogeyByOiAwLCBnOiAwLCBiOiAxNjAgLyAyNTUgfSxcbiAgICBZRUxMT1c6IHsgcjogMTYwIC8gMjU1LCBnOiAxNjAgLyAyNTUsIGI6IDAgfSxcbiAgICBQVVJQTEU6IHsgcjogMTYwIC8gMjU1LCBnOiAwIC8gMjU1LCBiOiAxNjAgLyAyNTUgfSxcbiAgICBBUVVBOiB7IHI6IDAsIGc6IDgwIC8gMjU1LCBiOiAyMDAgLyAyNTUgfSxcbiAgICBHUkFZOiB7IHI6IDEyMiAvIDI1NSwgZzogMTIyIC8gMjU1LCBiOiAxMjIgLyAyNTUgfSxcbiAgICBUQU46IHsgcjogMjA1IC8gMjU1LCBnOiAxMzMgLyAyNTUsIGI6IDYzIC8gMjU1IH0sXG4gICAgT1JBTkdFOiB7IHI6IDI1NSAvIDI1NSwgZzogMTAwIC8gMjU1LCBiOiAwIH0sXG4gICAgR09MRDogeyByOiAyNTUgLyAyNTUsIGc6IDIxNSAvIDI1NSwgYjogMCAvIDI1NSB9LFxuICAgIERBUktfQkxVRTogeyByOiAwIC8gMjU1LCBnOiAwIC8gMjU1LCBiOiA1MCAvIDI1NSB9LFxuICAgIEJST1dOOiB7IHI6IDEzOSAvIDI1NSwgZzogNjkgLyAyNTUsIGI6IDE5IC8gMjU1IH1cbn07XG5cbmxldCBUaWxlczogYW55ID0ge307XG5sZXQgbmFtZXM6IEFycmF5PEFycmF5PHN0cmluZz4+ID0gW1xuICAgIFsnQkxBTksnLCAnRE9UX0MnLCAnUE9JTlQnLCAnQ09MT04nLCAnQ09NTUEnLCAnRVhDTEEnLCAnUVVFU1QnLCAnU1RSVVAnLCAnU1RSRE4nLCAnTU9ORVknLCAnU1RBUicsICdTTEFTSCcsICdQTFVTJywgJ01JTlVTJywgJ1VOREVSJywgJ0VRVUFMJywgJ0hBU0gnLCAnU1FCUk8nLCAnU1FCUkMnLCAnUEFSRU8nLCAnUEFSRUMnLCAnQlJBQ08nLCAnQlJBQ0MnLCAnV0FURVInLCAnV0FUUkQnLF0sXG4gICAgWydBTVBFUicsICdQRVJDVCcsICdRVU9URCcsICdHUkFTSCcsICdRVU9UUycsICdHUkFTUycsICdQTEFZUicsICdQQUdFVVAnLCAnUEFHRURXTicsICdhJywgJ2InLCAnYycsICdkJywgJ2UnLCAnZicsICdnJywgJ2gnLCAnaScsICdqJywgJ2snLCAnbCcsICdtJywgJ24nLCAnbycsICdwJyxdLFxuICAgIFsncScsICdyJywgJ3MnLCAndCcsICd1JywgJ3YnLCAndycsICd4JywgJ3knLCAneicsICdBJywgJ0InLCAnQycsICdEJywgJ0UnLCAnRicsICdHJywgJ0gnLCAnSScsICdKJywgJ0snLCAnTCcsICdNJywgJ04nLCAnTycsXSxcbiAgICBbJ1AnLCAnUScsICdSJywgJ1MnLCAnVCcsICdVJywgJ1YnLCAnVycsICdYJywgJ1knLCAnWicsICdOMCcsICdOMScsICdOMicsICdOMycsICdONCcsICdONScsICdONicsICdONycsICdOOCcsICdOOSddXG5dO1xuXG5mb3IgKGxldCB5ID0gMCwgeWxlbiA9IG5hbWVzLmxlbmd0aDsgeSA8IHlsZW47IHkrKykge1xuICAgIGZvciAobGV0IHggPSAwLCB4bGVuID0gbmFtZXNbeV0ubGVuZ3RoOyB4IDwgeGxlbjsgeCsrKSB7XG4gICAgICAgIGxldCBuYW1lOiBzdHJpbmcgPSBuYW1lc1t5XVt4XTtcbiAgICAgICAgVGlsZXNbbmFtZV0gPSB7IHg6IHgsIHk6IHkgfTtcbiAgICB9XG59XG5cbmVudW0gVGlsZVR5cGVzIHtcbiAgICBHUk9VTkQsXG4gICAgV0FMTCxcbiAgICBXQVRFUixcbiAgICBXQVRFUl9ERUVQXG59O1xuXG5pbnRlcmZhY2UgVGlsZVByZWZhYiB7XG4gICAgbGlnaHQ6IFRpbGUsXG4gICAgZGFyazogVGlsZSxcbiAgICB0eXBlOiBUaWxlVHlwZXNcbn07XG5cbmludGVyZmFjZSBQcmVmYWJJdGVtIHtcbiAgICBbaW5kZXg6IHN0cmluZ106IFRpbGVQcmVmYWJcbn07XG5cbmZ1bmN0aW9uIG11bHRpcGx5Q29sb3IoY29sb3I6IENvbG9yLCBhbW91bnQ6IENvbG9yKTogQ29sb3Ige1xuICAgIHJldHVybiB7XG4gICAgICAgIHI6IGNvbG9yLnIgKiBhbW91bnQucixcbiAgICAgICAgZzogY29sb3IuZyAqIGFtb3VudC5nLFxuICAgICAgICBiOiBjb2xvci5iICogYW1vdW50LmJcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRUaWxlKHJlbmRlcmVyOiBSZW5kZXJlciwgYmFja0NvbG9yOiBDb2xvciwgZnJvbnRDb2xvcjogQ29sb3IsIHRpbGU6IFRpbGUsIGVmZmVjdD86IHZvaWQsIHR5cGU6IFRpbGVUeXBlcyA9IFRpbGVUeXBlcy5HUk9VTkQpOiBUaWxlUHJlZmFiIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBsaWdodDogcmVuZGVyZXIuZ2V0VGlsZShiYWNrQ29sb3IsIGZyb250Q29sb3IsIHRpbGUuY2hhcmFjdGVyLCBlZmZlY3QpLFxuICAgICAgICBkYXJrOiByZW5kZXJlci5nZXRUaWxlKG11bHRpcGx5Q29sb3IoYmFja0NvbG9yLCB7IHI6IDAuMSwgZzogMC4xLCBiOiAwLjUgfSksIG11bHRpcGx5Q29sb3IoZnJvbnRDb2xvciwgeyByOiAwLjEsIGc6IDAuMSwgYjogMC41IH0pLCB0aWxlLmNoYXJhY3RlciwgZWZmZWN0KSxcbiAgICAgICAgdHlwZTogdHlwZVxuICAgIH07XG59XG5cbmludGVyZmFjZSBUaWxlc1ByZWZhYnNWYWx1ZXMge1xuICAgIEJMQU5LOiBUaWxlUHJlZmFiO1xuICAgIFdBTEw6IFRpbGVQcmVmYWI7XG4gICAgRkxPT1I6IFRpbGVQcmVmYWI7XG4gICAgV0FURVI6IFRpbGVQcmVmYWI7XG4gICAgV0FURVJfREVFUDogVGlsZVByZWZhYjtcbiAgICBTVEFJUlNfVVA6IFRpbGVQcmVmYWI7XG4gICAgU1RBSVJTX0RPV046IFRpbGVQcmVmYWI7XG59O1xuXG5sZXQgVGlsZXNQcmVmYWJzID0ge1xuICAgIFRJTEVTOiA8UHJlZmFiSXRlbT57fSxcbiAgICBJVEVNUzogPFByZWZhYkl0ZW0+e30sXG4gICAgRU5FTUlFUzogPFByZWZhYkl0ZW0+e30sXG4gICAgUExBWUVSOiA8VGlsZVByZWZhYj5udWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKHJlbmRlcmVyOiBSZW5kZXJlcikge1xuICAgICAgICBsZXQgdDogVGlsZXNQcmVmYWJzVmFsdWVzID0gdGhpcy5USUxFUztcbiAgICAgICAgbGV0IGkgPSB0aGlzLklURU1TO1xuICAgICAgICBsZXQgZSA9IHRoaXMuRU5FTUlFUztcblxuICAgICAgICAvLyBCbGFua1xuICAgICAgICB0LkJMQU5LID0gZ2V0VGlsZShyZW5kZXJlciwgQ29sb3JzLkJMQUNLLCBDb2xvcnMuQkxBQ0ssIFRpbGVzLkJMQU5LLCBudWxsKTtcblxuICAgICAgICAvLyBXYWxsc1xuICAgICAgICB0LldBTEwgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuR1JBWSwgQ29sb3JzLldISVRFLCBUaWxlcy5IQVNILCBudWxsLCBUaWxlVHlwZXMuV0FMTCk7XG5cbiAgICAgICAgLy8gRmxvb3JzXG4gICAgICAgIHQuRkxPT1IgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5XSElURSwgVGlsZXMuRE9UX0MsIG51bGwpO1xuICAgICAgICB0LldBVEVSID0gZ2V0VGlsZShyZW5kZXJlciwgQ29sb3JzLkFRVUEsIENvbG9ycy5XSElURSwgVGlsZXMuV0FURVIsIG51bGwsIFRpbGVUeXBlcy5XQVRFUik7XG4gICAgICAgIHQuV0FURVJfREVFUCA9IGdldFRpbGUocmVuZGVyZXIsIENvbG9ycy5CTFVFLCBDb2xvcnMuV0hJVEUsIFRpbGVzLldBVFJELCBudWxsLCBUaWxlVHlwZXMuV0FURVJfREVFUCk7XG5cbiAgICAgICAgLy8gU3RhaXJzXG4gICAgICAgIHQuU1RBSVJTX1VQID0gZ2V0VGlsZShyZW5kZXJlciwgQ29sb3JzLkJMQUNLLCBDb2xvcnMuWUVMTE9XLCBUaWxlcy5TVFJVUCk7XG4gICAgICAgIHQuU1RBSVJTX0RPV04gPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5ZRUxMT1csIFRpbGVzLlNUUkROKTtcblxuICAgICAgICAvLyBHb2xkXG4gICAgICAgIGkuR09MRCA9IGdldFRpbGUocmVuZGVyZXIsIENvbG9ycy5CTEFDSywgQ29sb3JzLkdPTEQsIFRpbGVzLk1PTkVZLCBudWxsKTtcblxuICAgICAgICAvLyBJdGVtc1xuICAgICAgICBpLlJFRF9QT1RJT04gPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5SRUQsIFRpbGVzLkVYQ0xBKTtcbiAgICAgICAgaS5HUkVFTl9QT1RJT04gPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5HUkVFTiwgVGlsZXMuRVhDTEEpO1xuICAgICAgICBpLkJMVUVfUE9USU9OID0gZ2V0VGlsZShyZW5kZXJlciwgQ29sb3JzLkJMQUNLLCBDb2xvcnMuQkxVRSwgVGlsZXMuRVhDTEEpO1xuICAgICAgICBpLllFTExPV19QT1RJT04gPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5ZRUxMT1csIFRpbGVzLkVYQ0xBKTtcbiAgICAgICAgaS5BUVVBX1BPVElPTiA9IGdldFRpbGUocmVuZGVyZXIsIENvbG9ycy5CTEFDSywgQ29sb3JzLkFRVUEsIFRpbGVzLkVYQ0xBKTtcbiAgICAgICAgaS5XSElURV9QT1RJT04gPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5XSElURSwgVGlsZXMuRVhDTEEpO1xuICAgICAgICBpLlBVUlBMRV9QT1RJT04gPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5QVVJQTEUsIFRpbGVzLkVYQ0xBKTtcbiAgICAgICAgaS5UQU5fUE9USU9OID0gZ2V0VGlsZShyZW5kZXJlciwgQ29sb3JzLkJMQUNLLCBDb2xvcnMuVEFOLCBUaWxlcy5FWENMQSk7XG4gICAgICAgIGkuT1JBTkdFX1BPVElPTiA9IGdldFRpbGUocmVuZGVyZXIsIENvbG9ycy5CTEFDSywgQ29sb3JzLk9SQU5HRSwgVGlsZXMuRVhDTEEpO1xuXG4gICAgICAgIC8vIFdlYXBvbnNcbiAgICAgICAgaS5EQUdHRVIgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5XSElURSwgVGlsZXMuTUlOVVMpO1xuICAgICAgICBpLlNXT1JEID0gZ2V0VGlsZShyZW5kZXJlciwgQ29sb3JzLkJMQUNLLCBDb2xvcnMuV0hJVEUsIFRpbGVzLlNMQVNIKTtcbiAgICAgICAgaS5MT05HX1NXT1JEID0gZ2V0VGlsZShyZW5kZXJlciwgQ29sb3JzLkJMQUNLLCBDb2xvcnMuQVFVQSwgVGlsZXMuU0xBU0gpO1xuICAgICAgICBpLk1BQ0UgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5XSElURSwgVGlsZXMuVU5ERVIpO1xuICAgICAgICBpLlNQRUFSID0gZ2V0VGlsZShyZW5kZXJlciwgQ29sb3JzLkJMQUNLLCBDb2xvcnMuQlJPV04sIFRpbGVzLlNMQVNIKTtcbiAgICAgICAgaS5BWEUgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5HUkVFTiwgVGlsZXMuTUlOVVMpO1xuXG4gICAgICAgIC8vIEFybW9yc1xuICAgICAgICBpLkxFQVRIRVJfQVJNT1IgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5CUk9XTiwgVGlsZXMuU1FCUk8pO1xuICAgICAgICBpLlNDQUxFX01BSUwgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5HUkFZLCBUaWxlcy5TUUJSTyk7XG4gICAgICAgIGkuQ0hBSU5fTUFJTCA9IGdldFRpbGUocmVuZGVyZXIsIENvbG9ycy5CTEFDSywgQ29sb3JzLldISVRFLCBUaWxlcy5TUUJSTyk7XG4gICAgICAgIGkuUExBVEVfQVJNT1IgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5HT0xELCBUaWxlcy5TUUJSTyk7XG5cbiAgICAgICAgLy8gRW5lbWllc1xuICAgICAgICBlLlJBVCA9IGdldFRpbGUocmVuZGVyZXIsIENvbG9ycy5CTEFDSywgQ29sb3JzLldISVRFLCBUaWxlcy5yKTtcbiAgICAgICAgZS5TUElERVIgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5HUkFZLCBUaWxlcy5zKTtcbiAgICAgICAgZS5LT0JPTEQgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5HUkVFTiwgVGlsZXMuayk7XG4gICAgICAgIGUuSU1QID0gZ2V0VGlsZShyZW5kZXJlciwgQ29sb3JzLkJMQUNLLCBDb2xvcnMuUkVELCBUaWxlcy5pKTtcbiAgICAgICAgZS5HT0JMSU4gPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5BUVVBLCBUaWxlcy5nKTtcbiAgICAgICAgZS5aT01CSUUgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5SRUQsIFRpbGVzLnopO1xuICAgICAgICBlLk9HUkUgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5CUk9XTiwgVGlsZXMubyk7XG4gICAgICAgIGUuUk9HVUUgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5SRUQsIFRpbGVzLlIpO1xuICAgICAgICBlLkJFR0dBUiA9IGdldFRpbGUocmVuZGVyZXIsIENvbG9ycy5CTEFDSywgQ29sb3JzLkJST1dOLCBUaWxlcy5iKTtcbiAgICAgICAgZS5TSEFET1cgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5QVVJQTEUsIFRpbGVzLlMpO1xuICAgICAgICBlLlRISUVGID0gZ2V0VGlsZShyZW5kZXJlciwgQ29sb3JzLkJMQUNLLCBDb2xvcnMuUFVSUExFLCBUaWxlcy50KTtcbiAgICAgICAgZS5DQU9TX0tOSUdIVCA9IGdldFRpbGUocmVuZGVyZXIsIENvbG9ycy5CTEFDSywgQ29sb3JzLlJFRCwgVGlsZXMuSyk7XG4gICAgICAgIGUuTElaQVJEX1dBUlJJT1IgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5HUkVFTiwgVGlsZXMubCk7XG4gICAgICAgIGUuT1BISURJQU4gPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5HUkVFTiwgVGlsZXMuTyk7XG4gICAgICAgIGUuQ0FPU19TRVJWQU5UID0gZ2V0VGlsZShyZW5kZXJlciwgQ29sb3JzLkJMQUNLLCBDb2xvcnMuUFVSUExFLCBUaWxlcy5DKTtcbiAgICAgICAgZS5XWVZFUk5fS05JR0hUID0gZ2V0VGlsZShyZW5kZXJlciwgQ29sb3JzLkJMQUNLLCBDb2xvcnMuUFVSUExFLCBUaWxlcy5XKTtcbiAgICAgICAgZS5DQU9TX0xPUkQgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5SRUQsIFRpbGVzLkwpO1xuICAgICAgICBlLlNPREkgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5QVVJQTEUsIFRpbGVzLlBMQVlSKTtcblxuICAgICAgICAvLyBQbGF5ZXJcbiAgICAgICAgdGhpcy5QTEFZRVIgPSBnZXRUaWxlKHJlbmRlcmVyLCBDb2xvcnMuQkxBQ0ssIENvbG9ycy5XSElURSwgVGlsZXMuUExBWVIsIG51bGwpO1xuICAgIH1cbn07XG5cbmV4cG9ydCB7IENvbG9ycywgVGlsZXMsIFRpbGVQcmVmYWIsIFRpbGVzUHJlZmFicywgVGlsZVR5cGVzIH07Iiwi77u/YWJzdHJhY3QgY2xhc3MgU2NlbmFyaW8ge1xyXG4gICAgb25Nb3VzZU1vdmUoeDogbnVtYmVyLCB5OiBudW1iZXIpIHsgfVxyXG4gICAgb25Nb3VzZUhhbmRsZXIoeDogbnVtYmVyLCB5OiBudW1iZXIsIHN0YXQ6IG51bWJlcikgeyB9XHJcbiAgICByZW5kZXIoKSB7IH1cclxufVxyXG5cclxuZXhwb3J0IHsgU2NlbmFyaW8gfTsiLCLvu79pbXBvcnQgeyBUaWxlUHJlZmFiIH0gZnJvbSAnLi9QcmVmYWJzJztcbmltcG9ydCB7IEluc3RhbmNlIH0gZnJvbSAnLi9JbnN0YW5jZSc7XG5pbXBvcnQgeyBNYXAgfSBmcm9tICcuL01hcCc7XG5pbXBvcnQgeyBWZWN0b3IyIH0gZnJvbSAnLi9lbmdpbmUvVmVjdG9yMic7XG5cbmNsYXNzIFN0YWlycyBleHRlbmRzIEluc3RhbmNlIHtcbiAgICBkaXI6IG51bWJlcjtcblxuICAgIHBsYXllck9uVGlsZTogYm9vbGVhbjtcblxuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyLCBtYXA6IE1hcCwgcHVibGljIHRhcmdldDogbnVtYmVyLCB0aWxlOiBUaWxlUHJlZmFiKSB7XG4gICAgICAgIHN1cGVyKHgsIHksIG1hcCwgdGlsZSk7XG5cbiAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgIHRoaXMuZGlyID0gKHRhcmdldCAtIG1hcC5sZXZlbCA+IDApID8gMSA6IDA7XG4gICAgICAgIHRoaXMubmFtZSA9ICh0aGlzLmRpciA9PSAxKSA/IFwiU3RhaXJzIGRvd25cIiA6IFwiU3RhaXJzIHVwXCI7XG5cbiAgICAgICAgdGhpcy5wbGF5ZXJPblRpbGUgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuZGlzY292ZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmluU2hhZG93ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5zdG9wT25EaXNjb3ZlciA9IHRydWU7XG4gICAgICAgIHRoaXMudmlzaWJsZUluU2hhZG93ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIHRoaXMuaW5TaGFkb3cgPSB0cnVlO1xuXG4gICAgICAgIHZhciBwID0gdGhpcy5tYXAucGxheWVyO1xuICAgICAgICBpZiAocC54ID09IHRoaXMueCAmJiBwLnkgPT0gdGhpcy55KSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMucGxheWVyT25UaWxlICYmICFwLm1vdmVQYXRoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXAuZ2FtZS5nb3RvTGV2ZWwodGhpcy50YXJnZXQsIHRoaXMuZGlyKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucGxheWVyT25UaWxlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnBsYXllck9uVGlsZSkge1xuICAgICAgICAgICAgdGhpcy5wbGF5ZXJPblRpbGUgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm1hcC5tYXBbdGhpcy55XVt0aGlzLnhdLnZpc2libGUgPT0gMikge1xuICAgICAgICAgICAgdGhpcy5pblNoYWRvdyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBsZXQgbXA6IFZlY3RvcjIgPSB0aGlzLm1hcC5tb3VzZVBvc2l0aW9uO1xuICAgICAgICAgICAgaWYgKG1wLnggPT0gdGhpcy54ICYmIG1wLnkgPT0gdGhpcy55KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXAudGlsZURlc2NyaXB0aW9uID0gdGhpcy5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubWFwLm1hcFt0aGlzLnldW3RoaXMueF0udmlzaWJsZSA8PSAxKSB7XG4gICAgICAgICAgICB0aGlzLmRpc2NvdmVyZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgU3RhaXJzIH07Iiwi77u/aW1wb3J0IHsgQ29sb3JzLCBUaWxlcyB9IGZyb20gJy4vUHJlZmFicyc7XG5pbXBvcnQgeyBSZW5kZXJlciB9IGZyb20gJy4vZW5naW5lL1JlbmRlcmVyJztcbmltcG9ydCB7IENvbG9yIH0gZnJvbSAnLi9lbmdpbmUvQ29sb3InO1xuaW1wb3J0IHsgVGlsZSB9IGZyb20gJy4vZW5naW5lL1RpbGUnO1xuaW1wb3J0IHsgQ2hhcmFjdGVyIH0gZnJvbSAnLi9lbmdpbmUvQ2hhcmFjdGVyJztcblxubGV0IFV0aWxzID0ge1xuICAgIHJvbGxEaWNlOiBmdW5jdGlvbiAodmFsdWU6IHN0cmluZyk6IG51bWJlciB7XG4gICAgICAgIGxldCBhcnJheTogQXJyYXk8c3RyaW5nPiA9IHZhbHVlLnNwbGl0KC9bRFxcKypdLyksXG4gICAgICAgICAgICBhOiBudW1iZXIgPSBwYXJzZUludChhcnJheVswXSwgMTApLFxuICAgICAgICAgICAgYjogbnVtYmVyID0gcGFyc2VJbnQoYXJyYXlbMV0sIDEwKSxcbiAgICAgICAgICAgIGM6IG51bWJlciA9IHBhcnNlSW50KGFycmF5WzJdLCAxMCkgfHwgMDtcblxuICAgICAgICBsZXQgcmV0OiBudW1iZXIgPSBjO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGE7IGkrKykge1xuICAgICAgICAgICAgcmV0ICs9IChNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAoYiAtIDEpKSkgKyAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuXG4gICAgZm9ybWF0VGV4dDogZnVuY3Rpb24gKHRleHQ6IHN0cmluZywgd2lkdGg6IG51bWJlcik6IEFycmF5PHN0cmluZz4ge1xuICAgICAgICBsZXQgcmV0OiBBcnJheTxzdHJpbmc+ID0gW10sXG4gICAgICAgICAgICB3b3JkczogQXJyYXk8c3RyaW5nPiA9IHRleHQuc3BsaXQoXCIgXCIpLFxuICAgICAgICAgICAgbGluZTogc3RyaW5nID0gXCJcIjtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgdzogc3RyaW5nID0gd29yZHNbaV07XG5cbiAgICAgICAgICAgIGlmIChsaW5lLmxlbmd0aCArIHcubGVuZ3RoICsgMSA8PSB3aWR0aCkge1xuICAgICAgICAgICAgICAgIGxpbmUgKz0gXCIgXCIgKyB3O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXQucHVzaChsaW5lLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgbGluZSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxpbmUgIT0gXCJcIikge1xuICAgICAgICAgICAgcmV0LnB1c2gobGluZS50cmltKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuXG4gICAgZ2V0VGlsZTogZnVuY3Rpb24gKHJlbmRlcmVyOiBSZW5kZXJlciwgY2hhcmE6IHN0cmluZywgY29sb3I6IENvbG9yLCBiYWNrQ29sb3I6IENvbG9yID0gQ29sb3JzLkJMQUNLKTogVGlsZSB7XG4gICAgICAgIHZhciB0aWxlID0gY2hhcmE7XG5cbiAgICAgICAgaWYgKHRpbGUgPT0gXCIhXCIpIHsgdGlsZSA9IFwiRVhDTEFcIjsgfSBlbHNlXG4gICAgICAgIGlmICh0aWxlID09IFwiLlwiKSB7IHRpbGUgPSBcIlBPSU5UXCI7IH0gZWxzZVxuICAgICAgICBpZiAodGlsZSA9PSBcIjpcIikgeyB0aWxlID0gXCJDT0xPTlwiOyB9IGVsc2VcbiAgICAgICAgaWYgKHRpbGUgPT0gXCIsXCIpIHsgdGlsZSA9IFwiQ09NTUFcIjsgfSBlbHNlXG4gICAgICAgIGlmICh0aWxlID09IFwiP1wiKSB7IHRpbGUgPSBcIlFVRVNUXCI7IH0gZWxzZVxuICAgICAgICBpZiAodGlsZSA9PSBcIjxcIikgeyB0aWxlID0gXCJTVFJVUFwiOyB9IGVsc2VcbiAgICAgICAgaWYgKHRpbGUgPT0gXCI+XCIpIHsgdGlsZSA9IFwiU1RSRE5cIjsgfSBlbHNlXG4gICAgICAgIGlmICh0aWxlID09IFwiK1wiKSB7IHRpbGUgPSBcIlBMVVNcIjsgfSBlbHNlXG4gICAgICAgIGlmICh0aWxlID09IFwiLVwiKSB7IHRpbGUgPSBcIk1JTlVTXCI7IH0gZWxzZVxuICAgICAgICBpZiAodGlsZSA9PSBcIiRcIikgeyB0aWxlID0gXCJNT05FWVwiOyB9IGVsc2VcbiAgICAgICAgaWYgKHRpbGUgPT0gXCIoXCIpIHsgdGlsZSA9IFwiUEFSRU9cIjsgfSBlbHNlXG4gICAgICAgIGlmICh0aWxlID09IFwiKVwiKSB7IHRpbGUgPSBcIlBBUkVDXCI7IH0gZWxzZVxuICAgICAgICBpZiAodGlsZSA9PSBcIidcIikgeyB0aWxlID0gXCJRVU9UU1wiOyB9IGVsc2VcbiAgICAgICAgaWYgKHRpbGUgPT0gJ1wiJykgeyB0aWxlID0gXCJRVU9URFwiOyB9IGVsc2VcbiAgICAgICAgaWYgKHRpbGUgPT0gXCIvXCIpIHsgdGlsZSA9IFwiU0xBU0hcIjsgfSBlbHNlXG4gICAgICAgIGlmICh0aWxlID09IFwiJVwiKSB7IHRpbGUgPSBcIlBFUkNUXCI7IH0gZWxzZVxuICAgICAgICBpZiAodGlsZSA9PSBcIj1cIikgeyB0aWxlID0gXCJFUVVBTFwiOyB9IGVsc2VcbiAgICAgICAgaWYgKHRpbGUgPT0gXCIjXCIpIHsgdGlsZSA9IFwiSEFTSFwiOyB9IGVsc2VcbiAgICAgICAgaWYgKHRpbGUgPj0gXCIwXCIgJiYgdGlsZSA8PSBcIjlcIikgeyB0aWxlID0gXCJOXCIgKyB0aWxlOyB9XG5cbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyLmdldFRpbGUoYmFja0NvbG9yLCBjb2xvciwgPENoYXJhY3Rlcj5UaWxlc1t0aWxlXSk7XG4gICAgfSxcblxuICAgIHJlbmRlclRleHQ6IGZ1bmN0aW9uIChyZW5kZXJlcjogUmVuZGVyZXIsIHg6IG51bWJlciwgeTogbnVtYmVyLCB0ZXh0OiBzdHJpbmcsIGNvbG9yOiBDb2xvciA9IENvbG9ycy5XSElURSwgYmFja0NvbG9yOiBDb2xvciA9IENvbG9ycy5CTEFDSykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCB0OiBzdHJpbmcgPSB0ZXh0W2ldO1xuXG4gICAgICAgICAgICBpZiAoYmFja0NvbG9yID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZW5kZXJlci5wbG90Q2hhcmFjdGVyKHggKyBpLCB5LCB0aGlzLmdldFRpbGUocmVuZGVyZXIsIHQsIGNvbG9yLCBiYWNrQ29sb3IpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVuZGVyZXIucGxvdCh4ICsgaSwgeSwgdGhpcy5nZXRUaWxlKHJlbmRlcmVyLCB0LCBjb2xvciwgYmFja0NvbG9yKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnQgeyBVdGlscyB9OyIsIu+7vyBsZXQgSW5wdXQgPSB7XG4gICAga2V5Q29kZXM6IG5ldyBVaW50OENsYW1wZWRBcnJheSgyNTUpLFxuICAgIGtleXM6IDxhbnk+e1xuICAgICAgICBMRUZUOiAzNyxcbiAgICAgICAgVVA6IDM4LFxuICAgICAgICBSSUdIVDogMzksXG4gICAgICAgIERPV046IDQwLFxuXG4gICAgICAgIFNQQUNFOiAzMlxuICAgIH0sXG5cbiAgICBrZExpc3RlbmVyczogPEFycmF5PEZ1bmN0aW9uPj5bXSxcbiAgICBtbUxpc3RlbmVyczogPEFycmF5PEZ1bmN0aW9uPj5bXSxcbiAgICBtZExpc3RlbmVyczogPEFycmF5PEZ1bmN0aW9uPj5bXSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uIChjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkub25rZXlkb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmtleUNvZGVzW2V2ZW50LmtleUNvZGVdID0gMTtcblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGtkOiBGdW5jdGlvbjsga2QgPSB0aGlzLmtkTGlzdGVuZXJzW2ldOyBpKyspIHtcbiAgICAgICAgICAgICAgICBrZChldmVudC5rZXlDb2RlLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBkb2N1bWVudC5ib2R5Lm9ua2V5dXAgPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMua2V5Q29kZXNbZXZlbnQua2V5Q29kZV0gPSAwO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwga2Q6IEZ1bmN0aW9uOyBrZCA9IHRoaXMua2RMaXN0ZW5lcnNbaV07IGkrKykge1xuICAgICAgICAgICAgICAgIGtkKGV2ZW50LmtleUNvZGUsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNhbnZhcy5vbm1vdXNlbW92ZSA9IChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgbGV0IHggPSBldmVudC5jbGllbnRYIC0gY2FudmFzLm9mZnNldExlZnQsXG4gICAgICAgICAgICAgICAgeSA9IGV2ZW50LmNsaWVudFkgLSBjYW52YXMub2Zmc2V0VG9wO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbW06IEZ1bmN0aW9uOyBtbSA9IHRoaXMubW1MaXN0ZW5lcnNbaV07IGkrKykge1xuICAgICAgICAgICAgICAgIG1tKHgsIHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNhbnZhcy5vbm1vdXNlZG93biA9IChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgbGV0IHggPSBldmVudC5jbGllbnRYIC0gY2FudmFzLm9mZnNldExlZnQsXG4gICAgICAgICAgICAgICAgeSA9IGV2ZW50LmNsaWVudFkgLSBjYW52YXMub2Zmc2V0VG9wO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbWQ6IEZ1bmN0aW9uOyBtZCA9IHRoaXMubWRMaXN0ZW5lcnNbaV07IGkrKykge1xuICAgICAgICAgICAgICAgIG1kKHgsIHksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNhbnZhcy5vbm1vdXNldXAgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGxldCB4ID0gZXZlbnQuY2xpZW50WCAtIGNhbnZhcy5vZmZzZXRMZWZ0LFxuICAgICAgICAgICAgICAgIHkgPSBldmVudC5jbGllbnRZIC0gY2FudmFzLm9mZnNldFRvcDtcblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIG1kOiBGdW5jdGlvbjsgbWQgPSB0aGlzLm1kTGlzdGVuZXJzW2ldOyBpKyspIHtcbiAgICAgICAgICAgICAgICBtZCh4LCB5LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY2xlYXJMaXN0ZW5lcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5rZExpc3RlbmVycyA9IFtdO1xuICAgICAgICB0aGlzLm1tTGlzdGVuZXJzID0gW107XG4gICAgICAgIHRoaXMubWRMaXN0ZW5lcnMgPSBbXTtcbiAgICB9LFxuXG4gICAgYWRkS2V5RG93bkxpc3RlbmVyOiBmdW5jdGlvbiAoY2FsbGJhY2s6IEZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMua2RMaXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gICAgfSxcblxuICAgIGFkZE1vdXNlTW92ZUxpc3RlbmVyOiBmdW5jdGlvbiAoY2FsbGJhY2s6IEZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMubW1MaXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gICAgfSxcblxuICAgIGFkZE1vdXNlRG93bkxpc3RlbmVyOiBmdW5jdGlvbiAoY2FsbGJhY2s6IEZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMubWRMaXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gICAgfVxufTtcblxuZm9yIChsZXQgaSA9IDY1OyBpIDw9IDkwOyBpKyspIHtcbiAgICBJbnB1dC5rZXlzW1N0cmluZy5mcm9tQ2hhckNvZGUoaSldID0gaTtcbiB9XG5cbmV4cG9ydCB7IElucHV0IH07Iiwi77u/Y2xhc3MgUmFuZG9tIHtcbiAgICBzZWVkOiBudW1iZXI7XG4gICAgb3JTZWVkOiBudW1iZXI7XG4gICAgbWF4OiBudW1iZXI7XG4gICAgY291bnQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKHNlZWQ6IG51bWJlciA9IG51bGwpIHtcbiAgICAgICAgdGhpcy5tYXggPSAyIDw8IDE1O1xuICAgICAgICB0aGlzLmNvdW50ID0gMTtcbiAgICAgICAgdGhpcy5zZXRTZWVkKHNlZWQpO1xuICAgIH1cblxuICAgIHNldFNlZWQoc2VlZDogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuc2VlZCA9IChzZWVkID09IG51bGwpID8gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogdGhpcy5tYXgpIDogc2VlZDtcbiAgICAgICAgdGhpcy5vclNlZWQgPSB0aGlzLnNlZWQ7XG5cbiAgICAgICAgdGhpcy5zZWVkID0gdGhpcy5zZWVkIHwgMjQ7XG4gICAgfVxuXG4gICAgcmFuZG9tKCk6IG51bWJlciB7XG4gICAgICAgIHRoaXMuY291bnQgPSAoKHRoaXMuY291bnQgKiAxLjUpICUgNTApID4+IDA7XG4gICAgICAgIHRoaXMuc2VlZCA9ICgodGhpcy5zZWVkICsgKHRoaXMuc2VlZCAqIHRoaXMuc2VlZCkgfCB0aGlzLmNvdW50KSA+Pj4gMzIpICUgdGhpcy5tYXg7XG5cbiAgICAgICAgbGV0IHJldDogbnVtYmVyID0gdGhpcy5zZWVkIC8gdGhpcy5tYXg7XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFJhbmRvbSBhcyBQUk5HIH07Iiwi77u/aW1wb3J0IHsgVGlsZSB9IGZyb20gJy4vVGlsZSc7XG5pbXBvcnQgeyBDb2xvciB9IGZyb20gJy4vQ29sb3InO1xuaW1wb3J0IHsgQ2hhcmFjdGVyIH0gZnJvbSAnLi9DaGFyYWN0ZXInO1xuaW1wb3J0IHsgU2hhZGVyIH0gZnJvbSAnLi9TaGFkZXInO1xuaW1wb3J0IHsgQmFzaWNTaGFkZXIgfSBmcm9tICcuL3NoYWRlcnMvQmFzaWMnO1xuXG5pbnRlcmZhY2UgU2NyZWVuQnVmZmVyIHtcbiAgICB2ZXJ0ZXhQb3NpdGlvbkJ1ZmZlcjogV2ViR0xCdWZmZXIsXG4gICAgdmVydGV4QmFja2dyb3VuZEJ1ZmZlcjogV2ViR0xCdWZmZXIsXG4gICAgdmVydGV4Rm9yZWdyb3VuZEJ1ZmZlcjogV2ViR0xCdWZmZXIsXG4gICAgdmVydGV4Q2hhcmFjdGVyQnVmZmVyOiBXZWJHTEJ1ZmZlcixcbiAgICBpbmRleEJ1ZmZlcjogV2ViR0xCdWZmZXIsXG5cbiAgICBiYWNrZ3JvdW5kOiBBcnJheTxudW1iZXI+LFxuICAgIGZvcmVncm91bmQ6IEFycmF5PG51bWJlcj4sXG4gICAgY2hhcmFjdGVyczogQXJyYXk8bnVtYmVyPixcblxuICAgIGluZGV4TnVtYmVyOiBudW1iZXIsXG5cbiAgICB1cGRhdGVkOiBib29sZWFuXG59O1xuXG5mdW5jdGlvbiBjcmVhdGVDYW52YXMod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGNvbnRhaW5lcjogSFRNTERpdkVsZW1lbnQgPSBudWxsKTogSFRNTENhbnZhc0VsZW1lbnQge1xuICAgIGxldCBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2FudmFzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2FudmFzO1xufVxuXG5mdW5jdGlvbiBnZXRDb250ZXh0KGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQge1xuICAgIGxldCBnbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0ID0gPFdlYkdMUmVuZGVyaW5nQ29udGV4dD4gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKTtcblxuICAgIGlmICghZ2wpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiWW91ciBicm93c2VyIGRvZXNuJ3Qgc3VwcG9ydCB0aGUgdXNlIG9mIFdlYkdMXCIpO1xuICAgIH1cblxuICAgIHJldHVybiBnbDtcbn1cblxuY2xhc3MgUmVuZGVyZXIge1xuICAgIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgZ2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dDtcblxuICAgIHBpeGVsU2l6ZTogQXJyYXk8bnVtYmVyPjtcbiAgICByZXNvbHV0aW9uOiBBcnJheTxudW1iZXI+O1xuXG4gICAgZm9udEltYWdlOiBIVE1MSW1hZ2VFbGVtZW50O1xuICAgIGZvbnRUZXh0dXJlOiBXZWJHTFRleHR1cmU7XG4gICAgZm9udFJlYWR5OiBib29sZWFuO1xuXG4gICAgYmxhY2s6IFRpbGU7XG5cbiAgICB0aW1lOiBudW1iZXI7XG4gICAgbGFzdFRpbWU6IG51bWJlcjtcblxuICAgIG1haW5TdXJmYWNlOiBTY3JlZW5CdWZmZXI7XG5cbiAgICBzaGFkZXJzOiBhbnk7XG5cbiAgICBjb25zdHJ1Y3Rvcih3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudCkge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGNyZWF0ZUNhbnZhcyh3aWR0aCwgaGVpZ2h0LCBjb250YWluZXIpO1xuICAgICAgICB0aGlzLmdsID0gZ2V0Q29udGV4dCh0aGlzLmNhbnZhcyk7XG5cbiAgICAgICAgLy8gVE9ETzogTW92ZSB0aGlzIHRvIGludGVyZmFjZXMgKD8pXG4gICAgICAgIHRoaXMucGl4ZWxTaXplID0gWzEwLjAsIDE2LjBdO1xuICAgICAgICB0aGlzLnJlc29sdXRpb24gPSBbdGhpcy5jYW52YXMud2lkdGggLyB0aGlzLnBpeGVsU2l6ZVswXSwgdGhpcy5jYW52YXMuaGVpZ2h0IC8gdGhpcy5waXhlbFNpemVbMV1dO1xuXG4gICAgICAgIHRoaXMuZm9udFRleHR1cmUgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuYmxhY2sgPSBuZXcgVGlsZSgpO1xuXG4gICAgICAgIHRoaXMudGltZSA9IDAuMDtcbiAgICAgICAgdGhpcy5sYXN0VGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgdGhpcy5zZXR1cEJhc2ljUHJvcGVydGllcygpO1xuXG4gICAgICAgIHRoaXMuc2hhZGVycyA9IHtcbiAgICAgICAgICAgIGJhc2ljOiBuZXcgU2hhZGVyKHRoaXMuZ2wsIEJhc2ljU2hhZGVyKVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubWFpblN1cmZhY2UgPSB0aGlzLmNyZWF0ZVJlbmRlcmluZ1RhcmdldCgpO1xuICAgICAgICB0aGlzLnNoYWRlcnMuYmFzaWMudXNlUHJvZ3JhbSgpO1xuICAgIH1cblxuICAgIHNldHVwQmFzaWNQcm9wZXJ0aWVzKCkge1xuICAgICAgICBsZXQgZ2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCA9IHRoaXMuZ2w7XG5cbiAgICAgICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgICAgICBnbC5lbmFibGUoZ2wuQ1VMTF9GQUNFKTtcblxuICAgICAgICBnbC52aWV3cG9ydCgwLCAwLCBnbC5jYW52YXMud2lkdGgsIGdsLmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICBnbC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDEuMCk7XG4gICAgfVxuXG4gICAgc2V0Rm9udFRleHR1cmUoc3JjOiBzdHJpbmcpOiBIVE1MSW1hZ2VFbGVtZW50IHtcbiAgICAgICAgdGhpcy5mb250SW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgdGhpcy5mb250SW1hZ2Uuc3JjID0gc3JjO1xuICAgICAgICB0aGlzLmZvbnRSZWFkeSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuZm9udFRleHR1cmUgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZm9udEltYWdlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgIGxldCBnbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0ID0gdGhpcy5nbDtcblxuICAgICAgICAgICAgdGhpcy5mb250VGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcblxuICAgICAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy5mb250VGV4dHVyZSk7XG4gICAgICAgICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIHRoaXMuZm9udEltYWdlKTtcbiAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUKTtcbiAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcbiAgICAgICAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfMkQpO1xuXG4gICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcblxuICAgICAgICAgICAgdGhpcy5mb250UmVhZHkgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLmZvbnRJbWFnZTtcbiAgICB9XG5cbiAgICBjcmVhdGVSZW5kZXJpbmdUYXJnZXQoKTogU2NyZWVuQnVmZmVyIHtcbiAgICAgICAgbGV0IGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQgPSB0aGlzLmdsO1xuXG4gICAgICAgIGxldCBzY3JlZW5XaWR0aDogbnVtYmVyID0gZ2wuY2FudmFzLndpZHRoIC8gdGhpcy5waXhlbFNpemVbMF07XG4gICAgICAgIGxldCBzY3JlZW5IZWlnaHQ6IG51bWJlciA9IGdsLmNhbnZhcy5oZWlnaHQgLyB0aGlzLnBpeGVsU2l6ZVsxXTtcblxuICAgICAgICBsZXQgdHJpYW5nbGVXaWR0aDogbnVtYmVyID0gdGhpcy5waXhlbFNpemVbMF0gLyBnbC5jYW52YXMud2lkdGggKiAyLjA7XG4gICAgICAgIGxldCB0cmlhbmdsZUhlaWdodDogbnVtYmVyID0gdGhpcy5waXhlbFNpemVbMV0gLyBnbC5jYW52YXMuaGVpZ2h0ICogMi4wO1xuXG4gICAgICAgIGxldCB2ZXJ0aWNlczogQXJyYXk8bnVtYmVyPiA9IFtdO1xuICAgICAgICBsZXQgaW5kaWNlczogQXJyYXk8bnVtYmVyPiA9IFtdO1xuICAgICAgICBsZXQgYmFja2dyb3VuZDogQXJyYXk8bnVtYmVyPiA9IFtdO1xuICAgICAgICBsZXQgZm9yZWdyb3VuZDogQXJyYXk8bnVtYmVyPiA9IFtdO1xuICAgICAgICBsZXQgY2hhcmFjdGVyczogQXJyYXk8bnVtYmVyPiA9IFtdO1xuICAgICAgICBsZXQgaW5kZXg6IG51bWJlciA9IDA7XG5cbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBzY3JlZW5XaWR0aDsgeCArPSAxKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IHNjcmVlbkhlaWdodDsgeSArPSAxKSB7XG4gICAgICAgICAgICAgICAgdmVydGljZXMucHVzaCh4ICogdHJpYW5nbGVXaWR0aCk7XG4gICAgICAgICAgICAgICAgdmVydGljZXMucHVzaCgoeSArIDEpICogdHJpYW5nbGVIZWlnaHQpO1xuXG4gICAgICAgICAgICAgICAgdmVydGljZXMucHVzaCgoeCArIDEpICogdHJpYW5nbGVXaWR0aCk7XG4gICAgICAgICAgICAgICAgdmVydGljZXMucHVzaCgoeSArIDEpICogdHJpYW5nbGVIZWlnaHQpO1xuXG4gICAgICAgICAgICAgICAgdmVydGljZXMucHVzaCh4ICogdHJpYW5nbGVXaWR0aCk7XG4gICAgICAgICAgICAgICAgdmVydGljZXMucHVzaCh5ICogdHJpYW5nbGVIZWlnaHQpO1xuXG4gICAgICAgICAgICAgICAgdmVydGljZXMucHVzaCgoeCArIDEpICogdHJpYW5nbGVXaWR0aCk7XG4gICAgICAgICAgICAgICAgdmVydGljZXMucHVzaCh5ICogdHJpYW5nbGVIZWlnaHQpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAxMjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQucHVzaCgwLjApO1xuICAgICAgICAgICAgICAgICAgICBmb3JlZ3JvdW5kLnB1c2goMC4wKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGogPCA4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXJzLnB1c2goMC4wKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCB0b3BMOiBudW1iZXIsIHRvcFI6IG51bWJlciwgYm90TDogbnVtYmVyLCBib3RSOiBudW1iZXI7XG5cbiAgICAgICAgICAgICAgICB0b3BMID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgdG9wUiA9IGluZGV4ICsgMTtcbiAgICAgICAgICAgICAgICBib3RMID0gaW5kZXggKyAyO1xuICAgICAgICAgICAgICAgIGJvdFIgPSBpbmRleCArIDM7XG5cbiAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2goYm90TCk7XG4gICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKHRvcEwpO1xuICAgICAgICAgICAgICAgIGluZGljZXMucHVzaChib3RSKTtcblxuICAgICAgICAgICAgICAgIGluZGljZXMucHVzaCh0b3BMKTtcbiAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2godG9wUik7XG4gICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGJvdFIpO1xuXG4gICAgICAgICAgICAgICAgaW5kZXggKz0gNDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB2ZXJ0ZXhQb3NpdGlvbkJ1ZmZlcjogV2ViR0xCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZlcnRleFBvc2l0aW9uQnVmZmVyKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodmVydGljZXMpLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgICAgICAgbGV0IHZlcnRleEJhY2tncm91bmRCdWZmZXI6IFdlYkdMQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB2ZXJ0ZXhCYWNrZ3JvdW5kQnVmZmVyKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoYmFja2dyb3VuZCksIGdsLlNUQVRJQ19EUkFXKTtcblxuICAgICAgICBsZXQgdmVydGV4Rm9yZWdyb3VuZEJ1ZmZlcjogV2ViR0xCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZlcnRleEZvcmVncm91bmRCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShmb3JlZ3JvdW5kKSwgZ2wuU1RBVElDX0RSQVcpO1xuXG4gICAgICAgIGxldCB2ZXJ0ZXhDaGFyYWN0ZXJCdWZmZXI6IFdlYkdMQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB2ZXJ0ZXhDaGFyYWN0ZXJCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShjaGFyYWN0ZXJzKSwgZ2wuU1RBVElDX0RSQVcpO1xuXG4gICAgICAgIGxldCBpbmRleEJ1ZmZlcjogV2ViR0xCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgaW5kZXhCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBuZXcgVWludDE2QXJyYXkoaW5kaWNlcyksIGdsLlNUQVRJQ19EUkFXKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmVydGV4UG9zaXRpb25CdWZmZXI6IHZlcnRleFBvc2l0aW9uQnVmZmVyLFxuICAgICAgICAgICAgdmVydGV4QmFja2dyb3VuZEJ1ZmZlcjogdmVydGV4QmFja2dyb3VuZEJ1ZmZlcixcbiAgICAgICAgICAgIHZlcnRleEZvcmVncm91bmRCdWZmZXI6IHZlcnRleEZvcmVncm91bmRCdWZmZXIsXG4gICAgICAgICAgICB2ZXJ0ZXhDaGFyYWN0ZXJCdWZmZXI6IHZlcnRleENoYXJhY3RlckJ1ZmZlcixcbiAgICAgICAgICAgIGluZGV4QnVmZmVyOiBpbmRleEJ1ZmZlcixcblxuICAgICAgICAgICAgYmFja2dyb3VuZDogYmFja2dyb3VuZCxcbiAgICAgICAgICAgIGZvcmVncm91bmQ6IGZvcmVncm91bmQsXG4gICAgICAgICAgICBjaGFyYWN0ZXJzOiBjaGFyYWN0ZXJzLFxuXG4gICAgICAgICAgICBpbmRleE51bWJlcjogaW5kaWNlcy5sZW5ndGgsXG5cbiAgICAgICAgICAgIHVwZGF0ZWQ6IHRydWVcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBnZXRUaWxlKGJDb2xvcjogQ29sb3IgPSB0aGlzLmJsYWNrLmJhY2tncm91bmQsIGZDb2xvcjogQ29sb3IgPSB0aGlzLmJsYWNrLmZvcmVncm91bmQsIGNoYXJhOiBDaGFyYWN0ZXIgPSB7eDogMCwgeTogMH0sIGVmZmVjdDogdm9pZCA9IG51bGwpOiBUaWxlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBUaWxlKGJDb2xvciwgZkNvbG9yLCBjaGFyYSk7XG4gICAgfVxuXG4gICAgcGxvdENoYXJhY3Rlcih4OiBudW1iZXIsIHk6IG51bWJlciwgdGlsZTogVGlsZSwgc3VyZmFjZTogU2NyZWVuQnVmZmVyID0gdGhpcy5tYWluU3VyZmFjZSkge1xuICAgICAgICBsZXQgdG9wTDogbnVtYmVyLCB0b3BSOiBudW1iZXIsIGJvdEw6IG51bWJlciwgYm90UjogbnVtYmVyLCBjdzogbnVtYmVyLCBjaDogbnVtYmVyLCBjeDogbnVtYmVyLCBjeTogbnVtYmVyLCBpbmRleDogbnVtYmVyO1xuICAgICAgICBsZXQgY29sb3I6IENvbG9yO1xuICAgICAgICBsZXQgY2hhcmFjdGVyOiBDaGFyYWN0ZXI7XG5cbiAgICAgICAgaW5kZXggPSAoeCAqIHRoaXMucmVzb2x1dGlvblsxXSArIHkpICogMTI7XG5cbiAgICAgICAgY29sb3IgPSB0aWxlLmZvcmVncm91bmQ7XG4gICAgICAgIGNoYXJhY3RlciA9IHRpbGUuY2hhcmFjdGVyO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICBzdXJmYWNlLmZvcmVncm91bmRbaW5kZXggKyBpICogM10gPSBjb2xvci5yO1xuICAgICAgICAgICAgc3VyZmFjZS5mb3JlZ3JvdW5kW2luZGV4ICsgaSAqIDMgKyAxXSA9IGNvbG9yLmc7XG4gICAgICAgICAgICBzdXJmYWNlLmZvcmVncm91bmRbaW5kZXggKyBpICogMyArIDJdID0gY29sb3IuYjtcbiAgICAgICAgfVxuXG4gICAgICAgIGN3ID0gdGhpcy5waXhlbFNpemVbMF0gLyB0aGlzLmZvbnRJbWFnZS53aWR0aDtcbiAgICAgICAgY2ggPSB0aGlzLnBpeGVsU2l6ZVsxXSAvIHRoaXMuZm9udEltYWdlLmhlaWdodDtcbiAgICAgICAgY3ggPSBjaGFyYWN0ZXIueCAqIGN3O1xuICAgICAgICBjeSA9IGNoYXJhY3Rlci55ICogY2g7XG5cbiAgICAgICAgaW5kZXggPSAoeCAqIHRoaXMucmVzb2x1dGlvblsxXSArIHkpICogODtcblxuICAgICAgICB0b3BMID0gaW5kZXg7XG4gICAgICAgIHRvcFIgPSBpbmRleCArIDI7XG4gICAgICAgIGJvdEwgPSBpbmRleCArIDQ7XG4gICAgICAgIGJvdFIgPSBpbmRleCArIDY7XG5cbiAgICAgICAgc3VyZmFjZS5jaGFyYWN0ZXJzW3RvcExdID0gY3g7XG4gICAgICAgIHN1cmZhY2UuY2hhcmFjdGVyc1t0b3BMICsgMV0gPSBjeSArIGNoO1xuXG4gICAgICAgIHN1cmZhY2UuY2hhcmFjdGVyc1t0b3BSXSA9IGN4ICsgY3c7XG4gICAgICAgIHN1cmZhY2UuY2hhcmFjdGVyc1t0b3BSICsgMV0gPSBjeSArIGNoO1xuXG4gICAgICAgIHN1cmZhY2UuY2hhcmFjdGVyc1tib3RMXSA9IGN4O1xuICAgICAgICBzdXJmYWNlLmNoYXJhY3RlcnNbYm90TCArIDFdID0gY3k7XG5cbiAgICAgICAgc3VyZmFjZS5jaGFyYWN0ZXJzW2JvdFJdID0gY3ggKyBjdztcbiAgICAgICAgc3VyZmFjZS5jaGFyYWN0ZXJzW2JvdFIgKyAxXSA9IGN5O1xuXG4gICAgICAgIHN1cmZhY2UudXBkYXRlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIHBsb3RCYWNrZ3JvdW5kKHg6IG51bWJlciwgeTogbnVtYmVyLCB0aWxlOiBUaWxlLCBzdXJmYWNlOiBTY3JlZW5CdWZmZXIgPSB0aGlzLm1haW5TdXJmYWNlKSB7XG4gICAgICAgIGxldCBpbmRleDogbnVtYmVyID0gKHggKiB0aGlzLnJlc29sdXRpb25bMV0gKyB5KSAqIDEyLFxuICAgICAgICAgICAgY29sb3I6IENvbG9yID0gdGlsZS5iYWNrZ3JvdW5kO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICBzdXJmYWNlLmJhY2tncm91bmRbaW5kZXggKyBpICogM10gPSBjb2xvci5yO1xuICAgICAgICAgICAgc3VyZmFjZS5iYWNrZ3JvdW5kW2luZGV4ICsgaSAqIDMgKyAxXSA9IGNvbG9yLmc7XG4gICAgICAgICAgICBzdXJmYWNlLmJhY2tncm91bmRbaW5kZXggKyBpICogMyArIDJdID0gY29sb3IuYjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cmZhY2UudXBkYXRlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIHBsb3QoeDogbnVtYmVyLCB5OiBudW1iZXIsIHRpbGU6IFRpbGUsIHN1cmZhY2U6IFNjcmVlbkJ1ZmZlciA9IHRoaXMubWFpblN1cmZhY2UpIHtcbiAgICAgICAgdGhpcy5wbG90QmFja2dyb3VuZCh4LCB5LCB0aWxlLCBzdXJmYWNlKTtcbiAgICAgICAgdGhpcy5wbG90Q2hhcmFjdGVyKHgsIHksIHRpbGUsIHN1cmZhY2UpO1xuICAgIH1cblxuICAgIGNsZWFyUmVjdCh4OiBudW1iZXIsIHk6IG51bWJlciwgdzogbnVtYmVyLCBoOiBudW1iZXIsIHN1cmZhY2U6IFNjcmVlbkJ1ZmZlciA9IHRoaXMubWFpblN1cmZhY2UpIHtcbiAgICAgICAgdyA9IHggKyB3O1xuICAgICAgICBoID0geSArIGg7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IHg7IGkgPCB3OyBpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSB5OyBqIDwgaDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbG90KGksIGosIHRoaXMuYmxhY2ssIHN1cmZhY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlU3VyZmFjZShzdXJmYWNlOiBTY3JlZW5CdWZmZXIpIHtcbiAgICAgICAgbGV0IGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQgPSB0aGlzLmdsO1xuXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBzdXJmYWNlLnZlcnRleEJhY2tncm91bmRCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShzdXJmYWNlLmJhY2tncm91bmQpLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHN1cmZhY2UudmVydGV4Rm9yZWdyb3VuZEJ1ZmZlcik7XG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHN1cmZhY2UuZm9yZWdyb3VuZCksIGdsLlNUQVRJQ19EUkFXKTtcblxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgc3VyZmFjZS52ZXJ0ZXhDaGFyYWN0ZXJCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShzdXJmYWNlLmNoYXJhY3RlcnMpLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgICAgICAgc3VyZmFjZS51cGRhdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB1cGRhdGVUaW1lKCkge1xuICAgICAgICBsZXQgbm93OiBudW1iZXIgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICB0aGlzLnRpbWUgKz0gbm93IC0gdGhpcy5sYXN0VGltZTtcbiAgICAgICAgdGhpcy5sYXN0VGltZSA9IG5vdztcbiAgICB9XG5cbiAgICByZW5kZXIoc3VyZmFjZTogU2NyZWVuQnVmZmVyID0gdGhpcy5tYWluU3VyZmFjZSkge1xuICAgICAgICBsZXQgZ2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCA9IHRoaXMuZ2wsXG4gICAgICAgICAgICBzaGFkZXI6IFNoYWRlciA9IDxTaGFkZXI+IHRoaXMuc2hhZGVycy5iYXNpYztcblxuICAgICAgICBpZiAoIXN1cmZhY2UudXBkYXRlZCkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTdXJmYWNlKHN1cmZhY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVUaW1lKCk7XG5cbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHN1cmZhY2UudmVydGV4UG9zaXRpb25CdWZmZXIpO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlci5hdHRyaWJ1dGVzLmFWZXJ0ZXhQb3NpdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgc3VyZmFjZS52ZXJ0ZXhCYWNrZ3JvdW5kQnVmZmVyKTtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXIuYXR0cmlidXRlcy5hVmVydGV4QmFja2dyb3VuZCwgMywgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgc3VyZmFjZS52ZXJ0ZXhGb3JlZ3JvdW5kQnVmZmVyKTtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXIuYXR0cmlidXRlcy5hVmVydGV4Rm9yZWdyb3VuZCwgMywgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgc3VyZmFjZS52ZXJ0ZXhDaGFyYWN0ZXJCdWZmZXIpO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlci5hdHRyaWJ1dGVzLmFWZXJ0ZXhDaGFyYWN0ZXIsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgc3VyZmFjZS5pbmRleEJ1ZmZlcik7XG5cbiAgICAgICAgLypnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgc3VyZmFjZS5jb250ZW50LnRleHR1cmUpO1xuICAgICAgICBnbC51bmlmb3JtMWkoc2hhZGVyLnVuaWZvcm1zLnVUZXh0dXJlLCAwKTsqL1xuXG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApO1xuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLmZvbnRUZXh0dXJlKTtcbiAgICAgICAgZ2wudW5pZm9ybTFpKHNoYWRlci51bmlmb3Jtcy51Rm9udCwgMCk7XG5cbiAgICAgICAgZ2wuZHJhd0VsZW1lbnRzKGdsLlRSSUFOR0xFUywgc3VyZmFjZS5pbmRleE51bWJlciwgZ2wuVU5TSUdORURfU0hPUlQsIDApO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgUmVuZGVyZXIgfTsiLCLvu79pbnRlcmZhY2UgU2hhZGVyU3RydWN0dXJlIHtcbiAgICB2ZXJ0ZXhTaGFkZXI6IHN0cmluZyxcbiAgICBmcmFnbWVudFNoYWRlcjogc3RyaW5nXG59O1xuXG5jbGFzcyBTaGFkZXIge1xuICAgIGF0dHJpYnV0ZXM6IGFueTtcbiAgICB1bmlmb3JtczogYW55O1xuICAgIHByb2dyYW06IFdlYkdMUHJvZ3JhbTtcblxuICAgIHN0YXRpYyBtYXhBdHRyaWJMZW5ndGg6IG51bWJlcjtcbiAgICBzdGF0aWMgbGFzdFByb2dyYW06IFNoYWRlcjtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBnbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0LCBzaGFkZXI6IFNoYWRlclN0cnVjdHVyZSkge1xuICAgICAgICB0aGlzLmNvbXBpbGVTaGFkZXJzKHNoYWRlcik7XG4gICAgICAgIHRoaXMuZ2V0U2hhZGVyQXR0cmlidXRlcyhzaGFkZXIpO1xuICAgICAgICB0aGlzLmdldFNoYWRlclVuaWZvcm1zKHNoYWRlcik7XG4gICAgfVxuXG4gICAgY29tcGlsZVNoYWRlcnMoc2hhZGVyOiBTaGFkZXJTdHJ1Y3R1cmUpIHtcbiAgICAgICAgbGV0IGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQgPSB0aGlzLmdsO1xuXG4gICAgICAgIGxldCB2U2hhZGVyOiBXZWJHTFNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5WRVJURVhfU0hBREVSKTtcbiAgICAgICAgZ2wuc2hhZGVyU291cmNlKHZTaGFkZXIsIHNoYWRlci52ZXJ0ZXhTaGFkZXIpO1xuICAgICAgICBnbC5jb21waWxlU2hhZGVyKHZTaGFkZXIpO1xuXG4gICAgICAgIGxldCBmU2hhZGVyOiBXZWJHTFNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5GUkFHTUVOVF9TSEFERVIpO1xuICAgICAgICBnbC5zaGFkZXJTb3VyY2UoZlNoYWRlciwgc2hhZGVyLmZyYWdtZW50U2hhZGVyKTtcbiAgICAgICAgZ2wuY29tcGlsZVNoYWRlcihmU2hhZGVyKTtcblxuICAgICAgICB0aGlzLnByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICAgIGdsLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIHZTaGFkZXIpO1xuICAgICAgICBnbC5hdHRhY2hTaGFkZXIodGhpcy5wcm9ncmFtLCBmU2hhZGVyKTtcbiAgICAgICAgZ2wubGlua1Byb2dyYW0odGhpcy5wcm9ncmFtKTtcblxuICAgICAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcih2U2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGdsLmdldFNoYWRlckluZm9Mb2codlNoYWRlcikpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgY29tcGlsaW5nIHZlcnRleCBzaGFkZXJcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihmU2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGdsLmdldFNoYWRlckluZm9Mb2coZlNoYWRlcikpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgY29tcGlsaW5nIGZyYWdtZW50IHNoYWRlclwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLnByb2dyYW0sIGdsLkxJTktfU1RBVFVTKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZ2wuZ2V0UHJvZ3JhbUluZm9Mb2codGhpcy5wcm9ncmFtKSk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciBsaW5raW5nIHRoZSBwcm9ncmFtXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0U2hhZGVyQXR0cmlidXRlcyhzaGFkZXI6IFNoYWRlclN0cnVjdHVyZSkge1xuICAgICAgICBsZXQgY29kZTogQXJyYXk8c3RyaW5nPiA9IHNoYWRlci52ZXJ0ZXhTaGFkZXIuc3BsaXQoL1xcbi9nKTtcbiAgICAgICAgbGV0IGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQgPSB0aGlzLmdsO1xuXG4gICAgICAgIGxldCBhdHRyaWJ1dGU6IHN0cmluZztcbiAgICAgICAgbGV0IGxvY2F0aW9uOiBudW1iZXI7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGNvZGUubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBjOiBBcnJheTxzdHJpbmc+ID0gY29kZVtpXS50cmltKCkuc3BsaXQoLyAvZyk7XG5cbiAgICAgICAgICAgIGlmIChjWzBdID09ICdhdHRyaWJ1dGUnKSB7XG4gICAgICAgICAgICAgICAgYXR0cmlidXRlID0gYy5wb3AoKS5yZXBsYWNlKC87L2csIFwiXCIpO1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5wcm9ncmFtLCBhdHRyaWJ1dGUpO1xuXG4gICAgICAgICAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIFNoYWRlci5tYXhBdHRyaWJMZW5ndGggPSBNYXRoLm1heChTaGFkZXIubWF4QXR0cmliTGVuZ3RoLCB0aGlzLmF0dHJpYnV0ZXMubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBnZXRTaGFkZXJVbmlmb3JtcyhzaGFkZXI6IFNoYWRlclN0cnVjdHVyZSkge1xuICAgICAgICBsZXQgY29kZTogQXJyYXk8c3RyaW5nPiA9IHNoYWRlci52ZXJ0ZXhTaGFkZXIuc3BsaXQoL1xcbi9nKTtcbiAgICAgICAgY29kZSA9IGNvZGUuY29uY2F0KHNoYWRlci5mcmFnbWVudFNoYWRlci5zcGxpdCgvXFxuL2cpKTtcblxuICAgICAgICBsZXQgZ2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCA9IHRoaXMuZ2w7XG5cbiAgICAgICAgbGV0IHVuaWZvcm06IHN0cmluZztcbiAgICAgICAgbGV0IGxvY2F0aW9uOiBXZWJHTFVuaWZvcm1Mb2NhdGlvbjtcbiAgICAgICAgbGV0IHVzZWRVbmlmb3JtczogQXJyYXk8c3RyaW5nPiA9IFtdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBjb2RlLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgYzogQXJyYXk8c3RyaW5nPiA9IGNvZGVbaV0udHJpbSgpLnNwbGl0KC8gL2cpO1xuXG4gICAgICAgICAgICBpZiAoY1swXSA9PSBcInVuaWZvcm1cIikge1xuICAgICAgICAgICAgICAgIHVuaWZvcm0gPSBjLnBvcCgpLnJlcGxhY2UoLzsvZywgXCJcIik7XG4gICAgICAgICAgICAgICAgaWYgKHVzZWRVbmlmb3Jtcy5pbmRleE9mKHVuaWZvcm0pICE9IC0xKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICAgICAgICBsb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnByb2dyYW0sIHVuaWZvcm0pO1xuXG4gICAgICAgICAgICAgICAgdXNlZFVuaWZvcm1zLnB1c2godW5pZm9ybSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnVuaWZvcm1zW3VuaWZvcm1dID0gbG9jYXRpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1c2VQcm9ncmFtKCkge1xuICAgICAgICBpZiAoU2hhZGVyLmxhc3RQcm9ncmFtID09IHRoaXMpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgbGV0IGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQgPSB0aGlzLmdsO1xuXG4gICAgICAgIGdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgICAgICAgU2hhZGVyLmxhc3RQcm9ncmFtID0gdGhpcztcblxuICAgICAgICBsZXQgYXR0cmliTGVuZ3RoOiBudW1iZXIgPSB0aGlzLmF0dHJpYnV0ZXMubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gU2hhZGVyLm1heEF0dHJpYkxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaSA8IGF0dHJpYkxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkoaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cblNoYWRlci5tYXhBdHRyaWJMZW5ndGggPSAwO1xuU2hhZGVyLmxhc3RQcm9ncmFtID0gbnVsbDtcblxuZXhwb3J0IHsgU2hhZGVyLCBTaGFkZXJTdHJ1Y3R1cmUgfTsiLCLvu79pbXBvcnQgeyBDb2xvciB9IGZyb20gJy4vQ29sb3InO1xuaW1wb3J0IHsgQ2hhcmFjdGVyIH0gZnJvbSAnLi9DaGFyYWN0ZXInO1xuXG5sZXQgYmxhY2s6IENvbG9yID0geyByOiAwLCBnOiAwLCBiOiAwIH07XG5sZXQgZW1wdHlDaGFyOiBDaGFyYWN0ZXIgPSB7IHg6IDAsIHk6IDAgfTtcblxuY2xhc3MgVGlsZSB7XG4gICAgY29uc3RydWN0b3IocHVibGljIGJhY2tncm91bmQ6IENvbG9yID0gYmxhY2ssIHB1YmxpYyBmb3JlZ3JvdW5kOiBDb2xvciA9IGJsYWNrLCBwdWJsaWMgY2hhcmFjdGVyOiBDaGFyYWN0ZXIgPSBlbXB0eUNoYXIpIHt9XG59XG5cbmV4cG9ydCB7IFRpbGUgfTsiLCLvu79pbXBvcnQgeyBTaGFkZXJTdHJ1Y3R1cmUgfSBmcm9tICcuLi9TaGFkZXInO1xuXG5sZXQgQmFzaWNTaGFkZXI6IFNoYWRlclN0cnVjdHVyZSA9IHtcbiAgICB2ZXJ0ZXhTaGFkZXI6IGBcbiAgICAgICAgcHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XG4gICAgICAgIFxuICAgICAgICBhdHRyaWJ1dGUgdmVjMiBhVmVydGV4UG9zaXRpb247XG4gICAgICAgIGF0dHJpYnV0ZSB2ZWMzIGFWZXJ0ZXhCYWNrZ3JvdW5kO1xuICAgICAgICBhdHRyaWJ1dGUgdmVjMyBhVmVydGV4Rm9yZWdyb3VuZDtcbiAgICAgICAgYXR0cmlidXRlIHZlYzIgYVZlcnRleENoYXJhY3RlcjtcbiAgICAgICAgXG4gICAgICAgIHZhcnlpbmcgdmVjMyB2QmFja2dyb3VuZDtcbiAgICAgICAgdmFyeWluZyB2ZWMzIHZGb3JlZ3JvdW5kO1xuICAgICAgICB2YXJ5aW5nIHZlYzIgdkNoYXJhY3RlcjtcbiAgICAgICAgXG4gICAgICAgIHZvaWQgbWFpbih2b2lkKSB7XG4gICAgICAgICAgICB2ZWMyIHBvc2l0aW9uID0gYVZlcnRleFBvc2l0aW9uO1xuICAgICAgICAgICAgcG9zaXRpb24ueSA9IDIuMCAtIHBvc2l0aW9uLnk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGdsX1Bvc2l0aW9uID0gdmVjNChwb3NpdGlvbiAtIDEuMCwgMC4wLCAxLjApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2QmFja2dyb3VuZCA9IGFWZXJ0ZXhCYWNrZ3JvdW5kO1xuICAgICAgICAgICAgdkZvcmVncm91bmQgPSBhVmVydGV4Rm9yZWdyb3VuZDtcbiAgICAgICAgICAgIHZDaGFyYWN0ZXIgPSBhVmVydGV4Q2hhcmFjdGVyO1xuICAgICAgICB9XG4gICAgYCxcblxuICAgIGZyYWdtZW50U2hhZGVyOiBgXG4gICAgICAgIHByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1xuICAgICAgICBcbiAgICAgICAgdW5pZm9ybSBzYW1wbGVyMkQgdVRleHR1cmU7XG4gICAgICAgIFxuICAgICAgICB2YXJ5aW5nIHZlYzMgdkJhY2tncm91bmQ7XG4gICAgICAgIHZhcnlpbmcgdmVjMyB2Rm9yZWdyb3VuZDtcbiAgICAgICAgdmFyeWluZyB2ZWMyIHZDaGFyYWN0ZXI7XG4gICAgICAgIFxuICAgICAgICB2b2lkIG1haW4odm9pZCkge1xuICAgICAgICAgICAgdmVjNCBjaGFyYWN0ZXJDb2xvciA9IHRleHR1cmUyRCh1VGV4dHVyZSwgdkNoYXJhY3Rlcik7XG4gICAgICAgICAgICBjaGFyYWN0ZXJDb2xvci5yZ2IgPSB2Rm9yZWdyb3VuZDtcbiAgICAgICAgXG4gICAgICAgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KG1peCh2QmFja2dyb3VuZCwgY2hhcmFjdGVyQ29sb3IucmdiLCBjaGFyYWN0ZXJDb2xvci5hKSwgMS4wKTtcbiAgICAgICAgfVxuICAgIGBcbn07XG5cbmV4cG9ydCB7IEJhc2ljU2hhZGVyIH07Iiwi77u/aW1wb3J0IHsgR2FtZSB9IGZyb20gJy4vR2FtZSc7XG5pbXBvcnQgeyBJbnB1dCB9IGZyb20gJy4vZW5naW5lL0lucHV0JztcblxuLypcbiAqIE1haW4gZnVuY3Rpb24gaW5zdGFudGlhdGUgdGhlIEdhbWUgQ2xhc3NcbiAqIGFuZCBwYXNzZXMgdGhlIGNhbnZhcyB0byB0aGUgaW5wdXQgb2JqZWN0XG4gKi9cbndpbmRvdy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgbGV0IGdhbWUgPSBuZXcgR2FtZSgpO1xuXG4gICAgSW5wdXQuaW5pdChnYW1lLnJlbmRlcmVyLmNhbnZhcyk7XG59OyJdfQ==
