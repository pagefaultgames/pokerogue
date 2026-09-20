import { BerryType } from "#enums/berry-type";
import type { FormChangeItemId } from "#enums/form-change-item-id";
import { HeldItemId } from "#enums/held-item-id";
import { PokemonType, type RegularPokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { type PermanentStat, Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { TrainerItemId } from "#enums/trainer-item-id";
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
type AttackTypeBoosterModifierArgs = readonly [pokemonId: number, moveType: RegularPokemonType, boostPercent: number];
type BerryModifierArgs = readonly [pokemonId: number, berryType: BerryType];
type SpeciesStatBoosterModifierArgs = readonly [
  pokemonId: number,
  stats: readonly Stat[],
  multiplier: number,
  species: readonly SpeciesId[],
];
type PokemonExpBoosterModifierArgs = readonly [pokemonId: number, boostPercent: number];
type PokemonBaseStatTotalModifierArgs = readonly [pokemonId: number, statModifier: number];
type TempStatStageBoosterModifierArgs = readonly [stat: Stat, maxBattles: number, battleCount: number];
type LapsingModifierArgs = readonly [maxBattles: number, battleCount: number];
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
} as const;

// These are duplicated to avoid breaking this migrator if the live versions change in the future
const permanentStatToHeldItem: Partial<Record<PermanentStat, HeldItemId>> = {
  [Stat.HP]: HeldItemId.HP_UP,
  [Stat.ATK]: HeldItemId.PROTEIN,
  [Stat.DEF]: HeldItemId.IRON,
  [Stat.SPATK]: HeldItemId.CALCIUM,
  [Stat.SPDEF]: HeldItemId.ZINC,
  [Stat.SPD]: HeldItemId.CARBOS,
} as const;

const attackTypeToHeldItem: Partial<Record<PokemonType, HeldItemId>> = {
  [PokemonType.NORMAL]: HeldItemId.SILK_SCARF,
  [PokemonType.FIGHTING]: HeldItemId.BLACK_BELT,
  [PokemonType.FLYING]: HeldItemId.SHARP_BEAK,
  [PokemonType.POISON]: HeldItemId.POISON_BARB,
  [PokemonType.GROUND]: HeldItemId.SOFT_SAND,
  [PokemonType.ROCK]: HeldItemId.HARD_STONE,
  [PokemonType.BUG]: HeldItemId.SILVER_POWDER,
  [PokemonType.GHOST]: HeldItemId.SPELL_TAG,
  [PokemonType.STEEL]: HeldItemId.METAL_COAT,
  [PokemonType.FIRE]: HeldItemId.CHARCOAL,
  [PokemonType.WATER]: HeldItemId.MYSTIC_WATER,
  [PokemonType.GRASS]: HeldItemId.MIRACLE_SEED,
  [PokemonType.ELECTRIC]: HeldItemId.MAGNET,
  [PokemonType.PSYCHIC]: HeldItemId.TWISTED_SPOON,
  [PokemonType.ICE]: HeldItemId.NEVER_MELT_ICE,
  [PokemonType.DRAGON]: HeldItemId.DRAGON_FANG,
  [PokemonType.DARK]: HeldItemId.BLACK_GLASSES,
  [PokemonType.FAIRY]: HeldItemId.FAIRY_FEATHER,
} as const;

const berryTypeToHeldItem: Partial<Record<BerryType, HeldItemId>> = {
  [BerryType.SITRUS]: HeldItemId.SITRUS_BERRY,
  [BerryType.LUM]: HeldItemId.LUM_BERRY,
  [BerryType.ENIGMA]: HeldItemId.ENIGMA_BERRY,
  [BerryType.LIECHI]: HeldItemId.LIECHI_BERRY,
  [BerryType.GANLON]: HeldItemId.GANLON_BERRY,
  [BerryType.PETAYA]: HeldItemId.PETAYA_BERRY,
  [BerryType.APICOT]: HeldItemId.APICOT_BERRY,
  [BerryType.SALAC]: HeldItemId.SALAC_BERRY,
  [BerryType.LANSAT]: HeldItemId.LANSAT_BERRY,
  [BerryType.STARF]: HeldItemId.STARF_BERRY,
  [BerryType.LEPPA]: HeldItemId.LEPPA_BERRY,
} as const;

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
  HealShopCostModifier: TrainerItemId.BLACK_SLUDGE,

  // tokens
  EnemyDamageBoosterModifier: TrainerItemId.ENEMY_DAMAGE_BOOSTER,
  EnemyDamageReducerModifier: TrainerItemId.ENEMY_DAMAGE_REDUCTION,
  EnemyTurnHealModifier: TrainerItemId.ENEMY_HEAL,
  EnemyStatusEffectHealChanceModifier: TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE,
  EnemyEndureChanceModifier: TrainerItemId.ENEMY_ENDURE_CHANCE,
  EnemyFusionChanceModifier: TrainerItemId.ENEMY_FUSED_CHANCE,
} as const;

