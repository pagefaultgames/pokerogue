import BattleScene from "#app/battle-scene";
import PokemonSpecies, { getPokemonSpecies } from "#app/data/pokemon-species";
import { speciesStarterCosts } from "#app/data/balance/starters";
import { VariantTier } from "#enums/variant-tier";
import * as Utils from "#app/utils";
import Overrides from "#app/overrides";
import { pokemonPrevolutions } from "#app/data/balance/pokemon-evolutions";
import { PlayerPokemon } from "#app/field/pokemon";
import i18next from "i18next";
import { EggTier } from "#enums/egg-type";
import { Species } from "#enums/species";
import { EggSourceType } from "#enums/egg-source-types";
import { MANAPHY_EGG_MANAPHY_RATE, SAME_SPECIES_EGG_HA_RATE, GACHA_EGG_HA_RATE, GACHA_DEFAULT_RARE_EGGMOVE_RATE, SAME_SPECIES_EGG_RARE_EGGMOVE_RATE, GACHA_MOVE_UP_RARE_EGGMOVE_RATE, GACHA_DEFAULT_SHINY_RATE, GACHA_SHINY_UP_SHINY_RATE, SAME_SPECIES_EGG_SHINY_RATE, EGG_PITY_LEGENDARY_THRESHOLD, EGG_PITY_EPIC_THRESHOLD, EGG_PITY_RARE_THRESHOLD, SHINY_VARIANT_CHANCE, SHINY_EPIC_CHANCE, GACHA_DEFAULT_COMMON_EGG_THRESHOLD, GACHA_DEFAULT_RARE_EGG_THRESHOLD, GACHA_DEFAULT_EPIC_EGG_THRESHOLD, GACHA_LEGENDARY_UP_THRESHOLD_OFFSET, HATCH_WAVES_MANAPHY_EGG, HATCH_WAVES_COMMON_EGG, HATCH_WAVES_RARE_EGG, HATCH_WAVES_EPIC_EGG, HATCH_WAVES_LEGENDARY_EGG } from "#app/data/balance/rates";
import { speciesEggTiers } from "#app/data/balance/species-egg-tiers";

export const EGG_SEED = 1073741824;

/** Egg options to override egg properties */
export interface IEggOptions {
  /** Id. Used to check if egg type will be manaphy (id % 204 === 0) */
  id?: number;
  /** Timestamp when this egg got created */
  timestamp?: number;
  /** Defines if the egg got pulled from a gacha or not. If true, egg pity and pull statistics will be applyed.
   * Egg will be automaticly added to the game data.
   * NEEDS scene eggOption to work.
   */
  pulled?: boolean;
  /** Defines where the egg comes from. Applies specific modifiers.
   * Will also define the text displayed in the egg list.
   */
  sourceType?: EggSourceType;
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
  /** Defines if the hatched pokemon will be a shiny. */
  isShiny?: boolean;
  /** Defines the variant of the pokemon that will hatch from this egg. If no variantTier is given the normal variant rates will apply. */
  variantTier?: VariantTier;
  /** Defines which egg move will be unlocked. 3 = rare egg move. */
  eggMoveIndex?: number;
  /** Defines if the egg will hatch with the hidden ability of this species.
   *  If no hidden ability exist, a random one will get choosen.
   */
  overrideHiddenAbility?: boolean,

  /** Can customize the message displayed for where the egg was obtained */
  eggDescriptor?: string;
}

export class Egg {

  ////
  // #region Private properties
  ////

  private _id: number;
  private _tier: EggTier;
  private _sourceType: EggSourceType | undefined;
  private _hatchWaves: number;
  private _timestamp: number;

  private _species: Species;
  private _isShiny: boolean;
  private _variantTier: VariantTier;
  private _eggMoveIndex: number;

  private _overrideHiddenAbility: boolean;

  private _eggDescriptor?: string;

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

