import type { BattleScene } from "#app/battle-scene";
import { globalScene } from "#app/global-scene";
import Overrides from "#app/overrides";
import { pokemonPrevolutions } from "#balance/pokemon-evolutions";
import {
  BOOSTED_RARE_EGGMOVE_RATES,
  EGG_PITY_EPIC_THRESHOLD,
  EGG_PITY_LEGENDARY_THRESHOLD,
  EGG_PITY_RARE_THRESHOLD,
  GACHA_DEFAULT_COMMON_EGG_THRESHOLD,
  GACHA_DEFAULT_EPIC_EGG_THRESHOLD,
  GACHA_DEFAULT_RARE_EGG_THRESHOLD,
  GACHA_DEFAULT_SHINY_RATE,
  GACHA_EGG_HA_RATE,
  GACHA_LEGENDARY_UP_THRESHOLD_OFFSET,
  GACHA_SHINY_UP_SHINY_RATE,
  HATCH_WAVES_COMMON_EGG,
  HATCH_WAVES_EPIC_EGG,
  HATCH_WAVES_LEGENDARY_EGG,
  HATCH_WAVES_MANAPHY_EGG,
  HATCH_WAVES_RARE_EGG,
  MANAPHY_EGG_MANAPHY_RATE,
  RARE_EGGMOVE_RATES,
  SAME_SPECIES_EGG_HA_RATE,
  SAME_SPECIES_EGG_SHINY_RATE,
  SHINY_EPIC_CHANCE,
  SHINY_VARIANT_CHANCE,
} from "#balance/rates";
import { speciesEggTiers } from "#balance/species-egg-tiers";
import { speciesStarterCosts } from "#balance/starters";
import type { PokemonSpecies } from "#data/pokemon-species";
import { EggSourceType } from "#enums/egg-source-types";
import { EggTier } from "#enums/egg-type";
import { SpeciesId } from "#enums/species-id";
import { VariantTier } from "#enums/variant-tier";
import type { PlayerPokemon } from "#field/pokemon";
import { getIvsFromId, randInt, randomString, randSeedInt } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

export const EGG_SEED = 1073741824;

/** Egg options to override egg properties */
export interface IEggOptions {
  /** ID. Used to check if egg type will be manaphy (`id % 204 === 0`) */
  id?: number;
  /** Timestamp when this egg got created */
  timestamp?: number;
  /**
   * Defines if the egg got pulled from a gacha or not. If true, egg pity and pull statistics will be applied.
   * Egg will be automaticly added to the game data.
   */
  pulled?: boolean;
  /**
   * Defines where the egg comes from. Applies specific modifiers.
   * Will also define the text displayed in the egg list.
   */
  sourceType?: EggSourceType;
  /** Legacy field, kept for backwards-compatibility */
  scene?: BattleScene;
  /**
   * Sets the tier of the egg. Only species of this tier can be hatched from this egg.
   * Tier will be overriden if species `eggOption` is set.
   */
  tier?: EggTier;
  /** Sets how many waves it will take till this egg hatches. */
  hatchWaves?: number;
  /** Sets the exact species that will hatch from this egg. */
  species?: SpeciesId;
  /** Defines if the hatched pokemon will be a shiny. */
  isShiny?: boolean;
  /** Defines the variant of the pokemon that will hatch from this egg. If no `variantTier` is given the normal variant rates will apply. */
  variantTier?: VariantTier;
  /** Defines which egg move will be unlocked. `3` = rare egg move. */
  eggMoveIndex?: number;
  /**
   * Defines if the egg will hatch with the hidden ability of this species.
   * If no hidden ability exist, a random one will get choosen.
   */
  overrideHiddenAbility?: boolean;
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

  private _species: SpeciesId;
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

