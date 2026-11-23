import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { speciesDataRegistry } from "#app/global-species-data-registry";
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
import { playerRewardPool } from "#items/reward-pool";
import {
  etherWeightFunc,
  getStatusedPartyMemberCount,
  lureWeightFunc,
  pokeballWeightFunc,
  potionWeightFunc,
  reviveWeightFunc,
  skipInClassicAfterWave,
  skipInLastClassicWaveOrDefault,
  statusOrbWeightFunc,
  waveScaledWeightFunc,
} from "#items/reward-weight-funcs";
import type { RewardPoolEntry } from "#types/rewards";

/** Species whose Tera type cannot be changed. */
const TERA_LOCKED_SPECIES: readonly SpeciesId[] = [SpeciesId.TERAPAGOS, SpeciesId.OGERPON, SpeciesId.SHEDINJA];

/** Abilities that set weather or terrain, making Mystical Rock useful. */
const FIELD_EFFECT_ABILITIES: readonly AbilityId[] = [
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
];

/** Moves that set weather or terrain, making Mystical Rock useful. */
const FIELD_EFFECT_MOVES: readonly MoveId[] = [
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
];

/** Species that can hold a Leek. */
const LEEK_SPECIES: readonly SpeciesId[] = [SpeciesId.FARFETCHD, SpeciesId.GALAR_FARFETCHD, SpeciesId.SIRFETCHD];

function getCommonRewardPoolEntries(): readonly RewardPoolEntry[] {
  return [
    { id: RewardId.POKEBALL, weight: pokeballWeightFunc(PokeballType.POKEBALL, 6) },
    { id: RewardId.RARE_CANDY, weight: 2 },
    { id: RewardId.POTION, weight: potionWeightFunc(10, 0.875, 3) },
    { id: RewardId.SUPER_POTION, weight: potionWeightFunc(25, 0.75, 1) },
    { id: RewardId.ETHER, weight: etherWeightFunc(3) },
    { id: RewardId.MAX_ETHER, weight: etherWeightFunc(1) },
    { id: TrainerItemId.LURE, weight: lureWeightFunc(TrainerItemId.LURE, 2) },
    { id: RewardId.TEMP_STAT_STAGE_BOOSTER, weight: 4 },
    { id: RewardId.BERRY, weight: 2 },
    { id: RewardId.TM_COMMON, weight: 2 },
  ];
}

function getGreatRewardPoolEntries(): readonly RewardPoolEntry[] {
  return [
    { id: RewardId.GREAT_BALL, weight: pokeballWeightFunc(PokeballType.GREAT_BALL, 6) },
    { id: RewardId.PP_UP, weight: 2 },
    {
      id: RewardId.FULL_HEAL,
      weight: () => Math.min(getStatusedPartyMemberCount(globalScene.getPlayerParty()), 3) * 6,
    },
    { id: RewardId.REVIVE, weight: reviveWeightFunc(9) },
    { id: RewardId.MAX_REVIVE, weight: reviveWeightFunc(3) },
    {
      id: RewardId.SACRED_ASH,
      weight: () => {
        const party = globalScene.getPlayerParty();
        return party.filter(p => p.isFainted()).length >= Math.ceil(party.length / 2) ? 1 : 0;
      },
    },
    { id: RewardId.HYPER_POTION, weight: potionWeightFunc(100, 0.625, 3) },
    { id: RewardId.MAX_POTION, weight: potionWeightFunc(100, 0.5, 1) },
    {
      id: RewardId.FULL_RESTORE,
      weight: () => {
        const statusEffectPartyMemberCount = Math.min(getStatusedPartyMemberCount(globalScene.getPlayerParty()), 3);
        const lowHpPartyMemberCount = Math.min(
          globalScene.getPlayerParty().filter(p => p.getInverseHp() >= 100 && p.getHpRatio() <= 0.5 && !p.isFainted())
            .length,
          3,
        );
        return Math.floor((lowHpPartyMemberCount + statusEffectPartyMemberCount) / 2);
      },
    },
    { id: RewardId.ELIXIR, weight: etherWeightFunc(3) },
    { id: RewardId.MAX_ELIXIR, weight: etherWeightFunc(1) },
    { id: TrainerItemId.DIRE_HIT, weight: 4 },
    { id: TrainerItemId.SUPER_LURE, weight: lureWeightFunc(TrainerItemId.SUPER_LURE, 4) },
    { id: RewardId.NUGGET, weight: skipInLastClassicWaveOrDefault(5) },
    { id: RewardId.SPECIES_STAT_BOOSTER, weight: 2 },
    { id: RewardId.EVOLUTION_ITEM, weight: waveScaledWeightFunc(15, 8, 1) },
    {
      id: TrainerItemId.MAP,
      weight: () => (globalScene.gameMode.isClassic && globalScene.currentBattle.waveIndex < 180 ? 2 : 0),
    },
    { id: HeldItemId.SOOTHE_BELL, weight: 2 },
    { id: RewardId.TM_GREAT, weight: 3 },
    {
      id: RewardId.MEMORY_MUSHROOM,
      weight: () => {
        const party = globalScene.getPlayerParty();
        if (!party.some(p => p.getLearnableLevelMoves().length > 0)) {
          return 0;
        }

        const { waveIndex } = globalScene.currentBattle;
        const modeAdjustedWave = globalScene.gameMode.getWaveForDifficulty(waveIndex, true);
        return Math.min(1 + Math.floor(modeAdjustedWave / 30), 4);
      },
    },
    { id: RewardId.VITAMIN, weight: 3 },
    {
      id: RewardId.TERA_SHARD,
      weight: () => (globalScene.getPlayerParty().some(p => !TERA_LOCKED_SPECIES.some(s => p.hasSpecies(s))) ? 1 : 0),
    },
    {
      id: RewardId.DNA_SPLICERS,
      weight: () => {
        if (globalScene.getPlayerParty().filter(p => !p.fusionSpecies).length > 1) {
          if (globalScene.gameMode.isSplicedOnly) {
            return 4;
          }
          if (globalScene.gameMode.isClassic && timedEventManager.areFusionsBoosted()) {
            return 2;
          }
        }
        return 0;
      },
    },
    {
      id: RewardId.VOUCHER,
      weight: rerollCount => (globalScene.gameMode.isDaily ? 0 : Math.max(1 - rerollCount, 0)),
    },
  ];
}

