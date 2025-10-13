import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { pokemonEvolutions } from "#balance/pokemon-evolutions";
import { allHeldItems, allTrainerItems } from "#data/data-lists";
import { MAX_PER_TYPE_POKEBALLS } from "#data/pokeball";
import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { TrainerItemId } from "#enums/trainer-item-id";
import { Unlockables } from "#enums/unlockables";
import type { Pokemon } from "#field/pokemon";
import { rewardPool } from "#items/reward-pools";
import type { TurnEndStatusHeldItem } from "#items/turn-end-status";
import type { WeightedRewardWeightFunc } from "#types/rewards";
import { isNullOrUndefined } from "#utils/common";

/**
 * Initialize the common modifier pool
 */
function initCommonRewardPool() {
  rewardPool[RarityTier.COMMON] = [
    { id: RewardId.POKEBALL, weight: () => (hasMaximumBalls(PokeballType.POKEBALL) ? 0 : 6), maxWeight: 6 },
    { id: RewardId.RARE_CANDY, weight: 2 },
    {
      id: RewardId.POTION,
      weight: (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(p => p.getInverseHp() >= 10 && p.getHpRatio() <= 0.875 && !p.isFainted()).length,
          3,
        );
        return thresholdPartyMemberCount * 3;
      },
      maxWeight: 9,
    },
    {
      id: RewardId.SUPER_POTION,
      weight: (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(p => p.getInverseHp() >= 25 && p.getHpRatio() <= 0.75 && !p.isFainted()).length,
          3,
        );
        return thresholdPartyMemberCount;
      },
      maxWeight: 3,
    },
    {
      id: RewardId.ETHER,
      weight: (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp
              && !p.heldItemManager.hasItem(HeldItemId.LEPPA_BERRY)
              && p
                .getMoveset()
                .filter(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2))
                .length > 0,
          ).length,
          3,
        );
        return thresholdPartyMemberCount * 3;
      },
      maxWeight: 9,
    },
    {
      id: RewardId.MAX_ETHER,
      weight: (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp
              && !p.heldItemManager.hasItem(HeldItemId.LEPPA_BERRY)
              && p
                .getMoveset()
                .filter(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2))
                .length > 0,
          ).length,
          3,
        );
        return thresholdPartyMemberCount;
      },
      maxWeight: 3,
    },
    { id: RewardId.LURE, weight: lureWeightFunc(TrainerItemId.LURE, 2) },
    { id: RewardId.TEMP_STAT_STAGE_BOOSTER, weight: 4 },
    { id: RewardId.BERRY, weight: 2 },
    { id: RewardId.TM_COMMON, weight: 2 },
  ];
}

/**
 * Initialize the Great modifier pool
 */
