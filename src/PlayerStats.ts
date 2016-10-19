import { Colors } from './Prefabs';
import { Console } from './Console';
import { Utils } from './Utils';
import { Game } from './Game';
import { Vector2 } from './engine/Vector2';
import { ItemFactory, WorldItem, ItemTypes } from './ItemFactory';
import { Map } from './Map';
import { Player } from './Player';
import { Renderer } from './engine/Renderer';

const MAX_INVENTORY: number = 20;

interface Status {
    type: string,
    duration: Array<number>,
    value: string
};

let PlayerStats = {
    game: <Game>null,

    name: <string>'',
    useName: <string>'You',

    class: <string>'ROGUE',

    hp: <Array<number>>[100, 100],
    mp: <Array<number>>[20, 20],
    status: <Array<Status>>[],

    str: <string>'2D2',
    def: <string>'2D2',

    strAdd: <number>0,
    defAdd: <number>0,
    spd: <number>10,
    luk: <number>38,

    gold: <number>0,

    blind: <boolean>false,
    paralyzed: <boolean>false,
    invisible: <boolean>false,
    dead: <boolean>false,

    inventory: <Array<WorldItem>>[],
    equipment: {
        weapon: <WorldItem>null,
        armor: <WorldItem>null,
        amulet: <WorldItem>null
    },

    statsPosition: <Array<number>>[60, 0, 25, 25, 73],
    inventoryScroll: <number>0,
    mousePosition: <Vector2>null,
    itemSelected: <number>-1,

    initStats: function (game: Game) {
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
        if (!this.equipment.weapon) { return; }

        let amount:number = Utils.rollDice(this.equipment.weapon.def.wear);
        this.equipment.weapon.status -= amount;

        if (this.equipment.weapon.status <= 0) {
            this.game.console.addMessage(this.equipment.weapon.def.name + " destroyed", Colors.GOLD);
            this.equipment.weapon = null;
        }
    },

    wearArmor: function () {
        if (!this.equipment.armor) { return; }

        let amount:number = Utils.rollDice(this.equipment.armor.def.wear);
        this.equipment.armor.status -= amount;

        if (this.equipment.armor.status <= 0) {
            this.game.console.addMessage(this.equipment.armor.def.name + " destroyed", Colors.GOLD);
            this.equipment.armor = null;
        }
    },

    updateStatus: function () {
        this.blind = false;
        this.paralyzed = false;
        this.invisible = false;

        for (let i: number = 0, st: Status; st = this.status[i]; i++) {
            if (st.type == 'poison') {
                this.receiveDamage(Utils.rollDice(st.value));
            } else if (st.type == 'blind' && st.duration[0] > 1) {
                this.blind = true;
            } else if (st.type == 'paralysis' && st.duration[0] > 1) {
                this.paralyzed = true;
            } else if (st.type == 'invisible' && st.duration[0] > 1) {
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

    receiveDamage: function (dmg:number) {
        this.hp[0] -= dmg;
        if (this.hp[0] <= 0) {
            this.hp[0] = 0;
            this.dead = true;

            this.game.console.clear();
            this.game.console.addMessage("You died, press enter to restart", Colors.PURPLE);
        }

        this.render(this.game.renderer);
        this.wearArmor();
    },

    equipItem: function (item: WorldItem, type: string) {
        let ind: number = this.inventory.indexOf(item);
        if (this.equipment[type]) {
            this.inventory[ind] = this.equipment[type];
        } else {
            this.inventory.splice(ind, 1);
        }

        this.equipment[type] = item;

        this.game.itemDesc = null;
    },

    useItem: function (item: WorldItem) {
        if (!this.game.map.playerTurn) return;

        let msg: string = '';
        if (item.def.stackable) {
            if (item.amount > 1) {
                item.amount -= 1;
            } else {
                this.game.itemDesc = null;
                this.inventory.splice(this.itemSelected, 1);
            }

            msg = ItemFactory.useItem(item.def, this);
        } else if (item.def.type == ItemTypes.WEAPON) {
            this.equipItem(item, 'weapon');
            msg = item.def.name + " equipped!";
        } else if (item.def.type == ItemTypes.ARMOR) {
            this.equipItem(item, 'armor');
            msg = item.def.name + " equipped!";
        }

        this.game.console.addMessage(msg, Colors.WHITE);

        this.game.map.player.act();
    },

    dropItem: function (item: WorldItem): boolean {
        if (!this.game.map.playerTurn) return false;

        let map: Map = this.game.map;
        let player: Player = map.player;

        let x: number = player.x;
        let y: number = player.y;

        let nx: number, ny: number;
        let tries: number = 0;

        while (map.getInstanceAt(x, y)) {
            nx = (player.x - 2 + Math.random() * 4) << 0;
            ny = (player.y - 2 + Math.random() * 4) << 0;

            if (map.map[ny][nx].visible == 2 && !map.isSolid(nx, ny)) {
                x = nx;
                y = ny;
            }

            if (tries++ == 20) {
                this.game.console.addMessage("Can't drop it here!", Colors.RED);
                this.render(this.game.renderer);
                return false;
            }
        }

        if (item.amount > 1) {
            item.amount -= 1;
        } else {
            this.game.itemDesc = null;
            this.inventory.splice(this.itemSelected, 1);
        }

        map.createItem(x, y, ItemFactory.getItem(item.def.code));

        this.game.console.addMessage(item.def.name + " dropped", Colors.AQUA);
        this.render(this.game.renderer);

        this.game.map.player.act();

        return true;
    },

    pickItem: function (item: WorldItem) {
        if (item.def.type == ItemTypes.GOLD) {
            let msg: string = "Picked " + item.amount + " Gold piece";
            if (item.amount > 1) { msg += "s"; }
            this.game.console.addMessage(msg, Colors.GOLD);

            this.gold += item.amount;
            this.render(this.game.renderer);

            return true;
        }

        if (this.inventory.length == MAX_INVENTORY) {
            this.game.console.addMessage("Inventory full!", Colors.RED);
            return false;
        }

        let added: boolean = false;
        if (item.def.stackable) {
            for (let i = 0, inv: WorldItem; inv = this.inventory[i]; i++) {
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

        this.game.console.addMessage(item.def.name + " picked!", Colors.YELLOW);
        this.render(this.game.renderer);

        this.game.map.player.act();

        return true;
    },

    getStr: function () {
        let val: string = this.str;
        if (this.equipment.weapon) {
            val = this.equipment.weapon.def.str;
        }

        if (this.strAdd > 0) {
            val += "+" + this.strAdd;
        }

        return val;
    },

    getDef: function () {
        let val: string = this.def;
        if (this.equipment.armor) {
            val = this.equipment.armor.def.def;
        }

        if (this.defAdd > 0) {
            val += "+" + this.defAdd;
        }

        return val;
    },

    onMouseMove: function (x: number, y: number) {
        if (x == null) {
            this.mousePosition = null;
            this.render(this.game.renderer);
            return;
        }

        this.mousePosition = [x, y];
        this.render(this.game.renderer);
    },

    onMouseHandler: function (x: number, y: number, stat: number) {
        if (stat <= 0) return;

        if (x == 24) {
            if (y == 13 && this.inventoryScroll > 0) {
                this.inventoryScroll -= 1;
            } else if (y == 19 && this.inventoryScroll + 7 < this.inventory.length) {
                this.inventoryScroll += 1;
            }

            this.render(this.game.renderer);
        } else if (y >= 9 && y <= 10) {
            if (this.inventory.length >= MAX_INVENTORY) {
                this.game.console.addMessage("Can't remove, Inventory full!", Colors.RED);
                return;
            }

            let type: string = (y == 9) ? 'weapon' : 'armor';
            this.game.console.addMessage(this.equipment[type].def.name + " removed", Colors.YELLOW);
            this.inventory.push(this.equipment[type]);
            this.equipment[type] = null;

        } else if (y >= 13 && y <= 19) {
            let index: number = y - 13 + this.inventoryScroll;
            let item: WorldItem = this.inventory[index];
            if (item) {
                this.itemSelected = index;
                this.game.itemDesc = item;
            }
        }
    },

    renderStatus: function (renderer: Renderer) {
        let sp = this.statsPosition,
            length = this.status.length,
            tabSize = sp[0] + sp[2];

        for (let i = sp[0], l = tabSize; i < l; i++) {
            renderer.plot(i, 3, renderer.getTile(Colors.BLACK));
        }

        let l = Math.floor(sp[2] / length);
        for (let j = 0, st: Status; st = this.status[j]; j++) {
            let color = Colors.BLACK;
            if (st.type == 'poison') { color = Colors.PURPLE; } else
                if (st.type == 'blind') { color = Colors.TAN; } else
                    if (st.type == 'paralysis') { color = Colors.GOLD; } else
                        if (st.type == 'invisible') { color = Colors.GRAY; }

            let start = l * j;
            let end = Math.floor(start + l * (st.duration[0] / st.duration[1]));
            if (j == length - 1 && start + end != sp[2]) { end += 1; }

            for (let i = start; i < end; i++) {
                renderer.plot(i + sp[0], 3, renderer.getTile(color));
            }
        }

        let status: string = "FINE";
        if (length == 1) { status = this.status[0].type.toUpperCase(); } else
            if (length > 1) { status = "VARIOUS"; }

        Utils.renderText(renderer, sp[0], 3, "STATUS: " + status, Colors.WHITE, null);
    },

    render: function (renderer: Renderer) {
        let sp = this.statsPosition;

        renderer.clearRect(sp[0], sp[1], sp[2], sp[3]);

        // Player Name
        let name: string = this.name + " (" + this.class + ")";

        let x = (sp[4] - name.length / 2) << 0;
        let ni = 0;
        for (let i = sp[0], l = sp[0] + sp[2]; i < l; i++) {
            let n = '';
            if (i >= x && ni < name.length) { n = name[ni++]; }

            renderer.plot(i, 0, Utils.getTile(renderer, n, Colors.WHITE, Colors.BLUE));
        }

        // Dungeon Depth
        Utils.renderText(renderer, sp[0], 1, "LEVEL: " + this.game.map.level);

        // Health Points
        let hp = ((this.hp[0] / this.hp[1] * sp[2]) << 0) + sp[0];
        for (let i = sp[0]; i < hp; i++) {
            renderer.plot(i, 2, renderer.getTile(Colors.GREEN));
        }

        Utils.renderText(renderer, sp[0], 2, "HP: " + this.hp[0] + "/" + this.hp[1], Colors.WHITE, null);

        // Magic Points
        /*var mp = ((this.mp[0] / this.mp[1] * sp[2]) << 0) + sp[0];
        for (var i=sp[0];i<mp;i++){
            renderer.plot(i, 3, renderer.getTile(Colors.AQUA));
        }
        
        Utils.renderText(renderer, sp[0], 3, "MP: " + this.mp[0] + "/" + this.mp[1], Colors.WHITE, null);*/

        this.renderStatus(renderer);

        Utils.renderText(renderer, sp[0], 5, "ATK: " + this.getStr(), Colors.WHITE, Colors.BLACK);
        Utils.renderText(renderer, (sp[0] + sp[2] / 2) << 0, 5, "DEF: " + this.getDef(), Colors.WHITE, Colors.BLACK);

        Utils.renderText(renderer, sp[0], 6, "SPD: " + this.spd, Colors.WHITE, Colors.BLACK);
        Utils.renderText(renderer, (sp[0] + sp[2] / 2 - 1) << 0, 6, "GOLD: " + this.gold, Colors.GOLD, Colors.BLACK);

        // EQUIPMENT
        for (let i = sp[0], l = sp[0] + sp[2]; i < l; i++) {
            renderer.plot(i, 8, renderer.getTile(Colors.BLUE));
        }
        Utils.renderText(renderer, sp[0] + 8, 8, "EQUIPMENT", Colors.WHITE, Colors.BLUE);

        let equip: string = (this.equipment.weapon) ? this.equipment.weapon.def.name + ' (' + this.equipment.weapon.status + '%)' : 'NO WEAPON';
        let backColor = Colors.BLACK;
        if (this.equipment.weapon && this.mousePosition && this.mousePosition[1] == 9) {
            backColor = Colors.GRAY;
            equip = equip + ("                   ").substr(0, 25 - equip.length);
        }

        Utils.renderText(renderer, sp[0], 9, equip, Colors.WHITE, backColor);

        equip = (this.equipment.armor) ? this.equipment.armor.def.name + ' (' + this.equipment.armor.status + '%)' : 'NO ARMOR';
        backColor = Colors.BLACK;
        if (this.equipment.armor && this.mousePosition && this.mousePosition[1] == 10) {
            backColor = Colors.GRAY;
            equip = equip + ("                   ").substr(0, 25 - equip.length);
        }

        Utils.renderText(renderer, sp[0], 10, equip, Colors.WHITE, backColor);

        //equip = (this.equipment.amulet)? this.equipment.amulet.def.name : 'NO AMULET';
        //Utils.renderText(renderer, sp[0], 10, equip, Colors.WHITE, Colors.BLACK);

        // INVENTORY
        for (let i = sp[0], l = sp[0] + sp[2]; i < l; i++) {
            renderer.plot(i, 12, renderer.getTile(Colors.BLUE));
        }
        Utils.renderText(renderer, sp[0] + 8, 12, "INVENTORY", Colors.WHITE, Colors.BLUE);

        for (let i = 0, l = Math.min(7, this.inventory.length); i < l; i++) {
            let inv: WorldItem = this.inventory[i + this.inventoryScroll];
            name = inv.def.name + ((inv.amount > 1) ? ' (x' + inv.amount + ')' : '');

            backColor = Colors.BLACK;
            if (this.mousePosition && this.mousePosition[1] - 13 == i && this.mousePosition[0] < 24) {
                backColor = Colors.GRAY;
                name = name + ("                   ").substr(0, 24 - name.length);
            }

            Utils.renderText(renderer, sp[0], 13 + i, name, Colors.WHITE, backColor);
        }

        for (let i = 0; i < 7; i++) {
            name = " ";
            if (i == 0) { name = "PAGEUP"; } else if (i == 6) { name = "PAGEDWN" }

            renderer.plot(84, 13 + i, Utils.getTile(renderer, name, Colors.WHITE, Colors.GRAY));
        }

        // SKILLS
        /*for (i=sp[0],l=sp[0]+sp[2];i<l;i++){
            renderer.plot(i, 20, renderer.getTile(Colors.BLUE));
        }
        Utils.renderText(renderer, sp[0] + 9, 20, "SKILLS", Colors.WHITE, Colors.BLUE);*/
    }
};

export { PlayerStats };