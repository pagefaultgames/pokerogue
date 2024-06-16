import BattleScene from "../battle-scene";
import PokemonSpecies, { getPokemonSpecies, speciesStarters } from "./pokemon-species";
import i18next from "../plugins/i18n";
import { VariantTier } from "../enums/variant-tiers";
import { GachaType } from "../enums/gacha-types";
import * as Utils from "../utils";
import * as Overrides from "../overrides";
import { pokemonPrevolutions } from "./pokemon-evolutions";
import { PlayerPokemon } from "#app/field/pokemon";
import { EggTier } from "#enums/egg-type";
import { Species } from "#enums/species";

export const EGG_SEED = 1073741824;

/** Egg options to override egg properties */
export interface IEggOptions {
  /** Id. Used to check if egg type will be manaphy (id % 255 === 0) */
  id?: number;
  /** Timestamp when this egg got created */
  timestamp?: number;
  /** Defines if the egg got pulled from a gacha or not. If true, egg pity and pull statistics will be applyed.
   * Egg will be automaticly added to the game data.
   * NEEDS scene eggOption to work.
   */
  pulled?: boolean;
  /** Defines the gacha machine type where this egg was pulled from.
   * Used for shiny and species calculations.
   */
  gachaType?: GachaType;
  /** Needs to be defined if eggOption pulled is defined or if no species or isShiny is degined since this will be needed to generate them. */
  scene?: BattleScene;
  /** Sets the tier of the egg. Only species of this tier can be hatched from this egg.
   * Tier will be overriden if species eggOption is set.
   */
  tier?: EggTier;
  /** Sets how many waves it will take till this egg hatches. */
  hatchWaves?: number;
  /** Sets the exact species that will hatch from this egg.
   * Needs scene eggOption if not provided.
   */
  species?: Species;
  /** Defines if the hatched pokemon will be a shiny.
   * Needs scene eggOption if not provided.
   */
  isShiny?: boolean;
  /** Defines the variant of the pokemon that will hatch from this egg. If no variantTier is given the normal variant rates will apply. */
  variantTier?: VariantTier;
  /** Defines if the egg will hatch with the rare egg move. */
  overrideRareEggMove?: boolean;
  /** Defines if the egg will hatch with the hidden ability of this species.
   *  If no hidden ability exist, a random one will get choosen.
   */
  overrideHiddenAbility?: boolean
}

export class Egg {

  ////
  // #region Privat properties
  ////

  private _id: number;
  private _tier: EggTier;
  private _gachaType: GachaType | undefined;
  private _hatchWaves: number;
  private _timestamp: number;

  private _species: Species;
  private _isShiny: boolean;
  private _variantTier: VariantTier;

  private _overrideRareEggMove: boolean;
  private _overrideHiddenAbility: boolean;

  ////
  // #endregion
  ////

  ////
  // #region Public facing properties
  ////
  get id(): number {
    return this._id;
  }

  get tier(): EggTier {
    return this._tier;
  }

  get gachaType(): GachaType | undefined {
    return this._gachaType;
  }

  get hatchWaves(): number {
    return this._hatchWaves;
  }

  set hatchWaves(value: number) {
    this._hatchWaves = value;
  }

  get timestamp(): number {
    return this._timestamp;
  }

  get species(): Species {
    return this._species;
  }

  get isShiny(): boolean {
    return this._isShiny;
  }

  get variantTier(): VariantTier {
    return this._variantTier;
  }

  get overrideRareEggMove(): boolean {
    return this._overrideRareEggMove;
  }

  get overrideHiddenAbility(): boolean {
    return this._overrideHiddenAbility;
  }

  ////
  // #endregion
  ////

