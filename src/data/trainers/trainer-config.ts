import { globalScene } from "#app/global-scene";
import { doubleBattleDialogue } from "#data/double-battle-dialogue";
import type { PokemonSpecies, PokemonSpeciesFilter } from "#data/pokemon-species";
import { PartyMemberStrength } from "#enums/party-member-strength";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TeraAIMode } from "#enums/tera-ai-mode";
import { TrainerPoolTier } from "#enums/trainer-pool-tier";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { TrainerVariant } from "#enums/trainer-variant";
import type { EnemyPokemon } from "#field/pokemon";
import { getIsInitialized, initI18n } from "#plugins/i18n";
import type { EvilTeam } from "#trainers/evil-admin-trainer-pools";
import { evilAdminTrainerPools } from "#trainers/evil-admin-trainer-pools";
import {
  getGymLeaderPartyTemplate,
  TrainerPartyTemplate,
  trainerPartyTemplates,
} from "#trainers/trainer-party-template";
import type { ModifierTypeFunc } from "#types/modifier-types";
import type {
  GenAIFunc,
  GenModifiersFunc,
  PartyMemberFunc,
  PartyMemberFuncs,
  PartyTemplateFunc,
  TrainerTierPools,
} from "#types/trainer-funcs";
import { coerceArray, isNullOrUndefined, randSeedItem } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { toCamelCase, toTitleCase } from "#utils/strings";
import i18next from "i18next";

/** Minimum BST for Pokemon generated onto the Elite Four's teams */
const ELITE_FOUR_MINIMUM_BST = 460;

/** The wave at which (non-Paldean) Gym Leaders start having Tera mons*/
const GYM_LEADER_TERA_WAVE = 100;

/**
 * Stores data and helper functions about a trainers AI options.
 */
export class TrainerAI {
  public teraMode: TeraAIMode = TeraAIMode.NO_TERA;
  public instantTeras: number[];

  /**
   * @param canTerastallize Whether this trainer is allowed to tera
   */
  constructor(teraMode: TeraAIMode = TeraAIMode.NO_TERA) {
    this.teraMode = teraMode;
    this.instantTeras = [];
  }

  /**
   * Checks if a trainer can tera
   * @returns Whether this trainer can currently tera
   */
  public canTerastallize() {
    return this.teraMode !== TeraAIMode.NO_TERA;
  }

  /**
   * Sets a pokemon on this AI to just instantly Tera on first move used
   * @param index The index of the pokemon to instantly tera.
   */
  public setInstantTera(index: number) {
    this.teraMode = TeraAIMode.INSTANT_TERA;
    this.instantTeras.push(index);
  }
}

export class TrainerConfig {
  public trainerType: TrainerType;
  public trainerTypeDouble: TrainerType;
  public name: string;
  public nameFemale: string;
  public nameDouble: string;
  public title: string;
  public titleDouble: string;
  public hasGenders = false;
  public hasDouble = false;
  public hasCharSprite = false;
  public doubleOnly = false;
  public moneyMultiplier = 1;
  public isBoss = false;
  public hasStaticParty = false;
  public useSameSeedForAllMembers = false;
  public mixedBattleBgm: string;
  public battleBgm: string;
  public encounterBgm: string;
  public femaleEncounterBgm: string;
  public doubleEncounterBgm: string;
  public victoryBgm: string;
  public genModifiersFunc: GenModifiersFunc;
  public genAIFuncs: GenAIFunc[] = [];
  public modifierRewardFuncs: ModifierTypeFunc[] = [];
  public partyTemplates: TrainerPartyTemplate[];
  public partyTemplateFunc: PartyTemplateFunc;
  public partyMemberFuncs: PartyMemberFuncs = {};
  public speciesPools: TrainerTierPools;
  public speciesFilter: PokemonSpeciesFilter;
  public specialtyType: PokemonType;
  public hasVoucher = false;
  public trainerAI: TrainerAI;

  public encounterMessages: string[] = [];
  public victoryMessages: string[] = [];
  public defeatMessages: string[] = [];

  public femaleEncounterMessages: string[];
  public femaleVictoryMessages: string[];
  public femaleDefeatMessages: string[];

  public doubleEncounterMessages: string[];
  public doubleVictoryMessages: string[];
  public doubleDefeatMessages: string[];

  constructor(trainerType: TrainerType, allowLegendaries?: boolean) {
    this.trainerType = trainerType;
    this.trainerAI = new TrainerAI();
    this.name = toTitleCase(TrainerType[this.getDerivedType()]);
    this.battleBgm = "battle_trainer";
    this.mixedBattleBgm = "battle_trainer";
    this.victoryBgm = "victory_trainer";
    this.partyTemplates = [trainerPartyTemplates.TWO_AVG];
    this.speciesFilter = species =>
      (allowLegendaries || (!species.legendary && !species.subLegendary && !species.mythical))
      && !species.isTrainerForbidden();
  }

