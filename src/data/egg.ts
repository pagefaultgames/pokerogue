
import * as Utils from "../utils";
import BattleScene from "../battle-scene";
import { Species } from "./enums/species";
import { getPokemonSpecies, speciesStarters } from "./pokemon-species";
import { EggTier } from "./enums/egg-type";

export const EGG_SEED = 1073741824;

export enum GachaType {
  MOVE = 0,
  LEGENDARY = 1,
  SHINY = 2,
}

export class Egg {
  public id: integer;
  public tier: EggTier;
  public gachaType: GachaType;
  public hatchWaves: integer;
  public timestamp: integer;

  constructor(
    id: integer,
    gachaType: GachaType,
    hatchWaves: integer,
    timestamp: integer,
  ) {
    this.id = id;
    this.tier = Math.floor(id / EGG_SEED);
    this.gachaType = gachaType;
    this.hatchWaves = hatchWaves;
    this.timestamp = timestamp;
  }

  isManaphyEgg(): boolean {
    return this.tier === EggTier.COMMON && !(this.id % 255);
  }

  getKey(): string {
    if (this.isManaphyEgg()) return "manaphy";
    return this.tier.toString();
  }
}

export function getEggTierDefaultHatchWaves(tier: EggTier): integer {
  switch (tier) {
    case EggTier.COMMON:
      return 10;
    case EggTier.GREAT:
      return 25;
    case EggTier.ULTRA:
      return 50;
  }
  return 100;
}

export function getEggDescriptor(egg: Egg): string {
  if (egg.isManaphyEgg()) return "Manaphy";
  switch (egg.tier) {
    case EggTier.GREAT:
      return "Rare";
    case EggTier.ULTRA:
      return "Epic";
    case EggTier.MASTER:
      return "Legendary";
    default:
      return "Common";
  }
}

export function getEggHatchWavesMessage(hatchWaves: integer): string {
  if (hatchWaves <= 5)
    return "Sounds can be heard coming from inside! It will hatch soon!";
  if (hatchWaves <= 15)
    return "It appears to move occasionally. It may be close to hatching.";
  if (hatchWaves <= 50)
    return "What will hatch from this? It doesn't seem close to hatching.";
  return "It looks like this Egg will take a long time to hatch.";
}

export function getEggGachaTypeDescriptor(
  scene: BattleScene,
  egg: Egg,
): string {
  switch (egg.gachaType) {
    case GachaType.LEGENDARY:
      return `Legendary Rate Up (${getPokemonSpecies(
        getLegendaryGachaSpeciesForTimestamp(scene, egg.timestamp),
      ).getName()})`;
    case GachaType.MOVE:
      return "Rare Egg Move Rate Up";
    case GachaType.SHINY:
      return "Shiny Rate Up";
  }
}

export function getLegendaryGachaSpeciesForTimestamp(
  scene: BattleScene,
  timestamp: integer,
): Species {
  const legendarySpecies = Object.entries(speciesStarters)
    .filter((s) => s[1] >= 8 && s[1] <= 9)
    .map((s) => Number.parseInt(s[0]))
    .filter((s) => getPokemonSpecies(s).isObtainable());

  let ret: Species;

  scene.executeWithSeedOffset(
    () => {
      ret = Utils.randSeedItem(legendarySpecies);
    },
    Utils.getSunday(new Date(timestamp)).getTime(),
    EGG_SEED.toString(),
  );

  return ret;
}
