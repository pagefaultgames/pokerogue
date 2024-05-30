import BattleScene from "../battle-scene";
import { Species } from "./enums/species";
import { getPokemonSpecies, speciesStarters } from "./pokemon-species";
import { EggTier } from "./enums/egg-type";
import i18next from "../plugins/i18n";

export const EGG_SEED = 1073741824;

export enum EggSource {
  GACHA,
  CANDY
}

export enum GachaType {
  MOVE,
  LEGENDARY,
  SHINY
}

export class Egg {
  public id: integer;
  public tier: EggTier;
  public hatchWaves: integer;
  public timestamp: integer;
  public source: EggSource;
  public gachaType: GachaType;
  public species: Species;


  constructor(id: integer, hatchWaves: integer, timestamp: integer, source: EggSource, gachaType: GachaType = null, species: Species = null) {
    this.id = id;
    this.tier = species === null ? Math.floor(id / EGG_SEED) : getSpeciesTier(species);
    this.hatchWaves = hatchWaves ?? getEggTierDefaultHatchWaves(this.tier);
    this.timestamp = timestamp;
    this.source = source;
    this.gachaType = gachaType;
    this.species = species;
  }

  isManaphyEgg(): boolean {
    return (this.tier === EggTier.COMMON && !(this.id % 255)) || this.species	=== Species.PHIONE || this.species === Species.MANAPHY;
  }

  getKey(): string {
    if (this.isManaphyEgg()) {
      return "manaphy";
    }
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
  if (egg.isManaphyEgg()) {
    return "Manaphy";
  }
  switch (egg.tier) {
  case EggTier.GREAT:
    return i18next.t("egg:greatTier");
  case EggTier.ULTRA:
    return i18next.t("egg:ultraTier");
  case EggTier.MASTER:
    return i18next.t("egg:masterTier");
  default:
    return i18next.t("egg:defaultTier");
  }
}

export function getEggHatchWavesMessage(hatchWaves: integer): string {
  if (hatchWaves <= 5) {
    return i18next.t("egg:hatchWavesMessageSoon");
  }
  if (hatchWaves <= 15) {
    return i18next.t("egg:hatchWavesMessageClose");
  }
  if (hatchWaves <= 50) {
    return i18next.t("egg:hatchWavesMessageNotClose");
  }
  return i18next.t("egg:hatchWavesMessageLongTime");
}

export function getEggSourceDescriptor(scene: BattleScene, egg: Egg): string {
  switch (egg.source) {
  case EggSource.GACHA:
    if (egg.gachaType === null) {
      break;
    }
    switch (egg.gachaType) {
    case GachaType.LEGENDARY:
      return `${i18next.t("egg:gachaTypeLegendary")} (${getPokemonSpecies(getLegendaryGachaSpeciesForTimestamp(scene, egg.timestamp)).getName()})`;
    case GachaType.MOVE:
      return i18next.t("egg:gachaTypeMove");
    case GachaType.SHINY:
      return i18next.t("egg:gachaTypeShiny");
    }
  case EggSource.CANDY:
    return `${i18next.t("egg:sourceCandyExchange")} (${getPokemonSpecies(egg.species).getName()})`;
  }
}

export function getLegendaryGachaSpeciesForTimestamp(scene: BattleScene, timestamp: integer): Species {
  const legendarySpecies = Object.entries(speciesStarters)
    .filter(s => s[1] >= 8 && s[1] <= 9)
    .map(s => parseInt(s[0]))
    .filter(s => getPokemonSpecies(s).isObtainable());

  let ret: Species;

  // 86400000 is the number of miliseconds in one day
  const timeDate = new Date(timestamp);
  const dayTimestamp = timeDate.getTime(); // Timestamp of current week
  const offset = Math.floor(Math.floor(dayTimestamp / 86400000) / legendarySpecies.length); // Cycle number
  const index = Math.floor(dayTimestamp / 86400000) % legendarySpecies.length; // Index within cycle

  scene.executeWithSeedOffset(() => {
    ret = Phaser.Math.RND.shuffle(legendarySpecies)[index];
  }, offset, EGG_SEED.toString());

  return ret;
}

/**
 * Obtains the egg tier of a starter species, using its starter value
 * @param species The {@linkcode Species} of which we are trying to obtain the egg tier
 * @returns the {@linkcode EggTier} from which this species usually hatches from, or {@linkcode EggTier.COMMON} if not a starter species
 */
export function getSpeciesTier(species: Species): EggTier {
  if (species === Species.PHIONE || species === Species.MANAPHY) {
    return EggTier.COMMON;
  }

  const starterValue = speciesStarters[species] ?? 1;
  if (starterValue >= 8) {
    return EggTier.MASTER;
  }
  if (starterValue >= 6) {
    return EggTier.ULTRA;
  }
  if (starterValue >= 4) {
    return EggTier.GREAT;
  }
  return EggTier.COMMON;
}
