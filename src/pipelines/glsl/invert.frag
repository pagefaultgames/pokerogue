/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 * SPDX-FileContributor: FlashfyreDev
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

precision mediump float;

uniform sampler2D uMainSampler;

varying vec2 outTexCoord;

void main()
{
	gl_FragColor = 1.0 - texture2D(uMainSampler, outTexCoord);
}