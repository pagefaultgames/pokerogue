/* biome-ignore-start lint/correctness/noUnusedImports: tsdoc imports */
import type { initRewards, Reward } from "#items/reward";
/* biome-ignore-end lint/correctness/noUnusedImports: tsdoc imports */

import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { pokemonEvolutions } from "#balance/pokemon-evolutions";
import { allHeldItems, allRewards, allTrainerItems } from "#data/data-lists";
import { MAX_PER_TYPE_POKEBALLS } from "#data/pokeball";
import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { RarityTier } from "#enums/reward-tier";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { TrainerItemId } from "#enums/trainer-item-id";
import { Unlockables } from "#enums/unlockables";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { matchingRewards, WeightedReward } from "#items/reward";
import { rewardPool } from "#items/reward-pools";
import type { TurnEndStatusHeldItem } from "#items/turn-end-status";
import type { WeightedRewardWeightFunc } from "#types/rewards";
import { isNullOrUndefined } from "#utils/common";

/**
 * Initialize the common modifier pool
 */
function initCommonRewardPool() {
  rewardPool[RarityTier.COMMON] = [
    new WeightedReward(allRewards.POKEBALL, () => (hasMaximumBalls(PokeballType.POKEBALL) ? 0 : 6), 6),
    new WeightedReward(allRewards.RARE_CANDY, 2),
    new WeightedReward(
      allRewards.POTION,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(p => p.getInverseHp() >= 10 && p.getHpRatio() <= 0.875 && !p.isFainted()).length,
          3,
        );
        return thresholdPartyMemberCount * 3;
      },
      9,
    ),
    new WeightedReward(
      allRewards.SUPER_POTION,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(p => p.getInverseHp() >= 25 && p.getHpRatio() <= 0.75 && !p.isFainted()).length,
          3,
        );
        return thresholdPartyMemberCount;
      },
      3,
    ),
    new WeightedReward(
      allRewards.ETHER,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp &&
              !p.heldItemManager.hasItem(HeldItemId.LEPPA_BERRY) &&
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
    new WeightedReward(
      allRewards.MAX_ETHER,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp &&
              !p.heldItemManager.hasItem(HeldItemId.LEPPA_BERRY) &&
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
    new WeightedReward(allRewards.LURE, lureWeightFunc(TrainerItemId.LURE, 2)),
    new WeightedReward(allRewards.TEMP_STAT_STAGE_BOOSTER, 4),
    new WeightedReward(allRewards.BERRY, 2),
    new WeightedReward(allRewards.TM_COMMON, 2),
  ].map(m => {
    m.setTier(RarityTier.COMMON);
    return m;
  });
}

/**
 * Initialize the Great modifier pool
 */
