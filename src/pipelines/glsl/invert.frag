precision mediump float;

uniform sampler2D uMainSampler;

varying vec2 outTexCoord;

void main()
{
	gl_FragColor = 1.0 - texture2D(uMainSampler, outTexCoord);
}