function initGreatRewardPool() {
  rewardPool[RarityTier.GREAT] = [
    { id: RewardId.GREAT_BALL, weight: () => (hasMaximumBalls(PokeballType.GREAT_BALL) ? 0 : 6), maxWeight: 6 },
    { id: RewardId.PP_UP, weight: 2 },
    {
      id: RewardId.FULL_HEAL,
      weight: (party: Pokemon[]) => {
        const statusEffectPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp
              && !!p.status
              && !p
                .iterHeldItems()
                .filter(i => i in [HeldItemId.TOXIC_ORB, HeldItemId.FLAME_ORB])
                .some(i => (allHeldItems[i] as TurnEndStatusHeldItem).effect === p.status?.effect),
          ).length,
          3,
        );
        return statusEffectPartyMemberCount * 6;
      },
      maxWeight: 18,
    },
    {
      id: RewardId.REVIVE,
      weight: (party: Pokemon[]) => {
        const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
        return faintedPartyMemberCount * 9;
      },
      maxWeight: 27,
    },
    {
      id: RewardId.MAX_REVIVE,
      weight: (party: Pokemon[]) => {
        const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
        return faintedPartyMemberCount * 3;
      },
      maxWeight: 9,
    },
    {
      id: RewardId.SACRED_ASH,
      weight: (party: Pokemon[]) => {
        return party.filter(p => p.isFainted()).length >= Math.ceil(party.length / 2) ? 1 : 0;
      },
      maxWeight: 1,
    },
    {
      id: RewardId.HYPER_POTION,
      weight: (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(p => p.getInverseHp() >= 100 && p.getHpRatio() <= 0.625 && !p.isFainted()).length,
          3,
        );
        return thresholdPartyMemberCount * 3;
      },
      maxWeight: 9,
    },
    {
      id: RewardId.MAX_POTION,
      weight: (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(p => p.getInverseHp() >= 100 && p.getHpRatio() <= 0.5 && !p.isFainted()).length,
          3,
        );
        return thresholdPartyMemberCount;
      },
      maxWeight: 3,
    },
    {
      id: RewardId.FULL_RESTORE,
      weight: (party: Pokemon[]) => {
        const statusEffectPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp
              && !!p.status
              && !p
                .iterHeldItems()
                .filter(i => i in [HeldItemId.TOXIC_ORB, HeldItemId.FLAME_ORB])
                .some(i => (allHeldItems[i] as TurnEndStatusHeldItem).effect === p.status?.effect),
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
      maxWeight: 3,
    },
    {
      id: RewardId.ELIXIR,
      weight: (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp
              && !p.heldItemManager.hasItem(HeldItemId.LEPPA_BERRY)
              && p
                .getMoveset()
                .filter(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2))
                .length > 0,
          ).length,
          3,
        );
        return thresholdPartyMemberCount * 3;
      },
      maxWeight: 9,
    },
    {
      id: RewardId.MAX_ELIXIR,
      weight: (party: Pokemon[]) => {
        const thresholdPartyMemberCount = Math.min(
          party.filter(
            p =>
              p.hp
              && !p.heldItemManager.hasItem(HeldItemId.LEPPA_BERRY)
              && p
                .getMoveset()
                .filter(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2))
                .length > 0,
          ).length,
          3,
        );
        return thresholdPartyMemberCount;
      },
      maxWeight: 3,
    },
    { id: RewardId.DIRE_HIT, weight: 4 },
    { id: RewardId.SUPER_LURE, weight: lureWeightFunc(TrainerItemId.SUPER_LURE, 4) },
    { id: RewardId.NUGGET, weight: skipInLastClassicWaveOrDefault(5) },
    { id: RewardId.SPECIES_STAT_BOOSTER, weight: 2 },
    {
      id: RewardId.EVOLUTION_ITEM,
      weight: () => {
        return Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 15), 8);
      },
      maxWeight: 8,
    },
    {
      id: TrainerItemId.MAP,
      weight: () => (globalScene.gameMode.isClassic && globalScene.currentBattle.waveIndex < 180 ? 2 : 0),
      maxWeight: 2,
    },
    { id: HeldItemId.SOOTHE_BELL, weight: 2 },
    { id: RewardId.TM_GREAT, weight: 3 },
    {
      id: RewardId.MEMORY_MUSHROOM,
      weight: (party: Pokemon[]) => {
        if (!party.find(p => p.getLearnableLevelMoves().length)) {
          return 0;
        }
        const highestPartyLevel = party
          .map(p => p.level)
          .reduce((highestLevel: number, level: number) => Math.max(highestLevel, level), 1);
        return Math.min(Math.ceil(highestPartyLevel / 20), 4);
      },
      maxWeight: 4,
    },
    { id: RewardId.VITAMIN, weight: 3 },
    {
      id: RewardId.TERA_SHARD,
      weight: (party: Pokemon[]) =>
        party.filter(
          p =>
            !(p.hasSpecies(SpeciesId.TERAPAGOS) || p.hasSpecies(SpeciesId.OGERPON) || p.hasSpecies(SpeciesId.SHEDINJA)),
        ).length > 0
          ? 1
          : 0,
    },
    {
      id: RewardId.DNA_SPLICERS,
      weight: (party: Pokemon[]) => {
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
      maxWeight: 4,
    },
    {
      id: RewardId.VOUCHER,
      weight: (_party: Pokemon[], rerollCount: number) =>
        !globalScene.gameMode.isDaily ? Math.max(1 - rerollCount, 0) : 0,
      maxWeight: 1,
    },
  ];
}

/**
 * Initialize the Ultra modifier pool
 */