  getKey(): string {
    return TrainerType[this.getDerivedType()].toString().toLowerCase();
  }

  getSpriteKey(female?: boolean, isDouble = false): string {
    let ret = this.getKey();
    if (this.hasGenders) {
      ret += `_${female ? "f" : "m"}`;
    }
    // If a special double trainer class was set, set it as the sprite key
    if (this.trainerTypeDouble && female && isDouble) {
      // Get the derived type for the double trainer since the sprite key is based on the derived type
      ret = TrainerType[this.getDerivedType(this.trainerTypeDouble)].toString().toLowerCase();
    }
    return ret;
  }

  setName(name: string): TrainerConfig {
    if (name === "Finn") {
      // Give the rival a localized name
      // First check if i18n is initialized
      if (!getIsInitialized()) {
        initI18n();
      }
      // This is only the male name, because the female name is handled in a different function (setHasGenders)
      if (name === "Finn") {
        name = i18next.t("trainerNames:rival");
      }
    }

    this.name = name;

    return this;
  }

  /**
   * Sets if a boss trainer will have a voucher or not.
   * @param hasVoucher - If the boss trainer will have a voucher.
   */
  setHasVoucher(hasVoucher: boolean): void {
    this.hasVoucher = hasVoucher;
  }

  setTitle(title: string): TrainerConfig {
    // First check if i18n is initialized
    if (!getIsInitialized()) {
      initI18n();
    }

    title = toCamelCase(title);

    // Get the title from the i18n file
    this.title = i18next.t(`titles:${title}`);

    return this;
  }

  /**
   * Returns the derived trainer type for a given trainer type.
   * @param trainerTypeToDeriveFrom - The trainer type to derive from. (If null, the this.trainerType property will be used.)
   * @returns - The derived trainer type.
   */
  getDerivedType(trainerTypeToDeriveFrom: TrainerType | null = null): TrainerType {
    let trainerType = trainerTypeToDeriveFrom ? trainerTypeToDeriveFrom : this.trainerType;
    switch (trainerType) {
      case TrainerType.RIVAL_2:
      case TrainerType.RIVAL_3:
      case TrainerType.RIVAL_4:
      case TrainerType.RIVAL_5:
      case TrainerType.RIVAL_6:
        trainerType = TrainerType.RIVAL;
        break;
      case TrainerType.LANCE_CHAMPION:
        trainerType = TrainerType.LANCE;
        break;
      case TrainerType.LARRY_ELITE:
        trainerType = TrainerType.LARRY;
        break;
      case TrainerType.ROCKET_BOSS_GIOVANNI_2:
        trainerType = TrainerType.ROCKET_BOSS_GIOVANNI_1;
        break;
      case TrainerType.MAXIE_2:
        trainerType = TrainerType.MAXIE;
        break;
      case TrainerType.ARCHIE_2:
        trainerType = TrainerType.ARCHIE;
        break;
      case TrainerType.CYRUS_2:
        trainerType = TrainerType.CYRUS;
        break;
      case TrainerType.GHETSIS_2:
        trainerType = TrainerType.GHETSIS;
        break;
      case TrainerType.LYSANDRE_2:
        trainerType = TrainerType.LYSANDRE;
        break;
      case TrainerType.LUSAMINE_2:
        trainerType = TrainerType.LUSAMINE;
        break;
      case TrainerType.GUZMA_2:
        trainerType = TrainerType.GUZMA;
        break;
      case TrainerType.ROSE_2:
        trainerType = TrainerType.ROSE;
        break;
      case TrainerType.PENNY_2:
        trainerType = TrainerType.PENNY;
        break;
      case TrainerType.MARNIE_ELITE:
        trainerType = TrainerType.MARNIE;
        break;
      case TrainerType.NESSA_ELITE:
        trainerType = TrainerType.NESSA;
        break;
      case TrainerType.BEA_ELITE:
        trainerType = TrainerType.BEA;
        break;
      case TrainerType.ALLISTER_ELITE:
        trainerType = TrainerType.ALLISTER;
        break;
      case TrainerType.RAIHAN_ELITE:
        trainerType = TrainerType.RAIHAN;
        break;
    }

    return trainerType;
  }

