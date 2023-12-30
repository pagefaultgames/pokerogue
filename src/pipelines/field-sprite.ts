import BattleScene from "../battle-scene";
import * as Utils from "../utils";

const spriteFragShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uMainSampler[%count%];

varying vec2 outTexCoord;
varying float outTexId;
varying float outTintEffect;
varying vec4 outTint;

uniform float time;
uniform int isOutside;
uniform vec3 dayTint;
uniform vec3 duskTint;
uniform vec3 nightTint;

float blendOverlay(float base, float blend) {
	return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
	return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
}

vec3 blendHardLight(vec3 base, vec3 blend) {
	return blendOverlay(blend, base);
}

void main()
{
    vec4 texture;

    %forloop%

    vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);

    //  Multiply texture tint
    vec4 color = texture * texel;

    if (outTintEffect == 1.0) {
        //  Solid color + texture alpha
        color.rgb = mix(texture.rgb, outTint.bgr * outTint.a, texture.a);
    } else if (outTintEffect == 2.0) {
        //  Solid color, no texture
        color = texel;
    }

    /* Apply day/night tint */
    if (color.a > 0.0) {
        vec3 dayNightTint;

        if (time < 0.25) {
            dayNightTint = dayTint;
        } else if (isOutside == 0 && time < 0.5) {
            dayNightTint = mix(dayTint, nightTint, (time - 0.25) / 0.25);
        } else if (time < 0.375) {
            dayNightTint = mix(dayTint, duskTint, (time - 0.25) / 0.125);
        } else if (time < 0.5) {
            dayNightTint = mix(duskTint, nightTint, (time - 0.375) / 0.125);
        } else if (time < 0.75) {
            dayNightTint = nightTint;
        } else if (isOutside == 0) {
            dayNightTint = mix(nightTint, dayTint, (time - 0.75) / 0.25);
        } else if (time < 0.875) {
            dayNightTint = mix(nightTint, duskTint, (time - 0.75) / 0.125);
        } else {
            dayNightTint = mix(duskTint, dayTint, (time - 0.875) / 0.125);
        }

        color = vec4(blendHardLight(color.rgb, dayNightTint), color.a);
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
varying float outTintEffect;
varying vec4 outTint;

void main()
{
    gl_Position = uProjectionMatrix * vec4(inPosition, 1.0, 1.0);

    outTexCoord = inTexCoord;
    outTexId = inTexId;
    outTint = inTint;
    outTintEffect = inTintEffect;
}
`;

export default class FieldSpritePipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline {
    constructor(game: Phaser.Game, config?: Phaser.Types.Renderer.WebGL.WebGLPipelineConfig) {
        super(config || {
            game: game,
            name: 'field-sprite',
            fragShader: spriteFragShader,
            vertShader: spriteVertShader
        });
    }

    onPreRender(): void {
        this.set1f('time', 0);
    }

    onBind(gameObject: Phaser.GameObjects.GameObject): void {
        super.onBind();

        const sprite = (gameObject as Phaser.GameObjects.Sprite);
        const scene = sprite.scene as BattleScene;

        let time = scene.currentBattle?.waveIndex
            ? ((scene.currentBattle.waveIndex + scene.getWaveCycleOffset()) % 40) / 40 // ((new Date().getSeconds() * 1000 + new Date().getMilliseconds()) % 10000) / 10000
            : Utils.getCurrentTime();
        this.set1f('time', time); 
        this.set1i('isOutside', scene.arena.isOutside() ? 1 : 0);
        this.set3fv('dayTint', scene.arena.getDayTint().map(c => c / 255));
        this.set3fv('duskTint', scene.arena.getDuskTint().map(c => c / 255));
        this.set3fv('nightTint', scene.arena.getNightTint().map(c => c / 255));
    }

    onBatch(gameObject: Phaser.GameObjects.GameObject): void {
        if (gameObject)
            this.flush();
    }
}