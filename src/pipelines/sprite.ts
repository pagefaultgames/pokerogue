import BattleScene from "../battle-scene";
import Pokemon from "../pokemon";

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

uniform bool hasShadow;
uniform bool yCenter;
uniform float vCutoff;
uniform vec2 relPosition;
uniform vec2 size;
uniform float yOffset;
uniform vec4 tone;

const vec3 lumaF = vec3(.299, .587, .114);

void main()
{
    vec4 texture;

    %forloop%

    vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);

    //  Multiply texture tint
    vec4 color = texture * texel;

    if (outTintEffect == 1.0)
    {
        //  Solid color + texture alpha
        color.rgb = mix(texture.rgb, outTint.bgr * outTint.a, texture.a);
    }
    else if (outTintEffect == 2.0)
    {
        //  Solid color, no texture
        color = texel;
    }

    /* Apply gray */
    float luma = dot(color.rgb, lumaF);
    color.rgb = mix(color.rgb, vec3(luma), tone.w);

    /* Apply tone */
    color.rgb += tone.rgb * (color.a / 255.0);

    if (hasShadow) {
        float width = size.x - (yOffset / 2.0);

        float spriteX = ((floor(outPosition.x / 6.0) - relPosition.x) / width) + 0.5;
        float spriteY = ((floor(outPosition.y / 6.0) - relPosition.y) / size.y);

        if (yCenter) {
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
        this.setBoolean('hasShadow', false);
        this.setBoolean('yCenter', false);
        this.set2f('relPosition', 0, 0);
        this.set2f('size', 0, 0);
        this.set1f('yOffset', 0);
        this.set4f('tone', this._tone[0], this._tone[1], this._tone[2], this._tone[3]);
    }

    onBind(gameObject: Phaser.GameObjects.GameObject): void {
        super.onBind();

        const sprite = (gameObject as Phaser.GameObjects.Sprite);

        const data = sprite.pipelineData;
        const tone = data['tone'] as number[];
        const hasShadow = data['hasShadow'] as boolean;

        const position = sprite.parentContainer instanceof Pokemon
            ? [ sprite.parentContainer.x, sprite.parentContainer.y ]
            : [ sprite.x, sprite.y ];
        position[0] += -(sprite.width - sprite.frame.width) / 2 + sprite.frame.x;
        this.setBoolean('hasShadow', hasShadow);
        this.setBoolean('yCenter', sprite.originY === 0.5);
        this.set2f('relPosition', position[0], position[1]);
        this.set2f('size', sprite.frame.width, sprite.height);
        this.set1f('yOffset', sprite.height - sprite.frame.height);
        this.set4f('tone', tone[0], tone[1], tone[2], tone[3]);
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
            const baseY = (sprite.parentContainer instanceof Pokemon
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