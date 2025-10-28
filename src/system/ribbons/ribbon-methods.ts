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
    case RibbonData.CLASSIC:
      imageKey ??= "classic_ribbon_default";
    case RibbonData.FRIENDSHIP:
      imageKey ??= "ribbon_friendship";
    case RibbonData.MONO_GEN_1:
      imageKey ??= "ribbon_gen1";
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
    case RibbonData.MONO_NORMAL:
      imageKey ??= "ribbon_normal";
    case RibbonData.MONO_FIGHTING:
      imageKey ??= "ribbon_fighting";
    case RibbonData.MONO_FLYING:
      imageKey ??= "ribbon_flying";
    case RibbonData.MONO_POISON:
      imageKey ??= "ribbon_poison";
    case RibbonData.MONO_GROUND:
      imageKey ??= "ribbon_ground";
    case RibbonData.MONO_ROCK:
      imageKey ??= "ribbon_rock";
    case RibbonData.MONO_BUG:
      imageKey ??= "ribbon_bug";
    case RibbonData.MONO_GHOST:
      imageKey ??= "ribbon_ghost";
    case RibbonData.MONO_STEEL:
      imageKey ??= "ribbon_steel";
    case RibbonData.MONO_FIRE:
      imageKey ??= "ribbon_fire";
    case RibbonData.MONO_WATER:
      imageKey ??= "ribbon_water";
    case RibbonData.MONO_GRASS:
      imageKey ??= "ribbon_grass";
    case RibbonData.MONO_ELECTRIC:
      imageKey ??= "ribbon_electric";
    case RibbonData.MONO_PSYCHIC:
      imageKey ??= "ribbon_psychic";
    case RibbonData.MONO_ICE:
      imageKey ??= "ribbon_ice";
    case RibbonData.MONO_DRAGON:
      imageKey ??= "ribbon_dragon";
    case RibbonData.MONO_DARK:
      imageKey ??= "ribbon_dark";
    case RibbonData.MONO_FAIRY:
      imageKey ??= "ribbon_fairy";
    default:
      imageKey ??= "ribbon_typeless";
      return globalScene.add.image(0, 0, "items", imageKey).setDisplaySize(16, 16);
    // biome-ignore-end lint/suspicious/noFallthroughSwitchClause: done with fallthrough
  }
}
