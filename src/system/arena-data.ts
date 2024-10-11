import { Arena } from "../field/arena";
import { ArenaTag } from "../data/arena-tag";
import { Biome } from "#enums/biome";
import { Weather } from "../data/weather";
import { Terrain } from "#app/data/terrain.js";

export default class ArenaData {
  public biome: Biome;
  public weather: Weather;
  public terrain: Terrain;
  public tags: ArenaTag[];

  constructor(source: Arena | any) {
    const sourceArena = source instanceof Arena ? source as Arena : null;
    this.biome = sourceArena ? sourceArena.biomeType : source.biome;
    this.weather = sourceArena ? sourceArena.weather : source.weather ? new Weather(source.weather.weatherType, source.weather.turnsLeft) : undefined;
    this.terrain = sourceArena ? sourceArena.terrain : source.terrain ? new Terrain(source.terrain.terrainType, source.terrain.turnsLeft) : undefined;
    this.tags = sourceArena ? sourceArena.tags : [];
  }
}
