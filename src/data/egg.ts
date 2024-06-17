import BattleScene from "../battle-scene";
import PokemonSpecies, { getPokemonSpecies, speciesStarters } from "./pokemon-species";
import i18next from "../plugins/i18n";
import { EggTier } from "#enums/egg-type";
import { Species } from "#enums/species";

export const EGG_SEED = 1073741824;

export enum GachaType {
  MOVE,
  LEGENDARY,
  SHINY
}

export class Egg {
  public id: integer;
  public tier: EggTier;
  public gachaType: GachaType;
  public hatchWaves: integer;
  public timestamp: integer;

  constructor(id: integer, gachaType: GachaType, hatchWaves: integer, timestamp: integer) {
    this.id = id;
    this.tier = Math.floor(id / EGG_SEED);
    this.gachaType = gachaType;
    this.hatchWaves = hatchWaves;
    this.timestamp = timestamp;
  }

  isManaphyEgg(): boolean {
    return this.tier === EggTier.COMMON && !(this.id % 204);
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

export function getEggGachaTypeDescriptor(scene: BattleScene, egg: Egg): string {
  switch (egg.gachaType) {
  case GachaType.LEGENDARY:
    return `${i18next.t("egg:gachaTypeLegendary")} (${getPokemonSpecies(getLegendaryGachaSpeciesForTimestamp(scene, egg.timestamp)).getName()})`;
  case GachaType.MOVE:
    return i18next.t("egg:gachaTypeMove");
  case GachaType.SHINY:
    return i18next.t("egg:gachaTypeShiny");
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
 * Check for a given species EggTier Value
 * @param species - Species for wich we will check the egg tier it belongs to
 * @returns The egg tier of a given pokemon species
 */
export function getEggTierForSpecies(pokemonSpecies :PokemonSpecies): EggTier {
  const speciesBaseValue = speciesStarters[pokemonSpecies.getRootSpeciesId()];
  if (speciesBaseValue <= 3) {
    return EggTier.COMMON;
  } else if (speciesBaseValue <= 5) {
    return EggTier.GREAT;
  } else if (speciesBaseValue <= 7) {
    return EggTier.ULTRA;
  }
  return EggTier.MASTER;
}
