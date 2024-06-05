import { Arena } from "../field/arena";
import { ArenaTag } from "../data/arena-tag";
import { Biome } from "../data/enums/biome";
import { Weather } from "../data/weather";
import { Terrain } from "../data/terrain";

export default class ArenaData {
  public biome: Biome;
  public weather: Weather;
  public terrain: Terrain;
  public tags: ArenaTag[];

  constructor(source: Arena | any) {
    const sourceArena = source instanceof Arena ? source as Arena : null;
    this.biome = sourceArena ? sourceArena.biomeType : source.biome;
    this.weather = sourceArena ? sourceArena.weather : source.weather ? new Weather(source.weather.weatherType, source.weather.turnsLeft) : undefined;
    this.terrain = sourceArena ? sourceArena.terrain : source.terrain;
    this.tags = sourceArena ? sourceArena.tags : [];
  }
}