function getUltraRewardPoolEntries(): readonly RewardPoolEntry[] {
  return [
    { id: RewardId.ULTRA_BALL, weight: pokeballWeightFunc(PokeballType.ULTRA_BALL, 15) },
    { id: TrainerItemId.MAX_LURE, weight: lureWeightFunc(TrainerItemId.MAX_LURE, 4) },
    { id: RewardId.BIG_NUGGET, weight: skipInLastClassicWaveOrDefault(12) },
    { id: RewardId.PP_MAX, weight: 3 },
    { id: RewardId.MINT, weight: 4 },
    { id: RewardId.RARE_EVOLUTION_ITEM, weight: waveScaledWeightFunc(15, 8, 4) },
    { id: RewardId.FORM_CHANGE_ITEM, weight: waveScaledWeightFunc(50, 4, 6) },
    { id: TrainerItemId.AMULET_COIN, weight: skipInLastClassicWaveOrDefault(3) },
    {
      id: HeldItemId.EVIOLITE,
      weight: () => {
        if (!globalScene.getUnlockStatus(Unlockables.EVIOLITE)) {
          return 0;
        }
        return globalScene.getPlayerParty().some(p => {
          // Check if Pokemon's species (or fusion species, if applicable) can evolve or if they're G-Max'd
          if (
            !p.isMax()
            && (speciesDataRegistry.hasEvolutions(p.getSpeciesForm(true).speciesId)
              || (p.isFusion() && speciesDataRegistry.hasEvolutions(p.getFusionSpeciesForm(true).speciesId)))
          ) {
            // Check if Pokemon is already holding an Eviolite
            return !p.heldItemManager.hasItem(HeldItemId.EVIOLITE);
          }
          return false;
        })
          ? 10
          : 0;
      },
    },
    { id: RewardId.RARE_SPECIES_STAT_BOOSTER, weight: 12 },
    {
      id: HeldItemId.LEEK,
      // If a party member doesn't already have a Leek and is one of the relevant species, Leek can appear
      weight: () =>
        globalScene
          .getPlayerParty()
          .some(
            p =>
              !p.heldItemManager.hasItem(HeldItemId.LEEK)
              && (LEEK_SPECIES.includes(p.getSpeciesForm(true).speciesId)
                || (p.isFusion() && LEEK_SPECIES.includes(p.getFusionSpeciesForm(true).speciesId))),
          )
          ? 12
          : 0,
    },
    {
      id: HeldItemId.TOXIC_ORB,
      weight: statusOrbWeightFunc(
        StatusEffect.TOXIC,
        [AbilityId.TOXIC_BOOST, AbilityId.POISON_HEAL],
        [AbilityId.FLARE_BOOST],
        10,
      ),
    },
    {
      id: HeldItemId.FLAME_ORB,
      weight: statusOrbWeightFunc(
        StatusEffect.BURN,
        [AbilityId.FLARE_BOOST],
        [AbilityId.TOXIC_BOOST, AbilityId.POISON_HEAL],
        10,
      ),
    },
    {
      id: HeldItemId.MYSTICAL_ROCK,
      weight: () =>
        globalScene.getPlayerParty().some(p => {
          if (p.heldItemManager.isMaxStack(HeldItemId.MYSTICAL_ROCK)) {
            return false;
          }
          const moveset = p.getMoveset(true).map(m => m.moveId);
          return (
            FIELD_EFFECT_ABILITIES.some(a => p.hasAbility(a, false, true))
            || FIELD_EFFECT_MOVES.some(m => moveset.includes(m))
          );
        })
          ? 10
          : 0,
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
        globalScene.gameMode.isClassic
          ? 0
          : Math.min(Math.max(Math.floor(globalScene.currentBattle.waveIndex / 50) * 2, 1), 4),
    },
    { id: HeldItemId.QUICK_CLAW, weight: 3 },
    { id: HeldItemId.WIDE_LENS, weight: 7 },
  ];
}