const statusEffectToEnemyToken: Partial<Record<StatusEffect, TrainerItemId>> = {
  [StatusEffect.POISON]: TrainerItemId.ENEMY_ATTACK_POISON_CHANCE,
  [StatusEffect.PARALYSIS]: TrainerItemId.ENEMY_ATTACK_PARALYZE_CHANCE,
  [StatusEffect.BURN]: TrainerItemId.ENEMY_ATTACK_BURN_CHANCE,
} as const;

const statToXItem: Partial<Record<Stat, TrainerItemId>> = {
  [Stat.ATK]: TrainerItemId.X_ATTACK,
  [Stat.DEF]: TrainerItemId.X_DEFENSE,
  [Stat.SPATK]: TrainerItemId.X_SP_ATK,
  [Stat.SPDEF]: TrainerItemId.X_SP_DEF,
  [Stat.SPD]: TrainerItemId.X_SPEED,
  [Stat.ACC]: TrainerItemId.X_ACCURACY,
} as const;

// #endregion Trainer item conversion maps

// #region Form change item conversion

/**
 * Convert a legacy `FormChangeItem` numerical enum value to a {@linkcode FormChangeItemId}.
 * @param oldFormChangeItem - The numerical value of the legacy `FormChangeItem` enum member
 * @returns The appropriate {@linkcode FormChangeItemId}, or `undefined` if the passed number was not a valid `FormChangeItem`
 */
function convertOldFormChangeItem(oldFormChangeItem: number): FormChangeItemId | undefined {
  // Mega stones: old 1-93 -> 0x0b01-0x0b5d
  if (oldFormChangeItem >= 1 && oldFormChangeItem <= 93) {
    return (oldFormChangeItem + 0x0b00) as FormChangeItemId;
  }
  // Blue Orb: old 100 -> 0x0b5e
  if (oldFormChangeItem === 100) {
    return 0x0b5e as FormChangeItemId;
  }
  // Red Orb: old 101 -> 0x0b5f
  if (oldFormChangeItem === 101) {
    return 0x0b5f as FormChangeItemId;
  }
  // Rare form change items: old 102-114 -> 0x0bff-0x0bf3 (reversed order)
  if (oldFormChangeItem >= 102 && oldFormChangeItem <= 114) {
    return (0x0bff - (oldFormChangeItem - 102)) as FormChangeItemId;
  }
  // Regular form change items: old 150-199 -> 0x0c01-0x0c32
  if (oldFormChangeItem >= 150 && oldFormChangeItem <= 199) {
    return (oldFormChangeItem - 150 + 0x0c01) as FormChangeItemId;
  }
  return;
}

// #endregion Form change item conversion

// #region Category-based held item conversion

/**
 * Map a species stat booster (light ball, etc.) to the appropriate {@linkcode HeldItemId}
 * @returns The appropriate {@linkcode SpeciesStatBoosterItemId}, or `undefined` if the passed args don't represent a species stat booster
 */
function mapSpeciesStatBoosterToItem([, stats, , species]: SpeciesStatBoosterModifierArgs):
  | SpeciesStatBoosterItemId
  | undefined {
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
  return;
}

/**
 * Resolve a held item ID for modifiers whose identity depends on constructor args.
 * @param className - The legacy modifier's class name
 * @param typeId - The legacy modifier's type ID
 * @param args - The legacy modifier's constructor args (unvalidated)
 * @returns The converted {@linkcode HeldItemId}, or `undefined` if no conversion applies or the args are malformed
 */
