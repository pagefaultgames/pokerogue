import type { BiomeId } from "#enums/biome-id";
import type { EventType } from "#enums/event-type";
import type { ClassicFixedBossWaves } from "#enums/fixed-boss-waves";
import type { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { SpeciesId } from "#enums/species-id";
import type { TrainerType } from "#enums/trainer-type";
import type { ModifierTypeKeys } from "#modifiers/modifier-type";
import type { TerrainPool, WeatherPool } from "#types/biomes";

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
export type EventPokemonSpriteReplacement = readonly [string, string];
export type EventTrainerSpriteReplacement = readonly [TrainerType, string];

export interface EventSpriteOptions {
  /**
   * An Array of tuples [source, target] for replacing pokemon sprites during events.
   * Format for both source and target is "speciesId[/formIndex]", where formIndex is optional and defaults to 0 if not provided.
   */
  readonly pokemonReplacements: readonly EventPokemonSpriteReplacement[];
  /**
   * An Array of tuples [source, target] for replacing trainer sprites during events.
   * Source is a {@linkcode TrainerType} and target is the literal filename of the sprite to use for that trainer type during the event (without file extension).
   */
  readonly trainerReplacements: readonly EventTrainerSpriteReplacement[];
  /**
   * If true, any species not explicitly listed in the replacements array will be replaced with a random species.
   * @defaultValue false
   */
  readonly fillRandom?: boolean;
}

export type EventTextReplacement = readonly [string, string];

export type EventWeatherPools = Readonly<Partial<Record<BiomeId, WeatherPool>>>;
export type EventTerrainPools = Readonly<Partial<Record<BiomeId, TerrainPool>>>;

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
  readonly weather?: EventWeatherPools;
  readonly terrain?: EventTerrainPools;
  readonly mysteryEncounterTierChanges?: readonly EventMysteryEncounterTier[];
  readonly luckBoostedSpecies?: readonly SpeciesId[];
  readonly boostFusions?: boolean; //MODIFIER REWORK PLEASE
  readonly classicWaveRewards?: readonly EventWaveReward[]; // Rival battle rewards
  readonly trainerShinyChance?: number; // Odds over 65536 of trainer mon generating as shiny
  readonly music?: readonly EventMusicReplacement[];
  readonly sprites?: EventSpriteOptions;
  readonly textReplacements?: readonly EventTextReplacement[];
  readonly dailyRunStartingItems?: readonly ModifierTypeKeys[];
}
