import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import {
  FieldSpriteBatchHandler,
  type FieldSpriteDrawData,
  type FieldSpriteRenderData,
  FieldSpriteSubmitter,
} from "#app/render-nodes/field-sprite";
import { MysteryEncounterIntroVisuals } from "#field/mystery-encounter-intro";
import { Pokemon } from "#field/pokemon";
import { Trainer } from "#field/trainer";
import { variantColorCache } from "#sprites/variant";
import { rgbHexToRgba } from "#utils/color-utils";
import spriteFragShader from "./glsl/sprite-frag-shader.frag?raw";
import spriteVertShader from "./glsl/sprite-shader.vert?raw";

type RenderNodeManager = Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager;
type WebGLTextureWrapper = Phaser.Renderer.WebGL.Wrappers.WebGLTextureWrapper;

/** Fields that sprites can set in their renderNodeData */
export interface SpriteRenderData extends FieldSpriteRenderData {
  tone?: number[];
  isTerastallized?: boolean;
  teraColor?: number[];
  hasShadow?: boolean;
  yShadowOffset?: number;
  ignoreFieldPos?: boolean;
  ignoreOverride?: boolean;
  spriteColors?: number[][];
  spriteColorsBase?: number[][];
  fusionSpriteColors?: number[][];
  fusionSpriteColorsBase?: number[][];
  variant?: number;
  shiny?: boolean;
  spriteKey?: string;
}

/** Per-Sprite data used for rendering; written by the Submitter and read by the BatchHandler. */
interface SpriteDrawData extends FieldSpriteDrawData {
  tone: number[];
  teraColor: number[];
  hasShadow: boolean;
  yCenter: boolean;
  fieldScale: number;
  relPosition: number[];
  size: number[];
  texSize: number[];
  yOffset: number;
  yShadowOffset: number;
  baseVariantColors: Float32Array;
  variantColors: Float32Array;
  spriteColors: Float32Array;
  fusionSpriteColors: Int32Array;

  // Inputs for the shadow quad stretch
  shadowBaseY: number;
  shadowPadding: number;
  frameHeightScaled: number;
}

// #region Palettes

const PALETTE_SIZE = 32;
const EMPTY_PALETTE_F = new Float32Array(PALETTE_SIZE * 4);
const EMPTY_PALETTE_I = new Int32Array(PALETTE_SIZE * 4);
const ZERO3 = [0, 0, 0];
const ZERO4 = [0, 0, 0, 0];

// Palettes are cached as immutable arrays: a different palette is always a different
// array object, so the same object always means the same contents.
const scaledPaletteCache = new WeakMap<number[][], Float32Array>();
const intPaletteCache = new WeakMap<number[][], Int32Array>();
const variantPaletteCache = new Map<string, { base: Float32Array; variant: Float32Array }>();

/** Convert a list of color values to a 32-element Float32Array */
function toScaledPalette(colors: number[][] | undefined): Float32Array {
  if (!colors?.length) {
    return EMPTY_PALETTE_F;
  }
  let palette = scaledPaletteCache.get(colors);
  if (!palette) {
    palette = new Float32Array(PALETTE_SIZE * 4);
    for (let c = 0; c < Math.min(colors.length, PALETTE_SIZE); c++) {
      for (let i = 0; i < 4; i++) {
        palette[c * 4 + i] = colors[c][i] / 255;
      }
    }
    scaledPaletteCache.set(colors, palette);
  }
  return palette;
}

/** Convert a list of color values to a 32-element Int32Array */
function toIntPalette(colors: number[][] | undefined): Int32Array {
  if (!colors?.length) {
    return EMPTY_PALETTE_I;
  }
  let palette = intPaletteCache.get(colors);
  if (!palette) {
    palette = new Int32Array(PALETTE_SIZE * 4);
    for (let c = 0; c < Math.min(colors.length, PALETTE_SIZE); c++) {
      for (let i = 0; i < 4; i++) {
        palette[c * 4 + i] = colors[c][i];
      }
    }
    intPaletteCache.set(colors, palette);
  }
  return palette;
}

