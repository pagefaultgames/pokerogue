import { pokemonEvolutions } from "#app/data/balance/pokemon-evolutions";
import type Pokemon from "#app/field/pokemon";
import type { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { Unlockables } from "#app/system/unlockables";
import { getEnumValues, isNullOrUndefined, randSeedInt } from "#app/utils/common";
import { Abilities } from "#enums/abilities";
import { BerryType } from "#enums/berry-type";
import { Moves } from "#enums/moves";
import { PokeballType } from "#enums/pokeball";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import { DoubleBattleChanceBoosterModifier, type EnemyPersistentModifier, type PersistentModifier } from "./modifier";
import {
  BerryModifier,
  type PokemonHeldItemModifier,
  SpeciesCritBoosterModifier,
  TurnStatusEffectModifier,
} from "./held-item-modifier";
import { ModifierTier } from "./modifier-tier";
import {
  FormChangeItemModifierType,
  getModifierType,
  type ModifierOverride,
  type ModifierType,
  type ModifierTypeFunc,
  ModifierTypeGenerator,
  type ModifierTypeKeys,
  ModifierTypeOption,
  modifierTypes,
  PokemonHeldItemModifierType,
} from "./modifier-type";
import { getPartyLuckValue, hasMaximumBalls } from "./modifier-utils";
import Overrides from "#app/overrides";
import { ModifierPoolType } from "./modifier-pool-type";

const outputModifierData = false;
const useMaxWeightForOutput = false;

interface ModifierPool {
  [tier: string]: WeightedModifierType[];
}

export class WeightedModifierType {
  public modifierType: ModifierType;
  public weight: number | WeightedModifierTypeWeightFunc;
  public maxWeight: number | WeightedModifierTypeWeightFunc;

  constructor(
    modifierTypeFunc: ModifierTypeFunc,
    weight: number | WeightedModifierTypeWeightFunc,
    maxWeight?: number | WeightedModifierTypeWeightFunc,
  ) {
    this.modifierType = modifierTypeFunc();
    this.modifierType.id = Object.keys(modifierTypes).find(k => modifierTypes[k] === modifierTypeFunc)!; // TODO: is this bang correct?
    this.weight = weight;
    this.maxWeight = maxWeight || (!(weight instanceof Function) ? weight : 0);
  }

  setTier(tier: ModifierTier) {
    this.modifierType.setTier(tier);
  }
}

type WeightedModifierTypeWeightFunc = (party: Pokemon[], rerollCount?: number) => number;

/**
 * High order function that returns a WeightedModifierTypeWeightFunc that will only be applied on
 * classic and skip an ModifierType if current wave is greater or equal to the one passed down
 * @param wave - Wave where we should stop showing the modifier
 * @param defaultWeight - ModifierType default weight
 * @returns A WeightedModifierTypeWeightFunc
 */
export function skipInClassicAfterWave(wave: number, defaultWeight: number): WeightedModifierTypeWeightFunc {
  return () => {
    const gameMode = globalScene.gameMode;
    const currentWave = globalScene.currentBattle.waveIndex;
    return gameMode.isClassic && currentWave >= wave ? 0 : defaultWeight;
  };
}

/**
 * High order function that returns a WeightedModifierTypeWeightFunc that will only be applied on
 * classic and it will skip a ModifierType if it is the last wave pull.
 * @param defaultWeight ModifierType default weight
 * @returns A WeightedModifierTypeWeightFunc
 */
export function skipInLastClassicWaveOrDefault(defaultWeight: number): WeightedModifierTypeWeightFunc {
  return skipInClassicAfterWave(199, defaultWeight);
}

/**
 * High order function that returns a WeightedModifierTypeWeightFunc to ensure Lures don't spawn on Classic 199
 * or if the lure still has over 60% of its duration left
 * @param maxBattles The max battles the lure type in question lasts. 10 for green, 15 for Super, 30 for Max
 * @param weight The desired weight for the lure when it does spawn
 * @returns A WeightedModifierTypeWeightFunc
 */
export function lureWeightFunc(maxBattles: number, weight: number): WeightedModifierTypeWeightFunc {
  return () => {
    const lures = globalScene.getModifiers(DoubleBattleChanceBoosterModifier);
    return !(globalScene.gameMode.isClassic && globalScene.currentBattle.waveIndex === 199) &&
      (lures.length === 0 ||
        lures.filter(m => m.getMaxBattles() === maxBattles && m.getBattleCount() >= maxBattles * 0.6).length === 0)
      ? weight
      : 0;
  };
}

const modifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.POKEBALL, () => (hasMaximumBalls(PokeballType.POKEBALL) ? 0 : 6), 6),
    new WeightedModifierType(modifierTypes.RARE_CANDY, 2),
    new WeightedModifierType(
      modifierTypes.POTION,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(p => p.getInverseHp() >= 10 && p.getHpRatio() <= 0.875 && !p.isFainted()).length,
          3,
        );
        return thresholdPartyMemberCount * 3;
      },
      9,
    ),
    new WeightedModifierType(
      modifierTypes.SUPER_POTION,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(p => p.getInverseHp() >= 25 && p.getHpRatio() <= 0.75 && !p.isFainted()).length,
          3,
        );
        return thresholdPartyMemberCount;
      },
      3,
    ),
    new WeightedModifierType(
      modifierTypes.ETHER,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp &&
              !p.getHeldItems().some(m => m instanceof BerryModifier && m.berryType === BerryType.LEPPA) &&
              p
                .getMoveset()
                .filter(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2))
                .length,
          ).length,
          3,
        );
        return thresholdPartyMemberCount * 3;
      },
      9,
    ),
    new WeightedModifierType(
      modifierTypes.MAX_ETHER,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp &&
              !p.getHeldItems().some(m => m instanceof BerryModifier && m.berryType === BerryType.LEPPA) &&
              p
                .getMoveset()
                .filter(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2))
                .length,
          ).length,
          3,
        );
        return thresholdPartyMemberCount;
      },
      3,
    ),
    new WeightedModifierType(modifierTypes.LURE, lureWeightFunc(10, 2)),
    new WeightedModifierType(modifierTypes.TEMP_STAT_STAGE_BOOSTER, 4),
    new WeightedModifierType(modifierTypes.BERRY, 2),
    new WeightedModifierType(modifierTypes.TM_COMMON, 2),
  ].map(m => {
    m.setTier(ModifierTier.COMMON);
    return m;
  }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.GREAT_BALL, () => (hasMaximumBalls(PokeballType.GREAT_BALL) ? 0 : 6), 6),
    new WeightedModifierType(modifierTypes.PP_UP, 2),
    new WeightedModifierType(
      modifierTypes.FULL_HEAL,
      (party: Pokemon[]) => {
        const statusEffectPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp &&
              !!p.status &&
              !p.getHeldItems().some(i => {
                if (i instanceof TurnStatusEffectModifier) {
                  return (i as TurnStatusEffectModifier).getStatusEffect() === p.status?.effect;
                }
                return false;
              }),
          ).length,
          3,
        );
        return statusEffectPartyMemberCount * 6;
      },
      18,
    ),
    new WeightedModifierType(
      modifierTypes.REVIVE,
      (party: Pokemon[]) => {
        const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
        return faintedPartyMemberCount * 9;
      },
      27,
    ),
    new WeightedModifierType(
      modifierTypes.MAX_REVIVE,
      (party: Pokemon[]) => {
        const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
        return faintedPartyMemberCount * 3;
      },
      9,
    ),
    new WeightedModifierType(
      modifierTypes.SACRED_ASH,
      (party: Pokemon[]) => {
        return party.filter(p => p.isFainted()).length >= Math.ceil(party.length / 2) ? 1 : 0;
      },
      1,
    ),
    new WeightedModifierType(
      modifierTypes.HYPER_POTION,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(p => p.getInverseHp() >= 100 && p.getHpRatio() <= 0.625 && !p.isFainted()).length,
          3,
        );
        return thresholdPartyMemberCount * 3;
      },
      9,
    ),
    new WeightedModifierType(
      modifierTypes.MAX_POTION,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(p => p.getInverseHp() >= 100 && p.getHpRatio() <= 0.5 && !p.isFainted()).length,
          3,
        );
        return thresholdPartyMemberCount;
      },
      3,
    ),
    new WeightedModifierType(
      modifierTypes.FULL_RESTORE,
      (party: Pokemon[]) => {
        const statusEffectPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp &&
              !!p.status &&
              !p.getHeldItems().some(i => {
                if (i instanceof TurnStatusEffectModifier) {
                  return (i as TurnStatusEffectModifier).getStatusEffect() === p.status?.effect;
                }
                return false;
              }),
          ).length,
          3,
        );
        const thresholdPartyMemberCount = Math.floor(
          (Math.min(party.filter(p => p.getInverseHp() >= 100 && p.getHpRatio() <= 0.5 && !p.isFainted()).length, 3) +
            statusEffectPartyMemberCount) /
            2,
        );
        return thresholdPartyMemberCount;
      },
      3,
    ),
    new WeightedModifierType(
      modifierTypes.ELIXIR,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp &&
              !p.getHeldItems().some(m => m instanceof BerryModifier && m.berryType === BerryType.LEPPA) &&
              p
                .getMoveset()
                .filter(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2))
                .length,
          ).length,
          3,
        );
        return thresholdPartyMemberCount * 3;
      },
      9,
    ),
    new WeightedModifierType(
      modifierTypes.MAX_ELIXIR,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp &&
              !p.getHeldItems().some(m => m instanceof BerryModifier && m.berryType === BerryType.LEPPA) &&
              p
                .getMoveset()
                .filter(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2))
                .length,
          ).length,
          3,
        );
        return thresholdPartyMemberCount;
      },
      3,
    ),
    new WeightedModifierType(modifierTypes.DIRE_HIT, 4),
    new WeightedModifierType(modifierTypes.SUPER_LURE, lureWeightFunc(15, 4)),
    new WeightedModifierType(modifierTypes.NUGGET, skipInLastClassicWaveOrDefault(5)),
    new WeightedModifierType(modifierTypes.SPECIES_STAT_BOOSTER, 4),
    new WeightedModifierType(
      modifierTypes.EVOLUTION_ITEM,
      () => {
        return Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 15), 8);
      },
      8,
    ),
    new WeightedModifierType(
      modifierTypes.MAP,
      () => (globalScene.gameMode.isClassic && globalScene.currentBattle.waveIndex < 180 ? 2 : 0),
      2,
    ),
    new WeightedModifierType(modifierTypes.SOOTHE_BELL, 2),
    new WeightedModifierType(modifierTypes.TM_GREAT, 3),
    new WeightedModifierType(
      modifierTypes.MEMORY_MUSHROOM,
      (party: Pokemon[]) => {
        if (!party.find(p => p.getLearnableLevelMoves().length)) {
          return 0;
        }
        const highestPartyLevel = party
          .map(p => p.level)
          .reduce((highestLevel: number, level: number) => Math.max(highestLevel, level), 1);
        return Math.min(Math.ceil(highestPartyLevel / 20), 4);
      },
      4,
    ),
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3),
    new WeightedModifierType(modifierTypes.TERA_SHARD, (party: Pokemon[]) =>
      party.filter(
        p => !(p.hasSpecies(Species.TERAPAGOS) || p.hasSpecies(Species.OGERPON) || p.hasSpecies(Species.SHEDINJA)),
      ).length > 0
        ? 1
        : 0,
    ),
    new WeightedModifierType(
      modifierTypes.DNA_SPLICERS,
      (party: Pokemon[]) => {
        if (party.filter(p => !p.fusionSpecies).length > 1) {
          if (globalScene.gameMode.isSplicedOnly) {
            return 4;
          }
          if (globalScene.gameMode.isClassic && timedEventManager.areFusionsBoosted()) {
            return 2;
          }
        }
        return 0;
      },
      4,
    ),
    new WeightedModifierType(
      modifierTypes.VOUCHER,
      (_party: Pokemon[], rerollCount: number) => (!globalScene.gameMode.isDaily ? Math.max(1 - rerollCount, 0) : 0),
      1,
    ),
  ].map(m => {
    m.setTier(ModifierTier.GREAT);
    return m;
  }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ULTRA_BALL, () => (hasMaximumBalls(PokeballType.ULTRA_BALL) ? 0 : 15), 15),
    new WeightedModifierType(modifierTypes.MAX_LURE, lureWeightFunc(30, 4)),
    new WeightedModifierType(modifierTypes.BIG_NUGGET, skipInLastClassicWaveOrDefault(12)),
    new WeightedModifierType(modifierTypes.PP_MAX, 3),
    new WeightedModifierType(modifierTypes.MINT, 4),
    new WeightedModifierType(
      modifierTypes.RARE_EVOLUTION_ITEM,
      () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 15) * 4, 32),
      32,
    ),
    new WeightedModifierType(
      modifierTypes.FORM_CHANGE_ITEM,
      () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 50), 4) * 6,
      24,
    ),
    new WeightedModifierType(modifierTypes.AMULET_COIN, skipInLastClassicWaveOrDefault(3)),
    new WeightedModifierType(modifierTypes.EVIOLITE, (party: Pokemon[]) => {
      const { gameMode, gameData } = globalScene;
      if (gameMode.isDaily || (!gameMode.isFreshStartChallenge() && gameData.isUnlocked(Unlockables.EVIOLITE))) {
        return party.some(p => {
          // Check if Pokemon's species (or fusion species, if applicable) can evolve or if they're G-Max'd
          if (
            !p.isMax() &&
            (p.getSpeciesForm(true).speciesId in pokemonEvolutions ||
              (p.isFusion() && p.getFusionSpeciesForm(true).speciesId in pokemonEvolutions))
          ) {
            // Check if Pokemon is already holding an Eviolite
            return !p.getHeldItems().some(i => i.type.id === "EVIOLITE");
          }
          return false;
        })
          ? 10
          : 0;
      }
      return 0;
    }),
    new WeightedModifierType(modifierTypes.RARE_SPECIES_STAT_BOOSTER, 12),
    new WeightedModifierType(
      modifierTypes.LEEK,
      (party: Pokemon[]) => {
        const checkedSpecies = [Species.FARFETCHD, Species.GALAR_FARFETCHD, Species.SIRFETCHD];
        // If a party member doesn't already have a Leek and is one of the relevant species, Leek can appear
        return party.some(
          p =>
            !p.getHeldItems().some(i => i instanceof SpeciesCritBoosterModifier) &&
            (checkedSpecies.includes(p.getSpeciesForm(true).speciesId) ||
              (p.isFusion() && checkedSpecies.includes(p.getFusionSpeciesForm(true).speciesId))),
        )
          ? 12
          : 0;
      },
      12,
    ),
    new WeightedModifierType(
      modifierTypes.TOXIC_ORB,
      (party: Pokemon[]) => {
        return party.some(p => {
          const isHoldingOrb = p.getHeldItems().some(i => i.type.id === "FLAME_ORB" || i.type.id === "TOXIC_ORB");

          if (!isHoldingOrb) {
            const moveset = p
              .getMoveset(true)
              .filter(m => !isNullOrUndefined(m))
              .map(m => m.moveId);
            const canSetStatus = p.canSetStatus(StatusEffect.TOXIC, true, true, null, true);

            // Moves that take advantage of obtaining the actual status effect
            const hasStatusMoves = [Moves.FACADE, Moves.PSYCHO_SHIFT].some(m => moveset.includes(m));
            // Moves that take advantage of being able to give the target a status orb
            // TODO: Take moves (Trick, Fling, Switcheroo) from comment when they are implemented
            const hasItemMoves = [
              /* Moves.TRICK, Moves.FLING, Moves.SWITCHEROO */
            ].some(m => moveset.includes(m));

            if (canSetStatus) {
              // Abilities that take advantage of obtaining the actual status effect, separated based on specificity to the orb
              const hasGeneralAbility = [
                Abilities.QUICK_FEET,
                Abilities.GUTS,
                Abilities.MARVEL_SCALE,
                Abilities.MAGIC_GUARD,
              ].some(a => p.hasAbility(a, false, true));
              const hasSpecificAbility = [Abilities.TOXIC_BOOST, Abilities.POISON_HEAL].some(a =>
                p.hasAbility(a, false, true),
              );
              const hasOppositeAbility = [Abilities.FLARE_BOOST].some(a => p.hasAbility(a, false, true));

              return hasSpecificAbility || (hasGeneralAbility && !hasOppositeAbility) || hasStatusMoves;
            }
            return hasItemMoves;
          }

          return false;
        })
          ? 10
          : 0;
      },
      10,
    ),
    new WeightedModifierType(
      modifierTypes.FLAME_ORB,
      (party: Pokemon[]) => {
        return party.some(p => {
          const isHoldingOrb = p.getHeldItems().some(i => i.type.id === "FLAME_ORB" || i.type.id === "TOXIC_ORB");

          if (!isHoldingOrb) {
            const moveset = p
              .getMoveset(true)
              .filter(m => !isNullOrUndefined(m))
              .map(m => m.moveId);
            const canSetStatus = p.canSetStatus(StatusEffect.BURN, true, true, null, true);

            // Moves that take advantage of obtaining the actual status effect
            const hasStatusMoves = [Moves.FACADE, Moves.PSYCHO_SHIFT].some(m => moveset.includes(m));
            // Moves that take advantage of being able to give the target a status orb
            // TODO: Take moves (Trick, Fling, Switcheroo) from comment when they are implemented
            const hasItemMoves = [
              /* Moves.TRICK, Moves.FLING, Moves.SWITCHEROO */
            ].some(m => moveset.includes(m));

            if (canSetStatus) {
              // Abilities that take advantage of obtaining the actual status effect, separated based on specificity to the orb
              const hasGeneralAbility = [
                Abilities.QUICK_FEET,
                Abilities.GUTS,
                Abilities.MARVEL_SCALE,
                Abilities.MAGIC_GUARD,
              ].some(a => p.hasAbility(a, false, true));
              const hasSpecificAbility = [Abilities.FLARE_BOOST].some(a => p.hasAbility(a, false, true));
              const hasOppositeAbility = [Abilities.TOXIC_BOOST, Abilities.POISON_HEAL].some(a =>
                p.hasAbility(a, false, true),
              );

              return hasSpecificAbility || (hasGeneralAbility && !hasOppositeAbility) || hasStatusMoves;
            }
            return hasItemMoves;
          }

          return false;
        })
          ? 10
          : 0;
      },
      10,
    ),
    new WeightedModifierType(
      modifierTypes.MYSTICAL_ROCK,
      (party: Pokemon[]) => {
        return party.some(p => {
          let isHoldingMax = false;
          for (const i of p.getHeldItems()) {
            if (i.type.id === "MYSTICAL_ROCK") {
              isHoldingMax = i.getStackCount() === i.getMaxStackCount();
              break;
            }
          }

          if (!isHoldingMax) {
            const moveset = p.getMoveset(true).map(m => m.moveId);

            const hasAbility = [
              Abilities.DROUGHT,
              Abilities.ORICHALCUM_PULSE,
              Abilities.DRIZZLE,
              Abilities.SAND_STREAM,
              Abilities.SAND_SPIT,
              Abilities.SNOW_WARNING,
              Abilities.ELECTRIC_SURGE,
              Abilities.HADRON_ENGINE,
              Abilities.PSYCHIC_SURGE,
              Abilities.GRASSY_SURGE,
              Abilities.SEED_SOWER,
              Abilities.MISTY_SURGE,
            ].some(a => p.hasAbility(a, false, true));

            const hasMoves = [
              Moves.SUNNY_DAY,
              Moves.RAIN_DANCE,
              Moves.SANDSTORM,
              Moves.SNOWSCAPE,
              Moves.HAIL,
              Moves.CHILLY_RECEPTION,
              Moves.ELECTRIC_TERRAIN,
              Moves.PSYCHIC_TERRAIN,
              Moves.GRASSY_TERRAIN,
              Moves.MISTY_TERRAIN,
            ].some(m => moveset.includes(m));

            return hasAbility || hasMoves;
          }
          return false;
        })
          ? 10
          : 0;
      },
      10,
    ),
    new WeightedModifierType(modifierTypes.REVIVER_SEED, 4),
    new WeightedModifierType(modifierTypes.CANDY_JAR, skipInLastClassicWaveOrDefault(5)),
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 9),
    new WeightedModifierType(modifierTypes.TM_ULTRA, 11),
    new WeightedModifierType(modifierTypes.RARER_CANDY, 4),
    new WeightedModifierType(modifierTypes.GOLDEN_PUNCH, skipInLastClassicWaveOrDefault(2)),
    new WeightedModifierType(modifierTypes.IV_SCANNER, skipInLastClassicWaveOrDefault(4)),
    new WeightedModifierType(modifierTypes.EXP_CHARM, skipInLastClassicWaveOrDefault(8)),
    new WeightedModifierType(modifierTypes.EXP_SHARE, skipInLastClassicWaveOrDefault(10)),
    new WeightedModifierType(
      modifierTypes.TERA_ORB,
      () =>
        !globalScene.gameMode.isClassic
          ? Math.min(Math.max(Math.floor(globalScene.currentBattle.waveIndex / 50) * 2, 1), 4)
          : 0,
      4,
    ),
    new WeightedModifierType(modifierTypes.QUICK_CLAW, 3),
    new WeightedModifierType(modifierTypes.WIDE_LENS, 7),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA);
    return m;
  }),
  [ModifierTier.ROGUE]: [
    new WeightedModifierType(modifierTypes.ROGUE_BALL, () => (hasMaximumBalls(PokeballType.ROGUE_BALL) ? 0 : 16), 16),
    new WeightedModifierType(modifierTypes.RELIC_GOLD, skipInLastClassicWaveOrDefault(2)),
    new WeightedModifierType(modifierTypes.LEFTOVERS, 3),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 3),
    new WeightedModifierType(modifierTypes.BERRY_POUCH, 4),
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 5),
    new WeightedModifierType(modifierTypes.SCOPE_LENS, 4),
    new WeightedModifierType(modifierTypes.BATON, 2),
    new WeightedModifierType(modifierTypes.SOUL_DEW, 7),
    new WeightedModifierType(modifierTypes.CATCHING_CHARM, () => (!globalScene.gameMode.isClassic ? 4 : 0), 4),
    new WeightedModifierType(modifierTypes.ABILITY_CHARM, skipInClassicAfterWave(189, 6)),
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 5),
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 3),
    new WeightedModifierType(modifierTypes.LOCK_CAPSULE, () => (globalScene.gameMode.isClassic ? 0 : 3)),
    new WeightedModifierType(modifierTypes.SUPER_EXP_CHARM, skipInLastClassicWaveOrDefault(8)),
    new WeightedModifierType(
      modifierTypes.RARE_FORM_CHANGE_ITEM,
      () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 50), 4) * 6,
      24,
    ),
    new WeightedModifierType(
      modifierTypes.MEGA_BRACELET,
      () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 50), 4) * 9,
      36,
    ),
    new WeightedModifierType(
      modifierTypes.DYNAMAX_BAND,
      () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 50), 4) * 9,
      36,
    ),
    new WeightedModifierType(
      modifierTypes.VOUCHER_PLUS,
      (_party: Pokemon[], rerollCount: number) =>
        !globalScene.gameMode.isDaily ? Math.max(3 - rerollCount * 1, 0) : 0,
      3,
    ),
  ].map(m => {
    m.setTier(ModifierTier.ROGUE);
    return m;
  }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.MASTER_BALL, () => (hasMaximumBalls(PokeballType.MASTER_BALL) ? 0 : 24), 24),
    new WeightedModifierType(modifierTypes.SHINY_CHARM, 14),
    new WeightedModifierType(modifierTypes.HEALING_CHARM, 18),
    new WeightedModifierType(modifierTypes.MULTI_LENS, 18),
    new WeightedModifierType(
      modifierTypes.VOUCHER_PREMIUM,
      (_party: Pokemon[], rerollCount: number) =>
        !globalScene.gameMode.isDaily && !globalScene.gameMode.isEndless && !globalScene.gameMode.isSplicedOnly
          ? Math.max(5 - rerollCount * 2, 0)
          : 0,
      5,
    ),
    new WeightedModifierType(
      modifierTypes.DNA_SPLICERS,
      (party: Pokemon[]) =>
        !(globalScene.gameMode.isClassic && timedEventManager.areFusionsBoosted()) &&
        !globalScene.gameMode.isSplicedOnly &&
        party.filter(p => !p.fusionSpecies).length > 1
          ? 24
          : 0,
      24,
    ),
    new WeightedModifierType(
      modifierTypes.MINI_BLACK_HOLE,
      () =>
        globalScene.gameMode.isDaily ||
        (!globalScene.gameMode.isFreshStartChallenge() && globalScene.gameData.isUnlocked(Unlockables.MINI_BLACK_HOLE))
          ? 1
          : 0,
      1,
    ),
  ].map(m => {
    m.setTier(ModifierTier.MASTER);
    return m;
  }),
};

const wildModifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [new WeightedModifierType(modifierTypes.BERRY, 1)].map(m => {
    m.setTier(ModifierTier.COMMON);
    return m;
  }),
  [ModifierTier.GREAT]: [new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 1)].map(m => {
    m.setTier(ModifierTier.GREAT);
    return m;
  }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 10),
    new WeightedModifierType(modifierTypes.WHITE_HERB, 0),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA);
    return m;
  }),
  [ModifierTier.ROGUE]: [new WeightedModifierType(modifierTypes.LUCKY_EGG, 4)].map(m => {
    m.setTier(ModifierTier.ROGUE);
    return m;
  }),
  [ModifierTier.MASTER]: [new WeightedModifierType(modifierTypes.GOLDEN_EGG, 1)].map(m => {
    m.setTier(ModifierTier.MASTER);
    return m;
  }),
};

const trainerModifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.BERRY, 8),
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3),
  ].map(m => {
    m.setTier(ModifierTier.COMMON);
    return m;
  }),
  [ModifierTier.GREAT]: [new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3)].map(m => {
    m.setTier(ModifierTier.GREAT);
    return m;
  }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 10),
    new WeightedModifierType(modifierTypes.WHITE_HERB, 0),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA);
    return m;
  }),
  [ModifierTier.ROGUE]: [
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 2),
    new WeightedModifierType(modifierTypes.LUCKY_EGG, 4),
    new WeightedModifierType(modifierTypes.QUICK_CLAW, 1),
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 1),
    new WeightedModifierType(modifierTypes.WIDE_LENS, 1),
  ].map(m => {
    m.setTier(ModifierTier.ROGUE);
    return m;
  }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 1),
    new WeightedModifierType(modifierTypes.LEFTOVERS, 1),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 1),
    new WeightedModifierType(modifierTypes.SCOPE_LENS, 1),
  ].map(m => {
    m.setTier(ModifierTier.MASTER);
    return m;
  }),
};

const enemyBuffModifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_BOOSTER, 9),
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_REDUCTION, 9),
    new WeightedModifierType(modifierTypes.ENEMY_ATTACK_POISON_CHANCE, 3),
    new WeightedModifierType(modifierTypes.ENEMY_ATTACK_PARALYZE_CHANCE, 3),
    new WeightedModifierType(modifierTypes.ENEMY_ATTACK_BURN_CHANCE, 3),
    new WeightedModifierType(modifierTypes.ENEMY_STATUS_EFFECT_HEAL_CHANCE, 9),
    new WeightedModifierType(modifierTypes.ENEMY_ENDURE_CHANCE, 4),
    new WeightedModifierType(modifierTypes.ENEMY_FUSED_CHANCE, 1),
  ].map(m => {
    m.setTier(ModifierTier.COMMON);
    return m;
  }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_BOOSTER, 5),
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_REDUCTION, 5),
    new WeightedModifierType(modifierTypes.ENEMY_STATUS_EFFECT_HEAL_CHANCE, 5),
    new WeightedModifierType(modifierTypes.ENEMY_ENDURE_CHANCE, 5),
    new WeightedModifierType(modifierTypes.ENEMY_FUSED_CHANCE, 1),
  ].map(m => {
    m.setTier(ModifierTier.GREAT);
    return m;
  }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_BOOSTER, 10),
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_REDUCTION, 10),
    new WeightedModifierType(modifierTypes.ENEMY_HEAL, 10),
    new WeightedModifierType(modifierTypes.ENEMY_STATUS_EFFECT_HEAL_CHANCE, 10),
    new WeightedModifierType(modifierTypes.ENEMY_ENDURE_CHANCE, 10),
    new WeightedModifierType(modifierTypes.ENEMY_FUSED_CHANCE, 5),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA);
    return m;
  }),
  [ModifierTier.ROGUE]: [].map((m: WeightedModifierType) => {
    m.setTier(ModifierTier.ROGUE);
    return m;
  }),
  [ModifierTier.MASTER]: [].map((m: WeightedModifierType) => {
    m.setTier(ModifierTier.MASTER);
    return m;
  }),
};

const dailyStarterModifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 1),
    new WeightedModifierType(modifierTypes.BERRY, 3),
  ].map(m => {
    m.setTier(ModifierTier.COMMON);
    return m;
  }),
  [ModifierTier.GREAT]: [new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 5)].map(m => {
    m.setTier(ModifierTier.GREAT);
    return m;
  }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.REVIVER_SEED, 4),
    new WeightedModifierType(modifierTypes.SOOTHE_BELL, 1),
    new WeightedModifierType(modifierTypes.SOUL_DEW, 1),
    new WeightedModifierType(modifierTypes.GOLDEN_PUNCH, 1),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA);
    return m;
  }),
  [ModifierTier.ROGUE]: [
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 5),
    new WeightedModifierType(modifierTypes.BATON, 2),
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 5),
    new WeightedModifierType(modifierTypes.QUICK_CLAW, 3),
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 3),
  ].map(m => {
    m.setTier(ModifierTier.ROGUE);
    return m;
  }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.LEFTOVERS, 1),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 1),
  ].map(m => {
    m.setTier(ModifierTier.MASTER);
    return m;
  }),
};

let modifierPoolThresholds = {};
let ignoredPoolIndexes = {};

let dailyStarterModifierPoolThresholds = {};
// biome-ignore lint/correctness/noUnusedVariables: TODO explain why this is marked as OK
let ignoredDailyStarterPoolIndexes = {};

