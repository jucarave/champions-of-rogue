import { Colors } from './Prefabs';
import { Utils } from './Utils';
import { Game } from './Game';
import { Renderer } from './engine/Renderer';
import { Vector2 } from './engine/Vector2';
import { Color } from './engine/Color';

interface Message {
    text: string,
    color: Color
};

class Console {
    renderer: Renderer;

    messages: Array<Message>;
    maxMessages: number;

    consolePosition: Vector2;

    constructor(public game: Game) {
        this.renderer = game.renderer;

        this.messages = [];
        this.maxMessages = 4;

        this.consolePosition = {x: 0, y: 25};
    }

    clear() {
        this.messages = [];
        this.render();
    }

    addMessage(text: string, color: Color = Colors.WHITE) {
        this.messages.push({ text: text, color: color });

        if (this.messages.length > this.maxMessages) {
            this.messages.splice(0, 1);
        }

        this.render();
    }

    render() {
        this.renderer.clearRect(0, 25, 85, 5);

        let length: number = this.messages.length - 1;
        for (let i = 0, m: Message; m = this.messages[length - i]; i++) {
            Utils.renderText(this.renderer, this.consolePosition.x, this.consolePosition.y + this.maxMessages - i, m.text, m.color)
        }
    }
}

export { Console };