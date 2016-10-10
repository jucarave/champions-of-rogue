/*globals Image*/

'use strict';

var Shader = require('./Shader');
var Tile = require('./Tile');

function createCanvas(width, height, container = null) {
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
    
    gl.width = canvas.width;
    gl.height = canvas.height;
    
    return gl;
}

class Renderer {
    constructor(width, height, container) {
        this.canvas = createCanvas(width, height, container);
        this.gl = getContext(this.canvas);
        
        this.pixelSize = [10.0, 16.0];
        this.resolution = [this.canvas.width / this.pixelSize[0], this.canvas.height / this.pixelSize[1]];
        
        this.fontTexture = null;
        
        this.black = new Tile();
        
        this.time = 0.0;
        this.lastTime = (new Date()).getTime();
        
        this.setupBasicProperties();
        
        this.shaders = {
            basic: new Shader(this.gl, require('./shaders/Basic'))
        };
        
        this.mainSurface = this.createRenderingTarget();
        this.shaders.basic.useProgram();
    }
    
    setupBasicProperties() {
        var gl = this.gl;
        
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        
        gl.viewport(0, 0, gl.width, gl.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
    }
    
    setFontTexture(src) {
        var img = new Image();
        img.src = src;
        img.ready = false;
        
        this.fontTexture = null;
        
        img.onload = () => {
            var gl = this.gl;
            
            this.fontTexture = gl.createTexture();
            this.fontTexture.width = img.width;
            this.fontTexture.height = img.height;
            
            gl.bindTexture(gl.TEXTURE_2D, this.fontTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);
            
            gl.bindTexture(gl.TEXTURE_2D, null);
            
            img.ready = true;
        };
        
        return img;
    }
    
    createRenderingTarget() {
        var gl = this.gl;
        
        var screenWidth = gl.width / this.pixelSize[0];
        var screenHeight = gl.height / this.pixelSize[1];
        
        var triangleWidth = this.pixelSize[0] / gl.width * 2.0;
        var triangleHeight = this.pixelSize[1] / gl.height * 2.0;
        
        var vertices = [];
        var indices = [];
        var background = [];
        var foreground = [];
        var characters = [];
        var index = 0;
        
        for (var x=0;x<screenWidth;x+=1) {
            for (var y=0;y<screenHeight;y+=1) {
                vertices.push(x * triangleWidth);
                vertices.push((y + 1) * triangleHeight);
                
                vertices.push((x + 1) * triangleWidth);
                vertices.push((y + 1) * triangleHeight);
                
                vertices.push(x * triangleWidth);
                vertices.push(y * triangleHeight);
                
                vertices.push((x + 1) * triangleWidth);
                vertices.push(y * triangleHeight);
                
                for (var j=0;j<12;j++){
                    background.push(0.0);
                    foreground.push(0.0);
                    if (j < 8) {
                        characters.push(0.0);
                    }
                }
                
                if (x > 0) {
                    let topL, topR, botL, botR;
                    
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
        }
        
        var vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        vertexPositionBuffer.itemsNum = vertices.length / 2;
        
        var vertexBackgroundBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBackgroundBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(background), gl.STATIC_DRAW);
        vertexBackgroundBuffer.itemsNum = background.length / 3;
        
        var vertexForegroundBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexForegroundBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(foreground), gl.STATIC_DRAW);
        vertexForegroundBuffer.itemsNum = foreground.length / 3;
        
        var vertexCharacterBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexCharacterBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(characters), gl.STATIC_DRAW);
        vertexCharacterBuffer.itemsNum = characters.length / 2;
        
        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        indexBuffer.itemsNum = indices.length;
        
        return { 
            vertexPositionBuffer: vertexPositionBuffer, 
            vertexBackgroundBuffer: vertexBackgroundBuffer,
            vertexForegroundBuffer: vertexForegroundBuffer,
            vertexCharacterBuffer: vertexCharacterBuffer,
            indexBuffer: indexBuffer,
            
            background: background,
            foreground: foreground,
            characters: characters,
            
            updated: true
        };
    }
    