  get sourceType(): EggSourceType | undefined {
    return this._sourceType;
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

  get eggMoveIndex(): number {
    return this._eggMoveIndex;
  }

  get overrideHiddenAbility(): boolean {
    return this._overrideHiddenAbility;
  }

  ////
  // #endregion
  ////

  constructor(eggOptions?: IEggOptions) {
    const generateEggProperties = (eggOptions?: IEggOptions) => {
      //if (eggOptions.tier && eggOptions.species) throw Error("Error egg can't have species and tier as option. only choose one of them.")

      this._sourceType = eggOptions?.sourceType!; // TODO: is this bang correct?
      // Ensure _sourceType is defined before invoking rollEggTier(), as it is referenced
      this._tier = eggOptions?.tier ?? (Overrides.EGG_TIER_OVERRIDE ?? this.rollEggTier());
      // If egg was pulled, check if egg pity needs to override the egg tier
      if (eggOptions?.pulled) {
        // Needs this._tier and this._sourceType to work
        this.checkForPityTierOverrides(eggOptions.scene!); // TODO: is this bang correct?
      }

      this._id = eggOptions?.id ?? Utils.randInt(EGG_SEED, EGG_SEED * this._tier);

      this._sourceType = eggOptions?.sourceType ?? undefined;
      this._hatchWaves = eggOptions?.hatchWaves ?? this.getEggTierDefaultHatchWaves();
      this._timestamp = eggOptions?.timestamp ?? new Date().getTime();

      // First roll shiny and variant so we can filter if species with an variant exist
      this._isShiny = eggOptions?.isShiny ?? (Overrides.EGG_SHINY_OVERRIDE || this.rollShiny());
      this._variantTier = eggOptions?.variantTier ?? (Overrides.EGG_VARIANT_OVERRIDE ?? this.rollVariant());
      this._species = eggOptions?.species ?? this.rollSpecies(eggOptions!.scene!)!; // TODO: Are those bangs correct?

      this._overrideHiddenAbility = eggOptions?.overrideHiddenAbility ?? false;

      // Override egg tier and hatchwaves if species was given
      if (eggOptions?.species) {
        this._tier = this.getEggTier();
        this._hatchWaves = eggOptions.hatchWaves ?? this.getEggTierDefaultHatchWaves();
      }
      // If species has no variant, set variantTier to common. This needs to
      // be done because species with no variants get filtered at rollSpecies but if the
      // species is set via options or the legendary gacha pokemon gets choosen the check never happens
      if (this._species && !getPokemonSpecies(this._species).hasVariants()) {
        this._variantTier = VariantTier.STANDARD;
      }
      // Needs this._tier so it needs to be generated afer the tier override if bought from same species
      this._eggMoveIndex = eggOptions?.eggMoveIndex ?? this.rollEggMoveIndex();
      if (eggOptions?.pulled) {
        this.increasePullStatistic(eggOptions.scene!); // TODO: is this bang correct?
        this.addEggToGameData(eggOptions.scene!); // TODO: is this bang correct?
      }
    };

    if (eggOptions?.scene) {
      const seedOverride = Utils.randomString(24);
      eggOptions?.scene.executeWithSeedOffset(() => {
        generateEggProperties(eggOptions);
      }, 0, seedOverride);
    } else { // For legacy eggs without scene
      generateEggProperties(eggOptions);
    }

    this._eggDescriptor = eggOptions?.eggDescriptor;
  }

  ////
  // #region Public methods
  ////

  public isManaphyEgg(): boolean {
    return (this._species === Species.PHIONE || this._species === Species.MANAPHY) ||
       this._tier === EggTier.COMMON && !(this._id % 204) && !this._species;
  }

  public getKey(): string {
    if (this.isManaphyEgg()) {
      return "manaphy";
    }
    return this._tier.toString();
  }

  // Generates a PlayerPokemon from an egg
  public generatePlayerPokemon(scene: BattleScene): PlayerPokemon {
    let ret: PlayerPokemon;

    const generatePlayerPokemonHelper = (scene: BattleScene) => {
      // Legacy egg wants to hatch. Generate missing properties
      if (!this._species) {
        this._isShiny = this.rollShiny();
        this._species = this.rollSpecies(scene!)!; // TODO: are these bangs correct?
      }

      let pokemonSpecies = getPokemonSpecies(this._species);
      // Special condition to have Phione eggs also have a chance of generating Manaphy
      if (this._species === Species.PHIONE && this._sourceType === EggSourceType.SAME_SPECIES_EGG) {
        pokemonSpecies = getPokemonSpecies(Utils.randSeedInt(MANAPHY_EGG_MANAPHY_RATE) ? Species.PHIONE : Species.MANAPHY);
      }

      // Sets the hidden ability if a hidden ability exists and
      // the override is set or the egg hits the chance
      let abilityIndex: number | undefined = undefined;
      const sameSpeciesEggHACheck = (this._sourceType === EggSourceType.SAME_SPECIES_EGG && !Utils.randSeedInt(SAME_SPECIES_EGG_HA_RATE));
      const gachaEggHACheck = (!(this._sourceType === EggSourceType.SAME_SPECIES_EGG) && !Utils.randSeedInt(GACHA_EGG_HA_RATE));
      if (pokemonSpecies.abilityHidden && (this._overrideHiddenAbility || sameSpeciesEggHACheck || gachaEggHACheck)) {
        abilityIndex = 2;
      }

      // This function has way to many optional parameters
      ret = scene.addPlayerPokemon(pokemonSpecies, 1, abilityIndex, undefined, undefined, false);
      ret.shiny = this._isShiny;
      ret.variant = this._variantTier;

      const secondaryIvs = Utils.getIvsFromId(Utils.randSeedInt(4294967295));

      for (let s = 0; s < ret.ivs.length; s++) {
        ret.ivs[s] = Math.max(ret.ivs[s], secondaryIvs[s]);
      }
    };

    ret = ret!;  // Tell TS compiler it's defined now
    scene.executeWithSeedOffset(() => {
      generatePlayerPokemonHelper(scene);
    }, this._id, EGG_SEED.toString());

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
      case EggTier.RARE:
        return i18next.t("egg:greatTier");
      case EggTier.EPIC:
        return i18next.t("egg:ultraTier");
      case EggTier.LEGENDARY:
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

  public getEggTypeDescriptor(scene: BattleScene): string {
    switch (this.sourceType) {
      case EggSourceType.SAME_SPECIES_EGG:
        return this._eggDescriptor ?? i18next.t("egg:sameSpeciesEgg", { species: getPokemonSpecies(this._species).getName() });
      case EggSourceType.GACHA_LEGENDARY:
        return this._eggDescriptor ?? `${i18next.t("egg:gachaTypeLegendary")} (${getPokemonSpecies(getLegendaryGachaSpeciesForTimestamp(scene, this.timestamp)).getName()})`;
      case EggSourceType.GACHA_SHINY:
        return this._eggDescriptor ?? i18next.t("egg:gachaTypeShiny");
      case EggSourceType.GACHA_MOVE:
        return this._eggDescriptor ?? i18next.t("egg:gachaTypeMove");
      case EggSourceType.EVENT:
        return this._eggDescriptor ?? i18next.t("egg:eventType");
      default:
        console.warn("getEggTypeDescriptor case not defined. Returning default empty string");
        return "";
    }
  }

  ////
  // #endregion
  ////

  ////
  // #region Private methods
  ////

  private rollEggMoveIndex() {
    let baseChance = GACHA_DEFAULT_RARE_EGGMOVE_RATE;
    switch (this._sourceType) {
      case EggSourceType.SAME_SPECIES_EGG:
        baseChance = SAME_SPECIES_EGG_RARE_EGGMOVE_RATE;
        break;
      case EggSourceType.GACHA_MOVE:
        baseChance = GACHA_MOVE_UP_RARE_EGGMOVE_RATE;
        break;
      default:
        break;
    }

    const tierMultiplier = this.isManaphyEgg() ? 2 : Math.pow(2, 3 - this.tier);
    return Utils.randSeedInt(baseChance * tierMultiplier) ? Utils.randSeedInt(3) : 3;
  }

  private getEggTierDefaultHatchWaves(eggTier?: EggTier): number {
    if (this._species === Species.PHIONE || this._species === Species.MANAPHY) {
      return HATCH_WAVES_MANAPHY_EGG;
    }

    switch (eggTier ?? this._tier) {
      case EggTier.COMMON:
        return HATCH_WAVES_COMMON_EGG;
      case EggTier.RARE:
        return HATCH_WAVES_RARE_EGG;
      case EggTier.EPIC:
        return HATCH_WAVES_EPIC_EGG;
    }
    return HATCH_WAVES_LEGENDARY_EGG;
  }

  private rollEggTier(): EggTier {
    const tierValueOffset = this._sourceType === EggSourceType.GACHA_LEGENDARY ? GACHA_LEGENDARY_UP_THRESHOLD_OFFSET : 0;
    const tierValue = Utils.randInt(256);
    return tierValue >= GACHA_DEFAULT_COMMON_EGG_THRESHOLD + tierValueOffset ? EggTier.COMMON : tierValue >= GACHA_DEFAULT_RARE_EGG_THRESHOLD + tierValueOffset ? EggTier.RARE : tierValue >= GACHA_DEFAULT_EPIC_EGG_THRESHOLD + tierValueOffset ? EggTier.EPIC : EggTier.LEGENDARY;
  }

  private rollSpecies(scene: BattleScene): Species | null {
    if (!scene) {
      return null;
    }
    /**
     * Manaphy eggs have a 1/8 chance of being Manaphy and 7/8 chance of being Phione
     * Legendary eggs pulled from the legendary gacha have a 50% of being converted into
     * the species that was the legendary focus at the time
     */
    if (this.isManaphyEgg()) {
      /**
       * Adding a technicality to make unit tests easier: By making this check pass
       * when Utils.randSeedInt(8) = 1, and by making the generatePlayerPokemon() species
       * check pass when Utils.randSeedInt(8) = 0, we can tell them apart during tests.
       */
      const rand = (Utils.randSeedInt(MANAPHY_EGG_MANAPHY_RATE) !== 1);
      return rand ? Species.PHIONE : Species.MANAPHY;
    } else if (this.tier === EggTier.LEGENDARY
      && this._sourceType === EggSourceType.GACHA_LEGENDARY) {
      if (!Utils.randSeedInt(2)) {
        return getLegendaryGachaSpeciesForTimestamp(scene, this.timestamp);
      }
    }

    let minStarterValue: integer;
    let maxStarterValue: integer;

    switch (this.tier) {
      case EggTier.RARE:
        minStarterValue = 4;
        maxStarterValue = 5;
        break;
      case EggTier.EPIC:
        minStarterValue = 6;
        maxStarterValue = 7;
        break;
      case EggTier.LEGENDARY:
        minStarterValue = 8;
        maxStarterValue = 9;
        break;
      default:
        minStarterValue = 1;
        maxStarterValue = 3;
        break;
    }

    const ignoredSpecies = [ Species.PHIONE, Species.MANAPHY, Species.ETERNATUS ];

    let speciesPool = Object.keys(speciesEggTiers)
      .filter(s => speciesEggTiers[s] === this.tier)
      .map(s => parseInt(s) as Species)
      .filter(s => !pokemonPrevolutions.hasOwnProperty(s) && getPokemonSpecies(s).isObtainable() && ignoredSpecies.indexOf(s) === -1);

    // If this is the 10th egg without unlocking something new, attempt to force it.
    if (scene.gameData.unlockPity[this.tier] >= 9) {
      const lockedPool = speciesPool.filter(s => !scene.gameData.dexData[s].caughtAttr && !scene.gameData.eggs.some(e => e.species === s));
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
     * Alolan, Galarian, Hisui, and Paldean mons get 0.5x
     *
     * The total weight is also being calculated EACH time there is an egg hatch instead of being generated once
     * and being the same each time
     */
    let totalWeight = 0;
    const speciesWeights : number[] = [];
    for (const speciesId of speciesPool) {
      // Accounts for species that have starter costs outside of the normal range for their EggTier
      const speciesCostClamped = Phaser.Math.Clamp(speciesStarterCosts[speciesId], minStarterValue, maxStarterValue);
      let weight = Math.floor((((maxStarterValue - speciesCostClamped) / ((maxStarterValue - minStarterValue) + 1)) * 1.5 + 1) * 100);
      const species = getPokemonSpecies(speciesId);
      if (species.isRegional()) {
        weight = Math.floor(weight / 2);
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
    species = species!; // tell TS compiled it's defined now!

    if (!!scene.gameData.dexData[species].caughtAttr || scene.gameData.eggs.some(e => e.species === species)) {
      scene.gameData.unlockPity[this.tier] = Math.min(scene.gameData.unlockPity[this.tier] + 1, 10);
    } else {
      scene.gameData.unlockPity[this.tier] = 0;
    }

    return species;
  }

  /**
  * Rolls whether the egg is shiny or not.
  * @returns True if the egg is shiny
  **/
  private rollShiny(): boolean {
    let shinyChance = GACHA_DEFAULT_SHINY_RATE;
    switch (this._sourceType) {
      case EggSourceType.GACHA_SHINY:
        shinyChance = GACHA_SHINY_UP_SHINY_RATE;
        break;
      case EggSourceType.SAME_SPECIES_EGG:
        shinyChance = SAME_SPECIES_EGG_SHINY_RATE;
        break;
      default:
        break;
    }

    return !Utils.randSeedInt(shinyChance);
  }

  // Uses the same logic as pokemon.generateVariant(). I would like to only have this logic in one
  // place but I don't want to touch the pokemon class.
  private rollVariant(): VariantTier {
    if (!this.isShiny) {
      return VariantTier.STANDARD;
    }

    const rand = Utils.randSeedInt(10);
    if (rand >= SHINY_VARIANT_CHANCE) {
      return VariantTier.STANDARD; // 6/10
    } else if (rand >= SHINY_EPIC_CHANCE) {
      return VariantTier.RARE;   // 3/10
    } else {
      return VariantTier.EPIC;   // 1/10
    }
  }

  private checkForPityTierOverrides(scene: BattleScene): void {
    const tierValueOffset = this._sourceType === EggSourceType.GACHA_LEGENDARY ? GACHA_LEGENDARY_UP_THRESHOLD_OFFSET : 0;
    scene.gameData.eggPity[EggTier.RARE] += 1;
    scene.gameData.eggPity[EggTier.EPIC] += 1;
    scene.gameData.eggPity[EggTier.LEGENDARY] += 1 + tierValueOffset;
    // These numbers are roughly the 80% mark. That is, 80% of the time you'll get an egg before this gets triggered.
    if (scene.gameData.eggPity[EggTier.LEGENDARY] >= EGG_PITY_LEGENDARY_THRESHOLD && this._tier === EggTier.COMMON) {
      this._tier = EggTier.LEGENDARY;
    } else if (scene.gameData.eggPity[EggTier.EPIC] >= EGG_PITY_EPIC_THRESHOLD && this._tier === EggTier.COMMON) {
      this._tier = EggTier.EPIC;
    } else if (scene.gameData.eggPity[EggTier.RARE] >= EGG_PITY_RARE_THRESHOLD && this._tier === EggTier.COMMON) {
      this._tier = EggTier.RARE;
    }
    scene.gameData.eggPity[this._tier] = 0;
  }

  private increasePullStatistic(scene: BattleScene): void {
    scene.gameData.gameStats.eggsPulled++;
    if (this.isManaphyEgg()) {
      scene.gameData.gameStats.manaphyEggsPulled++;
      this._hatchWaves = this.getEggTierDefaultHatchWaves(EggTier.EPIC);
      return;
    }
    switch (this.tier) {
      case EggTier.RARE:
        scene.gameData.gameStats.rareEggsPulled++;
        break;
      case EggTier.EPIC:
        scene.gameData.gameStats.epicEggsPulled++;
        break;
      case EggTier.LEGENDARY:
        scene.gameData.gameStats.legendaryEggsPulled++;
        break;
    }
  }

  private getEggTier(): EggTier {
    return speciesEggTiers[this.species];
  }

  ////
  // #endregion
  ////
}

export function getValidLegendaryGachaSpecies() : Species[] {
  return Object.entries(speciesEggTiers)
    .filter(s => s[1] === EggTier.LEGENDARY)
    .map(s => parseInt(s[0]))
    .filter(s => getPokemonSpecies(s).isObtainable() && s !== Species.ETERNATUS);
}

export function getLegendaryGachaSpeciesForTimestamp(scene: BattleScene, timestamp: number): Species {
  const legendarySpecies = getValidLegendaryGachaSpecies();

  let ret: Species;

  // 86400000 is the number of miliseconds in one day
  const timeDate = new Date(timestamp);
  const dayTimestamp = timeDate.getTime(); // Timestamp of current week
  const offset = Math.floor(Math.floor(dayTimestamp / 86400000) / legendarySpecies.length); // Cycle number
  const index = Math.floor(dayTimestamp / 86400000) % legendarySpecies.length; // Index within cycle

  scene.executeWithSeedOffset(() => {
    ret = Phaser.Math.RND.shuffle(legendarySpecies)[index];
  }, offset, EGG_SEED.toString());
  ret = ret!; // tell TS compiler it's

  return ret;
}

/**
 * Check for a given species EggTier Value
 * @param pokemonSpecies - Species for wich we will check the egg tier it belongs to
 * @returns The egg tier of a given pokemon species
 */
export function getEggTierForSpecies(pokemonSpecies :PokemonSpecies): EggTier {
  return speciesEggTiers[pokemonSpecies.getRootSpeciesId()];
}
