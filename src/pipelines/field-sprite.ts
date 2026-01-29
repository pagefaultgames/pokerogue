import { globalScene } from "#app/global-scene";
import Overrides from "#app/overrides";
import { getTerrainColor } from "#data/terrain";
import { TimeOfDay } from "#enums/time-of-day";
import type { RGBArray } from "#types/sprite-types";
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
    this.set1f("time", 0)
      .setBoolean("ignoreTimeTint", false)
      .set1f("terrainColorRatio", 0)
      .set3fv("terrainColor", [0, 0, 0]);
  }

  onBind(gameObject: Phaser.GameObjects.GameObject): void {
    super.onBind();

    const sprite = gameObject as Phaser.GameObjects.Sprite | Phaser.GameObjects.NineSlice;

    const data = sprite.pipelineData;
    const ignoreTimeTint = !!data["ignoreTimeTint"];
    const terrainColorRatio = (data["terrainColorRatio"] as number) ?? 0;

    const time = globalScene.currentBattle?.waveIndex
      ? ((globalScene.currentBattle.waveIndex + globalScene.waveCycleOffset) % 40) / 40 // ((new Date().getSeconds() * 1000 + new Date().getMilliseconds()) % 10000) / 10000
      : getCurrentTime();

    this.set1f("time", time)
      .setBoolean("ignoreTimeTint", ignoreTimeTint)
      .setBoolean("isOutside", globalScene.arena.isOutside())
      .set3fv(
        "overrideTint",
        overrideTint().map(c => c / 255),
      )
      .set3fv(
        "dayTint",
        globalScene.arena.getDayTint().map(c => c / 255),
      )
      .set3fv(
        "duskTint",
        globalScene.arena.getDuskTint().map(c => c / 255),
      )
      .set3fv(
        "nightTint",
        globalScene.arena.getNightTint().map(c => c / 255),
      )
      .set3fv(
        "terrainColor",
        getTerrainColor(globalScene.arena.getTerrainType()).map(c => c / 255),
      )
      .set1f("terrainColorRatio", terrainColorRatio);
  }

  onBatch(gameObject: Phaser.GameObjects.GameObject): void {
    if (gameObject) {
      this.flush();
    }
  }
}

/**
 * Override the current arena tint based on the Time of day override
 * @returns The overriden tint colors as an RGB array.
 */
function overrideTint(): RGBArray {
  switch (Overrides.TIME_OF_DAY_OVERRIDE) {
    case TimeOfDay.DAY:
    case TimeOfDay.DAWN:
      return globalScene.arena.getDayTint();
    case TimeOfDay.DUSK:
      return globalScene.arena.getDuskTint();
    case TimeOfDay.NIGHT:
      return globalScene.arena.getNightTint();
    default:
      return [0, 0, 0];
  }
}
