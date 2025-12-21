import type { ArenaTag } from "#data/arena-tag";
import type { TerrainType } from "#data/terrain";
import type { WeatherType } from "#enums/weather-type";
import type { ArenaEvent } from "#events/arena";
import type { ObjectValues } from "#types/type-helpers";

/**
 * Enum representing the types of all {@linkcode ArenaEvent}s that can be emitted.
 * @eventProperty
 * @enum
 */
export const ArenaEventType = {
  /** Emitted when a {@linkcode WeatherType} is added, overlapped, or removed */
  WEATHER_CHANGED: "onWeatherChanged",
  /** Emitted when a {@linkcode TerrainType} is added, overlapped, or removed */
  TERRAIN_CHANGED: "onTerrainChanged",

  /** Emitted when a new {@linkcode ArenaTag} is added */
  ARENA_TAG_ADDED: "onArenaTagAdded",
  /** Emitted when an existing {@linkcode ArenaTag} is removed */
  ARENA_TAG_REMOVED: "onArenaTagRemoved",
} as const;

export type ArenaEventType = ObjectValues<typeof ArenaEventType>;

/**
  Doc comment removal prevention block
  {@linkcode WeatherType}
  {@linkcode TerrainType}
  {@linkcode ArenaTag}
*/
