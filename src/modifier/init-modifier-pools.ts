/* biome-ignore-start lint/correctness/noUnusedImports: tsdoc imports */
import type { initModifierTypes } from "#modifiers/modifier-type";
/* biome-ignore-end lint/correctness/noUnusedImports: tsdoc imports */

import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { pokemonEvolutions } from "#balance/pokemon-evolutions";
import { modifierTypes } from "#data/data-lists";
import { MAX_PER_TYPE_POKEBALLS } from "#data/pokeball";
import { AbilityId } from "#enums/ability-id";
import { BerryType } from "#enums/berry-type";
import { ModifierTier } from "#enums/modifier-tier";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { Unlockables } from "#enums/unlockables";
import type { Pokemon } from "#field/pokemon";
import {
  BerryModifier,
  DoubleBattleChanceBoosterModifier,
  SpeciesCritBoosterModifier,
  TurnStatusEffectModifier,
} from "#modifiers/modifier";
import {
  dailyStarterModifierPool,
  enemyBuffModifierPool,
  modifierPool,
  trainerModifierPool,
  wildModifierPool,
} from "#modifiers/modifier-pools";
import { WeightedModifierType } from "#modifiers/modifier-type";
import type { WeightedModifierTypeWeightFunc } from "#types/modifier-types";
import { isNullOrUndefined } from "#utils/common";

/**
 * Initialize the wild modifier pool
 */
function initWildModifierPool() {
  wildModifierPool[ModifierTier.COMMON] = [new WeightedModifierType(modifierTypes.BERRY, 1)].map(m => {
    m.setTier(ModifierTier.COMMON);
    return m;
  });
  wildModifierPool[ModifierTier.GREAT] = [new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 1)].map(m => {
    m.setTier(ModifierTier.GREAT);
    return m;
  });
  wildModifierPool[ModifierTier.ULTRA] = [
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 10),
    new WeightedModifierType(modifierTypes.WHITE_HERB, 0),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA);
    return m;
  });
  wildModifierPool[ModifierTier.ROGUE] = [new WeightedModifierType(modifierTypes.LUCKY_EGG, 4)].map(m => {
    m.setTier(ModifierTier.ROGUE);
    return m;
  });
  wildModifierPool[ModifierTier.MASTER] = [new WeightedModifierType(modifierTypes.GOLDEN_EGG, 1)].map(m => {
    m.setTier(ModifierTier.MASTER);
    return m;
  });
}

/**
 * Initialize the common modifier pool
 */
function initCommonModifierPool() {
  modifierPool[ModifierTier.COMMON] = [
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
              p.hp
              && !p.getHeldItems().some(m => m instanceof BerryModifier && m.berryType === BerryType.LEPPA)
              && p
                .getMoveset()
                .filter(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2))
                .length > 0,
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
              p.hp
              && !p.getHeldItems().some(m => m instanceof BerryModifier && m.berryType === BerryType.LEPPA)
              && p
                .getMoveset()
                .filter(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2))
                .length > 0,
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
  });
}

/**
 * Initialize the Great modifier pool
 */
function initGreatModifierPool() {
  modifierPool[ModifierTier.GREAT] = [
    new WeightedModifierType(modifierTypes.GREAT_BALL, () => (hasMaximumBalls(PokeballType.GREAT_BALL) ? 0 : 6), 6),
    new WeightedModifierType(modifierTypes.PP_UP, 2),
    new WeightedModifierType(
      modifierTypes.FULL_HEAL,
      (party: Pokemon[]) => {
        const statusEffectPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp
              && !!p.status
              && !p.getHeldItems().some(i => {
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
              p.hp
              && !!p.status
              && !p.getHeldItems().some(i => {
                if (i instanceof TurnStatusEffectModifier) {
                  return (i as TurnStatusEffectModifier).getStatusEffect() === p.status?.effect;
                }
                return false;
              }),
          ).length,
          3,
        );
        const thresholdPartyMemberCount = Math.floor(
          (Math.min(party.filter(p => p.getInverseHp() >= 100 && p.getHpRatio() <= 0.5 && !p.isFainted()).length, 3)
            + statusEffectPartyMemberCount)
            / 2,
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
              p.hp
              && !p.getHeldItems().some(m => m instanceof BerryModifier && m.berryType === BerryType.LEPPA)
              && p
                .getMoveset()
                .filter(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2))
                .length > 0,
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
              p.hp
              && !p.getHeldItems().some(m => m instanceof BerryModifier && m.berryType === BerryType.LEPPA)
              && p
                .getMoveset()
                .filter(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2))
                .length > 0,
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
    new WeightedModifierType(modifierTypes.SPECIES_STAT_BOOSTER, 2),
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
        p =>
          !(p.hasSpecies(SpeciesId.TERAPAGOS) || p.hasSpecies(SpeciesId.OGERPON) || p.hasSpecies(SpeciesId.SHEDINJA)),
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
  });
}

