/*globals Image*/

'use strict';

var Shader = require('./Shader');

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
        this.tableSize = [64.0, 64.0];
        this.resolution = [this.canvas.width / this.pixelSize[0], this.canvas.height / this.pixelSize[1], this.tableSize[0], this.tableSize[1]];
        
        this.fontTexture = null;
        this.fontResolution = [1.0, 1.0, 1.0, 1.0];
        
        this.black = [0, 0, 0];
        
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
            
            this.fontResolution = [this.pixelSize[0] / img.width, this.pixelSize[1] / img.height, Math.floor(img.width / this.pixelSize[0]), Math.floor(img.height / this.pixelSize[1])];
            
            this.fontTexture = gl.createTexture();
            
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
            
        var vertices = [
            0.0, 2.0,
            0.0, 0.0, 
            2.0, 0.0,
            2.0, 2.0
        ];
        
        var indices = [
            0, 1, 2,
            
            0, 2, 3
        ];
            
        var vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        vertexPositionBuffer.itemsNum = vertices.length / 2;
        
        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        indexBuffer.itemsNum = indices.length;
        
        return { 
            vertexPositionBuffer: vertexPositionBuffer, 
            indexBuffer: indexBuffer,
            content: this.createLookUpTextureTable(),
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
    
    getTile(bColor=this.black, fColor=this.black, chara=0, effect=0, surface = this.mainSurface) {
        var bCI = this.getColorIndex(bColor, surface),
            fCI = this.getColorIndex(fColor, surface);
        
        var tile = (bCI << 24 | fCI << 16 | chara << 8 | effect);
        
        return tile;
    }
    
    plotCharacter(x, y, tile, surface = this.mainSurface) {
        var pI = (y * this.resolution[0] + x + 256) * 4;
        
        surface.content.table[pI + 1] = (tile & (255 << 16)) >> 16;
        surface.content.table[pI + 2] = (tile & (255 << 8)) >> 8;
        surface.updated = false;
    }
    
    plot(x, y, tile, surface = this.mainSurface) {
        var pI = (y * this.resolution[0] + x + 256) * 4;
        
        surface.content.table[pI] = (tile & (255 << 24)) >> 24;
        surface.content.table[pI + 1] = (tile & (255 << 16)) >> 16;
        surface.content.table[pI + 2] = (tile & (255 << 8)) >> 8;
        surface.content.table[pI + 3] = tile & 255;
        
        surface.updated = false;
    }
    
    updateSurface(surface) {
        var gl = this.gl;
        
        gl.bindTexture(gl.TEXTURE_2D, surface.content.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.tableSize[0], this.tableSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, surface.content.table);
        
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
        
        this.updateTime();
        gl.uniform1f(shader.uniforms.uTime, this.time);
        
        gl.uniform4fv(shader.uniforms.uResolution, this.resolution);
        gl.uniform4fv(shader.uniforms.uFontRes, this.fontResolution);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, surface.vertexPositionBuffer);
        gl.vertexAttribPointer(shader.attributes.aVertexPosition, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surface.indexBuffer);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, surface.content.texture);
        gl.uniform1i(shader.uniforms.uTexture, 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.fontTexture);
        gl.uniform1i(shader.uniforms.uFont, 1);
        
        gl.drawElements(gl.TRIANGLES, surface.indexBuffer.itemsNum, gl.UNSIGNED_SHORT, 0);
    }
}

module.exports = Renderer;