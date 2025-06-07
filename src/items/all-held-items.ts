import { getEnumValues } from "#app/utils/common";
import { BerryType } from "#enums/berry-type";
import { HeldItemId } from "#enums/held-item-id";
import type { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat, type PermanentStat } from "#enums/stat";
import { ITEM_EFFECT } from "./held-item";
import {
  type ATTACK_TYPE_BOOST_PARAMS,
  AttackTypeBoosterHeldItem,
  attackTypeToHeldItem,
} from "./held-items/attack-type-booster";
import {
  type BASE_STAT_BOOSTER_PARAMS,
  BaseStatBoosterHeldItem,
  permanentStatToHeldItem,
} from "./held-items/base-stat-booster";
import { type BERRY_PARAMS, BerryHeldItem, berryTypeToHeldItem } from "./held-items/berry";
import { type EXP_BOOST_PARAMS, ExpBoosterHeldItem } from "./held-items/exp-booster";
import { type HIT_HEAL_PARAMS, HitHealHeldItem } from "./held-items/hit-heal";
import { InstantReviveHeldItem, type INSTANT_REVIVE_PARAMS } from "./held-items/instant-revive";
import {
  ResetNegativeStatStageHeldItem,
  type RESET_NEGATIVE_STAT_STAGE_PARAMS,
} from "./held-items/reset-negative-stat-stage";
import {
  EvolutionStatBoostHeldItem,
  SpeciesStatBoostHeldItem,
  type STAT_BOOST_PARAMS,
} from "./held-items/stat-booster";
import type { TURN_END_HEAL_PARAMS } from "./held-items/turn-end-heal";
import { TurnEndHealHeldItem } from "./held-items/turn-end-heal";

export const allHeldItems = {};

export function initHeldItems() {
  for (const berry of getEnumValues(BerryType)) {
    let maxStackCount: number;
    if ([BerryType.LUM, BerryType.LEPPA, BerryType.SITRUS, BerryType.ENIGMA].includes(berry)) {
      maxStackCount = 2;
    } else {
      maxStackCount = 3;
    }
    const berryId = berryTypeToHeldItem[berry];
    allHeldItems[berryId] = new BerryHeldItem(berry, maxStackCount);
  }
  console.log(allHeldItems);

  allHeldItems[HeldItemId.REVIVER_SEED] = new InstantReviveHeldItem(HeldItemId.REVIVER_SEED, 1);
  allHeldItems[HeldItemId.WHITE_HERB] = new ResetNegativeStatStageHeldItem(HeldItemId.WHITE_HERB, 2);

  // SILK_SCARF, BLACK_BELT, etc...
  for (const [typeKey, heldItemType] of Object.entries(attackTypeToHeldItem)) {
    const pokemonType = Number(typeKey) as PokemonType;
    allHeldItems[heldItemType] = new AttackTypeBoosterHeldItem(heldItemType, 99, pokemonType, 0.2);
  }

  allHeldItems[HeldItemId.EVIOLITE] = new EvolutionStatBoostHeldItem(
    HeldItemId.EVIOLITE,
    1,
    [Stat.DEF, Stat.SPDEF],
    1.5,
  );
  allHeldItems[HeldItemId.LIGHT_BALL] = new SpeciesStatBoostHeldItem(
    HeldItemId.LIGHT_BALL,
    1,
    [Stat.ATK, Stat.SPATK],
    2,
    [SpeciesId.PIKACHU],
  );
  allHeldItems[HeldItemId.THICK_CLUB] = new SpeciesStatBoostHeldItem(HeldItemId.LIGHT_BALL, 1, [Stat.ATK], 2, [
    SpeciesId.CUBONE,
    SpeciesId.MAROWAK,
    SpeciesId.ALOLA_MAROWAK,
  ]);
  allHeldItems[HeldItemId.METAL_POWDER] = new SpeciesStatBoostHeldItem(HeldItemId.LIGHT_BALL, 1, [Stat.DEF], 2, [
    SpeciesId.DITTO,
  ]);
  allHeldItems[HeldItemId.QUICK_POWDER] = new SpeciesStatBoostHeldItem(HeldItemId.LIGHT_BALL, 1, [Stat.SPD], 2, [
    SpeciesId.DITTO,
  ]);
  allHeldItems[HeldItemId.DEEP_SEA_SCALE] = new SpeciesStatBoostHeldItem(HeldItemId.LIGHT_BALL, 1, [Stat.SPDEF], 2, [
    SpeciesId.CLAMPERL,
  ]);
  allHeldItems[HeldItemId.DEEP_SEA_TOOTH] = new SpeciesStatBoostHeldItem(HeldItemId.LIGHT_BALL, 1, [Stat.SPATK], 2, [
    SpeciesId.CLAMPERL,
  ]);

  allHeldItems[HeldItemId.LUCKY_EGG] = new ExpBoosterHeldItem(HeldItemId.LUCKY_EGG, 99, 40);
  allHeldItems[HeldItemId.GOLDEN_EGG] = new ExpBoosterHeldItem(HeldItemId.GOLDEN_EGG, 99, 100);

  allHeldItems[HeldItemId.LEFTOVERS] = new TurnEndHealHeldItem(HeldItemId.LEFTOVERS, 4);
  allHeldItems[HeldItemId.SHELL_BELL] = new HitHealHeldItem(HeldItemId.SHELL_BELL, 4);

  // vitamins
  for (const [statKey, heldItemType] of Object.entries(permanentStatToHeldItem)) {
    const stat = Number(statKey) as PermanentStat;
    allHeldItems[heldItemType] = new BaseStatBoosterHeldItem(heldItemType, 10, stat);
  }
}

type APPLY_HELD_ITEMS_PARAMS = {
  [ITEM_EFFECT.ATTACK_TYPE_BOOST]: ATTACK_TYPE_BOOST_PARAMS;
  [ITEM_EFFECT.TURN_END_HEAL]: TURN_END_HEAL_PARAMS;
  [ITEM_EFFECT.HIT_HEAL]: HIT_HEAL_PARAMS;
  [ITEM_EFFECT.RESET_NEGATIVE_STAT_STAGE]: RESET_NEGATIVE_STAT_STAGE_PARAMS;
  [ITEM_EFFECT.EXP_BOOSTER]: EXP_BOOST_PARAMS;
  [ITEM_EFFECT.BERRY]: BERRY_PARAMS;
  [ITEM_EFFECT.BASE_STAT_BOOSTER]: BASE_STAT_BOOSTER_PARAMS;
  [ITEM_EFFECT.INSTANT_REVIVE]: INSTANT_REVIVE_PARAMS;
  [ITEM_EFFECT.STAT_BOOST]: STAT_BOOST_PARAMS;
};

export function applyHeldItems<T extends ITEM_EFFECT>(effect: T, params: APPLY_HELD_ITEMS_PARAMS[T]) {
  const pokemon = params.pokemon;
  if (pokemon) {
    for (const item of Object.keys(pokemon.heldItemManager.heldItems)) {
      if (allHeldItems[item].effects.includes(effect)) {
        allHeldItems[item].apply(params);
      }
    }
  }
}