let enemyModifierPoolThresholds = {};
// biome-ignore lint/correctness/noUnusedVariables: TODO explain why this is marked as OK
let enemyIgnoredPoolIndexes = {};

let enemyBuffModifierPoolThresholds = {};
// biome-ignore lint/correctness/noUnusedVariables: TODO explain why this is marked as OK
let enemyBuffIgnoredPoolIndexes = {};

export function getModifierPoolForType(poolType: ModifierPoolType): ModifierPool {
  let pool: ModifierPool;
  switch (poolType) {
    case ModifierPoolType.PLAYER:
      pool = modifierPool;
      break;
    case ModifierPoolType.WILD:
      pool = wildModifierPool;
      break;
    case ModifierPoolType.TRAINER:
      pool = trainerModifierPool;
      break;
    case ModifierPoolType.ENEMY_BUFF:
      pool = enemyBuffModifierPool;
      break;
    case ModifierPoolType.DAILY_STARTER:
      pool = dailyStarterModifierPool;
      break;
  }
  return pool;
}

const tierWeights = [768 / 1024, 195 / 1024, 48 / 1024, 12 / 1024, 1 / 1024];
/**
 * Allows a unit test to check if an item exists in the Modifier Pool. Checks the pool directly, rather than attempting to reroll for the item.
 */
export const itemPoolChecks: Map<ModifierTypeKeys, boolean | undefined> = new Map();

export function regenerateModifierPoolThresholds(party: Pokemon[], poolType: ModifierPoolType, rerollCount = 0) {
  const pool = getModifierPoolForType(poolType);
  itemPoolChecks.forEach((_v, k) => {
    itemPoolChecks.set(k, false);
  });

  const ignoredIndexes = {};
  const modifierTableData = {};
  const thresholds = Object.fromEntries(
    new Map(
      Object.keys(pool).map(t => {
        ignoredIndexes[t] = [];
        const thresholds = new Map();
        const tierModifierIds: string[] = [];
        let tierMaxWeight = 0;
        let i = 0;
        pool[t].reduce((total: number, modifierType: WeightedModifierType) => {
          const weightedModifierType = modifierType as WeightedModifierType;
          const existingModifiers = globalScene.findModifiers(
            m => m.type.id === weightedModifierType.modifierType.id,
            poolType === ModifierPoolType.PLAYER,
          );
          const itemModifierType =
            weightedModifierType.modifierType instanceof ModifierTypeGenerator
              ? weightedModifierType.modifierType.generateType(party)
              : weightedModifierType.modifierType;
          const weight =
            !existingModifiers.length ||
            itemModifierType instanceof PokemonHeldItemModifierType ||
            itemModifierType instanceof FormChangeItemModifierType ||
            existingModifiers.find(m => m.stackCount < m.getMaxStackCount(true))
              ? weightedModifierType.weight instanceof Function
                ? // biome-ignore lint/complexity/noBannedTypes: TODO: refactor to not use Function type
                  (weightedModifierType.weight as Function)(party, rerollCount)
                : (weightedModifierType.weight as number)
              : 0;
          if (weightedModifierType.maxWeight) {
            const modifierId = weightedModifierType.modifierType.id;
            tierModifierIds.push(modifierId);
            const outputWeight = useMaxWeightForOutput ? weightedModifierType.maxWeight : weight;
            modifierTableData[modifierId] = {
              weight: outputWeight,
              tier: Number.parseInt(t),
              tierPercent: 0,
              totalPercent: 0,
            };
            tierMaxWeight += outputWeight;
          }
          if (weight) {
            total += weight;
          } else {
            ignoredIndexes[t].push(i++);
            return total;
          }
          if (itemPoolChecks.has(modifierType.modifierType.id as ModifierTypeKeys)) {
            itemPoolChecks.set(modifierType.modifierType.id as ModifierTypeKeys, true);
          }
          thresholds.set(total, i++);
          return total;
        }, 0);
        for (const id of tierModifierIds) {
          modifierTableData[id].tierPercent = Math.floor((modifierTableData[id].weight / tierMaxWeight) * 10000) / 100;
        }
        return [t, Object.fromEntries(thresholds)];
      }),
    ),
  );
  for (const id of Object.keys(modifierTableData)) {
    modifierTableData[id].totalPercent =
      Math.floor(modifierTableData[id].tierPercent * tierWeights[modifierTableData[id].tier] * 100) / 100;
    modifierTableData[id].tier = ModifierTier[modifierTableData[id].tier];
  }
  if (outputModifierData) {
    console.table(modifierTableData);
  }
  switch (poolType) {
    case ModifierPoolType.PLAYER:
      modifierPoolThresholds = thresholds;
      ignoredPoolIndexes = ignoredIndexes;
      break;
    case ModifierPoolType.WILD:
    case ModifierPoolType.TRAINER:
      enemyModifierPoolThresholds = thresholds;
      enemyIgnoredPoolIndexes = ignoredIndexes;
      break;
    case ModifierPoolType.ENEMY_BUFF:
      enemyBuffModifierPoolThresholds = thresholds;
      enemyBuffIgnoredPoolIndexes = ignoredIndexes;
      break;
    case ModifierPoolType.DAILY_STARTER:
      dailyStarterModifierPoolThresholds = thresholds;
      ignoredDailyStarterPoolIndexes = ignoredIndexes;
      break;
  }
}

