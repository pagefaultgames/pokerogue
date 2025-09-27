import { globalScene } from "#app/global-scene";
import { getTerrainColor, TerrainType } from "#data/terrain";
import { getCurrentTime } from "#utils/common";
import Phaser from "phaser";
import fieldSpriteFragShader from "./glsl/field-sprite-frag-shader.frag?raw";
import spriteVertShader from "./glsl/sprite-shader.vert?raw";

export class FieldSpritePipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline {
  constructor(game: Phaser.Game, config?: Phaser.Types.Renderer.WebGL.WebGLPipelineConfig) {
    super(
      config || {
        game,
        name: "field-sprite",
        fragShader: fieldSpriteFragShader,
        vertShader: spriteVertShader,
      },
    );
  }

  onPreRender(): void {
    this.set1f("time", 0);
    this.set1i("ignoreTimeTint", 0);
    this.set1f("terrainColorRatio", 0);
    this.set3fv("terrainColor", [0, 0, 0]);
  }

  onBind(gameObject: Phaser.GameObjects.GameObject): void {
    super.onBind();

    const sprite = gameObject as Phaser.GameObjects.Sprite | Phaser.GameObjects.NineSlice;

    const data = sprite.pipelineData;
    const ignoreTimeTint = data["ignoreTimeTint"] as boolean;
    const terrainColorRatio = (data["terrainColorRatio"] as number) || 0;

    const time = globalScene.currentBattle?.waveIndex
      ? ((globalScene.currentBattle.waveIndex + globalScene.waveCycleOffset) % 40) / 40 // ((new Date().getSeconds() * 1000 + new Date().getMilliseconds()) % 10000) / 10000
      : getCurrentTime();
    this.set1f("time", time);
    this.set1i("ignoreTimeTint", ignoreTimeTint ? 1 : 0);
    this.set1i("isOutside", globalScene.arena.isOutside() ? 1 : 0);
    this.set3fv(
      "dayTint",
      globalScene.arena.getDayTint().map(c => c / 255),
    );
    this.set3fv(
      "duskTint",
      globalScene.arena.getDuskTint().map(c => c / 255),
    );
    this.set3fv(
      "nightTint",
      globalScene.arena.getNightTint().map(c => c / 255),
    );
    this.set3fv(
      "terrainColor",
      getTerrainColor(globalScene.arena.terrain?.terrainType || TerrainType.NONE).map(c => c / 255),
    );
    this.set1f("terrainColorRatio", terrainColorRatio);
  }

  onBatch(gameObject: Phaser.GameObjects.GameObject): void {
    if (gameObject) {
      this.flush();
    }
  }
}
