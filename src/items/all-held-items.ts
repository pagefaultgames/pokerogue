/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { allHeldItems } from "#data/data-lists";
import { BerryType } from "#enums/berry-type";
import { FormChangeItemId } from "#enums/form-change-item-id";
import { HeldItemId, HeldItemNames } from "#enums/held-item-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { getStatKey, PERMANENT_STATS, Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { AccuracyBoosterHeldItemAttr } from "#items/accuracy-booster";
import { AttackTypeBoostHeldItemAttr, attackTypeToHeldItem } from "#items/attack-type-booster";
import { OldGateauHeldItemAttr, ShuckleJuiceHeldItemAttr } from "#items/base-stat-add";
import { BaseStatMultiplyHeldItemAttr, permanentStatToHeldItem, statBoostItems } from "#items/base-stat-multiply";
import { BatonHeldItemAttr } from "#items/baton";
import { BerryHeldItemAttr, berryTypeToHeldItem } from "#items/berry";
import { BypassSpeedChanceHeldItemAttr } from "#items/bypass-speed-chance";
import { CritBoostHeldItemAttr, SpeciesCritBoostHeldItemAttr } from "#items/crit-booster";
import { DamageMoneyRewardHeldItemAttr } from "#items/damage-money-reward";
import { GimmighoulEvoTrackerHeldItem } from "#items/evo-tracker";
import { ExpBoosterHeldItemAttr } from "#items/exp-booster";
import { FieldEffectHeldItemAttr } from "#items/field-effect";
import { FlinchChanceHeldItemAttr } from "#items/flinch-chance";
import { FormChangeHeldItem } from "#items/form-change-item";
import { FriendshipBoosterHeldItemAttr } from "#items/friendship-booster";
import type { CosmeticHeldItem, HeldItem } from "#items/held-item";
import { HeldItemBuilder } from "#items/held-item-builder";
import { HitHealHeldItemAttr } from "#items/hit-heal";
import { InstantReviveHeldItemAttr } from "#items/instant-revive";
import { ContactItemStealChanceHeldItemAttr, TurnEndItemStealHeldItemAttr } from "#items/item-steal";
import { MachoBraceHeldItemAttr } from "#items/macho-brace";
import { MultiHitCountHeldItemAttr } from "#items/multi-hit";
import { NatureWeightBoosterHeldItemAttr } from "#items/nature-weight-booster";
import { ResetNegativeStatStageHeldItemAttr } from "#items/reset-negative-stat-stage";
import { EvolutionStatBoostHeldItemAttr, SpeciesStatBoostHeldItemAttr } from "#items/stat-boost";
import { SurviveChanceHeldItemAttr } from "#items/survive-chance";
import { TurnEndHealHeldItemAttr } from "#items/turn-end-heal";
import { TurnEndStatusHeldItemAttr } from "#items/turn-end-status";
import { getEnumValues } from "#utils/enums";

// #region Types
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

export type BerryItemId =
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

//#endregion Types

// #region Berries
const twoStackBerryTypes: readonly BerryType[] = [BerryType.LUM, BerryType.LEPPA, BerryType.SITRUS, BerryType.ENIGMA];
const berryItems = getEnumValues(BerryType).reduce(
  (ret, berry) => {
    const maxStackCount = twoStackBerryTypes.includes(berry) ? 2 : 3;
    const berryId = berryTypeToHeldItem[berry];
    berryId satisfies BerryItemId;
    ret[berryId] = new HeldItemBuilder(berryId, maxStackCount) //
      .attr(BerryHeldItemAttr, berry)
      .name(`berry:${BerryType[berry].toLowerCase()}.name`)
      .description(`berry:${BerryType[berry].toLowerCase()}.effect`)
      .iconName(`${BerryType[berry].toLowerCase()}_berry`)
      .build();
    return ret;
  },
  {} as Record<BerryItemId, HeldItem<BerryHeldItemAttr>>,
);
//#endregion Berries

