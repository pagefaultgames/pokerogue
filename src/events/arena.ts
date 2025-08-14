import type { SerializedPositionalTag } from "#data/positional-tags/load-positional-tag";
// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { PositionalTag } from "#data/positional-tags/positional-tag";
import type { TerrainType } from "#data/terrain";
import { ArenaEventType } from "#enums/arena-event-type";
import type { ArenaTagSide } from "#enums/arena-tag-side";
import type { ArenaTagType } from "#enums/arena-tag-type";
import type { BattlerIndex } from "#enums/battler-index";
import type { PositionalTagType } from "#enums/positional-tag-type";
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
  public weatherType: WeatherType;
  /**
   * The new weather's initial duration.
   * Unused if {@linkcode weatherType} is set to {@linkcode WeatherType.NONE}.
   */
  public duration: number;

  constructor(weatherType: WeatherType, duration: number) {
    super(ArenaEventType.WEATHER_CHANGED);

    this.weatherType = weatherType;
    this.duration = duration;
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
  public terrainType: TerrainType;
  /**
   * The new terrain's initial duration.
   * Unused if {@linkcode terrainType} is set to {@linkcode TerrainType.NONE}.
   */
  public duration: number;

  constructor(terrainType: TerrainType, duration: number) {
    super(ArenaEventType.TERRAIN_CHANGED);

    this.terrainType = terrainType;
    this.duration = duration;
  }
}

/**
 * Container class for {@linkcode ArenaEventType.ARENA_TAG_ADDED} events. \
 * Emitted whenever a new {@linkcode ArenaTag} is added to the arena, or whenever an existing
 * {@linkcode ArenaTrapTag} overlaps and adds new layers.
 * @eventProperty
 */
export class ArenaTagAddedEvent extends ArenaEvent {
  declare type: typeof ArenaEventType.ARENA_TAG_ADDED;

  /** The {@linkcode ArenaTagType} of the tag being added */
  public tagType: ArenaTagType;
  /** The {@linkcode ArenaTagSide} the tag is being added too */
  public side: ArenaTagSide;
  /** The tag's initial duration. */
  public duration: number;
  /**
   * A tuple containing the current and maximum number of layers of the current {@linkcode ArenaTrapTag},
   * or `undefined` if the tag was not a trap.
   */
  public trapLayers: [current: number, max: number] | undefined;

  constructor(
    side: ArenaTagType,
    arenaTagSide: ArenaTagSide,
    duration: number,
    trapLayers?: [current: number, max: number],
  ) {
    super(ArenaEventType.ARENA_TAG_ADDED);

    this.tagType = side;
    this.side = arenaTagSide;
    this.duration = duration;
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
  public tagType: ArenaTagType;
  /** The {@linkcode ArenaTagSide} the removed tag affected. */
  public side: ArenaTagSide;

  constructor(tagType: ArenaTagType, side: ArenaTagSide) {
    super(ArenaEventType.ARENA_TAG_REMOVED);

    this.tagType = tagType;
    this.side = side;
  }
}

/**
 * Container class for {@linkcode ArenaEventType.POSITIONAL_TAG_ADDED} events. \
 * Emitted whenever a new {@linkcode PositionalTag} is spawned and added to the arena.
 * @eventProperty
 */
export class PositionalTagAddedEvent extends ArenaEvent {
  declare type: typeof ArenaEventType.POSITIONAL_TAG_ADDED;

  /** The {@linkcode SerializedPositionalTag} being added to the arena. */
  public tag: SerializedPositionalTag;

  /** The {@linkcode PositionalTagType} of the tag being added. */
  public tagType: PositionalTagType;
  /** The {@linkcode BattlerIndex} targeted by the newly created tag. */
  public targetIndex: BattlerIndex;
  /** The tag's current duration. */
  public duration: number;

  constructor(tag: SerializedPositionalTag) {
    super(ArenaEventType.POSITIONAL_TAG_ADDED);

    this.tag = tag;
  }
}

/**
 * Container class for {@linkcode ArenaEventType.POSITIONAL_TAG_REMOVED} events. \
 * Emitted whenever a currently-active {@linkcode PositionalTag} triggers (or disappears)
 * and is removed from the arena.
 * @eventProperty
 */
export class PositionalTagRemovedEvent extends ArenaEvent {
  declare type: typeof ArenaEventType.POSITIONAL_TAG_REMOVED;

  /** The {@linkcode PositionalTagType} of the tag being deleted. */
  public tagType: PositionalTagType;
  /** The {@linkcode BattlerIndex} targeted by the newly removed tag. */
  public targetIndex: BattlerIndex;

  constructor(tagType: PositionalTagType, targetIndex: BattlerIndex) {
    super(ArenaEventType.POSITIONAL_TAG_ADDED);

    this.tagType = tagType;
    this.targetIndex = targetIndex;
  }
}
