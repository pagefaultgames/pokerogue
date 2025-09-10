import type { ArenaTag } from "#data/arena-tag";
import { loadArenaTag, SerializableArenaTag } from "#data/arena-tag";
import type { SerializedPositionalTag } from "#data/positional-tags/load-positional-tag";
import { Terrain } from "#data/terrain";
import { Weather } from "#data/weather";
import type { BiomeId } from "#enums/biome-id";
import { Arena } from "#field/arena";
import type { ArenaTagData } from "#types/arena-tags";
import type { NonFunctionProperties } from "#types/type-helpers";

export interface SerializedArenaData {
  biome: BiomeId;
  weather: NonFunctionProperties<Weather> | null;
  terrain: NonFunctionProperties<Terrain> | null;
  tags?: ArenaTagData[];
  positionalTags: SerializedPositionalTag[];
  playerTerasUsed?: number;
}

export class ArenaData {
  public biome: BiomeId;
  public weather: Weather | null;
  public terrain: Terrain | null;
  public tags: ArenaTag[];
  public positionalTags: SerializedPositionalTag[] = [];
  public playerTerasUsed: number;

  constructor(source: Arena | SerializedArenaData) {
    // Exclude any unserializable tags from the serialized data (such as ones only lasting 1 turn).
    // NOTE: The filter has to be done _after_ map, data loaded from `ArenaTagTypeData`
    // is not yet an instance of `ArenaTag`
    this.tags =
      source.tags
        ?.map((t: ArenaTag | ArenaTagData) => loadArenaTag(t))
        ?.filter((tag): tag is SerializableArenaTag => tag instanceof SerializableArenaTag) ?? [];

    this.playerTerasUsed = source.playerTerasUsed ?? 0;

    if (source instanceof Arena) {
      this.biome = source.biomeType;
      this.weather = source.weather;
      this.terrain = source.terrain;
      // The assertion here is ok - we ensure that all tags are inside the `posTagConstructorMap` map,
      // and that all `PositionalTags` will become their respective interfaces when serialized and de-serialized.
      this.positionalTags = (source.positionalTagManager.tags as unknown as SerializedPositionalTag[]) ?? [];
      return;
    }

    this.biome = source.biome;
    this.weather = source.weather ? new Weather(source.weather.weatherType, source.weather.turnsLeft) : null;
    this.terrain = source.terrain ? new Terrain(source.terrain.terrainType, source.terrain.turnsLeft) : null;
    this.positionalTags = source.positionalTags ?? [];
  }
}