//#region Type Boosters
const typeBoostHeldItems = (
  getEnumValues(PokemonType).slice(1, -1) as Exclude<PokemonType, PokemonType.UNKNOWN | PokemonType.STELLAR>[]
).reduce(
  (ret, pokemonType) => {
    const id = attackTypeToHeldItem[pokemonType] satisfies TypeBoostItemId;
    ret[id] = new HeldItemBuilder(id, 99) //
      .attr(AttackTypeBoostHeldItemAttr, pokemonType, 0.2)
      .unstealable()
      .untransferable()
      .unsuppressable()
      .name(`modifierType:AttackTypeBoosterItem.${HeldItemNames[id].toLowerCase()}`)
      .description("modifierType:ModifierType.AttackTypeBoosterModifierType.description", {
        moveType: `$t(pokemonInfo:Type.${PokemonType[pokemonType]})`,
      })
      .build();
    return ret;
  },
  {} as Record<TypeBoostItemId, HeldItem<AttackTypeBoostHeldItemAttr>>,
);
//#endregion Type Boosters

//#region Vitamins
const vitaminItems = PERMANENT_STATS.reduce(
  (ret, stat) => {
    const id = permanentStatToHeldItem[stat];
    id satisfies BaseStatItemId;
    ret[id] = new HeldItemBuilder(id, 30) //
      .attr(BaseStatMultiplyHeldItemAttr, stat)
      .unstealable()
      .untransferable()
      .unsuppressable()
      .name(`modifierType:BaseStatBoosterItem.${statBoostItems[stat]}`)
      .description("modifierType:ModifierType.BaseStatBoosterModifierType.description", {
        stat: `$t(${getStatKey(stat)})`,
      })
      .iconName(statBoostItems[stat])
      .build();
    return ret;
  },
  {} as Record<BaseStatItemId, HeldItem<BaseStatMultiplyHeldItemAttr>>,
);

//#endregion Vitamins

//#region Form change items
// TODO: Do we want these in a separate object?
const formChangeItems = Object.values(FormChangeItemId).reduce(
  (ret, id) => {
    ret[id] = new FormChangeHeldItem(id, 1);
    return ret;
  },
  {} as Record<FormChangeItemId, FormChangeHeldItem>,
);
//#endregion Form change items

