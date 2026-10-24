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

/** The index of the render option in Phaser's batch function */
const ARG_RENDER_OPTIONS = 19;

export class FieldSpriteSubmitter extends Phaser.Renderer.WebGL.RenderNodes.SubmitterQuad {
  // This field exists because the same string needs to be used by both the name
  // field in the constructor and the first parameter to `addNode` (battle-scene.ts).
  // This way, there is one source of truth instead of two.
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
    // _renderOptions exists but is "hidden", so we have the cast to any to avoid a TS error.
    // Setting fieldSprite in _renderOptions prevents us having to override the call to `batch` simply
    // to pass the data to the batch handler.
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
          fragmentHeader: fieldSpriteHeader,
          fragmentProcess: fieldSpriteProcess,
        },
      });
    }
  }

  override batch(...args: Parameters<Phaser.Renderer.WebGL.RenderNodes.BatchHandlerQuadSingle["batch"]>): void {
    // Using type statement for better formatting
    type RenderOptions = Phaser.Types.Renderer.WebGL.RenderNodes.BatchHandlerQuadRenderOptions & {
      fieldSprite?: FieldSpriteDrawData;
    };
    // Cast is safe as we set fieldSprite in the submitter's setRenderOptions, which is always called before this batch call.
    this.current = (args[ARG_RENDER_OPTIONS] as RenderOptions).fieldSprite! ?? this.current; // renderOptions is argument 19
    super.batch(...args); // draws immediately, since instancesPerBatch is 1
  }

  override setupUniforms(drawingContext: Phaser.Renderer.WebGL.DrawingContext): void {
    super.setupUniforms(drawingContext);
    const pm = this.programManager;
    const arena = globalScene.arena;

    // Per object
    pm.setUniform("ignoreTimeTint", this.current.ignoreTimeTint);
    pm.setUniform("terrainColorRatio", this.current.terrainColorRatio);

    // Global
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