function getRogueRewardPoolEntries(): readonly RewardPoolEntry[] {
  return [
    { id: RewardId.ROGUE_BALL, weight: pokeballWeightFunc(PokeballType.ROGUE_BALL, 16) },
    { id: RewardId.RELIC_GOLD, weight: skipInLastClassicWaveOrDefault(2) },
    { id: HeldItemId.LEFTOVERS, weight: 3 },
    { id: HeldItemId.SHELL_BELL, weight: 3 },
    { id: TrainerItemId.BERRY_POUCH, weight: 4 },
    { id: HeldItemId.GRIP_CLAW, weight: 5 },
    { id: HeldItemId.SCOPE_LENS, weight: 4 },
    { id: HeldItemId.BATON, weight: 2 },
    { id: HeldItemId.SOUL_DEW, weight: 7 },
    { id: TrainerItemId.CATCHING_CHARM, weight: () => (globalScene.gameMode.isClassic ? 0 : 4) },
    { id: TrainerItemId.ABILITY_CHARM, weight: skipInClassicAfterWave(189, 6) },
    { id: HeldItemId.FOCUS_BAND, weight: 5 },
    { id: HeldItemId.KINGS_ROCK, weight: 3 },
    { id: TrainerItemId.LOCK_CAPSULE, weight: () => (globalScene.gameMode.isClassic ? 0 : 3) },
    { id: TrainerItemId.SUPER_EXP_CHARM, weight: skipInLastClassicWaveOrDefault(8) },
    { id: RewardId.RARE_FORM_CHANGE_ITEM, weight: waveScaledWeightFunc(50, 4, 6) },
    { id: TrainerItemId.MEGA_BRACELET, weight: waveScaledWeightFunc(50, 4, 9) },
    { id: TrainerItemId.DYNAMAX_BAND, weight: waveScaledWeightFunc(50, 4, 9) },
    {
      id: RewardId.VOUCHER_PLUS,
      weight: rerollCount => (globalScene.gameMode.isDaily ? 0 : Math.max(3 - rerollCount, 0)),
    },
  ];
}

function getMasterRewardPoolEntries(): readonly RewardPoolEntry[] {
  return [
    { id: RewardId.MASTER_BALL, weight: pokeballWeightFunc(PokeballType.MASTER_BALL, 24) },
    { id: TrainerItemId.SHINY_CHARM, weight: 14 },
    { id: TrainerItemId.HEALING_CHARM, weight: 18 },
    { id: HeldItemId.MULTI_LENS, weight: 18 },
    {
      id: RewardId.VOUCHER_PREMIUM,
      weight: rerollCount =>
        !globalScene.gameMode.isDaily && !globalScene.gameMode.isEndless && !globalScene.gameMode.isSplicedOnly
          ? Math.max(5 - rerollCount * 2, 0)
          : 0,
    },
    {
      id: RewardId.DNA_SPLICERS,
      weight: () =>
        !(globalScene.gameMode.isClassic && timedEventManager.areFusionsBoosted())
        && !globalScene.gameMode.isSplicedOnly
        && globalScene.getPlayerParty().filter(p => !p.fusionSpecies).length > 1
          ? 24
          : 0,
    },
    {
      id: HeldItemId.MINI_BLACK_HOLE,
      weight: () => (globalScene.getUnlockStatus(Unlockables.MINI_BLACK_HOLE) ? 1 : 0),
    },
  ];
}

/**
 * Populate {@linkcode playerRewardPool} with the default set of reward entries.
 */
export function initRewardPools(): void {
  playerRewardPool.setEntries({
    [RarityTier.COMMON]: getCommonRewardPoolEntries(),
    [RarityTier.GREAT]: getGreatRewardPoolEntries(),
    [RarityTier.ULTRA]: getUltraRewardPoolEntries(),
    [RarityTier.ROGUE]: getRogueRewardPoolEntries(),
    [RarityTier.MASTER]: getMasterRewardPoolEntries(),
  });
}
