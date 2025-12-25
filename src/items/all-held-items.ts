/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { allHeldItems } from "#data/data-lists";
import { BerryType } from "#enums/berry-type";
import { FormChangeItemId } from "#enums/form-change-item-id";
import { HeldItemId } from "#enums/held-item-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { PERMANENT_STATS, Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { AccuracyBoosterHeldItem } from "#items/accuracy-booster";
import { AttackTypeBoosterHeldItem, attackTypeToHeldItem } from "#items/attack-type-booster";
import { OldGateauHeldItem, ShuckleJuiceHeldItem } from "#items/base-stat-add";
import { BaseStatMultiplyHeldItem, permanentStatToHeldItem } from "#items/base-stat-multiply";
import { BatonHeldItem } from "#items/baton";
import { BerryHeldItem, berryTypeToHeldItem } from "#items/berry";
import { BypassSpeedChanceHeldItem } from "#items/bypass-speed-chance";
import { CritBoostHeldItem, SpeciesCritBoostHeldItem } from "#items/crit-booster";
import { DamageMoneyRewardHeldItem } from "#items/damage-money-reward";
import { GimmighoulEvoTrackerHeldItem } from "#items/evo-tracker";
import { ExpBoosterHeldItem } from "#items/exp-booster";
import { FieldEffectHeldItem } from "#items/field-effect";
import { FlinchChanceHeldItem } from "#items/flinch-chance";
import { FormChangeHeldItem } from "#items/form-change-item";
import { FriendshipBoosterHeldItem } from "#items/friendship-booster";
import type { CosmeticHeldItem, HeldItem } from "#items/held-item";
import { HitHealHeldItem } from "#items/hit-heal";
import { InstantReviveHeldItem } from "#items/instant-revive";
import { ContactItemStealChanceHeldItem, TurnEndItemStealHeldItem } from "#items/item-steal";
import { MachoBraceHeldItem } from "#items/macho-brace";
import { MultiHitHeldItem } from "#items/multi-hit";
import { NatureWeightBoosterHeldItem } from "#items/nature-weight-booster";
import { ResetNegativeStatStageHeldItem } from "#items/reset-negative-stat-stage";
import { EvolutionStatBoostHeldItem, SpeciesStatBoostHeldItem } from "#items/stat-boost";
import { SurviveChanceHeldItem } from "#items/survive-chance";
import { TurnEndHealHeldItem } from "#items/turn-end-heal";
import { TurnEndStatusHeldItem } from "#items/turn-end-status";
import { getEnumValues } from "#utils/enums";

// TODO: Move these to wherever the "XYZ enum to held item id" utils are eventually placed
// and convert the existing objects to functions for reduced memory footprint.
// TODO: Export these as "subsets" of `HeldItemId` for use inside type declarations
type BaseStatItemId =
  | typeof HeldItemId.HP_UP
  | typeof HeldItemId.PROTEIN
  | typeof HeldItemId.IRON
  | typeof HeldItemId.CALCIUM
  | typeof HeldItemId.ZINC
  | typeof HeldItemId.CARBOS;

type TypeBoostItemId =
  | typeof HeldItemId.SILK_SCARF
  | typeof HeldItemId.BLACK_BELT
  | typeof HeldItemId.SHARP_BEAK
  | typeof HeldItemId.POISON_BARB
  | typeof HeldItemId.SOFT_SAND
  | typeof HeldItemId.HARD_STONE
  | typeof HeldItemId.SILVER_POWDER
  | typeof HeldItemId.SPELL_TAG
  | typeof HeldItemId.METAL_COAT
  | typeof HeldItemId.CHARCOAL
  | typeof HeldItemId.MYSTIC_WATER
  | typeof HeldItemId.MIRACLE_SEED
  | typeof HeldItemId.MAGNET
  | typeof HeldItemId.TWISTED_SPOON
  | typeof HeldItemId.NEVER_MELT_ICE
  | typeof HeldItemId.DRAGON_FANG
  | typeof HeldItemId.BLACK_GLASSES
  | typeof HeldItemId.FAIRY_FEATHER;

type BerryItemId =
  | typeof HeldItemId.SITRUS_BERRY
  | typeof HeldItemId.LUM_BERRY
  | typeof HeldItemId.ENIGMA_BERRY
  | typeof HeldItemId.LIECHI_BERRY
  | typeof HeldItemId.GANLON_BERRY
  | typeof HeldItemId.PETAYA_BERRY
  | typeof HeldItemId.APICOT_BERRY
  | typeof HeldItemId.SALAC_BERRY
  | typeof HeldItemId.LANSAT_BERRY
  | typeof HeldItemId.STARF_BERRY
  | typeof HeldItemId.LEPPA_BERRY;

