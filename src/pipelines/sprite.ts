import BattleScene from "../battle-scene";
import { variantColorCache } from "#app/data/variant";
import Pokemon from "../field/pokemon";
import Trainer from "../field/trainer";
import FieldSpritePipeline from "./field-sprite";
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
varying vec2 outPosition;
varying float outTintEffect;
varying vec4 outTint;

uniform float time;
uniform int ignoreTimeTint;
uniform int isOutside;
uniform vec3 dayTint;
uniform vec3 duskTint;
uniform vec3 nightTint;
uniform float teraTime;
uniform vec3 teraColor;
uniform int hasShadow;
uniform int yCenter;
uniform float fieldScale;
uniform float vCutoff;
uniform vec2 relPosition;
uniform vec2 texFrameUv;
uniform vec2 size;
uniform vec2 texSize;
uniform float yOffset;
uniform vec4 tone;
uniform ivec4 baseVariantColors[32];
uniform vec4 variantColors[32];
uniform ivec4 spriteColors[32];
uniform ivec4 fusionSpriteColors[32];

const vec3 lumaF = vec3(.299, .587, .114);

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
		rgb.b= hue2rgb(f1, f2, hsl.x - (1.0/3.0));
	}
	
	return rgb;
}

vec3 blendHue(vec3 base, vec3 blend) {
	vec3 baseHSL = rgb2hsl(base);
	return hsl2rgb(vec3(rgb2hsl(blend).r, baseHSL.g, baseHSL.b));
}

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec4 texture = texture2D(uMainSampler[0], outTexCoord);

    ivec4 colorInt = ivec4(int(texture.r * 255.0), int(texture.g * 255.0), int(texture.b * 255.0), int(texture.a * 255.0));

    for (int i = 0; i < 32; i++) {
        if (baseVariantColors[i][3] == 0)
            break;
        if (texture.a > 0.0 && colorInt.r == baseVariantColors[i].r && colorInt.g == baseVariantColors[i].g && colorInt.b == baseVariantColors[i].b) {
            texture.rgb = variantColors[i].rgb;
            break;
        }
    }

    for (int i = 0; i < 32; i++) {
        if (spriteColors[i][3] == 0)
            break;
        if (texture.a > 0.0 && colorInt.r == spriteColors[i].r && colorInt.g == spriteColors[i].g && colorInt.b == spriteColors[i].b) {
            vec3 fusionColor = vec3(float(fusionSpriteColors[i].r) / 255.0, float(fusionSpriteColors[i].g) / 255.0, float(fusionSpriteColors[i].b) / 255.0);
            vec3 bg = vec3(float(spriteColors[i].r) / 255.0, float(spriteColors[i].g) / 255.0, float(spriteColors[i].b) / 255.0);
            float gray = (bg.r + bg.g + bg.b) / 3.0;
            bg = vec3(gray, gray, gray);
            vec3 fg = fusionColor;
            texture.rgb = mix(1.0 - 2.0 * (1.0 - bg) * (1.0 - fg), 2.0 * bg * fg, step(bg, vec3(0.5)));
            break;
        }
    }

    vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);

    //  Multiply texture tint
    vec4 color = texture * texel;

    if (color.a > 0.0 && teraColor.r > 0.0 && teraColor.g > 0.0 && teraColor.b > 0.0) {
        vec2 relUv = vec2((outTexCoord.x - texFrameUv.x) / (size.x / texSize.x), (outTexCoord.y - texFrameUv.y) / (size.y / texSize.y));
        vec2 teraTexCoord = vec2(relUv.x * (size.x / 200.0), relUv.y * (size.y / 120.0));
        vec4 teraCol = texture2D(uMainSampler[1], teraTexCoord);
        float floorValue = 86.0 / 255.0;
        vec3 teraPatternHsv = rgb2hsv(teraCol.rgb);
        teraCol.rgb = hsv2rgb(vec3((teraPatternHsv.b - floorValue) * 4.0 + teraTexCoord.x * fieldScale / 2.0 + teraTexCoord.y * fieldScale / 2.0 + teraTime * 255.0, teraPatternHsv.b, teraPatternHsv.b));

        color.rgb = mix(color.rgb, blendHue(color.rgb, teraColor), 0.625);
        teraCol.rgb = mix(teraCol.rgb, teraColor, 0.5);
        color.rgb = blendOverlay(color.rgb, teraCol.rgb);

        if (teraColor.r < 1.0 || teraColor.g < 1.0 || teraColor.b < 1.0) {
            vec3 teraColHsv = rgb2hsv(teraColor);
            color.rgb = mix(color.rgb, teraColor, (1.0 - teraColHsv.g) / 2.0);
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

        color.rgb = blendHardLight(color.rgb, dayNightTint);
    }

    if (hasShadow == 1) {
        float width = size.x - (yOffset / 2.0);

        float spriteX = ((floor(outPosition.x / fieldScale) - relPosition.x) / width) + 0.5;
        float spriteY = ((floor(outPosition.y / fieldScale) - relPosition.y) / size.y);

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
varying vec2 outtexFrameUv;
varying float outTexId;
varying vec2 outPosition;
varying float outTintEffect;
varying vec4 outTint;

void main()
{
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

export default class SpritePipeline extends FieldSpritePipeline {
  private _tone: number[];

  constructor(game: Phaser.Game) {
    super(game, {
      game: game,
      name: "sprite",
      fragShader: spriteFragShader,
      vertShader: spriteVertShader
    });

    this._tone = [ 0, 0, 0, 0 ];
  }

  onPreRender(): void {
    super.onPreRender();

    this.set1f("teraTime", 0);
    this.set3fv("teraColor", [ 0, 0, 0 ]);
    this.set1i("hasShadow", 0);
    this.set1i("yCenter", 0);
    this.set2f("relPosition", 0, 0);
    this.set2f("texFrameUv", 0, 0);
    this.set2f("size", 0, 0);
    this.set2f("texSize", 0, 0);
    this.set1f("yOffset", 0);
    this.set4fv("tone", this._tone);
  }

  onBind(gameObject: Phaser.GameObjects.GameObject): void {
    super.onBind(gameObject);

    const sprite = (gameObject as Phaser.GameObjects.Sprite);

    const data = sprite.pipelineData;
    const tone = data["tone"] as number[];
    const teraColor = data["teraColor"] as integer[] ?? [ 0, 0, 0 ];
    const hasShadow = data["hasShadow"] as boolean;
    const ignoreFieldPos = data["ignoreFieldPos"] as boolean;
    const ignoreOverride = data["ignoreOverride"] as boolean;

    const isEntityObj = sprite.parentContainer instanceof Pokemon || sprite.parentContainer instanceof Trainer;
    const field = isEntityObj ? sprite.parentContainer.parentContainer : sprite.parentContainer;
    const position = isEntityObj
      ? [ sprite.parentContainer.x, sprite.parentContainer.y ]
      : [ sprite.x, sprite.y ];
    if (field) {
      position[0] += field.x / field.scale;
      position[1] += field.y / field.scale;
    }
    position[0] += -(sprite.width - (sprite.frame.width)) / 2 + sprite.frame.x + (!ignoreFieldPos ? (sprite.x - field.x) : 0);
    if (sprite.originY === 0.5) {
      position[1] += (sprite.height / 2) * ((isEntityObj ? sprite.parentContainer : sprite).scale - 1) + (!ignoreFieldPos ? (sprite.y - field.y) : 0);
    }
    this.set1f("teraTime", (this.game.getTime() % 500000) / 500000);
    this.set3fv("teraColor", teraColor.map(c => c / 255));
    this.set1i("hasShadow", hasShadow ? 1 : 0);
    this.set1i("yCenter", sprite.originY === 0.5 ? 1 : 0);
    this.set1f("fieldScale", field?.scale || 1);
    this.set2f("relPosition", position[0], position[1]);
    this.set2f("texFrameUv", sprite.frame.u0, sprite.frame.v0);
    this.set2f("size", sprite.frame.width, sprite.height);
    this.set2f("texSize", sprite.texture.source[0].width, sprite.texture.source[0].height);
    this.set1f("yOffset", sprite.height - sprite.frame.height * (isEntityObj ? sprite.parentContainer.scale : sprite.scale));
    this.set4fv("tone", tone);
    this.bindTexture(this.game.textures.get("tera").source[0].glTexture, 1);

    if ((gameObject.scene as BattleScene).fusionPaletteSwaps) {
      const spriteColors = ((ignoreOverride && data["spriteColorsBase"]) || data["spriteColors"] || []) as number[][];
      const fusionSpriteColors = ((ignoreOverride && data["fusionSpriteColorsBase"]) || data["fusionSpriteColors"] || []) as number[][];

      const emptyColors = [ 0, 0, 0, 0 ];
      const flatSpriteColors: integer[] = [];
      const flatFusionSpriteColors: integer[] = [];
      for (let c = 0; c < 32; c++) {
        flatSpriteColors.splice(flatSpriteColors.length, 0, ...(c < spriteColors.length ? spriteColors[c] : emptyColors));
        flatFusionSpriteColors.splice(flatFusionSpriteColors.length, 0, ...(c < fusionSpriteColors.length ? fusionSpriteColors[c] : emptyColors));
      }

      this.set4iv("spriteColors", flatSpriteColors.flat());
      this.set4iv("fusionSpriteColors", flatFusionSpriteColors.flat());
    }
  }

  onBatch(gameObject: Phaser.GameObjects.GameObject): void {
    if (gameObject) {
      const sprite = (gameObject as Phaser.GameObjects.Sprite);
      const data = sprite.pipelineData;

      const variant: integer = data.hasOwnProperty("variant")
        ? data["variant"]
        : sprite.parentContainer instanceof Pokemon ? sprite.parentContainer.variant
          : 0;
      let variantColors;

      const emptyColors = [ 0, 0, 0, 0 ];
      const flatBaseColors: integer[] = [];
      const flatVariantColors: number[] = [];

      if ((sprite.parentContainer instanceof Pokemon ? sprite.parentContainer.shiny : !!data["shiny"])
                && (variantColors = variantColorCache[sprite.parentContainer instanceof Pokemon ? sprite.parentContainer.getSprite().texture.key : data["spriteKey"]]) && variantColors.hasOwnProperty(variant)) {
        const baseColors = Object.keys(variantColors[variant]);
        for (let c = 0; c < 32; c++) {
          if (c < baseColors.length) {
            const baseColor = Array.from(Object.values(Utils.rgbHexToRgba(baseColors[c])));
            const variantColor = Array.from(Object.values(Utils.rgbHexToRgba(variantColors[variant][baseColors[c]])));
            flatBaseColors.splice(flatBaseColors.length, 0, ...baseColor);
            flatVariantColors.splice(flatVariantColors.length, 0, ...variantColor.map(c => c / 255.0));
          } else {
            flatBaseColors.splice(flatBaseColors.length, 0, ...emptyColors);
            flatVariantColors.splice(flatVariantColors.length, 0, ...emptyColors);
          }
        }
      } else {
        for (let c = 0; c < 32; c++) {
          flatBaseColors.splice(flatBaseColors.length, 0, ...emptyColors);
          flatVariantColors.splice(flatVariantColors.length, 0, ...emptyColors);
        }
      }

      this.set4iv("baseVariantColors", flatBaseColors.flat());
      this.set4fv("variantColors", flatVariantColors.flat());
    }

    super.onBatch(gameObject);
  }

  batchQuad(gameObject: Phaser.GameObjects.GameObject, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number,
    u0: number, v0: number, u1: number, v1: number, tintTL: number, tintTR: number, tintBL: number, tintBR: number, tintEffect: number | boolean,
    texture?: Phaser.Renderer.WebGL.Wrappers.WebGLTextureWrapper, unit?: number): boolean {
    const sprite = gameObject as Phaser.GameObjects.Sprite;

    this.set1f("vCutoff", v1);

    const hasShadow = sprite.pipelineData["hasShadow"] as boolean;
    if (hasShadow) {
      const isEntityObj = sprite.parentContainer instanceof Pokemon || sprite.parentContainer instanceof Trainer;
      const field = isEntityObj ? sprite.parentContainer.parentContainer : sprite.parentContainer;
      const fieldScaleRatio = field.scale / 6;
      const baseY = (isEntityObj
        ? sprite.parentContainer.y
        : sprite.y + sprite.height) * 6 / fieldScaleRatio;
      const bottomPadding = Math.ceil(sprite.height * 0.05) * 6 / fieldScaleRatio;
      const yDelta = (baseY - y1) / field.scale;
      y2 = y1 = baseY + bottomPadding;
      const pixelHeight = (v1 - v0) / (sprite.frame.height * (isEntityObj ? sprite.parentContainer.scale : sprite.scale));
      v1 += (yDelta + bottomPadding / field.scale) * pixelHeight;
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
