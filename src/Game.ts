// @if DEBUG = true
    declare var Stats: any;
// @endif

import { Tile } from './engine/Tile';
import { Renderer } from './engine/Renderer';
import { Colors, TilesPrefabs } from './Prefabs';
import { Map } from './Map';
import { Console } from './Console';
import { Utils } from './Utils';
import { ItemFactory, WorldItem } from './ItemFactory';
import { EnemyFactory } from './EnemyFactory';
import { MainMenu } from './MainMenu';
import { Input } from './engine/Input';
import { PlayerStats } from './PlayerStats';
import { Scenario } from './Scenario';

interface Panels {
    map: Array<number>;
    inventory: Array<number>;
    itemDesc: Array<number>;
};

class Game {
    // Handles all the rendering to the canvas
    renderer: Renderer;
    
    // Current map the player is at
    map: Scenario;

    // Memory of all the maps the player has visited
    maps: Array<Scenario>;

    // Handles all the messages output to the canvas
    console: Console;

    // Handles rendering a panel when viewing an inventory item description
    itemDesc: WorldItem;

    // Pseudo random number that handles what maps the player will play
    gameSeed: number;

    // A game restart was requested from the game
    restartGame: boolean = false;

    // Tile with the background color of the panel 
    panelTile: Tile;

    // Panels where the mouse can interact
    panels: Panels;

    // Shows debug information about the game process
    // @if DEBUG = true
        stats: any;
    // @endif

    /**
     * Creates an instance of the Game and starts 
     * a new play
     * 
     * @memberOf Game
     */
    constructor() {
        this.renderer = new Renderer(850, 480, <HTMLDivElement>document.getElementById("divGame"));
        
        this.renderer.setFontTexture('img/ascii-rl-font.png');
        TilesPrefabs.init(this.renderer);
        
        this.panelTile = this.renderer.getTile(Colors.DARK_BLUE, Colors.WHITE, {x: 0, y: 0});
        
        // TODO: Refactor this to the data.json file
        this.panels = {
            map: [0, 2, 60, 25],
            inventory: [60, 0, 85, 20],
            itemDesc: [10, 4, 49, 20]
        };

        this.loadData();
    }

    /**
     * Loads the all the game data from a json file and then
     * starts the game
     * 
     * @memberOf Game
     */
    loadData() {
        Utils.loadJSON("data/data.json", (data: any) => {
            EnemyFactory.loadData(data.enemies);
            ItemFactory.loadData(data.items, data.potions);

            // @if DEBUG = true
                this.createStats();
            // @endif
            
            this.newGame();
        });
    }

    /**
     * Starts a new Game in the MainMenu scenario
     * 
     * @memberOf Game
     */
    newGame() {
        this.restartGame = false;

        Input.clearListeners();

        this.gameSeed = Math.floor(Math.random() * 1500);
        
        PlayerStats.initStats(this);
        PlayerStats.equipment.weapon = ItemFactory.getItem("dagger");
        PlayerStats.equipment.armor = ItemFactory.getItem("leatherArmor");

        this.map = new MainMenu(this);
        this.maps = [];

        this.console = new Console(this);
        //this.console.addMessage("Hello adventurer! wellcome to the world of Champions of Rogue.");
        //this.console.addMessage("Press the keys 'QWEADZXC' to move", [255, 0, 0]);

        //this.playerStats.render(this.renderer);

        this.loopGame();
    }

    /**
     * For Debug, show an element with the performance
     * of the game using stats.js
     * 
     * @memberOf Game
     */
    // @if DEBUG = true
    createStats() {
        this.stats = new Stats();
        this.stats.showPanel(1);
        document.body.appendChild(this.stats.dom);
    }
    // @endif

    /**
     * Returns true if a point is inside of one of the panels
     * 
     * @param {number} x - X coordinate of the point
     * @param {number} y - Y coordinate of the point
     * @param {Array<number>} panel - Panel to check the point against
     * @returns {boolean}
     * 
     * @memberOf Game
     */
    isPointInPanel(x: number, y: number, panel: Array<number>): boolean {
        return (x >= panel[0] && y >= panel[1] && x < panel[2] && y < panel[3]);
    }

    /**
     * Handler for when the mouse is moved across the canvas
     * 
     * @param {number} x - X coordinate of the mouse
     * @param {number} y - Y coordinate of the mouse
     * 
     * @memberOf Game
     */
    onMouseMove(x: number, y: number) {
        if (this.itemDesc) return;

        x = (x / this.renderer.pixelSize[0]) << 0;
        y = (y / this.renderer.pixelSize[1]) << 0;

        if (this.isPointInPanel(x, y, this.panels.map)) {
            this.map.onMouseMove(x - this.panels.map[0], y - this.panels.map[1]);
        } else {
            this.map.onMouseMove(null, null);
        }

        if (this.isPointInPanel(x, y, this.panels.inventory)) {
            PlayerStats.onMouseMove(x - this.panels.inventory[0], y - this.panels.inventory[1]);
        } else {
            PlayerStats.onMouseMove(null, null);
        }
    }

