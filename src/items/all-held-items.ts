import { getEnumValues } from "#app/utils/common";
import { BerryType } from "#enums/berry-type";
import { HeldItemId } from "#enums/held-item-id";
import type { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat, type PermanentStat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { HELD_ITEM_EFFECT, type HeldItem } from "./held-item";
import { type ACCURACY_BOOST_PARAMS, AccuracyBoosterHeldItem } from "./held-items/accuracy-booster";
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
import { type BASE_STAT_FLAT_PARAMS, BaseStatFlatHeldItem } from "./held-items/base-stat-flat";
import { type BASE_STAT_TOTAL_PARAMS, BaseStatTotalHeldItem } from "./held-items/base-stat-total";
import { type BATON_PARAMS, BatonHeldItem } from "./held-items/baton";
import { type BERRY_PARAMS, BerryHeldItem, berryTypeToHeldItem } from "./held-items/berry";
import { type BYPASS_SPEED_CHANCE_PARAMS, BypassSpeedChanceHeldItem } from "./held-items/bypass-speed-chance";
import { type CRIT_BOOST_PARAMS, CritBoostHeldItem, SpeciesCritBoostHeldItem } from "./held-items/crit-booster";
import { type DAMAGE_MONEY_REWARD_PARAMS, DamageMoneyRewardHeldItem } from "./held-items/damage-money-reward";
import { type EVO_TRACKER_PARAMS, GimmighoulEvoTrackerHeldItem } from "./held-items/evo-tracker";
import { type EXP_BOOST_PARAMS, ExpBoosterHeldItem } from "./held-items/exp-booster";
import { type FIELD_EFFECT_PARAMS, FieldEffectHeldItem } from "./held-items/field-effect";
import { type FLINCH_CHANCE_PARAMS, FlinchChanceHeldItem } from "./held-items/flinch-chance";
import { type FRIENDSHIP_BOOST_PARAMS, FriendshipBoosterHeldItem } from "./held-items/friendship-booster";
import { type HIT_HEAL_PARAMS, HitHealHeldItem } from "./held-items/hit-heal";
import { type INCREMENTING_STAT_PARAMS, IncrementingStatHeldItem } from "./held-items/incrementing-stat";
import { InstantReviveHeldItem, type INSTANT_REVIVE_PARAMS } from "./held-items/instant-revive";
import {
  ContactItemStealChanceHeldItem,
  type ITEM_STEAL_PARAMS,
  TurnEndItemStealHeldItem,
} from "./held-items/item-steal";
import { type MULTI_HIT_PARAMS, MultiHitHeldItem } from "./held-items/multi-hit";
import { type NATURE_WEIGHT_BOOST_PARAMS, NatureWeightBoosterHeldItem } from "./held-items/nature-weight-booster";
import {
  ResetNegativeStatStageHeldItem,
  type RESET_NEGATIVE_STAT_STAGE_PARAMS,
} from "./held-items/reset-negative-stat-stage";
import {
  EvolutionStatBoostHeldItem,
  SpeciesStatBoostHeldItem,
  type STAT_BOOST_PARAMS,
} from "./held-items/stat-booster";
import { type SURVIVE_CHANCE_PARAMS, SurviveChanceHeldItem } from "./held-items/survive-chance";
import { type TURN_END_HEAL_PARAMS, TurnEndHealHeldItem } from "./held-items/turn-end-heal";
import { type TURN_END_STATUS_PARAMS, TurnEndStatusHeldItem } from "./held-items/turn-end-status";

export const allHeldItems: Record<HeldItemId, HeldItem> = {};

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

  // Items that boost specific stats
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

  // Items that boost the crit rate
  allHeldItems[HeldItemId.SCOPE_LENS] = new CritBoostHeldItem(HeldItemId.SCOPE_LENS, 1, 1);
  allHeldItems[HeldItemId.LEEK] = new SpeciesCritBoostHeldItem(HeldItemId.LEEK, 1, 2, [
    SpeciesId.FARFETCHD,
    SpeciesId.GALAR_FARFETCHD,
    SpeciesId.SIRFETCHD,
  ]);

  allHeldItems[HeldItemId.LUCKY_EGG] = new ExpBoosterHeldItem(HeldItemId.LUCKY_EGG, 99, 40);
  allHeldItems[HeldItemId.GOLDEN_EGG] = new ExpBoosterHeldItem(HeldItemId.GOLDEN_EGG, 99, 100);
  allHeldItems[HeldItemId.SOOTHE_BELL] = new FriendshipBoosterHeldItem(HeldItemId.SOOTHE_BELL, 3);

  allHeldItems[HeldItemId.LEFTOVERS] = new TurnEndHealHeldItem(HeldItemId.LEFTOVERS, 4);
  allHeldItems[HeldItemId.SHELL_BELL] = new HitHealHeldItem(HeldItemId.SHELL_BELL, 4);

  allHeldItems[HeldItemId.FOCUS_BAND] = new SurviveChanceHeldItem(HeldItemId.FOCUS_BAND, 5);
  allHeldItems[HeldItemId.QUICK_CLAW] = new BypassSpeedChanceHeldItem(HeldItemId.QUICK_CLAW, 3);
  allHeldItems[HeldItemId.KINGS_ROCK] = new FlinchChanceHeldItem(HeldItemId.KINGS_ROCK, 3, 10);
  allHeldItems[HeldItemId.MYSTICAL_ROCK] = new FieldEffectHeldItem(HeldItemId.MYSTICAL_ROCK, 2);
  allHeldItems[HeldItemId.SOUL_DEW] = new NatureWeightBoosterHeldItem(HeldItemId.SOUL_DEW, 10);
  allHeldItems[HeldItemId.WIDE_LENS] = new AccuracyBoosterHeldItem(HeldItemId.WIDE_LENS, 3, 5);
  allHeldItems[HeldItemId.MULTI_LENS] = new MultiHitHeldItem(HeldItemId.MULTI_LENS, 2);
  allHeldItems[HeldItemId.GOLDEN_PUNCH] = new DamageMoneyRewardHeldItem(HeldItemId.GOLDEN_PUNCH, 5);
  allHeldItems[HeldItemId.BATON] = new BatonHeldItem(HeldItemId.BATON, 1);
  allHeldItems[HeldItemId.GRIP_CLAW] = new ContactItemStealChanceHeldItem(HeldItemId.GRIP_CLAW, 5, 10);
  allHeldItems[HeldItemId.MINI_BLACK_HOLE] = new TurnEndItemStealHeldItem(HeldItemId.MINI_BLACK_HOLE, 1)
    .unstealable()
    .untransferable();

  allHeldItems[HeldItemId.FLAME_ORB] = new TurnEndStatusHeldItem(HeldItemId.FLAME_ORB, 1, StatusEffect.BURN);
  allHeldItems[HeldItemId.TOXIC_ORB] = new TurnEndStatusHeldItem(HeldItemId.TOXIC_ORB, 1, StatusEffect.TOXIC);

  // vitamins
  for (const [statKey, heldItemType] of Object.entries(permanentStatToHeldItem)) {
    const stat = Number(statKey) as PermanentStat;
    allHeldItems[heldItemType] = new BaseStatBoosterHeldItem(heldItemType, 30, stat)
      .unstealable()
      .untransferable()
      .unsuppressable();
  }

  allHeldItems[HeldItemId.SHUCKLE_JUICE_GOOD] = new BaseStatTotalHeldItem(HeldItemId.SHUCKLE_JUICE_GOOD, 1, 10)
    .unstealable()
    .untransferable()
    .unsuppressable();
  allHeldItems[HeldItemId.SHUCKLE_JUICE_BAD] = new BaseStatTotalHeldItem(HeldItemId.SHUCKLE_JUICE_BAD, 1, -15)
    .unstealable()
    .untransferable()
    .unsuppressable();
  allHeldItems[HeldItemId.OLD_GATEAU] = new BaseStatFlatHeldItem(HeldItemId.OLD_GATEAU, 1)
    .unstealable()
    .untransferable()
    .unsuppressable();
  allHeldItems[HeldItemId.MACHO_BRACE] = new IncrementingStatHeldItem(HeldItemId.MACHO_BRACE, 50)
    .unstealable()
    .untransferable()
    .unsuppressable();
  allHeldItems[HeldItemId.GIMMIGHOUL_EVO_TRACKER] = new GimmighoulEvoTrackerHeldItem(
    HeldItemId.GIMMIGHOUL_EVO_TRACKER,
    999,
    SpeciesId.GIMMIGHOUL,
    10,
  );
}

