import { globalScene } from "#app/global-scene";
import { modifierTypes } from "#app/modifier/modifier-type";
import { PokemonMove } from "#app/field/pokemon";
import { toReadableString, isNullOrUndefined, randSeedItem, randSeedInt } from "#app/utils/common";
import { pokemonEvolutions, pokemonPrevolutions } from "#app/data/balance/pokemon-evolutions";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { tmSpecies } from "#app/data/balance/tms";
import { doubleBattleDialogue } from "#app/data/dialogue";
import { TrainerVariant } from "#app/field/trainer";
import { getIsInitialized, initI18n } from "#app/plugins/i18n";
import i18next from "i18next";
import { Gender } from "#app/data/gender";
import { signatureSpecies } from "../balance/signature-species";
import {
  getEvilGruntPartyTemplate,
  getGymLeaderPartyTemplate,
  getWavePartyTemplate,
  TrainerPartyCompoundTemplate,
  TrainerPartyTemplate,
  trainerPartyTemplates,
} from "./TrainerPartyTemplate";
import { evilAdminTrainerPools } from "./evil-admin-trainer-pools";

// Enum imports
import { PartyMemberStrength } from "#enums/party-member-strength";
import { Species } from "#enums/species";
import { PokeballType } from "#enums/pokeball";
import { PokemonType } from "#enums/pokemon-type";
import { Moves } from "#enums/moves";
import { Abilities } from "#enums/abilities";
import { TeraAIMode } from "#enums/tera-ai-mode";
import { TrainerPoolTier } from "#enums/trainer-pool-tier";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { timedEventManager } from "#app/global-event-manager";