function initUltraRewardPool() {
  rewardPool[RarityTier.ULTRA] = [
    { id: RewardId.ULTRA_BALL, weight: () => (hasMaximumBalls(PokeballType.ULTRA_BALL) ? 0 : 15), maxWeight: 15 },
    { id: RewardId.MAX_LURE, weight: lureWeightFunc(TrainerItemId.MAX_LURE, 4) },
    { id: RewardId.BIG_NUGGET, weight: skipInLastClassicWaveOrDefault(12) },
    { id: RewardId.PP_MAX, weight: 3 },
    { id: RewardId.MINT, weight: 4 },
    {
      id: RewardId.RARE_EVOLUTION_ITEM,
      weight: () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 15) * 4, 32),
      maxWeight: 32,
    },
    {
      id: RewardId.FORM_CHANGE_ITEM,
      weight: () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 50), 4) * 6,
      maxWeight: 24,
    },
    { id: TrainerItemId.AMULET_COIN, weight: skipInLastClassicWaveOrDefault(3) },
    {
      id: HeldItemId.EVIOLITE,
      weight: (party: Pokemon[]) => {
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
              return !p.heldItemManager.hasItem(HeldItemId.EVIOLITE);
            }
            return false;
          })
            ? 10
            : 0;
        }
        return 0;
      },
    },
    { id: RewardId.RARE_SPECIES_STAT_BOOSTER, weight: 12 },
    {
      id: HeldItemId.LEEK,
      weight: (party: Pokemon[]) => {
        const checkedSpecies = [SpeciesId.FARFETCHD, SpeciesId.GALAR_FARFETCHD, SpeciesId.SIRFETCHD];
        // If a party member doesn't already have a Leek and is one of the relevant species, Leek can appear
        return party.some(
          p =>
            !p.heldItemManager.hasItem(HeldItemId.LEEK)
            && (checkedSpecies.includes(p.getSpeciesForm(true).speciesId)
              || (p.isFusion() && checkedSpecies.includes(p.getFusionSpeciesForm(true).speciesId))),
        )
          ? 12
          : 0;
      },
      maxWeight: 12,
    },
    {
      id: HeldItemId.TOXIC_ORB,
      weight: (party: Pokemon[]) => {
        return party.some(p => {
          const isHoldingOrb = p.iterHeldItems().some(i => i in [HeldItemId.FLAME_ORB, HeldItemId.TOXIC_ORB]);

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
      maxWeight: 10,
    },
    {
      id: HeldItemId.FLAME_ORB,
      weight: (party: Pokemon[]) => {
        return party.some(p => {
          const isHoldingOrb = p.iterHeldItems().some(i => i in [HeldItemId.FLAME_ORB, HeldItemId.TOXIC_ORB]);

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
      maxWeight: 10,
    },
    {
      id: HeldItemId.MYSTICAL_ROCK,
      weight: (party: Pokemon[]) => {
        return party.some(p => {
          const stack = p.heldItemManager.getAmount(HeldItemId.MYSTICAL_ROCK);
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
      maxWeight: 10,
    },
    { id: HeldItemId.REVIVER_SEED, weight: 4 },
    { id: TrainerItemId.CANDY_JAR, weight: skipInLastClassicWaveOrDefault(5) },
    { id: RewardId.ATTACK_TYPE_BOOSTER, weight: 9 },
    { id: RewardId.TM_ULTRA, weight: 11 },
    { id: RewardId.RARER_CANDY, weight: 4 },
    { id: HeldItemId.GOLDEN_PUNCH, weight: skipInLastClassicWaveOrDefault(2) },
    { id: TrainerItemId.IV_SCANNER, weight: skipInLastClassicWaveOrDefault(4) },
    { id: TrainerItemId.EXP_CHARM, weight: skipInLastClassicWaveOrDefault(8) },
    { id: TrainerItemId.EXP_SHARE, weight: skipInLastClassicWaveOrDefault(10) },
    {
      id: TrainerItemId.TERA_ORB,
      weight: () =>
        !globalScene.gameMode.isClassic
          ? Math.min(Math.max(Math.floor(globalScene.currentBattle.waveIndex / 50) * 2, 1), 4)
          : 0,
      maxWeight: 4,
    },
    { id: HeldItemId.QUICK_CLAW, weight: 3 },
    { id: HeldItemId.WIDE_LENS, weight: 7 },
  ];
}

function initRogueRewardPool() {
  rewardPool[RarityTier.ROGUE] = [
    { id: RewardId.ROGUE_BALL, weight: () => (hasMaximumBalls(PokeballType.ROGUE_BALL) ? 0 : 16), maxWeight: 16 },
    { id: RewardId.RELIC_GOLD, weight: skipInLastClassicWaveOrDefault(2) },
    { id: HeldItemId.LEFTOVERS, weight: 3 },
    { id: HeldItemId.SHELL_BELL, weight: 3 },
    { id: TrainerItemId.BERRY_POUCH, weight: 4 },
    { id: HeldItemId.GRIP_CLAW, weight: 5 },
    { id: HeldItemId.SCOPE_LENS, weight: 4 },
    { id: HeldItemId.BATON, weight: 2 },
    { id: HeldItemId.SOUL_DEW, weight: 7 },
    { id: TrainerItemId.CATCHING_CHARM, weight: () => (!globalScene.gameMode.isClassic ? 4 : 0), maxWeight: 4 },
    { id: TrainerItemId.ABILITY_CHARM, weight: skipInClassicAfterWave(189, 6) },
    { id: HeldItemId.FOCUS_BAND, weight: 5 },
    { id: HeldItemId.KINGS_ROCK, weight: 3 },
    { id: TrainerItemId.LOCK_CAPSULE, weight: () => (globalScene.gameMode.isClassic ? 0 : 3) },
    { id: TrainerItemId.SUPER_EXP_CHARM, weight: skipInLastClassicWaveOrDefault(8) },
    {
      id: RewardId.RARE_FORM_CHANGE_ITEM,
      weight: () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 50), 4) * 6,
      maxWeight: 24,
    },
    {
      id: TrainerItemId.MEGA_BRACELET,
      weight: () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 50), 4) * 9,
      maxWeight: 36,
    },
    {
      id: TrainerItemId.DYNAMAX_BAND,
      weight: () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / 50), 4) * 9,
      maxWeight: 36,
    },
    {
      id: RewardId.VOUCHER_PLUS,
      weight: (_party: Pokemon[], rerollCount: number) =>
        !globalScene.gameMode.isDaily ? Math.max(3 - rerollCount * 1, 0) : 0,
      maxWeight: 3,
    },
  ];
}

/**
 * Initialize the Master modifier pool
 */
function initMasterRewardPool() {
  rewardPool[RarityTier.MASTER] = [
    { id: RewardId.MASTER_BALL, weight: () => (hasMaximumBalls(PokeballType.MASTER_BALL) ? 0 : 24), maxWeight: 24 },
    { id: TrainerItemId.SHINY_CHARM, weight: 14 },
    { id: TrainerItemId.HEALING_CHARM, weight: 18 },
    { id: HeldItemId.MULTI_LENS, weight: 18 },
    {
      id: RewardId.VOUCHER_PREMIUM,
      weight: (_party: Pokemon[], rerollCount: number) =>
        !globalScene.gameMode.isDaily && !globalScene.gameMode.isEndless && !globalScene.gameMode.isSplicedOnly
          ? Math.max(5 - rerollCount * 2, 0)
          : 0,
      maxWeight: 5,
    },
    {
      id: RewardId.DNA_SPLICERS,
      weight: (party: Pokemon[]) =>
        !(globalScene.gameMode.isClassic && timedEventManager.areFusionsBoosted())
        && !globalScene.gameMode.isSplicedOnly
        && party.filter(p => !p.fusionSpecies).length > 1
          ? 24
          : 0,
      maxWeight: 24,
    },
    {
      id: HeldItemId.MINI_BLACK_HOLE,
      weight: () =>
        globalScene.gameMode.isDaily
        || (!globalScene.gameMode.isFreshStartChallenge()
          && globalScene.gameData.isUnlocked(Unlockables.MINI_BLACK_HOLE))
          ? 1
          : 0,
      maxWeight: 1,
    },
  ];
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
    return !(globalScene.gameMode.isClassic && globalScene.currentBattle.waveIndex === 199)
      && lureCount < allTrainerItems[lureId].getMaxStackCount() * 0.6
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