    createLookUpTextureTable() {
        var length = this.tableSize[0] * this.tableSize[1] * 4,
            table = new Uint8Array(length),
            gl = this.gl,
            texture = gl.createTexture();
        
        for (var i=0,l=256*4;i<l;i+=4) {
            table[i + 3] = 255;
        }
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.tableSize[0], this.tableSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, table);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        
        gl.bindTexture(gl.TEXTURE_2D, null);
        
        return {
            table: table,
            colors: [ "0,0,0" ],
            texture: texture
        };
    }
    
    getColorIndex(color, surface) {
        if (!color) return 0;
        
        var c = color[0] + "," + color[1] + "," + color[2],
            cI = surface.content.colors.indexOf(c);
            
        if (cI == -1) {
            cI = surface.content.colors.length;
            if (cI >= 256){ throw new Error("Can't add more than 256 colors!"); }
            
            surface.content.colors.push(c);
            
            var ind = cI * 4;
            surface.content.table[ind] = color[0];
            surface.content.table[ind + 1] = color[1];
            surface.content.table[ind + 2] = color[2];
        }
        
        return cI;
    }
    
    getTile(bColor=this.black.background, fColor=this.black.foreground, chara=[0, 0], effect=null) {
        return new Tile(bColor, fColor, chara);
    }
    
    plotCharacter(x, y, tile, surface = this.mainSurface) {
        let topL, topR, botL, botR, cw, ch, cx, cy, index, color, character;
        index = (x * this.resolution[1] + y) * 12;
        
        color = tile.foreground;
        character = tile.character;
        
        for (let i=0;i<4;i++) {
            surface.foreground[index + i * 3] = color[0];
            surface.foreground[index + i * 3 + 1] = color[1];
            surface.foreground[index + i * 3 + 2] = color[2];
        }
        
        cw = this.pixelSize[0] / this.fontTexture.width;
        ch = this.pixelSize[1] / this.fontTexture.height;
        cx = character[0] * cw;
        cy = character[1] * ch;
        
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
    
    plotBackground(x, y, tile, surface = this.mainSurface) {
        let index = (x * this.resolution[1] + y) * 12,
            color = tile.background;
        
        for (let i=0;i<4;i++) {
            surface.background[index + i * 3] = color[0];
            surface.background[index + i * 3 + 1] = color[1];
            surface.background[index + i * 3 + 2] = color[2];
        }
        
        surface.updated = false;
    }
    
    plot(x, y, tile, surface = this.mainSurface) {
        this.plotBackground(x, y, tile, surface);
        this.plotCharacter(x, y, tile, surface);
    }
    
    clearRect(x, y, w, h, surface = this.mainSurface) {
        w = x + w;
        h = y + h;
        
        for (var i=x;i<w;i++) {
            for (var j=y;j<h;j++) {
                this.plot(i, j, this.black, surface);
            }
        }
    }
    
    updateSurface(surface) {
        var gl = this.gl;
        
        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexBackgroundBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surface.background), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexForegroundBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surface.foreground), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexCharacterBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surface.characters), gl.STATIC_DRAW);
        
        surface.updated = true;
    }
    
    updateTime() {
        var now = (new Date()).getTime();
        this.time += now - this.lastTime;
        this.lastTime = now;
    }
    
    render(surface = this.mainSurface) {
        var gl = this.gl,
            shader = this.shaders.basic;
            
        if (!surface.updated) {
            this.updateSurface(surface);
        }
        
        /*this.updateTime();
        gl.uniform1f(shader.uniforms.uTime, this.time % 1300.0);
        
        gl.uniform4fv(shader.uniforms.uResolution, this.resolution);
        gl.uniform4fv(shader.uniforms.uFontRes, this.fontResolution);*/
        
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
        
        gl.drawElements(gl.TRIANGLES, surface.indexBuffer.itemsNum, gl.UNSIGNED_SHORT, 0);
    }
}

module.exports = Renderer;