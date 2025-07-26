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