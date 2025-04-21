import type { Game } from "phaser";
import fragShader from "./glsl/invert.frag?raw";

export default class InvertPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Game) {
    super({
      game,
      name: "InvertPostFX",
      fragShader,
      uniforms: ["uMainSampler"],
    } as Phaser.Types.Renderer.WebGL.WebGLPipelineConfig);
  }
}