/**
 * Initialize the Ultra modifier pool
 */
function initUltraModifierPool() {
  modifierPool[ModifierTier.ULTRA] = [
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
            !p.isMax()
            && (p.getSpeciesForm(true).speciesId in pokemonEvolutions
              || (p.isFusion() && p.getFusionSpeciesForm(true).speciesId in pokemonEvolutions))
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
        const checkedSpecies = [SpeciesId.FARFETCHD, SpeciesId.GALAR_FARFETCHD, SpeciesId.SIRFETCHD];
        // If a party member doesn't already have a Leek and is one of the relevant species, Leek can appear
        return party.some(
          p =>
            !p.getHeldItems().some(i => i instanceof SpeciesCritBoosterModifier)
            && (checkedSpecies.includes(p.getSpeciesForm(true).speciesId)
              || (p.isFusion() && checkedSpecies.includes(p.getFusionSpeciesForm(true).speciesId))),
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
            const hasStatusMoves = [MoveId.FACADE, MoveId.PSYCHO_SHIFT].some(m => moveset.includes(m));
            // Moves that take advantage of being able to give the target a status orb
            // TODO: Take moves (Trick, Fling, Switcheroo) from comment when they are implemented
            const hasItemMoves = [
              /* MoveId.TRICK, MoveId.FLING, MoveId.SWITCHEROO */
            ].some(m => moveset.includes(m));

            if (canSetStatus) {
              // Abilities that take advantage of obtaining the actual status effect, separated based on specificity to the orb
              const hasGeneralAbility = [
                AbilityId.QUICK_FEET,
                AbilityId.GUTS,
                AbilityId.MARVEL_SCALE,
                AbilityId.MAGIC_GUARD,
              ].some(a => p.hasAbility(a, false, true));
              const hasSpecificAbility = [AbilityId.TOXIC_BOOST, AbilityId.POISON_HEAL].some(a =>
                p.hasAbility(a, false, true),
              );
              const hasOppositeAbility = [AbilityId.FLARE_BOOST].some(a => p.hasAbility(a, false, true));

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
            const hasStatusMoves = [MoveId.FACADE, MoveId.PSYCHO_SHIFT].some(m => moveset.includes(m));
            // Moves that take advantage of being able to give the target a status orb
            // TODO: Take moves (Trick, Fling, Switcheroo) from comment when they are implemented
            const hasItemMoves = [
              /* MoveId.TRICK, MoveId.FLING, MoveId.SWITCHEROO */
            ].some(m => moveset.includes(m));

            if (canSetStatus) {
              // Abilities that take advantage of obtaining the actual status effect, separated based on specificity to the orb
              const hasGeneralAbility = [
                AbilityId.QUICK_FEET,
                AbilityId.GUTS,
                AbilityId.MARVEL_SCALE,
                AbilityId.MAGIC_GUARD,
              ].some(a => p.hasAbility(a, false, true));
              const hasSpecificAbility = [AbilityId.FLARE_BOOST].some(a => p.hasAbility(a, false, true));
              const hasOppositeAbility = [AbilityId.TOXIC_BOOST, AbilityId.POISON_HEAL].some(a =>
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
              AbilityId.DROUGHT,
              AbilityId.ORICHALCUM_PULSE,
              AbilityId.DRIZZLE,
              AbilityId.SAND_STREAM,
              AbilityId.SAND_SPIT,
              AbilityId.SNOW_WARNING,
              AbilityId.ELECTRIC_SURGE,
              AbilityId.HADRON_ENGINE,
              AbilityId.PSYCHIC_SURGE,
              AbilityId.GRASSY_SURGE,
              AbilityId.SEED_SOWER,
              AbilityId.MISTY_SURGE,
            ].some(a => p.hasAbility(a, false, true));

            const hasMoves = [
              MoveId.SUNNY_DAY,
              MoveId.RAIN_DANCE,
              MoveId.SANDSTORM,
              MoveId.SNOWSCAPE,
              MoveId.HAIL,
              MoveId.CHILLY_RECEPTION,
              MoveId.ELECTRIC_TERRAIN,
              MoveId.PSYCHIC_TERRAIN,
              MoveId.GRASSY_TERRAIN,
              MoveId.MISTY_TERRAIN,
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
  });
}

function initRogueModifierPool() {
  modifierPool[ModifierTier.ROGUE] = [
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
  });
}

/**
 * Initialize the Master modifier pool
 */
function initMasterModifierPool() {
  modifierPool[ModifierTier.MASTER] = [
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
        !(globalScene.gameMode.isClassic && timedEventManager.areFusionsBoosted())
        && !globalScene.gameMode.isSplicedOnly
        && party.filter(p => !p.fusionSpecies).length > 1
          ? 24
          : 0,
      24,
    ),
    new WeightedModifierType(
      modifierTypes.MINI_BLACK_HOLE,
      () =>
        globalScene.gameMode.isDaily
        || (!globalScene.gameMode.isFreshStartChallenge()
          && globalScene.gameData.isUnlocked(Unlockables.MINI_BLACK_HOLE))
          ? 1
          : 0,
      1,
    ),
  ].map(m => {
    m.setTier(ModifierTier.MASTER);
    return m;
  });
}

function initTrainerModifierPool() {
  trainerModifierPool[ModifierTier.COMMON] = [
    new WeightedModifierType(modifierTypes.BERRY, 8),
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3),
  ].map(m => {
    m.setTier(ModifierTier.COMMON);
    return m;
  });
  trainerModifierPool[ModifierTier.GREAT] = [new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3)].map(m => {
    m.setTier(ModifierTier.GREAT);
    return m;
  });
  trainerModifierPool[ModifierTier.ULTRA] = [
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 10),
    new WeightedModifierType(modifierTypes.WHITE_HERB, 0),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA);
    return m;
  });
  trainerModifierPool[ModifierTier.ROGUE] = [
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 2),
    new WeightedModifierType(modifierTypes.LUCKY_EGG, 4),
    new WeightedModifierType(modifierTypes.QUICK_CLAW, 1),
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 1),
    new WeightedModifierType(modifierTypes.WIDE_LENS, 1),
  ].map(m => {
    m.setTier(ModifierTier.ROGUE);
    return m;
  });
  trainerModifierPool[ModifierTier.MASTER] = [
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 1),
    new WeightedModifierType(modifierTypes.LEFTOVERS, 1),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 1),
    new WeightedModifierType(modifierTypes.SCOPE_LENS, 1),
  ].map(m => {
    m.setTier(ModifierTier.MASTER);
    return m;
  });
}