type APPLY_HELD_ITEMS_PARAMS = {
  [HELD_ITEM_EFFECT.ATTACK_TYPE_BOOST]: ATTACK_TYPE_BOOST_PARAMS;
  [HELD_ITEM_EFFECT.TURN_END_HEAL]: TURN_END_HEAL_PARAMS;
  [HELD_ITEM_EFFECT.HIT_HEAL]: HIT_HEAL_PARAMS;
  [HELD_ITEM_EFFECT.RESET_NEGATIVE_STAT_STAGE]: RESET_NEGATIVE_STAT_STAGE_PARAMS;
  [HELD_ITEM_EFFECT.EXP_BOOSTER]: EXP_BOOST_PARAMS;
  [HELD_ITEM_EFFECT.BERRY]: BERRY_PARAMS;
  [HELD_ITEM_EFFECT.BASE_STAT_BOOSTER]: BASE_STAT_BOOSTER_PARAMS;
  [HELD_ITEM_EFFECT.INSTANT_REVIVE]: INSTANT_REVIVE_PARAMS;
  [HELD_ITEM_EFFECT.STAT_BOOST]: STAT_BOOST_PARAMS;
  [HELD_ITEM_EFFECT.CRIT_BOOST]: CRIT_BOOST_PARAMS;
  [HELD_ITEM_EFFECT.TURN_END_STATUS]: TURN_END_STATUS_PARAMS;
  [HELD_ITEM_EFFECT.SURVIVE_CHANCE]: SURVIVE_CHANCE_PARAMS;
  [HELD_ITEM_EFFECT.BYPASS_SPEED_CHANCE]: BYPASS_SPEED_CHANCE_PARAMS;
  [HELD_ITEM_EFFECT.FLINCH_CHANCE]: FLINCH_CHANCE_PARAMS;
  [HELD_ITEM_EFFECT.FIELD_EFFECT]: FIELD_EFFECT_PARAMS;
  [HELD_ITEM_EFFECT.FRIENDSHIP_BOOSTER]: FRIENDSHIP_BOOST_PARAMS;
  [HELD_ITEM_EFFECT.NATURE_WEIGHT_BOOSTER]: NATURE_WEIGHT_BOOST_PARAMS;
  [HELD_ITEM_EFFECT.ACCURACY_BOOSTER]: ACCURACY_BOOST_PARAMS;
  [HELD_ITEM_EFFECT.MULTI_HIT]: MULTI_HIT_PARAMS;
  [HELD_ITEM_EFFECT.DAMAGE_MONEY_REWARD]: DAMAGE_MONEY_REWARD_PARAMS;
  [HELD_ITEM_EFFECT.BATON]: BATON_PARAMS;
  [HELD_ITEM_EFFECT.CONTACT_ITEM_STEAL_CHANCE]: ITEM_STEAL_PARAMS;
  [HELD_ITEM_EFFECT.TURN_END_ITEM_STEAL]: ITEM_STEAL_PARAMS;
  [HELD_ITEM_EFFECT.BASE_STAT_TOTAL]: BASE_STAT_TOTAL_PARAMS;
  [HELD_ITEM_EFFECT.BASE_STAT_FLAT]: BASE_STAT_FLAT_PARAMS;
  [HELD_ITEM_EFFECT.INCREMENTING_STAT]: INCREMENTING_STAT_PARAMS;
  [HELD_ITEM_EFFECT.EVO_TRACKER]: EVO_TRACKER_PARAMS;
};

export function applyHeldItems<T extends HELD_ITEM_EFFECT>(effect: T, params: APPLY_HELD_ITEMS_PARAMS[T]) {
  const pokemon = params.pokemon;
  if (pokemon) {
    for (const item of Object.keys(pokemon.heldItemManager.heldItems)) {
      if (allHeldItems[item].effects.includes(effect)) {
        allHeldItems[item].apply(params);
      }
    }
  }
}