// Berries
const berryItems = getEnumValues(BerryType).reduce(
  (ret, berry) => {
    const maxStackCount = [BerryType.LUM, BerryType.LEPPA, BerryType.SITRUS, BerryType.ENIGMA].includes(berry) ? 2 : 3;
    const berryId = berryTypeToHeldItem[berry];
    berryId satisfies BerryItemId;
    ret[berryId] = new BerryHeldItem(berry, maxStackCount);
    return ret;
  },
  {} as Record<BerryItemId, BerryHeldItem>,
);

// Type boosters
const typeBoostHeldItems = (
  getEnumValues(PokemonType).slice(1, -1) as Exclude<PokemonType, PokemonType.UNKNOWN | PokemonType.STELLAR>[]
).reduce(
  (ret, type) => {
    const id = attackTypeToHeldItem[type];
    id satisfies TypeBoostItemId;
    ret[id] = new AttackTypeBoosterHeldItem(id, 99, type, 0.2).unstealable().untransferable().unsuppressable();
    return ret;
  },
  {} as Record<TypeBoostItemId, AttackTypeBoosterHeldItem>,
);

// vitamins
const vitaminItems = PERMANENT_STATS.reduce(
  (ret, stat) => {
    const id = permanentStatToHeldItem[stat];
    id satisfies BaseStatItemId;
    ret[stat] = new BaseStatMultiplyHeldItem(id, 30, stat).unstealable().untransferable().unsuppressable();
    return ret;
  },
  {} as Record<BaseStatItemId, BaseStatMultiplyHeldItem>,
);

// Form change items
// TODO: Do we want these in a separate object?
const formChangeItems = Object.values(FormChangeItemId).reduce(
  (ret, id) => {
    ret[id] = new FormChangeHeldItem(id, 1).unstealable().untransferable().unsuppressable();
    return ret;
  },
  {} as Record<FormChangeItemId, FormChangeHeldItem>,
);