  constructor(eggOptions?: IEggOptions) {
    //if (eggOptions.tier && eggOptions.species) throw Error("Error egg can't have species and tier as option. only choose one of them.")

    this._tier = eggOptions.tier ?? (Overrides.EGG_TIER_OVERRIDE ?? this.rollEggTier());
    if (eggOptions.pulled) {
      this.checkForPityTierOverrides(eggOptions.scene);
      this.increasePullStatistic(eggOptions.scene);
    }

    this._id = eggOptions.id ?? Utils.randInt(EGG_SEED, EGG_SEED * this._tier);
    this._gachaType = eggOptions.gachaType ?? undefined;
    this._hatchWaves = eggOptions.hatchWaves ?? this.getEggTierDefaultHatchWaves();
    this._timestamp = eggOptions.timestamp ?? new Date().getTime();

    // First roll shiny and variant so we can filter if species with an variant exist
    this._isShiny = eggOptions.isShiny ?? (Overrides.EGG_SHINY_OVERRIDE || this.rollShiny(eggOptions.scene));
    this._variantTier = eggOptions.variantTier ?? (Overrides.EGG_VARIANT_OVERRIDE ?? this.rollVariant());
    this._species = eggOptions.species ?? this.rollSpecies(eggOptions.scene);

    this._overrideRareEggMove = eggOptions.overrideRareEggMove ?? false;
    this._overrideHiddenAbility = eggOptions.overrideHiddenAbility ?? false;

    // Override egg tier and hatchwaves if species was given
    if (eggOptions.species) {
      this._tier = this.getEggTierFromSpeciesStarterValue();
      this._hatchWaves = eggOptions.hatchWaves ?? this.getEggTierDefaultHatchWaves();
    }
    if (eggOptions.pulled) {
      this.addEggToGameData(eggOptions.scene);
    }
  }

  ////
  // #region Public methodes
  ////

  public isManaphyEgg(): boolean {
    return (this._species === Species.PHIONE || this._species === Species.MANAPHY) ||
       this._tier === EggTier.COMMON && !(this._id % 204);
  }

  public getKey(): string {
    if (this.isManaphyEgg()) {
      return "manaphy";
    }
    return this._tier.toString();
  }

  // Generates a PlayerPokemon from an egg
  public generatePlayerPokemon(scene: BattleScene): PlayerPokemon {
    // Legacy egg wants to hatch. Generate missing properties
    if (!this._species) {
      this._isShiny = this.rollShiny(scene);
      this._species = this.rollSpecies(scene);
    }

    const pokemonSpecies = getPokemonSpecies(this._species);

    let abilityIndex = undefined;
    if (this._overrideHiddenAbility && pokemonSpecies.abilityHidden) {
      abilityIndex = pokemonSpecies.ability2 ? 2 : 1;
    }

    // This function has way to many optional parameters
    const ret: PlayerPokemon = scene.addPlayerPokemon(pokemonSpecies, 1, abilityIndex, undefined, undefined, false);
    ret.shiny = this._isShiny;
    ret.variant = this._variantTier;

    const secondaryIvs = Utils.getIvsFromId(Utils.randSeedInt(4294967295));

    for (let s = 0; s < ret.ivs.length; s++) {
      ret.ivs[s] = Math.max(ret.ivs[s], secondaryIvs[s]);
    }

    return ret;
  }

  // Doesn't need to be called if the egg got pulled by a gacha machiene
  public addEggToGameData(scene: BattleScene): void {
    scene.gameData.eggs.push(this);
  }

