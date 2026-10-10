/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 * SPDX-FileContributor: FlashfyreDev
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Runs after Phaser's texture sampling and tint, on `fragColor`.

/* Apply day/night tint */
if (fragColor.a > 0.0 && !ignoreTimeTint) {
	vec3 dayNightTint;

	if (any(lessThan(vec3(0.0), overrideTint))) {
		dayNightTint = overrideTint;
	} else if (time < 0.25) {
		dayNightTint = dayTint;
	} else if (!isOutside && time < 0.5) {
		dayNightTint = mix(dayTint, nightTint, (time - 0.25) / 0.25);
	} else if (time < 0.375) {
		dayNightTint = mix(dayTint, duskTint, (time - 0.25) / 0.125);
	} else if (time < 0.5) {
		dayNightTint = mix(duskTint, nightTint, (time - 0.375) / 0.125);
	} else if (time < 0.75) {
		dayNightTint = nightTint;
	} else if (!isOutside) {
		dayNightTint = mix(nightTint, dayTint, (time - 0.75) / 0.25);
	} else if (time < 0.875) {
		dayNightTint = mix(nightTint, duskTint, (time - 0.75) / 0.125);
	} else {
		dayNightTint = mix(duskTint, dayTint, (time - 0.875) / 0.125);
	}

	fragColor.rgb = pkrBlendHardLight(fragColor.rgb, dayNightTint);
}

/* Apply terrain color to the bottom of the sprite */
// v3 checked `(1.0 - terrainColorRatio) < outTexCoord.y`; v4 texture Y is flipped,
// so the bottom of the image is the low end of v.
if (
	terrainColorRatio > 0.0
	&& outTexCoord.y < terrainColorRatio
	&& fragColor.a > 0.0
	&& any(lessThan(vec3(0.0), terrainColor))
) {
	fragColor.rgb = pkrBlendHue(fragColor.rgb, terrainColor);
}