export interface CustomModifierSettings {
  guaranteedModifierTiers?: ModifierTier[];
  guaranteedModifierTypeOptions?: ModifierTypeOption[];
  guaranteedModifierTypeFuncs?: ModifierTypeFunc[];
  fillRemaining?: boolean;
  /** Set to negative value to disable rerolls completely in shop */
  rerollMultiplier?: number;
  allowLuckUpgrades?: boolean;
}

/**
 * Generates modifier options for a {@linkcode SelectModifierPhase}
 * @param count Determines the number of items to generate
 * @param party Party is required for generating proper modifier pools
 * @param modifierTiers (Optional) If specified, rolls items in the specified tiers. Commonly used for tier-locking with Lock Capsule.
 * @param customModifierSettings (Optional) If specified, can customize the item shop rewards further.
 *  - `guaranteedModifierTypeOptions?: ModifierTypeOption[]` If specified, will override the first X items to be specific modifier options (these should be pre-genned).
 *  - `guaranteedModifierTypeFuncs?: ModifierTypeFunc[]` If specified, will override the next X items to be auto-generated from specific modifier functions (these don't have to be pre-genned).
 *  - `guaranteedModifierTiers?: ModifierTier[]` If specified, will override the next X items to be the specified tier. These can upgrade with luck.
 *  - `fillRemaining?: boolean` Default 'false'. If set to true, will fill the remainder of shop items that were not overridden by the 3 options above, up to the 'count' param value.
 *    - Example: `count = 4`, `customModifierSettings = { guaranteedModifierTiers: [ModifierTier.GREAT], fillRemaining: true }`,
 *    - The first item in the shop will be `GREAT` tier, and the remaining 3 items will be generated normally.
 *    - If `fillRemaining = false` in the same scenario, only 1 `GREAT` tier item will appear in the shop (regardless of `count` value).
 *  - `rerollMultiplier?: number` If specified, can adjust the amount of money required for a shop reroll. If set to a negative value, the shop will not allow rerolls at all.
 *  - `allowLuckUpgrades?: boolean` Default `true`, if `false` will prevent set item tiers from upgrading via luck
 */
export function getPlayerModifierTypeOptions(
  count: number,
  party: PlayerPokemon[],
  modifierTiers?: ModifierTier[],
  customModifierSettings?: CustomModifierSettings,
): ModifierTypeOption[] {
  const options: ModifierTypeOption[] = [];
  const retryCount = Math.min(count * 5, 50);
  if (!customModifierSettings) {
    new Array(count).fill(0).map((_, i) => {
      options.push(
        getModifierTypeOptionWithRetry(
          options,
          retryCount,
          party,
          modifierTiers && modifierTiers.length > i ? modifierTiers[i] : undefined,
        ),
      );
    });
  } else {
    // Guaranteed mod options first
    if (
      customModifierSettings?.guaranteedModifierTypeOptions &&
      customModifierSettings.guaranteedModifierTypeOptions.length > 0
    ) {
      options.push(...customModifierSettings.guaranteedModifierTypeOptions!);
    }

    // Guaranteed mod functions second
    if (
      customModifierSettings.guaranteedModifierTypeFuncs &&
      customModifierSettings.guaranteedModifierTypeFuncs.length > 0
    ) {
      customModifierSettings.guaranteedModifierTypeFuncs!.forEach((mod, _i) => {
        const modifierId = Object.keys(modifierTypes).find(k => modifierTypes[k] === mod) as string;
        let guaranteedMod: ModifierType = modifierTypes[modifierId]?.();

        // Populates item id and tier
        guaranteedMod = withTierFromPool(
          guaranteedMod.withIdFromFunc(modifierTypes[modifierId]),
          ModifierPoolType.PLAYER,
          party,
        );

        const modType =
          guaranteedMod instanceof ModifierTypeGenerator ? guaranteedMod.generateType(party) : guaranteedMod;
        if (modType) {
          const option = new ModifierTypeOption(modType, 0);
          options.push(option);
        }
      });
    }

    // Guaranteed tiers third
    if (customModifierSettings.guaranteedModifierTiers && customModifierSettings.guaranteedModifierTiers.length > 0) {
      const allowLuckUpgrades = customModifierSettings.allowLuckUpgrades ?? true;
      for (const tier of customModifierSettings.guaranteedModifierTiers) {
        options.push(getModifierTypeOptionWithRetry(options, retryCount, party, tier, allowLuckUpgrades));
      }
    }

    // Fill remaining
    if (options.length < count && customModifierSettings.fillRemaining) {
      while (options.length < count) {
        options.push(getModifierTypeOptionWithRetry(options, retryCount, party, undefined));
      }
    }
  }

  overridePlayerModifierTypeOptions(options, party);

  return options;
}

/**
 * Will generate a {@linkcode ModifierType} from the {@linkcode ModifierPoolType.PLAYER} pool, attempting to retry duplicated items up to retryCount
 * @param existingOptions Currently generated options
 * @param retryCount How many times to retry before allowing a dupe item
 * @param party Current player party, used to calculate items in the pool
 * @param tier If specified will generate item of tier
 * @param allowLuckUpgrades `true` to allow items to upgrade tiers (the little animation that plays and is affected by luck)
 */
function getModifierTypeOptionWithRetry(
  existingOptions: ModifierTypeOption[],
  retryCount: number,
  party: PlayerPokemon[],
  tier?: ModifierTier,
  allowLuckUpgrades?: boolean,
): ModifierTypeOption {
  allowLuckUpgrades = allowLuckUpgrades ?? true;
  let candidate = getNewModifierTypeOption(party, ModifierPoolType.PLAYER, tier, undefined, 0, allowLuckUpgrades);
  let r = 0;
  while (
    existingOptions.length &&
    ++r < retryCount &&
    existingOptions.filter(o => o.type.name === candidate?.type.name || o.type.group === candidate?.type.group).length
  ) {
    candidate = getNewModifierTypeOption(
      party,
      ModifierPoolType.PLAYER,
      candidate?.type.tier ?? tier,
      candidate?.upgradeCount,
      0,
      allowLuckUpgrades,
    );
  }
  return candidate!;
}

