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
        light: renderer.getTile(backColor, frontColor, tile, effect),
        dark: renderer.getTile(multiplyColor(backColor, { r: 0.1, g: 0.1, b: 0.5 }), multiplyColor(frontColor, { r: 0.1, g: 0.1, b: 0.5 }), tile, effect),
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
        this.attributes = {};
        this.uniforms = {};
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
        this.attributesCount = 0;
        for (var i = 0, len = code.length; i < len; i++) {
            var c = code[i].trim().split(/ /g);
            if (c[0] == 'attribute') {
                attribute = c.pop().replace(/;/g, "");
                location = gl.getAttribLocation(this.program, attribute);
                gl.enableVertexAttribArray(location);
                this.attributes[attribute] = location;
                this.attributesCount += 1;
            }
        }
        Shader.maxAttribLength = Math.max(Shader.maxAttribLength, this.attributesCount);
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
        var attribLength = this.attributesCount;
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

},{"./Game":4,"./engine/Input":18}]},{},[24]);