/**
 * Initialize the enemy buff modifier pool
 */
function initEnemyBuffModifierPool() {
  enemyBuffModifierPool[ModifierTier.COMMON] = [
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
  });
  enemyBuffModifierPool[ModifierTier.GREAT] = [
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_BOOSTER, 5),
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_REDUCTION, 5),
    new WeightedModifierType(modifierTypes.ENEMY_STATUS_EFFECT_HEAL_CHANCE, 5),
    new WeightedModifierType(modifierTypes.ENEMY_ENDURE_CHANCE, 5),
    new WeightedModifierType(modifierTypes.ENEMY_FUSED_CHANCE, 1),
  ].map(m => {
    m.setTier(ModifierTier.GREAT);
    return m;
  });
  enemyBuffModifierPool[ModifierTier.ULTRA] = [
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_BOOSTER, 10),
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_REDUCTION, 10),
    new WeightedModifierType(modifierTypes.ENEMY_HEAL, 10),
    new WeightedModifierType(modifierTypes.ENEMY_STATUS_EFFECT_HEAL_CHANCE, 10),
    new WeightedModifierType(modifierTypes.ENEMY_ENDURE_CHANCE, 10),
    new WeightedModifierType(modifierTypes.ENEMY_FUSED_CHANCE, 5),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA);
    return m;
  });
  enemyBuffModifierPool[ModifierTier.ROGUE] = [].map((m: WeightedModifierType) => {
    m.setTier(ModifierTier.ROGUE);
    return m;
  });
  enemyBuffModifierPool[ModifierTier.MASTER] = [].map((m: WeightedModifierType) => {
    m.setTier(ModifierTier.MASTER);
    return m;
  });
}