/**
 * Replaces the {@linkcode ModifierType} of the entries within {@linkcode options} with any
 * {@linkcode ModifierOverride} entries listed in {@linkcode Overrides.ITEM_REWARD_OVERRIDE}
 * up to the smallest amount of entries between {@linkcode options} and the override array.
 * @param options Array of naturally rolled {@linkcode ModifierTypeOption}s
 * @param party Array of the player's current party
 */
export function overridePlayerModifierTypeOptions(options: ModifierTypeOption[], party: PlayerPokemon[]) {
  const minLength = Math.min(options.length, Overrides.ITEM_REWARD_OVERRIDE.length);
  for (let i = 0; i < minLength; i++) {
    const override: ModifierOverride = Overrides.ITEM_REWARD_OVERRIDE[i];
    const modifierFunc = modifierTypes[override.name];
    let modifierType: ModifierType | null = modifierFunc();

    if (modifierType instanceof ModifierTypeGenerator) {
      const pregenArgs = "type" in override && override.type !== null ? [override.type] : undefined;
      modifierType = modifierType.generateType(party, pregenArgs);
    }

    if (modifierType) {
      options[i].type = withTierFromPool(modifierType.withIdFromFunc(modifierFunc), ModifierPoolType.PLAYER, party);
    }
  }
}

export function getPlayerShopModifierTypeOptionsForWave(waveIndex: number, baseCost: number): ModifierTypeOption[] {
  if (!(waveIndex % 10)) {
    return [];
  }

  const options = [
    [
      new ModifierTypeOption(modifierTypes.POTION(), 0, baseCost * 0.2),
      new ModifierTypeOption(modifierTypes.ETHER(), 0, baseCost * 0.4),
      new ModifierTypeOption(modifierTypes.REVIVE(), 0, baseCost * 2),
    ],
    [
      new ModifierTypeOption(modifierTypes.SUPER_POTION(), 0, baseCost * 0.45),
      new ModifierTypeOption(modifierTypes.FULL_HEAL(), 0, baseCost),
    ],
    [
      new ModifierTypeOption(modifierTypes.ELIXIR(), 0, baseCost),
      new ModifierTypeOption(modifierTypes.MAX_ETHER(), 0, baseCost),
    ],
    [
      new ModifierTypeOption(modifierTypes.HYPER_POTION(), 0, baseCost * 0.8),
      new ModifierTypeOption(modifierTypes.MAX_REVIVE(), 0, baseCost * 2.75),
      new ModifierTypeOption(modifierTypes.MEMORY_MUSHROOM(), 0, baseCost * 4),
    ],
    [
      new ModifierTypeOption(modifierTypes.MAX_POTION(), 0, baseCost * 1.5),
      new ModifierTypeOption(modifierTypes.MAX_ELIXIR(), 0, baseCost * 2.5),
    ],
    [new ModifierTypeOption(modifierTypes.FULL_RESTORE(), 0, baseCost * 2.25)],
    [new ModifierTypeOption(modifierTypes.SACRED_ASH(), 0, baseCost * 10)],
  ];
  return options.slice(0, Math.ceil(Math.max(waveIndex + 10, 0) / 30)).flat();
}

export function getEnemyBuffModifierForWave(
  tier: ModifierTier,
  enemyModifiers: PersistentModifier[],
): EnemyPersistentModifier {
  let tierStackCount: number;
  switch (tier) {
    case ModifierTier.ULTRA:
      tierStackCount = 5;
      break;
    case ModifierTier.GREAT:
      tierStackCount = 3;
      break;
    default:
      tierStackCount = 1;
      break;
  }

  const retryCount = 50;
  let candidate = getNewModifierTypeOption([], ModifierPoolType.ENEMY_BUFF, tier);
  let r = 0;
  let matchingModifier: PersistentModifier | undefined;
  while (
    ++r < retryCount &&
    (matchingModifier = enemyModifiers.find(m => m.type.id === candidate?.type?.id)) &&
    matchingModifier.getMaxStackCount() < matchingModifier.stackCount + (r < 10 ? tierStackCount : 1)
  ) {
    candidate = getNewModifierTypeOption([], ModifierPoolType.ENEMY_BUFF, tier);
  }

  const modifier = candidate?.type?.newModifier() as EnemyPersistentModifier;
  modifier.stackCount = tierStackCount;

  return modifier;
}

export function getEnemyModifierTypesForWave(
  waveIndex: number,
  count: number,
  party: EnemyPokemon[],
  poolType: ModifierPoolType.WILD | ModifierPoolType.TRAINER,
  upgradeChance = 0,
): PokemonHeldItemModifierType[] {
  const ret = new Array(count)
    .fill(0)
    .map(
      () =>
        getNewModifierTypeOption(party, poolType, undefined, upgradeChance && !randSeedInt(upgradeChance) ? 1 : 0)
          ?.type as PokemonHeldItemModifierType,
    );
  if (!(waveIndex % 1000)) {
    ret.push(getModifierType(modifierTypes.MINI_BLACK_HOLE) as PokemonHeldItemModifierType);
  }
  return ret;
}

export function getDailyRunStarterModifiers(party: PlayerPokemon[]): PokemonHeldItemModifier[] {
  const ret: PokemonHeldItemModifier[] = [];
  for (const p of party) {
    for (let m = 0; m < 3; m++) {
      const tierValue = randSeedInt(64);

      let tier: ModifierTier;
      if (tierValue > 25) {
        tier = ModifierTier.COMMON;
      } else if (tierValue > 12) {
        tier = ModifierTier.GREAT;
      } else if (tierValue > 4) {
        tier = ModifierTier.ULTRA;
      } else if (tierValue) {
        tier = ModifierTier.ROGUE;
      } else {
        tier = ModifierTier.MASTER;
      }

      const modifier = getNewModifierTypeOption(party, ModifierPoolType.DAILY_STARTER, tier)?.type?.newModifier(
        p,
      ) as PokemonHeldItemModifier;
      ret.push(modifier);
    }
  }

  return ret;
}

/**
 * Generates a ModifierType from the specified pool
 * @param party party of the trainer using the item
 * @param poolType PLAYER/WILD/TRAINER
 * @param tier If specified, will override the initial tier of an item (can still upgrade with luck)
 * @param upgradeCount If defined, means that this is a new ModifierType being generated to override another via luck upgrade. Used for recursive logic
 * @param retryCount Max allowed tries before the next tier down is checked for a valid ModifierType
 * @param allowLuckUpgrades Default true. If false, will not allow ModifierType to randomly upgrade to next tier
 */
