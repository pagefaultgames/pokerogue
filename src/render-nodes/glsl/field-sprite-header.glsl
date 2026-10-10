/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 * SPDX-FileContributor: FlashfyreDev
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

uniform float time;
uniform bool ignoreTimeTint;
uniform bool isOutside;
uniform vec3 overrideTint;
uniform vec3 dayTint;
uniform vec3 duskTint;
uniform vec3 nightTint;
uniform vec3 terrainColor;
uniform float terrainColorRatio;

float pkrBlendOverlay(float base, float blend) {
	return base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
}

vec3 pkrBlendOverlay(vec3 base, vec3 blend) {
	return vec3(pkrBlendOverlay(base.r, blend.r), pkrBlendOverlay(base.g, blend.g), pkrBlendOverlay(base.b, blend.b));
}

vec3 pkrBlendHardLight(vec3 base, vec3 blend) {
	return pkrBlendOverlay(blend, base);
}

float pkrHue2rgb(float f1, float f2, float hue) {
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

vec3 pkrRgb2hsl(vec3 color) {
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

		if (color.r == fmax)
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

vec3 pkrHsl2rgb(vec3 hsl) {
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

		rgb.r = pkrHue2rgb(f1, f2, hsl.x + (1.0 / 3.0));
		rgb.g = pkrHue2rgb(f1, f2, hsl.x);
		rgb.b = pkrHue2rgb(f1, f2, hsl.x - (1.0 / 3.0));
	}

	return rgb;
}

vec3 pkrBlendHue(vec3 base, vec3 blend) {
	vec3 baseHSL = pkrRgb2hsl(base);
	return pkrHsl2rgb(vec3(pkrRgb2hsl(blend).r, baseHSL.g, baseHSL.b));
}