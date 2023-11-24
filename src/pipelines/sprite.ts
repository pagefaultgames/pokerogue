import Pokemon from "../pokemon";
import Trainer from "../trainer";

const spriteFragShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uMainSampler[%count%];

varying vec2 outTexCoord;
varying float outTexId;
varying vec2 outPosition;
varying float outTintEffect;
varying vec4 outTint;

uniform int hasShadow;
uniform int yCenter;
uniform float vCutoff;
uniform vec2 relPosition;
uniform vec2 size;
uniform float yOffset;
uniform vec4 tone;
uniform ivec4 spriteColors[32];
uniform ivec4 fusionSpriteColors[32];

const vec3 lumaF = vec3(.299, .587, .114);

void main()
{
    vec4 texture;

    %forloop%

    vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);

    //  Multiply texture tint
    vec4 color = texture * texel;

    for (int i = 0; i < 32; i++) {
        if (spriteColors[i][3] == 0)
            break;
        if (texture.a > 0.0 && int(texture.r * 255.0) == spriteColors[i].r && int(texture.g * 255.0) == spriteColors[i].g && int(texture.b * 255.0) == spriteColors[i].b) {
            vec3 fusionColor = vec3(float(fusionSpriteColors[i].r) / 255.0, float(fusionSpriteColors[i].g) / 255.0, float(fusionSpriteColors[i].b) / 255.0);
            vec3 bg = vec3(float(spriteColors[i].r) / 255.0, float(spriteColors[i].g) / 255.0, float(spriteColors[i].b) / 255.0);
            float gray = (bg.r + bg.g + bg.b) / 3.0;
            bg = vec3(gray, gray, gray);
            vec3 fg = fusionColor;
            color.rgb = mix(1.0 - 2.0 * (1.0 - bg) * (1.0 - fg), 2.0 * bg * fg, step(bg, vec3(0.5)));
            break;
        }
    }

    if (outTintEffect == 1.0) {
        //  Solid color + texture alpha
        color.rgb = mix(texture.rgb, outTint.bgr * outTint.a, texture.a);
    } else if (outTintEffect == 2.0) {
        //  Solid color, no texture
        color = texel;
    }

    /* Apply gray */
    float luma = dot(color.rgb, lumaF);
    color.rgb = mix(color.rgb, vec3(luma), tone.w);

    /* Apply tone */
    color.rgb += tone.rgb * (color.a / 255.0);

    if (hasShadow == 1) {
        float width = size.x - (yOffset / 2.0);

        float spriteX = ((floor(outPosition.x / 6.0) - relPosition.x) / width) + 0.5;
        float spriteY = ((floor(outPosition.y / 6.0) - relPosition.y) / size.y);

        if (yCenter == 1) {
            spriteY += 0.5;
        } else {
            spriteY += 1.0;
        }

        bool yOverflow = outTexCoord.y >= vCutoff;

        if ((spriteY >= 0.9 && (color.a == 0.0 || yOverflow))) {
            float shadowSpriteY = (spriteY - 0.9) * (1.0 / 0.15);
            if (distance(vec2(spriteX, shadowSpriteY), vec2(0.5, 0.5)) < 0.5) {
                color = vec4(vec3(0.0, 0.0, 0.0), 0.5);
            } else if (yOverflow) {
                discard;
            }
        } else if (yOverflow) {
            discard;
        }
    }

    gl_FragColor = color;
}
`;

const spriteVertShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform mat4 uProjectionMatrix;

attribute vec2 inPosition;
attribute vec2 inTexCoord;
attribute float inTexId;
attribute float inTintEffect;
attribute vec4 inTint;

varying vec2 outTexCoord;
varying float outTexId;
varying vec2 outPosition;
varying float outTintEffect;
varying vec4 outTint;

void main()
{
    gl_Position = uProjectionMatrix * vec4(inPosition, 1.0, 1.0);

    outTexCoord = inTexCoord;
    outTexId = inTexId;
    outPosition = inPosition;
    outTint = inTint;
    outTintEffect = inTintEffect;
}
`;

export default class SpritePipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline {
    private _tone: number[];