function getNewModifierTypeOption(
  party: Pokemon[],
  poolType: ModifierPoolType,
  tier?: ModifierTier,
  upgradeCount?: number,
  retryCount = 0,
  allowLuckUpgrades = true,
): ModifierTypeOption | null {
  const player = !poolType;
  const pool = getModifierPoolForType(poolType);
  let thresholds: object;
  switch (poolType) {
    case ModifierPoolType.PLAYER:
      thresholds = modifierPoolThresholds;
      break;
    case ModifierPoolType.WILD:
      thresholds = enemyModifierPoolThresholds;
      break;
    case ModifierPoolType.TRAINER:
      thresholds = enemyModifierPoolThresholds;
      break;
    case ModifierPoolType.ENEMY_BUFF:
      thresholds = enemyBuffModifierPoolThresholds;
      break;
    case ModifierPoolType.DAILY_STARTER:
      thresholds = dailyStarterModifierPoolThresholds;
      break;
  }
  if (tier === undefined) {
    const tierValue = randSeedInt(1024);
    if (!upgradeCount) {
      upgradeCount = 0;
    }
    if (player && tierValue && allowLuckUpgrades) {
      const partyLuckValue = getPartyLuckValue(party);
      const upgradeOdds = Math.floor(128 / ((partyLuckValue + 4) / 4));
      let upgraded = false;
      do {
        upgraded = randSeedInt(upgradeOdds) < 4;
        if (upgraded) {
          upgradeCount++;
        }
      } while (upgraded);
    }

    if (tierValue > 255) {
      tier = ModifierTier.COMMON;
    } else if (tierValue > 60) {
      tier = ModifierTier.GREAT;
    } else if (tierValue > 12) {
      tier = ModifierTier.ULTRA;
    } else if (tierValue) {
      tier = ModifierTier.ROGUE;
    } else {
      tier = ModifierTier.MASTER;
    }

    tier += upgradeCount;
    while (tier && (!modifierPool.hasOwnProperty(tier) || !modifierPool[tier].length)) {
      tier--;
      if (upgradeCount) {
        upgradeCount--;
      }
    }
  } else if (upgradeCount === undefined && player) {
    upgradeCount = 0;
    if (tier < ModifierTier.MASTER && allowLuckUpgrades) {
      const partyLuckValue = getPartyLuckValue(party);
      const upgradeOdds = Math.floor(128 / ((partyLuckValue + 4) / 4));
      while (modifierPool.hasOwnProperty(tier + upgradeCount + 1) && modifierPool[tier + upgradeCount + 1].length) {
        if (randSeedInt(upgradeOdds) < 4) {
          upgradeCount++;
        } else {
          break;
        }
      }
      tier += upgradeCount;
    }
  } else if (retryCount >= 100 && tier) {
    retryCount = 0;
    tier--;
  }

  const tierThresholds = Object.keys(thresholds[tier]);
  const totalWeight = Number.parseInt(tierThresholds[tierThresholds.length - 1]);
  const value = randSeedInt(totalWeight);
  let index: number | undefined;
  for (const t of tierThresholds) {
    const threshold = Number.parseInt(t);
    if (value < threshold) {
      index = thresholds[tier][threshold];
      break;
    }
  }

  if (index === undefined) {
    return null;
  }

  if (player) {
    console.log(index, ignoredPoolIndexes[tier].filter(i => i <= index).length, ignoredPoolIndexes[tier]);
  }
  let modifierType: ModifierType | null = pool[tier][index].modifierType;
  if (modifierType instanceof ModifierTypeGenerator) {
    modifierType = (modifierType as ModifierTypeGenerator).generateType(party);
    if (modifierType === null) {
      if (player) {
        console.log(ModifierTier[tier], upgradeCount);
      }
      return getNewModifierTypeOption(party, poolType, tier, upgradeCount, ++retryCount);
    }
  }

  console.log(modifierType, !player ? "(enemy)" : "");

  return new ModifierTypeOption(modifierType as ModifierType, upgradeCount!); // TODO: is this bang correct?
}

export function getDefaultModifierTypeForTier(tier: ModifierTier): ModifierType {
  let modifierType: ModifierType | WeightedModifierType = modifierPool[tier || ModifierTier.COMMON][0];
  if (modifierType instanceof WeightedModifierType) {
    modifierType = (modifierType as WeightedModifierType).modifierType;
  }
  return modifierType;
}

export function getOrInferTier(
  modifierType: ModifierType,
  poolType: ModifierPoolType = ModifierPoolType.PLAYER,
): ModifierTier | null {
  if (modifierType.tier) {
    return modifierType.tier;
  }
  if (!modifierType.id) {
    return null;
  }
  let poolTypes: ModifierPoolType[];
  switch (poolType) {
    case ModifierPoolType.PLAYER:
      poolTypes = [poolType, ModifierPoolType.TRAINER, ModifierPoolType.WILD];
      break;
    case ModifierPoolType.WILD:
      poolTypes = [poolType, ModifierPoolType.PLAYER, ModifierPoolType.TRAINER];
      break;
    case ModifierPoolType.TRAINER:
      poolTypes = [poolType, ModifierPoolType.PLAYER, ModifierPoolType.WILD];
      break;
    default:
      poolTypes = [poolType];
      break;
  }
  // Try multiple pool types in case of stolen items
  for (const type of poolTypes) {
    const pool = getModifierPoolForType(type);
    for (const tier of getEnumValues(ModifierTier)) {
      if (!pool.hasOwnProperty(tier)) {
        continue;
      }
      if (pool[tier].find(m => (m as WeightedModifierType).modifierType.id === modifierType.id)) {
        return (modifierType.tier = tier);
      }
    }
  }
  return null;
}

/**
 * Populates item tier for ModifierType instance
 * Tier is a necessary field for items that appear in player shop (determines the Pokeball visual they use)
 * To find the tier, this function performs a reverse lookup of the item type in modifier pools
 * It checks the weight of the item and will use the first tier for which the weight is greater than 0
 * This is to allow items to be in multiple item pools depending on the conditions, for example for events
 * If all tiers have a weight of 0 for the item, the first tier where the item was found is used
 * @param poolType Default 'ModifierPoolType.PLAYER'. Which pool to lookup item tier from
 * @param party optional. Needed to check the weight of modifiers with conditional weight (see {@linkcode WeightedModifierTypeWeightFunc})
 *  if not provided or empty, the weight check will be ignored
 * @param rerollCount Default `0`. Used to check the weight of modifiers with conditional weight (see {@linkcode WeightedModifierTypeWeightFunc})
 */
export function withTierFromPool(
  modifierType: ModifierType,
  poolType: ModifierPoolType = ModifierPoolType.PLAYER,
  party?: PlayerPokemon[],
  rerollCount = 0,
): ModifierType {
  let defaultTier: undefined | ModifierTier;
  for (const tier of Object.values(getModifierPoolForType(poolType))) {
    for (const modifier of tier) {
      if (modifierType.id === modifier.modifierType.id) {
        let weight: number;
        if (modifier.weight instanceof Function) {
          weight = party ? modifier.weight(party, rerollCount) : 0;
        } else {
          weight = modifier.weight;
        }
        if (weight > 0) {
          modifierType.tier = modifier.modifierType.tier;
          return modifierType;
        }
        if (isNullOrUndefined(defaultTier)) {
          // If weight is 0, keep track of the first tier where the item was found
          defaultTier = modifier.modifierType.tier;
        }
      }
    }
  }

  // Didn't find a pool with weight > 0, fallback to first tier where the item was found, if any
  if (defaultTier) {
    modifierType.tier = defaultTier;
  }

  return modifierType;
}
