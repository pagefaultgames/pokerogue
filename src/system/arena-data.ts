import { Arena } from "../field/arena";
import { ArenaTag, getArenaTag } from "../data/arena-tag";
import { Biome } from "../data/enums/biome";
import { Weather } from "../data/weather";

export default class ArenaData {
  public biome: Biome;
  public weather: Weather;
  public tags: ArenaTag[];

  constructor(source: Arena | any) {
    const sourceArena = source instanceof Arena ? source as Arena : null;
    this.biome = sourceArena ? sourceArena.biomeType : source.biome;
    this.weather = sourceArena ? sourceArena.weather : source.weather ? new Weather(source.weather.weatherType, source.weather.turnsLeft) : undefined;
    const arenaTags: ArenaTag[] = sourceArena ? sourceArena.tags : source.tags;
    this.tags = [];
    for (let tag of arenaTags) {
      this.tags.push(getArenaTag(tag.tagType, tag.turnCount, tag.sourceMove, tag.sourceId, tag.side, tag?.targetIndex))
    }
  }
}