/** Get the base and variant color palettes for a given key and variant */
function getVariantPalettes(key: string | undefined, variant: number) {
  if (!key) {
    return null;
  }
  const variantColors = variantColorCache[key];
  if (!variantColors || !Object.hasOwn(variantColors, variant)) {
    return null;
  }
  const cacheKey = `${key}|${variant}`;
  let entry = variantPaletteCache.get(cacheKey);
  if (!entry) {
    const map = variantColors[variant];
    const baseHexes = Object.keys(map);
    const base = new Float32Array(PALETTE_SIZE * 4);
    const target = new Float32Array(PALETTE_SIZE * 4);
    for (let c = 0; c < Math.min(baseHexes.length, PALETTE_SIZE); c++) {
      const baseColor = Object.values(rgbHexToRgba(baseHexes[c]));
      const variantColor = Object.values(rgbHexToRgba(map[baseHexes[c]]));
      for (let i = 0; i < 4; i++) {
        base[c * 4 + i] = baseColor[i] / 255;
        target[c * 4 + i] = variantColor[i] / 255;
      }
    }
    entry = { base, variant: target };
    variantPaletteCache.set(cacheKey, entry);
  }
  return entry;
}

// #endregion

function computeRelPosition(
  sprite: Phaser.GameObjects.Sprite,
  isEntityObj: boolean,
  field: Phaser.GameObjects.Container | null,
  ignoreFieldPos: boolean,
): number[] {
  const parent = sprite.parentContainer;
  const position = isEntityObj ? [parent.x, parent.y] : [sprite.x, sprite.y];
  const fieldX = field?.x ?? 0;
  const fieldY = field?.y ?? 0;
  if (field) {
    position[0] += field.x / field.scale;
    position[1] += field.y / field.scale;
  }
  position[0] += -(sprite.width - sprite.frame.width) / 2 + sprite.frame.x + (ignoreFieldPos ? 0 : sprite.x - fieldX);
  if (sprite.originY === 0.5) {
    position[1] +=
      (sprite.height / 2) * ((isEntityObj ? parent : sprite).scale - 1) + (ignoreFieldPos ? 0 : sprite.y - fieldY);
  }
  return position;
}

function createSpriteDrawData(): SpriteDrawData {
  return {
    ignoreTimeTint: false,
    terrainColorRatio: 0,
    tone: ZERO4,
    teraColor: ZERO3,
    hasShadow: false,
    yCenter: false,
    fieldScale: 1,
    relPosition: [0, 0],
    size: [0, 0],
    texSize: [0, 0],
    yOffset: 0,
    yShadowOffset: 0,
    baseVariantColors: EMPTY_PALETTE_F,
    variantColors: EMPTY_PALETTE_F,
    spriteColors: EMPTY_PALETTE_F,
    fusionSpriteColors: EMPTY_PALETTE_I,
    shadowBaseY: 0,
    shadowPadding: 0,
    frameHeightScaled: 1,
  };
}

export class SpriteSubmitter extends FieldSpriteSubmitter {
  static override readonly NAME: string = "SpriteSubmitter";

  protected override readonly out: SpriteDrawData = createSpriteDrawData();

  constructor(manager: RenderNodeManager, config?: Phaser.Types.Renderer.WebGL.RenderNodes.SubmitterQuadConfig) {
    super(manager, { name: SpriteSubmitter.NAME, ...config });
  }