const heldItems = Object.freeze({
  ...berryItems,
  ...typeBoostHeldItems,
  ...vitaminItems,
  ...formChangeItems,
  [HeldItemId.REVIVER_SEED]: new InstantReviveHeldItem(HeldItemId.REVIVER_SEED, 1),
  [HeldItemId.WHITE_HERB]: new ResetNegativeStatStageHeldItem(HeldItemId.WHITE_HERB, 2),

  // Items that boost specific stats
  [HeldItemId.EVIOLITE]: new EvolutionStatBoostHeldItem(HeldItemId.EVIOLITE, 1, [Stat.DEF, Stat.SPDEF], 1.5),
  [HeldItemId.LIGHT_BALL]: new SpeciesStatBoostHeldItem(HeldItemId.LIGHT_BALL, 1, [Stat.ATK, Stat.SPATK], 2, [
    SpeciesId.PIKACHU,
  ]),
  [HeldItemId.THICK_CLUB]: new SpeciesStatBoostHeldItem(HeldItemId.LIGHT_BALL, 1, [Stat.ATK], 2, [
    SpeciesId.CUBONE,
    SpeciesId.MAROWAK,
    SpeciesId.ALOLA_MAROWAK,
  ]),
  [HeldItemId.METAL_POWDER]: new SpeciesStatBoostHeldItem(HeldItemId.LIGHT_BALL, 1, [Stat.DEF], 2, [SpeciesId.DITTO]),
  [HeldItemId.QUICK_POWDER]: new SpeciesStatBoostHeldItem(HeldItemId.LIGHT_BALL, 1, [Stat.SPD], 2, [SpeciesId.DITTO]),
  [HeldItemId.DEEP_SEA_SCALE]: new SpeciesStatBoostHeldItem(HeldItemId.LIGHT_BALL, 1, [Stat.SPDEF], 2, [
    SpeciesId.CLAMPERL,
  ]),
  [HeldItemId.DEEP_SEA_TOOTH]: new SpeciesStatBoostHeldItem(HeldItemId.LIGHT_BALL, 1, [Stat.SPATK], 2, [
    SpeciesId.CLAMPERL,
  ]),

  // Items that boost the crit rate
  [HeldItemId.SCOPE_LENS]: new CritBoostHeldItem(HeldItemId.SCOPE_LENS, 1, 1),
  [HeldItemId.LEEK]: new SpeciesCritBoostHeldItem(HeldItemId.LEEK, 1, 2, [
    SpeciesId.FARFETCHD,
    SpeciesId.GALAR_FARFETCHD,
    SpeciesId.SIRFETCHD,
  ]),

  [HeldItemId.LUCKY_EGG]: new ExpBoosterHeldItem(HeldItemId.LUCKY_EGG, 99, 40),
  [HeldItemId.GOLDEN_EGG]: new ExpBoosterHeldItem(HeldItemId.GOLDEN_EGG, 99, 100),
  [HeldItemId.SOOTHE_BELL]: new FriendshipBoosterHeldItem(HeldItemId.SOOTHE_BELL, 3),

  [HeldItemId.LEFTOVERS]: new TurnEndHealHeldItem(HeldItemId.LEFTOVERS, 4),
  [HeldItemId.SHELL_BELL]: new HitHealHeldItem(HeldItemId.SHELL_BELL, 4),

  [HeldItemId.FOCUS_BAND]: new SurviveChanceHeldItem(HeldItemId.FOCUS_BAND, 5),
  [HeldItemId.QUICK_CLAW]: new BypassSpeedChanceHeldItem(HeldItemId.QUICK_CLAW, 3),
  [HeldItemId.KINGS_ROCK]: new FlinchChanceHeldItem(HeldItemId.KINGS_ROCK, 3, 10),
  [HeldItemId.MYSTICAL_ROCK]: new FieldEffectHeldItem(HeldItemId.MYSTICAL_ROCK, 2),
  [HeldItemId.SOUL_DEW]: new NatureWeightBoosterHeldItem(HeldItemId.SOUL_DEW, 10),
  [HeldItemId.WIDE_LENS]: new AccuracyBoosterHeldItem(HeldItemId.WIDE_LENS, 3, 5),
  [HeldItemId.MULTI_LENS]: new MultiHitHeldItem(HeldItemId.MULTI_LENS, 2),
  [HeldItemId.GOLDEN_PUNCH]: new DamageMoneyRewardHeldItem(HeldItemId.GOLDEN_PUNCH, 5),
  [HeldItemId.BATON]: new BatonHeldItem(HeldItemId.BATON, 1),
  [HeldItemId.GRIP_CLAW]: new ContactItemStealChanceHeldItem(HeldItemId.GRIP_CLAW, 5, 10),
  [HeldItemId.MINI_BLACK_HOLE]: new TurnEndItemStealHeldItem(HeldItemId.MINI_BLACK_HOLE, 1)
    .unstealable()
    .untransferable(),

  [HeldItemId.FLAME_ORB]: new TurnEndStatusHeldItem(HeldItemId.FLAME_ORB, 1, StatusEffect.BURN),
  [HeldItemId.TOXIC_ORB]: new TurnEndStatusHeldItem(HeldItemId.TOXIC_ORB, 1, StatusEffect.TOXIC),

  [HeldItemId.SHUCKLE_JUICE_GOOD]: new ShuckleJuiceHeldItem(HeldItemId.SHUCKLE_JUICE_GOOD, 1, 10)
    .unstealable()
    .untransferable()
    .unsuppressable(),
  [HeldItemId.SHUCKLE_JUICE_BAD]: new ShuckleJuiceHeldItem(HeldItemId.SHUCKLE_JUICE_BAD, 1, -15)
    .unstealable()
    .untransferable()
    .unsuppressable(),
  [HeldItemId.OLD_GATEAU]: new OldGateauHeldItem(HeldItemId.OLD_GATEAU, 1)
    .unstealable()
    .untransferable()
    .unsuppressable(),
  [HeldItemId.MACHO_BRACE]: new MachoBraceHeldItem(HeldItemId.MACHO_BRACE, 50)
    .unstealable()
    .untransferable()
    .unsuppressable(),
  [HeldItemId.GIMMIGHOUL_EVO_TRACKER]: new GimmighoulEvoTrackerHeldItem(
    HeldItemId.GIMMIGHOUL_EVO_TRACKER,
    999,
    SpeciesId.GIMMIGHOUL,
    10,
  ),
} satisfies Record<Exclude<HeldItemId, typeof HeldItemId.NONE>, CosmeticHeldItem | HeldItem<any>>);

/**
 * @see {@linkcode heldItems}
 */
export type AllHeldItems = typeof heldItems;

Object.assign(allHeldItems, heldItems);
Object.freeze(allHeldItems);
