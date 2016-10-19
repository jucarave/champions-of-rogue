import { Tile } from './Tile';
import { Color } from './Color';
import { Character } from './Character';
import { Shader } from './Shader';
import { BasicShader } from './shaders/Basic';

interface ScreenBuffer {
    vertexPositionBuffer: WebGLBuffer,
    vertexBackgroundBuffer: WebGLBuffer,
    vertexForegroundBuffer: WebGLBuffer,
    vertexCharacterBuffer: WebGLBuffer,
    indexBuffer: WebGLBuffer,

    background: Array<number>,
    foreground: Array<number>,
    characters: Array<number>,

    indexNumber: number,

    updated: boolean
};

function createCanvas(width: number, height: number, container: HTMLDivElement = null): HTMLCanvasElement {
    let canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    if (container) {
        container.appendChild(canvas);
    }

    return canvas;
}

function getContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
    let gl: WebGLRenderingContext = <WebGLRenderingContext> canvas.getContext("webgl");

    if (!gl) {
        throw new Error("Your browser doesn't support the use of WebGL");
    }

    return gl;
}

class Renderer {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;

    pixelSize: Array<number>;
    resolution: Array<number>;

    fontImage: HTMLImageElement;
    fontTexture: WebGLTexture;
    fontReady: boolean;

    black: Tile;

    time: number;
    lastTime: number;

    mainSurface: ScreenBuffer;

    shaders: any;

    constructor(width: number, height: number, container: HTMLDivElement) {
        this.canvas = createCanvas(width, height, container);
        this.gl = getContext(this.canvas);

        // TODO: Move this to interfaces (?)
        this.pixelSize = [10.0, 16.0];
        this.resolution = [this.canvas.width / this.pixelSize[0], this.canvas.height / this.pixelSize[1]];

        this.fontTexture = null;

        this.black = new Tile();

        this.time = 0.0;
        this.lastTime = (new Date()).getTime();

        this.setupBasicProperties();

        this.shaders = {
            basic: new Shader(this.gl, BasicShader)
        };

        this.mainSurface = this.createRenderingTarget();
        this.shaders.basic.useProgram();
    }

    setupBasicProperties() {
        let gl: WebGLRenderingContext = this.gl;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
    }

    setFontTexture(src: string): HTMLImageElement {
        this.fontImage = new Image();
        this.fontImage.src = src;
        this.fontReady = false;

        this.fontTexture = null;

        this.fontImage.onload = () => {
            let gl: WebGLRenderingContext = this.gl;

            this.fontTexture = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, this.fontTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.fontImage);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);

            gl.bindTexture(gl.TEXTURE_2D, null);

            this.fontReady = true;
        };

        return this.fontImage;
    }

    createRenderingTarget(): ScreenBuffer {
        let gl: WebGLRenderingContext = this.gl;

        let screenWidth: number = gl.canvas.width / this.pixelSize[0];
        let screenHeight: number = gl.canvas.height / this.pixelSize[1];

        let triangleWidth: number = this.pixelSize[0] / gl.canvas.width * 2.0;
        let triangleHeight: number = this.pixelSize[1] / gl.canvas.height * 2.0;

        let vertices: Array<number> = [];
        let indices: Array<number> = [];
        let background: Array<number> = [];
        let foreground: Array<number> = [];
        let characters: Array<number> = [];
        let index: number = 0;

        for (let x = 0; x < screenWidth; x += 1) {
            for (let y = 0; y < screenHeight; y += 1) {
                vertices.push(x * triangleWidth);
                vertices.push((y + 1) * triangleHeight);

                vertices.push((x + 1) * triangleWidth);
                vertices.push((y + 1) * triangleHeight);

                vertices.push(x * triangleWidth);
                vertices.push(y * triangleHeight);

                vertices.push((x + 1) * triangleWidth);
                vertices.push(y * triangleHeight);

                for (let j = 0; j < 12; j++) {
                    background.push(0.0);
                    foreground.push(0.0);
                    if (j < 8) {
                        characters.push(0.0);
                    }
                }

                let topL: number, topR: number, botL: number, botR: number;

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

        let vertexPositionBuffer: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        let vertexBackgroundBuffer: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBackgroundBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(background), gl.STATIC_DRAW);

        let vertexForegroundBuffer: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexForegroundBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(foreground), gl.STATIC_DRAW);

        let vertexCharacterBuffer: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexCharacterBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(characters), gl.STATIC_DRAW);

        let indexBuffer: WebGLBuffer = gl.createBuffer();
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
    }

    getTile(bColor: Color = this.black.background, fColor: Color = this.black.foreground, chara: Character = {x: 0, y: 0}, effect: void = null): Tile {
        return new Tile(bColor, fColor, chara);
    }

    plotCharacter(x: number, y: number, tile: Tile, surface: ScreenBuffer = this.mainSurface) {
        let topL: number, topR: number, botL: number, botR: number, cw: number, ch: number, cx: number, cy: number, index: number;
        let color: Color;
        let character: Character;

        index = (x * this.resolution[1] + y) * 12;

        color = tile.foreground;
        character = tile.character;

        for (let i = 0; i < 4; i++) {
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
    }

    plotBackground(x: number, y: number, tile: Tile, surface: ScreenBuffer = this.mainSurface) {
        let index: number = (x * this.resolution[1] + y) * 12,
            color: Color = tile.background;

        for (let i = 0; i < 4; i++) {
            surface.background[index + i * 3] = color.r;
            surface.background[index + i * 3 + 1] = color.g;
            surface.background[index + i * 3 + 2] = color.b;
        }

        surface.updated = false;
    }

    plot(x: number, y: number, tile: Tile, surface: ScreenBuffer = this.mainSurface) {
        this.plotBackground(x, y, tile, surface);
        this.plotCharacter(x, y, tile, surface);
    }

    clearRect(x: number, y: number, w: number, h: number, surface: ScreenBuffer = this.mainSurface) {
        w = x + w;
        h = y + h;

        for (var i = x; i < w; i++) {
            for (var j = y; j < h; j++) {
                this.plot(i, j, this.black, surface);
            }
        }
    }

    updateSurface(surface: ScreenBuffer) {
        let gl: WebGLRenderingContext = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexBackgroundBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surface.background), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexForegroundBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surface.foreground), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexCharacterBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surface.characters), gl.STATIC_DRAW);

        surface.updated = true;
    }

    updateTime() {
        let now: number = (new Date()).getTime();
        this.time += now - this.lastTime;
        this.lastTime = now;
    }

    render(surface: ScreenBuffer = this.mainSurface) {
        let gl: WebGLRenderingContext = this.gl,
            shader: Shader = <Shader> this.shaders.basic;

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

        /*gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, surface.content.texture);
        gl.uniform1i(shader.uniforms.uTexture, 0);*/

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.fontTexture);
        gl.uniform1i(shader.uniforms.uFont, 0);

        gl.drawElements(gl.TRIANGLES, surface.indexNumber, gl.UNSIGNED_SHORT, 0);
    }
}

export { Renderer };