'use strict';

module.exports = {
    vertexShader: `
        precision mediump float;
        
        attribute vec2 aVertexPosition;
        attribute vec3 aVertexBackground;
        attribute vec3 aVertexForeground;
        attribute vec2 aVertexCharacter;
        
        varying vec3 vBackground;
        varying vec3 vForeground;
        varying vec2 vCharacter;
        
        void main(void) {
            vec2 position = aVertexPosition;
            position.y = 2.0 - position.y;
            
            gl_Position = vec4(position - 1.0, 0.0, 1.0);
            
            vBackground = aVertexBackground;
            vForeground = aVertexForeground;
            vCharacter = aVertexCharacter;
        }
    `,
    
    fragmentShader: `
        precision mediump float;
        
        uniform sampler2D uTexture;
        
        varying vec3 vBackground;
        varying vec3 vForeground;
        varying vec2 vCharacter;
        
        void main(void) {
            vec4 characterColor = texture2D(uTexture, vCharacter);
            characterColor.rgb = vForeground;
        
            gl_FragColor = vec4(mix(vBackground, characterColor.rgb, characterColor.a), 1.0);
        }
    `
};