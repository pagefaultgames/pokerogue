import type { TerrainType } from "#data/terrain";
import type { BiomeId } from "#enums/biome-id";
import type { BiomePoolTier } from "#enums/biome-pool-tier";
import type { SpeciesId } from "#enums/species-id";
import type { TimeOfDay } from "#enums/time-of-day";
import type { TrainerType } from "#enums/trainer-type";
import type { WeatherType } from "#enums/weather-type";
import type { AtLeastOne } from "#types/type-helpers";

export type BiomeDepths = {
  [key: number]: [number, number];
};

export interface BiomeTierTimeOfDay {
  biome: BiomeId;
  tier: BiomePoolTier;
  timesOfDay: TimeOfDay[];
}

export type CatchableSpecies = Readonly<Record<SpeciesId, readonly BiomeTierTimeOfDay[]>>;

export type ArenaPokemonPools = Readonly<Record<BiomePoolTier, readonly SpeciesId[]>>;

export type BiomePokemonPools = Readonly<Record<BiomePoolTier, Readonly<Record<TimeOfDay, SpeciesId[]>>>>;

export type TrainerPools = Readonly<Record<BiomePoolTier, readonly TrainerType[]>>;

export type WeatherPool = Readonly<AtLeastOne<Record<WeatherType, number>>>;

export type TerrainPool = Readonly<AtLeastOne<Record<TerrainType, number>>>;

export type BiomeLinks = readonly (BiomeId | readonly [BiomeId, number])[];

export interface Biome {
  /** The biome's ID */
  readonly biomeId: BiomeId;
  /** A mapping of `BiomePoolTier` to `TimeOfDay` to `SpeciesId` representing the wild Pokemon that appear */
  readonly pokemonPool: BiomePokemonPools;
  /** A mapping of `BiomePoolTier` to a list of `TrainerType` representing the trainers that appear */
  readonly trainerPool: TrainerPools;
  /** The chance of a trainer where `trainerChance` is the denominator. A value of `0` means no trainer */
  readonly trainerChance: number;
  /**
   * A mapping of {@linkcode WeatherType} to weight for what weather the biome will attempt to set upon entry.
   * @remarks
   * The chance of sun is set to `0` if it is dusk/night
   */
  readonly weatherPool: WeatherPool;
  /** A mapping of {@linkcode TerrainType} to weight for what terrain the biome will attempt to set upon entry */
  readonly terrainPool: TerrainPool;
  /** A string representing the bgm of the biome. Only needed if the bgm name doesn't match the biome name. */
  readonly bgm?: string;
  /** The biomes that can be travelled to from this biome */
  readonly biomeLinks: BiomeLinks;
}