  /**
   * Sets the configuration for trainers with genders, including the female name and encounter background music (BGM).
   * @param [nameFemale] The name of the female trainer. If 'Ivy', a localized name will be assigned.
   * @param [femaleEncounterBgm] The encounter BGM for the female trainer, which can be a TrainerType or a string.
   * @returns The updated TrainerConfig instance.
   */
  setHasGenders(nameFemale?: string, femaleEncounterBgm?: TrainerType | string): TrainerConfig {
    // If the female name is 'Ivy' (the rival), assign a localized name.
    if (nameFemale === "Ivy") {
      // Check if the internationalization (i18n) system is initialized.
      if (!getIsInitialized()) {
        // Initialize the i18n system if it is not already initialized.
        initI18n();
      }
      // Set the localized name for the female rival.
      this.nameFemale = i18next.t("trainerNames:rivalFemale");
    } else {
      // Otherwise, assign the provided female name.
      this.nameFemale = nameFemale!; // TODO: is this bang correct?
    }

    // Indicate that this trainer configuration includes genders.
    this.hasGenders = true;

    // If a female encounter BGM is provided.
    if (femaleEncounterBgm) {
      // If the BGM is a TrainerType (number), convert it to a string, replace underscores with spaces, and convert to lowercase.
      // Otherwise, assign the provided string as the BGM.
      this.femaleEncounterBgm =
        typeof femaleEncounterBgm === "number"
          ? TrainerType[femaleEncounterBgm].toString().replace(/_/g, " ").toLowerCase()
          : femaleEncounterBgm;
    }

    // Return the updated TrainerConfig instance.
    return this;
  }

  /**
   * Sets the configuration for trainers with double battles, including the name of the double trainer and the encounter BGM.
   * @param nameDouble The name of the double trainer (e.g., "Ace Duo" for Trainer Class Doubles or "red_blue_double" for NAMED trainer doubles).
   * @param doubleEncounterBgm The encounter BGM for the double trainer, which can be a TrainerType or a string.
   * @returns The updated TrainerConfig instance.
   */
  setHasDouble(nameDouble: string, doubleEncounterBgm?: TrainerType | string): TrainerConfig {
    this.hasDouble = true;
    this.nameDouble = nameDouble;
    if (doubleEncounterBgm) {
      this.doubleEncounterBgm =
        typeof doubleEncounterBgm === "number"
          ? TrainerType[doubleEncounterBgm].toString().replace(/_/g, " ").toLowerCase()
          : doubleEncounterBgm;
    }
    return this;
  }

  /**
   * Sets the trainer type for double battles.
   * @param trainerTypeDouble The TrainerType of the partner in a double battle.
   * @returns The updated TrainerConfig instance.
   */
  setDoubleTrainerType(trainerTypeDouble: TrainerType): TrainerConfig {
    this.trainerTypeDouble = trainerTypeDouble;
    this.setDoubleMessages(this.nameDouble);
    return this;
  }

  /**
   * Sets the encounter and victory messages for double trainers.
   * @param nameDouble - The name of the pair (e.g. "red_blue_double").
   */
  setDoubleMessages(nameDouble: string) {
    // Check if there is double battle dialogue for this trainer
    if (doubleBattleDialogue[nameDouble]) {
      // Set encounter and victory messages for double trainers
      this.doubleEncounterMessages = doubleBattleDialogue[nameDouble].encounter;
      this.doubleVictoryMessages = doubleBattleDialogue[nameDouble].victory;
      this.doubleDefeatMessages = doubleBattleDialogue[nameDouble].defeat;
    }
  }

  /**
   * Sets the title for double trainers
   * @param titleDouble The key for the title in the i18n file. (e.g., "champion_double").
   * @returns The updated TrainerConfig instance.
   */
  setDoubleTitle(titleDouble: string): TrainerConfig {
    // First check if i18n is initialized
    if (!getIsInitialized()) {
      initI18n();
    }

    titleDouble = toCamelCase(titleDouble);

    // Get the title from the i18n file
    this.titleDouble = i18next.t(`titles:${titleDouble}`);

    return this;
  }

  setHasCharSprite(): TrainerConfig {
    this.hasCharSprite = true;
    return this;
  }

  setDoubleOnly(): TrainerConfig {
    this.doubleOnly = true;
    return this;
  }

  setMoneyMultiplier(moneyMultiplier: number): TrainerConfig {
    this.moneyMultiplier = moneyMultiplier;
    return this;
  }

  setBoss(): TrainerConfig {
    this.isBoss = true;
    return this;
  }

  setStaticParty(): TrainerConfig {
    this.hasStaticParty = true;
    return this;
  }

  setUseSameSeedForAllMembers(): TrainerConfig {
    this.useSameSeedForAllMembers = true;
    return this;
  }

  setMixedBattleBgm(mixedBattleBgm: string): TrainerConfig {
    this.mixedBattleBgm = mixedBattleBgm;
    return this;
  }

  setBattleBgm(battleBgm: string): TrainerConfig {
    this.battleBgm = battleBgm;
    return this;
  }

  setEncounterBgm(encounterBgm: TrainerType | string): TrainerConfig {
    this.encounterBgm =
      typeof encounterBgm === "number" ? TrainerType[encounterBgm].toString().toLowerCase() : encounterBgm;
    return this;
  }

  setVictoryBgm(victoryBgm: string): TrainerConfig {
    this.victoryBgm = victoryBgm;
    return this;
  }

