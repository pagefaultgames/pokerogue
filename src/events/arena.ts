import { ArenaTagSide } from "#app/data/arena-tag.js";
import { ArenaTagType } from "#enums/arena-tag-type";
import { TerrainType } from "#app/data/terrain.js";
import { WeatherType } from "#app/data/weather.js";

/** Alias for all {@linkcode ArenaEvent} type strings */
export enum ArenaEventType {
  /** Triggers when a {@linkcode WeatherType} is added, overlapped, or removed */
  WEATHER_CHANGED = "arena/weather/changed",
  /** Triggers when a {@linkcode TerrainType} is added, overlapped, or removed */
  TERRAIN_CHANGED = "arena/terrain/changed",

  /** Triggers when a {@linkcode ArenaTagType} is added */
  TAG_ADDED = "arena/tag/added",
  /** Triggers when a {@linkcode ArenaTagType} is removed */
  TAG_REMOVED = "arena/tag/removed",
}

/**
 * Base container class for all {@linkcode ArenaEventType} events
 * @extends Event
 */
export class ArenaEvent extends Event {
  /** The total duration of the {@linkcode ArenaEventType} */
  public duration: number;
  constructor(eventType: ArenaEventType, duration: number) {
    super(eventType);

    this.duration = duration;
  }
}
/**
 * Container class for {@linkcode ArenaEventType.WEATHER_CHANGED} events
 * @extends ArenaEvent
*/
export class ArenaWeatherChangedEvent extends ArenaEvent {
  /** The {@linkcode WeatherType} being overridden */
  public oldWeatherType: WeatherType;
  /** The {@linkcode WeatherType} being set */
  public newWeatherType: WeatherType;
  constructor(oldWeatherType: WeatherType, newWeatherType: WeatherType, duration: number) {
    super(ArenaEventType.WEATHER_CHANGED, duration);

    this.oldWeatherType = oldWeatherType;
    this.newWeatherType = newWeatherType;
  }
}
/**
 * Container class for {@linkcode ArenaEventType.TERRAIN_CHANGED} events
 * @extends ArenaEvent
*/
export class ArenaTerrainChangedEvent extends ArenaEvent {
  /** The {@linkcode TerrainType} being overridden */
  public oldTerrainType: TerrainType;
  /** The {@linkcode TerrainType} being set */
  public newTerrainType: TerrainType;
  constructor(oldTerrainType: TerrainType, newTerrainType: TerrainType, duration: number) {
    super(ArenaEventType.TERRAIN_CHANGED, duration);

    this.oldTerrainType = oldTerrainType;
    this.newTerrainType = newTerrainType;
  }
}

/**
 * Container class for {@linkcode ArenaEventType.TAG_ADDED} events
 * @extends ArenaEvent
*/
export class ArenaTagAddedEvent extends ArenaEvent {
  /** The {@linkcode ArenaTagType} being added */
  public arenaTagType: ArenaTagType;
  /** The {@linkcode ArenaTagSide} the tag is being placed on */
  public arenaTagSide: ArenaTagSide;
  /** The current number of layers of the arena trap. */
  public arenaTagLayers: number;
  /** The maximum amount of layers of the arena trap. */
  public arenaTagMaxLayers: number;

  constructor(arenaTagType: ArenaTagType, arenaTagSide: ArenaTagSide, duration: number, arenaTagLayers?: number, arenaTagMaxLayers?: number) {
    super(ArenaEventType.TAG_ADDED, duration);

    this.arenaTagType = arenaTagType;
    this.arenaTagSide = arenaTagSide;
    this.arenaTagLayers = arenaTagLayers;
    this.arenaTagMaxLayers = arenaTagMaxLayers;
  }
}
/**
 * Container class for {@linkcode ArenaEventType.TAG_REMOVED} events
 * @extends ArenaEvent
*/
export class ArenaTagRemovedEvent extends ArenaEvent {
  /** The {@linkcode ArenaTagType} being removed */
  public arenaTagType: ArenaTagType;
  /** The {@linkcode ArenaTagSide} the tag was being placed on */
  public arenaTagSide: ArenaTagSide;
  constructor(arenaTagType: ArenaTagType, arenaTagSide: ArenaTagSide, duration: number) {
    super(ArenaEventType.TAG_REMOVED, duration);

    this.arenaTagType = arenaTagType;
    this.arenaTagSide = arenaTagSide;
  }
}
