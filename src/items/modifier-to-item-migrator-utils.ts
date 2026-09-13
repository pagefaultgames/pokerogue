import type { BerryType } from "#enums/berry-type";
import { FormChangeItemId } from "#enums/form-change-item-id";
import { HeldItemId } from "#enums/held-item-id";
import type { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { type PermanentStat, Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { TrainerItemId } from "#enums/trainer-item-id";
import { attackTypeToHeldItem } from "#items/attack-type-booster";
import { permanentStatToHeldItem } from "#items/base-stat-multiply";
import { berryTypeToHeldItem } from "#items/berry";
import type { SpeciesStatBoosterItemId } from "#items/stat-boost";
import type { PokemonItemMap } from "#types/held-item-data-types";
import type { TrainerItemSpecs } from "#types/trainer-item-data-types";

// #region Legacy modifier data types

/** Minimal required shape of a serialized legacy modifier. */
interface LegacyModifierEntry {
  className: string;
  typeId: string;
  stackCount: number;
  args: readonly unknown[];
}

/**
 * Ensure that a raw record has the properties required by {@linkcode LegacyModifierEntry}
 */
function isLegacyModifierEntry(entry: Record<string, unknown>): entry is Record<string, unknown> & LegacyModifierEntry {
  return (
    typeof entry.className === "string"
    && typeof entry.typeId === "string"
    && typeof entry.stackCount === "number"
    && Array.isArray(entry.args)
  );
}

type PokemonHeldItemModifierArgs = readonly [pokemonId: number];
type PokemonFormChangeItemModifierArgs = readonly [pokemonId: number, formChangeItem: number, active: boolean];
type BaseStatModifierArgs = readonly [pokemonId: number, stat: PermanentStat];
type AttackTypeBoosterModifierArgs = readonly [pokemonId: number, moveType: PokemonType, boostPercent: number];
type BerryModifierArgs = readonly [pokemonId: number, berryType: BerryType];
type SpeciesStatBoosterModifierArgs = readonly [
  pokemonId: number,
  stats: readonly Stat[],
  multiplier: number,
  species: readonly SpeciesId[],
];
type PokemonExpBoosterModifierArgs = readonly [pokemonId: number, boostPercent: number];
type PokemonBaseStatTotalModifierArgs = readonly [pokemonId: number, statModifier: number];
type DoubleBattleChanceBoosterModifierArgs = readonly [maxBattles: number, battleCount: number];
type TempStatStageBoosterModifierArgs = readonly [stat: Stat, maxBattles: number, battleCount: number];
type ExpBoosterModifierArgs = readonly [boostPercent: number];
type EnemyAttackStatusEffectChanceModifierArgs = readonly [effect: StatusEffect, chancePercent: number];
// #endregion Legacy modifier data types

// #region Held item conversion maps

// These regrettably can't be typed better on the modifier side
const uniqueModifierToItem: Record<string, HeldItemId> = {
  EvoTrackerModifier: HeldItemId.GIMMIGHOUL_EVO_TRACKER,
  PokemonBaseStatFlatModifier: HeldItemId.OLD_GATEAU,
  PokemonIncrementingStatModifier: HeldItemId.MACHO_BRACE,
  SurviveDamageModifier: HeldItemId.FOCUS_BAND,
  BypassSpeedChanceModifier: HeldItemId.QUICK_CLAW,
  FlinchChanceModifier: HeldItemId.KINGS_ROCK,
  TurnHealModifier: HeldItemId.LEFTOVERS,
  HitHealModifier: HeldItemId.SHELL_BELL,
  PokemonInstantReviveModifier: HeldItemId.REVIVER_SEED,
  ResetNegativeStatStageModifier: HeldItemId.WHITE_HERB,
  FieldEffectModifier: HeldItemId.MYSTICAL_ROCK,
  PokemonFriendshipBoosterModifier: HeldItemId.SOOTHE_BELL,
  PokemonNatureWeightModifier: HeldItemId.SOUL_DEW,
  PokemonMoveAccuracyBoosterModifier: HeldItemId.WIDE_LENS,
  PokemonMultiHitModifier: HeldItemId.MULTI_LENS,
  DamageMoneyRewardModifier: HeldItemId.GOLDEN_PUNCH,
  SwitchEffectTransferModifier: HeldItemId.BATON,
  TurnHeldItemTransferModifier: HeldItemId.MINI_BLACK_HOLE,
  ContactHeldItemTransferChanceModifier: HeldItemId.GRIP_CLAW,
  EvolutionStatBoosterModifier: HeldItemId.EVIOLITE,
  CritBoosterModifier: HeldItemId.SCOPE_LENS,
  SpeciesCritBoosterModifier: HeldItemId.LEEK,
};

// #endregion Held item conversion maps

// #region Trainer item conversion maps

const uniqueModifierToTrainerItem: Record<string, TrainerItemId> = {
  MoneyMultiplierModifier: TrainerItemId.AMULET_COIN,
  ExpShareModifier: TrainerItemId.EXP_SHARE,
  ExpBalanceModifier: TrainerItemId.EXP_BALANCE,
  MultipleParticipantExpBonusModifier: TrainerItemId.OVAL_CHARM,
  HealingBoosterModifier: TrainerItemId.HEALING_CHARM,
  LevelIncrementBoosterModifier: TrainerItemId.CANDY_JAR,
  PreserveBerryModifier: TrainerItemId.BERRY_POUCH,
  ShinyRateBoosterModifier: TrainerItemId.SHINY_CHARM,
  HiddenAbilityRateBoosterModifier: TrainerItemId.ABILITY_CHARM,
  CriticalCatchChanceBoosterModifier: TrainerItemId.CATCHING_CHARM,
  MapModifier: TrainerItemId.MAP,
  MegaEvolutionAccessModifier: TrainerItemId.MEGA_BRACELET,
  GigantamaxAccessModifier: TrainerItemId.DYNAMAX_BAND,
  TerastallizeAccessModifier: TrainerItemId.TERA_ORB,
  LockModifierTiersModifier: TrainerItemId.LOCK_CAPSULE,
  IvScannerModifier: TrainerItemId.IV_SCANNER,
  ExtraModifierModifier: TrainerItemId.GOLDEN_POKEBALL,
  BoostBugSpawnModifier: TrainerItemId.GOLDEN_BUG_NET,
  TempCritBoosterModifier: TrainerItemId.DIRE_HIT,

  // tokens
  EnemyDamageBoosterModifier: TrainerItemId.ENEMY_DAMAGE_BOOSTER,
  EnemyDamageReducerModifier: TrainerItemId.ENEMY_DAMAGE_REDUCTION,
  EnemyTurnHealModifier: TrainerItemId.ENEMY_HEAL,
  EnemyStatusEffectHealChanceModifier: TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE,
  EnemyEndureChanceModifier: TrainerItemId.ENEMY_ENDURE_CHANCE,
  EnemyFusionChanceModifier: TrainerItemId.ENEMY_FUSED_CHANCE,
};

const statusEffectToEnemyToken: Partial<Record<StatusEffect, TrainerItemId>> = {
  [StatusEffect.POISON]: TrainerItemId.ENEMY_ATTACK_POISON_CHANCE,
  [StatusEffect.PARALYSIS]: TrainerItemId.ENEMY_ATTACK_PARALYZE_CHANCE,
  [StatusEffect.BURN]: TrainerItemId.ENEMY_ATTACK_BURN_CHANCE,
};

const statToXItem: Record<number, TrainerItemId> = {
  [Stat.ATK]: TrainerItemId.X_ATTACK,
  [Stat.DEF]: TrainerItemId.X_DEFENSE,
  [Stat.SPATK]: TrainerItemId.X_SP_ATK,
  [Stat.SPDEF]: TrainerItemId.X_SP_DEF,
  [Stat.SPD]: TrainerItemId.X_SPEED,
  [Stat.ACC]: TrainerItemId.X_ACCURACY,
};

// #endregion Trainer item conversion maps

// #region Form change item conversion

/**
 * Convert a legacy `FormChangeItem` numerical enum value to a {@linkcode FormChangeItemId}.
 * @returns The appropriate {@linkcode FormChangeItemId}, or `null` of the passed number was not a valid `FormChangeItem`
 */
function convertOldFormChangeItem(oldValue: number): FormChangeItemId | null {
  // Mega stones: old 1-93 -> 0x0b01-0x0b5d
  if (oldValue >= 1 && oldValue <= 93) {
    return (oldValue + 0x0b00) as FormChangeItemId;
  }
  // Blue/Red Orb: old 100-101 -> 0x0b5e-0x0b5f
  if (oldValue === 100) {
    return FormChangeItemId.BLUE_ORB;
  }
  if (oldValue === 101) {
    return FormChangeItemId.RED_ORB;
  }
  // Rare form change items: old 102-114 -> 0x0bff-0x0bf3 (reversed order)
  if (oldValue >= 102 && oldValue <= 114) {
    return (0x0bff - (oldValue - 102)) as FormChangeItemId;
  }
  // Regular form change items: old 150-199 -> 0x0c01-0x0c32
  if (oldValue >= 150 && oldValue <= 199) {
    return (oldValue - 150 + 0x0c01) as FormChangeItemId;
  }
  return null;
}

// #endregion

// #region Category-based held item conversion

/**
 * Map a species stat booster (light ball, etc.) to the appropriate {@linkcode HeldItemId}
 * @returns The appropriate {@linkcode SpeciesStatBoosterItemId}, or `null` if the passed args don't represent a species stat booster
 */
function mapSpeciesStatBoosterToItem([
  ,
  stats,
  ,
  species,
]: SpeciesStatBoosterModifierArgs): SpeciesStatBoosterItemId | null {
  if (species.includes(SpeciesId.PIKACHU)) {
    return HeldItemId.LIGHT_BALL;
  }
  if (species.includes(SpeciesId.CUBONE)) {
    return HeldItemId.THICK_CLUB;
  }
  if (species.includes(SpeciesId.DITTO) && stats.includes(Stat.DEF)) {
    return HeldItemId.METAL_POWDER;
  }
  if (species.includes(SpeciesId.DITTO) && stats.includes(Stat.SPD)) {
    return HeldItemId.QUICK_POWDER;
  }
  if (species.includes(SpeciesId.CLAMPERL) && stats.includes(Stat.SPDEF)) {
    return HeldItemId.DEEP_SEA_SCALE;
  }
  if (species.includes(SpeciesId.CLAMPERL) && stats.includes(Stat.SPATK)) {
    return HeldItemId.DEEP_SEA_TOOTH;
  }
  return null;
}

/**
 * Resolve a held item ID for modifiers whose identity depends on constructor args.
 */
function mapArgsModifierToItem(className: string, typeId: string, args: readonly unknown[]): HeldItemId | null {
  switch (className) {
    case "BaseStatModifier": {
      const [, stat] = args as BaseStatModifierArgs;
      return permanentStatToHeldItem[stat] ?? null;
    }
    case "AttackTypeBoosterModifier": {
      const [, moveType] = args as AttackTypeBoosterModifierArgs;
      return attackTypeToHeldItem[moveType] ?? null;
    }
    case "BerryModifier": {
      const [, berryType] = args as BerryModifierArgs;
      return berryTypeToHeldItem[berryType] ?? null;
    }
    case "SpeciesStatBoosterModifier":
      if (!Array.isArray(args[1]) || !Array.isArray(args[3])) {
        return null;
      }
      return mapSpeciesStatBoosterToItem(args as SpeciesStatBoosterModifierArgs);
    case "TurnStatusEffectModifier":
      return typeId === "TOXIC_ORB" ? HeldItemId.TOXIC_ORB : typeId === "FLAME_ORB" ? HeldItemId.FLAME_ORB : null;
    case "PokemonExpBoosterModifier": {
      const [, boostPercent] = args as PokemonExpBoosterModifierArgs;
      return boostPercent === 100 ? HeldItemId.GOLDEN_EGG : HeldItemId.LUCKY_EGG;
    }
    case "PokemonBaseStatTotalModifier": {
      const [, statModifier] = args as PokemonBaseStatTotalModifierArgs;
      return statModifier > 0 ? HeldItemId.SHUCKLE_JUICE_GOOD : HeldItemId.SHUCKLE_JUICE_BAD;
    }

    default:
      return null;
  }
}

// #endregion

// #region Trainer item conversion for special cases

/**
 * Resolve a trainer item for modifiers whose identity depends on constructor args.
 */
function mapArgsModifierToTrainerItem(className: string, args: readonly unknown[]): TrainerItemSpecs | null {
  switch (className) {
    case "DoubleBattleChanceBoosterModifier": {
      const [maxBattles, battleCount] = args as DoubleBattleChanceBoosterModifierArgs;
      const id =
        maxBattles >= 30 ? TrainerItemId.MAX_LURE : maxBattles >= 15 ? TrainerItemId.SUPER_LURE : TrainerItemId.LURE;
      return { id, stack: battleCount };
    }
    case "TempStatStageBoosterModifier": {
      const [stat, , battleCount] = args as TempStatStageBoosterModifierArgs;
      const id = statToXItem[stat];
      return id ? { id, stack: battleCount } : null;
    }
    case "ExpBoosterModifier": {
      const [boostPercent] = args as ExpBoosterModifierArgs;
      const id =
        boostPercent >= 100
          ? TrainerItemId.GOLDEN_EXP_CHARM
          : boostPercent >= 60
            ? TrainerItemId.SUPER_EXP_CHARM
            : TrainerItemId.EXP_CHARM;
      return { id, stack: 1 };
    }
    case "HealShopCostModifier":
      return { id: TrainerItemId.BLACK_SLUDGE, stack: 1 };
    case "EnemyAttackStatusEffectChanceModifier": {
      const [effect] = args as EnemyAttackStatusEffectChanceModifierArgs;
      const id = statusEffectToEnemyToken[effect];
      return id ? { id, stack: 1 } : null;
    }
    default:
      return null;
  }
}

// #endregion

// #region Main conversion

interface ConvertedModifierData {
  heldItems: PokemonItemMap[];
  trainerItems: TrainerItemSpecs[];
}

/**
 * Convert an array of legacy `ModifierData` into the held item + trainer item format.
 * Malformed entries are skipped.
 *
 * @param data - Array of (unvalidated) serialized modifier data from the old save
 * @returns An object containing the converted held items (per-pokemon) and trainer items
 */
export function convertModifierSaveData(data: readonly Record<string, unknown>[]): ConvertedModifierData {
  const heldItems: PokemonItemMap[] = [];
  const trainerItems: TrainerItemSpecs[] = [];
  for (const entry of data) {
    if (!isLegacyModifierEntry(entry)) {
      console.warn("Skipping malformed modifier entry during item migration:", entry);
      continue;
    }
    const { typeId, args, stackCount, className } = entry;
    if (className === "PokemonFormChangeItemModifier") {
      const [pokemonId, oldFormChangeItem, active] = args as PokemonFormChangeItemModifierArgs;
      const newId = convertOldFormChangeItem(oldFormChangeItem);
      if (newId) {
        heldItems.push({
          item: { id: newId, stack: stackCount, active: !!active },
          pokemonId,
        });
      }
      continue;
    }

    if (className in uniqueModifierToItem) {
      const [pokemonId] = args as PokemonHeldItemModifierArgs;
      heldItems.push({
        item: { id: uniqueModifierToItem[className], stack: stackCount },
        pokemonId,
      });
      continue;
    }

    const categoryItemId = mapArgsModifierToItem(className, typeId, args);
    if (categoryItemId) {
      const [pokemonId] = args as PokemonHeldItemModifierArgs;
      heldItems.push({
        item: { id: categoryItemId, stack: stackCount },
        pokemonId,
      });
      continue;
    }

    if (className in uniqueModifierToTrainerItem) {
      trainerItems.push({
        id: uniqueModifierToTrainerItem[className],
        stack: stackCount,
      });
      continue;
    }

    const trainerItem = mapArgsModifierToTrainerItem(className, args);
    if (trainerItem) {
      trainerItems.push(trainerItem);
    }
  }

  return { heldItems, trainerItems };
}

// #endregion