  public getEggDescriptor(): string {
    if (this.isManaphyEgg()) {
      return "Manaphy";
    }
    switch (this.tier) {
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

  public getEggHatchWavesMessage(): string {
    if (this.hatchWaves <= 5) {
      return i18next.t("egg:hatchWavesMessageSoon");
    }
    if (this.hatchWaves <= 15) {
      return i18next.t("egg:hatchWavesMessageClose");
    }
    if (this.hatchWaves <= 50) {
      return i18next.t("egg:hatchWavesMessageNotClose");
    }
    return i18next.t("egg:hatchWavesMessageLongTime");
  }

  public getEggGachaTypeDescriptor(scene: BattleScene): string {
    switch (this.gachaType) {
    case GachaType.LEGENDARY:
      return `${i18next.t("egg:gachaTypeLegendary")} (${getPokemonSpecies(getLegendaryGachaSpeciesForTimestamp(scene, this.timestamp)).getName()})`;
    case GachaType.MOVE:
      return i18next.t("egg:gachaTypeMove");
    case GachaType.SHINY:
      return i18next.t("egg:gachaTypeShiny");
    }
  }

  ////
  // #endregion
  ////

  ////
  // #region Private methodes
  ////

  private getEggTierDefaultHatchWaves(eggTier?: EggTier): number {
    if (this._species === Species.PHIONE || this._species === Species.MANAPHY) {
      return 50;
    }

    switch (eggTier ?? this._tier) {
    case EggTier.COMMON:
      return 10;
    case EggTier.GREAT:
      return 25;
    case EggTier.ULTRA:
      return 50;
    }
    return 100;
  }

  private rollEggTier(): EggTier {
    const tierValueOffset = this._gachaType === GachaType.LEGENDARY ? 1 : 0;
    const tierValue = Utils.randInt(256);
    return tierValue >= 52 + tierValueOffset ? EggTier.COMMON : tierValue >= 8 + tierValueOffset ? EggTier.GREAT : tierValue >= 1 + tierValueOffset ? EggTier.ULTRA : EggTier.MASTER;
  }

  private rollSpecies(scene: BattleScene): Species {
    if (!scene) {
      return undefined;
    }
    /**
     * Manaphy eggs have a 1/8 chance of being Manaphy and 7/8 chance of being Phione
     * Legendary eggs pulled from the legendary gacha have a 50% of being converted into
     * the species that was the legendary focus at the time
     */
    if (this.isManaphyEgg()) {
      const rand = Utils.randSeedInt(8);
      return rand ? Species.PHIONE : Species.MANAPHY;
    } else if (this.tier === EggTier.MASTER
      && this.gachaType === GachaType.LEGENDARY) {
      if (!Utils.randSeedInt(2)) {
        return getLegendaryGachaSpeciesForTimestamp(scene, this.timestamp);
      }
    }

    let minStarterValue: integer;
    let maxStarterValue: integer;

    switch (this.tier) {
    case EggTier.GREAT:
      minStarterValue = 4;
      maxStarterValue = 5;
      break;
    case EggTier.ULTRA:
      minStarterValue = 6;
      maxStarterValue = 7;
      break;
    case EggTier.MASTER:
      minStarterValue = 8;
      maxStarterValue = 9;
      break;
    default:
      minStarterValue = 1;
      maxStarterValue = 3;
      break;
    }

    const ignoredSpecies = [Species.PHIONE, Species.MANAPHY, Species.ETERNATUS];

    let speciesPool = Object.keys(speciesStarters)
      .filter(s => speciesStarters[s] >= minStarterValue && speciesStarters[s] <= maxStarterValue)
      .map(s => parseInt(s) as Species)
      .filter(s => !pokemonPrevolutions.hasOwnProperty(s) && getPokemonSpecies(s).isObtainable() && ignoredSpecies.indexOf(s) === -1);

    // If this is the 10th egg without unlocking something new, attempt to force it.
    if (scene.gameData.unlockPity[this.tier] >= 9) {
      const lockedPool = speciesPool.filter(s => !scene.gameData.dexData[s].caughtAttr);
      if (lockedPool.length) { // Skip this if everything is unlocked
        speciesPool = lockedPool;
      }
    }

    // If egg variant is set to RARE or EPIC, filter species pool to only include ones with variants.
    if (this.variantTier && (this.variantTier === VariantTier.RARE || this.variantTier === VariantTier.EPIC)) {
      speciesPool = speciesPool.filter(s => getPokemonSpecies(s).hasVariants());
    }

    /**
     * Pokemon that are cheaper in their tier get a weight boost. Regionals get a weight penalty
     * 1 cost mons get 2x
     * 2 cost mons get 1.5x
     * 4, 6, 8 cost mons get 1.75x
     * 3, 5, 7, 9 cost mons get 1x
     * Alolan, Galarian, and Paldean mons get 0.5x
     * Hisui mons get 0.125x
     *
     * The total weight is also being calculated EACH time there is an egg hatch instead of being generated once
     * and being the same each time
     */
    let totalWeight = 0;
    const speciesWeights = [];
    for (const speciesId of speciesPool) {
      let weight = Math.floor((((maxStarterValue - speciesStarters[speciesId]) / ((maxStarterValue - minStarterValue) + 1)) * 1.5 + 1) * 100);
      const species = getPokemonSpecies(speciesId);
      if (species.isRegional()) {
        weight = Math.floor(weight / (species.isRareRegional() ? 8 : 2));
      }
      speciesWeights.push(totalWeight + weight);
      totalWeight += weight;
    }

    let species: Species;

    const rand = Utils.randSeedInt(totalWeight);
    for (let s = 0; s < speciesWeights.length; s++) {
      if (rand < speciesWeights[s]) {
        species = speciesPool[s];
        break;
      }
    }

    if (!!scene.gameData.dexData[species].caughtAttr) {
      scene.gameData.unlockPity[this.tier] = Math.min(scene.gameData.unlockPity[this.tier] + 1, 10);
    } else {
      scene.gameData.unlockPity[this.tier] = 0;
    }

    return species;
  }

  // Uses the same logic as pokemon.trySetShiny(). I would like to only have this logic in one
  // place but I don't want to touch the pokemon class.
  private rollShiny(scene: BattleScene): boolean {
    if (!scene) {
      return undefined;
    }

    const rand1 = Utils.binToDec(Utils.decToBin(this.id).substring(0, 16));
    const rand2 = Utils.binToDec(Utils.decToBin(this.id).substring(16, 32));

    const E = scene.gameData.trainerId ^ scene.gameData.secretId;
    const F = rand1 ^ rand2;

    const shinyThreshold = new Utils.IntegerHolder(32);
    /**
    * Non Shiny gacha Pokemon have a 1/128 chance of being shiny
    * Shiny gacha Pokemon have a 1/64 chance of being shiny
    **/
    shinyThreshold.value = this.gachaType === GachaType.SHINY ? 1024 : 512;

    return (E ^ F) < shinyThreshold.value;
  }

  // Uses the same logic as pokemon.generateVariant(). I would like to only have this logic in one
  // place but I don't want to touch the pokemon class.
  private rollVariant(): VariantTier {
    if (!this.isShiny) {
      return VariantTier.COMMON;
    }

    const rand = Utils.randSeedInt(10);
    if (rand >= 4) {
      return VariantTier.COMMON; // 6/10
    } else if (rand >= 1) {
      return VariantTier.RARE;   // 3/10
    } else {
      return VariantTier.EPIC;   // 1/10
    }
  }

  private checkForPityTierOverrides(scene: BattleScene): void {
    scene.gameData.eggPity[EggTier.GREAT] += 1;
    scene.gameData.eggPity[EggTier.ULTRA] += 1;
    scene.gameData.eggPity[EggTier.MASTER] += 1 + this._gachaType === GachaType.LEGENDARY ? 1 : 0;
    // These numbers are roughly the 80% mark. That is, 80% of the time you'll get an egg before this gets triggered.
    if (scene.gameData.eggPity[EggTier.MASTER] >= 412 && this._tier === EggTier.COMMON) {
      this._tier = EggTier.MASTER;
    } else if (scene.gameData.eggPity[EggTier.ULTRA] >= 59 && this._tier === EggTier.COMMON) {
      this._tier = EggTier.ULTRA;
    } else if (scene.gameData.eggPity[EggTier.GREAT] >= 9 && this._tier === EggTier.COMMON) {
      this._tier = EggTier.GREAT;
    }
    scene.gameData.eggPity[this._tier] = 0;
  }

  private increasePullStatistic(scene: BattleScene): void {
    scene.gameData.gameStats.eggsPulled++;
    if (this.isManaphyEgg()) {
      scene.gameData.gameStats.manaphyEggsPulled++;
      this._hatchWaves = this.getEggTierDefaultHatchWaves(EggTier.ULTRA);
      return;
    }
    switch (this.tier) {
    case EggTier.GREAT:
      scene.gameData.gameStats.rareEggsPulled++;
      break;
    case EggTier.ULTRA:
      scene.gameData.gameStats.epicEggsPulled++;
      break;
    case EggTier.MASTER:
      scene.gameData.gameStats.legendaryEggsPulled++;
      break;
    }
  }

  private getEggTierFromSpeciesStarterValue(): EggTier {
    const speciesStartValue = speciesStarters[this.species];
    if (speciesStartValue >= 1 && speciesStartValue <= 3) {
      return EggTier.COMMON;
    }
    if (speciesStartValue >= 4 && speciesStartValue <= 5) {
      return EggTier.GREAT;
    }
    if (speciesStartValue >= 6 && speciesStartValue <= 7) {
      return EggTier.ULTRA;
    }
    if (speciesStartValue >= 8) {
      return EggTier.MASTER;
    }
  }

  ////
  // #endregion
  ////
}

export function getLegendaryGachaSpeciesForTimestamp(scene: BattleScene, timestamp: number): Species {
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