  setPartyTemplates(...partyTemplates: TrainerPartyTemplate[]): TrainerConfig {
    this.partyTemplates = partyTemplates;
    return this;
  }

  setPartyTemplateFunc(partyTemplateFunc: PartyTemplateFunc): TrainerConfig {
    this.partyTemplateFunc = partyTemplateFunc;
    return this;
  }

  setPartyMemberFunc(slotIndex: number, partyMemberFunc: PartyMemberFunc): TrainerConfig {
    this.partyMemberFuncs[slotIndex] = partyMemberFunc;
    return this;
  }

  setSpeciesPools(speciesPools: TrainerTierPools | SpeciesId[]): TrainerConfig {
    this.speciesPools = (Array.isArray(speciesPools)
      ? { [TrainerPoolTier.COMMON]: speciesPools }
      : speciesPools) as unknown as TrainerTierPools;
    return this;
  }

  setSpeciesFilter(speciesFilter: PokemonSpeciesFilter, allowLegendaries?: boolean): TrainerConfig {
    const baseFilter = this.speciesFilter;
    this.speciesFilter = allowLegendaries ? speciesFilter : species => speciesFilter(species) && baseFilter(species);
    return this;
  }

  setSpecialtyType(specialtyType: PokemonType): TrainerConfig {
    this.specialtyType = specialtyType;
    return this;
  }

  setGenModifiersFunc(genModifiersFunc: GenModifiersFunc): TrainerConfig {
    this.genModifiersFunc = genModifiersFunc;
    return this;
  }

  /**
   * Sets random pokemon from the trainer's team to instant tera. Also sets Tera type to specialty type and checks for Shedinja as appropriate.
   * @param count A callback (yucky) to see how many teras should be used
   * @param slot Optional, a specified slot that should be terastallized. Wraps to match party size (-1 will get the last slot and so on).
   * @returns this
   */
  setRandomTeraModifiers(count: () => number, slot?: number): TrainerConfig {
    this.genAIFuncs.push((party: EnemyPokemon[]) => {
      const shedinjaCanTera = !this.hasSpecialtyType() || this.specialtyType === PokemonType.BUG; // Better to check one time than 6
      const partyMemberIndexes = new Array(party.length)
        .fill(null)
        .map((_, i) => i)
        .filter(i => shedinjaCanTera || party[i].species.speciesId !== SpeciesId.SHEDINJA); // Shedinja can only Tera on Bug specialty type (or no specialty type)
      const setPartySlot = !isNullOrUndefined(slot) ? Phaser.Math.Wrap(slot, 0, party.length) : -1; // If we have a tera slot defined, wrap it to party size.
      for (let t = 0; t < Math.min(count(), party.length); t++) {
        const randomIndex =
          partyMemberIndexes.indexOf(setPartySlot) > -1 ? setPartySlot : randSeedItem(partyMemberIndexes);
        partyMemberIndexes.splice(partyMemberIndexes.indexOf(randomIndex), 1);
        if (this.hasSpecialtyType()) {
          party[randomIndex].teraType = this.specialtyType;
        }
        this.trainerAI.setInstantTera(randomIndex);
      }
    });
    return this;
  }

  /**
   * Sets a specific pokemon to instantly Tera
   * @param index The index within the team to have instant Tera.
   * @returns this
   */
  setInstantTera(index: number): TrainerConfig {
    this.trainerAI.setInstantTera(index);
    return this;
  }

  // function getRandomTeraModifiers(party: EnemyPokemon[], count: integer, types?: Type[]): PersistentModifier[] {
  //   const ret: PersistentModifier[] = [];
  //   const partyMemberIndexes = new Array(party.length).fill(null).map((_, i) => i);
  //   for (let t = 0; t < Math.min(count, party.length); t++) {
  //     const randomIndex = Utils.randSeedItem(partyMemberIndexes);
  //     partyMemberIndexes.splice(partyMemberIndexes.indexOf(randomIndex), 1);
  //     ret.push(modifierTypes.TERA_SHARD().generateType([], [ Utils.randSeedItem(types ? types : party[randomIndex].getTypes()) ])!.withIdFromFunc(modifierTypes.TERA_SHARD).newModifier(party[randomIndex]) as PersistentModifier); // TODO: is the bang correct?
  //   }
  //   return ret;
  // }

  setModifierRewardFuncs(...modifierTypeFuncs: (() => ModifierTypeFunc)[]): TrainerConfig {
    this.modifierRewardFuncs = modifierTypeFuncs.map(func => () => {
      const modifierTypeFunc = func();
      const modifierType = modifierTypeFunc();
      modifierType.withIdFromFunc(modifierTypeFunc);
      return modifierType;
    });
    return this;
  }

