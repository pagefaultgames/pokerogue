import BattleScene from "../battle-scene";
import i18next from '../plugins/i18n';
import * as Utils from "../utils";
import { EggTier } from "./enums/egg-type";
import { Species } from "./enums/species";
import { getPokemonSpecies, speciesStarters } from "./pokemon-species";

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
    return this.tier === EggTier.COMMON && !(this.id % 255);
  }

  getKey(): string {
    if (this.isManaphyEgg())
      return 'manaphy';
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
  if (egg.isManaphyEgg())
    return 'Manaphy';
  let ret: string;
  switch (egg.tier) {
    case EggTier.GREAT:
      ret = i18next.t('eggList:rare');
      return ret;
    case EggTier.ULTRA:
      ret = i18next.t('eggList:epic');
      return ret;
    case EggTier.MASTER:
      ret = i18next.t('eggList:legendary');
      return ret;
    default:
      ret = i18next.t('eggList:common');
      return ret;
  }
}

export function getEggHatchWavesMessage(hatchWaves: integer): string {
  let ret: string;
  switch (true) {
    case hatchWaves <= 5:
      ret = i18next.t('eggList:5waves');
      return ret;
    case hatchWaves <= 15:
      ret = i18next.t('eggList:15waves');
      return ret;
    case hatchWaves <= 50:
      ret = i18next.t('eggList:50waves');
      return ret;
    default:
      ret = i18next.t('eggList:>50waves');
      return ret;
  }
}

export function getEggGachaTypeDescriptor(scene: BattleScene, egg: Egg): string {
  let ret: string;
  switch (egg.gachaType) {
    case GachaType.LEGENDARY:
      ret = `${i18next.t('eggList:legendaryRateUp')} (${getPokemonSpecies(getLegendaryGachaSpeciesForTimestamp(scene, egg.timestamp)).getName()})`
      return ret;
    case GachaType.MOVE:
      ret = i18next.t('eggList:rareEggMoveRateUp');
      return ret;
    case GachaType.SHINY:
      ret = i18next.t('eggList:shinyRateUp');
      return ret;
  }
}

export function getLegendaryGachaSpeciesForTimestamp(scene: BattleScene, timestamp: integer): Species {
  const legendarySpecies = Object.entries(speciesStarters)
    .filter(s => s[1] >= 8 && s[1] <= 9)
    .map(s => parseInt(s[0]))
    .filter(s => getPokemonSpecies(s).isObtainable());

  let ret: Species;

  scene.executeWithSeedOffset(() => {
    ret = Utils.randSeedItem(legendarySpecies);
  }, Utils.getSunday(new Date(timestamp)).getTime(), EGG_SEED.toString());

  return ret;
}