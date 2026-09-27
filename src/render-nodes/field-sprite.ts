import { globalScene } from "#app/global-scene";
import { activeOverrides } from "#app/overrides";
import { getTerrainColor } from "#data/terrain";
import { TimeOfDay } from "#enums/time-of-day";
import type { RGBArray } from "#types/sprite-types";
import { getCurrentTime } from "#utils/common";
import Phaser from "phaser";
import fieldSpriteHeader from "./glsl/field-sprite-header.glsl?raw";
import fieldSpriteProcess from "./glsl/field-sprite-process.glsl?raw";

const toUnit = (rgb: RGBArray): number[] => rgb.map(c => c / 255);
export interface FieldSpriteRenderData {
  ignoreTimeTint?: boolean;
  terrainColorRatio?: number;
}

export type FieldSpriteDrawData = Required<FieldSpriteRenderData>;

export class FieldSpriteSubmitter extends Phaser.Renderer.WebGL.RenderNodes.SubmitterQuad {
  static readonly NAME: string = "FieldSpriteSubmitter";

  protected readonly out: FieldSpriteDrawData = { ignoreTimeTint: false, terrainColorRatio: 0 };

  constructor(
    manager: Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager,
    config?: Phaser.Types.Renderer.WebGL.RenderNodes.SubmitterQuadConfig,
  ) {
    super(manager, { name: FieldSpriteSubmitter.NAME, ...config });
  }
  override setRenderOptions(
    gameObject: Phaser.GameObjects.GameObject,
    normalMap?: any,
    normalMapRotation?: number,
  ): void {
    super.setRenderOptions(gameObject, normalMap, normalMapRotation);
    // Port of the per-object part of v3 onBind
    const data = (gameObject as Phaser.GameObjects.Sprite).renderNodeData[this.name] as
      | FieldSpriteRenderData
      | undefined;
    this.out.ignoreTimeTint = !!data?.ignoreTimeTint;
    this.out.terrainColorRatio = data?.terrainColorRatio ?? 0;
    (this as any)._renderOptions.fieldSprite = this.out;
  }
}

export class FieldSpriteBatchHandler extends Phaser.Renderer.WebGL.RenderNodes.BatchHandlerQuadSingle {
  static readonly NAME: string = "FieldSpriteBatchHandler";

  private current: FieldSpriteDrawData = { ignoreTimeTint: false, terrainColorRatio: 0 };

  constructor(
    manager: Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager,
    config?: Phaser.Types.Renderer.WebGL.RenderNodes.BatchHandlerConfig,
    fromChild = false,
  ) {
    super(manager, {
      name: FieldSpriteBatchHandler.NAME,
      shaderName: "PKR_FIELD_SPRITE_SINGLE",
      instancesPerBatch: 1,
      ...config,
    });
    if (!fromChild) {
      this.programManager.addAddition({
        name: "FieldSpriteEffects",
        additions: {
          fragmentHeader: fieldSpriteHeader, // uniforms + helper functions
          fragmentProcess: fieldSpriteProcess, // day/night + terrain, applied to fragColor
        },
      });
    }
  }

  // biome-ignore lint/complexity/useMaxParams: mirrors Phaser's signature
  override batch(...args: Parameters<Phaser.Renderer.WebGL.RenderNodes.BatchHandlerQuadSingle["batch"]>): void {
    this.current = args[19].fieldSprite! ?? this.current; // renderOptions is argument 19
    super.batch(...args); // draws immediately, since instancesPerBatch is 1
  }

  override setupUniforms(drawingContext: Phaser.Renderer.WebGL.DrawingContext): void {
    super.setupUniforms(drawingContext); // projection matrix and resolution
    const pm = this.programManager;
    const arena = globalScene.arena;

    // Per object (v3 onBind, the pipelineData part)
    pm.setUniform("ignoreTimeTint", this.current.ignoreTimeTint);
    pm.setUniform("terrainColorRatio", this.current.terrainColorRatio);

    // Global (v3 onBind, the rest)
    const time = globalScene.currentBattle?.waveIndex
      ? ((globalScene.currentBattle.waveIndex + globalScene.waveCycleOffset) % 40) / 40
      : getCurrentTime();
    pm.setUniform("time", time);
    pm.setUniform("isOutside", arena?.isOutside() ?? false);
    pm.setUniform("overrideTint", toUnit(overrideTint()));
    pm.setUniform("dayTint", toUnit(arena.getDayTint()));
    pm.setUniform("duskTint", toUnit(arena.getDuskTint()));
    pm.setUniform("nightTint", toUnit(arena.getNightTint()));
    pm.setUniform("terrainColor", toUnit(getTerrainColor(arena.terrainType)));
  }
}

/**
 * Override the current arena tint based on the Time of day override
 * @returns The overriden tint colors as an RGB array.
 */
function overrideTint(): RGBArray {
  switch (activeOverrides.TIME_OF_DAY_OVERRIDE) {
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