  /**
   * Initializes the trainer configuration for an evil team admin.
   * @param title The title of the evil team admin.
   * @param poolName The evil team the admin belongs to.
   * @param signatureSpecies The signature species for the evil team leader.
   * @param specialtyType The specialty Type of the admin, if they have one
   * @returns The updated TrainerConfig instance.
   */
  initForEvilTeamAdmin(
    title: string,
    poolName: EvilTeam,
    signatureSpecies: (SpeciesId | SpeciesId[])[],
    specialtyType?: PokemonType,
  ): TrainerConfig {
    if (!getIsInitialized()) {
      initI18n();
    }

    if (!isNullOrUndefined(specialtyType)) {
      this.setSpecialtyType(specialtyType);
    }

    this.setPartyTemplates(trainerPartyTemplates.RIVAL_5);

    // Set the species pools for the evil team admin.
    this.speciesPools = evilAdminTrainerPools[poolName];

    signatureSpecies.forEach((speciesPool, s) => {
      this.setPartyMemberFunc(-(s + 1), getRandomPartyMemberFunc(coerceArray(speciesPool)));
    });

    const nameForCall = toCamelCase(this.name);
    this.name = i18next.t(`trainerNames:${nameForCall}`);
    this.setHasVoucher(false);
    this.setTitle(title);
    this.setMoneyMultiplier(1.5);
    this.setBoss();
    this.setStaticParty();
    this.setBattleBgm("battle_plasma_boss");
    this.setVictoryBgm("victory_team_plasma");

    return this;
  }

  /**
   * Initializes the trainer configuration for a Stat Trainer, as part of the Trainer's Test Mystery Encounter.
   * @param _isMale Whether the stat trainer is Male or Female (for localization of the title).
   * @returns The updated TrainerConfig instance.
   */
  initForStatTrainer(_isMale = false): TrainerConfig {
    if (!getIsInitialized()) {
      initI18n();
    }

    this.setPartyTemplates(trainerPartyTemplates.ELITE_FOUR);

    const nameForCall = toCamelCase(this.name);
    this.name = i18next.t(`trainerNames:${nameForCall}`);
    this.setMoneyMultiplier(2);
    this.setBoss();
    this.setStaticParty();

    // TODO: replace with more suitable music?
    this.setBattleBgm("battle_trainer");
    this.setVictoryBgm("victory_trainer");

    return this;
  }

  /**
   * Initializes the trainer configuration for an evil team leader. Temporarily hardcoding evil leader teams though.
   * @param signatureSpecies The signature species for the evil team leader.
   * @param specialtyType The specialty type for the evil team Leader.
   * @param boolean Whether or not this is the rematch fight
   * @returns The updated TrainerConfig instance.
   */
  initForEvilTeamLeader(
    title: string,
    signatureSpecies: (SpeciesId | SpeciesId[])[],
    rematch = false,
    specialtyType?: PokemonType,
  ): TrainerConfig {
    if (!getIsInitialized()) {
      initI18n();
    }
    if (rematch) {
      this.setPartyTemplates(trainerPartyTemplates.ELITE_FOUR);
    } else {
      this.setPartyTemplates(trainerPartyTemplates.RIVAL_5);
    }
    signatureSpecies.forEach((speciesPool, s) => {
      this.setPartyMemberFunc(-(s + 1), getRandomPartyMemberFunc(coerceArray(speciesPool)));
    });
    if (!isNullOrUndefined(specialtyType)) {
      this.setSpeciesFilter(p => p.isOfType(specialtyType));
      this.setSpecialtyType(specialtyType);
    }
    const nameForCall = toCamelCase(this.name);
    this.name = i18next.t(`trainerNames:${nameForCall}`);
    this.setTitle(title);
    this.setMoneyMultiplier(2.5);
    this.setBoss();
    this.setStaticParty();
    this.setHasVoucher(true);
    this.setBattleBgm("battle_plasma_boss");
    this.setVictoryBgm("victory_team_plasma");

    return this;
  }

