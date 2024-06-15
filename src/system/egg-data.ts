import { EggTier } from "#enums/egg-type";
import { GachaType } from "#app/enums/gacha-types";
import { Species } from "#enums/species";
import { VariantTier } from "#enums/variant-tiers";
import { Egg } from "../data/egg";

export default class EggData {
  public id: integer;
  public tier: EggTier;
  public gachaType: GachaType;
  public hatchWaves: integer;
  public timestamp: integer;
  public variantTier: VariantTier;
  public isShiny: boolean;
  public species: Species;
  public overrideRareEggMove: boolean;
  public overrideHiddenAbility: boolean;

  constructor(source: Egg | any) {
    const sourceEgg = source instanceof Egg ? source as Egg : null;
    this.id = sourceEgg ? sourceEgg.id : source.id;
    this.tier = sourceEgg ? sourceEgg.tier : source.tier;
    this.gachaType = sourceEgg ? sourceEgg.gachaType : source.gachaType;
    this.hatchWaves = sourceEgg ? sourceEgg.hatchWaves : source.hatchWaves;
    this.timestamp = sourceEgg ? sourceEgg.timestamp : source.timestamp;
    this.variantTier = sourceEgg ? sourceEgg.variantTier : source.variantTier;
    this.isShiny = sourceEgg ? sourceEgg.isShiny : source.isShiny;
    this.species = sourceEgg ? sourceEgg.species : source.species;
    this.overrideRareEggMove = sourceEgg ? sourceEgg.overrideRareEggMove : source.overrideRareEggMove;
    this.overrideHiddenAbility = sourceEgg ? sourceEgg.overrideHiddenAbility : source.overrideHiddenAbility;
  }

  toEgg(): Egg {
    return new Egg({id: this.id, tier: this.tier, gachaType: this.gachaType, hatchWaves: this.hatchWaves,
      timestamp: this.timestamp, variantTier: this.variantTier, isShiny: this.isShiny, species: this.species,
      overrideRareEggMove: this.overrideRareEggMove, overrideHiddenAbility: this.overrideHiddenAbility });
  }
}