  // This method sets the `spriteData` field in render options. See phaser's docs, which says
  // "Resolves and stores render options for the current GameObject into
  // _renderOptions before it is submitted to the batch handler"
  // Unlike the submitter, the batch handler does not have access to the game object,
  // but the batch handler does need to set uniforms.
  // Since our shaders include per-uniform data for the sprite,
  // we need to pass data from the submitter to the batch handler.
  override setRenderOptions(
    gameObject: Phaser.GameObjects.GameObject,
    normalMap?: any,
    normalMapRotation?: number,
  ): void {
    // Field part (ignoreTimeTint, terrainColorRatio), like v3's super.onBind
    super.setRenderOptions(gameObject, normalMap, normalMapRotation);

    const sprite = gameObject as Phaser.GameObjects.Sprite;
    const data = (sprite.renderNodeData[this.name] ?? {}) as SpriteRenderData;
    const out = this.out;

    const parent = sprite.parentContainer;
    const isEntityObj =
      parent instanceof Pokemon || parent instanceof Trainer || parent instanceof MysteryEncounterIntroVisuals;
    const field = (isEntityObj ? parent.parentContainer : parent) ?? null;
    const entityScale = isEntityObj ? parent.scale : sprite.scale;

    out.tone = data.tone ?? ZERO4;
    const tera = data.isTerastallized ? (data.teraColor ?? ZERO3) : ZERO3;
    out.teraColor = [tera[0] / 255, tera[1] / 255, tera[2] / 255];
    out.hasShadow = !!data.hasShadow && field !== null;
    out.yShadowOffset = data.yShadowOffset ?? 0;
    out.yCenter = sprite.originY === 0.5;
    out.fieldScale = field?.scale || 1;
    out.relPosition = computeRelPosition(sprite, isEntityObj, field, !!data.ignoreFieldPos);
    out.size = [sprite.frame.width, sprite.height];
    out.texSize = [sprite.texture.source[0].width, sprite.texture.source[0].height];
    out.yOffset = sprite.height - sprite.frame.height * entityScale;

    if (settings.display.enableFusionPaletteSwaps) {
      const ignoreOverride = !!data.ignoreOverride;
      out.spriteColors = toScaledPalette((ignoreOverride && data.spriteColorsBase) || data.spriteColors);
      out.fusionSpriteColors = toIntPalette((ignoreOverride && data.fusionSpriteColorsBase) || data.fusionSpriteColors);
    } else {
      out.spriteColors = EMPTY_PALETTE_F;
      out.fusionSpriteColors = EMPTY_PALETTE_I;
    }

    // Handle variant palette swaps
    const pokemon = parent instanceof Pokemon ? parent : null;
    const variant = Object.hasOwn(data, "variant") ? (data.variant ?? 0) : (pokemon?.variant ?? 0);
    const shiny = pokemon ? pokemon.shiny : !!data.shiny;
    const variantPalettes = shiny
      ? getVariantPalettes(pokemon ? pokemon.getSprite().texture.key : data.spriteKey, variant)
      : null;
    out.baseVariantColors = variantPalettes?.base ?? EMPTY_PALETTE_F;
    out.variantColors = variantPalettes?.variant ?? EMPTY_PALETTE_F;

    if (out.hasShadow && field) {
      const fieldScaleRatio = field.scale / 6;
      out.shadowBaseY = ((isEntityObj ? parent.y : sprite.y + sprite.height) * 6) / fieldScaleRatio;
      out.shadowPadding = (Math.ceil(sprite.height * 0.05 + Math.max(out.yShadowOffset, 0)) * 6) / fieldScaleRatio;
      out.frameHeightScaled = sprite.frame.height * entityScale;
    }

    (this as any)._renderOptions.spriteData = out;
  }
}

// Argument positions in batch(), matching SubmitterQuad's call. This _must_ be kept in sync with Phaser's code.
const ARG_Y_BL = 5; // bottom-left y
const ARG_Y_BR = 9; // bottom-right y
const ARG_TEX_X = 10;
const ARG_TEX_Y = 11;
const ARG_TEX_H = 13;
/** The index of the render option in Phaser's batch function */
const ARG_RENDER_OPTIONS = 19;

export class SpriteBatchHandler extends FieldSpriteBatchHandler {
  static override readonly NAME: string = "SpriteBatchHandler";

  private sprite: SpriteDrawData = createSpriteDrawData();
  private texFrameUv = [0, 0];
  private vCutoff = 0;
  private vSign = 1;
  private teraTexture: WebGLTextureWrapper | null = null;