/**
 * Initialize the daily starter modifier pool
 */
function initDailyStarterModifierPool() {
  dailyStarterModifierPool[ModifierTier.COMMON] = [
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 1),
    new WeightedModifierType(modifierTypes.BERRY, 3),
  ].map(m => {
    m.setTier(ModifierTier.COMMON);
    return m;
  });
  dailyStarterModifierPool[ModifierTier.GREAT] = [new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 5)].map(
    m => {
      m.setTier(ModifierTier.GREAT);
      return m;
    },
  );
  dailyStarterModifierPool[ModifierTier.ULTRA] = [
    new WeightedModifierType(modifierTypes.REVIVER_SEED, 4),
    new WeightedModifierType(modifierTypes.SOOTHE_BELL, 1),
    new WeightedModifierType(modifierTypes.SOUL_DEW, 1),
    new WeightedModifierType(modifierTypes.GOLDEN_PUNCH, 1),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA);
    return m;
  });
  dailyStarterModifierPool[ModifierTier.ROGUE] = [
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 5),
    new WeightedModifierType(modifierTypes.BATON, 2),
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 5),
    new WeightedModifierType(modifierTypes.QUICK_CLAW, 3),
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 3),
  ].map(m => {
    m.setTier(ModifierTier.ROGUE);
    return m;
  });
  dailyStarterModifierPool[ModifierTier.MASTER] = [
    new WeightedModifierType(modifierTypes.LEFTOVERS, 1),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 1),
  ].map(m => {
    m.setTier(ModifierTier.MASTER);
    return m;
  });
}

/**
 * Initialize {@linkcode modifierPool} with the initial set of modifier types.
 * {@linkcode initModifierTypes} MUST be called before this function.
 */
export function initModifierPools() {
  // The modifier pools the player chooses from during modifier selection
  initCommonModifierPool();
  initGreatModifierPool();
  initUltraModifierPool();
  initRogueModifierPool();
  initMasterModifierPool();

  // Modifier pools for specific scenarios
  initWildModifierPool();
  initTrainerModifierPool();
  initEnemyBuffModifierPool();
  initDailyStarterModifierPool();
}

/**
 * High order function that returns a WeightedModifierTypeWeightFunc that will only be applied on
 * classic and skip an ModifierType if current wave is greater or equal to the one passed down
 * @param wave - Wave where we should stop showing the modifier
 * @param defaultWeight - ModifierType default weight
 * @returns A WeightedModifierTypeWeightFunc
 */
function skipInClassicAfterWave(wave: number, defaultWeight: number): WeightedModifierTypeWeightFunc {
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
function skipInLastClassicWaveOrDefault(defaultWeight: number): WeightedModifierTypeWeightFunc {
  return skipInClassicAfterWave(199, defaultWeight);
}

/**
 * High order function that returns a WeightedModifierTypeWeightFunc to ensure Lures don't spawn on Classic 199
 * or if the lure still has over 60% of its duration left
 * @param maxBattles The max battles the lure type in question lasts. 10 for green, 15 for Super, 30 for Max
 * @param weight The desired weight for the lure when it does spawn
 * @returns A WeightedModifierTypeWeightFunc
 */
function lureWeightFunc(maxBattles: number, weight: number): WeightedModifierTypeWeightFunc {
  return () => {
    const lures = globalScene.getModifiers(DoubleBattleChanceBoosterModifier);
    return !(globalScene.gameMode.isClassic && globalScene.currentBattle.waveIndex === 199)
      && (lures.length === 0
        || lures.filter(m => m.getMaxBattles() === maxBattles && m.getBattleCount() >= maxBattles * 0.6).length === 0)
      ? weight
      : 0;
  };
}

/**
 * Used to check if the player has max of a given ball type in Classic
 * @param ballType The {@linkcode PokeballType} being checked
 * @returns boolean: true if the player has the maximum of a given ball type
 */
function hasMaximumBalls(ballType: PokeballType): boolean {
  return globalScene.gameMode.isClassic && globalScene.pokeballCounts[ballType] >= MAX_PER_TYPE_POKEBALLS;
}
