import type { TerrainType } from "#data/terrain";
import type { BiomeId } from "#enums/biome-id";
import type { BiomePoolTier } from "#enums/biome-pool-tier";
import type { SpeciesId } from "#enums/species-id";
import type { TimeOfDay } from "#enums/time-of-day";
import type { TrainerType } from "#enums/trainer-type";
import type { WeatherType } from "#enums/weather-type";
import type { AtLeastOne } from "#types/type-helpers";
import type { ReadonlyDeep } from "type-fest";

export type BiomeDepths = {
  [key: number]: [number, number];
};

export type BiomeTierTimeOfDay = {
  biome: BiomeId;
  tier: BiomePoolTier;
  timesOfDay: TimeOfDay[];
};

export type CatchableSpecies = Readonly<Record<SpeciesId, readonly BiomeTierTimeOfDay[]>>;

export type ArenaPokemonPools = Readonly<Record<BiomePoolTier, readonly SpeciesId[]>>;

export type BiomePokemonPools = ReadonlyDeep<Record<BiomePoolTier, Record<TimeOfDay, SpeciesId[]>>>;

export type TrainerPools = Readonly<Record<BiomePoolTier, readonly TrainerType[]>>;

export type WeatherPool = Readonly<AtLeastOne<Record<WeatherType, number>>>;

export type TerrainPool = Readonly<AtLeastOne<Record<TerrainType, number>>>;

export type BiomeLinks = readonly (BiomeId | readonly [BiomeId, number])[];