    /**
     * Handler for when the mouse is clicked down or up
     * 
     * @param {number} x - X coordinate of the mouse
     * @param {number} y - Y coordinate of the mouse
     * @param {number} stat - 0: Mouse is up, 1: Mouse is down
     * 
     * @memberOf Game
     */
    onMouseHandler(x: number, y: number, stat: number) {
        x = (x / this.renderer.pixelSize[0]) << 0;
        y = (y / this.renderer.pixelSize[1]) << 0;

        if (this.itemDesc && stat == 1) {
            if (this.isPointInPanel(x, y, this.panels.itemDesc)) {
                this.onItemPanelAction(x - this.panels.itemDesc[0], y - this.panels.itemDesc[1]);
                return;
            } else {
                this.itemDesc = null;
                this.onMouseMove(x, y);
                return;
            }
        }

        if (this.isPointInPanel(x, y, this.panels.map)) {
            this.map.onMouseHandler(x - this.panels.map[0], y - this.panels.map[1], stat);
        }

        if (this.isPointInPanel(x, y, this.panels.inventory)) {
            PlayerStats.onMouseHandler(x - this.panels.inventory[0], y - this.panels.inventory[1], stat);
        }
    }

    /**
     * Handler after the user clicks on the item description panel
     * 
     * TODO: Handle this by data.json
     * 
     * @param {number} x - X coordinate of the click
     * @param {number} y - Y coordinate of the click
     * 
     * @memberOf Game
     */
    onItemPanelAction(x: number, y: number) {
        if (y != 14) return;

        if (x >= 2 && x < 13) {
            PlayerStats.useItem(this.itemDesc);
        } else if (x >= 26 && x < 37) {
            PlayerStats.dropItem(this.itemDesc);
        }
    }

    /**
     * Moves the player to a specific level of the dungeon
     * Depending on the direction of the movement the instance
     * will spawn on the stairs up or stairs down
     * 
     * @param {number} level - Level of the dungeon to travel to
     * @param {number} dir - Direction 1: Down, 0: Up
     * 
     * @memberOf Game
     */
    gotoLevel(level: number, dir: number) {
        let map: Map = <Map>this.map;
        map.active = false;

        if (this.maps[level - 1]) {
            this.map = this.maps[level - 1];
        } else {
            this.map = new Map(this, level);
            this.maps[level - 1] = this.map;
        }

        map.active = true;

        if (dir == 1) {
            map.player.x = map.stairsUp.x;
            map.player.y = map.stairsUp.y;
            map.stairsUp.playerOnTile = true;
        } else if (dir == 0) {
            map.player.x = map.stairsDown.x;
            map.player.y = map.stairsDown.y;
            map.stairsDown.playerOnTile = true;
        }

        PlayerStats.render(this.renderer);
        this.console.render();
    }

    /**
     * Renders the item description on the canvas
     * 
     * @memberOf Game
     */
    renderItemPanel() {
        if (!this.itemDesc) { return; }

        for (let x = 10; x < 49; x++) {
            for (let y = 4; y < 20; y++) {
                this.renderer.plot(x, y, this.panelTile);
            }
        }

        let msg: string = this.itemDesc.def.desc;
        let formatted: Array<string> = Utils.formatText(msg, 38);

        let title = this.itemDesc.def.name + ((this.itemDesc.amount > 1) ? " (x" + this.itemDesc.amount + ")" : "");
        Utils.renderText(this.renderer, (30 - title.length / 2) << 0, 5, title, Colors.WHITE, Colors.DARK_BLUE);

        for (let i = 0, m: string; m = formatted[i]; i++) {
            Utils.renderText(this.renderer, 11, 7 + i, m, Colors.WHITE, Colors.DARK_BLUE);
        }

        Utils.renderText(this.renderer, 12, 18, "    USE    ", Colors.WHITE, Colors.BLUE);
        //Utils.renderText(this.renderer, 24, 18, "   THROW   ", Colors.WHITE, Colors.BLUE);
        Utils.renderText(this.renderer, 36, 18, "   DROP    ", Colors.WHITE, Colors.BLUE);
    }

    /**
     * Loop function, calls the map rendering and prepares
     * next iteration of the game and game restart
     * 
     * @memberOf Game
     */
    loopGame() {
        // @if DEBUG = true
            this.stats.begin();
        // @endif

        if (this.renderer.fontReady) {
            this.map.render();
            this.renderItemPanel();
            this.renderer.render();
        }

        // @if DEBUG = true
            this.stats.end();
        // @endif

        if (this.restartGame) {
            this.newGame();
        } else {
            requestAnimationFrame(() => { this.loopGame(); });
        }
    }
}

export { Game };