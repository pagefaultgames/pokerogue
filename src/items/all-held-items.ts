import { allHeldItems } from "#data/data-lists";
import { BerryType } from "#enums/berry-type";
import { FormChangeItemId } from "#enums/form-change-item-id";
import type { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import type { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { type PermanentStat, Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { AccuracyBoosterHeldItem } from "#items/accuracy-booster";
import { AttackTypeBoosterHeldItem, attackTypeToHeldItem } from "#items/attack-type-booster";
import { BaseStatBoosterHeldItem, permanentStatToHeldItem } from "#items/base-stat-booster";
import { BaseStatFlatHeldItem } from "#items/base-stat-flat";
import { BaseStatTotalHeldItem } from "#items/base-stat-total";
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
import { HitHealHeldItem } from "#items/hit-heal";
import { IncrementingStatHeldItem } from "#items/incrementing-stat";
import { InstantReviveHeldItem } from "#items/instant-revive";
import { ContactItemStealChanceHeldItem, TurnEndItemStealHeldItem } from "#items/item-steal";
import { MultiHitHeldItem } from "#items/multi-hit";
import { NatureWeightBoosterHeldItem } from "#items/nature-weight-booster";
import { ResetNegativeStatStageHeldItem } from "#items/reset-negative-stat-stage";
import { EvolutionStatBoostHeldItem, SpeciesStatBoostHeldItem } from "#items/stat-booster";
import { SurviveChanceHeldItem } from "#items/survive-chance";
import { TurnEndHealHeldItem } from "#items/turn-end-heal";
import { TurnEndStatusHeldItem } from "#items/turn-end-status";
import { getEnumValues } from "#utils/enums";
import type { HeldItemEffectParamMap } from "./held-item-parameter";

export function initHeldItems() {
  for (const berry of getEnumValues(BerryType)) {
    const maxStackCount = [BerryType.LUM, BerryType.LEPPA, BerryType.SITRUS, BerryType.ENIGMA].includes(berry) ? 2 : 3;
    const berryId = berryTypeToHeldItem[berry];
    allHeldItems[berryId] = new BerryHeldItem(berry, maxStackCount);
  }

  allHeldItems[HeldItemId.REVIVER_SEED] = new InstantReviveHeldItem(HeldItemId.REVIVER_SEED, 1);
  allHeldItems[HeldItemId.WHITE_HERB] = new ResetNegativeStatStageHeldItem(HeldItemId.WHITE_HERB, 2);

  // SILK_SCARF, BLACK_BELT, etc...
  for (const [typeKey, heldItemType] of Object.entries(attackTypeToHeldItem)) {
    // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2114957526
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

  for (const value of Object.values(FormChangeItemId) as HeldItemId[]) {
    allHeldItems[value] = new FormChangeHeldItem(value, 1).unstealable().untransferable().unsuppressable();
  }
}

export function applyHeldItems<T extends HeldItemEffect>(effect: T, params: HeldItemEffectParamMap[T]) {
  const pokemon = params.pokemon;
  if (pokemon) {
    // TODO: Make this use `getHeldItems` and make `heldItems` array private
    for (const item of pokemon.heldItemManager.getHeldItems()) {
      const heldItem = allHeldItems[item];
      if (heldItem.effects.includes(effect)) {
        heldItem!.apply(effect, params);
      }
    }
  }
}
