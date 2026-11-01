/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 * SPDX-FileContributor: FlashfyreDev
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
#pragma phaserTemplate(shaderName)
#pragma phaserTemplate(extensions)
#pragma phaserTemplate(features)
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#pragma phaserTemplate(vertexDefine)
uniform mat4 uProjectionMatrix;
uniform vec2 uResolution;
attribute vec2 inPosition;
attribute vec2 inTexCoord;
attribute float inTexDatum;
attribute vec4 inTintEffect;
attribute vec4 inTint;
varying vec2 outTexCoord;
varying float outTexDatum;
varying vec4 outTintEffect;
varying vec4 outTint;
varying vec2 outPosition;
#pragma phaserTemplate(outVariables)
#pragma phaserTemplate(vertexHeader)
void main ()
{
    gl_Position = uProjectionMatrix * vec4(inPosition, 1.0, 1.0);
    outTexCoord = inTexCoord;
    outTexDatum = inTexDatum;
    outTint = inTint;
    outTintEffect = inTintEffect * vec4(1.0, 1.0, 1.0, 255.0);
    outPosition = inPosition; // Custom
}