import { globalScene } from "#app/global-scene";
import { pokemonPrevolutions } from "#balance/pokemon-evolutions";
import type { SpeciesId } from "#enums/species-id";
import { RibbonData, type RibbonFlag } from "#system/ribbons/ribbon-data";

/**
 * Award one or more ribbons to a species and its pre-evolutions
 *
 * @param id - The ID of the species to award ribbons to
 * @param ribbons - The ribbon(s) to award (use bitwise OR to combine multiple)
 */
export function awardRibbonsToSpeciesLine(id: SpeciesId, ribbons: RibbonFlag): void {
  const dexData = globalScene.gameData.dexData;
  dexData[id].ribbons.award(ribbons);
  // Mark all pre-evolutions of the Pokémon with the same ribbon flags.
  for (let prevoId = pokemonPrevolutions[id]; prevoId != null; prevoId = pokemonPrevolutions[prevoId]) {
    dexData[prevoId].ribbons.award(ribbons);
  }
}

export function ribbonFlagToAssetKey(flag: RibbonFlag): Phaser.GameObjects.Sprite | Phaser.GameObjects.Image {
  let imageKey: string;
  switch (flag) {
    // biome-ignore-start lint/suspicious/noFallthroughSwitchClause: intentional
    case RibbonData.MONO_GEN_1:
      imageKey = "ribbon_gen1";
    case RibbonData.MONO_GEN_2:
      imageKey ??= "ribbon_gen2";
    case RibbonData.MONO_GEN_3:
      imageKey ??= "ribbon_gen3";
    case RibbonData.MONO_GEN_4:
      imageKey ??= "ribbon_gen4";
    case RibbonData.MONO_GEN_5:
      imageKey ??= "ribbon_gen5";
    case RibbonData.MONO_GEN_6:
      imageKey ??= "ribbon_gen6";
    case RibbonData.MONO_GEN_7:
      imageKey ??= "ribbon_gen7";
    case RibbonData.MONO_GEN_8:
      imageKey ??= "ribbon_gen8";
    case RibbonData.MONO_GEN_9:
      imageKey ??= "ribbon_gen9";
      return globalScene.add.image(0, 0, "items", imageKey).setDisplaySize(16, 16);
    // biome-ignore-end lint/suspicious/noFallthroughSwitchClause: done with fallthrough
    // Ribbons that don't use the items atlas
    // biome-ignore-start lint/suspicious/noFallthroughSwitchClause: Another fallthrough block
    case RibbonData.NUZLOCKE:
      imageKey = "champion_ribbon_emerald";
    default:
      imageKey ??= "champion_ribbon";
      {
        const img = globalScene.add.image(0, 0, imageKey);
        const target = 12;
        const scale = Math.min(target / img.width, target / img.height);
        return img.setScale(scale);
      }
    // biome-ignore-end lint/suspicious/noFallthroughSwitchClause: End fallthrough block
  }
}
