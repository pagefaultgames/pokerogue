import { BiomeId } from "#enums/biome-id";

// Initially weighted by amount of exits each biome has
// Town and End are set to 0 however
// And some other biomes were balanced +1/-1 based on average size of the total daily.
export const dailyBiomeWeights = Object.freeze({
  [BiomeId.CAVE]: 3,
  [BiomeId.LAKE]: 3,
  [BiomeId.PLAINS]: 3,
  [BiomeId.SNOWY_TAIGA]: 3,
  [BiomeId.SWAMP]: 3, // 2 -> 3
  [BiomeId.TALL_GRASS]: 3, // 2 -> 3

  [BiomeId.ABYSS]: 2, // 3 -> 2
  [BiomeId.ANCIENT_RUINS]: 2,
  [BiomeId.BADLANDS]: 2,
  [BiomeId.BEACH]: 2,
  [BiomeId.CONSTRUCTION_SITE]: 2,
  [BiomeId.DESERT]: 2,
  [BiomeId.DOJO]: 2, // 3 -> 2
  [BiomeId.FACTORY]: 2,
  [BiomeId.ENCHANTED_CAVE]: 2,
  [BiomeId.FOREST]: 2,
  [BiomeId.ROLLING_FIELDS]: 2, // 1 -> 2
  [BiomeId.MEADOW]: 2,
  [BiomeId.MOUNTAIN]: 2, // 3 -> 2
  [BiomeId.OCEAN]: 2,
  [BiomeId.SEABED]: 2,
  [BiomeId.SLUM]: 2,
  [BiomeId.OVERGROWN_TEMPLE]: 2, // 3 -> 2
  [BiomeId.VOLCANO]: 2,

  [BiomeId.HAUNTED_PASS]: 1,
  [BiomeId.FROZEN_PATH]: 1,
  [BiomeId.ISLAND]: 1,
  [BiomeId.JUNGLE]: 1,
  [BiomeId.ABANDONED_LAB]: 1,
  [BiomeId.METROPOLIS]: 1,
  [BiomeId.THERMAL_PLANT]: 1,
  [BiomeId.SPACE]: 1,
  [BiomeId.WASTELAND]: 1,

  [BiomeId.TOWN]: 0,
  [BiomeId.END]: 0,
}) satisfies Readonly<Record<BiomeId, number>>;