// Type imports
import type { PokemonSpeciesFilter } from "#app/data/pokemon-species";
import type PokemonSpecies from "#app/data/pokemon-species";
import type { ModifierTypeFunc } from "#app/modifier/modifier-type";
import type { EnemyPokemon } from "#app/field/pokemon";
import type { EvilTeam } from "./evil-admin-trainer-pools";
import type {
  PartyMemberFunc,
  GenModifiersFunc,
  GenAIFunc,
  PartyTemplateFunc,
  TrainerTierPools,
  TrainerConfigs,
  PartyMemberFuncs,
} from "./typedefs";

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
    this.name = toReadableString(TrainerType[this.getDerivedType()]);
    this.battleBgm = "battle_trainer";
    this.mixedBattleBgm = "battle_trainer";
    this.victoryBgm = "victory_trainer";
    this.partyTemplates = [trainerPartyTemplates.TWO_AVG];
    this.speciesFilter = species =>
      (allowLegendaries || (!species.legendary && !species.subLegendary && !species.mythical)) &&
      !species.isTrainerForbidden();
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

    // Make the title lowercase and replace spaces with underscores
    title = title.toLowerCase().replace(/\s/g, "_");

    // Get the title from the i18n file
    this.title = i18next.t(`titles:${title}`);

    return this;
  }

  /**
   * Returns the derived trainer type for a given trainer type.
   * @param trainerTypeToDeriveFrom - The trainer type to derive from. (If null, the this.trainerType property will be used.)
   * @returns {TrainerType} - The derived trainer type.
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
      case TrainerType.ROCKET_BOSS_GIOVANNI_1:
      case TrainerType.ROCKET_BOSS_GIOVANNI_2:
        trainerType = TrainerType.GIOVANNI;
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
   * @param {string} [nameFemale] The name of the female trainer. If 'Ivy', a localized name will be assigned.
   * @param {TrainerType | string} [femaleEncounterBgm] The encounter BGM for the female trainer, which can be a TrainerType or a string.
   * @returns {TrainerConfig} The updated TrainerConfig instance.
   **/
  setHasGenders(nameFemale?: string, femaleEncounterBgm?: TrainerType | string): TrainerConfig {
    // If the female name is 'Ivy' (the rival), assign a localized name.
    if (nameFemale === "Ivy") {
      // Check if the internationalization (i18n) system is initialized.
      if (!getIsInitialized()) {
        // Initialize the i18n system if it is not already initialized.
        initI18n();
      }
      // Set the localized name for the female rival.
      this.nameFemale = i18next.t("trainerNames:rival_female");
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
   * @returns {TrainerConfig} The updated TrainerConfig instance.
   */
  setHasDouble(nameDouble: string, doubleEncounterBgm?: TrainerType | string): TrainerConfig {
    this.hasDouble = true;
    this.nameDouble = nameDouble;
    if (doubleEncounterBgm) {
      this.doubleEncounterBgm =
        typeof doubleEncounterBgm === "number"
          ? TrainerType[doubleEncounterBgm].toString().replace(/\_/g, " ").toLowerCase()
          : doubleEncounterBgm;
    }
    return this;
  }

  /**
   * Sets the trainer type for double battles.
   * @param trainerTypeDouble The TrainerType of the partner in a double battle.
   * @returns {TrainerConfig} The updated TrainerConfig instance.
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
   * @returns {TrainerConfig} The updated TrainerConfig instance.
   */
  setDoubleTitle(titleDouble: string): TrainerConfig {
    // First check if i18n is initialized
    if (!getIsInitialized()) {
      initI18n();
    }

    // Make the title lowercase and replace spaces with underscores
    titleDouble = titleDouble.toLowerCase().replace(/\s/g, "_");

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

  setSpeciesPools(speciesPools: TrainerTierPools | Species[]): TrainerConfig {
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
        .filter(i => shedinjaCanTera || party[i].species.speciesId !== Species.SHEDINJA); // Shedinja can only Tera on Bug specialty type (or no specialty type)
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
   * @param {Species | Species[]} signatureSpecies The signature species for the evil team leader.
   * @param specialtyType The specialty Type of the admin, if they have one
   * @returns {TrainerConfig} The updated TrainerConfig instance.
   * **/
  initForEvilTeamAdmin(
    title: string,
    poolName: EvilTeam,
    signatureSpecies: (Species | Species[])[],
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
      if (!Array.isArray(speciesPool)) {
        speciesPool = [speciesPool];
      }
      this.setPartyMemberFunc(-(s + 1), getRandomPartyMemberFunc(speciesPool));
    });

    const nameForCall = this.name.toLowerCase().replace(/\s/g, "_");
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
   * @returns {TrainerConfig} The updated TrainerConfig instance.
   **/
  initForStatTrainer(_isMale = false): TrainerConfig {
    if (!getIsInitialized()) {
      initI18n();
    }

    this.setPartyTemplates(trainerPartyTemplates.ELITE_FOUR);

    const nameForCall = this.name.toLowerCase().replace(/\s/g, "_");
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
   * @param {Species | Species[]} signatureSpecies The signature species for the evil team leader.
   * @param {PokemonType} specialtyType The specialty type for the evil team Leader.
   * @param boolean Whether or not this is the rematch fight
   * @returns {TrainerConfig} The updated TrainerConfig instance.
   * **/
  initForEvilTeamLeader(
    title: string,
    signatureSpecies: (Species | Species[])[],
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
      if (!Array.isArray(speciesPool)) {
        speciesPool = [speciesPool];
      }
      this.setPartyMemberFunc(-(s + 1), getRandomPartyMemberFunc(speciesPool));
    });
    if (!isNullOrUndefined(specialtyType)) {
      this.setSpeciesFilter(p => p.isOfType(specialtyType));
      this.setSpecialtyType(specialtyType);
    }
    const nameForCall = this.name.toLowerCase().replace(/\s/g, "_");
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
   * @param {Species | Species[]} signatureSpecies The signature species for the Gym Leader. Added to party in reverse order.
   * @param isMale Whether the Gym Leader is Male or Not (for localization of the title).
   * @param {PokemonType} specialtyType The specialty type for the Gym Leader.
   * @param ignoreMinTeraWave Whether the Gym Leader always uses Tera (true), or only Teras after {@linkcode GYM_LEADER_TERA_WAVE} (false). Defaults to false.
   * @param teraSlot Optional, sets the party member in this slot to Terastallize. Wraps based on party size.
   * @returns {TrainerConfig} The updated TrainerConfig instance.
   * **/
  initForGymLeader(
    signatureSpecies: (Species | Species[])[],
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
      // Ensure speciesPool is an array.
      if (!Array.isArray(speciesPool)) {
        speciesPool = [speciesPool];
      }
      // Set a function to get a random party member from the species pool.
      this.setPartyMemberFunc(-(s + 1), getRandomPartyMemberFunc(speciesPool));
    });

    // If specialty type is provided, set species filter and specialty type.
    this.setSpeciesFilter(p => p.isOfType(specialtyType));
    this.setSpecialtyType(specialtyType);

    // Localize the trainer's name by converting it to lowercase and replacing spaces with underscores.
    const nameForCall = this.name.toLowerCase().replace(/\s/g, "_");
    this.name = i18next.t(`trainerNames:${nameForCall}`);

    // Set the title to "gym_leader". (this is the key in the i18n file)
    this.setTitle("gym_leader");
    if (!isMale) {
      this.setTitle("gym_leader_female");
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
   * @param {Species | Species[]} signatureSpecies The signature species for the Elite Four member.
   * @param isMale Whether the Elite Four Member is Male or Female (for localization of the title).
   * @param specialtyType {PokemonType} The specialty type for the Elite Four member.
   * @param teraSlot Optional, sets the party member in this slot to Terastallize.
   * @returns {TrainerConfig} The updated TrainerConfig instance.
   **/
  initForEliteFour(
    signatureSpecies: (Species | Species[])[],
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
      // Ensure speciesPool is an array.
      if (!Array.isArray(speciesPool)) {
        speciesPool = [speciesPool];
      }
      // Set a function to get a random party member from the species pool.
      this.setPartyMemberFunc(-(s + 1), getRandomPartyMemberFunc(speciesPool));
    });

    // Set species filter and specialty type if provided, otherwise filter by base total.
    if (!isNullOrUndefined(specialtyType)) {
      this.setSpeciesFilter(p => p.isOfType(specialtyType) && p.baseTotal >= ELITE_FOUR_MINIMUM_BST);
      this.setSpecialtyType(specialtyType);
    } else {
      this.setSpeciesFilter(p => p.baseTotal >= ELITE_FOUR_MINIMUM_BST);
    }

    // Localize the trainer's name by converting it to lowercase and replacing spaces with underscores.
    const nameForCall = this.name.toLowerCase().replace(/\s/g, "_");
    this.name = i18next.t(`trainerNames:${nameForCall}`);

    // Set the title to "elite_four". (this is the key in the i18n file)
    this.setTitle("elite_four");
    if (!isMale) {
      this.setTitle("elite_four_female");
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
   * @param {Species | Species[]} signatureSpecies The signature species for the Champion.
   * @param isMale Whether the Champion is Male or Female (for localization of the title).
   * @returns {TrainerConfig} The updated TrainerConfig instance.
   **/
  initForChampion(isMale: boolean): TrainerConfig {
    // Check if the internationalization (i18n) system is initialized.
    if (!getIsInitialized()) {
      initI18n();
    }

    // Set the party templates for the Champion.
    this.setPartyTemplates(trainerPartyTemplates.CHAMPION);

    // Localize the trainer's name by converting it to lowercase and replacing spaces with underscores.
    const nameForCall = this.name.toLowerCase().replace(/\s/g, "_");
    this.name = i18next.t(`trainerNames:${nameForCall}`);

    // Set the title to "champion". (this is the key in the i18n file)
    this.setTitle("champion");
    if (!isMale) {
      this.setTitle("champion_female");
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
   * @returns {TrainerConfig} The updated TrainerConfig instance.
   */
  setLocalizedName(name: string): TrainerConfig {
    // Check if the internationalization (i18n) system is initialized.
    if (!getIsInitialized()) {
      initI18n();
    }
    this.name = i18next.t(`trainerNames:${name.toLowerCase().replace(/\s/g, "_")}`);
    return this;
  }

  /**
   * Retrieves the title for the trainer based on the provided trainer slot and variant.
   * @param {TrainerSlot} trainerSlot - The slot to determine which title to use. Defaults to TrainerSlot.NONE.
   * @param {TrainerVariant} variant - The variant of the trainer to determine the specific title.
   * @returns {string} - The title of the trainer.
   **/
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
          variant === TrainerVariant.FEMALE ||
          (variant === TrainerVariant.DOUBLE && trainerSlot === TrainerSlot.TRAINER_PARTNER)
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
        if (i18next.exists(`trainerClasses:${this.name.toLowerCase()}`)) {
          // If it does, return
          return ret + "_female";
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
   * @returns true if specialtyType is defined and not Type.UNKNOWN
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

let t = 0;

/**
 * Randomly selects one of the `Species` from `speciesPool`, determines its evolution, level, and strength.
 * Then adds Pokemon to globalScene.
 * @param speciesPool
 * @param trainerSlot
 * @param ignoreEvolution
 * @param postProcess
 */
export function getRandomPartyMemberFunc(
  speciesPool: Species[],
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

function getSpeciesFilterRandomPartyMemberFunc(
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

export const trainerConfigs: TrainerConfigs = {
  [TrainerType.UNKNOWN]: new TrainerConfig(0).setHasGenders(),
  [TrainerType.ACE_TRAINER]: new TrainerConfig(++t)
    .setHasGenders("Ace Trainer Female")
    .setHasDouble("Ace Duo")
    .setMoneyMultiplier(2.25)
    .setEncounterBgm(TrainerType.ACE_TRAINER)
    .setPartyTemplateFunc(() =>
      getWavePartyTemplate(
        trainerPartyTemplates.THREE_WEAK_BALANCED,
        trainerPartyTemplates.FOUR_WEAK_BALANCED,
        trainerPartyTemplates.FIVE_WEAK_BALANCED,
        trainerPartyTemplates.SIX_WEAK_BALANCED,
      ),
    ),
  [TrainerType.ARTIST]: new TrainerConfig(++t)
    .setEncounterBgm(TrainerType.RICH)
    .setPartyTemplates(trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.THREE_AVG)
    .setSpeciesPools([Species.SMEARGLE]),
  [TrainerType.BACKERS]: new TrainerConfig(++t)
    .setHasGenders("Backers")
    .setDoubleOnly()
    .setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.BACKPACKER]: new TrainerConfig(++t)
    .setHasGenders("Backpacker Female")
    .setHasDouble("Backpackers")
    .setSpeciesFilter(s => s.isOfType(PokemonType.FLYING) || s.isOfType(PokemonType.ROCK))
    .setEncounterBgm(TrainerType.BACKPACKER)
    .setPartyTemplates(
      trainerPartyTemplates.ONE_STRONG,
      trainerPartyTemplates.ONE_WEAK_ONE_STRONG,
      trainerPartyTemplates.ONE_AVG_ONE_STRONG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.RHYHORN,
        Species.AIPOM,
        Species.MAKUHITA,
        Species.MAWILE,
        Species.NUMEL,
        Species.LILLIPUP,
        Species.SANDILE,
        Species.WOOLOO,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.GIRAFARIG,
        Species.ZANGOOSE,
        Species.SEVIPER,
        Species.CUBCHOO,
        Species.PANCHAM,
        Species.SKIDDO,
        Species.MUDBRAY,
      ],
      [TrainerPoolTier.RARE]: [
        Species.TAUROS,
        Species.STANTLER,
        Species.DARUMAKA,
        Species.BOUFFALANT,
        Species.DEERLING,
        Species.IMPIDIMP,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.GALAR_DARUMAKA, Species.TEDDIURSA],
    }),
  [TrainerType.BAKER]: new TrainerConfig(++t)
    .setEncounterBgm(TrainerType.CLERK)
    .setMoneyMultiplier(1.35)
    .setSpeciesFilter(
      s =>
        [s.ability1, s.ability2, s.abilityHidden].some(
          a =>
            !!a &&
            [
              Abilities.WHITE_SMOKE,
              Abilities.GLUTTONY,
              Abilities.HONEY_GATHER,
              Abilities.HARVEST,
              Abilities.CHEEK_POUCH,
              Abilities.SWEET_VEIL,
              Abilities.RIPEN,
              Abilities.PURIFYING_SALT,
              Abilities.WELL_BAKED_BODY,
              Abilities.SUPERSWEET_SYRUP,
              Abilities.HOSPITALITY,
            ].includes(a),
        ) ||
        s
          .getLevelMoves()
          .some(plm =>
            [Moves.SOFT_BOILED, Moves.SPORE, Moves.MILK_DRINK, Moves.OVERHEAT, Moves.TEATIME].includes(plm[1]),
          ),
    ), // Mons with baking related abilities or who learn Overheat, Teatime, Milk Drink, Spore, or Soft-Boiled by level
  [TrainerType.BEAUTY]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.55)
    .setEncounterBgm(TrainerType.PARASOL_LADY)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_AVG_SAME_ONE_AVG,
      trainerPartyTemplates.TWO_AVG_SAME_ONE_STRONG,
      trainerPartyTemplates.THREE_AVG_SAME,
      trainerPartyTemplates.THREE_AVG,
      trainerPartyTemplates.FOUR_WEAK,
      trainerPartyTemplates.ONE_STRONG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.MEOWTH,
        Species.GOLDEEN,
        Species.MAREEP,
        Species.MARILL,
        Species.SKITTY,
        Species.GLAMEOW,
        Species.PURRLOIN,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.SMOOCHUM,
        Species.ROSELIA,
        Species.LUVDISC,
        Species.BLITZLE,
        Species.SEWADDLE,
        Species.PETILIL,
        Species.MINCCINO,
        Species.GOTHITA,
        Species.SPRITZEE,
        Species.FLITTLE,
      ],
      [TrainerPoolTier.RARE]: [
        Species.FEEBAS,
        Species.FURFROU,
        Species.SALANDIT,
        Species.BRUXISH,
        Species.HATENNA,
        Species.SNOM,
        Species.ALOLA_VULPIX,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.CLAMPERL, Species.AMAURA, Species.SYLVEON, Species.GOOMY, Species.POPPLIO],
    }),
  [TrainerType.BIKER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.4)
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.EKANS, Species.KOFFING, Species.CROAGUNK, Species.VENIPEDE, Species.SCRAGGY],
      [TrainerPoolTier.UNCOMMON]: [
        Species.GRIMER,
        Species.VOLTORB,
        Species.TEDDIURSA,
        Species.MAGBY,
        Species.SKORUPI,
        Species.SANDILE,
        Species.PAWNIARD,
        Species.SHROODLE,
      ],
      [TrainerPoolTier.RARE]: [Species.VAROOM, Species.CYCLIZAR],
    }),
  [TrainerType.BLACK_BELT]: new TrainerConfig(++t)
    .setHasGenders("Battle Girl", TrainerType.PSYCHIC)
    .setHasDouble("Crush Kin")
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpecialtyType(PokemonType.FIGHTING)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_WEAK_ONE_AVG,
      trainerPartyTemplates.TWO_WEAK_ONE_AVG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.TWO_WEAK_ONE_STRONG,
      trainerPartyTemplates.THREE_AVG,
      trainerPartyTemplates.TWO_AVG_ONE_STRONG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.NIDORAN_F,
        Species.NIDORAN_M,
        Species.MACHOP,
        Species.MAKUHITA,
        Species.MEDITITE,
        Species.CROAGUNK,
        Species.TIMBURR,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.MANKEY,
        Species.POLIWRATH,
        Species.TYROGUE,
        Species.BRELOOM,
        Species.SCRAGGY,
        Species.MIENFOO,
        Species.PANCHAM,
        Species.STUFFUL,
        Species.CRABRAWLER,
      ],
      [TrainerPoolTier.RARE]: [
        Species.HERACROSS,
        Species.RIOLU,
        Species.THROH,
        Species.SAWK,
        Species.PASSIMIAN,
        Species.CLOBBOPUS,
      ],
      [TrainerPoolTier.SUPER_RARE]: [
        Species.HITMONTOP,
        Species.INFERNAPE,
        Species.GALLADE,
        Species.HAWLUCHA,
        Species.HAKAMO_O,
      ],
      [TrainerPoolTier.ULTRA_RARE]: [Species.KUBFU],
    }),
  [TrainerType.BREEDER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.325)
    .setEncounterBgm(TrainerType.POKEFAN)
    .setHasGenders("Breeder Female")
    .setHasDouble("Breeders")
    .setPartyTemplateFunc(() =>
      getWavePartyTemplate(
        trainerPartyTemplates.FOUR_WEAKER,
        trainerPartyTemplates.FIVE_WEAKER,
        trainerPartyTemplates.SIX_WEAKER,
      ),
    )
    .setSpeciesFilter(s => s.baseTotal < 450),
  [TrainerType.CLERK]: new TrainerConfig(++t)
    .setHasGenders("Clerk Female")
    .setHasDouble("Colleagues")
    .setEncounterBgm(TrainerType.CLERK)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_WEAK,
      trainerPartyTemplates.THREE_WEAK,
      trainerPartyTemplates.ONE_AVG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.TWO_WEAK_ONE_AVG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.MEOWTH,
        Species.PSYDUCK,
        Species.BUDEW,
        Species.PIDOVE,
        Species.CINCCINO,
        Species.LITLEO,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.JIGGLYPUFF,
        Species.MAGNEMITE,
        Species.MARILL,
        Species.COTTONEE,
        Species.SKIDDO,
      ],
      [TrainerPoolTier.RARE]: [Species.BUIZEL, Species.SNEASEL, Species.KLEFKI, Species.INDEEDEE],
    }),
  [TrainerType.CYCLIST]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.3)
    .setHasGenders("Cyclist Female")
    .setHasDouble("Cyclists")
    .setEncounterBgm(TrainerType.CYCLIST)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.ONE_AVG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.DODUO, Species.PICHU, Species.TAILLOW, Species.STARLY, Species.PONYTA],
      [TrainerPoolTier.UNCOMMON]: [
        Species.ELECTRIKE,
        Species.SHINX,
        Species.BLITZLE,
        Species.DUCKLETT,
        Species.WATTREL,
      ],
      [TrainerPoolTier.RARE]: [Species.YANMA, Species.NINJASK, Species.WHIRLIPEDE, Species.EMOLGA, Species.SKIDDO],
      [TrainerPoolTier.SUPER_RARE]: [Species.ACCELGOR, Species.DREEPY],
    }),
  [TrainerType.DANCER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.55)
    .setEncounterBgm(TrainerType.CYCLIST)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_WEAK,
      trainerPartyTemplates.ONE_AVG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.TWO_WEAK_SAME_TWO_WEAK_SAME,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.RALTS, Species.SPOINK, Species.LOTAD, Species.BUDEW],
      [TrainerPoolTier.UNCOMMON]: [Species.SPINDA, Species.SWABLU, Species.MARACTUS],
      [TrainerPoolTier.RARE]: [Species.BELLOSSOM, Species.HITMONTOP, Species.MIME_JR, Species.ORICORIO],
      [TrainerPoolTier.SUPER_RARE]: [Species.QUAXLY, Species.JANGMO_O],
    }),
  [TrainerType.DEPOT_AGENT]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.45)
    .setEncounterBgm(TrainerType.CLERK)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.THREE_WEAK,
      trainerPartyTemplates.THREE_AVG,
      trainerPartyTemplates.FOUR_WEAK,
    )
    .setSpeciesFilter(s => s.isOfType(PokemonType.GROUND)),
  [TrainerType.DOCTOR]: new TrainerConfig(++t)
    .setHasGenders("Nurse", "lass")
    .setHasDouble("Medical Team")
    .setMoneyMultiplier(3)
    .setEncounterBgm(TrainerType.CLERK)
    .setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === Moves.HEAL_PULSE)),
  [TrainerType.FIREBREATHER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.4)
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === Moves.SMOG) || s.isOfType(PokemonType.FIRE)),
  [TrainerType.FISHERMAN]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.25)
    .setEncounterBgm(TrainerType.BACKPACKER)
    .setSpecialtyType(PokemonType.WATER)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG,
      trainerPartyTemplates.ONE_AVG,
      trainerPartyTemplates.THREE_WEAK_SAME,
      trainerPartyTemplates.ONE_STRONG,
      trainerPartyTemplates.SIX_WEAKER,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.TENTACOOL,
        Species.MAGIKARP,
        Species.GOLDEEN,
        Species.STARYU,
        Species.REMORAID,
        Species.SKRELP,
        Species.CLAUNCHER,
        Species.ARROKUDA,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.POLIWAG,
        Species.SHELLDER,
        Species.KRABBY,
        Species.HORSEA,
        Species.CARVANHA,
        Species.BARBOACH,
        Species.CORPHISH,
        Species.FINNEON,
        Species.TYMPOLE,
        Species.BASCULIN,
        Species.FRILLISH,
        Species.INKAY,
      ],
      [TrainerPoolTier.RARE]: [
        Species.CHINCHOU,
        Species.CORSOLA,
        Species.WAILMER,
        Species.CLAMPERL,
        Species.LUVDISC,
        Species.MANTYKE,
        Species.ALOMOMOLA,
        Species.TATSUGIRI,
        Species.VELUZA,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.LAPRAS, Species.FEEBAS, Species.RELICANTH, Species.DONDOZO],
    }),
  [TrainerType.GUITARIST]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.2)
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpecialtyType(PokemonType.ELECTRIC)
    .setSpeciesFilter(s => s.isOfType(PokemonType.ELECTRIC)),
  [TrainerType.HARLEQUIN]: new TrainerConfig(++t)
    .setEncounterBgm(TrainerType.PSYCHIC)
    .setSpeciesFilter(s => tmSpecies[Moves.TRICK_ROOM].indexOf(s.speciesId) > -1),
  [TrainerType.HIKER]: new TrainerConfig(++t)
    .setEncounterBgm(TrainerType.BACKPACKER)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_AVG_SAME_ONE_AVG,
      trainerPartyTemplates.TWO_AVG_SAME_ONE_STRONG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.FOUR_WEAK,
      trainerPartyTemplates.ONE_STRONG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.SANDSHREW,
        Species.DIGLETT,
        Species.GEODUDE,
        Species.MACHOP,
        Species.ARON,
        Species.ROGGENROLA,
        Species.DRILBUR,
        Species.NACLI,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.ZUBAT,
        Species.RHYHORN,
        Species.ONIX,
        Species.CUBONE,
        Species.WOOBAT,
        Species.SWINUB,
        Species.NOSEPASS,
        Species.HIPPOPOTAS,
        Species.DWEBBLE,
        Species.KLAWF,
        Species.TOEDSCOOL,
      ],
      [TrainerPoolTier.RARE]: [
        Species.TORKOAL,
        Species.TRAPINCH,
        Species.BARBOACH,
        Species.GOLETT,
        Species.ALOLA_DIGLETT,
        Species.ALOLA_GEODUDE,
        Species.GALAR_STUNFISK,
        Species.PALDEA_WOOPER,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.MAGBY, Species.LARVITAR],
    }),
  [TrainerType.HOOLIGANS]: new TrainerConfig(++t)
    .setDoubleOnly()
    .setMoneyMultiplier(1.5)
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setPartyTemplateFunc(() =>
      getWavePartyTemplate(
        trainerPartyTemplates.TWO_WEAK,
        trainerPartyTemplates.TWO_AVG,
        trainerPartyTemplates.ONE_AVG_ONE_STRONG,
      ),
    )
    .setSpeciesFilter(s => s.isOfType(PokemonType.POISON) || s.isOfType(PokemonType.DARK)),
  [TrainerType.HOOPSTER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.INFIELDER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.JANITOR]: new TrainerConfig(++t).setMoneyMultiplier(1.1).setEncounterBgm(TrainerType.CLERK),
  [TrainerType.LINEBACKER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.MAID]: new TrainerConfig(++t).setMoneyMultiplier(1.6).setEncounterBgm(TrainerType.RICH),
  [TrainerType.MUSICIAN]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.1)
    .setEncounterBgm(TrainerType.POKEFAN)
    .setPartyTemplates(
      trainerPartyTemplates.FOUR_WEAKER,
      trainerPartyTemplates.THREE_WEAK,
      trainerPartyTemplates.TWO_WEAK_ONE_AVG,
      trainerPartyTemplates.TWO_AVG,
    )
    .setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === Moves.SING)),
  [TrainerType.HEX_MANIAC]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .setEncounterBgm(TrainerType.PSYCHIC)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.ONE_AVG_ONE_STRONG,
      trainerPartyTemplates.TWO_AVG_SAME_ONE_AVG,
      trainerPartyTemplates.THREE_AVG,
      trainerPartyTemplates.TWO_STRONG,
    )
    .setSpeciesFilter(s => s.isOfType(PokemonType.GHOST) || s.isOfType(PokemonType.PSYCHIC)),
  [TrainerType.NURSERY_AIDE]: new TrainerConfig(++t).setMoneyMultiplier(1.3).setEncounterBgm("lass"),
  [TrainerType.OFFICER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.55)
    .setEncounterBgm(TrainerType.CLERK)
    .setPartyTemplates(
      trainerPartyTemplates.ONE_AVG,
      trainerPartyTemplates.ONE_STRONG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.VULPIX,
        Species.GROWLITHE,
        Species.SNUBBULL,
        Species.POOCHYENA,
        Species.ELECTRIKE,
        Species.LILLIPUP,
        Species.YAMPER,
        Species.FIDOUGH,
      ],
      [TrainerPoolTier.UNCOMMON]: [Species.HOUNDOUR, Species.ROCKRUFF, Species.MASCHIFF],
      [TrainerPoolTier.RARE]: [Species.JOLTEON, Species.RIOLU],
      [TrainerPoolTier.SUPER_RARE]: [],
      [TrainerPoolTier.ULTRA_RARE]: [Species.ENTEI, Species.SUICUNE, Species.RAIKOU],
    }),
  [TrainerType.PARASOL_LADY]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.55)
    .setEncounterBgm(TrainerType.PARASOL_LADY)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_AVG_SAME_ONE_AVG,
      trainerPartyTemplates.TWO_AVG_SAME_ONE_STRONG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.FOUR_WEAK,
      trainerPartyTemplates.ONE_STRONG,
    )
    .setSpeciesFilter(
      s =>
        [s.ability1, s.ability2, s.abilityHidden].some(
          a =>
            !!a &&
            [
              Abilities.DRIZZLE,
              Abilities.SWIFT_SWIM,
              Abilities.HYDRATION,
              Abilities.RAIN_DISH,
              Abilities.DRY_SKIN,
              Abilities.WIND_POWER,
            ].includes(a),
        ) || s.getLevelMoves().some(plm => plm[1] === Moves.RAIN_DANCE),
    ), // Mons with rain abilities or who learn Rain Dance by level
  [TrainerType.PILOT]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.75)
    .setEncounterBgm(TrainerType.CLERK)
    .setPartyTemplates(
      trainerPartyTemplates.THREE_WEAK,
      trainerPartyTemplates.TWO_WEAK_ONE_AVG,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.THREE_AVG,
    )
    .setSpeciesFilter(s => tmSpecies[Moves.FLY].indexOf(s.speciesId) > -1),
  [TrainerType.POKEFAN]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.4)
    .setName("PokéFan")
    .setHasGenders("PokéFan Female")
    .setHasDouble("PokéFan Family")
    .setEncounterBgm(TrainerType.POKEFAN)
    .setPartyTemplates(
      trainerPartyTemplates.SIX_WEAKER,
      trainerPartyTemplates.FOUR_WEAK,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.ONE_STRONG,
      trainerPartyTemplates.FOUR_WEAK_SAME,
      trainerPartyTemplates.FIVE_WEAK,
      trainerPartyTemplates.SIX_WEAKER_SAME,
    )
    .setSpeciesFilter(s => tmSpecies[Moves.HELPING_HAND].indexOf(s.speciesId) > -1),
  [TrainerType.PRESCHOOLER]: new TrainerConfig(++t)
    .setMoneyMultiplier(0.2)
    .setEncounterBgm(TrainerType.YOUNGSTER)
    .setHasGenders("Preschooler Female", "lass")
    .setHasDouble("Preschoolers")
    .setPartyTemplates(
      trainerPartyTemplates.THREE_WEAK,
      trainerPartyTemplates.FOUR_WEAKER,
      trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG,
      trainerPartyTemplates.FIVE_WEAKER,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.CATERPIE,
        Species.PICHU,
        Species.SANDSHREW,
        Species.LEDYBA,
        Species.BUDEW,
        Species.BURMY,
        Species.WOOLOO,
        Species.PAWMI,
        Species.SMOLIV,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.EEVEE,
        Species.CLEFFA,
        Species.IGGLYBUFF,
        Species.SWINUB,
        Species.WOOPER,
        Species.DRIFLOON,
        Species.DEDENNE,
        Species.STUFFUL,
      ],
      [TrainerPoolTier.RARE]: [Species.RALTS, Species.RIOLU, Species.JOLTIK, Species.TANDEMAUS],
      [TrainerPoolTier.SUPER_RARE]: [Species.DARUMAKA, Species.TINKATINK],
    }),
  [TrainerType.PSYCHIC]: new TrainerConfig(++t)
    .setHasGenders("Psychic Female")
    .setHasDouble("Psychics")
    .setMoneyMultiplier(1.4)
    .setEncounterBgm(TrainerType.PSYCHIC)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_WEAK,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG,
      trainerPartyTemplates.TWO_WEAK_SAME_TWO_WEAK_SAME,
      trainerPartyTemplates.ONE_STRONGER,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.ABRA,
        Species.DROWZEE,
        Species.RALTS,
        Species.SPOINK,
        Species.GOTHITA,
        Species.SOLOSIS,
        Species.BLIPBUG,
        Species.ESPURR,
        Species.HATENNA,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.MIME_JR,
        Species.EXEGGCUTE,
        Species.MEDITITE,
        Species.NATU,
        Species.EXEGGCUTE,
        Species.WOOBAT,
        Species.INKAY,
        Species.ORANGURU,
      ],
      [TrainerPoolTier.RARE]: [Species.ELGYEM, Species.SIGILYPH, Species.BALTOY, Species.GIRAFARIG, Species.MEOWSTIC],
      [TrainerPoolTier.SUPER_RARE]: [Species.BELDUM, Species.ESPEON, Species.STANTLER],
    }),
  [TrainerType.RANGER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.4)
    .setName("Pokémon Ranger")
    .setEncounterBgm(TrainerType.BACKPACKER)
    .setHasGenders("Pokémon Ranger Female")
    .setHasDouble("Pokémon Rangers")
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.PICHU,
        Species.GROWLITHE,
        Species.PONYTA,
        Species.ZIGZAGOON,
        Species.SEEDOT,
        Species.BIDOOF,
        Species.RIOLU,
        Species.SEWADDLE,
        Species.SKIDDO,
        Species.SALANDIT,
        Species.YAMPER,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.AZURILL,
        Species.TAUROS,
        Species.MAREEP,
        Species.FARFETCHD,
        Species.TEDDIURSA,
        Species.SHROOMISH,
        Species.ELECTRIKE,
        Species.BUDEW,
        Species.BUIZEL,
        Species.MUDBRAY,
        Species.STUFFUL,
      ],
      [TrainerPoolTier.RARE]: [
        Species.EEVEE,
        Species.SCYTHER,
        Species.KANGASKHAN,
        Species.RALTS,
        Species.MUNCHLAX,
        Species.ZORUA,
        Species.PALDEA_TAUROS,
        Species.TINKATINK,
        Species.CYCLIZAR,
        Species.FLAMIGO,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.LARVESTA],
    }),
  [TrainerType.RICH]: new TrainerConfig(++t)
    .setMoneyMultiplier(3.25)
    .setName("Gentleman")
    .setHasGenders("Madame")
    .setHasDouble("Rich Couple")
    .setPartyTemplates(
      trainerPartyTemplates.THREE_WEAK,
      trainerPartyTemplates.FOUR_WEAK,
      trainerPartyTemplates.TWO_WEAK_ONE_AVG,
      trainerPartyTemplates.THREE_AVG,
    )
    .setSpeciesFilter(s => s.isOfType(PokemonType.NORMAL) || s.isOfType(PokemonType.ELECTRIC)),
  [TrainerType.RICH_KID]: new TrainerConfig(++t)
    .setMoneyMultiplier(2.5)
    .setName("Rich Boy")
    .setHasGenders("Lady")
    .setHasDouble("Rich Kids")
    .setEncounterBgm(TrainerType.RICH)
    .setPartyTemplates(
      trainerPartyTemplates.FOUR_WEAKER,
      trainerPartyTemplates.THREE_WEAK_SAME,
      trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG,
    )
    .setSpeciesFilter(s => s.baseTotal <= 460),
  [TrainerType.ROUGHNECK]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.4)
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpeciesFilter(s => s.isOfType(PokemonType.DARK)),
  [TrainerType.SAILOR]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.4)
    .setEncounterBgm(TrainerType.BACKPACKER)
    .setSpeciesFilter(s => s.isOfType(PokemonType.WATER) || s.isOfType(PokemonType.FIGHTING)),
  [TrainerType.SCIENTIST]: new TrainerConfig(++t)
    .setHasGenders("Scientist Female")
    .setHasDouble("Scientists")
    .setMoneyMultiplier(1.7)
    .setEncounterBgm(TrainerType.SCIENTIST)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.MAGNEMITE, Species.GRIMER, Species.DROWZEE, Species.VOLTORB, Species.KOFFING],
      [TrainerPoolTier.UNCOMMON]: [
        Species.BALTOY,
        Species.BRONZOR,
        Species.FERROSEED,
        Species.KLINK,
        Species.CHARJABUG,
        Species.BLIPBUG,
        Species.HELIOPTILE,
      ],
      [TrainerPoolTier.RARE]: [
        Species.ABRA,
        Species.DITTO,
        Species.PORYGON,
        Species.ELEKID,
        Species.SOLOSIS,
        Species.GALAR_WEEZING,
      ],
      [TrainerPoolTier.SUPER_RARE]: [
        Species.OMANYTE,
        Species.KABUTO,
        Species.AERODACTYL,
        Species.LILEEP,
        Species.ANORITH,
        Species.CRANIDOS,
        Species.SHIELDON,
        Species.TIRTOUGA,
        Species.ARCHEN,
        Species.ARCTOVISH,
        Species.ARCTOZOLT,
        Species.DRACOVISH,
        Species.DRACOZOLT,
      ],
      [TrainerPoolTier.ULTRA_RARE]: [Species.ROTOM, Species.MELTAN],
    }),
  [TrainerType.SMASHER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.SNOW_WORKER]: new TrainerConfig(++t)
    .setName("Worker")
    .setHasDouble("Workers")
    .setMoneyMultiplier(1.7)
    .setEncounterBgm(TrainerType.CLERK)
    .setSpeciesFilter(s => s.isOfType(PokemonType.ICE) || s.isOfType(PokemonType.STEEL)),
  [TrainerType.STRIKER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.SCHOOL_KID]: new TrainerConfig(++t)
    .setMoneyMultiplier(0.75)
    .setEncounterBgm(TrainerType.YOUNGSTER)
    .setHasGenders("School Kid Female", "lass")
    .setHasDouble("School Kids")
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.ODDISH,
        Species.EXEGGCUTE,
        Species.TEDDIURSA,
        Species.WURMPLE,
        Species.RALTS,
        Species.SHROOMISH,
        Species.FLETCHLING,
      ],
      [TrainerPoolTier.UNCOMMON]: [Species.VOLTORB, Species.WHISMUR, Species.MEDITITE, Species.MIME_JR, Species.NYMBLE],
      [TrainerPoolTier.RARE]: [Species.TANGELA, Species.EEVEE, Species.YANMA],
      [TrainerPoolTier.SUPER_RARE]: [Species.TADBULB],
    }),
  [TrainerType.SWIMMER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.3)
    .setEncounterBgm(TrainerType.PARASOL_LADY)
    .setHasGenders("Swimmer Female")
    .setHasDouble("Swimmers")
    .setSpecialtyType(PokemonType.WATER)
    .setSpeciesFilter(s => s.isOfType(PokemonType.WATER)),
  [TrainerType.TWINS]: new TrainerConfig(++t)
    .setDoubleOnly()
    .setMoneyMultiplier(0.65)
    .setUseSameSeedForAllMembers()
    .setPartyTemplateFunc(() =>
      getWavePartyTemplate(
        trainerPartyTemplates.TWO_WEAK,
        trainerPartyTemplates.TWO_AVG,
        trainerPartyTemplates.TWO_STRONG,
      ),
    )
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([
        Species.PLUSLE,
        Species.VOLBEAT,
        Species.PACHIRISU,
        Species.SILCOON,
        Species.METAPOD,
        Species.IGGLYBUFF,
        Species.PETILIL,
        Species.EEVEE,
      ]),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          Species.MINUN,
          Species.ILLUMISE,
          Species.EMOLGA,
          Species.CASCOON,
          Species.KAKUNA,
          Species.CLEFFA,
          Species.COTTONEE,
          Species.EEVEE,
        ],
        TrainerSlot.TRAINER_PARTNER,
      ),
    )
    .setEncounterBgm(TrainerType.TWINS),
  [TrainerType.VETERAN]: new TrainerConfig(++t)
    .setHasGenders("Veteran Female")
    .setHasDouble("Veteran Duo")
    .setMoneyMultiplier(2.5)
    .setEncounterBgm(TrainerType.ACE_TRAINER)
    .setSpeciesFilter(s => s.isOfType(PokemonType.DRAGON)),
  [TrainerType.WAITER]: new TrainerConfig(++t)
    .setHasGenders("Waitress")
    .setHasDouble("Restaurant Staff")
    .setMoneyMultiplier(1.5)
    .setEncounterBgm(TrainerType.CLERK)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.CLEFFA,
        Species.CHATOT,
        Species.PANSAGE,
        Species.PANSEAR,
        Species.PANPOUR,
        Species.MINCCINO,
      ],
      [TrainerPoolTier.UNCOMMON]: [Species.TROPIUS, Species.PETILIL, Species.BOUNSWEET, Species.INDEEDEE],
      [TrainerPoolTier.RARE]: [Species.APPLIN, Species.SINISTEA, Species.POLTCHAGEIST],
    }),
  [TrainerType.WORKER]: new TrainerConfig(++t)
    .setHasGenders("Worker Female")
    .setHasDouble("Workers")
    .setEncounterBgm(TrainerType.CLERK)
    .setMoneyMultiplier(1.7)
    .setSpeciesFilter(s => s.isOfType(PokemonType.ROCK) || s.isOfType(PokemonType.STEEL)),
  [TrainerType.YOUNGSTER]: new TrainerConfig(++t)
    .setMoneyMultiplier(0.5)
    .setEncounterBgm(TrainerType.YOUNGSTER)
    .setHasGenders("Lass", "lass")
    .setHasDouble("Beginners")
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAKER)
    .setSpeciesPools([
      Species.CATERPIE,
      Species.WEEDLE,
      Species.RATTATA,
      Species.SENTRET,
      Species.POOCHYENA,
      Species.ZIGZAGOON,
      Species.WURMPLE,
      Species.BIDOOF,
      Species.PATRAT,
      Species.LILLIPUP,
    ]),
  [TrainerType.ROCKET_GRUNT]: new TrainerConfig(++t)
    .setHasGenders("Rocket Grunt Female")
    .setHasDouble("Rocket Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_rocket_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.WEEDLE,
        Species.RATTATA,
        Species.EKANS,
        Species.SANDSHREW,
        Species.ZUBAT,
        Species.ODDISH,
        Species.GEODUDE,
        Species.SLOWPOKE,
        Species.GRIMER,
        Species.KOFFING,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.MANKEY,
        Species.GROWLITHE,
        Species.MAGNEMITE,
        Species.ONIX,
        Species.VOLTORB,
        Species.EXEGGCUTE,
        Species.CUBONE,
        Species.LICKITUNG,
        Species.TAUROS,
        Species.MAGIKARP,
        Species.MURKROW,
        Species.ELEKID,
        Species.MAGBY,
      ],
      [TrainerPoolTier.RARE]: [
        Species.ABRA,
        Species.GASTLY,
        Species.SCYTHER,
        Species.PORYGON,
        Species.OMANYTE,
        Species.KABUTO,
        Species.ALOLA_RATTATA,
        Species.ALOLA_SANDSHREW,
        Species.ALOLA_MEOWTH,
        Species.ALOLA_GEODUDE,
        Species.ALOLA_GRIMER,
        Species.PALDEA_TAUROS,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.DRATINI, Species.LARVITAR],
    }),
  [TrainerType.ARCHER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("rocket_admin", "rocket", [Species.HOUNDOOM])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_rocket_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.ARIANA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("rocket_admin_female", "rocket", [Species.ARBOK])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_rocket_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.PROTON]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("rocket_admin", "rocket", [Species.CROBAT])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_rocket_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.PETREL]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("rocket_admin", "rocket", [Species.WEEZING])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_rocket_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.MAGMA_GRUNT]: new TrainerConfig(++t)
    .setHasGenders("Magma Grunt Female")
    .setHasDouble("Magma Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aqua_magma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.DIGLETT,
        Species.GROWLITHE,
        Species.SLUGMA,
        Species.POOCHYENA,
        Species.ZIGZAGOON,
        Species.NUMEL,
        Species.TORKOAL,
        Species.BALTOY,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.RHYHORN,
        Species.PHANPY,
        Species.MAGBY,
        Species.ZANGOOSE,
        Species.SOLROCK,
        Species.HEATMOR,
        Species.ROLYCOLY,
        Species.CAPSAKID,
      ],
      [TrainerPoolTier.RARE]: [
        Species.TRAPINCH,
        Species.LILEEP,
        Species.ANORITH,
        Species.GOLETT,
        Species.TURTONATOR,
        Species.TOEDSCOOL,
        Species.HISUI_GROWLITHE,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.CHARCADET, Species.ARON],
    }),
  [TrainerType.TABITHA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("magma_admin", "magma", [Species.CAMERUPT])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aqua_magma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.COURTNEY]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("magma_admin_female", "magma", [Species.CAMERUPT])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aqua_magma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.AQUA_GRUNT]: new TrainerConfig(++t)
    .setHasGenders("Aqua Grunt Female")
    .setHasDouble("Aqua Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aqua_magma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.QWILFISH,
        Species.REMORAID,
        Species.ZIGZAGOON,
        Species.LOTAD,
        Species.WINGULL,
        Species.CARVANHA,
        Species.WAILMER,
        Species.BARBOACH,
        Species.CORPHISH,
        Species.SPHEAL,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.TENTACOOL,
        Species.HORSEA,
        Species.CHINCHOU,
        Species.WOOPER,
        Species.AZURILL,
        Species.SEVIPER,
        Species.CLAMPERL,
        Species.WIMPOD,
        Species.CLOBBOPUS,
      ],
      [TrainerPoolTier.RARE]: [
        Species.MANTYKE,
        Species.TYMPOLE,
        Species.SKRELP,
        Species.ARROKUDA,
        Species.WIGLETT,
        Species.HISUI_QWILFISH,
        Species.PALDEA_WOOPER,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.BASCULEGION, Species.DONDOZO],
    }),
  [TrainerType.MATT]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("aqua_admin", "aqua", [Species.SHARPEDO])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aqua_magma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.SHELLY]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("aqua_admin_female", "aqua", [Species.SHARPEDO])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aqua_magma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.GALACTIC_GRUNT]: new TrainerConfig(++t)
    .setHasGenders("Galactic Grunt Female")
    .setHasDouble("Galactic Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_galactic_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.WURMPLE,
        Species.SHINX,
        Species.BURMY,
        Species.DRIFLOON,
        Species.GLAMEOW,
        Species.STUNKY,
        Species.BRONZOR,
        Species.CROAGUNK,
        Species.CARNIVINE,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.ZUBAT,
        Species.LICKITUNG,
        Species.RHYHORN,
        Species.TANGELA,
        Species.YANMA,
        Species.GLIGAR,
        Species.SWINUB,
        Species.SKORUPI,
      ],
      [TrainerPoolTier.RARE]: [
        Species.SNEASEL,
        Species.TEDDIURSA,
        Species.ELEKID,
        Species.MAGBY,
        Species.DUSKULL,
        Species.HISUI_GROWLITHE,
        Species.HISUI_QWILFISH,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.SPIRITOMB, Species.ROTOM, Species.HISUI_SNEASEL],
    }),
  [TrainerType.JUPITER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("galactic_commander_female", "galactic", [Species.SKUNTANK])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_galactic_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.MARS]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("galactic_commander_female", "galactic", [Species.PURUGLY])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_galactic_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.SATURN]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("galactic_commander", "galactic", [Species.TOXICROAK])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_galactic_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.PLASMA_GRUNT]: new TrainerConfig(++t)
    .setHasGenders("Plasma Grunt Female")
    .setHasDouble("Plasma Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_plasma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.PATRAT,
        Species.LILLIPUP,
        Species.PURRLOIN,
        Species.WOOBAT,
        Species.TYMPOLE,
        Species.SANDILE,
        Species.SCRAGGY,
        Species.TRUBBISH,
        Species.VANILLITE,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.TIMBURR,
        Species.VENIPEDE,
        Species.DARUMAKA,
        Species.FOONGUS,
        Species.FRILLISH,
        Species.JOLTIK,
        Species.KLINK,
        Species.CUBCHOO,
        Species.GOLETT,
      ],
      [TrainerPoolTier.RARE]: [
        Species.DRILBUR,
        Species.ZORUA,
        Species.MIENFOO,
        Species.PAWNIARD,
        Species.BOUFFALANT,
        Species.RUFFLET,
        Species.VULLABY,
        Species.DURANT,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.AXEW, Species.DRUDDIGON, Species.DEINO, Species.HISUI_ZORUA],
    }),
  [TrainerType.ZINZOLIN]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("plasma_sage", "plasma_zinzolin", [Species.CRYOGONAL])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_plasma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.COLRESS]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("plasma_boss", "plasma_colress", [Species.KLINKLANG])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_colress")
    .setMixedBattleBgm("battle_colress")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.FLARE_GRUNT]: new TrainerConfig(++t)
    .setHasGenders("Flare Grunt Female")
    .setHasDouble("Flare Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_flare_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.HOUNDOUR,
        Species.GULPIN,
        Species.SKORUPI,
        Species.CROAGUNK,
        Species.PURRLOIN,
        Species.SCRAGGY,
        Species.FLETCHLING,
        Species.SCATTERBUG,
        Species.LITLEO,
        Species.ESPURR,
        Species.INKAY,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.POOCHYENA,
        Species.ELECTRIKE,
        Species.FOONGUS,
        Species.PANCHAM,
        Species.BINACLE,
        Species.SKRELP,
        Species.CLAUNCHER,
        Species.HELIOPTILE,
        Species.PHANTUMP,
        Species.PUMPKABOO,
      ],
      [TrainerPoolTier.RARE]: [Species.SNEASEL, Species.LITWICK, Species.PAWNIARD, Species.NOIBAT],
      [TrainerPoolTier.SUPER_RARE]: [Species.SLIGGOO, Species.HISUI_SLIGGOO, Species.HISUI_AVALUGG],
    }),
  [TrainerType.BRYONY]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("flare_admin_female", "flare", [Species.LIEPARD])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_flare_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.XEROSIC]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("flare_admin", "flare", [Species.MALAMAR])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_flare_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.AETHER_GRUNT]: new TrainerConfig(++t)
    .setHasGenders("Aether Grunt Female")
    .setHasDouble("Aether Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aether_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.CORSOLA,
        Species.LILLIPUP,
        Species.PIKIPEK,
        Species.YUNGOOS,
        Species.ROCKRUFF,
        Species.MORELULL,
        Species.BOUNSWEET,
        Species.COMFEY,
        Species.KOMALA,
        Species.TOGEDEMARU,
        Species.ALOLA_RAICHU,
        Species.ALOLA_DIGLETT,
        Species.ALOLA_GEODUDE,
        Species.ALOLA_EXEGGUTOR,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.POLIWAG,
        Species.CRABRAWLER,
        Species.ORICORIO,
        Species.CUTIEFLY,
        Species.WISHIWASHI,
        Species.MUDBRAY,
        Species.STUFFUL,
        Species.ORANGURU,
        Species.PASSIMIAN,
        Species.PYUKUMUKU,
        Species.BRUXISH,
        Species.ALOLA_SANDSHREW,
        Species.ALOLA_VULPIX,
        Species.ALOLA_MAROWAK,
      ],
      [TrainerPoolTier.RARE]: [
        Species.MINIOR,
        Species.TURTONATOR,
        Species.MIMIKYU,
        Species.DRAMPA,
        Species.GALAR_CORSOLA,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.PORYGON, Species.JANGMO_O],
    }),
  [TrainerType.FABA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("aether_admin", "aether", [Species.HYPNO])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aether_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.SKULL_GRUNT]: new TrainerConfig(++t)
    .setHasGenders("Skull Grunt Female")
    .setHasDouble("Skull Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_skull_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.EKANS,
        Species.VENONAT,
        Species.DROWZEE,
        Species.KOFFING,
        Species.SPINARAK,
        Species.SCRAGGY,
        Species.TRUBBISH,
        Species.MAREANIE,
        Species.SALANDIT,
        Species.ALOLA_RATTATA,
        Species.ALOLA_MEOWTH,
        Species.ALOLA_GRIMER,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.ZUBAT,
        Species.GASTLY,
        Species.HOUNDOUR,
        Species.SABLEYE,
        Species.VENIPEDE,
        Species.SANDILE,
        Species.VULLABY,
        Species.PANCHAM,
        Species.FOMANTIS,
        Species.ALOLA_MAROWAK,
      ],
      [TrainerPoolTier.RARE]: [
        Species.PAWNIARD,
        Species.WISHIWASHI,
        Species.SANDYGAST,
        Species.MIMIKYU,
        Species.DHELMISE,
        Species.NYMBLE,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.GRUBBIN, Species.DEWPIDER],
    }),
  [TrainerType.PLUMERIA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("skull_admin", "skull", [Species.SALAZZLE])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_skull_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.MACRO_GRUNT]: new TrainerConfig(++t)
    .setHasGenders("Macro Grunt Female")
    .setHasDouble("Macro Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_macro_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.STEELIX,
        Species.MAWILE,
        Species.FERROSEED,
        Species.KLINK,
        Species.SKWOVET,
        Species.ROOKIDEE,
        Species.ROLYCOLY,
        Species.CUFANT,
        Species.GALAR_MEOWTH,
        Species.GALAR_ZIGZAGOON,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.MAGNEMITE,
        Species.RIOLU,
        Species.DRILBUR,
        Species.APPLIN,
        Species.CRAMORANT,
        Species.ARROKUDA,
        Species.SINISTEA,
        Species.HATENNA,
        Species.FALINKS,
        Species.GALAR_PONYTA,
        Species.GALAR_YAMASK,
      ],
      [TrainerPoolTier.RARE]: [
        Species.SCIZOR,
        Species.BELDUM,
        Species.HONEDGE,
        Species.GALAR_FARFETCHD,
        Species.GALAR_MR_MIME,
        Species.GALAR_DARUMAKA,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.DURALUDON, Species.DREEPY],
    }),
  [TrainerType.OLEANA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("macro_admin", "macro_cosmos", [Species.GARBODOR])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_oleana")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.STAR_GRUNT]: new TrainerConfig(++t)
    .setHasGenders("Star Grunt Female")
    .setHasDouble("Star Grunts")
    .setMoneyMultiplier(1.0)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        Species.DUNSPARCE,
        Species.HOUNDOUR,
        Species.AZURILL,
        Species.GULPIN,
        Species.FOONGUS,
        Species.FLETCHLING,
        Species.LITLEO,
        Species.FLABEBE,
        Species.CRABRAWLER,
        Species.NYMBLE,
        Species.PAWMI,
        Species.FIDOUGH,
        Species.SQUAWKABILLY,
        Species.MASCHIFF,
        Species.SHROODLE,
        Species.KLAWF,
        Species.WIGLETT,
        Species.PALDEA_WOOPER,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        Species.KOFFING,
        Species.EEVEE,
        Species.GIRAFARIG,
        Species.RALTS,
        Species.TORKOAL,
        Species.SEVIPER,
        Species.SCRAGGY,
        Species.ZORUA,
        Species.MIMIKYU,
        Species.IMPIDIMP,
        Species.FALINKS,
        Species.CAPSAKID,
        Species.TINKATINK,
        Species.BOMBIRDIER,
        Species.CYCLIZAR,
        Species.FLAMIGO,
        Species.PALDEA_TAUROS,
      ],
      [TrainerPoolTier.RARE]: [
        Species.MANKEY,
        Species.PAWNIARD,
        Species.CHARCADET,
        Species.FLITTLE,
        Species.VAROOM,
        Species.ORTHWORM,
      ],
      [TrainerPoolTier.SUPER_RARE]: [Species.DONDOZO, Species.GIMMIGHOUL],
    }),
  [TrainerType.GIACOMO]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_dark", [Species.KINGAMBIT], PokemonType.DARK)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Segin Starmobile
        p.moveset = [
          new PokemonMove(Moves.WICKED_TORQUE),
          new PokemonMove(Moves.SPIN_OUT),
          new PokemonMove(Moves.SHIFT_GEAR),
          new PokemonMove(Moves.HIGH_HORSEPOWER),
        ];
      }),
    ),
  [TrainerType.MELA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_fire", [Species.ARMAROUGE], PokemonType.FIRE)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 2; // Schedar Starmobile
        p.moveset = [
          new PokemonMove(Moves.BLAZING_TORQUE),
          new PokemonMove(Moves.SPIN_OUT),
          new PokemonMove(Moves.SHIFT_GEAR),
          new PokemonMove(Moves.HIGH_HORSEPOWER),
        ];
      }),
    ),
  [TrainerType.ATTICUS]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_poison", [Species.REVAVROOM], PokemonType.POISON)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 3; // Navi Starmobile
        p.moveset = [
          new PokemonMove(Moves.NOXIOUS_TORQUE),
          new PokemonMove(Moves.SPIN_OUT),
          new PokemonMove(Moves.SHIFT_GEAR),
          new PokemonMove(Moves.HIGH_HORSEPOWER),
        ];
      }),
    ),
  [TrainerType.ORTEGA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_fairy", [Species.DACHSBUN], PokemonType.FAIRY)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 4; // Ruchbah Starmobile
        p.moveset = [
          new PokemonMove(Moves.MAGICAL_TORQUE),
          new PokemonMove(Moves.SPIN_OUT),
          new PokemonMove(Moves.SHIFT_GEAR),
          new PokemonMove(Moves.HIGH_HORSEPOWER),
        ];
      }),
    ),
  [TrainerType.ERI]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_fighting", [Species.ANNIHILAPE], PokemonType.FIGHTING)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 5; // Caph Starmobile
        p.moveset = [
          new PokemonMove(Moves.COMBAT_TORQUE),
          new PokemonMove(Moves.SPIN_OUT),
          new PokemonMove(Moves.SHIFT_GEAR),
          new PokemonMove(Moves.HIGH_HORSEPOWER),
        ];
      }),
    ),

  [TrainerType.BROCK]: new TrainerConfig((t = TrainerType.BROCK))
    .initForGymLeader(signatureSpecies["BROCK"], true, PokemonType.ROCK, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.MISTY]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["MISTY"], false, PokemonType.WATER, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.LT_SURGE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["LT_SURGE"], true, PokemonType.ELECTRIC, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.ERIKA]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["ERIKA"], false, PokemonType.GRASS, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.JANINE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["JANINE"], false, PokemonType.POISON, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.SABRINA]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["SABRINA"], false, PokemonType.PSYCHIC, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.BLAINE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["BLAINE"], true, PokemonType.FIRE, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.GIOVANNI]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["GIOVANNI"], true, PokemonType.GROUND, false, -2)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.FALKNER]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["FALKNER"], true, PokemonType.FLYING, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.BUGSY]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["BUGSY"], true, PokemonType.BUG, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.WHITNEY]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["WHITNEY"], false, PokemonType.NORMAL, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.MORTY]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["MORTY"], true, PokemonType.GHOST, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.CHUCK]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["CHUCK"], true, PokemonType.FIGHTING, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.JASMINE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["JASMINE"], false, PokemonType.STEEL, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.PRYCE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["PRYCE"], true, PokemonType.ICE, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.CLAIR]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["CLAIR"], false, PokemonType.DRAGON, false, -3)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.ROXANNE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["ROXANNE"], false, PokemonType.ROCK, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.BRAWLY]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["BRAWLY"], true, PokemonType.FIGHTING, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.WATTSON]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["WATTSON"], true, PokemonType.ELECTRIC, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.FLANNERY]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["FLANNERY"], false, PokemonType.FIRE, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.NORMAN]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["NORMAN"], true, PokemonType.NORMAL, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.WINONA]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["WINONA"], false, PokemonType.FLYING, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.TATE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["TATE"], true, PokemonType.PSYCHIC, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym")
    .setHasDouble("tate_liza_double")
    .setDoubleTrainerType(TrainerType.LIZA)
    .setDoubleTitle("gym_leader_double"),
  [TrainerType.LIZA]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["LIZA"], false, PokemonType.PSYCHIC, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym")
    .setHasDouble("liza_tate_double")
    .setDoubleTrainerType(TrainerType.TATE)
    .setDoubleTitle("gym_leader_double"),
  [TrainerType.JUAN]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["JUAN"], true, PokemonType.WATER, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.ROARK]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["ROARK"], true, PokemonType.ROCK, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.GARDENIA]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["GARDENIA"], false, PokemonType.GRASS, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.MAYLENE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["MAYLENE"], false, PokemonType.FIGHTING, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.CRASHER_WAKE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["CRASHER_WAKE"], true, PokemonType.WATER, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.FANTINA]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["FANTINA"], false, PokemonType.GHOST, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.BYRON]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["BYRON"], true, PokemonType.STEEL, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.CANDICE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["CANDICE"], false, PokemonType.ICE, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.VOLKNER]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["VOLKNER"], true, PokemonType.ELECTRIC, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.CILAN]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["CILAN"], true, PokemonType.GRASS, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.CHILI]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["CHILI"], true, PokemonType.FIRE, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.CRESS]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["CRESS"], true, PokemonType.WATER, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.CHEREN]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["CHEREN"], true, PokemonType.NORMAL, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.LENORA]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["LENORA"], false, PokemonType.NORMAL, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.ROXIE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["ROXIE"], false, PokemonType.POISON, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.BURGH]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["BURGH"], true, PokemonType.BUG, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.ELESA]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["ELESA"], false, PokemonType.ELECTRIC, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.CLAY]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["CLAY"], true, PokemonType.GROUND, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.SKYLA]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["SKYLA"], false, PokemonType.FLYING, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.BRYCEN]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["BRYCEN"], true, PokemonType.ICE, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.DRAYDEN]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["DRAYDEN"], true, PokemonType.DRAGON, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.MARLON]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["MARLON"], true, PokemonType.WATER, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.VIOLA]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["VIOLA"], false, PokemonType.BUG, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.GRANT]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["GRANT"], true, PokemonType.ROCK, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.KORRINA]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["KORRINA"], false, PokemonType.FIGHTING, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.RAMOS]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["RAMOS"], true, PokemonType.GRASS, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.CLEMONT]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["CLEMONT"], true, PokemonType.ELECTRIC, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.VALERIE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["VALERIE"], false, PokemonType.FAIRY, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.OLYMPIA]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["OLYMPIA"], false, PokemonType.PSYCHIC, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.WULFRIC]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["WULFRIC"], true, PokemonType.ICE, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.MILO]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["MILO"], true, PokemonType.GRASS, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.NESSA]: new TrainerConfig(++t)
    .setName("Nessa")
    .initForGymLeader(signatureSpecies["NESSA"], false, PokemonType.WATER, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.KABU]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["KABU"], true, PokemonType.FIRE, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.BEA]: new TrainerConfig(++t)
    .setName("Bea")
    .initForGymLeader(signatureSpecies["BEA"], false, PokemonType.FIGHTING, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.ALLISTER]: new TrainerConfig(++t)
    .setName("Allister")
    .initForGymLeader(signatureSpecies["ALLISTER"], true, PokemonType.GHOST, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.OPAL]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["OPAL"], false, PokemonType.FAIRY, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.BEDE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["BEDE"], true, PokemonType.FAIRY, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.GORDIE]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["GORDIE"], true, PokemonType.ROCK, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.MELONY]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["MELONY"], false, PokemonType.ICE, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.PIERS]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["PIERS"], true, PokemonType.DARK, false, -3)
    .setHasDouble("piers_marnie_double")
    .setDoubleTrainerType(TrainerType.MARNIE)
    .setDoubleTitle("gym_leader_double")
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.MARNIE]: new TrainerConfig(++t)
    .setName("Marnie")
    .initForGymLeader(signatureSpecies["MARNIE"], false, PokemonType.DARK, false, -4)
    .setHasDouble("marnie_piers_double")
    .setDoubleTrainerType(TrainerType.PIERS)
    .setDoubleTitle("gym_leader_double")
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.RAIHAN]: new TrainerConfig(++t)
    .setName("Raihan")
    .initForGymLeader(signatureSpecies["RAIHAN"], true, PokemonType.DRAGON, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.KATY]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["KATY"], false, PokemonType.BUG, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.BRASSIUS]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["BRASSIUS"], true, PokemonType.GRASS, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.IONO]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["IONO"], false, PokemonType.ELECTRIC, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.KOFU]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["KOFU"], true, PokemonType.WATER, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.LARRY]: new TrainerConfig(++t)
    .setName("Larry")
    .initForGymLeader(signatureSpecies["LARRY"], true, PokemonType.NORMAL, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.RYME]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["RYME"], false, PokemonType.GHOST, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.TULIP]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["TULIP"], false, PokemonType.PSYCHIC, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.GRUSHA]: new TrainerConfig(++t)
    .initForGymLeader(signatureSpecies["GRUSHA"], true, PokemonType.ICE, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),

  [TrainerType.LORELEI]: new TrainerConfig((t = TrainerType.LORELEI))
    .initForEliteFour(signatureSpecies["LORELEI"], false, PokemonType.ICE)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.BRUNO]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["BRUNO"], true, PokemonType.FIGHTING)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.AGATHA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["AGATHA"], false, PokemonType.GHOST)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.LANCE]: new TrainerConfig(++t)
    .setName("Lance")
    .initForEliteFour(signatureSpecies["LANCE"], true, PokemonType.DRAGON)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.WILL]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["WILL"], true, PokemonType.PSYCHIC)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.KOGA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["KOGA"], true, PokemonType.POISON)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.KAREN]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["KAREN"], false, PokemonType.DARK)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.SIDNEY]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["SIDNEY"], true, PokemonType.DARK)
    .setMixedBattleBgm("battle_hoenn_elite"),
  [TrainerType.PHOEBE]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["PHOEBE"], false, PokemonType.GHOST)
    .setMixedBattleBgm("battle_hoenn_elite"),
  [TrainerType.GLACIA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["GLACIA"], false, PokemonType.ICE)
    .setMixedBattleBgm("battle_hoenn_elite"),
  [TrainerType.DRAKE]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["DRAKE"], true, PokemonType.DRAGON)
    .setMixedBattleBgm("battle_hoenn_elite"),
  [TrainerType.AARON]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["AARON"], true, PokemonType.BUG)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.BERTHA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["BERTHA"], false, PokemonType.GROUND)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.FLINT]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["FLINT"], true, PokemonType.FIRE, 3)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.LUCIAN]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["LUCIAN"], true, PokemonType.PSYCHIC)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.SHAUNTAL]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["SHAUNTAL"], false, PokemonType.GHOST)
    .setMixedBattleBgm("battle_unova_elite"),
  [TrainerType.MARSHAL]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["MARSHAL"], true, PokemonType.FIGHTING)
    .setMixedBattleBgm("battle_unova_elite"),
  [TrainerType.GRIMSLEY]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["GRIMSLEY"], true, PokemonType.DARK)
    .setMixedBattleBgm("battle_unova_elite"),
  [TrainerType.CAITLIN]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["CAITLIN"], false, PokemonType.PSYCHIC)
    .setMixedBattleBgm("battle_unova_elite"),
  [TrainerType.MALVA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["MALVA"], false, PokemonType.FIRE)
    .setMixedBattleBgm("battle_kalos_elite"),
  [TrainerType.SIEBOLD]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["SIEBOLD"], true, PokemonType.WATER)
    .setMixedBattleBgm("battle_kalos_elite"),
  [TrainerType.WIKSTROM]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["WIKSTROM"], true, PokemonType.STEEL)
    .setMixedBattleBgm("battle_kalos_elite"),
  [TrainerType.DRASNA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["DRASNA"], false, PokemonType.DRAGON)
    .setMixedBattleBgm("battle_kalos_elite"),
  [TrainerType.HALA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["HALA"], true, PokemonType.FIGHTING)
    .setMixedBattleBgm("battle_alola_elite"),
  [TrainerType.MOLAYNE]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["MOLAYNE"], true, PokemonType.STEEL)
    .setMixedBattleBgm("battle_alola_elite"),
  [TrainerType.OLIVIA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["OLIVIA"], false, PokemonType.ROCK)
    .setMixedBattleBgm("battle_alola_elite"),
  [TrainerType.ACEROLA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["ACEROLA"], false, PokemonType.GHOST)
    .setMixedBattleBgm("battle_alola_elite"),
  [TrainerType.KAHILI]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["KAHILI"], false, PokemonType.FLYING)
    .setMixedBattleBgm("battle_alola_elite"),
  [TrainerType.MARNIE_ELITE]: new TrainerConfig(++t)
    .setName("Marnie")
    .initForEliteFour(signatureSpecies["MARNIE_ELITE"], false, PokemonType.DARK)
    .setMixedBattleBgm("battle_galar_elite"),
  [TrainerType.NESSA_ELITE]: new TrainerConfig(++t)
    .setName("Nessa")
    .initForEliteFour(signatureSpecies["NESSA_ELITE"], false, PokemonType.WATER)
    .setMixedBattleBgm("battle_galar_elite"),
  [TrainerType.BEA_ELITE]: new TrainerConfig(++t)
    .setName("Bea")
    .initForEliteFour(signatureSpecies["BEA_ELITE"], false, PokemonType.FIGHTING)
    .setMixedBattleBgm("battle_galar_elite"),
  [TrainerType.ALLISTER_ELITE]: new TrainerConfig(++t)
    .setName("Allister")
    .initForEliteFour(signatureSpecies["ALLISTER_ELITE"], true, PokemonType.GHOST)
    .setMixedBattleBgm("battle_galar_elite"),
  [TrainerType.RAIHAN_ELITE]: new TrainerConfig(++t)
    .setName("Raihan")
    .initForEliteFour(signatureSpecies["RAIHAN_ELITE"], true, PokemonType.DRAGON)
    .setMixedBattleBgm("battle_galar_elite"),
  [TrainerType.RIKA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["RIKA"], false, PokemonType.GROUND, 5)
    .setMixedBattleBgm("battle_paldea_elite"),
  [TrainerType.POPPY]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["POPPY"], false, PokemonType.STEEL, 5)
    .setMixedBattleBgm("battle_paldea_elite"),
  [TrainerType.LARRY_ELITE]: new TrainerConfig(++t)
    .setName("Larry")
    .initForEliteFour(signatureSpecies["LARRY_ELITE"], true, PokemonType.FLYING, 5)
    .setMixedBattleBgm("battle_paldea_elite"),
  [TrainerType.HASSEL]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["HASSEL"], true, PokemonType.DRAGON, 5)
    .setMixedBattleBgm("battle_paldea_elite"),
  [TrainerType.CRISPIN]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["CRISPIN"], true, PokemonType.FIRE, 5)
    .setMixedBattleBgm("battle_bb_elite"),
  [TrainerType.AMARYS]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["AMARYS"], false, PokemonType.STEEL, 5)
    .setMixedBattleBgm("battle_bb_elite"),
  [TrainerType.LACEY]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["LACEY"], false, PokemonType.FAIRY, 5)
    .setMixedBattleBgm("battle_bb_elite"),
  [TrainerType.DRAYTON]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["DRAYTON"], true, PokemonType.DRAGON, 5)
    .setMixedBattleBgm("battle_bb_elite"),

  [TrainerType.BLUE]: new TrainerConfig((t = TrainerType.BLUE))
    .initForChampion(true)
    .setBattleBgm("battle_kanto_champion")
    .setMixedBattleBgm("battle_kanto_champion")
    .setHasDouble("blue_red_double")
    .setDoubleTrainerType(TrainerType.RED)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.ALAKAZAM]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.MACHAMP]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.HO_OH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.RHYPERIOR, Species.ELECTIVIRE, Species.MAGMORTAR]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc(
        [Species.ARCANINE, Species.EXEGGUTOR, Species.GYARADOS],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.setBoss(true, 2);
        },
      ),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.PIDGEOT], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Pidgeot
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.MALE;
      }),
    )
    .setInstantTera(3), // Tera Ground or Rock Rhyperior / Electric Electivire / Fire Magmortar
  [TrainerType.RED]: new TrainerConfig(++t)
    .initForChampion(true)
    .setBattleBgm("battle_johto_champion")
    .setMixedBattleBgm("battle_johto_champion")
    .setHasDouble("red_blue_double")
    .setDoubleTrainerType(TrainerType.BLUE)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.PIKACHU], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 8; // G-Max Pikachu
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.ESPEON, Species.UMBREON, Species.SYLVEON]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.LUGIA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.MEGANIUM, Species.TYPHLOSION, Species.FERALIGATR]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.SNORLAX], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.setBoss(true, 2);
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc(
        [Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.formIndex = 1; // Mega Venusaur, Mega Charizard X, or Mega Blastoise
          p.generateAndPopulateMoveset();
          p.generateName();
          p.gender = Gender.MALE;
        },
      ),
    )
    .setInstantTera(3), // Tera Grass Meganium / Fire Typhlosion / Water Feraligatr
  [TrainerType.LANCE_CHAMPION]: new TrainerConfig(++t)
    .setName("Lance")
    .initForChampion(true)
    .setBattleBgm("battle_johto_champion")
    .setMixedBattleBgm("battle_johto_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.GYARADOS, Species.KINGDRA]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.AERODACTYL]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.SALAMENCE], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Salamence
        p.generateAndPopulateMoveset();
        p.generateName();
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.CHARIZARD]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.TYRANITAR, Species.GARCHOMP, Species.KOMMO_O], TrainerSlot.TRAINER, true, p => {
        p.teraType = PokemonType.DRAGON;
        p.abilityIndex = p.species.speciesId === Species.KOMMO_O ? 1 : 2; // Soundproof Kommo-o, Unnerve Tyranitar, Rough Skin Garchomp
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.DRAGONITE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(4), // Tera Dragon Tyranitar / Garchomp / Kommo-o
  [TrainerType.STEVEN]: new TrainerConfig(++t)
    .initForChampion(true)
    .setBattleBgm("battle_hoenn_champion_g5")
    .setMixedBattleBgm("battle_hoenn_champion_g6")
    .setHasDouble("steven_wallace_double")
    .setDoubleTrainerType(TrainerType.WALLACE)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.SKARMORY]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.CRADILY, Species.ARMALDO]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.AGGRON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.setBoss(true, 2);
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.GOLURK, Species.RUNERIGUS]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.REGIROCK, Species.REGICE, Species.REGISTEEL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.METAGROSS], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Metagross
        p.generateAndPopulateMoveset();
        p.generateName();
      }),
    )
    .setInstantTera(4), // Tera Rock Regirock / Ice Regice / Steel Registeel
  [TrainerType.WALLACE]: new TrainerConfig(++t)
    .initForChampion(true)
    .setBattleBgm("battle_hoenn_champion_g5")
    .setMixedBattleBgm("battle_hoenn_champion_g6")
    .setHasDouble("wallace_steven_double")
    .setDoubleTrainerType(TrainerType.STEVEN)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.PELIPPER], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Drizzle
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.LUDICOLO]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.LATIAS, Species.LATIOS], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Latios or Mega Latias
        p.generateAndPopulateMoveset();
        p.generateName();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.SWAMPERT, Species.GASTRODON, Species.SEISMITOAD]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.REGIELEKI, Species.REGIDRAGO], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.MILOTIC], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(4), // Tera Electric Regieleki / Dragon Regidrago
  [TrainerType.CYNTHIA]: new TrainerConfig(++t)
    .initForChampion(false)
    .setBattleBgm("battle_sinnoh_champion")
    .setMixedBattleBgm("battle_sinnoh_champion")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.SPIRITOMB], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.LUCARIO]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.GIRATINA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc(
        [Species.MILOTIC, Species.ROSERADE, Species.HISUI_ARCANINE],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.teraType = p.species.type1;
        },
      ),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.TOGEKISS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.setBoss(true, 2);
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.GARCHOMP], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Garchomp
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.FEMALE;
      }),
    )
    .setInstantTera(3), // Tera Water Milotic / Grass Roserade / Fire Hisuian Arcanine
  [TrainerType.ALDER]: new TrainerConfig(++t)
    .initForChampion(true)
    .setHasDouble("alder_iris_double")
    .setDoubleTrainerType(TrainerType.IRIS)
    .setDoubleTitle("champion_double")
    .setBattleBgm("battle_champion_alder")
    .setMixedBattleBgm("battle_champion_alder")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.BOUFFALANT, Species.BRAVIARY]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [Species.HISUI_LILLIGANT, Species.HISUI_ZOROARK, Species.BASCULEGION],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ROGUE_BALL;
        },
      ),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.ZEKROM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.KELDEO], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc(
        [Species.CHANDELURE, Species.KROOKODILE, Species.REUNICLUS, Species.CONKELDURR],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.teraType = p.species.speciesId === Species.KROOKODILE ? PokemonType.DARK : p.species.type1;
        },
      ),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.VOLCARONA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(4), // Tera Ghost Chandelure / Dark Krookodile / Psychic Reuniclus / Fighting Conkeldurr
  [TrainerType.IRIS]: new TrainerConfig(++t)
    .initForChampion(false)
    .setBattleBgm("battle_champion_iris")
    .setMixedBattleBgm("battle_champion_iris")
    .setHasDouble("iris_alder_double")
    .setDoubleTrainerType(TrainerType.ALDER)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.DRUDDIGON]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.ARCHEOPS]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.RESHIRAM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc(
        [Species.SALAMENCE, Species.HYDREIGON, Species.ARCHALUDON],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.teraType = PokemonType.DRAGON;
        },
      ),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.LAPRAS], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // G-Max Lapras
        p.generateAndPopulateMoveset();
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.HAXORUS], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Mold Breaker
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(3), // Tera Dragon Salamence / Hydreigon / Archaludon
  [TrainerType.DIANTHA]: new TrainerConfig(++t)
    .initForChampion(false)
    .setMixedBattleBgm("battle_kalos_champion")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.HAWLUCHA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.TREVENANT, Species.GOURGEIST]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.XERNEAS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.TYRANTRUM, Species.AURORUS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 2; // Rock Head Tyrantrum, Snow Warning Aurorus
        p.teraType = p.species.type2!;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.GOODRA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.setBoss(true, 2);
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.GARDEVOIR], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Gardevoir
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.FEMALE;
      }),
    )
    .setInstantTera(3), // Tera Dragon Tyrantrum / Ice Aurorus
  [TrainerType.KUKUI]: new TrainerConfig(++t)
    .initForChampion(true)
    .setMixedBattleBgm("battle_champion_kukui")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.LYCANROC], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 2; // Dusk Lycanroc
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.MAGNEZONE, Species.ALOLA_NINETALES]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc(
        [Species.TORNADUS, Species.THUNDURUS, Species.LANDORUS],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.formIndex = 1; // Therian Formes
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ULTRA_BALL;
        },
      ),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.TAPU_KOKO, Species.TAPU_FINI], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.setBoss(true, 2);
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.SNORLAX], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // G-Max Snorlax
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.INCINEROAR, Species.HISUI_DECIDUEYE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.teraType = p.species.type2!;
      }),
    )
    .setInstantTera(5), // Tera Dark Incineroar / Fighting Hisuian Decidueye
  [TrainerType.HAU]: new TrainerConfig(++t)
    .initForChampion(true)
    .setMixedBattleBgm("battle_alola_champion")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.ALOLA_RAICHU], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.NOIVERN]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.SOLGALEO], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.TAPU_LELE, Species.TAPU_BULU], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.teraType = p.species.type1;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.ZYGARDE], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Zygarde 10% forme, Aura Break
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.DECIDUEYE, Species.PRIMARINA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.setBoss(true, 2);
        p.gender = p.species.speciesId === Species.PRIMARINA ? Gender.FEMALE : Gender.MALE;
      }),
    )
    .setInstantTera(3), // Tera Psychic Tapu Lele / Grass Tapu Bulu
  [TrainerType.LEON]: new TrainerConfig(++t)
    .initForChampion(true)
    .setMixedBattleBgm("battle_galar_champion")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.AEGISLASH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.RHYPERIOR, Species.SEISMITOAD, Species.MR_RIME]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.ZACIAN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.DRAGAPULT]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc(
        [Species.RILLABOOM, Species.CINDERACE, Species.INTELEON],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.setBoss(true, 2);
        },
      ),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.CHARIZARD], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 3; // G-Max Charizard
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.MALE;
      }),
    )
    .setInstantTera(3), // Tera Dragapult to Ghost or Dragon
  [TrainerType.MUSTARD]: new TrainerConfig(++t)
    .initForChampion(true)
    .setMixedBattleBgm("battle_mustard")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.CORVIKNIGHT], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.KOMMO_O], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.GALAR_SLOWBRO, Species.GALAR_SLOWKING], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.teraType = PokemonType.PSYCHIC;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.GALAR_DARMANITAN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.BLASTOISE, Species.VENUSAUR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.setBoss(true, 2);
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.URSHIFU], TrainerSlot.TRAINER, true, p => {
        p.formIndex = randSeedInt(2, 2); // Random G-Max Urshifu
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.MALE;
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setInstantTera(2), // Tera Psychic Galar-Slowbro / Galar-Slowking
  [TrainerType.GEETA]: new TrainerConfig(++t)
    .initForChampion(false)
    .setMixedBattleBgm("battle_champion_geeta")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.GLIMMORA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.ESPATHRA, Species.VELUZA]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.MIRAIDON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.BAXCALIBUR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([Species.CHESNAUGHT, Species.DELPHOX, Species.GRENINJA]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.KINGAMBIT], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Supreme Overlord
        p.teraType = PokemonType.FLYING;
      }),
    )
    .setInstantTera(5), // Tera Flying Kingambit
  [TrainerType.NEMONA]: new TrainerConfig(++t)
    .initForChampion(false)
    .setMixedBattleBgm("battle_champion_nemona")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.LYCANROC], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 0; // Midday form
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.PAWMOT]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.KORAIDON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.GHOLDENGO]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.ARMAROUGE, Species.CERULEDGE], TrainerSlot.TRAINER, true, p => {
        p.teraType = p.species.type2!;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc(
        [Species.MEOWSCARADA, Species.SKELEDIRGE, Species.QUAQUAVAL],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.gender = Gender.MALE;
          p.setBoss(true, 2);
        },
      ),
    )
    .setInstantTera(4), // Tera Psychic Armarouge / Ghost Ceruledge
  [TrainerType.KIERAN]: new TrainerConfig(++t)
    .initForChampion(true)
    .setMixedBattleBgm("battle_champion_kieran")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.POLIWRATH, Species.POLITOED], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.INCINEROAR, Species.GRIMMSNARL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = p.species.speciesId === Species.INCINEROAR ? 2 : 0; // Intimidate Incineroar, Prankster Grimmsnarl
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.TERAPAGOS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.URSALUNA, Species.BLOODMOON_URSALUNA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.OGERPON], TrainerSlot.TRAINER, true, p => {
        p.formIndex = randSeedInt(4); // Random Ogerpon Tera Mask
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === Moves.IVY_CUDGEL)) {
          // Check if Ivy Cudgel is in the moveset, if not, replace the first move with Ivy Cudgel.
          p.moveset[0] = new PokemonMove(Moves.IVY_CUDGEL);
        }
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.HYDRAPPLE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(4), // Tera Ogerpon

  [TrainerType.RIVAL]: new TrainerConfig((t = TrainerType.RIVAL))
    .setName("Finn")
    .setHasGenders("Ivy")
    .setHasCharSprite()
    .setTitle("Rival")
    .setStaticParty()
    .setEncounterBgm(TrainerType.RIVAL)
    .setBattleBgm("battle_rival")
    .setMixedBattleBgm("battle_rival")
    .setPartyTemplates(trainerPartyTemplates.RIVAL)
    .setModifierRewardFuncs(
      () => modifierTypes.SUPER_EXP_CHARM,
      () => modifierTypes.EXP_SHARE,
    )
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc(
        [
          Species.BULBASAUR,
          Species.CHARMANDER,
          Species.SQUIRTLE,
          Species.CHIKORITA,
          Species.CYNDAQUIL,
          Species.TOTODILE,
          Species.TREECKO,
          Species.TORCHIC,
          Species.MUDKIP,
          Species.TURTWIG,
          Species.CHIMCHAR,
          Species.PIPLUP,
          Species.SNIVY,
          Species.TEPIG,
          Species.OSHAWOTT,
          Species.CHESPIN,
          Species.FENNEKIN,
          Species.FROAKIE,
          Species.ROWLET,
          Species.LITTEN,
          Species.POPPLIO,
          Species.GROOKEY,
          Species.SCORBUNNY,
          Species.SOBBLE,
          Species.SPRIGATITO,
          Species.FUECOCO,
          Species.QUAXLY,
        ],
        TrainerSlot.TRAINER,
        true,
        p => (p.abilityIndex = 0),
      ),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          Species.PIDGEY,
          Species.HOOTHOOT,
          Species.TAILLOW,
          Species.STARLY,
          Species.PIDOVE,
          Species.FLETCHLING,
          Species.PIKIPEK,
          Species.ROOKIDEE,
          Species.WATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    ),
  [TrainerType.RIVAL_2]: new TrainerConfig(++t)
    .setName("Finn")
    .setHasGenders("Ivy")
    .setHasCharSprite()
    .setTitle("Rival")
    .setStaticParty()
    .setMoneyMultiplier(1.25)
    .setEncounterBgm(TrainerType.RIVAL)
    .setBattleBgm("battle_rival")
    .setMixedBattleBgm("battle_rival")
    .setPartyTemplates(trainerPartyTemplates.RIVAL_2)
    .setModifierRewardFuncs(() => modifierTypes.EXP_SHARE)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc(
        [
          Species.IVYSAUR,
          Species.CHARMELEON,
          Species.WARTORTLE,
          Species.BAYLEEF,
          Species.QUILAVA,
          Species.CROCONAW,
          Species.GROVYLE,
          Species.COMBUSKEN,
          Species.MARSHTOMP,
          Species.GROTLE,
          Species.MONFERNO,
          Species.PRINPLUP,
          Species.SERVINE,
          Species.PIGNITE,
          Species.DEWOTT,
          Species.QUILLADIN,
          Species.BRAIXEN,
          Species.FROGADIER,
          Species.DARTRIX,
          Species.TORRACAT,
          Species.BRIONNE,
          Species.THWACKEY,
          Species.RABOOT,
          Species.DRIZZILE,
          Species.FLORAGATO,
          Species.CROCALOR,
          Species.QUAXWELL,
        ],
        TrainerSlot.TRAINER,
        true,
        p => (p.abilityIndex = 0),
      ),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          Species.PIDGEOTTO,
          Species.HOOTHOOT,
          Species.TAILLOW,
          Species.STARAVIA,
          Species.TRANQUILL,
          Species.FLETCHINDER,
          Species.TRUMBEAK,
          Species.CORVISQUIRE,
          Species.WATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId) &&
          !pokemonPrevolutions.hasOwnProperty(species.speciesId) &&
          species.baseTotal >= 450,
      ),
    ),
  [TrainerType.RIVAL_3]: new TrainerConfig(++t)
    .setName("Finn")
    .setHasGenders("Ivy")
    .setHasCharSprite()
    .setTitle("Rival")
    .setStaticParty()
    .setMoneyMultiplier(1.5)
    .setEncounterBgm(TrainerType.RIVAL)
    .setBattleBgm("battle_rival")
    .setMixedBattleBgm("battle_rival")
    .setPartyTemplates(trainerPartyTemplates.RIVAL_3)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc(
        [
          Species.VENUSAUR,
          Species.CHARIZARD,
          Species.BLASTOISE,
          Species.MEGANIUM,
          Species.TYPHLOSION,
          Species.FERALIGATR,
          Species.SCEPTILE,
          Species.BLAZIKEN,
          Species.SWAMPERT,
          Species.TORTERRA,
          Species.INFERNAPE,
          Species.EMPOLEON,
          Species.SERPERIOR,
          Species.EMBOAR,
          Species.SAMUROTT,
          Species.CHESNAUGHT,
          Species.DELPHOX,
          Species.GRENINJA,
          Species.DECIDUEYE,
          Species.INCINEROAR,
          Species.PRIMARINA,
          Species.RILLABOOM,
          Species.CINDERACE,
          Species.INTELEON,
          Species.MEOWSCARADA,
          Species.SKELEDIRGE,
          Species.QUAQUAVAL,
        ],
        TrainerSlot.TRAINER,
        true,
        p => (p.abilityIndex = 0),
      ),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          Species.PIDGEOT,
          Species.NOCTOWL,
          Species.SWELLOW,
          Species.STARAPTOR,
          Species.UNFEZANT,
          Species.TALONFLAME,
          Species.TOUCANNON,
          Species.CORVIKNIGHT,
          Species.KILOWATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId) &&
          !pokemonPrevolutions.hasOwnProperty(species.speciesId) &&
          species.baseTotal >= 450,
      ),
    )
    .setSpeciesFilter(species => species.baseTotal >= 540),
  [TrainerType.RIVAL_4]: new TrainerConfig(++t)
    .setName("Finn")
    .setHasGenders("Ivy")
    .setHasCharSprite()
    .setTitle("Rival")
    .setBoss()
    .setStaticParty()
    .setMoneyMultiplier(1.75)
    .setEncounterBgm(TrainerType.RIVAL)
    .setBattleBgm("battle_rival_2")
    .setMixedBattleBgm("battle_rival_2")
    .setPartyTemplates(trainerPartyTemplates.RIVAL_4)
    .setModifierRewardFuncs(() => modifierTypes.TERA_ORB)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc(
        [
          Species.VENUSAUR,
          Species.CHARIZARD,
          Species.BLASTOISE,
          Species.MEGANIUM,
          Species.TYPHLOSION,
          Species.FERALIGATR,
          Species.SCEPTILE,
          Species.BLAZIKEN,
          Species.SWAMPERT,
          Species.TORTERRA,
          Species.INFERNAPE,
          Species.EMPOLEON,
          Species.SERPERIOR,
          Species.EMBOAR,
          Species.SAMUROTT,
          Species.CHESNAUGHT,
          Species.DELPHOX,
          Species.GRENINJA,
          Species.DECIDUEYE,
          Species.INCINEROAR,
          Species.PRIMARINA,
          Species.RILLABOOM,
          Species.CINDERACE,
          Species.INTELEON,
          Species.MEOWSCARADA,
          Species.SKELEDIRGE,
          Species.QUAQUAVAL,
        ],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.abilityIndex = 0;
          p.teraType = p.species.type1;
        },
      ),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          Species.PIDGEOT,
          Species.NOCTOWL,
          Species.SWELLOW,
          Species.STARAPTOR,
          Species.UNFEZANT,
          Species.TALONFLAME,
          Species.TOUCANNON,
          Species.CORVIKNIGHT,
          Species.KILOWATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId) &&
          !pokemonPrevolutions.hasOwnProperty(species.speciesId) &&
          species.baseTotal >= 450,
      ),
    )
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setInstantTera(0), // Tera starter to primary type
  [TrainerType.RIVAL_5]: new TrainerConfig(++t)
    .setName("Finn")
    .setHasGenders("Ivy")
    .setHasCharSprite()
    .setTitle("Rival")
    .setBoss()
    .setStaticParty()
    .setMoneyMultiplier(2.25)
    .setEncounterBgm(TrainerType.RIVAL)
    .setBattleBgm("battle_rival_3")
    .setMixedBattleBgm("battle_rival_3")
    .setPartyTemplates(trainerPartyTemplates.RIVAL_5)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc(
        [
          Species.VENUSAUR,
          Species.CHARIZARD,
          Species.BLASTOISE,
          Species.MEGANIUM,
          Species.TYPHLOSION,
          Species.FERALIGATR,
          Species.SCEPTILE,
          Species.BLAZIKEN,
          Species.SWAMPERT,
          Species.TORTERRA,
          Species.INFERNAPE,
          Species.EMPOLEON,
          Species.SERPERIOR,
          Species.EMBOAR,
          Species.SAMUROTT,
          Species.CHESNAUGHT,
          Species.DELPHOX,
          Species.GRENINJA,
          Species.DECIDUEYE,
          Species.INCINEROAR,
          Species.PRIMARINA,
          Species.RILLABOOM,
          Species.CINDERACE,
          Species.INTELEON,
          Species.MEOWSCARADA,
          Species.SKELEDIRGE,
          Species.QUAQUAVAL,
        ],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.setBoss(true, 2);
          p.abilityIndex = 0;
          p.teraType = p.species.type1;
        },
      ),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          Species.PIDGEOT,
          Species.NOCTOWL,
          Species.SWELLOW,
          Species.STARAPTOR,
          Species.UNFEZANT,
          Species.TALONFLAME,
          Species.TOUCANNON,
          Species.CORVIKNIGHT,
          Species.KILOWATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId) &&
          !pokemonPrevolutions.hasOwnProperty(species.speciesId) &&
          species.baseTotal >= 450,
      ),
    )
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.RAYQUAZA], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 3);
        p.pokeball = PokeballType.MASTER_BALL;
        p.shiny = timedEventManager.getClassicTrainerShinyChance() === 0;
        p.variant = 1;
      }),
    )
    .setInstantTera(0), // Tera starter to primary type
  [TrainerType.RIVAL_6]: new TrainerConfig(++t)
    .setName("Finn")
    .setHasGenders("Ivy")
    .setHasCharSprite()
    .setTitle("Rival")
    .setBoss()
    .setStaticParty()
    .setMoneyMultiplier(3)
    .setEncounterBgm("final")
    .setBattleBgm("battle_rival_3")
    .setMixedBattleBgm("battle_rival_3")
    .setPartyTemplates(trainerPartyTemplates.RIVAL_6)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc(
        [
          Species.VENUSAUR,
          Species.CHARIZARD,
          Species.BLASTOISE,
          Species.MEGANIUM,
          Species.TYPHLOSION,
          Species.FERALIGATR,
          Species.SCEPTILE,
          Species.BLAZIKEN,
          Species.SWAMPERT,
          Species.TORTERRA,
          Species.INFERNAPE,
          Species.EMPOLEON,
          Species.SERPERIOR,
          Species.EMBOAR,
          Species.SAMUROTT,
          Species.CHESNAUGHT,
          Species.DELPHOX,
          Species.GRENINJA,
          Species.DECIDUEYE,
          Species.INCINEROAR,
          Species.PRIMARINA,
          Species.RILLABOOM,
          Species.CINDERACE,
          Species.INTELEON,
          Species.MEOWSCARADA,
          Species.SKELEDIRGE,
          Species.QUAQUAVAL,
        ],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.setBoss(true, 3);
          p.abilityIndex = 0;
          p.teraType = p.species.type1;
          p.generateAndPopulateMoveset();
        },
      ),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          Species.PIDGEOT,
          Species.NOCTOWL,
          Species.SWELLOW,
          Species.STARAPTOR,
          Species.UNFEZANT,
          Species.TALONFLAME,
          Species.TOUCANNON,
          Species.CORVIKNIGHT,
          Species.KILOWATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.setBoss(true, 2);
          p.generateAndPopulateMoveset();
        },
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId) &&
          !pokemonPrevolutions.hasOwnProperty(species.speciesId) &&
          species.baseTotal >= 450,
      ),
    )
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.RAYQUAZA], TrainerSlot.TRAINER, true, p => {
        p.setBoss();
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
        p.shiny = timedEventManager.getClassicTrainerShinyChance() === 0;
        p.variant = 1;
        p.formIndex = 1; // Mega Rayquaza
        p.generateName();
      }),
    )
    .setInstantTera(0), // Tera starter to primary type

  [TrainerType.ROCKET_BOSS_GIOVANNI_1]: new TrainerConfig((t = TrainerType.ROCKET_BOSS_GIOVANNI_1))
    .setName("Giovanni")
    .initForEvilTeamLeader("Rocket Boss", [])
    .setMixedBattleBgm("battle_rocket_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.PERSIAN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.DUGTRIO, Species.ALOLA_DUGTRIO]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([Species.HONCHKROW]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.NIDOQUEEN, Species.NIDOKING]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.RHYPERIOR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.abilityIndex = 1; // Solid Rock
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.KANGASKHAN], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Kangaskhan
        p.generateName();
      }),
    ),
  [TrainerType.ROCKET_BOSS_GIOVANNI_2]: new TrainerConfig(++t)
    .setName("Giovanni")
    .initForEvilTeamLeader("Rocket Boss", [], true)
    .setMixedBattleBgm("battle_rocket_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.TYRANITAR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.GASTRODON, Species.SEISMITOAD], TrainerSlot.TRAINER, true, p => {
        if (p.species.speciesId === Species.GASTRODON) {
          p.abilityIndex = 0; // Storm Drain
        } else if (p.species.speciesId === Species.SEISMITOAD) {
          p.abilityIndex = 2; // Water Absorb
        }
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.GARCHOMP, Species.EXCADRILL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        if (p.species.speciesId === Species.GARCHOMP) {
          p.abilityIndex = 2; // Rough Skin
        } else if (p.species.speciesId === Species.EXCADRILL) {
          p.abilityIndex = 0; // Sand Rush
        }
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.RHYPERIOR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.abilityIndex = 1; // Solid Rock
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.KANGASKHAN], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Kangaskhan
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.MEWTWO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.MAXIE]: new TrainerConfig(++t)
    .setName("Maxie")
    .initForEvilTeamLeader("Magma Boss", [])
    .setMixedBattleBgm("battle_aqua_magma_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.SOLROCK]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.TALONFLAME]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([Species.WEEZING, Species.GALAR_WEEZING]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.TORKOAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Drought
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([Species.DONPHAN]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.CAMERUPT], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Camerupt
        p.generateName();
        p.gender = Gender.MALE;
      }),
    ),
  [TrainerType.MAXIE_2]: new TrainerConfig(++t)
    .setName("Maxie")
    .initForEvilTeamLeader("Magma Boss", [], true)
    .setMixedBattleBgm("battle_aqua_magma_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.TYPHLOSION, Species.SOLROCK], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.NINETALES, Species.TORKOAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === Species.NINETALES) {
          p.abilityIndex = 2; // Drought
        } else if (p.species.speciesId === Species.TORKOAL) {
          p.abilityIndex = 1; // Drought
        }
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.SCOVILLAIN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 0; // Chlorophyll
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.GREAT_TUSK], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.CAMERUPT], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Camerupt
        p.generateName();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.GROUDON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.ARCHIE]: new TrainerConfig(++t)
    .setName("Archie")
    .initForEvilTeamLeader("Aqua Boss", [])
    .setMixedBattleBgm("battle_aqua_magma_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.LUDICOLO]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.PELIPPER], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Drizzle
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([Species.MUK, Species.ALOLA_MUK]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.WAILORD]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.QWILFISH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Swift Swim
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.SHARPEDO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Sharpedo
        p.generateName();
        p.gender = Gender.MALE;
      }),
    ),
  [TrainerType.ARCHIE_2]: new TrainerConfig(++t)
    .setName("Archie")
    .initForEvilTeamLeader("Aqua Boss", [], true)
    .setMixedBattleBgm("battle_aqua_magma_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.LUDICOLO, Species.EMPOLEON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.POLITOED, Species.PELIPPER], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === Species.POLITOED) {
          p.abilityIndex = 2; // Drizzle
        } else if (p.species.speciesId === Species.PELIPPER) {
          p.abilityIndex = 1; // Drizzle
        }
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([Species.DHELMISE]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.OVERQWIL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Swift Swim
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.SHARPEDO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Sharpedo
        p.generateName();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.KYOGRE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.CYRUS]: new TrainerConfig(++t)
    .setName("Cyrus")
    .initForEvilTeamLeader("Galactic Boss", [])
    .setMixedBattleBgm("battle_galactic_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.GYARADOS]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.HONCHKROW, Species.HISUI_BRAVIARY]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([Species.MAGNEZONE]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.UXIE, Species.MESPRIT, Species.AZELF]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.HOUNDOOM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Houndoom
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.WEAVILE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.gender = Gender.MALE;
      }),
    ),
  [TrainerType.CYRUS_2]: new TrainerConfig(++t)
    .setName("Cyrus")
    .initForEvilTeamLeader("Galactic Boss", [], true)
    .setMixedBattleBgm("battle_galactic_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.CROBAT], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.MAGNEZONE]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.UXIE, Species.MESPRIT, Species.AZELF], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.HOUNDOOM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Houndoom
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.WEAVILE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.DIALGA, Species.PALKIA], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.GHETSIS]: new TrainerConfig(++t)
    .setName("Ghetsis")
    .initForEvilTeamLeader("Plasma Boss", [])
    .setMixedBattleBgm("battle_plasma_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.COFAGRIGUS]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.SEISMITOAD]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([Species.GALVANTULA, Species.EELEKTROSS]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.DRAPION, Species.TOXICROAK]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([Species.KINGAMBIT]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.HYDREIGON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.gender = Gender.MALE;
      }),
    ),
  [TrainerType.GHETSIS_2]: new TrainerConfig(++t)
    .setName("Ghetsis")
    .initForEvilTeamLeader("Plasma Boss", [], true)
    .setMixedBattleBgm("battle_plasma_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.RUNERIGUS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.JELLICENT, Species.BASCULEGION], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.formIndex = 0;
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([Species.KINGAMBIT]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.VOLCARONA, Species.IRON_MOTH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.HYDREIGON, Species.IRON_JUGULIS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        if (p.species.speciesId === Species.HYDREIGON) {
          p.gender = Gender.MALE;
        } else if (p.species.speciesId === Species.IRON_JUGULIS) {
          p.gender = Gender.GENDERLESS;
        }
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.KYUREM], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.LYSANDRE]: new TrainerConfig(++t)
    .setName("Lysandre")
    .initForEvilTeamLeader("Flare Boss", [])
    .setMixedBattleBgm("battle_flare_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.MIENSHAO]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.HONCHKROW, Species.TALONFLAME]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.PYROAR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.DRAGALGE, Species.CLAWITZER], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === Species.DRAGALGE) {
          p.abilityIndex = 2; // Adaptability
        } else if (p.species.speciesId === Species.CLAWITZER) {
          p.abilityIndex = 0; // Mega Launcher
        }
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.GALLADE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Sharpness
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.GYARADOS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Gyarados
        p.generateName();
        p.gender = Gender.MALE;
      }),
    ),
  [TrainerType.LYSANDRE_2]: new TrainerConfig(++t)
    .setName("Lysandre")
    .initForEvilTeamLeader("Flare Boss", [], true)
    .setMixedBattleBgm("battle_flare_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.PYROAR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.DRAGALGE, Species.CLAWITZER], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === Species.DRAGALGE) {
          p.abilityIndex = 2; // Adaptability
        } else if (p.species.speciesId === Species.CLAWITZER) {
          p.abilityIndex = 0; // Mega Launcher
        }
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([Species.AEGISLASH, Species.HISUI_GOODRA]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.IRON_VALIANT], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.GYARADOS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Gyarados
        p.generateName();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.ZYGARDE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
        p.formIndex = 0; // 50% Forme, Aura Break
      }),
    ),
  [TrainerType.LUSAMINE]: new TrainerConfig(++t)
    .setName("Lusamine")
    .initForEvilTeamLeader("Aether Boss", [])
    .setMixedBattleBgm("battle_aether_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.CLEFABLE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.LILLIGANT, Species.HISUI_LILLIGANT]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([Species.MILOTIC, Species.PRIMARINA]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.GALAR_SLOWBRO, Species.GALAR_SLOWKING]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([Species.BEWEAR]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.NIHILEGO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    ),
  [TrainerType.LUSAMINE_2]: new TrainerConfig(++t)
    .setName("Lusamine")
    .initForEvilTeamLeader("Aether Boss", [], true)
    .setMixedBattleBgm("battle_aether_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.CLEFABLE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.MILOTIC, Species.PRIMARINA]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.SILVALLY], TrainerSlot.TRAINER, true, p => {
        p.formIndex = randSeedInt(18); // Random Silvally Form
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === Moves.MULTI_ATTACK)) {
          // Check if Multi Attack is in the moveset, if not, replace the first move with Multi Attack.
          p.moveset[0] = new PokemonMove(Moves.MULTI_ATTACK);
        }
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.PHEROMOSA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.NIHILEGO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.NECROZMA], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.formIndex = 2; // Dawn Wings
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.GUZMA]: new TrainerConfig(++t)
    .setName("Guzma")
    .initForEvilTeamLeader("Skull Boss", [])
    .setMixedBattleBgm("battle_skull_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.YANMEGA, Species.LOKIX], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === Species.YANMEGA) {
          p.abilityIndex = 1; // Tinted Lens
        } else if (p.species.speciesId === Species.LOKIX) {
          p.abilityIndex = 2; // Tinted Lens
        }
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.HERACROSS]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.SCIZOR, Species.KLEAVOR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === Species.SCIZOR) {
          p.abilityIndex = 1; // Technician
        } else if (p.species.speciesId === Species.KLEAVOR) {
          p.abilityIndex = 2; // Sharpness
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.GALVANTULA, Species.VIKAVOLT]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.PINSIR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // Mega Pinsir
        p.pokeball = PokeballType.ULTRA_BALL;
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.GOLISOPOD], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
      }),
    ),
  [TrainerType.GUZMA_2]: new TrainerConfig(++t)
    .setName("Guzma")
    .initForEvilTeamLeader("Skull Boss", [], true)
    .setMixedBattleBgm("battle_skull_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.GOLISOPOD], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.abilityIndex = 2; // Anticipation
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.BUZZWOLE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.CRAWDAUNT, Species.HISUI_SAMUROTT], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 2; // Sharpness Hisuian Samurott, Adaptability Crawdaunt
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.XURKITREE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.GENESECT], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = randSeedInt(4, 1); // Shock, Burn, Chill, or Douse Drive
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === Moves.TECHNO_BLAST)) {
          // Check if Techno Blast is in the moveset, if not, replace the first move with Techno Blast.
          p.moveset[2] = new PokemonMove(Moves.TECHNO_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.PINSIR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.formIndex = 1; // Mega Pinsir
        p.generateAndPopulateMoveset();
        p.generateName();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    ),
  [TrainerType.ROSE]: new TrainerConfig(++t)
    .setName("Rose")
    .initForEvilTeamLeader("Macro Boss", [])
    .setMixedBattleBgm("battle_macro_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.ARCHALUDON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.ESCAVALIER, Species.FERROTHORN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.SIRFETCHD, Species.MR_RIME], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.CORVIKNIGHT], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.KLINKLANG, Species.PERRSERKER], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.COPPERAJAH], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // G-Max Copperajah
        p.generateName();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.gender = Gender.FEMALE;
      }),
    ),
  [TrainerType.ROSE_2]: new TrainerConfig(++t)
    .setName("Rose")
    .initForEvilTeamLeader("Macro Boss", [], true)
    .setMixedBattleBgm("battle_macro_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.ARCHALUDON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.AEGISLASH, Species.GHOLDENGO], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.DRACOZOLT, Species.DRACOVISH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.abilityIndex = 1; // Strong Jaw Dracovish, Hustle Dracozolt
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.MELMETAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc(
        [Species.GALAR_ARTICUNO, Species.GALAR_ZAPDOS, Species.GALAR_MOLTRES],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.setBoss(true, 2);
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ULTRA_BALL;
        },
      ),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.COPPERAJAH], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // G-Max Copperajah
        p.generateName();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.gender = Gender.FEMALE;
      }),
    ),
  [TrainerType.PENNY]: new TrainerConfig(++t)
    .setName("Cassiopeia")
    .initForEvilTeamLeader("Star Boss", [])
    .setMixedBattleBgm("battle_star_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.JOLTEON, Species.LEAFEON]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.VAPOREON, Species.UMBREON]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([Species.ESPEON, Species.GLACEON]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.FLAREON]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.SYLVEON], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 2; // Pixilate
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.EEVEE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 2; // G-Max Eevee
        p.pokeball = PokeballType.ULTRA_BALL;
        p.generateName();
      }),
    )
    .setInstantTera(4), // Tera Fairy Sylveon
  [TrainerType.PENNY_2]: new TrainerConfig(++t)
    .setName("Cassiopeia")
    .initForEvilTeamLeader("Star Boss", [], true)
    .setMixedBattleBgm("battle_star_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.SYLVEON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.abilityIndex = 2; // Pixilate
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.ROTOM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = randSeedInt(5, 1); // Heat, Wash, Frost, Fan, or Mow
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.RAIKOU, Species.ENTEI, Species.SUICUNE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = randSeedInt(5, 1); // Random Starmobile form
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([Species.ZAMAZENTA], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.EEVEE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 2;
        p.generateName();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setInstantTera(0), // Tera Fairy Sylveon
  [TrainerType.BUCK]: new TrainerConfig(++t)
    .setName("Buck")
    .initForStatTrainer(true)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.CLAYDOL], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 3);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.VENUSAUR, Species.COALOSSAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        if (p.species.speciesId === Species.VENUSAUR) {
          p.formIndex = 2; // Gmax
          p.abilityIndex = 2; // Venusaur gets Chlorophyll
        } else {
          p.formIndex = 1; // Gmax
        }
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.AGGRON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // Mega
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([Species.TORKOAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Drought
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([Species.GREAT_TUSK], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.HEATRAN], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.CHERYL]: new TrainerConfig(++t)
    .setName("Cheryl")
    .initForStatTrainer()
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.BLISSEY], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 3);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.SNORLAX, Species.LAPRAS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        p.formIndex = 1; // Gmax
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.AUDINO], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // Mega
        p.generateName();
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.GOODRA], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([Species.IRON_HANDS], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.CRESSELIA, Species.ENAMORUS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === Species.ENAMORUS) {
          p.formIndex = 1; // Therian
          p.generateName();
        }
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.MARLEY]: new TrainerConfig(++t)
    .setName("Marley")
    .initForStatTrainer()
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.ARCANINE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 3);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.CINDERACE, Species.INTELEON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        p.formIndex = 1; // Gmax
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([Species.AERODACTYL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // Mega
        p.generateName();
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.DRAGAPULT], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([Species.IRON_BUNDLE], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.REGIELEKI], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.MIRA]: new TrainerConfig(++t)
    .setName("Mira")
    .initForStatTrainer()
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.ALAKAZAM], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 1;
        p.pokeball = PokeballType.ULTRA_BALL;
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.GENGAR, Species.HATTERENE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        p.formIndex = p.species.speciesId === Species.GENGAR ? 2 : 1; // Gmax
        p.generateName();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([Species.FLUTTER_MANE], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.HYDREIGON], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([Species.MAGNEZONE], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.LATIOS, Species.LATIAS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.RILEY]: new TrainerConfig(++t)
    .setName("Riley")
    .initForStatTrainer(true)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([Species.LUCARIO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 1;
        p.pokeball = PokeballType.ULTRA_BALL;
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([Species.RILLABOOM, Species.CENTISKORCH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        p.formIndex = 1; // Gmax
        p.generateName();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([Species.TYRANITAR], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([Species.ROARING_MOON], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([Species.URSALUNA], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([Species.REGIGIGAS, Species.LANDORUS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === Species.LANDORUS) {
          p.formIndex = 1; // Therian
          p.generateName();
        }
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.VICTOR]: new TrainerConfig(++t)
    .setTitle("The Winstrates")
    .setLocalizedName("Victor")
    .setMoneyMultiplier(1) // The Winstrate trainers have total money multiplier of 6
    .setPartyTemplates(trainerPartyTemplates.ONE_AVG_ONE_STRONG),
  [TrainerType.VICTORIA]: new TrainerConfig(++t)
    .setTitle("The Winstrates")
    .setLocalizedName("Victoria")
    .setMoneyMultiplier(1)
    .setPartyTemplates(trainerPartyTemplates.ONE_AVG_ONE_STRONG),
  [TrainerType.VIVI]: new TrainerConfig(++t)
    .setTitle("The Winstrates")
    .setLocalizedName("Vivi")
    .setMoneyMultiplier(1)
    .setPartyTemplates(trainerPartyTemplates.TWO_AVG_ONE_STRONG),
  [TrainerType.VICKY]: new TrainerConfig(++t)
    .setTitle("The Winstrates")
    .setLocalizedName("Vicky")
    .setMoneyMultiplier(1)
    .setPartyTemplates(trainerPartyTemplates.ONE_AVG),
  [TrainerType.VITO]: new TrainerConfig(++t)
    .setTitle("The Winstrates")
    .setLocalizedName("Vito")
    .setMoneyMultiplier(2)
    .setPartyTemplates(
      new TrainerPartyCompoundTemplate(
        new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE),
        new TrainerPartyTemplate(2, PartyMemberStrength.STRONG),
      ),
    ),
  [TrainerType.BUG_TYPE_SUPERFAN]: new TrainerConfig(++t)
    .setMoneyMultiplier(2.25)
    .setEncounterBgm(TrainerType.ACE_TRAINER)
    .setPartyTemplates(new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE)),
  [TrainerType.EXPERT_POKEMON_BREEDER]: new TrainerConfig(++t)
    .setMoneyMultiplier(3)
    .setEncounterBgm(TrainerType.ACE_TRAINER)
    .setLocalizedName("Expert Pokemon Breeder")
    .setPartyTemplates(new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE)),
  [TrainerType.FUTURE_SELF_M]: new TrainerConfig(++t)
    .setMoneyMultiplier(0)
    .setEncounterBgm("mystery_encounter_weird_dream")
    .setBattleBgm("mystery_encounter_weird_dream")
    .setMixedBattleBgm("mystery_encounter_weird_dream")
    .setVictoryBgm("mystery_encounter_weird_dream")
    .setLocalizedName("Future Self M")
    .setPartyTemplates(new TrainerPartyTemplate(6, PartyMemberStrength.STRONG)),
  [TrainerType.FUTURE_SELF_F]: new TrainerConfig(++t)
    .setMoneyMultiplier(0)
    .setEncounterBgm("mystery_encounter_weird_dream")
    .setBattleBgm("mystery_encounter_weird_dream")
    .setMixedBattleBgm("mystery_encounter_weird_dream")
    .setVictoryBgm("mystery_encounter_weird_dream")
    .setLocalizedName("Future Self F")
    .setPartyTemplates(new TrainerPartyTemplate(6, PartyMemberStrength.STRONG)),
};