  get species(): SpeciesId {
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
      this._tier = eggOptions?.tier ?? Overrides.EGG_TIER_OVERRIDE ?? this.rollEggTier();
      // If egg was pulled, check if egg pity needs to override the egg tier
      if (eggOptions?.pulled) {
        // Needs this._tier and this._sourceType to work
        this.checkForPityTierOverrides();
      }

      this._id = eggOptions?.id ?? randInt(EGG_SEED, EGG_SEED * this._tier);

      this._sourceType = eggOptions?.sourceType ?? undefined;
      this._hatchWaves = eggOptions?.hatchWaves ?? this.getEggTierDefaultHatchWaves();
      this._timestamp = eggOptions?.timestamp ?? Date.now();

      // First roll shiny and variant so we can filter if species with an variant exist
      this._isShiny = eggOptions?.isShiny ?? (Overrides.EGG_SHINY_OVERRIDE || this.rollShiny());
      this._variantTier = eggOptions?.variantTier ?? Overrides.EGG_VARIANT_OVERRIDE ?? this.rollVariant();
      this._species = eggOptions?.species ?? this.rollSpecies()!; // TODO: Is this bang correct?

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
        this.increasePullStatistic();
        this.addEggToGameData();
      }
    };

    const seedOverride = randomString(24);
    globalScene.executeWithSeedOffset(
      () => {
        generateEggProperties(eggOptions);
      },
      0,
      seedOverride,
    );

    this._eggDescriptor = eggOptions?.eggDescriptor;
  }

  ////
  // #region Public methods
  ////

  public isManaphyEgg(): boolean {
    return (
      this._species === SpeciesId.PHIONE
      || this._species === SpeciesId.MANAPHY
      || (this._tier === EggTier.COMMON && !(this._id % 204) && !this._species)
    );
  }

  public getKey(): string {
    if (this.isManaphyEgg()) {
      return "manaphy";
    }
    return this._tier.toString();
  }

  // Generates a PlayerPokemon from an egg
  public generatePlayerPokemon(): PlayerPokemon {
    let ret: PlayerPokemon;

    const generatePlayerPokemonHelper = () => {
      // Legacy egg wants to hatch. Generate missing properties
      if (!this._species) {
        this._isShiny = this.rollShiny();
        this._species = this.rollSpecies()!; // TODO: is this bang correct?
      }

      let pokemonSpecies = getPokemonSpecies(this._species);
      // Special condition to have Phione eggs also have a chance of generating Manaphy
      if (this._species === SpeciesId.PHIONE && this._sourceType === EggSourceType.SAME_SPECIES_EGG) {
        pokemonSpecies = getPokemonSpecies(
          randSeedInt(MANAPHY_EGG_MANAPHY_RATE) ? SpeciesId.PHIONE : SpeciesId.MANAPHY,
        );
      }

      // Sets the hidden ability if a hidden ability exists and
      // the override is set or the egg hits the chance
      let abilityIndex: number | undefined;
      const sameSpeciesEggHACheck =
        this._sourceType === EggSourceType.SAME_SPECIES_EGG && !randSeedInt(SAME_SPECIES_EGG_HA_RATE);
      const gachaEggHACheck = !(this._sourceType === EggSourceType.SAME_SPECIES_EGG) && !randSeedInt(GACHA_EGG_HA_RATE);
      if (pokemonSpecies.abilityHidden && (this._overrideHiddenAbility || sameSpeciesEggHACheck || gachaEggHACheck)) {
        abilityIndex = 2;
      }

      // This function has way to many optional parameters
      ret = globalScene.addPlayerPokemon(pokemonSpecies, 1, abilityIndex, undefined, undefined, false);
      ret.shiny = this._isShiny;
      ret.variant = this._variantTier;

      const secondaryIvs = getIvsFromId(randSeedInt(4294967295));

      for (let s = 0; s < ret.ivs.length; s++) {
        ret.ivs[s] = Math.max(ret.ivs[s], secondaryIvs[s]);
      }
    };

    ret = ret!; // Tell TS compiler it's defined now
    globalScene.executeWithSeedOffset(
      () => {
        generatePlayerPokemonHelper();
      },
      this._id,
      EGG_SEED.toString(),
    );

    return ret;
  }

  // Doesn't need to be called if the egg got pulled by a gacha machiene
  public addEggToGameData(): void {
    globalScene.gameData.eggs.push(this);
  }

  public getEggDescriptor(): string {
    if (this.isManaphyEgg()) {
      return i18next.t("egg:manaphyTier");
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

  public getEggTypeDescriptor(): string {
    switch (this.sourceType) {
      case EggSourceType.SAME_SPECIES_EGG:
        return (
          this._eggDescriptor
          ?? i18next.t("egg:sameSpeciesEgg", {
            species: getPokemonSpecies(this._species).getName(),
          })
        );
      case EggSourceType.GACHA_LEGENDARY:
        return (
          this._eggDescriptor
          ?? `${i18next.t("egg:gachaTypeLegendary")} (${getPokemonSpecies(getLegendaryGachaSpeciesForTimestamp(this.timestamp)).getName()})`
        );
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

  /**
   * Rolls which egg move slot the egg will have.
   * 1/x chance for rare, (x-1)/3 chance for each common move.
   * x is determined by Egg Tier. Boosted rates used for eggs obtained through Move Up Gacha and Candy.
   * @returns the slot for the egg move
   */
  private rollEggMoveIndex() {
    const tierNum = this.isManaphyEgg() ? 2 : this.tier;
    let baseChance: number;
    if (this._sourceType === EggSourceType.SAME_SPECIES_EGG || this._sourceType === EggSourceType.GACHA_MOVE) {
      baseChance = BOOSTED_RARE_EGGMOVE_RATES[tierNum];
    } else {
      baseChance = RARE_EGGMOVE_RATES[tierNum];
    }

    return randSeedInt(baseChance) ? randSeedInt(3) : 3;
  }

  private getEggTierDefaultHatchWaves(eggTier?: EggTier): number {
    if (this._species === SpeciesId.PHIONE || this._species === SpeciesId.MANAPHY) {
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
    const tierValueOffset =
      this._sourceType === EggSourceType.GACHA_LEGENDARY ? GACHA_LEGENDARY_UP_THRESHOLD_OFFSET : 0;
    const tierValue = randInt(256);
    return tierValue >= GACHA_DEFAULT_COMMON_EGG_THRESHOLD + tierValueOffset
      ? EggTier.COMMON
      : tierValue >= GACHA_DEFAULT_RARE_EGG_THRESHOLD + tierValueOffset
        ? EggTier.RARE
        : tierValue >= GACHA_DEFAULT_EPIC_EGG_THRESHOLD + tierValueOffset
          ? EggTier.EPIC
          : EggTier.LEGENDARY;
  }

  private rollSpecies(): SpeciesId | null {
    if (!globalScene) {
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
      const rand = randSeedInt(MANAPHY_EGG_MANAPHY_RATE) !== 1;
      return rand ? SpeciesId.PHIONE : SpeciesId.MANAPHY;
    }
    if (this.tier === EggTier.LEGENDARY && this._sourceType === EggSourceType.GACHA_LEGENDARY && !randSeedInt(2)) {
      return getLegendaryGachaSpeciesForTimestamp(this.timestamp);
    }

    let minStarterValue: number;
    let maxStarterValue: number;

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

    const ignoredSpecies = [SpeciesId.PHIONE, SpeciesId.MANAPHY, SpeciesId.ETERNATUS];

    let speciesPool = Object.keys(speciesEggTiers)
      .filter(s => speciesEggTiers[s] === this.tier)
      .map(s => Number.parseInt(s) as SpeciesId)
      .filter(
        s =>
          !pokemonPrevolutions.hasOwnProperty(s)
          && getPokemonSpecies(s).isObtainable()
          && ignoredSpecies.indexOf(s) === -1,
      );

    // If this is the 10th egg without unlocking something new, attempt to force it.
    if (globalScene.gameData.unlockPity[this.tier] >= 9) {
      const lockedPool = speciesPool.filter(
        s => !globalScene.gameData.dexData[s].caughtAttr && !globalScene.gameData.eggs.some(e => e.species === s),
      );
      if (lockedPool.length > 0) {
        // Skip this if everything is unlocked
        speciesPool = lockedPool;
      }
    }

    // If egg variant is set to RARE or EPIC, filter species pool to only include ones with variants.
    if (this.variantTier && (this.variantTier === VariantTier.RARE || this.variantTier === VariantTier.EPIC)) {
      speciesPool = speciesPool.filter(s => getPokemonSpecies(s).hasVariants());
    }

    /**
     * Pokemon that are cheaper in their tier get a weight boost.
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
    const speciesWeights: number[] = [];
    for (const speciesId of speciesPool) {
      // Accounts for species that have starter costs outside of the normal range for their EggTier
      const speciesCostClamped = Phaser.Math.Clamp(speciesStarterCosts[speciesId], minStarterValue, maxStarterValue);
      const weight = Math.floor(
        (((maxStarterValue - speciesCostClamped) / (maxStarterValue - minStarterValue + 1)) * 1.5 + 1) * 100,
      );
      speciesWeights.push(totalWeight + weight);
      totalWeight += weight;
    }

    let species: SpeciesId;

    const rand = randSeedInt(totalWeight);
    for (let s = 0; s < speciesWeights.length; s++) {
      if (rand < speciesWeights[s]) {
        species = speciesPool[s];
        break;
      }
    }
    species = species!; // tell TS compiled it's defined now!

    if (
      globalScene.gameData.dexData[species].caughtAttr
      || globalScene.gameData.eggs.some(e => e.species === species)
    ) {
      globalScene.gameData.unlockPity[this.tier] = Math.min(globalScene.gameData.unlockPity[this.tier] + 1, 10);
    } else {
      globalScene.gameData.unlockPity[this.tier] = 0;
    }

    return species;
  }

  /**
   * Rolls whether the egg is shiny or not.
   * @returns `true` if the egg is shiny
   */
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

    return !randSeedInt(shinyChance);
  }

  // Uses the same logic as pokemon.generateVariant(). I would like to only have this logic in one
  // place but I don't want to touch the pokemon class.
  // TODO: Remove this or replace the one in the Pokemon class.
  private rollVariant(): VariantTier {
    if (!this.isShiny) {
      return VariantTier.STANDARD;
    }

    const rand = randSeedInt(10);
    if (rand >= SHINY_VARIANT_CHANCE) {
      return VariantTier.STANDARD; // 6/10
    }
    if (rand >= SHINY_EPIC_CHANCE) {
      return VariantTier.RARE; // 3/10
    }
    return VariantTier.EPIC; // 1/10
  }

  private checkForPityTierOverrides(): void {
    const tierValueOffset =
      this._sourceType === EggSourceType.GACHA_LEGENDARY ? GACHA_LEGENDARY_UP_THRESHOLD_OFFSET : 0;
    globalScene.gameData.eggPity[EggTier.RARE] += 1;
    globalScene.gameData.eggPity[EggTier.EPIC] += 1;
    globalScene.gameData.eggPity[EggTier.LEGENDARY] += 1 + tierValueOffset;
    // These numbers are roughly the 80% mark. That is, 80% of the time you'll get an egg before this gets triggered.
    if (
      globalScene.gameData.eggPity[EggTier.LEGENDARY] >= EGG_PITY_LEGENDARY_THRESHOLD
      && this._tier === EggTier.COMMON
    ) {
      this._tier = EggTier.LEGENDARY;
    } else if (globalScene.gameData.eggPity[EggTier.EPIC] >= EGG_PITY_EPIC_THRESHOLD && this._tier === EggTier.COMMON) {
      this._tier = EggTier.EPIC;
    } else if (globalScene.gameData.eggPity[EggTier.RARE] >= EGG_PITY_RARE_THRESHOLD && this._tier === EggTier.COMMON) {
      this._tier = EggTier.RARE;
    }
    globalScene.gameData.eggPity[this._tier] = 0;
  }

  private increasePullStatistic(): void {
    globalScene.gameData.gameStats.eggsPulled++;
    if (this.isManaphyEgg()) {
      globalScene.gameData.gameStats.manaphyEggsPulled++;
      this._hatchWaves = this.getEggTierDefaultHatchWaves(EggTier.EPIC);
      return;
    }
    switch (this.tier) {
      case EggTier.RARE:
        globalScene.gameData.gameStats.rareEggsPulled++;
        break;
      case EggTier.EPIC:
        globalScene.gameData.gameStats.epicEggsPulled++;
        break;
      case EggTier.LEGENDARY:
        globalScene.gameData.gameStats.legendaryEggsPulled++;
        break;
    }
  }

  private getEggTier(): EggTier {
    return speciesEggTiers[this.species] ?? EggTier.COMMON;
  }

  ////
  // #endregion
  ////
}

export function getValidLegendaryGachaSpecies(): SpeciesId[] {
  return Object.entries(speciesEggTiers)
    .filter(s => s[1] === EggTier.LEGENDARY)
    .map(s => Number.parseInt(s[0]))
    .filter(s => getPokemonSpecies(s).isObtainable() && s !== SpeciesId.ETERNATUS);
}

export function getLegendaryGachaSpeciesForTimestamp(timestamp: number): SpeciesId {
  const legendarySpecies = getValidLegendaryGachaSpecies();

  let ret: SpeciesId;

  // 86400000 is the number of miliseconds in one day
  const timeDate = new Date(timestamp);
  const dayTimestamp = timeDate.getTime(); // Timestamp of current week
  const offset = Math.floor(Math.floor(dayTimestamp / 86400000) / legendarySpecies.length); // Cycle number
  const index = Math.floor(dayTimestamp / 86400000) % legendarySpecies.length; // Index within cycle

  globalScene.executeWithSeedOffset(
    () => {
      ret = Phaser.Math.RND.shuffle(legendarySpecies)[index];
    },
    offset,
    EGG_SEED.toString(),
  );
  ret = ret!; // tell TS compiler it's

  return ret;
}

/**
 * Check for a given species EggTier Value
 * @param pokemonSpecies - Species for wich we will check the egg tier it belongs to
 * @returns The egg tier of a given pokemon species
 */
export function getEggTierForSpecies(pokemonSpecies: PokemonSpecies): EggTier {
  return speciesEggTiers[pokemonSpecies.getRootSpeciesId()];
}