  /**
   * Initializes the trainer configuration for a Gym Leader.
   * @param signatureSpecies The signature species for the Gym Leader. Added to party in reverse order.
   * @param isMale Whether the Gym Leader is Male or Not (for localization of the title).
   * @param specialtyType The specialty type for the Gym Leader.
   * @param ignoreMinTeraWave Whether the Gym Leader always uses Tera (true), or only Teras after {@linkcode GYM_LEADER_TERA_WAVE} (false). Defaults to false.
   * @param teraSlot Optional, sets the party member in this slot to Terastallize. Wraps based on party size.
   * @returns The updated TrainerConfig instance.
   */
  initForGymLeader(
    signatureSpecies: (SpeciesId | SpeciesId[])[],
    isMale: boolean,
    specialtyType: PokemonType,
    ignoreMinTeraWave = false,
    teraSlot?: number,
  ): TrainerConfig {
    // Check if the internationalization (i18n) system is initialized.
    if (!getIsInitialized()) {
      initI18n();
    }

    // Set the function to generate the Gym Leader's party template.
    this.setPartyTemplateFunc(getGymLeaderPartyTemplate);

    // Set up party members with their corresponding species.
    signatureSpecies.forEach((speciesPool, s) => {
      // Set a function to get a random party member from the species pool.
      this.setPartyMemberFunc(-(s + 1), getRandomPartyMemberFunc(coerceArray(speciesPool)));
    });

    // If specialty type is provided, set species filter and specialty type.
    this.setSpeciesFilter(p => p.isOfType(specialtyType));
    this.setSpecialtyType(specialtyType);

    // Localize the trainer's name by converting it to camel case.
    const nameForCall = toCamelCase(this.name);
    this.name = i18next.t(`trainerNames:${nameForCall}`);

    // Set the title to "gymLeader". (this is the key in the i18n file)
    this.setTitle("gymLeader");
    if (!isMale) {
      this.setTitle("gymLeaderFemale");
    }

    // Configure various properties for the Gym Leader.
    this.setMoneyMultiplier(2.5);
    this.setBoss();
    this.setStaticParty();
    this.setHasVoucher(true);
    this.setBattleBgm("battle_unova_gym");
    this.setVictoryBgm("victory_gym");
    this.setRandomTeraModifiers(
      () => (ignoreMinTeraWave || globalScene.currentBattle.waveIndex >= GYM_LEADER_TERA_WAVE ? 1 : 0),
      teraSlot,
    );

    return this;
  }

  /**
   * Initializes the trainer configuration for an Elite Four member.
   * @param signatureSpecies - The signature species for the Elite Four member.
   * @param isMale - Whether the Elite Four Member is Male or Female (for localization of the title).
   * @param specialtyType - The specialty type for the Elite Four member.
   * @param teraSlot - Optional, sets the party member in this slot to Terastallize.
   * @returns The updated TrainerConfig instance.
   */
  initForEliteFour(
    signatureSpecies: (SpeciesId | SpeciesId[])[],
    isMale: boolean,
    specialtyType?: PokemonType,
    teraSlot?: number,
  ): TrainerConfig {
    // Check if the internationalization (i18n) system is initialized.
    if (!getIsInitialized()) {
      initI18n();
    }

    // Set the party templates for the Elite Four.
    this.setPartyTemplates(trainerPartyTemplates.ELITE_FOUR);

    // Set up party members with their corresponding species.
    signatureSpecies.forEach((speciesPool, s) => {
      // Set a function to get a random party member from the species pool.
      this.setPartyMemberFunc(-(s + 1), getRandomPartyMemberFunc(coerceArray(speciesPool)));
    });

    // Set species filter and specialty type if provided, otherwise filter by base total.
    if (!isNullOrUndefined(specialtyType)) {
      this.setSpeciesFilter(p => p.isOfType(specialtyType) && p.baseTotal >= ELITE_FOUR_MINIMUM_BST);
      this.setSpecialtyType(specialtyType);
    } else {
      this.setSpeciesFilter(p => p.baseTotal >= ELITE_FOUR_MINIMUM_BST);
    }

    // Localize the trainer's name by converting it to camel case.
    const nameForCall = toCamelCase(this.name);
    this.name = i18next.t(`trainerNames:${nameForCall}`);

    // Set the title to "elite_four". (this is the key in the i18n file)
    this.setTitle("eliteFour");
    if (!isMale) {
      this.setTitle("eliteFourFemale");
    }

    // Configure various properties for the Elite Four member.
    this.setMoneyMultiplier(3.25);
    this.setBoss();
    this.setStaticParty();
    this.setHasVoucher(true);
    this.setBattleBgm("battle_unova_elite");
    this.setVictoryBgm("victory_gym");
    this.setRandomTeraModifiers(() => 1, teraSlot);

    return this;
  }

  /**
   * Initializes the trainer configuration for a Champion.
   * @param signatureSpecies The signature species for the Champion.
   * @param isMale Whether the Champion is Male or Female (for localization of the title).
   * @returns The updated TrainerConfig instance.
   */
  initForChampion(isMale: boolean): TrainerConfig {
    // Check if the internationalization (i18n) system is initialized.
    if (!getIsInitialized()) {
      initI18n();
    }

    // Set the party templates for the Champion.
    this.setPartyTemplates(trainerPartyTemplates.CHAMPION);

    // Localize the trainer's name by converting it to camel case.
    const nameForCall = toCamelCase(this.name);
    this.name = i18next.t(`trainerNames:${nameForCall}`);

    // Set the title to "champion". (this is the key in the i18n file)
    this.setTitle("champion");
    if (!isMale) {
      this.setTitle("championFemale");
    }

    // Configure various properties for the Champion.
    this.setMoneyMultiplier(10);
    this.setBoss();
    this.setStaticParty();
    this.setHasVoucher(true);
    this.setBattleBgm("battle_champion_alder");
    this.setVictoryBgm("victory_champion");

    return this;
  }

