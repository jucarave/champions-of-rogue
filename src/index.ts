import { Game } from './Game';
import { Input } from './engine/Input';

/*
 * Main function instantiate the Game Class
 * and passes the canvas to the input object
 */
window.onload = () => {
    let game = new Game();

    Input.init(game.renderer.canvas);
};