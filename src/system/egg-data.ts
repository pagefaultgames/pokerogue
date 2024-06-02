import { Species } from "#app/data/enums/species.js";
import { Egg, EggSource, GachaType } from "../data/egg";

export default class EggData {
  public id: integer;
  public hatchWaves: integer;
  public timestamp: integer;
  public source: EggSource;
  public gachaType: GachaType;
  public forcedSpecies: Species;

  constructor(source: Egg | any) {
    const sourceEgg = source instanceof Egg ? source as Egg : null;
    this.id = sourceEgg ? sourceEgg.id : source.id;
    this.hatchWaves = sourceEgg ? sourceEgg.hatchWaves : source.hatchWaves;
    this.timestamp = sourceEgg ? sourceEgg.timestamp : source.timestamp;
    this.source = sourceEgg ? sourceEgg.source : source.source;
    this.gachaType = sourceEgg ? sourceEgg.gachaType : source.gachaType;
    this.forcedSpecies = sourceEgg ? sourceEgg.forcedSpecies : source.forcedSpecies;
  }

  toEgg(): Egg {
    return new Egg(this.id, this.hatchWaves, this.timestamp, this.source, this.gachaType, this.forcedSpecies);
  }
}