  /**
   * Sets a localized name for the trainer. This should only be used for trainers that dont use a "initFor" function and are considered "named" trainers
   * @param name - The name of the trainer.
   * @returns The updated TrainerConfig instance.
   */
  setLocalizedName(name: string): TrainerConfig {
    // Check if the internationalization (i18n) system is initialized.
    if (!getIsInitialized()) {
      initI18n();
    }
    this.name = i18next.t(`trainerNames:${toCamelCase(name)}`);
    return this;
  }

  /**
   * Retrieves the title for the trainer based on the provided trainer slot and variant.
   * @param trainerSlot - The slot to determine which title to use. Defaults to TrainerSlot.NONE.
   * @param variant - The variant of the trainer to determine the specific title.
   * @returns - The title of the trainer.
   */
  getTitle(trainerSlot: TrainerSlot = TrainerSlot.NONE, variant: TrainerVariant): string {
    const ret = this.name;

    // Check if the variant is double and the name for double exists
    if (!trainerSlot && variant === TrainerVariant.DOUBLE && this.nameDouble) {
      return this.nameDouble;
    }

    // Female variant
    if (this.hasGenders) {
      // If the name is already set
      if (this.nameFemale) {
        // Check if the variant is either female or this is for the partner in a double battle
        if (
          variant === TrainerVariant.FEMALE
          || (variant === TrainerVariant.DOUBLE && trainerSlot === TrainerSlot.TRAINER_PARTNER)
        ) {
          return this.nameFemale;
        }
      }
      // Check if !variant is true, if so return the name, else return the name with _female appended
      else if (variant) {
        if (!getIsInitialized()) {
          initI18n();
        }
        // Check if the female version exists in the i18n file
        if (i18next.exists(`trainerClasses:${toCamelCase(this.name)}Female`)) {
          // If it does, return
          return ret + "Female";
        }
      }
    }

    return ret;
  }

  loadAssets(variant: TrainerVariant): Promise<void> {
    return new Promise(resolve => {
      const isDouble = variant === TrainerVariant.DOUBLE;
      const trainerKey = this.getSpriteKey(variant === TrainerVariant.FEMALE, false);
      const partnerTrainerKey = this.getSpriteKey(true, true);
      globalScene.loadAtlas(trainerKey, "trainer");
      if (isDouble) {
        globalScene.loadAtlas(partnerTrainerKey, "trainer");
      }
      globalScene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        const originalWarn = console.warn;
        // Ignore warnings for missing frames, because there will be a lot
        console.warn = () => {};
        const frameNames = globalScene.anims.generateFrameNames(trainerKey, {
          zeroPad: 4,
          suffix: ".png",
          start: 1,
          end: 128,
        });
        const partnerFrameNames = isDouble
          ? globalScene.anims.generateFrameNames(partnerTrainerKey, {
              zeroPad: 4,
              suffix: ".png",
              start: 1,
              end: 128,
            })
          : "";
        console.warn = originalWarn;
        if (!globalScene.anims.exists(trainerKey)) {
          globalScene.anims.create({
            key: trainerKey,
            frames: frameNames,
            frameRate: 24,
            repeat: -1,
          });
        }
        if (isDouble && !globalScene.anims.exists(partnerTrainerKey)) {
          globalScene.anims.create({
            key: partnerTrainerKey,
            frames: partnerFrameNames,
            frameRate: 24,
            repeat: -1,
          });
        }
        resolve();
      });
      if (!globalScene.load.isLoading()) {
        globalScene.load.start();
      }
    });
  }

  /**
   * Helper function to check if a specialty type is set
   * @returns `true` if `specialtyType` is defined and not {@link PokemonType.UNKNOWN}
   */
  hasSpecialtyType(): boolean {
    return !isNullOrUndefined(this.specialtyType) && this.specialtyType !== PokemonType.UNKNOWN;
  }

  /**
   * Creates a shallow copy of a trainer config so that it can be modified without affecting the {@link trainerConfigs} source map
   */
  clone(): TrainerConfig {
    let clone = new TrainerConfig(this.trainerType);
    clone = this.trainerTypeDouble ? clone.setDoubleTrainerType(this.trainerTypeDouble) : clone;
    clone = this.name ? clone.setName(this.name) : clone;
    clone = this.hasGenders ? clone.setHasGenders(this.nameFemale, this.femaleEncounterBgm) : clone;
    clone = this.hasDouble ? clone.setHasDouble(this.nameDouble, this.doubleEncounterBgm) : clone;
    clone = this.title ? clone.setTitle(this.title) : clone;
    clone = this.titleDouble ? clone.setDoubleTitle(this.titleDouble) : clone;
    clone = this.hasCharSprite ? clone.setHasCharSprite() : clone;
    clone = this.doubleOnly ? clone.setDoubleOnly() : clone;
    clone = this.moneyMultiplier ? clone.setMoneyMultiplier(this.moneyMultiplier) : clone;
    clone = this.isBoss ? clone.setBoss() : clone;
    clone = this.hasStaticParty ? clone.setStaticParty() : clone;
    clone = this.useSameSeedForAllMembers ? clone.setUseSameSeedForAllMembers() : clone;
    clone = this.battleBgm ? clone.setBattleBgm(this.battleBgm) : clone;
    clone = this.encounterBgm ? clone.setEncounterBgm(this.encounterBgm) : clone;
    clone = this.victoryBgm ? clone.setVictoryBgm(this.victoryBgm) : clone;
    clone = this.genModifiersFunc ? clone.setGenModifiersFunc(this.genModifiersFunc) : clone;

    if (this.modifierRewardFuncs) {
      // Clones array instead of passing ref
      clone.modifierRewardFuncs = this.modifierRewardFuncs.slice(0);
    }

    if (this.partyTemplates) {
      clone.partyTemplates = this.partyTemplates.slice(0);
    }

    clone = this.partyTemplateFunc ? clone.setPartyTemplateFunc(this.partyTemplateFunc) : clone;

    if (this.partyMemberFuncs) {
      Object.keys(this.partyMemberFuncs).forEach(index => {
        clone = clone.setPartyMemberFunc(Number.parseInt(index, 10), this.partyMemberFuncs[index]);
      });
    }

    clone = this.speciesPools ? clone.setSpeciesPools(this.speciesPools) : clone;
    clone = this.speciesFilter ? clone.setSpeciesFilter(this.speciesFilter) : clone;
    clone.specialtyType = this.specialtyType;

    clone.encounterMessages = this.encounterMessages?.slice(0);
    clone.victoryMessages = this.victoryMessages?.slice(0);
    clone.defeatMessages = this.defeatMessages?.slice(0);

    clone.femaleEncounterMessages = this.femaleEncounterMessages?.slice(0);
    clone.femaleVictoryMessages = this.femaleVictoryMessages?.slice(0);
    clone.femaleDefeatMessages = this.femaleDefeatMessages?.slice(0);

    clone.doubleEncounterMessages = this.doubleEncounterMessages?.slice(0);
    clone.doubleVictoryMessages = this.doubleVictoryMessages?.slice(0);
    clone.doubleDefeatMessages = this.doubleDefeatMessages?.slice(0);

    return clone;
  }
}

