import { ArenaTagSide } from "#app/data/arena-tag.js";
import { ArenaTagType } from "#app/data/enums/arena-tag-type.js";
import { TerrainType } from "#app/data/terrain.js";
import { WeatherType } from "#app/data/weather.js";

/** Alias for all {@linkcode ArenaEvent} type strings */
export enum ArenaEventType {
  /** Triggers when a {@linkcode WeatherType} is added, overlapped, or removed */
  WEATHER_CHANGED = "onWeatherChanged",
  /** Triggers when a {@linkcode TerrainType} is added, overlapped, or removed */
  TERRAIN_CHANGED = "onTerrainChanged",

  /** Triggers when a {@linkcode ArenaTagType} is added */
  TAG_ADDED = "onTagAdded",
  /** Triggers when a {@linkcode ArenaTagType} is removed */
  TAG_REMOVED = "onTagRemoved",
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
export class WeatherChangedEvent extends ArenaEvent {
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
export class TerrainChangedEvent extends ArenaEvent {
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
export class TagAddedEvent extends ArenaEvent {
  /** The {@linkcode ArenaTagType} being added */
  public arenaTagType: ArenaTagType;
  /** The {@linkcode ArenaTagSide} the tag is being placed on */
  public arenaTagSide: ArenaTagSide;
  constructor(arenaTagType: ArenaTagType, arenaTagSide: ArenaTagSide, duration: number) {
    super(ArenaEventType.TAG_ADDED, duration);

    this.arenaTagType = arenaTagType;
    this.arenaTagSide = arenaTagSide;
  }
}
/**
 * Container class for {@linkcode ArenaEventType.TAG_REMOVED} events
 * @extends ArenaEvent
*/
export class TagRemovedEvent extends ArenaEvent {
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
