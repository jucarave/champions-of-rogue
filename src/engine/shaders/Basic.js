'use strict';

module.exports = {
    vertexShader: `
        precision mediump float;
        
        uniform vec4 uResolution;
            
        attribute vec2 aVertexPosition;
        
        varying vec2 vUV;
        
        void main(void) {
            gl_Position = vec4(aVertexPosition - 1.0, 0.0, 1.0);
            
            vUV = aVertexPosition / 2.0;
            vUV.x = vUV.x * uResolution.x;
            vUV.y = (1.0 - vUV.y) * uResolution.y;
        }
    `,
    
    fragmentShader: `
        precision mediump float;
        
        uniform vec4 uResolution;
        uniform vec4 uFontRes;
        uniform sampler2D uFont;
        uniform sampler2D uTexture;
        uniform float uTime;
        
        varying vec2 vUV;
        
        vec4 getTile(int x, int y) {
            float so = float((y * int(uResolution.x) + x) + 256);
            
            vec2 tex = vec2(mod(so, uResolution.z) / uResolution.z, floor(so / uResolution.z) / uResolution.w);
            
            return texture2D(uTexture, tex);
        }
        
        vec4 getColor(float bIndex) {
            vec2 tex = vec2(mod(bIndex, uResolution.z) / uResolution.z, floor(bIndex / uResolution.z) / uResolution.w);
            return texture2D(uTexture, tex);
        }
        
        vec4 getChara(float cIndex, int effect) {
            float x = mod(cIndex, uFontRes.z) * uFontRes.x;
            float y = floor(cIndex / uFontRes.z) * uFontRes.y;
            
            vec2 fc = fract(vUV);
            fc.x = fc.x * uFontRes.x + x;
            fc.y = fc.y * uFontRes.y + y;
            
            if (effect == 1){
                fc.y += sin((uTime + vUV.x * 500.0) * 0.005) * 0.05 * uFontRes.y;
            }
            
            vec4 col = texture2D(uFont, fc);
            
            return col;
        }
        
        void main(void) {
            vec4 tile = getTile(int(vUV.x), int(vUV.y));
            
            int effect = int(tile.a * 255.0 + 0.5);
            vec4 back = getColor(floor(tile.r * 255.0 + 0.5));
            vec4 front = getColor(floor(tile.g * 255.0 + 0.5));
            vec4 chara = getChara(floor(tile.b * 255.0 + 0.5), effect);
            
            chara.rgb = front.rgb;
            
            gl_FragColor = mix(back, chara, chara.a);
        }
    `
};