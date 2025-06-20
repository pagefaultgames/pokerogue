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
uniform float yShadowOffset;
uniform vec4 tone;
uniform vec4 baseVariantColors[32];
uniform vec4 variantColors[32];
uniform vec4 spriteColors[32];
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

	for (int i = 0; i < 32; i++) {
		if (baseVariantColors[i].a == 0.0)
			break;
		if (texture.a > 0.0 && all(lessThan(abs(texture.rgb - baseVariantColors[i].rgb), vec3(0.5/255.0)))) {
			texture.rgb = variantColors[i].rgb;
			break;
		}
	}

	for (int i = 0; i < 32; i++) {
		if (spriteColors[i][3] == 0.0)
			break;
		if (texture.a > 0.0 && all(lessThan(abs(texture.rgb - spriteColors[i].rgb), vec3(0.5/255.0)))) {
			vec3 fusionColor = vec3(fusionSpriteColors[i].rgb) / 255.0;
			vec3 bg = spriteColors[i].rgb;
			float gray = (bg.r + bg.g + bg.b) / 3.0;
			bg = vec3(gray);
			vec3 fg = fusionColor;
			texture.rgb = mix(1.0 - 2.0 * (1.0 - bg) * (1.0 - fg), 2.0 * bg * fg, step(bg, vec3(0.5)));
			break;
		}
	}

	vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);

	//  Multiply texture tint
	vec4 color = texture * texel;

	if (color.a > 0.0 && teraColor.r > 0.0 && teraColor.g > 0.0 && teraColor.b > 0.0) {
		vec2 relUv = (outTexCoord.xy - texFrameUv.xy) / (size.xy / texSize.xy);
		vec2 teraTexCoord = vec2(relUv.x * (size.x / 200.0), relUv.y * (size.y / 120.0));
		vec4 teraCol = texture2D(uMainSampler[1], teraTexCoord);
		float floorValue = 86.0 / 255.0;
		vec3 teraPatternHsv = rgb2hsv(teraCol.rgb);
		teraCol.rgb = hsv2rgb(vec3((teraPatternHsv.b - floorValue) * 4.0 + teraTexCoord.x * fieldScale / 2.0 + teraTexCoord.y * fieldScale / 2.0 + teraTime * 255.0, teraPatternHsv.b, teraPatternHsv.b));

		color.rgb = mix(color.rgb, blendHue(color.rgb, teraColor), 0.625);
		teraCol.rgb = mix(teraCol.rgb, teraColor, 0.5);
		color.rgb = blendOverlay(color.rgb, teraCol.rgb);

		if (any(lessThan(teraCol.rgb, vec3(1.0)))) {
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
		float spriteY = ((floor(outPosition.y / fieldScale) - relPosition.y - yShadowOffset) / size.y);

		if (yCenter == 1) {
			spriteY += 0.5;
		} else {
			spriteY += 1.0;
		}

		bool yOverflow = outTexCoord.y >= vCutoff;

		if ((spriteY >= 0.9 && (color.a == 0.0 || yOverflow))) {
			float shadowSpriteY = (spriteY - 0.9) * (1.0 / 0.15);
			if (distance(vec2(spriteX, shadowSpriteY), vec2(0.5)) < 0.5) {
				color = vec4(vec3(0.0), 0.5);
			} else if (yOverflow) {
				discard;
			}
		} else if (yOverflow) {
			discard;
		}
	}

	gl_FragColor = color;
}