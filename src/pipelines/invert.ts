import { Game } from "phaser";

const fragShader = `
precision mediump float;

uniform sampler2D uMainSampler;

varying vec2 outTexCoord;

void main()
{
    gl_FragColor = 1.0 - texture2D(uMainSampler, outTexCoord);
}
`;

export default class InvertPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor (game: Game) {
    super({
      game,
      name: "InvertPostFX",
      fragShader,
      uniforms: [
        "uMainSampler"
      ]
    } as Phaser.Types.Renderer.WebGL.WebGLPipelineConfig);
  }
}