    constructor(game: Phaser.Game) {
        super({
            game: game,
            name: 'sprite',
            fragShader: spriteFragShader,
            vertShader: spriteVertShader
        });

        this._tone = [ 0, 0, 0, 0 ];
    }

    onPreRender(): void {
        this.set1i('hasShadow', 0);
        this.set1i('yCenter', 0);
        this.set2f('relPosition', 0, 0);
        this.set2f('size', 0, 0);
        this.set1f('yOffset', 0);
        this.set4fv('tone', this._tone);
    }

    onBind(gameObject: Phaser.GameObjects.GameObject): void {
        super.onBind();

        const sprite = (gameObject as Phaser.GameObjects.Sprite);

        const data = sprite.pipelineData;
        const tone = data['tone'] as number[];
        const hasShadow = data['hasShadow'] as boolean;
        const ignoreOverride = data['ignoreOverride'] as boolean;
        const spriteColors = (ignoreOverride && data['spriteColorsBase']) || data['spriteColors'] || [] as number[][];
        const fusionSpriteColors = (ignoreOverride && data['fusionSpriteColorsBase']) || data['fusionSpriteColors'] || [] as number[][];

        const position = sprite.parentContainer instanceof Pokemon || sprite.parentContainer instanceof Trainer
            ? [ sprite.parentContainer.x, sprite.parentContainer.y ]
            : [ sprite.x, sprite.y ];
        position[0] += -(sprite.width - sprite.frame.width) / 2 + sprite.frame.x;
        this.set1i('hasShadow', hasShadow ? 1 : 0);
        this.set1i('yCenter', sprite.originY === 0.5 ? 1 : 0);
        this.set2f('relPosition', position[0], position[1]);
        this.set2f('size', sprite.frame.width, sprite.height);
        this.set1f('yOffset', sprite.height - sprite.frame.height);
        this.set4fv('tone', tone);
        const emptyColors = [ 0, 0, 0, 0 ];
        const flatSpriteColors: integer[] = [];
        const flatFusionSpriteColors: integer[] = [];
        for (let c = 0; c < 32; c++) {
          flatSpriteColors.splice(flatSpriteColors.length, 0, c < spriteColors.length ? spriteColors[c] : emptyColors);
          flatFusionSpriteColors.splice(flatFusionSpriteColors.length, 0, c < fusionSpriteColors.length ? fusionSpriteColors[c] : emptyColors);
        }

        this.set4iv(`spriteColors`, flatSpriteColors.flat());
        this.set4iv(`fusionSpriteColors`, flatFusionSpriteColors.flat());
    }

    onBatch(gameObject: Phaser.GameObjects.GameObject): void {
        if (gameObject)
            this.flush();
    }

    batchQuad(gameObject: Phaser.GameObjects.GameObject, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number,
        u0: number, v0: number, u1: number, v1: number, tintTL: number, tintTR: number, tintBL: number, tintBR: number, tintEffect: number | boolean,
        texture?: WebGLTexture, unit?: number): boolean {
        const sprite = gameObject as Phaser.GameObjects.Sprite;

        this.set1f('vCutoff', v1);

        const hasShadow = sprite.pipelineData['hasShadow'] as boolean;
        if (hasShadow) {
            const baseY = (sprite.parentContainer instanceof Pokemon || sprite.parentContainer instanceof Trainer
                ? sprite.parentContainer.y
                : sprite.y + sprite.height / 2) * 6;
            const bottomPadding = Math.ceil(sprite.height * 0.05) * 6;
            const yDelta = (baseY - y1) / 6;
            y2 = y1 = baseY + bottomPadding;
            const pixelHeight = (v1 - v0) / sprite.frame.height;
            v1 += (yDelta + bottomPadding / 6) * pixelHeight;
        }
        
        return super.batchQuad(gameObject, x0, y0, x1, y1, x2, y2, x3, y3, u0, v0, u1, v1, tintTL, tintTR, tintBL, tintBR, tintEffect, texture, unit);
    }

    get tone(): number[] {
        return this._tone;
    }

    set tone(value: number[]) {
        this._tone = value;
    }
}