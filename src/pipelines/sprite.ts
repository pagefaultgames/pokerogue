import { globalScene } from "#app/global-scene";
import { FieldSpritePipeline } from "#app/pipelines/field-sprite";
import { MysteryEncounterIntroVisuals } from "#field/mystery-encounter-intro";
import { Pokemon } from "#field/pokemon";
import { Trainer } from "#field/trainer";
import { variantColorCache } from "#sprites/variant";
import { rgbHexToRgba } from "#utils/common";
import spriteFragShader from "./glsl/sprite-frag-shader.frag?raw";
import spriteVertShader from "./glsl/sprite-shader.vert?raw";

export class SpritePipeline extends FieldSpritePipeline {
  private _tone: number[];

  constructor(game: Phaser.Game) {
    super(game, {
      game,
      name: "sprite",
      fragShader: spriteFragShader,
      vertShader: spriteVertShader,
    });

    this._tone = [0, 0, 0, 0];
  }

  onPreRender(): void {
    super.onPreRender();

    this.set1f("teraTime", 0);
    this.set3fv("teraColor", [0, 0, 0]);
    this.set1i("hasShadow", 0);
    this.set1i("yCenter", 0);
    this.set2f("relPosition", 0, 0);
    this.set2f("texFrameUv", 0, 0);
    this.set2f("size", 0, 0);
    this.set2f("texSize", 0, 0);
    this.set1f("yOffset", 0);
    this.set1f("yShadowOffset", 0);
    this.set4fv("tone", this._tone);
  }

  onBind(gameObject: Phaser.GameObjects.GameObject): void {
    super.onBind(gameObject);

    const sprite = gameObject as Phaser.GameObjects.Sprite;

    const data = sprite.pipelineData;
    const tone = data["tone"] as number[];
    const teraColor = (data["isTerastallized"] as boolean) ? ((data["teraColor"] as number[]) ?? [0, 0, 0]) : [0, 0, 0];
    const hasShadow = data["hasShadow"] as boolean;
    const yShadowOffset = data["yShadowOffset"] as number;
    const ignoreFieldPos = data["ignoreFieldPos"] as boolean;
    const ignoreOverride = data["ignoreOverride"] as boolean;

    const isEntityObj =
      sprite.parentContainer instanceof Pokemon
      || sprite.parentContainer instanceof Trainer
      || sprite.parentContainer instanceof MysteryEncounterIntroVisuals;
    const field = isEntityObj ? sprite.parentContainer.parentContainer : sprite.parentContainer;
    const position = isEntityObj ? [sprite.parentContainer.x, sprite.parentContainer.y] : [sprite.x, sprite.y];
    if (field) {
      position[0] += field.x / field.scale;
      position[1] += field.y / field.scale;
    }
    position[0] +=
      -(sprite.width - sprite.frame.width) / 2 + sprite.frame.x + (!ignoreFieldPos ? sprite.x - field.x : 0);
    if (sprite.originY === 0.5) {
      position[1] +=
        (sprite.height / 2) * ((isEntityObj ? sprite.parentContainer : sprite).scale - 1)
        + (!ignoreFieldPos ? sprite.y - field.y : 0);
    }
    this.set1f("teraTime", (this.game.getTime() % 500000) / 500000);
    this.set3fv(
      "teraColor",
      teraColor.map(c => c / 255),
    );
    this.set1i("hasShadow", hasShadow ? 1 : 0);
    this.set1i("yCenter", sprite.originY === 0.5 ? 1 : 0);
    this.set1f("fieldScale", field?.scale || 1);
    this.set2f("relPosition", position[0], position[1]);
    this.set2f("texFrameUv", sprite.frame.u0, sprite.frame.v0);
    this.set2f("size", sprite.frame.width, sprite.height);
    this.set2f("texSize", sprite.texture.source[0].width, sprite.texture.source[0].height);
    this.set1f(
      "yOffset",
      sprite.height - sprite.frame.height * (isEntityObj ? sprite.parentContainer.scale : sprite.scale),
    );
    this.set1f("yShadowOffset", yShadowOffset ?? 0);
    this.set4fv("tone", tone);
    this.bindTexture(this.game.textures.get("tera").source[0].glTexture!, 1); // TODO: is this bang correct?

    if (globalScene.fusionPaletteSwaps) {
      const spriteColors = ((ignoreOverride && data["spriteColorsBase"]) || data["spriteColors"] || []) as number[][];
      const fusionSpriteColors = ((ignoreOverride && data["fusionSpriteColorsBase"])
        || data["fusionSpriteColors"]
        || []) as number[][];

      const emptyColors = [0, 0, 0, 0];
      const flatSpriteColors: number[] = [];
      const flatFusionSpriteColors: number[] = [];
      for (let c = 0; c < 32; c++) {
        flatSpriteColors.splice(
          flatSpriteColors.length,
          0,
          ...(c < spriteColors.length ? spriteColors[c].map(x => x / 255.0) : emptyColors),
        );
        flatFusionSpriteColors.splice(
          flatFusionSpriteColors.length,
          0,
          ...(c < fusionSpriteColors.length ? fusionSpriteColors[c] : emptyColors),
        );
      }

      this.set4fv("spriteColors", flatSpriteColors.flat());
      this.set4iv("fusionSpriteColors", flatFusionSpriteColors.flat());
    }
  }