let trainerCounter = 0;
export function nextTrainerId() : number {
  return ++trainerCounter;
}
export function setTrainerId(trainerID: number) : number {
  trainerCounter = trainerID;
  return trainerCounter
}

export function isMoveNullOrUndefined(move): boolean{
    return move === null || move === undefined;
}

/**
 * Randomly selects one of the `Species` from `speciesPool`, determines its evolution, level, and strength.
 * Then adds Pokemon to globalScene.
 * @param speciesPool
 * @param trainerSlot
 * @param ignoreEvolution
 * @param postProcess
 */
export function getRandomPartyMemberFunc(
  speciesPool: SpeciesId[],
  trainerSlot: TrainerSlot = TrainerSlot.TRAINER,
  ignoreEvolution = false,
  postProcess?: (enemyPokemon: EnemyPokemon) => void,
) {
  return (level: number, strength: PartyMemberStrength) => {
    let species = randSeedItem(speciesPool);
    if (!ignoreEvolution) {
      species = getPokemonSpecies(species).getTrainerSpeciesForLevel(
        level,
        true,
        strength,
        globalScene.currentBattle.waveIndex,
      );
    }
    return globalScene.addEnemyPokemon(
      getPokemonSpecies(species),
      level,
      trainerSlot,
      undefined,
      false,
      undefined,
      postProcess,
    );
  };
}

export function getSpeciesFilterRandomPartyMemberFunc(
  originalSpeciesFilter: PokemonSpeciesFilter,
  trainerSlot: TrainerSlot = TrainerSlot.TRAINER,
  allowLegendaries?: boolean,
  postProcess?: (EnemyPokemon: EnemyPokemon) => void,
): PartyMemberFunc {
  const speciesFilter = (species: PokemonSpecies): boolean => {
    const notLegendary = !species.legendary && !species.subLegendary && !species.mythical;
    return (allowLegendaries || notLegendary) && !species.isTrainerForbidden() && originalSpeciesFilter(species);
  };

  return (level: number, strength: PartyMemberStrength) => {
    const waveIndex = globalScene.currentBattle.waveIndex;
    const species = getPokemonSpecies(
      globalScene
        .randomSpecies(waveIndex, level, false, speciesFilter)
        .getTrainerSpeciesForLevel(level, true, strength, waveIndex),
    );

    return globalScene.addEnemyPokemon(species, level, trainerSlot, undefined, false, undefined, postProcess);
  };
}
