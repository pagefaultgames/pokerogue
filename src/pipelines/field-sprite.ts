import BattleScene from "../battle-scene";
import { TerrainType, getTerrainColor } from "../data/terrain";
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
uniform int ignoreTimeTint;
uniform int isOutside;
uniform vec3 dayTint;
uniform vec3 duskTint;
uniform vec3 nightTint;
uniform vec3 terrainColor;
uniform float terrainColorRatio;

float blendOverlay(float base, float blend) {
	return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
	return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
}

vec3 blendHardLight(vec3 base, vec3 blend) {
	return blendOverlay(blend, base);
}

float hue2rgb(float f1, float f2, float hue) {
	if (hue < 0.0)
		hue += 1.0;
	else if (hue > 1.0)
		hue -= 1.0;
	float res;
	if ((6.0 * hue) < 1.0)
		res = f1 + (f2 - f1) * 6.0 * hue;
	else if ((2.0 * hue) < 1.0)
		res = f2;
	else if ((3.0 * hue) < 2.0)
		res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
	else
		res = f1;
	return res;
}

vec3 rgb2hsl(vec3 color) {
	vec3 hsl;
	
	float fmin = min(min(color.r, color.g), color.b);
	float fmax = max(max(color.r, color.g), color.b);
	float delta = fmax - fmin;

	hsl.z = (fmax + fmin) / 2.0;

	if (delta == 0.0) {
		hsl.x = 0.0;
		hsl.y = 0.0;
	} else {
		if (hsl.z < 0.5)
			hsl.y = delta / (fmax + fmin);
		else
			hsl.y = delta / (2.0 - fmax - fmin);
		
		float deltaR = (((fmax - color.r) / 6.0) + (delta / 2.0)) / delta;
		float deltaG = (((fmax - color.g) / 6.0) + (delta / 2.0)) / delta;
		float deltaB = (((fmax - color.b) / 6.0) + (delta / 2.0)) / delta;

		if (color.r == fmax )
			hsl.x = deltaB - deltaG;
		else if (color.g == fmax)
			hsl.x = (1.0 / 3.0) + deltaR - deltaB;
		else if (color.b == fmax)
			hsl.x = (2.0 / 3.0) + deltaG - deltaR;

		if (hsl.x < 0.0)
			hsl.x += 1.0;
		else if (hsl.x > 1.0)
			hsl.x -= 1.0;
	}

	return hsl;
}

vec3 hsl2rgb(vec3 hsl) {
	vec3 rgb;
	
	if (hsl.y == 0.0)
		rgb = vec3(hsl.z);
	else {
		float f2;
		
		if (hsl.z < 0.5)
			f2 = hsl.z * (1.0 + hsl.y);
		else
			f2 = (hsl.z + hsl.y) - (hsl.y * hsl.z);
			
		float f1 = 2.0 * hsl.z - f2;
		
		rgb.r = hue2rgb(f1, f2, hsl.x + (1.0/3.0));
		rgb.g = hue2rgb(f1, f2, hsl.x);
		rgb.b = hue2rgb(f1, f2, hsl.x - (1.0/3.0));
	}
	
	return rgb;
}

vec3 blendHue(vec3 base, vec3 blend) {
	vec3 baseHSL = rgb2hsl(base);
	return hsl2rgb(vec3(rgb2hsl(blend).r, baseHSL.g, baseHSL.b));
}

void main() {
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
    if (color.a > 0.0 && ignoreTimeTint == 0) {
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

    if (terrainColorRatio > 0.0 && (1.0 - terrainColorRatio) < outTexCoord.y) {
        if (color.a > 0.0 && (terrainColor.r > 0.0 || terrainColor.g > 0.0 || terrainColor.b > 0.0)) {
            color.rgb = mix(color.rgb, blendHue(color.rgb, terrainColor), 1.0);
        }
    }

    gl_FragColor = color;
}
`;

const spriteVertShader = `
precision mediump float;

uniform mat4 uProjectionMatrix;
uniform int uRoundPixels;
uniform vec2 uResolution;

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

void main() {
    gl_Position = uProjectionMatrix * vec4(inPosition, 1.0, 1.0);
    if (uRoundPixels == 1)
    {
        gl_Position.xy = floor(((gl_Position.xy + 1.0) * 0.5 * uResolution) + 0.5) / uResolution * 2.0 - 1.0;
    }
    outTexCoord = inTexCoord;
    outTexId = inTexId;
    outPosition = inPosition;
    outTint = inTint;
    outTintEffect = inTintEffect;
}
`;

export default class FieldSpritePipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline {
  constructor(game: Phaser.Game, config?: Phaser.Types.Renderer.WebGL.WebGLPipelineConfig) {
    super(config || {
      game: game,
      name: "field-sprite",
      fragShader: spriteFragShader,
      vertShader: spriteVertShader
    });
  }

  onPreRender(): void {
    this.set1f("time", 0);
    this.set1i("ignoreTimeTint", 0);
    this.set1f("terrainColorRatio", 0);
    this.set3fv("terrainColor", [ 0, 0, 0 ]);
  }

  onBind(gameObject: Phaser.GameObjects.GameObject): void {
    super.onBind();

    const sprite = gameObject as Phaser.GameObjects.Sprite | Phaser.GameObjects.NineSlice;
    const scene = sprite.scene as BattleScene;

    const data = sprite.pipelineData;
    const ignoreTimeTint = data["ignoreTimeTint"] as boolean;
    const terrainColorRatio = data["terrainColorRatio"] as number || 0;

    const time = scene.currentBattle?.waveIndex
      ? ((scene.currentBattle.waveIndex + scene.waveCycleOffset) % 40) / 40 // ((new Date().getSeconds() * 1000 + new Date().getMilliseconds()) % 10000) / 10000
      : Utils.getCurrentTime();
    this.set1f("time", time);
    this.set1i("ignoreTimeTint", ignoreTimeTint ? 1 : 0);
    this.set1i("isOutside", scene.arena.isOutside() ? 1 : 0);
    this.set3fv("dayTint", scene.arena.getDayTint().map(c => c / 255));
    this.set3fv("duskTint", scene.arena.getDuskTint().map(c => c / 255));
    this.set3fv("nightTint", scene.arena.getNightTint().map(c => c / 255));
    this.set3fv("terrainColor", getTerrainColor(scene.arena.terrain?.terrainType || TerrainType.NONE).map(c => c / 255));
    this.set1f("terrainColorRatio", terrainColorRatio);
  }

  onBatch(gameObject: Phaser.GameObjects.GameObject): void {
    if (gameObject) {
      this.flush();
    }
  }
}
