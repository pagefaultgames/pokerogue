import type { WeatherPoolEntry } from "#data/weather";
import type { Challenges } from "#enums/challenges";
import type { EventType } from "#enums/event-type";
import type { ClassicFixedBossWaves } from "#enums/fixed-boss-waves";
import type { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { SpeciesId } from "#enums/species-id";
import type { ModifierTypeKeys } from "#modifiers/modifier-type";

export interface EventBanner {
  readonly bannerKey?: string;
  readonly xOffset?: number;
  readonly yOffset?: number;
  readonly scale?: number;
  readonly availableLangs?: readonly string[];
}

export interface EventEncounter {
  readonly species: SpeciesId;
  readonly blockEvolution?: boolean;
  readonly formIndex?: number;
}

export interface EventMysteryEncounterTier {
  readonly mysteryEncounter: MysteryEncounterType;
  readonly tier?: MysteryEncounterTier;
  readonly disable?: boolean;
}

export interface EventWaveReward {
  /**
   * The wave at which the reward should be given.
   * {@linkcode ClassicFixedBossWaves.RIVAL_1} and {@linkcode ClassicFixedBossWaves.RIVAL_2} are currently the only waves that give fixed rewards.
   */
  readonly wave: number;
  readonly type: ModifierTypeKeys;
}

export type EventMusicReplacement = readonly [string, string];

export interface EventChallenge {
  readonly challenge: Challenges;
  readonly value: number;
}

export interface TimedEvent extends EventBanner {
  readonly name: string;
  readonly eventType: EventType;
  readonly shinyEncounterMultiplier?: number;
  readonly shinyCatchMultiplier?: number;
  readonly classicFriendshipMultiplier?: number;
  readonly luckBoost?: number;
  readonly upgradeUnlockedVouchers?: boolean;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly eventEncounters?: readonly EventEncounter[];
  readonly delibirdyBuff?: readonly string[];
  readonly weather?: readonly WeatherPoolEntry[];
  readonly mysteryEncounterTierChanges?: readonly EventMysteryEncounterTier[];
  readonly luckBoostedSpecies?: readonly SpeciesId[];
  readonly boostFusions?: boolean; //MODIFIER REWORK PLEASE
  readonly classicWaveRewards?: readonly EventWaveReward[]; // Rival battle rewards
  readonly trainerShinyChance?: number; // Odds over 65536 of trainer mon generating as shiny
  readonly music?: readonly EventMusicReplacement[];
  readonly dailyRunChallenges?: readonly EventChallenge[];
  readonly dailyRunStartingItems?: readonly ModifierTypeKeys[];
}