function mapArgsModifierToItem(className: string, typeId: string, args: readonly unknown[]): HeldItemId | undefined {
  switch (className) {
    case "BaseStatModifier": {
      const [, stat] = args as BaseStatModifierArgs;
      return permanentStatToHeldItem[stat];
    }
    case "AttackTypeBoosterModifier": {
      const [, moveType] = args as AttackTypeBoosterModifierArgs;
      return attackTypeToHeldItem[moveType];
    }
    case "BerryModifier": {
      const [, berryType] = args as BerryModifierArgs;
      return berryTypeToHeldItem[berryType];
    }
    case "SpeciesStatBoosterModifier":
      if (!Array.isArray(args[1]) || !Array.isArray(args[3])) {
        return;
      }
      return mapSpeciesStatBoosterToItem(args as SpeciesStatBoosterModifierArgs);
    case "TurnStatusEffectModifier":
      return {
        TOXIC_ORB: HeldItemId.TOXIC_ORB,
        FLAME_ORB: HeldItemId.FLAME_ORB,
      }[typeId];
    case "PokemonExpBoosterModifier": {
      const [, boostPercent] = args as PokemonExpBoosterModifierArgs;
      if (typeof boostPercent !== "number") {
        return;
      }
      return boostPercent === 100 ? HeldItemId.GOLDEN_EGG : HeldItemId.LUCKY_EGG;
    }
    case "PokemonBaseStatTotalModifier": {
      const [, statModifier] = args as PokemonBaseStatTotalModifierArgs;
      if (typeof statModifier !== "number") {
        return;
      }
      return statModifier > 0 ? HeldItemId.SHUCKLE_JUICE_GOOD : HeldItemId.SHUCKLE_JUICE_BAD;
    }
  }
}

// #endregion Category-based held item conversion

// #region Trainer item conversion for special cases

/**
 * Build the trainer item for a lapsing legacy modifier.
 * @param id - The {@linkcode TrainerItemId} to produce
 * @param battleCount - The legacy modifier's remaining battle count (unvalidated)
 * @returns The item specs, or `undefined` if `battleCount` is malformed or no battles remain
 */
function lapsingTrainerItem(id: TrainerItemId, battleCount: unknown): TrainerItemSpecs | undefined {
  if (typeof battleCount !== "number" || Number.isNaN(battleCount) || battleCount <= 0) {
    return;
  }
  return { id, stack: battleCount };
}

/**
 * Resolve a trainer item for modifiers whose identity depends on constructor args.
 * @param className - The legacy modifier's class name
 * @param args - The legacy modifier's constructor args (unvalidated)
 * @param stackCount - The legacy modifier's stack count
 * @returns The converted item specs or `undefined` if no conversion applies
 */
function mapArgsModifierToTrainerItem(
  className: string,
  args: readonly unknown[],
  stackCount: number,
): TrainerItemSpecs | undefined {
  switch (className) {
    case "DoubleBattleChanceBoosterModifier": {
      const [maxBattles, battleCount] = args as LapsingModifierArgs;
      if (maxBattles >= 30) {
        return lapsingTrainerItem(TrainerItemId.MAX_LURE, battleCount);
      }
      if (maxBattles >= 15) {
        return lapsingTrainerItem(TrainerItemId.SUPER_LURE, battleCount);
      }
      return lapsingTrainerItem(TrainerItemId.LURE, battleCount);
    }
    case "TempStatStageBoosterModifier": {
      const [stat, , battleCount] = args as TempStatStageBoosterModifierArgs;
      const id = statToXItem[stat];
      return id ? lapsingTrainerItem(id, battleCount) : undefined;
    }
    case "TempCritBoosterModifier": {
      const [, battleCount] = args as LapsingModifierArgs;
      return lapsingTrainerItem(TrainerItemId.DIRE_HIT, battleCount);
    }

    case "ExpBoosterModifier": {
      const [boostPercent] = args as ExpBoosterModifierArgs;
      if (boostPercent >= 100) {
        return { id: TrainerItemId.GOLDEN_EXP_CHARM, stack: stackCount };
      }
      if (boostPercent >= 60) {
        return { id: TrainerItemId.SUPER_EXP_CHARM, stack: stackCount };
      }
      return { id: TrainerItemId.EXP_CHARM, stack: stackCount };
    }
    case "EnemyAttackStatusEffectChanceModifier": {
      const [effect] = args as EnemyAttackStatusEffectChanceModifierArgs;
      const id = statusEffectToEnemyToken[effect];
      return id ? { id, stack: stackCount } : undefined;
    }

    default:
      return;
  }
}

// #endregion Trainer item conversion for special cases

// #region Main conversion

interface ConvertedModifierData {
  heldItems: PokemonItemMap[];
  trainerItems: TrainerItemSpecs[];
}

/**
 * Convert an array of legacy `ModifierData` into the held item + trainer item format.
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
      } else {
        console.warn(`Unrecognized legacy value ${oldFormChangeItem} during item migration:`, entry);
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

    const trainerItem = mapArgsModifierToTrainerItem(className, args, stackCount);
    if (trainerItem) {
      trainerItems.push(trainerItem);
      continue;
    }

    console.warn(`No item conversion or lapsed modifier "${className}", dropped entry:`, entry);
  }

  return { heldItems, trainerItems };
}

// #endregion Main conversion
