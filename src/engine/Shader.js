'use strict';

class Shader {
    constructor(gl, shader) {
        this.gl = gl;
        
        this.attributes = {};
        this.uniforms = {};
        this.program = null;
        
        this.compileShaders(shader);
        this.getShaderAttributes(shader);
        this.getShaderUniforms(shader);
    }
    
    compileShaders(shader) {
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
        
        if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)){
            console.log(gl.getShaderInfoLog(vShader));
            throw new Error("Error compiling vertex shader");
        }
        
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)){
            console.log(gl.getShaderInfoLog(fShader));
            throw new Error("Error compiling fragment shader");
        }
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)){
            console.log(gl.getProgramInfoLog(this.program));
            throw new Error("Error linking the program");
        }
    }
    
    getShaderAttributes(shader) {
        var code = shader.vertexShader.split(/\n/g);
        var gl = this.gl;
        
        var attribute, location;
        for (var i=0,len=code.length;i<len;i++){
            var c = code[i].trim().split(/ /g);
            
            if (c[0] == 'attribute'){
                attribute = c.pop().replace(/;/g, "");
                location = gl.getAttribLocation(this.program, attribute);
                
                gl.enableVertexAttribArray(location);
                
                this.attributes[attribute] = location;
            }
        }
        
        Shader.maxAttribLength = Math.max(Shader.maxAttribLength, this.attributes.length);
    }
    
    getShaderUniforms(shader) {
        var code = shader.vertexShader.split(/\n/g);
        code = code.concat(shader.fragmentShader.split(/\n/g));
        
        var gl = this.gl;
        
        var uniform, location;
        var usedUniforms = [];
        
        for (var i=0,len=code.length;i<len;i++){
            var c = code[i].trim().split(/ /g);
            
            if (c[0] == "uniform"){
                uniform = c.pop().replace(/;/g , "");
                if (usedUniforms.indexOf(uniform) != -1){ continue; }
                
                location = gl.getUniformLocation(this.program, uniform);
                
                usedUniforms.push(uniform);
                
                this.uniforms[uniform] = location;
            }
        }
    }
    
    useProgram() {
        if (Shader.lastProgram == this){ return; }
        
        var gl = this.gl;
        
        gl.useProgram(this.program);
        Shader.lastProgram = this;
        
        var attribLength = this.attributes.length;
        for (var i=0,len=Shader.maxAttribLength;i<len;i++){
            if (i < attribLength){
                gl.enableVertexAttribArray(i);
            }else {
                gl.disableVertexAttribArray(i);
            }
        }
    }
}

module.exports = Shader;

Shader.maxAttribLength = 0;
Shader.lastProgram = null;