//#region Initialization
const heldItems = {
  ...berryItems,
  ...typeBoostHeldItems,
  ...vitaminItems,
  ...formChangeItems,
  [HeldItemId.REVIVER_SEED]: new HeldItemBuilder(HeldItemId.REVIVER_SEED, 1) //
    .attr(InstantReviveHeldItemAttr)
    .build(),
  [HeldItemId.WHITE_HERB]: new HeldItemBuilder(HeldItemId.WHITE_HERB, 2) //
    .attr(ResetNegativeStatStageHeldItemAttr)
    .build(),

  // Items that boost specific stats
  [HeldItemId.EVIOLITE]: new HeldItemBuilder(HeldItemId.EVIOLITE, 1) //
    .attr(EvolutionStatBoostHeldItemAttr, [Stat.DEF, Stat.SPDEF], 1.5)
    .build(),
  [HeldItemId.LIGHT_BALL]: new HeldItemBuilder(HeldItemId.LIGHT_BALL, 1) //
    .attr(SpeciesStatBoostHeldItemAttr, [Stat.ATK, Stat.SPATK], 2, [SpeciesId.PIKACHU])
    .build(),
  [HeldItemId.THICK_CLUB]: new HeldItemBuilder(HeldItemId.THICK_CLUB, 1) //
    .attr(SpeciesStatBoostHeldItemAttr, [Stat.ATK], 2, [SpeciesId.CUBONE, SpeciesId.MAROWAK, SpeciesId.ALOLA_MAROWAK])
    .build(),
  [HeldItemId.METAL_POWDER]: new HeldItemBuilder(HeldItemId.METAL_POWDER, 1) //
    .attr(SpeciesStatBoostHeldItemAttr, [Stat.DEF], 2, [SpeciesId.DITTO])
    .build(),
  [HeldItemId.QUICK_POWDER]: new HeldItemBuilder(HeldItemId.QUICK_POWDER, 1) //
    .attr(SpeciesStatBoostHeldItemAttr, [Stat.SPD], 2, [SpeciesId.DITTO])
    .build(),
  [HeldItemId.DEEP_SEA_SCALE]: new HeldItemBuilder(HeldItemId.DEEP_SEA_SCALE, 1) //
    .attr(SpeciesStatBoostHeldItemAttr, [Stat.SPDEF], 2, [SpeciesId.CLAMPERL])
    .build(),
  [HeldItemId.DEEP_SEA_TOOTH]: new HeldItemBuilder(HeldItemId.DEEP_SEA_TOOTH, 1) //
    .attr(SpeciesStatBoostHeldItemAttr, [Stat.SPATK], 2, [SpeciesId.CLAMPERL])
    .build(),

  // crit rate boosters
  [HeldItemId.SCOPE_LENS]: new HeldItemBuilder(HeldItemId.SCOPE_LENS, 1) //
    .attr(CritBoostHeldItemAttr, 1)
    .build(),
  [HeldItemId.LEEK]: new HeldItemBuilder(HeldItemId.LEEK, 1) //
    .attr(SpeciesCritBoostHeldItemAttr, 2, [SpeciesId.FARFETCHD, SpeciesId.GALAR_FARFETCHD, SpeciesId.SIRFETCHD])
    .build(),

  [HeldItemId.LUCKY_EGG]: new HeldItemBuilder(HeldItemId.LUCKY_EGG, 99) //
    .attr(ExpBoosterHeldItemAttr, 40)
    .description("modifierType:ModifierType.PokemonExpBoosterModifierType.description", { boostPercent: 40 })
    .build(),
  [HeldItemId.GOLDEN_EGG]: new HeldItemBuilder(HeldItemId.GOLDEN_EGG, 99) //
    .attr(ExpBoosterHeldItemAttr, 100)
    .description("modifierType:ModifierType.PokemonExpBoosterModifierType.description", { boostPercent: 100 })
    .build(),
  [HeldItemId.SOOTHE_BELL]: new HeldItemBuilder(HeldItemId.SOOTHE_BELL, 3) //
    .attr(FriendshipBoosterHeldItemAttr)
    .description("modifierType:ModifierType.PokemonFriendshipBoosterModifierType.description")
    .build(),

  [HeldItemId.LEFTOVERS]: new HeldItemBuilder(HeldItemId.LEFTOVERS, 4) //
    .attr(TurnEndHealHeldItemAttr)
    .build(),
  [HeldItemId.SHELL_BELL]: new HeldItemBuilder(HeldItemId.SHELL_BELL, 4) //
    .attr(HitHealHeldItemAttr)
    .name("modifierType:ModifierType.SHELL_BELL.name")
    .description("modifierType:ModifierType.SHELL_BELL.description")
    .iconName("shell_bell")
    .build(),

  [HeldItemId.FOCUS_BAND]: new HeldItemBuilder(HeldItemId.FOCUS_BAND, 5).attr(SurviveChanceHeldItemAttr).build(), //
  [HeldItemId.QUICK_CLAW]: new HeldItemBuilder(HeldItemId.QUICK_CLAW, 3) //
    .attr(BypassSpeedChanceHeldItemAttr)
    .build(),
  [HeldItemId.KINGS_ROCK]: new HeldItemBuilder(HeldItemId.KINGS_ROCK, 3) //
    .attr(FlinchChanceHeldItemAttr, 10)
    .build(),
  [HeldItemId.MYSTICAL_ROCK]: new HeldItemBuilder(HeldItemId.MYSTICAL_ROCK, 2) //
    .attr(FieldEffectHeldItemAttr)
    .build(),
  [HeldItemId.SOUL_DEW]: new HeldItemBuilder(HeldItemId.SOUL_DEW, 10) //
    .attr(NatureWeightBoosterHeldItemAttr)
    .build(),
  [HeldItemId.WIDE_LENS]: new HeldItemBuilder(HeldItemId.WIDE_LENS, 3) //
    .attr(AccuracyBoosterHeldItemAttr, 5)
    .build(),
  [HeldItemId.MULTI_LENS]: new HeldItemBuilder(HeldItemId.MULTI_LENS, 2) //
    .attr(MultiHitCountHeldItemAttr)
    .description("modifierType:ModifierType.PokemonMultiHitModifierType.description")
    .build(),
  [HeldItemId.GOLDEN_PUNCH]: new HeldItemBuilder(HeldItemId.GOLDEN_PUNCH, 5) //
    .attr(DamageMoneyRewardHeldItemAttr)
    .build(),
  [HeldItemId.BATON]: new HeldItemBuilder(HeldItemId.BATON, 1) //
    .attr(BatonHeldItemAttr)
    .build(),
  [HeldItemId.GRIP_CLAW]: new HeldItemBuilder(HeldItemId.GRIP_CLAW, 5) //
    .attr(ContactItemStealChanceHeldItemAttr, 10)
    .description("modifierType:ModifierType.ContactHeldItemTransferChanceModifierType.description", {
      chancePercent: 10,
    })
    .build(),
  [HeldItemId.MINI_BLACK_HOLE]: new HeldItemBuilder(HeldItemId.MINI_BLACK_HOLE, 1) //
    .attr(TurnEndItemStealHeldItemAttr)
    .description("modifierType:ModifierType.TurnHeldItemTransferModifierType.description")
    .unstealable()
    .untransferable()
    .build(),

  [HeldItemId.FLAME_ORB]: new HeldItemBuilder(HeldItemId.FLAME_ORB, 1) //
    .attr(TurnEndStatusHeldItemAttr, StatusEffect.BURN)
    .build(),
  [HeldItemId.TOXIC_ORB]: new HeldItemBuilder(HeldItemId.TOXIC_ORB, 1) //
    .attr(TurnEndStatusHeldItemAttr, StatusEffect.TOXIC)
    .build(),

  [HeldItemId.SHUCKLE_JUICE_GOOD]: new HeldItemBuilder(HeldItemId.SHUCKLE_JUICE_GOOD, 1) //
    .attr(ShuckleJuiceHeldItemAttr, 10)
    .unstealable()
    .untransferable()
    .unsuppressable()
    .name("modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_GOOD.name")
    .description("modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_GOOD.description")
    .iconName("berry_juice_good")
    .build(),
  [HeldItemId.SHUCKLE_JUICE_BAD]: new HeldItemBuilder(HeldItemId.SHUCKLE_JUICE_BAD, 1) //
    .attr(ShuckleJuiceHeldItemAttr, -15)
    .unstealable()
    .untransferable()
    .unsuppressable()
    .name("modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_BAD.name")
    .description("modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_BAD.description")
    .iconName("berry_juice_bad")
    .build(),
  [HeldItemId.OLD_GATEAU]: new HeldItemBuilder(HeldItemId.OLD_GATEAU, 1) //
    .attr(OldGateauHeldItemAttr)
    .unstealable()
    .untransferable()
    .unsuppressable()
    .description("modifierType:ModifierType.PokemonBaseStatFlatModifierType.description")
    .build(),
  [HeldItemId.MACHO_BRACE]: new HeldItemBuilder(HeldItemId.MACHO_BRACE, 50) //
    .attr(MachoBraceHeldItemAttr)
    .name("modifierType:ModifierType.MYSTERY_ENCOUNTER_MACHO_BRACE.name")
    .description("modifierType:ModifierType.MYSTERY_ENCOUNTER_MACHO_BRACE.description")
    .unstealable()
    .untransferable()
    .unsuppressable()
    .build(),
  [HeldItemId.GIMMIGHOUL_EVO_TRACKER]: new GimmighoulEvoTrackerHeldItem(
    HeldItemId.GIMMIGHOUL_EVO_TRACKER,
    999,
    SpeciesId.GIMMIGHOUL,
    10,
  ),
} as const satisfies Readonly<Record<HeldItemId, CosmeticHeldItem | HeldItem>>;

/**
 * Resolved type of {@linkcode allHeldItems}.
 * @privateRemarks
 * Declared in a separate file to avoid circular imports.
 */
export type AllHeldItems = typeof heldItems;

export function initHeldItems(): void {
  Object.assign(allHeldItems, heldItems);
  Object.freeze(allHeldItems);
}

// #endregion Initialization