  constructor(manager: RenderNodeManager) {
    super(
      manager,
      {
        name: SpriteBatchHandler.NAME,
        shaderName: "PKR_SPRITE_SINGLE",
        vertexSource: spriteVertShader,
        // Unlike in `fieldSprite`, we need to control the entire fragment shader (otherwise phaser's tint handling and kin would differ)
        fragmentSource: spriteFragShader,
        shaderAdditions: [],
      },
      true, // fromChild: skip the field addition
    );
  }

  override batch(...args: Parameters<Phaser.Renderer.WebGL.RenderNodes.BatchHandlerQuadSingle["batch"]>): void {
    // The submitter added a custom field to `renderOptions` so it won't be in the type signature.
    const s = (args[ARG_RENDER_OPTIONS] as any).spriteData as SpriteDrawData;
    this.sprite = s;

    const texH = args[ARG_TEX_H];
    this.texFrameUv = [args[ARG_TEX_X], args[ARG_TEX_Y]]; // top-left UV
    this.vCutoff = args[ARG_TEX_Y] + texH; // bottom edge
    this.vSign = texH < 0 ? -1 : 1; // In v4 texture Y can run either way

    // This updates the y delta to stretch the quad to handle the shadow.
    if (s.hasShadow) {
      const yDelta = (s.shadowBaseY - args[ARG_Y_BL]) / s.fieldScale;
      const bottom = s.shadowBaseY + s.shadowPadding;
      args[ARG_Y_BL] = bottom;
      args[ARG_Y_BR] = bottom;
      args[ARG_TEX_H] = texH + (yDelta + s.shadowPadding / s.fieldScale) * (texH / s.frameHeightScaled);
    }

    super.batch(...args); // field data, then Phaser's batch, which draws immediately
  }

  override batchTextures(glTexture: WebGLTextureWrapper, renderOptions: any): number {
    // Put the tera pattern in texture unit 1 of every batch entry.
    const datum = super.batchTextures(glTexture, renderOptions);
    const tera = this.getTeraTexture();
    const entry = this.currentBatchEntry;
    if (tera && entry.texture[1] !== tera) {
      entry.texture[1] = tera;
      tera.batchUnit = 1;
      entry.unit = Math.max(entry.unit, 2);
    }
    return datum;
  }

  private getTeraTexture(): WebGLTextureWrapper | null {
    if (!this.teraTexture && globalScene.textures.exists("tera")) {
      this.teraTexture = globalScene.textures.get("tera").source[0].glTexture ?? null;
    }
    return this.teraTexture;
  }

  override setupUniforms(drawingContext: Phaser.Renderer.WebGL.DrawingContext): void {
    // Phaser's uniforms + the field globals and ignoreTimeTint.
    // (The terrain uniforms don't exist in this shader; setting them does nothing.)
    super.setupUniforms(drawingContext);

    const pm = this.programManager;
    const s = this.sprite;

    pm.setUniform("tintModeFill", Phaser.TintModes.FILL);
    pm.setUniform("teraTime", (globalScene.game.getTime() % 500000) / 500000);
    pm.setUniform("teraColor", s.teraColor);
    pm.setUniform("hasShadow", s.hasShadow);
    pm.setUniform("yCenter", s.yCenter);
    pm.setUniform("fieldScale", s.fieldScale);
    pm.setUniform("relPosition", s.relPosition);
    pm.setUniform("texFrameUv", this.texFrameUv);
    pm.setUniform("size", s.size);
    pm.setUniform("texSize", s.texSize);
    pm.setUniform("yOffset", s.yOffset);
    pm.setUniform("yShadowOffset", s.yShadowOffset);
    pm.setUniform("vCutoff", this.vCutoff);
    pm.setUniform("vSign", this.vSign);
    pm.setUniform("tone", s.tone);
    pm.setUniform("baseVariantColors[0]", s.baseVariantColors);
    pm.setUniform("variantColors[0]", s.variantColors);
    pm.setUniform("spriteColors[0]", s.spriteColors);
    pm.setUniform("fusionSpriteColors[0]", s.fusionSpriteColors);
  }
}
