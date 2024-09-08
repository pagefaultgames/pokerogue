import { EggTier } from "#enums/egg-type";
import { Species } from "#enums/species";
import { VariantTier } from "#enums/variant-tiers";
import { EGG_SEED, Egg } from "../data/egg";
import { EggSourceType } from "#app/enums/egg-source-types.js";

export default class EggData {
  public id: integer;
  public tier: EggTier;
  public sourceType: EggSourceType;
  public hatchWaves: integer;
  public timestamp: integer;
  public variantTier: VariantTier;
  public isShiny: boolean;
  public species: Species;
  public eggMoveIndex: number;
  public overrideHiddenAbility: boolean;

  constructor(source: Egg | any) {
    const sourceEgg = source instanceof Egg ? source as Egg : null;
    this.id = sourceEgg ? sourceEgg.id : source.id;
    this.tier = sourceEgg ? sourceEgg.tier : (source.tier  ?? Math.floor(this.id / EGG_SEED));
    // legacy egg
    if (source.species === 0) {
      // check if it has a gachaType (deprecated)
      this.sourceType = source.gachaType ?? source.sourceType;
    } else {
      this.sourceType = sourceEgg ? sourceEgg.sourceType : source.sourceType;
    }
    this.hatchWaves = sourceEgg ? sourceEgg.hatchWaves : source.hatchWaves;
    this.timestamp = sourceEgg ? sourceEgg.timestamp : source.timestamp;
    this.variantTier = sourceEgg ? sourceEgg.variantTier : source.variantTier;
    this.isShiny = sourceEgg ? sourceEgg.isShiny : source.isShiny;
    this.species = sourceEgg ? sourceEgg.species : source.species;
    this.eggMoveIndex = sourceEgg ? sourceEgg.eggMoveIndex : source.eggMoveIndex;
    this.overrideHiddenAbility = sourceEgg ? sourceEgg.overrideHiddenAbility : source.overrideHiddenAbility;
  }

  toEgg(): Egg {
    // Species will be 0 if an old legacy is loaded from DB
    if (!this.species) {
      return new Egg({ id: this.id, hatchWaves: this.hatchWaves, sourceType: this.sourceType, timestamp: this.timestamp, tier: Math.floor(this.id / EGG_SEED) });
    } else {
      return new Egg({id: this.id, tier: this.tier, sourceType: this.sourceType, hatchWaves: this.hatchWaves,
        timestamp: this.timestamp, variantTier: this.variantTier, isShiny: this.isShiny, species: this.species,
        eggMoveIndex: this.eggMoveIndex, overrideHiddenAbility: this.overrideHiddenAbility });
    }
  }
}