function initGreatRewardPool() {
  rewardPool[RarityTier.GREAT] = [
    new WeightedReward(allRewards.GREAT_BALL, () => (hasMaximumBalls(PokeballType.GREAT_BALL) ? 0 : 6), 6),
    new WeightedReward(allRewards.PP_UP, 2),
    new WeightedReward(
      allRewards.FULL_HEAL,
      (party: Pokemon[]) => {
        const statusEffectPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp &&
              !!p.status &&
              !p
                .getHeldItems()
                .filter(i => i in [HeldItemId.TOXIC_ORB, HeldItemId.FLAME_ORB])
                .some(i => (allHeldItems[i] as TurnEndStatusHeldItem).effect === p.status?.effect),
          ).length,
          3,
        );
        return statusEffectPartyMemberCount * 6;
      },
      18,
    ),
    new WeightedReward(
      allRewards.REVIVE,
      (party: Pokemon[]) => {
        const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
        return faintedPartyMemberCount * 9;
      },
      27,
    ),
    new WeightedReward(
      allRewards.MAX_REVIVE,
      (party: Pokemon[]) => {
        const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
        return faintedPartyMemberCount * 3;
      },
      9,
    ),
    new WeightedReward(
      allRewards.SACRED_ASH,
      (party: Pokemon[]) => {
        return party.filter(p => p.isFainted()).length >= Math.ceil(party.length / 2) ? 1 : 0;
      },
      1,
    ),
    new WeightedReward(
      allRewards.HYPER_POTION,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(p => p.getInverseHp() >= 100 && p.getHpRatio() <= 0.625 && !p.isFainted()).length,
          3,
        );
        return thresholdPartyMemberCount * 3;
      },
      9,
    ),
    new WeightedReward(
      allRewards.MAX_POTION,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(p => p.getInverseHp() >= 100 && p.getHpRatio() <= 0.5 && !p.isFainted()).length,
          3,
        );
        return thresholdPartyMemberCount;
      },
      3,
    ),
    new WeightedReward(
      allRewards.FULL_RESTORE,
      (party: Pokemon[]) => {
        const statusEffectPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp &&
              !!p.status &&
              !p
                .getHeldItems()
                .filter(i => i in [HeldItemId.TOXIC_ORB, HeldItemId.FLAME_ORB])
                .some(i => (allHeldItems[i] as TurnEndStatusHeldItem).effect === p.status?.effect),
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
    new WeightedReward(
      allRewards.ELIXIR,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp &&
              !p.heldItemManager.hasItem(HeldItemId.LEPPA_BERRY) &&
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
    new WeightedReward(
      allRewards.MAX_ELIXIR,
      (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp &&
              !p.heldItemManager.hasItem(HeldItemId.LEPPA_BERRY) &&
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
    new WeightedReward(allRewards.DIRE_HIT, 4),
    new WeightedReward(allRewards.SUPER_LURE, lureWeightFunc(TrainerItemId.SUPER_LURE, 4)),
    new WeightedReward(allRewards.NUGGET, skipInLastClassicWaveOrDefault(5)),
    new WeightedReward(allRewards.SPECIES_STAT_BOOSTER, 4),
    new WeightedReward(
      allRewards.EVOLUTION_ITEM,
      () => {
        return Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 15), 8);
      },
      8,
    ),
    new WeightedReward(
      allRewards.MAP,
      () => (globalScene.gameMode.isClassic && globalScene.currentBattle.waveIndex < 180 ? 2 : 0),
      2,
    ),
    new WeightedReward(allRewards.SOOTHE_BELL, 2),
    new WeightedReward(allRewards.TM_GREAT, 3),
    new WeightedReward(
      allRewards.MEMORY_MUSHROOM,
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
    new WeightedReward(allRewards.BASE_STAT_BOOSTER, 3),
    new WeightedReward(allRewards.TERA_SHARD, (party: Pokemon[]) =>
      party.filter(
        p =>
          !(p.hasSpecies(SpeciesId.TERAPAGOS) || p.hasSpecies(SpeciesId.OGERPON) || p.hasSpecies(SpeciesId.SHEDINJA)),
      ).length > 0
        ? 1
        : 0,
    ),
    new WeightedReward(
      allRewards.DNA_SPLICERS,
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
    new WeightedReward(
      allRewards.VOUCHER,
      (_party: Pokemon[], rerollCount: number) => (!globalScene.gameMode.isDaily ? Math.max(1 - rerollCount, 0) : 0),
      1,
    ),
  ].map(m => {
    m.setTier(RarityTier.GREAT);
    return m;
  });
}

/**
 * Initialize the Ultra modifier pool
 */
function initUltraRewardPool() {
  rewardPool[RarityTier.ULTRA] = [
    new WeightedReward(allRewards.ULTRA_BALL, () => (hasMaximumBalls(PokeballType.ULTRA_BALL) ? 0 : 15), 15),
    new WeightedReward(allRewards.MAX_LURE, lureWeightFunc(TrainerItemId.MAX_LURE, 4)),
    new WeightedReward(allRewards.BIG_NUGGET, skipInLastClassicWaveOrDefault(12)),
    new WeightedReward(allRewards.PP_MAX, 3),
    new WeightedReward(allRewards.MINT, 4),
    new WeightedReward(
      allRewards.RARE_EVOLUTION_ITEM,
      () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 15) * 4, 32),
      32,
    ),
    new WeightedReward(
      allRewards.FORM_CHANGE_ITEM,
      () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 50), 4) * 6,
      24,
    ),
    new WeightedReward(allRewards.AMULET_COIN, skipInLastClassicWaveOrDefault(3)),
    new WeightedReward(allRewards.EVIOLITE, (party: Pokemon[]) => {
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
            return !p.heldItemManager.hasItem(HeldItemId.EVIOLITE);
          }
          return false;
        })
          ? 10
          : 0;
      }
      return 0;
    }),
    new WeightedReward(allRewards.RARE_SPECIES_STAT_BOOSTER, 12),
    new WeightedReward(
      allRewards.LEEK,
      (party: Pokemon[]) => {
        const checkedSpecies = [SpeciesId.FARFETCHD, SpeciesId.GALAR_FARFETCHD, SpeciesId.SIRFETCHD];
        // If a party member doesn't already have a Leek and is one of the relevant species, Leek can appear
        return party.some(
          p =>
            !p.heldItemManager.hasItem(HeldItemId.LEEK) &&
            (checkedSpecies.includes(p.getSpeciesForm(true).speciesId) ||
              (p.isFusion() && checkedSpecies.includes(p.getFusionSpeciesForm(true).speciesId))),
        )
          ? 12
          : 0;
      },
      12,
    ),
    new WeightedReward(
      allRewards.TOXIC_ORB,
      (party: Pokemon[]) => {
        return party.some(p => {
          const isHoldingOrb = p.getHeldItems().some(i => i in [HeldItemId.FLAME_ORB, HeldItemId.TOXIC_ORB]);

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
    new WeightedReward(
      allRewards.FLAME_ORB,
      (party: Pokemon[]) => {
        return party.some(p => {
          const isHoldingOrb = p.getHeldItems().some(i => i in [HeldItemId.FLAME_ORB, HeldItemId.TOXIC_ORB]);

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
    new WeightedReward(
      allRewards.MYSTICAL_ROCK,
      (party: Pokemon[]) => {
        return party.some(p => {
          const stack = p.heldItemManager.getStack(HeldItemId.MYSTICAL_ROCK);
          const isHoldingMax = stack === allHeldItems[HeldItemId.MYSTICAL_ROCK].maxStackCount;

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
    new WeightedReward(allRewards.REVIVER_SEED, 4),
    new WeightedReward(allRewards.CANDY_JAR, skipInLastClassicWaveOrDefault(5)),
    new WeightedReward(allRewards.ATTACK_TYPE_BOOSTER, 9),
    new WeightedReward(allRewards.TM_ULTRA, 11),
    new WeightedReward(allRewards.RARER_CANDY, 4),
    new WeightedReward(allRewards.GOLDEN_PUNCH, skipInLastClassicWaveOrDefault(2)),
    new WeightedReward(allRewards.IV_SCANNER, skipInLastClassicWaveOrDefault(4)),
    new WeightedReward(allRewards.EXP_CHARM, skipInLastClassicWaveOrDefault(8)),
    new WeightedReward(allRewards.EXP_SHARE, skipInLastClassicWaveOrDefault(10)),
    new WeightedReward(
      allRewards.TERA_ORB,
      () =>
        !globalScene.gameMode.isClassic
          ? Math.min(Math.max(Math.floor(globalScene.currentBattle.waveIndex / 50) * 2, 1), 4)
          : 0,
      4,
    ),
    new WeightedReward(allRewards.QUICK_CLAW, 3),
    new WeightedReward(allRewards.WIDE_LENS, 7),
  ].map(m => {
    m.setTier(RarityTier.ULTRA);
    return m;
  });
}

function initRogueRewardPool() {
  rewardPool[RarityTier.ROGUE] = [
    new WeightedReward(allRewards.ROGUE_BALL, () => (hasMaximumBalls(PokeballType.ROGUE_BALL) ? 0 : 16), 16),
    new WeightedReward(allRewards.RELIC_GOLD, skipInLastClassicWaveOrDefault(2)),
    new WeightedReward(allRewards.LEFTOVERS, 3),
    new WeightedReward(allRewards.SHELL_BELL, 3),
    new WeightedReward(allRewards.BERRY_POUCH, 4),
    new WeightedReward(allRewards.GRIP_CLAW, 5),
    new WeightedReward(allRewards.SCOPE_LENS, 4),
    new WeightedReward(allRewards.BATON, 2),
    new WeightedReward(allRewards.SOUL_DEW, 7),
    new WeightedReward(allRewards.CATCHING_CHARM, () => (!globalScene.gameMode.isClassic ? 4 : 0), 4),
    new WeightedReward(allRewards.ABILITY_CHARM, skipInClassicAfterWave(189, 6)),
    new WeightedReward(allRewards.FOCUS_BAND, 5),
    new WeightedReward(allRewards.KINGS_ROCK, 3),
    new WeightedReward(allRewards.LOCK_CAPSULE, () => (globalScene.gameMode.isClassic ? 0 : 3)),
    new WeightedReward(allRewards.SUPER_EXP_CHARM, skipInLastClassicWaveOrDefault(8)),
    new WeightedReward(
      allRewards.RARE_FORM_CHANGE_ITEM,
      () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 50), 4) * 6,
      24,
    ),
    new WeightedReward(
      allRewards.MEGA_BRACELET,
      () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 50), 4) * 9,
      36,
    ),
    new WeightedReward(
      allRewards.DYNAMAX_BAND,
      () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 50), 4) * 9,
      36,
    ),
    new WeightedReward(
      allRewards.VOUCHER_PLUS,
      (_party: Pokemon[], rerollCount: number) =>
        !globalScene.gameMode.isDaily ? Math.max(3 - rerollCount * 1, 0) : 0,
      3,
    ),
  ].map(m => {
    m.setTier(RarityTier.ROGUE);
    return m;
  });
}

/**
 * Initialize the Master modifier pool
 */
function initMasterRewardPool() {
  rewardPool[RarityTier.MASTER] = [
    new WeightedReward(allRewards.MASTER_BALL, () => (hasMaximumBalls(PokeballType.MASTER_BALL) ? 0 : 24), 24),
    new WeightedReward(allRewards.SHINY_CHARM, 14),
    new WeightedReward(allRewards.HEALING_CHARM, 18),
    new WeightedReward(allRewards.MULTI_LENS, 18),
    new WeightedReward(
      allRewards.VOUCHER_PREMIUM,
      (_party: Pokemon[], rerollCount: number) =>
        !globalScene.gameMode.isDaily && !globalScene.gameMode.isEndless && !globalScene.gameMode.isSplicedOnly
          ? Math.max(5 - rerollCount * 2, 0)
          : 0,
      5,
    ),
    new WeightedReward(
      allRewards.DNA_SPLICERS,
      (party: Pokemon[]) =>
        !(globalScene.gameMode.isClassic && timedEventManager.areFusionsBoosted()) &&
        !globalScene.gameMode.isSplicedOnly &&
        party.filter(p => !p.fusionSpecies).length > 1
          ? 24
          : 0,
      24,
    ),
    new WeightedReward(
      allRewards.MINI_BLACK_HOLE,
      () =>
        globalScene.gameMode.isDaily ||
        (!globalScene.gameMode.isFreshStartChallenge() && globalScene.gameData.isUnlocked(Unlockables.MINI_BLACK_HOLE))
          ? 1
          : 0,
      1,
    ),
  ].map(m => {
    m.setTier(RarityTier.MASTER);
    return m;
  });
}

/**
 * Initialize {@linkcode rewardPool} with the initial set of modifier types.
 * {@linkcode initRewards} MUST be called before this function.
 */
export function initRewardPools() {
  // The modifier pools the player chooses from during modifier selection
  initCommonRewardPool();
  initGreatRewardPool();
  initUltraRewardPool();
  initRogueRewardPool();
  initMasterRewardPool();
}

/**
 * High order function that returns a WeightedRewardWeightFunc that will only be applied on
 * classic and skip an Reward if current wave is greater or equal to the one passed down
 * @param wave - Wave where we should stop showing the modifier
 * @param defaultWeight - Reward default weight
 * @returns A WeightedRewardWeightFunc
 */
function skipInClassicAfterWave(wave: number, defaultWeight: number): WeightedRewardWeightFunc {
  return () => {
    const gameMode = globalScene.gameMode;
    const currentWave = globalScene.currentBattle.waveIndex;
    return gameMode.isClassic && currentWave >= wave ? 0 : defaultWeight;
  };
}

/**
 * High order function that returns a WeightedRewardWeightFunc that will only be applied on
 * classic and it will skip a Reward if it is the last wave pull.
 * @param defaultWeight Reward default weight
 * @returns A WeightedRewardWeightFunc
 */
function skipInLastClassicWaveOrDefault(defaultWeight: number): WeightedRewardWeightFunc {
  return skipInClassicAfterWave(199, defaultWeight);
}

/**
 * High order function that returns a WeightedRewardWeightFunc to ensure Lures don't spawn on Classic 199
 * or if the lure still has over 60% of its duration left
 * @param lureId The id of the lure type in question.
 * @param weight The desired weight for the lure when it does spawn
 * @returns A WeightedRewardWeightFunc
 */
function lureWeightFunc(lureId: TrainerItemId, weight: number): WeightedRewardWeightFunc {
  return () => {
    const lureCount = globalScene.trainerItems.getStack(lureId);
    return !(globalScene.gameMode.isClassic && globalScene.currentBattle.waveIndex === 199) &&
      lureCount < allTrainerItems[lureId].getMaxStackCount() * 0.6
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

/**
 * Populates item tier for Reward instance
 * Tier is a necessary field for items that appear in player shop (determines the Pokeball visual they use)
 * To find the tier, this function performs a reverse lookup of the item type in modifier pools
 * It checks the weight of the item and will use the first tier for which the weight is greater than 0
 * This is to allow items to be in multiple item pools depending on the conditions, for example for events
 * If all tiers have a weight of 0 for the item, the first tier where the item was found is used
 * @param poolType Default 'RewardPoolType.PLAYER'. Which pool to lookup item tier from
 * @param party optional. Needed to check the weight of modifiers with conditional weight (see {@linkcode WeightedRewardWeightFunc})
 *  if not provided or empty, the weight check will be ignored
 * @param rerollCount Default `0`. Used to check the weight of modifiers with conditional weight (see {@linkcode WeightedRewardWeightFunc})
 */
export function getTierFromPool(reward: Reward, party?: PlayerPokemon[], rerollCount = 0): RarityTier {
  let defaultTier: undefined | RarityTier;
  for (const tier of Object.values(rewardPool)) {
    for (const weighted of tier) {
      if (matchingRewards(reward, weighted.reward)) {
        //TODO: need to rework this to use id
        let weight: number;
        if (weighted.weight instanceof Function) {
          weight = party ? weighted.weight(party, rerollCount) : 0;
        } else {
          weight = weighted.weight;
        }
        if (weight > 0) {
          this.tier = weighted.reward.tier;
          return this;
        }
        if (isNullOrUndefined(defaultTier)) {
          // If weight is 0, keep track of the first tier where the item was found
          defaultTier = weighted.reward.tier;
        }
      }
    }
  }

  return defaultTier ?? RarityTier.COMMON;
}
