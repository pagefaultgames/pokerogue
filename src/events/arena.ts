import type { ArenaTag, EntryHazardTag } from "#data/arena-tag";
import type { TerrainType } from "#data/terrain";
import { ArenaEventType } from "#enums/arena-event-type";
import type { ArenaTagSide } from "#enums/arena-tag-side";
import type { ArenaTagType } from "#enums/arena-tag-type";
import type { WeatherType } from "#enums/weather-type";

/**
 * Abstract container class for all {@linkcode ArenaEventType} events.
 * @eventProperty
 */
abstract class ArenaEvent extends Event {
  /** The {@linkcode ArenaEventType} being emitted. */
  public declare abstract readonly type: ArenaEventType; // that's a mouthful!
  // biome-ignore lint/complexity/noUselessConstructor: changes the type of the type field
  constructor(type: ArenaEventType) {
    super(type);
  }
}

export type { ArenaEvent };

/**
 * Container class for {@linkcode ArenaEventType.WEATHER_CHANGED} events. \
 * Emitted whenever a weather effect starts, ends or is replaced.
 * @eventProperty
 */
export class WeatherChangedEvent extends ArenaEvent {
  declare type: typeof ArenaEventType.WEATHER_CHANGED;

  /** The new {@linkcode WeatherType} being set. */
  public readonly weatherType: WeatherType;
  /**
   * The new weather's current duration.
   * Unused if `weatherType` is set to {@linkcode WeatherType.NONE}.
   */
  public readonly duration: number;
  /**
   * The new weather's maximum duration.
   * Unused if `weatherType` is set to {@linkcode WeatherType.NONE}.
   */
  public readonly maxDuration: number;

  constructor(weatherType: WeatherType, duration: number, maxDuration = duration) {
    super(ArenaEventType.WEATHER_CHANGED);

    this.weatherType = weatherType;
    this.duration = duration;
    this.maxDuration = maxDuration;
  }
}

/**
 * Container class for {@linkcode ArenaEventType.TERRAIN_CHANGED} events. \
 * Emitted whenever a terrain effect starts, ends or is replaced.
 * @eventProperty
 */
export class TerrainChangedEvent extends ArenaEvent {
  declare type: typeof ArenaEventType.TERRAIN_CHANGED;

  /** The new {@linkcode TerrainType} being set. */
  public readonly terrainType: TerrainType;
  /**
   * The new terrain's current duration.
   * Unused if `terrainType` is set to {@linkcode TerrainType.NONE}.
   */
  public readonly duration: number;
  /**
   * The new terrain's maximum duration.
   * Unused if `terrainType` is set to {@linkcode TerrainType.NONE}.
   */
  public readonly maxDuration: number;

  constructor(terrainType: TerrainType, duration: number, maxDuration = duration) {
    super(ArenaEventType.TERRAIN_CHANGED);

    this.terrainType = terrainType;
    this.duration = duration;
    this.maxDuration = maxDuration;
  }
}

/**
 * Container class for {@linkcode ArenaEventType.ARENA_TAG_ADDED} events. \
 * Emitted whenever a new {@linkcode ArenaTag} is added to the arena, or whenever an existing
 * {@linkcode EntryHazardTag} overlaps and adds new layers.
 * @eventProperty
 */
export class ArenaTagAddedEvent extends ArenaEvent {
  declare type: typeof ArenaEventType.ARENA_TAG_ADDED;

  /** The {@linkcode ArenaTagType} of the tag being added */
  public readonly tagType: ArenaTagType;
  /** The {@linkcode ArenaTagSide} to which the tag is being added */
  public readonly side: ArenaTagSide;
  /** The tag's initial duration. */
  public readonly duration: number;
  /**
   * The tag's maximum duration.
   * @defaultValue `duration`
   */
  public readonly maxDuration: number;
  /**
   * A tuple containing the current and maximum number of layers of the current {@linkcode EntryHazardTag},
   * or `undefined` if the tag was not an entry hazard.
   */
  public readonly trapLayers: [current: number, max: number] | undefined;

  constructor(
    side: ArenaTagType,
    arenaTagSide: ArenaTagSide,
    duration: number,
    trapLayers?: [current: number, max: number],
    maxDuration = duration,
  ) {
    super(ArenaEventType.ARENA_TAG_ADDED);

    this.tagType = side;
    this.side = arenaTagSide;
    this.duration = duration;
    this.maxDuration = maxDuration;
    this.trapLayers = trapLayers;
  }
}

/**
 * Container class for {@linkcode ArenaEventType.ARENA_TAG_REMOVED} events. \
 * Emitted whenever an {@linkcode ArenaTag} is removed from the field for any reason.
 * @eventProperty
 */
export class ArenaTagRemovedEvent extends ArenaEvent {
  declare type: typeof ArenaEventType.ARENA_TAG_REMOVED;

  /** The {@linkcode ArenaTagType} of the tag being removed. */
  public readonly tagType: ArenaTagType;
  /** The {@linkcode ArenaTagSide} the removed tag affected. */
  public readonly side: ArenaTagSide;

  constructor(tagType: ArenaTagType, side: ArenaTagSide) {
    super(ArenaEventType.ARENA_TAG_REMOVED);

    this.tagType = tagType;
    this.side = side;
  }
}
