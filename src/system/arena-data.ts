import type { ArenaTag } from "#data/arena-tag";
import { loadArenaTag } from "#data/arena-tag";
import type { SerializedPositionalTag } from "#data/positional-tags/load-positional-tag";
import { Terrain } from "#data/terrain";
import { Weather } from "#data/weather";
import type { BiomeId } from "#enums/biome-id";
import { Arena } from "#field/arena";

export class ArenaData {
  public biome: BiomeId;
  public weather: Weather | null;
  public terrain: Terrain | null;
  public tags: ArenaTag[];
  public positionalTags: SerializedPositionalTag[] = [];
  public playerTerasUsed: number;

  constructor(source: Arena | any) {
    const sourceArena = source instanceof Arena ? (source as Arena) : null;
    this.biome = sourceArena ? sourceArena.biomeType : source.biome;
    this.weather = sourceArena
      ? sourceArena.weather
      : source.weather
        ? new Weather(source.weather.weatherType, source.weather.turnsLeft)
        : null;
    this.terrain = sourceArena
      ? sourceArena.terrain
      : source.terrain
        ? new Terrain(source.terrain.terrainType, source.terrain.turnsLeft)
        : null;
    this.playerTerasUsed = (sourceArena ? sourceArena.playerTerasUsed : source.playerTerasUsed) ?? 0;
    this.tags = [];

    if (source.tags) {
      this.tags = source.tags.map(t => loadArenaTag(t));
    }

    this.positionalTags = (sourceArena ? sourceArena.positionalTagManager.tags : source.positionalTags) ?? [];
  }
}