  onBatch(gameObject: Phaser.GameObjects.GameObject): void {
    if (gameObject) {
      const sprite = gameObject as Phaser.GameObjects.Sprite;
      const data = sprite.pipelineData;

      const variant: number = data.hasOwnProperty("variant")
        ? data["variant"]
        : sprite.parentContainer instanceof Pokemon
          ? sprite.parentContainer.variant
          : 0;
      let variantColors: { [x: string]: string }[];

      const emptyColors = [0, 0, 0, 0];
      const flatBaseColors: number[] = [];
      const flatVariantColors: number[] = [];

      if (
        (sprite.parentContainer instanceof Pokemon ? sprite.parentContainer.shiny : !!data["shiny"])
        && (variantColors =
          variantColorCache[
            sprite.parentContainer instanceof Pokemon
              ? sprite.parentContainer.getSprite().texture.key
              : data["spriteKey"]
          ])
        && variantColors.hasOwnProperty(variant)
      ) {
        const baseColors = Object.keys(variantColors[variant]);
        for (let c = 0; c < 32; c++) {
          if (c < baseColors.length) {
            const baseColor = Array.from(Object.values(rgbHexToRgba(baseColors[c])));
            const variantColor = Array.from(Object.values(rgbHexToRgba(variantColors[variant][baseColors[c]])));
            flatBaseColors.splice(flatBaseColors.length, 0, ...baseColor.map(c => c / 255.0));
            flatVariantColors.splice(flatVariantColors.length, 0, ...variantColor.map(c => c / 255.0));
          } else {
            flatBaseColors.splice(flatBaseColors.length, 0, ...emptyColors);
            flatVariantColors.splice(flatVariantColors.length, 0, ...emptyColors);
          }
        }
      } else {
        for (let c = 0; c < 32; c++) {
          flatBaseColors.splice(flatBaseColors.length, 0, ...emptyColors);
          flatVariantColors.splice(flatVariantColors.length, 0, ...emptyColors);
        }
      }

      this.set4fv("baseVariantColors", flatBaseColors.flat());
      this.set4fv("variantColors", flatVariantColors.flat());
    }

    super.onBatch(gameObject);
  }

  batchQuad(
    gameObject: Phaser.GameObjects.GameObject,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    u0: number,
    v0: number,
    u1: number,
    v1: number,
    tintTL: number,
    tintTR: number,
    tintBL: number,
    tintBR: number,
    tintEffect: number | boolean,
    texture?: Phaser.Renderer.WebGL.Wrappers.WebGLTextureWrapper,
    unit?: number,
  ): boolean {
    const sprite = gameObject as Phaser.GameObjects.Sprite;

    this.set1f("vCutoff", v1);

    const hasShadow = sprite.pipelineData["hasShadow"] as boolean;
    const yShadowOffset = (sprite.pipelineData["yShadowOffset"] as number) ?? 0;
    if (hasShadow) {
      const isEntityObj =
        sprite.parentContainer instanceof Pokemon
        || sprite.parentContainer instanceof Trainer
        || sprite.parentContainer instanceof MysteryEncounterIntroVisuals;
      const field = isEntityObj ? sprite.parentContainer.parentContainer : sprite.parentContainer;
      const fieldScaleRatio = field.scale / 6;
      const baseY = ((isEntityObj ? sprite.parentContainer.y : sprite.y + sprite.height) * 6) / fieldScaleRatio;
      const bottomPadding = (Math.ceil(sprite.height * 0.05 + Math.max(yShadowOffset, 0)) * 6) / fieldScaleRatio;
      const yDelta = (baseY - y1) / field.scale;
      y2 = y1 = baseY + bottomPadding;
      const pixelHeight =
        (v1 - v0) / (sprite.frame.height * (isEntityObj ? sprite.parentContainer.scale : sprite.scale));
      v1 += (yDelta + bottomPadding / field.scale) * pixelHeight;
    }

    return super.batchQuad(
      gameObject,
      x0,
      y0,
      x1,
      y1,
      x2,
      y2,
      x3,
      y3,
      u0,
      v0,
      u1,
      v1,
      tintTL,
      tintTR,
      tintBL,
      tintBR,
      tintEffect,
      texture,
      unit,
    );
  }

  get tone(): number[] {
    return this._tone;
  }

  set tone(value: number[]) {
    this._tone = value;
  }
}
