import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { pokemonEvolutions, pokemonPrevolutions } from "#balance/pokemon-evolutions";
import { signatureSpecies } from "#balance/signature-species";
import { tmSpecies } from "#balance/tms";
import { modifierTypes } from "#data/data-lists";
import { doubleBattleDialogue } from "#data/double-battle-dialogue";
import { Gender } from "#data/gender";
import type { PokemonSpecies, PokemonSpeciesFilter } from "#data/pokemon-species";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PartyMemberStrength } from "#enums/party-member-strength";
import { PokeballType } from "#enums/pokeball";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TeraAIMode } from "#enums/tera-ai-mode";
import { TrainerPoolTier } from "#enums/trainer-pool-tier";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { TrainerVariant } from "#enums/trainer-variant";
import type { EnemyPokemon } from "#field/pokemon";
import { PokemonMove } from "#moves/pokemon-move";
import { getIsInitialized, initI18n } from "#plugins/i18n";
import type { EvilTeam } from "#trainers/evil-admin-trainer-pools";
import { evilAdminTrainerPools } from "#trainers/evil-admin-trainer-pools";
import {
  getEvilGruntPartyTemplate,
  getGymLeaderPartyTemplate,
  getWavePartyTemplate,
  TrainerPartyCompoundTemplate,
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
  TrainerConfigs,
  TrainerTierPools,
} from "#types/trainer-funcs";
import { coerceArray, isNullOrUndefined, randSeedInt, randSeedIntRange, randSeedItem } from "#utils/common";
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
   * @param {string} [nameFemale] The name of the female trainer. If 'Ivy', a localized name will be assigned.
   * @param {TrainerType | string} [femaleEncounterBgm] The encounter BGM for the female trainer, which can be a TrainerType or a string.
   * @returns {TrainerConfig} The updated TrainerConfig instance.
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
   * @returns {TrainerConfig} The updated TrainerConfig instance.
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
   * @param {SpeciesId | SpeciesId[]} signatureSpecies The signature species for the evil team leader.
   * @param specialtyType The specialty Type of the admin, if they have one
   * @returns {TrainerConfig} The updated TrainerConfig instance.
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
   * @returns {TrainerConfig} The updated TrainerConfig instance.
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
   * @param {SpeciesId | SpeciesId[]} signatureSpecies The signature species for the evil team leader.
   * @param {PokemonType} specialtyType The specialty type for the evil team Leader.
   * @param boolean Whether or not this is the rematch fight
   * @returns {TrainerConfig} The updated TrainerConfig instance.
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
   * @param {SpeciesId | SpeciesId[]} signatureSpecies The signature species for the Gym Leader. Added to party in reverse order.
   * @param isMale Whether the Gym Leader is Male or Not (for localization of the title).
   * @param {PokemonType} specialtyType The specialty type for the Gym Leader.
   * @param ignoreMinTeraWave Whether the Gym Leader always uses Tera (true), or only Teras after {@linkcode GYM_LEADER_TERA_WAVE} (false). Defaults to false.
   * @param teraSlot Optional, sets the party member in this slot to Terastallize. Wraps based on party size.
   * @returns {TrainerConfig} The updated TrainerConfig instance.
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
   * @param {SpeciesId | SpeciesId[]} signatureSpecies The signature species for the Champion.
   * @param isMale Whether the Champion is Male or Female (for localization of the title).
   * @returns {TrainerConfig} The updated TrainerConfig instance.
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
   * @returns {TrainerConfig} The updated TrainerConfig instance.
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
   * @param {TrainerSlot} trainerSlot - The slot to determine which title to use. Defaults to TrainerSlot.NONE.
   * @param {TrainerVariant} variant - The variant of the trainer to determine the specific title.
   * @returns {string} - The title of the trainer.
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
    .setSpeciesPools([SpeciesId.SMEARGLE]),
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
        SpeciesId.RHYHORN,
        SpeciesId.AIPOM,
        SpeciesId.MAKUHITA,
        SpeciesId.MAWILE,
        SpeciesId.NUMEL,
        SpeciesId.LILLIPUP,
        SpeciesId.SANDILE,
        SpeciesId.WOOLOO,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.GIRAFARIG,
        SpeciesId.ZANGOOSE,
        SpeciesId.SEVIPER,
        SpeciesId.CUBCHOO,
        SpeciesId.PANCHAM,
        SpeciesId.SKIDDO,
        SpeciesId.MUDBRAY,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.TAUROS,
        SpeciesId.STANTLER,
        SpeciesId.DARUMAKA,
        SpeciesId.BOUFFALANT,
        SpeciesId.DEERLING,
        SpeciesId.IMPIDIMP,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.GALAR_DARUMAKA, SpeciesId.TEDDIURSA],
    }),
  [TrainerType.BAKER]: new TrainerConfig(++t)
    .setEncounterBgm(TrainerType.CLERK)
    .setMoneyMultiplier(1.35)
    .setSpeciesFilter(
      s =>
        [s.ability1, s.ability2, s.abilityHidden].some(
          a =>
            !!a
            && [
              AbilityId.WHITE_SMOKE,
              AbilityId.GLUTTONY,
              AbilityId.HONEY_GATHER,
              AbilityId.HARVEST,
              AbilityId.CHEEK_POUCH,
              AbilityId.SWEET_VEIL,
              AbilityId.RIPEN,
              AbilityId.PURIFYING_SALT,
              AbilityId.WELL_BAKED_BODY,
              AbilityId.SUPERSWEET_SYRUP,
              AbilityId.HOSPITALITY,
            ].includes(a),
        )
        || s
          .getLevelMoves()
          .some(plm =>
            [MoveId.SOFT_BOILED, MoveId.SPORE, MoveId.MILK_DRINK, MoveId.OVERHEAT, MoveId.TEATIME].includes(plm[1]),
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
        SpeciesId.MEOWTH,
        SpeciesId.GOLDEEN,
        SpeciesId.MAREEP,
        SpeciesId.MARILL,
        SpeciesId.SKITTY,
        SpeciesId.GLAMEOW,
        SpeciesId.PURRLOIN,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.SMOOCHUM,
        SpeciesId.ROSELIA,
        SpeciesId.LUVDISC,
        SpeciesId.BLITZLE,
        SpeciesId.SEWADDLE,
        SpeciesId.PETILIL,
        SpeciesId.MINCCINO,
        SpeciesId.GOTHITA,
        SpeciesId.SPRITZEE,
        SpeciesId.FLITTLE,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.FEEBAS,
        SpeciesId.FURFROU,
        SpeciesId.SALANDIT,
        SpeciesId.BRUXISH,
        SpeciesId.HATENNA,
        SpeciesId.SNOM,
        SpeciesId.ALOLA_VULPIX,
      ],
      [TrainerPoolTier.SUPER_RARE]: [
        SpeciesId.CLAMPERL,
        SpeciesId.AMAURA,
        SpeciesId.SYLVEON,
        SpeciesId.GOOMY,
        SpeciesId.POPPLIO,
      ],
    }),
  [TrainerType.BIKER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.4)
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.EKANS,
        SpeciesId.KOFFING,
        SpeciesId.CROAGUNK,
        SpeciesId.VENIPEDE,
        SpeciesId.SCRAGGY,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.GRIMER,
        SpeciesId.VOLTORB,
        SpeciesId.TEDDIURSA,
        SpeciesId.MAGBY,
        SpeciesId.SKORUPI,
        SpeciesId.SANDILE,
        SpeciesId.PAWNIARD,
        SpeciesId.SHROODLE,
      ],
      [TrainerPoolTier.RARE]: [SpeciesId.VAROOM, SpeciesId.CYCLIZAR],
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
        SpeciesId.NIDORAN_F,
        SpeciesId.NIDORAN_M,
        SpeciesId.MACHOP,
        SpeciesId.MAKUHITA,
        SpeciesId.MEDITITE,
        SpeciesId.CROAGUNK,
        SpeciesId.TIMBURR,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.MANKEY,
        SpeciesId.POLIWRATH,
        SpeciesId.TYROGUE,
        SpeciesId.BRELOOM,
        SpeciesId.SCRAGGY,
        SpeciesId.MIENFOO,
        SpeciesId.PANCHAM,
        SpeciesId.STUFFUL,
        SpeciesId.CRABRAWLER,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.HERACROSS,
        SpeciesId.RIOLU,
        SpeciesId.THROH,
        SpeciesId.SAWK,
        SpeciesId.PASSIMIAN,
        SpeciesId.CLOBBOPUS,
      ],
      [TrainerPoolTier.SUPER_RARE]: [
        SpeciesId.HITMONTOP,
        SpeciesId.INFERNAPE,
        SpeciesId.GALLADE,
        SpeciesId.HAWLUCHA,
        SpeciesId.HAKAMO_O,
      ],
      [TrainerPoolTier.ULTRA_RARE]: [SpeciesId.KUBFU],
    }),
  [TrainerType.BREEDER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.325)
    .setEncounterBgm(TrainerType.POKEFAN)
    .setHasGenders("Breeder Female")
    .setHasDouble("Breeders")
    .setPartyTemplateFunc(() =>
      getWavePartyTemplate(
        trainerPartyTemplates.FOUR_WEAK,
        trainerPartyTemplates.FIVE_WEAK,
        trainerPartyTemplates.SIX_WEAK,
      ),
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.PICHU,
        SpeciesId.CLEFFA,
        SpeciesId.IGGLYBUFF,
        SpeciesId.TOGEPI,
        SpeciesId.TYROGUE,
        SpeciesId.SMOOCHUM,
        SpeciesId.AZURILL,
        SpeciesId.BUDEW,
        SpeciesId.CHINGLING,
        SpeciesId.BONSLY,
        SpeciesId.MIME_JR,
        SpeciesId.HAPPINY,
        SpeciesId.MANTYKE,
        SpeciesId.TOXEL,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.DITTO,
        SpeciesId.ELEKID,
        SpeciesId.MAGBY,
        SpeciesId.WYNAUT,
        SpeciesId.MUNCHLAX,
        SpeciesId.RIOLU,
        SpeciesId.AUDINO,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.ALOLA_RATTATA,
        SpeciesId.ALOLA_SANDSHREW,
        SpeciesId.ALOLA_VULPIX,
        SpeciesId.ALOLA_DIGLETT,
        SpeciesId.ALOLA_MEOWTH,
        SpeciesId.GALAR_PONYTA,
      ],
      [TrainerPoolTier.SUPER_RARE]: [
        SpeciesId.ALOLA_GEODUDE,
        SpeciesId.ALOLA_GRIMER,
        SpeciesId.GALAR_MEOWTH,
        SpeciesId.GALAR_SLOWPOKE,
        SpeciesId.GALAR_FARFETCHD,
        SpeciesId.HISUI_GROWLITHE,
        SpeciesId.HISUI_VOLTORB,
        SpeciesId.HISUI_QWILFISH,
        SpeciesId.HISUI_SNEASEL,
        SpeciesId.HISUI_ZORUA,
      ],
    }),
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
        SpeciesId.MEOWTH,
        SpeciesId.PSYDUCK,
        SpeciesId.BUDEW,
        SpeciesId.PIDOVE,
        SpeciesId.CINCCINO,
        SpeciesId.LITLEO,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.JIGGLYPUFF,
        SpeciesId.MAGNEMITE,
        SpeciesId.MARILL,
        SpeciesId.COTTONEE,
        SpeciesId.SKIDDO,
      ],
      [TrainerPoolTier.RARE]: [SpeciesId.BUIZEL, SpeciesId.SNEASEL, SpeciesId.KLEFKI, SpeciesId.INDEEDEE],
    }),
  [TrainerType.CYCLIST]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.3)
    .setHasGenders("Cyclist Female")
    .setHasDouble("Cyclists")
    .setEncounterBgm(TrainerType.CYCLIST)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.ONE_AVG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.DODUO,
        SpeciesId.PICHU,
        SpeciesId.TAILLOW,
        SpeciesId.STARLY,
        SpeciesId.PONYTA,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.ELECTRIKE,
        SpeciesId.SHINX,
        SpeciesId.BLITZLE,
        SpeciesId.DUCKLETT,
        SpeciesId.WATTREL,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.YANMA,
        SpeciesId.NINJASK,
        SpeciesId.VENIPEDE,
        SpeciesId.EMOLGA,
        SpeciesId.SKIDDO,
        SpeciesId.ROLYCOLY,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.SHELMET, SpeciesId.DREEPY],
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
      [TrainerPoolTier.COMMON]: [SpeciesId.RALTS, SpeciesId.SPOINK, SpeciesId.LOTAD, SpeciesId.BUDEW],
      [TrainerPoolTier.UNCOMMON]: [SpeciesId.SPINDA, SpeciesId.SWABLU, SpeciesId.MARACTUS],
      [TrainerPoolTier.RARE]: [SpeciesId.BELLOSSOM, SpeciesId.HITMONTOP, SpeciesId.MIME_JR, SpeciesId.ORICORIO],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.QUAXLY, SpeciesId.JANGMO_O],
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
    .setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === MoveId.HEAL_PULSE)),
  [TrainerType.FIREBREATHER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.4)
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === MoveId.SMOG) || s.isOfType(PokemonType.FIRE)),
  [TrainerType.FISHERMAN]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.25)
    .setEncounterBgm(TrainerType.BACKPACKER)
    .setSpecialtyType(PokemonType.WATER)
    .setPartyTemplates(
      trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG,
      trainerPartyTemplates.ONE_AVG,
      trainerPartyTemplates.THREE_WEAK_SAME,
      trainerPartyTemplates.ONE_STRONG,
    )
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.TENTACOOL,
        SpeciesId.MAGIKARP,
        SpeciesId.GOLDEEN,
        SpeciesId.STARYU,
        SpeciesId.REMORAID,
        SpeciesId.SKRELP,
        SpeciesId.CLAUNCHER,
        SpeciesId.ARROKUDA,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.POLIWAG,
        SpeciesId.SHELLDER,
        SpeciesId.KRABBY,
        SpeciesId.HORSEA,
        SpeciesId.CARVANHA,
        SpeciesId.BARBOACH,
        SpeciesId.CORPHISH,
        SpeciesId.FINNEON,
        SpeciesId.TYMPOLE,
        SpeciesId.BASCULIN,
        SpeciesId.FRILLISH,
        SpeciesId.INKAY,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.CHINCHOU,
        SpeciesId.CORSOLA,
        SpeciesId.WAILMER,
        SpeciesId.CLAMPERL,
        SpeciesId.LUVDISC,
        SpeciesId.MANTYKE,
        SpeciesId.ALOMOMOLA,
        SpeciesId.TATSUGIRI,
        SpeciesId.VELUZA,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.LAPRAS, SpeciesId.FEEBAS, SpeciesId.RELICANTH, SpeciesId.DONDOZO],
    }),
  [TrainerType.GUITARIST]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.2)
    .setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpecialtyType(PokemonType.ELECTRIC)
    .setSpeciesFilter(s => s.isOfType(PokemonType.ELECTRIC)),
  [TrainerType.HARLEQUIN]: new TrainerConfig(++t)
    .setEncounterBgm(TrainerType.PSYCHIC)
    .setSpeciesFilter(s => tmSpecies[MoveId.TRICK_ROOM].indexOf(s.speciesId) > -1),
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
        SpeciesId.SANDSHREW,
        SpeciesId.DIGLETT,
        SpeciesId.GEODUDE,
        SpeciesId.MACHOP,
        SpeciesId.ARON,
        SpeciesId.ROGGENROLA,
        SpeciesId.DRILBUR,
        SpeciesId.NACLI,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.ZUBAT,
        SpeciesId.RHYHORN,
        SpeciesId.ONIX,
        SpeciesId.CUBONE,
        SpeciesId.WOOBAT,
        SpeciesId.SWINUB,
        SpeciesId.NOSEPASS,
        SpeciesId.HIPPOPOTAS,
        SpeciesId.DWEBBLE,
        SpeciesId.KLAWF,
        SpeciesId.TOEDSCOOL,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.TORKOAL,
        SpeciesId.TRAPINCH,
        SpeciesId.BARBOACH,
        SpeciesId.GOLETT,
        SpeciesId.ALOLA_DIGLETT,
        SpeciesId.ALOLA_GEODUDE,
        SpeciesId.GALAR_STUNFISK,
        SpeciesId.PALDEA_WOOPER,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.MAGBY, SpeciesId.LARVITAR],
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
      trainerPartyTemplates.THREE_WEAK,
      trainerPartyTemplates.TWO_WEAK_ONE_AVG,
      trainerPartyTemplates.TWO_AVG,
    )
    .setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === MoveId.SING)),
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
        SpeciesId.VULPIX,
        SpeciesId.GROWLITHE,
        SpeciesId.SNUBBULL,
        SpeciesId.POOCHYENA,
        SpeciesId.ELECTRIKE,
        SpeciesId.LILLIPUP,
        SpeciesId.YAMPER,
        SpeciesId.FIDOUGH,
      ],
      [TrainerPoolTier.UNCOMMON]: [SpeciesId.HOUNDOUR, SpeciesId.ROCKRUFF, SpeciesId.MASCHIFF],
      [TrainerPoolTier.RARE]: [SpeciesId.JOLTEON, SpeciesId.RIOLU],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.SLAKOTH],
      [TrainerPoolTier.ULTRA_RARE]: [SpeciesId.ENTEI, SpeciesId.SUICUNE, SpeciesId.RAIKOU],
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
            !!a
            && [
              AbilityId.DRIZZLE,
              AbilityId.SWIFT_SWIM,
              AbilityId.HYDRATION,
              AbilityId.RAIN_DISH,
              AbilityId.DRY_SKIN,
              AbilityId.WIND_POWER,
            ].includes(a),
        ) || s.getLevelMoves().some(plm => plm[1] === MoveId.RAIN_DANCE),
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
    .setSpeciesFilter(s => tmSpecies[MoveId.FLY].indexOf(s.speciesId) > -1),
  [TrainerType.POKEFAN]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.4)
    .setName("Pokéfan")
    .setHasGenders("Pokéfan Female")
    .setHasDouble("Pokéfan Family")
    .setEncounterBgm(TrainerType.POKEFAN)
    .setPartyTemplates(
      trainerPartyTemplates.FOUR_WEAK,
      trainerPartyTemplates.TWO_AVG,
      trainerPartyTemplates.ONE_STRONG,
      trainerPartyTemplates.FIVE_WEAK,
    )
    .setSpeciesFilter(s => tmSpecies[MoveId.HELPING_HAND].indexOf(s.speciesId) > -1),
  [TrainerType.PRESCHOOLER]: new TrainerConfig(++t)
    .setMoneyMultiplier(0.2)
    .setEncounterBgm(TrainerType.YOUNGSTER)
    .setHasGenders("Preschooler Female", "lass")
    .setHasDouble("Preschoolers")
    .setPartyTemplates(trainerPartyTemplates.THREE_WEAK, trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.CATERPIE,
        SpeciesId.PICHU,
        SpeciesId.SANDSHREW,
        SpeciesId.LEDYBA,
        SpeciesId.BUDEW,
        SpeciesId.BURMY,
        SpeciesId.WOOLOO,
        SpeciesId.PAWMI,
        SpeciesId.SMOLIV,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.EEVEE,
        SpeciesId.CLEFFA,
        SpeciesId.IGGLYBUFF,
        SpeciesId.SWINUB,
        SpeciesId.WOOPER,
        SpeciesId.DRIFLOON,
        SpeciesId.DEDENNE,
        SpeciesId.STUFFUL,
      ],
      [TrainerPoolTier.RARE]: [SpeciesId.RALTS, SpeciesId.RIOLU, SpeciesId.JOLTIK, SpeciesId.TANDEMAUS],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.DARUMAKA, SpeciesId.TINKATINK],
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
        SpeciesId.ABRA,
        SpeciesId.DROWZEE,
        SpeciesId.RALTS,
        SpeciesId.SPOINK,
        SpeciesId.GOTHITA,
        SpeciesId.SOLOSIS,
        SpeciesId.BLIPBUG,
        SpeciesId.ESPURR,
        SpeciesId.HATENNA,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.MIME_JR,
        SpeciesId.EXEGGCUTE,
        SpeciesId.MEDITITE,
        SpeciesId.NATU,
        SpeciesId.EXEGGCUTE,
        SpeciesId.WOOBAT,
        SpeciesId.INKAY,
        SpeciesId.ORANGURU,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.ELGYEM,
        SpeciesId.SIGILYPH,
        SpeciesId.BALTOY,
        SpeciesId.GIRAFARIG,
        SpeciesId.MEOWSTIC,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.BELDUM, SpeciesId.ESPEON, SpeciesId.STANTLER],
    }),
  [TrainerType.RANGER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.4)
    .setName("Pokémon Ranger")
    .setEncounterBgm(TrainerType.BACKPACKER)
    .setHasGenders("Pokémon Ranger Female")
    .setHasDouble("Pokémon Rangers")
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [
        SpeciesId.PICHU,
        SpeciesId.GROWLITHE,
        SpeciesId.PONYTA,
        SpeciesId.ZIGZAGOON,
        SpeciesId.SEEDOT,
        SpeciesId.BIDOOF,
        SpeciesId.RIOLU,
        SpeciesId.SEWADDLE,
        SpeciesId.SKIDDO,
        SpeciesId.SALANDIT,
        SpeciesId.YAMPER,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.AZURILL,
        SpeciesId.TAUROS,
        SpeciesId.MAREEP,
        SpeciesId.FARFETCHD,
        SpeciesId.TEDDIURSA,
        SpeciesId.SHROOMISH,
        SpeciesId.ELECTRIKE,
        SpeciesId.BUDEW,
        SpeciesId.BUIZEL,
        SpeciesId.MUDBRAY,
        SpeciesId.STUFFUL,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.EEVEE,
        SpeciesId.SCYTHER,
        SpeciesId.KANGASKHAN,
        SpeciesId.RALTS,
        SpeciesId.MUNCHLAX,
        SpeciesId.ZORUA,
        SpeciesId.PALDEA_TAUROS,
        SpeciesId.TINKATINK,
        SpeciesId.CYCLIZAR,
        SpeciesId.FLAMIGO,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.LARVESTA],
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
    .setPartyTemplates(trainerPartyTemplates.THREE_WEAK_SAME, trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG)
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
      [TrainerPoolTier.COMMON]: [
        SpeciesId.MAGNEMITE,
        SpeciesId.GRIMER,
        SpeciesId.DROWZEE,
        SpeciesId.VOLTORB,
        SpeciesId.KOFFING,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.BALTOY,
        SpeciesId.BRONZOR,
        SpeciesId.FERROSEED,
        SpeciesId.KLINK,
        SpeciesId.CHARJABUG,
        SpeciesId.BLIPBUG,
        SpeciesId.HELIOPTILE,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.ABRA,
        SpeciesId.DITTO,
        SpeciesId.PORYGON,
        SpeciesId.ELEKID,
        SpeciesId.SOLOSIS,
        SpeciesId.GALAR_WEEZING,
      ],
      [TrainerPoolTier.SUPER_RARE]: [
        SpeciesId.OMANYTE,
        SpeciesId.KABUTO,
        SpeciesId.AERODACTYL,
        SpeciesId.LILEEP,
        SpeciesId.ANORITH,
        SpeciesId.CRANIDOS,
        SpeciesId.SHIELDON,
        SpeciesId.TIRTOUGA,
        SpeciesId.ARCHEN,
        SpeciesId.ARCTOVISH,
        SpeciesId.ARCTOZOLT,
        SpeciesId.DRACOVISH,
        SpeciesId.DRACOZOLT,
      ],
      [TrainerPoolTier.ULTRA_RARE]: [SpeciesId.ROTOM, SpeciesId.MELTAN],
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
        SpeciesId.ODDISH,
        SpeciesId.EXEGGCUTE,
        SpeciesId.TEDDIURSA,
        SpeciesId.WURMPLE,
        SpeciesId.RALTS,
        SpeciesId.SHROOMISH,
        SpeciesId.FLETCHLING,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.VOLTORB,
        SpeciesId.WHISMUR,
        SpeciesId.MEDITITE,
        SpeciesId.MIME_JR,
        SpeciesId.NYMBLE,
      ],
      [TrainerPoolTier.RARE]: [SpeciesId.TANGELA, SpeciesId.EEVEE, SpeciesId.YANMA],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.TADBULB],
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
        SpeciesId.METAPOD,
        SpeciesId.LEDYBA,
        SpeciesId.CLEFFA,
        SpeciesId.MAREEP,
        SpeciesId.WOOPER,
        SpeciesId.TEDDIURSA,
        SpeciesId.REMORAID,
        SpeciesId.HOUNDOUR,
        SpeciesId.SILCOON,
        SpeciesId.PLUSLE,
        SpeciesId.VOLBEAT,
        SpeciesId.SPINDA,
        SpeciesId.BONSLY,
        SpeciesId.PETILIL,
        SpeciesId.SPRITZEE,
        SpeciesId.BOUNSWEET,
        SpeciesId.MILCERY,
        SpeciesId.PICHU,
      ]),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          SpeciesId.KAKUNA,
          SpeciesId.SPINARAK,
          SpeciesId.IGGLYBUFF,
          SpeciesId.MAREEP,
          SpeciesId.PALDEA_WOOPER,
          SpeciesId.PHANPY,
          SpeciesId.MANTYKE,
          SpeciesId.ELECTRIKE,
          SpeciesId.CASCOON,
          SpeciesId.MINUN,
          SpeciesId.ILLUMISE,
          SpeciesId.SPINDA,
          SpeciesId.MIME_JR,
          SpeciesId.COTTONEE,
          SpeciesId.SWIRLIX,
          SpeciesId.FOMANTIS,
          SpeciesId.FIDOUGH,
          SpeciesId.EEVEE,
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
        SpeciesId.CLEFFA,
        SpeciesId.CHATOT,
        SpeciesId.PANSAGE,
        SpeciesId.PANSEAR,
        SpeciesId.PANPOUR,
        SpeciesId.MINCCINO,
      ],
      [TrainerPoolTier.UNCOMMON]: [SpeciesId.TROPIUS, SpeciesId.PETILIL, SpeciesId.BOUNSWEET, SpeciesId.INDEEDEE],
      [TrainerPoolTier.RARE]: [SpeciesId.APPLIN, SpeciesId.SINISTEA, SpeciesId.POLTCHAGEIST],
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
      SpeciesId.CATERPIE,
      SpeciesId.WEEDLE,
      SpeciesId.RATTATA,
      SpeciesId.SENTRET,
      SpeciesId.POOCHYENA,
      SpeciesId.ZIGZAGOON,
      SpeciesId.WURMPLE,
      SpeciesId.BIDOOF,
      SpeciesId.PATRAT,
      SpeciesId.LILLIPUP,
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
        SpeciesId.WEEDLE,
        SpeciesId.RATTATA,
        SpeciesId.EKANS,
        SpeciesId.SANDSHREW,
        SpeciesId.ZUBAT,
        SpeciesId.ODDISH,
        SpeciesId.GEODUDE,
        SpeciesId.SLOWPOKE,
        SpeciesId.GRIMER,
        SpeciesId.KOFFING,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.MANKEY,
        SpeciesId.GROWLITHE,
        SpeciesId.MAGNEMITE,
        SpeciesId.ONIX,
        SpeciesId.VOLTORB,
        SpeciesId.EXEGGCUTE,
        SpeciesId.CUBONE,
        SpeciesId.LICKITUNG,
        SpeciesId.TAUROS,
        SpeciesId.MAGIKARP,
        SpeciesId.MURKROW,
        SpeciesId.ELEKID,
        SpeciesId.MAGBY,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.ABRA,
        SpeciesId.GASTLY,
        SpeciesId.SCYTHER,
        SpeciesId.PORYGON,
        SpeciesId.OMANYTE,
        SpeciesId.KABUTO,
        SpeciesId.ALOLA_RATTATA,
        SpeciesId.ALOLA_SANDSHREW,
        SpeciesId.ALOLA_MEOWTH,
        SpeciesId.ALOLA_GEODUDE,
        SpeciesId.ALOLA_GRIMER,
        SpeciesId.PALDEA_TAUROS,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.DRATINI, SpeciesId.LARVITAR],
    }),
  [TrainerType.ARCHER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("rocket_admin", "rocket", [SpeciesId.HOUNDOOM])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_rocket_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.ARIANA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("rocket_admin_female", "rocket", [SpeciesId.ARBOK])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_rocket_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.PROTON]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("rocket_admin", "rocket", [SpeciesId.CROBAT])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_rocket_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.PETREL]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("rocket_admin", "rocket", [SpeciesId.WEEZING])
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
        SpeciesId.DIGLETT,
        SpeciesId.GROWLITHE,
        SpeciesId.SLUGMA,
        SpeciesId.POOCHYENA,
        SpeciesId.ZIGZAGOON,
        SpeciesId.NUMEL,
        SpeciesId.TORKOAL,
        SpeciesId.BALTOY,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.RHYHORN,
        SpeciesId.PHANPY,
        SpeciesId.MAGBY,
        SpeciesId.ZANGOOSE,
        SpeciesId.SOLROCK,
        SpeciesId.HEATMOR,
        SpeciesId.ROLYCOLY,
        SpeciesId.CAPSAKID,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.TRAPINCH,
        SpeciesId.LILEEP,
        SpeciesId.ANORITH,
        SpeciesId.GOLETT,
        SpeciesId.TURTONATOR,
        SpeciesId.TOEDSCOOL,
        SpeciesId.HISUI_GROWLITHE,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.CHARCADET, SpeciesId.ARON],
    }),
  [TrainerType.TABITHA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("magma_admin", "magma", [SpeciesId.CAMERUPT])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aqua_magma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.COURTNEY]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("magma_admin_female", "magma", [SpeciesId.CAMERUPT])
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
        SpeciesId.QWILFISH,
        SpeciesId.REMORAID,
        SpeciesId.ZIGZAGOON,
        SpeciesId.LOTAD,
        SpeciesId.WINGULL,
        SpeciesId.CARVANHA,
        SpeciesId.WAILMER,
        SpeciesId.BARBOACH,
        SpeciesId.CORPHISH,
        SpeciesId.SPHEAL,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.TENTACOOL,
        SpeciesId.HORSEA,
        SpeciesId.CHINCHOU,
        SpeciesId.WOOPER,
        SpeciesId.AZURILL,
        SpeciesId.SEVIPER,
        SpeciesId.CLAMPERL,
        SpeciesId.WIMPOD,
        SpeciesId.CLOBBOPUS,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.MANTYKE,
        SpeciesId.TYMPOLE,
        SpeciesId.SKRELP,
        SpeciesId.ARROKUDA,
        SpeciesId.WIGLETT,
        SpeciesId.HISUI_QWILFISH,
        SpeciesId.PALDEA_WOOPER,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.BASCULEGION, SpeciesId.DONDOZO],
    }),
  [TrainerType.MATT]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("aqua_admin", "aqua", [SpeciesId.SHARPEDO])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aqua_magma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.SHELLY]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("aqua_admin_female", "aqua", [SpeciesId.SHARPEDO])
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
        SpeciesId.WURMPLE,
        SpeciesId.SHINX,
        SpeciesId.BURMY,
        SpeciesId.DRIFLOON,
        SpeciesId.GLAMEOW,
        SpeciesId.STUNKY,
        SpeciesId.BRONZOR,
        SpeciesId.CROAGUNK,
        SpeciesId.CARNIVINE,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.ZUBAT,
        SpeciesId.LICKITUNG,
        SpeciesId.RHYHORN,
        SpeciesId.TANGELA,
        SpeciesId.YANMA,
        SpeciesId.GLIGAR,
        SpeciesId.SWINUB,
        SpeciesId.SKORUPI,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.SNEASEL,
        SpeciesId.TEDDIURSA,
        SpeciesId.ELEKID,
        SpeciesId.MAGBY,
        SpeciesId.DUSKULL,
        SpeciesId.HISUI_GROWLITHE,
        SpeciesId.HISUI_QWILFISH,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.SPIRITOMB, SpeciesId.ROTOM, SpeciesId.HISUI_SNEASEL],
    }),
  [TrainerType.JUPITER]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("galactic_commander_female", "galactic", [SpeciesId.SKUNTANK])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_galactic_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.MARS]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("galactic_commander_female", "galactic", [SpeciesId.PURUGLY])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_galactic_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.SATURN]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("galactic_commander", "galactic", [SpeciesId.TOXICROAK])
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
        SpeciesId.PATRAT,
        SpeciesId.LILLIPUP,
        SpeciesId.PURRLOIN,
        SpeciesId.WOOBAT,
        SpeciesId.TYMPOLE,
        SpeciesId.SANDILE,
        SpeciesId.SCRAGGY,
        SpeciesId.TRUBBISH,
        SpeciesId.VANILLITE,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.TIMBURR,
        SpeciesId.VENIPEDE,
        SpeciesId.DARUMAKA,
        SpeciesId.FOONGUS,
        SpeciesId.FRILLISH,
        SpeciesId.JOLTIK,
        SpeciesId.KLINK,
        SpeciesId.CUBCHOO,
        SpeciesId.GOLETT,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.DRILBUR,
        SpeciesId.ZORUA,
        SpeciesId.MIENFOO,
        SpeciesId.PAWNIARD,
        SpeciesId.BOUFFALANT,
        SpeciesId.RUFFLET,
        SpeciesId.VULLABY,
        SpeciesId.DURANT,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.AXEW, SpeciesId.DRUDDIGON, SpeciesId.DEINO, SpeciesId.HISUI_ZORUA],
    }),
  [TrainerType.ZINZOLIN]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("plasma_sage", "plasma_zinzolin", [SpeciesId.CRYOGONAL])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_plasma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.COLRESS]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("plasma_boss", "plasma_colress", [SpeciesId.KLINKLANG])
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
        SpeciesId.HOUNDOUR,
        SpeciesId.GULPIN,
        SpeciesId.SKORUPI,
        SpeciesId.CROAGUNK,
        SpeciesId.PURRLOIN,
        SpeciesId.SCRAGGY,
        SpeciesId.FLETCHLING,
        SpeciesId.SCATTERBUG,
        SpeciesId.LITLEO,
        SpeciesId.ESPURR,
        SpeciesId.INKAY,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.POOCHYENA,
        SpeciesId.ELECTRIKE,
        SpeciesId.FOONGUS,
        SpeciesId.PANCHAM,
        SpeciesId.BINACLE,
        SpeciesId.SKRELP,
        SpeciesId.CLAUNCHER,
        SpeciesId.HELIOPTILE,
        SpeciesId.PHANTUMP,
        SpeciesId.PUMPKABOO,
      ],
      [TrainerPoolTier.RARE]: [SpeciesId.SNEASEL, SpeciesId.LITWICK, SpeciesId.PAWNIARD, SpeciesId.NOIBAT],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.SLIGGOO, SpeciesId.HISUI_SLIGGOO, SpeciesId.HISUI_AVALUGG],
    }),
  [TrainerType.BRYONY]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("flare_admin_female", "flare", [SpeciesId.LIEPARD])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_flare_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.XEROSIC]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("flare_admin", "flare", [SpeciesId.MALAMAR])
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
        SpeciesId.CORSOLA,
        SpeciesId.LILLIPUP,
        SpeciesId.PIKIPEK,
        SpeciesId.YUNGOOS,
        SpeciesId.ROCKRUFF,
        SpeciesId.MORELULL,
        SpeciesId.BOUNSWEET,
        SpeciesId.COMFEY,
        SpeciesId.KOMALA,
        SpeciesId.TOGEDEMARU,
        SpeciesId.ALOLA_RAICHU,
        SpeciesId.ALOLA_DIGLETT,
        SpeciesId.ALOLA_GEODUDE,
        SpeciesId.ALOLA_EXEGGUTOR,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.POLIWAG,
        SpeciesId.CRABRAWLER,
        SpeciesId.ORICORIO,
        SpeciesId.CUTIEFLY,
        SpeciesId.WISHIWASHI,
        SpeciesId.MUDBRAY,
        SpeciesId.STUFFUL,
        SpeciesId.ORANGURU,
        SpeciesId.PASSIMIAN,
        SpeciesId.PYUKUMUKU,
        SpeciesId.BRUXISH,
        SpeciesId.ALOLA_SANDSHREW,
        SpeciesId.ALOLA_VULPIX,
        SpeciesId.ALOLA_MAROWAK,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.MINIOR,
        SpeciesId.TURTONATOR,
        SpeciesId.MIMIKYU,
        SpeciesId.DRAMPA,
        SpeciesId.GALAR_CORSOLA,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.PORYGON, SpeciesId.JANGMO_O],
    }),
  [TrainerType.FABA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("aether_admin", "aether", [SpeciesId.HYPNO])
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
        SpeciesId.EKANS,
        SpeciesId.VENONAT,
        SpeciesId.DROWZEE,
        SpeciesId.KOFFING,
        SpeciesId.SPINARAK,
        SpeciesId.SCRAGGY,
        SpeciesId.TRUBBISH,
        SpeciesId.MAREANIE,
        SpeciesId.SALANDIT,
        SpeciesId.ALOLA_RATTATA,
        SpeciesId.ALOLA_MEOWTH,
        SpeciesId.ALOLA_GRIMER,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.ZUBAT,
        SpeciesId.GASTLY,
        SpeciesId.HOUNDOUR,
        SpeciesId.SABLEYE,
        SpeciesId.VENIPEDE,
        SpeciesId.SANDILE,
        SpeciesId.VULLABY,
        SpeciesId.PANCHAM,
        SpeciesId.FOMANTIS,
        SpeciesId.ALOLA_MAROWAK,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.PAWNIARD,
        SpeciesId.WISHIWASHI,
        SpeciesId.SANDYGAST,
        SpeciesId.MIMIKYU,
        SpeciesId.DHELMISE,
        SpeciesId.NYMBLE,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.GRUBBIN, SpeciesId.DEWPIDER],
    }),
  [TrainerType.PLUMERIA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("skull_admin", "skull", [SpeciesId.SALAZZLE])
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
        SpeciesId.STEELIX,
        SpeciesId.MAWILE,
        SpeciesId.FERROSEED,
        SpeciesId.KLINK,
        SpeciesId.SKWOVET,
        SpeciesId.ROOKIDEE,
        SpeciesId.ROLYCOLY,
        SpeciesId.CUFANT,
        SpeciesId.GALAR_MEOWTH,
        SpeciesId.GALAR_ZIGZAGOON,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.MAGNEMITE,
        SpeciesId.RIOLU,
        SpeciesId.DRILBUR,
        SpeciesId.APPLIN,
        SpeciesId.CRAMORANT,
        SpeciesId.ARROKUDA,
        SpeciesId.SINISTEA,
        SpeciesId.HATENNA,
        SpeciesId.FALINKS,
        SpeciesId.GALAR_PONYTA,
        SpeciesId.GALAR_YAMASK,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.SCIZOR,
        SpeciesId.BELDUM,
        SpeciesId.HONEDGE,
        SpeciesId.GALAR_FARFETCHD,
        SpeciesId.GALAR_MR_MIME,
        SpeciesId.GALAR_DARUMAKA,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.DURALUDON, SpeciesId.DREEPY],
    }),
  [TrainerType.OLEANA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("macro_admin", "macro_cosmos", [SpeciesId.GARBODOR])
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
        SpeciesId.DUNSPARCE,
        SpeciesId.HOUNDOUR,
        SpeciesId.AZURILL,
        SpeciesId.GULPIN,
        SpeciesId.FOONGUS,
        SpeciesId.FLETCHLING,
        SpeciesId.LITLEO,
        SpeciesId.FLABEBE,
        SpeciesId.CRABRAWLER,
        SpeciesId.NYMBLE,
        SpeciesId.PAWMI,
        SpeciesId.FIDOUGH,
        SpeciesId.SQUAWKABILLY,
        SpeciesId.MASCHIFF,
        SpeciesId.SHROODLE,
        SpeciesId.KLAWF,
        SpeciesId.WIGLETT,
        SpeciesId.PALDEA_WOOPER,
      ],
      [TrainerPoolTier.UNCOMMON]: [
        SpeciesId.KOFFING,
        SpeciesId.EEVEE,
        SpeciesId.GIRAFARIG,
        SpeciesId.RALTS,
        SpeciesId.TORKOAL,
        SpeciesId.SEVIPER,
        SpeciesId.SCRAGGY,
        SpeciesId.ZORUA,
        SpeciesId.MIMIKYU,
        SpeciesId.IMPIDIMP,
        SpeciesId.FALINKS,
        SpeciesId.CAPSAKID,
        SpeciesId.TINKATINK,
        SpeciesId.BOMBIRDIER,
        SpeciesId.CYCLIZAR,
        SpeciesId.FLAMIGO,
        SpeciesId.PALDEA_TAUROS,
      ],
      [TrainerPoolTier.RARE]: [
        SpeciesId.MANKEY,
        SpeciesId.PAWNIARD,
        SpeciesId.CHARCADET,
        SpeciesId.FLITTLE,
        SpeciesId.VAROOM,
        SpeciesId.ORTHWORM,
      ],
      [TrainerPoolTier.SUPER_RARE]: [SpeciesId.DONDOZO, SpeciesId.GIMMIGHOUL],
    }),
  [TrainerType.GIACOMO]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_dark", [SpeciesId.KINGAMBIT], PokemonType.DARK)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Segin Starmobile
        p.moveset = [
          new PokemonMove(MoveId.WICKED_TORQUE),
          new PokemonMove(MoveId.SPIN_OUT),
          new PokemonMove(MoveId.PARTING_SHOT),
          new PokemonMove(MoveId.HIGH_HORSEPOWER),
        ];
      }),
    ),
  [TrainerType.MELA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_fire", [SpeciesId.ARMAROUGE], PokemonType.FIRE)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 2; // Schedar Starmobile
        p.moveset = [
          new PokemonMove(MoveId.BLAZING_TORQUE),
          new PokemonMove(MoveId.SPIN_OUT),
          new PokemonMove(MoveId.FLAME_CHARGE),
          new PokemonMove(MoveId.HIGH_HORSEPOWER),
        ];
      }),
    ),
  [TrainerType.ATTICUS]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_poison", [SpeciesId.REVAVROOM], PokemonType.POISON)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 3; // Navi Starmobile
        p.moveset = [
          new PokemonMove(MoveId.NOXIOUS_TORQUE),
          new PokemonMove(MoveId.SPIN_OUT),
          new PokemonMove(MoveId.TOXIC_SPIKES),
          new PokemonMove(MoveId.HIGH_HORSEPOWER),
        ];
      }),
    ),
  [TrainerType.ORTEGA]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_fairy", [SpeciesId.DACHSBUN], PokemonType.FAIRY)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 4; // Ruchbah Starmobile
        p.moveset = [
          new PokemonMove(MoveId.MAGICAL_TORQUE),
          new PokemonMove(MoveId.SPIN_OUT),
          new PokemonMove(MoveId.MISTY_TERRAIN),
          new PokemonMove(MoveId.HIGH_HORSEPOWER),
        ];
      }),
    ),
  [TrainerType.ERI]: new TrainerConfig(++t)
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_fighting", [SpeciesId.ANNIHILAPE], PokemonType.FIGHTING)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 5; // Caph Starmobile
        p.moveset = [
          new PokemonMove(MoveId.COMBAT_TORQUE),
          new PokemonMove(MoveId.SPIN_OUT),
          new PokemonMove(MoveId.IRON_DEFENSE),
          new PokemonMove(MoveId.HIGH_HORSEPOWER),
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
    .initForEliteFour(signatureSpecies["LORELEI"], false, PokemonType.ICE, 2)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.DEWGONG], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Thick Fat
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.SLOWBRO, SpeciesId.GALAR_SLOWBRO], TrainerSlot.TRAINER, true, p => {
        // Tera Ice Slowbro/G-Slowbro
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.ICE_BEAM)) {
          // Check if Ice Beam is in the moveset, if not, replace the third move with Ice Beam.
          p.moveset[2] = new PokemonMove(MoveId.ICE_BEAM);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.JYNX]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.CLOYSTER, SpeciesId.ALOLA_SANDSLASH]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.LAPRAS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.BRUNO]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["BRUNO"], true, PokemonType.FIGHTING, 2)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.HITMONLEE, SpeciesId.HITMONCHAN, SpeciesId.HITMONTOP]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.STEELIX], TrainerSlot.TRAINER, true, p => {
        // Tera Fighting Steelix
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.BODY_PRESS)) {
          // Check if Body Press is in the moveset, if not, replace the third move with Body Press.
          p.moveset[2] = new PokemonMove(MoveId.BODY_PRESS);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.POLIWRATH]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.ANNIHILAPE]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.MACHAMP], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.AGATHA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["AGATHA"], false, PokemonType.GHOST, 2)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.MISMAGIUS]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.ARBOK, SpeciesId.WEEZING], TrainerSlot.TRAINER, true, p => {
        // Tera Ghost Arbok/Weezing
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.ALOLA_MAROWAK]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.CURSOLA]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GENGAR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.LANCE]: new TrainerConfig(++t)
    .setName("Lance")
    .initForEliteFour(signatureSpecies["LANCE"], true, PokemonType.DRAGON, 2)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.KINGDRA]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.GYARADOS, SpeciesId.AERODACTYL], TrainerSlot.TRAINER, true, p => {
        // Tera Dragon Gyarados/Aerodactyl
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.ALOLA_EXEGGUTOR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.SALAMENCE]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DRAGONITE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.WILL]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["WILL"], true, PokemonType.PSYCHIC, 2)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.JYNX]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.SLOWKING, SpeciesId.GALAR_SLOWKING])) // Tera Psychic Slowking/G-Slowking
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.EXEGGUTOR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.WYRDEER, SpeciesId.FARIGIRAF]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.XATU], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.KOGA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["KOGA"], true, PokemonType.POISON, 2)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.VENOMOTH], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Tinted Lens
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MUK, SpeciesId.WEEZING])) // Tera Poison Muk/Weezing
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.TENTACRUEL]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.SNEASLER, SpeciesId.OVERQWIL]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CROBAT], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.KAREN]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["KAREN"], false, PokemonType.DARK, 2)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.UMBREON]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.GENGAR], TrainerSlot.TRAINER, true, p => {
        // Tera Dark Gengar
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.DARK_PULSE)) {
          // Check if Dark Pulse is in the moveset, if not, replace the third move with Dark Pulse.
          p.moveset[2] = new PokemonMove(MoveId.DARK_PULSE);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.HONCHKROW]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.WEAVILE]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.HOUNDOOM], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.SIDNEY]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["SIDNEY"], true, PokemonType.DARK, 2)
    .setMixedBattleBgm("battle_hoenn_elite")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.MIGHTYENA], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Intimidate
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.OBSTAGOON])) // Tera Dark Obstagoon
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.SHIFTRY, SpeciesId.CACTURNE]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.SHARPEDO, SpeciesId.CRAWDAUNT]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.ABSOL], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.PHOEBE]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["PHOEBE"], false, PokemonType.GHOST, 2)
    .setMixedBattleBgm("battle_hoenn_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.SABLEYE]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.BANETTE])) // Tera Ghost Banette
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.DRIFBLIM, SpeciesId.MISMAGIUS]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.ORICORIO, SpeciesId.ALOLA_MAROWAK], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = p.species.speciesId === SpeciesId.ORICORIO ? 3 : 0; // Oricorio-Sensu
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DUSKNOIR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.GLACIA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["GLACIA"], false, PokemonType.ICE, 2)
    .setMixedBattleBgm("battle_hoenn_elite")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.ABOMASNOW], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Snow Warning
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.GLALIE])) // Tera Ice Glalie
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.FROSLASS]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.ALOLA_NINETALES]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.WALREIN], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.DRAKE]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["DRAKE"], true, PokemonType.DRAGON, 2)
    .setMixedBattleBgm("battle_hoenn_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.ALTARIA]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.DHELMISE], TrainerSlot.TRAINER, true, p => {
        // Tera Dragon Dhelmise
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.FLYGON]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.KINGDRA]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.SALAMENCE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.AARON]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["AARON"], true, PokemonType.BUG, 5)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.YANMEGA]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.HERACROSS]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.VESPIQUEN]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.SCIZOR, SpeciesId.KLEAVOR]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DRAPION], TrainerSlot.TRAINER, true, p => {
        // Tera Bug Drapion
        p.setBoss(true, 2);
        p.abilityIndex = 1; // Sniper
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.X_SCISSOR)) {
          // Check if X-Scissor is in the moveset, if not, replace the third move with X-Scissor.
          p.moveset[2] = new PokemonMove(MoveId.X_SCISSOR);
        }
      }),
    ),
  [TrainerType.BERTHA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["BERTHA"], false, PokemonType.GROUND, 2)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.WHISCASH]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.HIPPOWDON], TrainerSlot.TRAINER, true, p => {
        // Tera Ground Hippowdon
        p.abilityIndex = 0; // Sand Stream
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GLISCOR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.MAMOSWINE, SpeciesId.URSALUNA]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.RHYPERIOR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.abilityIndex = 1; // Solid Rock
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.FLINT]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["FLINT"], true, PokemonType.FIRE, 2)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.RAPIDASH]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.STEELIX, SpeciesId.LOPUNNY], TrainerSlot.TRAINER, true, p => {
        // Tera Fire Steelix/Lopunny
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.INFERNAPE]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.ARCANINE, SpeciesId.HISUI_ARCANINE]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.MAGMORTAR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.LUCIAN]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["LUCIAN"], true, PokemonType.PSYCHIC, 2)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.ESPEON, SpeciesId.ALAKAZAM]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.FARIGIRAF])) // Tera Psychic Farigiraf
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.BRONZONG]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.MR_RIME, SpeciesId.HISUI_BRAVIARY]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GALLADE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.abilityIndex = 1; // Sharpness
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.SHAUNTAL]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["SHAUNTAL"], false, PokemonType.GHOST, 2)
    .setMixedBattleBgm("battle_unova_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.COFAGRIGUS]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.GOLURK])) // Tera Ghost Golurk
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.JELLICENT]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.MISMAGIUS, SpeciesId.FROSLASS]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CHANDELURE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.MARSHAL]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["MARSHAL"], true, PokemonType.FIGHTING, 2)
    .setMixedBattleBgm("battle_unova_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.THROH, SpeciesId.SAWK]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MIENSHAO])) // Tera Fighting Mienshao
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.EMBOAR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.BRELOOM, SpeciesId.TOXICROAK]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CONKELDURR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.GRIMSLEY]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["GRIMSLEY"], true, PokemonType.DARK, 2)
    .setMixedBattleBgm("battle_unova_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.LIEPARD]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.KROOKODILE])) // Tera Dark Krookodile
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.SCRAFTY]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.ZOROARK, SpeciesId.HISUI_SAMUROTT]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.KINGAMBIT], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.CAITLIN]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["CAITLIN"], false, PokemonType.PSYCHIC, 2)
    .setMixedBattleBgm("battle_unova_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.MUSHARNA]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.REUNICLUS])) // Tera Psychic Reuniclus
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.GALLADE], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Sharpness
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.SIGILYPH, SpeciesId.HISUI_BRAVIARY]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GOTHITELLE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.MALVA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["MALVA"], false, PokemonType.FIRE, 2)
    .setMixedBattleBgm("battle_kalos_elite")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.PYROAR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.HOUNDOOM])) // Tera Fire Houndoom
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.TORKOAL], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Drought
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.CHANDELURE, SpeciesId.DELPHOX]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.TALONFLAME], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.SIEBOLD]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["SIEBOLD"], true, PokemonType.WATER, 2)
    .setMixedBattleBgm("battle_kalos_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.CLAWITZER]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.GYARADOS])) // Tera Water Gyarados
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.STARMIE]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.BLASTOISE, SpeciesId.DONDOZO]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.BARBARACLE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.abilityIndex = 1; // Tough Claws
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.WIKSTROM]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["WIKSTROM"], true, PokemonType.STEEL, 2)
    .setMixedBattleBgm("battle_kalos_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.KLEFKI]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.CERULEDGE], TrainerSlot.TRAINER, true, p => {
        // Tera Steel Ceruledge
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.IRON_HEAD)) {
          // Check if Iron Head is in the moveset, if not, replace the third move with Iron Head.
          p.moveset[2] = new PokemonMove(MoveId.IRON_HEAD);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.SCIZOR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.CORVIKNIGHT]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.AEGISLASH], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.DRASNA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["DRASNA"], false, PokemonType.DRAGON, 2)
    .setMixedBattleBgm("battle_kalos_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.DRAGALGE]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.GARCHOMP])) // Tera Dragon Garchomp
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.ALTARIA]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.DRUDDIGON]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.NOIVERN], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.HALA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["HALA"], true, PokemonType.FIGHTING, 2)
    .setMixedBattleBgm("battle_alola_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.HARIYAMA]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.INCINEROAR], TrainerSlot.TRAINER, true, p => {
        // Tera Fighting Incineroar
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.CROSS_CHOP)) {
          // Check if Cross Chop is in the moveset, if not, replace the third move with Cross Chop.
          p.moveset[2] = new PokemonMove(MoveId.CROSS_CHOP);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.BEWEAR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.POLIWRATH, SpeciesId.ANNIHILAPE]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CRABOMINABLE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.MOLAYNE]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["MOLAYNE"], true, PokemonType.STEEL, 2)
    .setMixedBattleBgm("battle_alola_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.KLEFKI]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.ALOLA_SANDSLASH])) // Tera Steel A-Sandslash
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.MAGNEZONE]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.METAGROSS, SpeciesId.KINGAMBIT]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.ALOLA_DUGTRIO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.OLIVIA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["OLIVIA"], false, PokemonType.ROCK, 2)
    .setMixedBattleBgm("battle_alola_elite")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.GIGALITH], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Sand Stream
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.PROBOPASS])) // Tera Rock Probopass
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.ALOLA_GOLEM]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.RELICANTH, SpeciesId.CARBINK]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.LYCANROC], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.formIndex = 1;
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.ACEROLA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["ACEROLA"], false, PokemonType.GHOST, 2)
    .setMixedBattleBgm("battle_alola_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.DRIFBLIM]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MIMIKYU])) // Tera Ghost Mimikyu
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.DHELMISE]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.FROSLASS]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.PALOSSAND], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.KAHILI]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["KAHILI"], false, PokemonType.FLYING, 2)
    .setMixedBattleBgm("battle_alola_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.HAWLUCHA]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.DECIDUEYE], TrainerSlot.TRAINER, true, p => {
        // Tera Flying Decidueye
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.BRAVE_BIRD)) {
          // Check if Brave Bird is in the moveset, if not, replace the third move with Brave Bird.
          p.moveset[2] = new PokemonMove(MoveId.BRAVE_BIRD);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.BRAVIARY, SpeciesId.MANDIBUZZ]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.ORICORIO]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.TOUCANNON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.MARNIE_ELITE]: new TrainerConfig(++t)
    .setName("Marnie")
    .initForEliteFour(signatureSpecies["MARNIE_ELITE"], false, PokemonType.DARK, 2)
    .setMixedBattleBgm("battle_galar_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.LIEPARD]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.TOXICROAK], TrainerSlot.TRAINER, true, p => {
        // Tera Dark Toxicroak
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.SUCKER_PUNCH)) {
          // Check if Sucker Punch is in the moveset, if not, replace the third move with Sucker Punch.
          p.moveset[2] = new PokemonMove(MoveId.SUCKER_PUNCH);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.SCRAFTY, SpeciesId.PANGORO]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.MORPEKO]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GRIMMSNARL], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.NESSA_ELITE]: new TrainerConfig(++t)
    .setName("Nessa")
    .initForEliteFour(signatureSpecies["NESSA_ELITE"], false, PokemonType.WATER, 2)
    .setMixedBattleBgm("battle_galar_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.GOLISOPOD]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.EISCUE], TrainerSlot.TRAINER, true, p => {
        // Tera Water Eiscue
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.LIQUIDATION)) {
          // Check if Liquidation is in the moveset, if not, replace the third move with Liquidation.
          p.moveset[2] = new PokemonMove(MoveId.LIQUIDATION);
        }
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.PELIPPER], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Drizzle
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.TOXAPEX]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DREDNAW], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.BEA_ELITE]: new TrainerConfig(++t)
    .setName("Bea")
    .initForEliteFour(signatureSpecies["BEA_ELITE"], false, PokemonType.FIGHTING, 2)
    .setMixedBattleBgm("battle_galar_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.HAWLUCHA]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.SIRFETCHD])) // Tera Fighting Sirfetch'd
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GRAPPLOCT, SpeciesId.FALINKS]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.HITMONTOP]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.MACHAMP], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.ALLISTER_ELITE]: new TrainerConfig(++t)
    .setName("Allister")
    .initForEliteFour(signatureSpecies["ALLISTER_ELITE"], true, PokemonType.GHOST, 2)
    .setMixedBattleBgm("battle_galar_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.DUSKNOIR]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.RUNERIGUS])) // Tera Ghost Runerigus
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.POLTEAGEIST, SpeciesId.SINISTCHA]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.CURSOLA]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GENGAR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.RAIHAN_ELITE]: new TrainerConfig(++t)
    .setName("Raihan")
    .initForEliteFour(signatureSpecies["RAIHAN_ELITE"], true, PokemonType.DRAGON, 2)
    .setMixedBattleBgm("battle_galar_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.FLYGON]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.TORKOAL], TrainerSlot.TRAINER, true, p => {
        // Tera Dragon Torkoal
        p.abilityIndex = 1; // Drought
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GOODRA]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.TURTONATOR]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.ARCHALUDON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.RIKA]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["RIKA"], false, PokemonType.GROUND, 5)
    .setMixedBattleBgm("battle_paldea_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.DUGTRIO]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.DONPHAN]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.SWAMPERT, SpeciesId.TORTERRA]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.CAMERUPT]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CLODSIRE], TrainerSlot.TRAINER, true, p => {
        // Tera Ground Clodsire
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.POPPY]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["POPPY"], false, PokemonType.STEEL, 5)
    .setMixedBattleBgm("battle_paldea_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.COPPERAJAH]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MAGNEZONE]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.BRONZONG, SpeciesId.CORVIKNIGHT], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = p.species.speciesId === SpeciesId.BRONZONG ? 0 : 1; // Levitate Bronzong, Unnerve Corviknight
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.STEELIX]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.TINKATON], TrainerSlot.TRAINER, true, p => {
        // Tera Steel Tinkaton
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.LARRY_ELITE]: new TrainerConfig(++t)
    .setName("Larry")
    .initForEliteFour(signatureSpecies["LARRY_ELITE"], true, PokemonType.FLYING, 5)
    .setMixedBattleBgm("battle_paldea_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.ALTARIA]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.BOMBIRDIER]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.TROPIUS]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.STARAPTOR]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.FLAMIGO], TrainerSlot.TRAINER, true, p => {
        // Tera Flying Flamigo
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.HASSEL]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["HASSEL"], true, PokemonType.DRAGON, 5)
    .setMixedBattleBgm("battle_paldea_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.NOIVERN]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.DRAGALGE]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.FLAPPLE, SpeciesId.APPLETUN, SpeciesId.HYDRAPPLE]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.HAXORUS]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.BAXCALIBUR], TrainerSlot.TRAINER, true, p => {
        // Tera Dragon Baxcalibur
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.CRISPIN]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["CRISPIN"], true, PokemonType.FIRE, 2)
    .setMixedBattleBgm("battle_bb_elite")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.ROTOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Heat Rotom
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.EXEGGUTOR], TrainerSlot.TRAINER, true, p => {
        // Tera Fire Exeggutor
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.TALONFLAME], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.SUNNY_DAY)) {
          // Check if Sunny Day is in the moveset, if not, replace the third move with Sunny Day.
          p.moveset[2] = new PokemonMove(MoveId.SUNNY_DAY);
        }
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.MAGMORTAR]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.BLAZIKEN], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.AMARYS]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["AMARYS"], false, PokemonType.STEEL, 2)
    .setMixedBattleBgm("battle_bb_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.SKARMORY]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.REUNICLUS], TrainerSlot.TRAINER, true, p => {
        // Tera Steel Reuniclus
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.FLASH_CANNON)) {
          // Check if Flash Cannon is in the moveset, if not, replace the third move with Flash Cannon.
          p.moveset[2] = new PokemonMove(MoveId.FLASH_CANNON);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.EMPOLEON]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.SCIZOR]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.METAGROSS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.LACEY]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["LACEY"], false, PokemonType.FAIRY, 5)
    .setMixedBattleBgm("battle_bb_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.WHIMSICOTT]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.PRIMARINA]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GRANBULL]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.ALCREMIE]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.EXCADRILL], TrainerSlot.TRAINER, true, p => {
        // Tera Fairy Excadrill
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    ),
  [TrainerType.DRAYTON]: new TrainerConfig(++t)
    .initForEliteFour(signatureSpecies["DRAYTON"], true, PokemonType.DRAGON, 2)
    .setMixedBattleBgm("battle_bb_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.DRAGONITE]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.SCEPTILE], TrainerSlot.TRAINER, true, p => {
        // Tera Dragon Sceptile
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.DUAL_CHOP)) {
          // Check if Dual Chop is in the moveset, if not, replace the third move with Dual Chop.
          p.moveset[2] = new PokemonMove(MoveId.DUAL_CHOP);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.HAXORUS]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.KINGDRA, SpeciesId.DRACOVISH]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.ARCHALUDON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),

  [TrainerType.BLUE]: new TrainerConfig((t = TrainerType.BLUE))
    .initForChampion(true)
    .setBattleBgm("battle_kanto_champion")
    .setMixedBattleBgm("battle_kanto_champion")
    .setHasDouble("blue_red_double")
    .setDoubleTrainerType(TrainerType.RED)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.ALAKAZAM]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [SpeciesId.ARCANINE, SpeciesId.EXEGGUTOR, SpeciesId.GYARADOS],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.teraType = p.species.type1;
        },
      ),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.RHYPERIOR, SpeciesId.ELECTIVIRE]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.MACHAMP]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.HO_OH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
        p.abilityIndex = 2; // Regenerator
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.PIDGEOT], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Pidgeot
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(1), // Tera Fire Arcanine, Tera Grass Exeggutor, Tera Water Gyarados
  [TrainerType.RED]: new TrainerConfig(++t)
    .initForChampion(true)
    .setBattleBgm("battle_johto_champion")
    .setMixedBattleBgm("battle_johto_champion")
    .setHasDouble("red_blue_double")
    .setDoubleTrainerType(TrainerType.BLUE)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.PIKACHU], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Partner Pikachu
        p.gender = Gender.MALE;
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.VOLT_TACKLE)) {
          // Check if Volt Tackle is in the moveset, if not, replace the first move with Volt Tackle.
          p.moveset[0] = new PokemonMove(MoveId.VOLT_TACKLE);
        }
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.MEGANIUM, SpeciesId.TYPHLOSION, SpeciesId.FERALIGATR]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.ESPEON, SpeciesId.UMBREON, SpeciesId.SYLVEON]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.SNORLAX]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.LUGIA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
        p.abilityIndex = 2; // Multiscale
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc(
        [SpeciesId.VENUSAUR, SpeciesId.CHARIZARD, SpeciesId.BLASTOISE],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.formIndex = 1; // Mega Venusaur, Mega Charizard X, or Mega Blastoise
          p.generateAndPopulateMoveset();
          p.generateName();
          p.gender = Gender.MALE;
          p.setBoss(true, 2);
        },
      ),
    )
    .setInstantTera(0), // Tera Electric Pikachu
  [TrainerType.LANCE_CHAMPION]: new TrainerConfig(++t)
    .setName("Lance")
    .initForChampion(true)
    .setBattleBgm("battle_johto_champion")
    .setMixedBattleBgm("battle_johto_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.GYARADOS, SpeciesId.KINGDRA]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.AERODACTYL]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.CHARIZARD]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc(
        [SpeciesId.TYRANITAR, SpeciesId.GARCHOMP, SpeciesId.HYDREIGON],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.abilityIndex = 2; // Unnerve Tyranitar, Rough Skin Garchomp, Levitate Hydreigon
          p.generateAndPopulateMoveset();
        },
      ),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.SALAMENCE], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Salamence
        p.generateAndPopulateMoveset();
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DRAGONITE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 2; // Multiscale
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
        p.teraType = PokemonType.DRAGON;
      }),
    )
    .setInstantTera(5), // Tera Dragon Dragonite
  [TrainerType.STEVEN]: new TrainerConfig(++t)
    .initForChampion(true)
    .setBattleBgm("battle_hoenn_champion_g5")
    .setMixedBattleBgm("battle_hoenn_champion_g6")
    .setHasDouble("steven_wallace_double")
    .setDoubleTrainerType(TrainerType.WALLACE)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.GIGALITH], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Sand Stream
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.SKARMORY, SpeciesId.CLAYDOL]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.AGGRON]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.GOLURK, SpeciesId.RUNERIGUS], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Iron Fist Golurk, Wandering Spirit Runerigus
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc(
        [SpeciesId.REGIROCK, SpeciesId.REGICE, SpeciesId.REGISTEEL],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ULTRA_BALL;
        },
      ),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.METAGROSS], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Metagross
        p.generateAndPopulateMoveset();
        p.generateName();
        p.setBoss(true, 2);
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
      getRandomPartyMemberFunc([SpeciesId.PELIPPER], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Drizzle
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.LUDICOLO], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Swift Swim
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.TENTACRUEL, SpeciesId.WALREIN], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = p.species.speciesId === SpeciesId.TENTACRUEL ? 2 : 0; // Rain Dish Tentacruel, Thick Fat Walrein
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.LATIAS, SpeciesId.LATIOS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.generateName();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.SWAMPERT], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Swampert
        p.generateAndPopulateMoveset();
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.MILOTIC], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(5), // Tera Water Milotic
  [TrainerType.CYNTHIA]: new TrainerConfig(++t)
    .initForChampion(false)
    .setBattleBgm("battle_sinnoh_champion")
    .setMixedBattleBgm("battle_sinnoh_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.SPIRITOMB]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.MILOTIC, SpeciesId.ROSERADE, SpeciesId.HISUI_ARCANINE]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.TOGEKISS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.teraType = p.species.type1;
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.LUCARIO]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.GIRATINA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GARCHOMP], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Garchomp
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.FEMALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(2), // Tera Fairy Togekiss
  [TrainerType.ALDER]: new TrainerConfig(++t)
    .initForChampion(true)
    .setHasDouble("alder_iris_double")
    .setDoubleTrainerType(TrainerType.IRIS)
    .setDoubleTitle("champion_double")
    .setBattleBgm("battle_champion_alder")
    .setMixedBattleBgm("battle_champion_alder")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.BOUFFALANT, SpeciesId.BRAVIARY]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [SpeciesId.HISUI_LILLIGANT, SpeciesId.HISUI_ZOROARK, SpeciesId.BASCULEGION],
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
      getRandomPartyMemberFunc([SpeciesId.CHANDELURE, SpeciesId.KROOKODILE, SpeciesId.REUNICLUS, SpeciesId.CONKELDURR]),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.KELDEO], TrainerSlot.TRAINER, true, p => {
        p.pokeball = PokeballType.ROGUE_BALL;
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.SECRET_SWORD)) {
          // Check if Secret Sword is in the moveset, if not, replace the third move with Secret Sword.
          p.moveset[2] = new PokemonMove(MoveId.SECRET_SWORD);
        }
        p.formIndex = 1; // Resolute Form
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.ZEKROM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.VOLCARONA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
        p.teraType = PokemonType.FIRE;
      }),
    )
    .setInstantTera(5), // Tera Fire Volcarona
  [TrainerType.IRIS]: new TrainerConfig(++t)
    .initForChampion(false)
    .setBattleBgm("battle_champion_iris")
    .setMixedBattleBgm("battle_champion_iris")
    .setHasDouble("iris_alder_double")
    .setDoubleTrainerType(TrainerType.ALDER)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.DRUDDIGON]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.ARCHEOPS], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 2; // Emergency Exit
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.LAPRAS], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // G-Max Lapras
        p.generateAndPopulateMoveset();
        p.generateName();
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.AGGRON, SpeciesId.HYDREIGON, SpeciesId.ARCHALUDON]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.RESHIRAM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.HAXORUS], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Mold Breaker
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(5), // Tera Dragon Haxorus
  [TrainerType.DIANTHA]: new TrainerConfig(++t)
    .initForChampion(false)
    .setMixedBattleBgm("battle_kalos_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.HAWLUCHA]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.TREVENANT, SpeciesId.GOURGEIST], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 2; // Harvest Trevenant, Insomnia Gourgeist
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.TYRANTRUM, SpeciesId.AURORUS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 2; // Rock Head Tyrantrum, Snow Warning Aurorus
        p.teraType = p.species.type2!;
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GOODRA]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.XERNEAS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GARDEVOIR], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Gardevoir
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.FEMALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(2), // Tera Dragon Tyrantrum / Ice Aurorus
  [TrainerType.KUKUI]: new TrainerConfig(++t)
    .initForChampion(true)
    .setMixedBattleBgm("battle_champion_kukui")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.LYCANROC], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 2; // Dusk Lycanroc
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.MAGNEZONE, SpeciesId.ALOLA_NINETALES], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = p.species.speciesId === SpeciesId.MAGNEZONE ? 1 : 2; // Sturdy Magnezone, Snow Warning Ninetales
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc(
        [SpeciesId.TORNADUS, SpeciesId.THUNDURUS, SpeciesId.LANDORUS],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.formIndex = 1; // Therian Formes
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ROGUE_BALL;
        },
      ),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.TAPU_LELE, SpeciesId.TAPU_FINI], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.abilityIndex = 0; // Psychic / Misty Surge
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.SNORLAX], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // G-Max Snorlax
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.INCINEROAR, SpeciesId.HISUI_DECIDUEYE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.teraType = p.species.type2!;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(5), // Tera Dark Incineroar / Fighting Hisuian Decidueye
  [TrainerType.HAU]: new TrainerConfig(++t)
    .initForChampion(true)
    .setMixedBattleBgm("battle_alola_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.ALOLA_RAICHU]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.NOIVERN], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Infiltrator
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.BLACEPHALON, SpeciesId.STAKATAKA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.TAPU_KOKO, SpeciesId.TAPU_BULU], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.abilityIndex = 0; // Electric / Grassy Surge
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.SOLGALEO], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DECIDUEYE, SpeciesId.PRIMARINA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.setBoss(true, 2);
        p.gender = p.species.speciesId === SpeciesId.PRIMARINA ? Gender.FEMALE : Gender.MALE;
        p.teraType = p.species.speciesId === SpeciesId.PRIMARINA ? PokemonType.WATER : PokemonType.GHOST;
      }),
    )
    .setInstantTera(5), // Tera Ghost Decidueye, Water Primarina
  [TrainerType.LEON]: new TrainerConfig(++t)
    .initForChampion(true)
    .setMixedBattleBgm("battle_galar_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.AEGISLASH]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [SpeciesId.RHYPERIOR, SpeciesId.SEISMITOAD, SpeciesId.MR_RIME],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.abilityIndex = 1; // Solid Rock Rhyperior, Poison Touch Seismitoad, Screen Cleaner Mr. Rime
          p.generateAndPopulateMoveset();
        },
      ),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.DRAGAPULT]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.RILLABOOM, SpeciesId.CINDERACE, SpeciesId.INTELEON]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.ZACIAN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CHARIZARD], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 3; // G-Max Charizard
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(3), // Tera Grass Rillaboom, Fire Cinderace, Water Inteleon
  [TrainerType.MUSTARD]: new TrainerConfig(++t)
    .initForChampion(true)
    .setMixedBattleBgm("battle_mustard")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.MIENSHAO], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.CORVIKNIGHT], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.GALAR_SLOWBRO, SpeciesId.GALAR_SLOWKING], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = p.species.speciesId === SpeciesId.GALAR_SLOWBRO ? 0 : 2; // Quick Draw Galar Slowbro, Regenerator Galar Slowking
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.VENUSAUR, SpeciesId.BLASTOISE], TrainerSlot.TRAINER, true, p => {
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.KOMMO_O], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.URSHIFU], TrainerSlot.TRAINER, true, p => {
        p.formIndex = randSeedIntRange(2, 3); // Random G-Max Urshifu form
        p.generateName();
        p.gender = Gender.MALE;
        p.pokeball = PokeballType.ULTRA_BALL;
        p.setBoss(true, 2);
        if (p.formIndex === 2) {
          p.moveset[0] = new PokemonMove(MoveId.WICKED_BLOW);
          p.moveset[1] = new PokemonMove(MoveId.BRICK_BREAK);
          p.moveset[2] = new PokemonMove(randSeedItem([MoveId.FIRE_PUNCH, MoveId.THUNDER_PUNCH, MoveId.ICE_PUNCH]));
          p.moveset[3] = new PokemonMove(MoveId.FOCUS_ENERGY);
        } else if (p.formIndex === 3) {
          p.moveset[0] = new PokemonMove(MoveId.SURGING_STRIKES);
          p.moveset[1] = new PokemonMove(MoveId.BRICK_BREAK);
          p.moveset[2] = new PokemonMove(randSeedItem([MoveId.FIRE_PUNCH, MoveId.THUNDER_PUNCH, MoveId.ICE_PUNCH]));
          p.moveset[3] = new PokemonMove(MoveId.FOCUS_ENERGY);
        }
      }),
    )
    .setInstantTera(4), // Tera Fighting Kommo-o
  [TrainerType.GEETA]: new TrainerConfig(++t)
    .initForChampion(false)
    .setMixedBattleBgm("battle_champion_geeta")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.GLIMMORA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.ESPATHRA], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Opportunist
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.BAXCALIBUR]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.CHESNAUGHT, SpeciesId.DELPHOX, SpeciesId.GRENINJA]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.MIRAIDON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.KINGAMBIT], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
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
      getRandomPartyMemberFunc([SpeciesId.LYCANROC], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 0; // Midday form
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.PAWMOT]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.DUDUNSPARCE], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Serene Grace
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.ARMAROUGE, SpeciesId.CERULEDGE]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.KORAIDON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc(
        [SpeciesId.MEOWSCARADA, SpeciesId.SKELEDIRGE, SpeciesId.QUAQUAVAL],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.gender = Gender.MALE;
          p.setBoss(true, 2);
          p.teraType = p.species.type2!;
        },
      ),
    )
    .setInstantTera(5), // Tera Dark Meowscarada, Ghost Skeledirge, Fighting Quaquaval
  [TrainerType.KIERAN]: new TrainerConfig(++t)
    .initForChampion(true)
    .setMixedBattleBgm("battle_champion_kieran")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.POLIWRATH, SpeciesId.POLITOED]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.INCINEROAR, SpeciesId.GRIMMSNARL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = p.species.speciesId === SpeciesId.INCINEROAR ? 2 : 0; // Intimidate Incineroar, Prankster Grimmsnarl
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.DRAGONITE], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 2; // Multiscale
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.URSALUNA, SpeciesId.BLOODMOON_URSALUNA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.TERAPAGOS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_STARSTORM)) {
          // Check if Tera Starstorm is in the moveset, if not, replace the first move with Tera Starstorm.
          p.moveset[0] = new PokemonMove(MoveId.TERA_STARSTORM);
        }
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.HYDRAPPLE], TrainerSlot.TRAINER, true, p => {
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
        p.teraType = PokemonType.FIGHTING;
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setInstantTera(5), // Tera Fighting Hydrapple

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
          SpeciesId.BULBASAUR,
          SpeciesId.CHARMANDER,
          SpeciesId.SQUIRTLE,
          SpeciesId.CHIKORITA,
          SpeciesId.CYNDAQUIL,
          SpeciesId.TOTODILE,
          SpeciesId.TREECKO,
          SpeciesId.TORCHIC,
          SpeciesId.MUDKIP,
          SpeciesId.TURTWIG,
          SpeciesId.CHIMCHAR,
          SpeciesId.PIPLUP,
          SpeciesId.SNIVY,
          SpeciesId.TEPIG,
          SpeciesId.OSHAWOTT,
          SpeciesId.CHESPIN,
          SpeciesId.FENNEKIN,
          SpeciesId.FROAKIE,
          SpeciesId.ROWLET,
          SpeciesId.LITTEN,
          SpeciesId.POPPLIO,
          SpeciesId.GROOKEY,
          SpeciesId.SCORBUNNY,
          SpeciesId.SOBBLE,
          SpeciesId.SPRIGATITO,
          SpeciesId.FUECOCO,
          SpeciesId.QUAXLY,
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
          SpeciesId.PIDGEY,
          SpeciesId.HOOTHOOT,
          SpeciesId.TAILLOW,
          SpeciesId.STARLY,
          SpeciesId.PIDOVE,
          SpeciesId.FLETCHLING,
          SpeciesId.PIKIPEK,
          SpeciesId.ROOKIDEE,
          SpeciesId.WATTREL,
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
          SpeciesId.IVYSAUR,
          SpeciesId.CHARMELEON,
          SpeciesId.WARTORTLE,
          SpeciesId.BAYLEEF,
          SpeciesId.QUILAVA,
          SpeciesId.CROCONAW,
          SpeciesId.GROVYLE,
          SpeciesId.COMBUSKEN,
          SpeciesId.MARSHTOMP,
          SpeciesId.GROTLE,
          SpeciesId.MONFERNO,
          SpeciesId.PRINPLUP,
          SpeciesId.SERVINE,
          SpeciesId.PIGNITE,
          SpeciesId.DEWOTT,
          SpeciesId.QUILLADIN,
          SpeciesId.BRAIXEN,
          SpeciesId.FROGADIER,
          SpeciesId.DARTRIX,
          SpeciesId.TORRACAT,
          SpeciesId.BRIONNE,
          SpeciesId.THWACKEY,
          SpeciesId.RABOOT,
          SpeciesId.DRIZZILE,
          SpeciesId.FLORAGATO,
          SpeciesId.CROCALOR,
          SpeciesId.QUAXWELL,
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
          SpeciesId.PIDGEOTTO,
          SpeciesId.HOOTHOOT,
          SpeciesId.TAILLOW,
          SpeciesId.STARAVIA,
          SpeciesId.TRANQUILL,
          SpeciesId.FLETCHINDER,
          SpeciesId.TRUMBEAK,
          SpeciesId.CORVISQUIRE,
          SpeciesId.WATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId)
          && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
          && species.baseTotal >= 450,
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
          SpeciesId.VENUSAUR,
          SpeciesId.CHARIZARD,
          SpeciesId.BLASTOISE,
          SpeciesId.MEGANIUM,
          SpeciesId.TYPHLOSION,
          SpeciesId.FERALIGATR,
          SpeciesId.SCEPTILE,
          SpeciesId.BLAZIKEN,
          SpeciesId.SWAMPERT,
          SpeciesId.TORTERRA,
          SpeciesId.INFERNAPE,
          SpeciesId.EMPOLEON,
          SpeciesId.SERPERIOR,
          SpeciesId.EMBOAR,
          SpeciesId.SAMUROTT,
          SpeciesId.CHESNAUGHT,
          SpeciesId.DELPHOX,
          SpeciesId.GRENINJA,
          SpeciesId.DECIDUEYE,
          SpeciesId.INCINEROAR,
          SpeciesId.PRIMARINA,
          SpeciesId.RILLABOOM,
          SpeciesId.CINDERACE,
          SpeciesId.INTELEON,
          SpeciesId.MEOWSCARADA,
          SpeciesId.SKELEDIRGE,
          SpeciesId.QUAQUAVAL,
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
          SpeciesId.PIDGEOT,
          SpeciesId.NOCTOWL,
          SpeciesId.SWELLOW,
          SpeciesId.STARAPTOR,
          SpeciesId.UNFEZANT,
          SpeciesId.TALONFLAME,
          SpeciesId.TOUCANNON,
          SpeciesId.CORVIKNIGHT,
          SpeciesId.KILOWATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId)
          && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
          && species.baseTotal >= 450,
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
          SpeciesId.VENUSAUR,
          SpeciesId.CHARIZARD,
          SpeciesId.BLASTOISE,
          SpeciesId.MEGANIUM,
          SpeciesId.TYPHLOSION,
          SpeciesId.FERALIGATR,
          SpeciesId.SCEPTILE,
          SpeciesId.BLAZIKEN,
          SpeciesId.SWAMPERT,
          SpeciesId.TORTERRA,
          SpeciesId.INFERNAPE,
          SpeciesId.EMPOLEON,
          SpeciesId.SERPERIOR,
          SpeciesId.EMBOAR,
          SpeciesId.SAMUROTT,
          SpeciesId.CHESNAUGHT,
          SpeciesId.DELPHOX,
          SpeciesId.GRENINJA,
          SpeciesId.DECIDUEYE,
          SpeciesId.INCINEROAR,
          SpeciesId.PRIMARINA,
          SpeciesId.RILLABOOM,
          SpeciesId.CINDERACE,
          SpeciesId.INTELEON,
          SpeciesId.MEOWSCARADA,
          SpeciesId.SKELEDIRGE,
          SpeciesId.QUAQUAVAL,
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
          SpeciesId.PIDGEOT,
          SpeciesId.NOCTOWL,
          SpeciesId.SWELLOW,
          SpeciesId.STARAPTOR,
          SpeciesId.UNFEZANT,
          SpeciesId.TALONFLAME,
          SpeciesId.TOUCANNON,
          SpeciesId.CORVIKNIGHT,
          SpeciesId.KILOWATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId)
          && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
          && species.baseTotal >= 450,
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
          SpeciesId.VENUSAUR,
          SpeciesId.CHARIZARD,
          SpeciesId.BLASTOISE,
          SpeciesId.MEGANIUM,
          SpeciesId.TYPHLOSION,
          SpeciesId.FERALIGATR,
          SpeciesId.SCEPTILE,
          SpeciesId.BLAZIKEN,
          SpeciesId.SWAMPERT,
          SpeciesId.TORTERRA,
          SpeciesId.INFERNAPE,
          SpeciesId.EMPOLEON,
          SpeciesId.SERPERIOR,
          SpeciesId.EMBOAR,
          SpeciesId.SAMUROTT,
          SpeciesId.CHESNAUGHT,
          SpeciesId.DELPHOX,
          SpeciesId.GRENINJA,
          SpeciesId.DECIDUEYE,
          SpeciesId.INCINEROAR,
          SpeciesId.PRIMARINA,
          SpeciesId.RILLABOOM,
          SpeciesId.CINDERACE,
          SpeciesId.INTELEON,
          SpeciesId.MEOWSCARADA,
          SpeciesId.SKELEDIRGE,
          SpeciesId.QUAQUAVAL,
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
          SpeciesId.PIDGEOT,
          SpeciesId.NOCTOWL,
          SpeciesId.SWELLOW,
          SpeciesId.STARAPTOR,
          SpeciesId.UNFEZANT,
          SpeciesId.TALONFLAME,
          SpeciesId.TOUCANNON,
          SpeciesId.CORVIKNIGHT,
          SpeciesId.KILOWATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId)
          && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
          && species.baseTotal >= 450,
      ),
    )
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.RAYQUAZA], TrainerSlot.TRAINER, true, p => {
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
          SpeciesId.VENUSAUR,
          SpeciesId.CHARIZARD,
          SpeciesId.BLASTOISE,
          SpeciesId.MEGANIUM,
          SpeciesId.TYPHLOSION,
          SpeciesId.FERALIGATR,
          SpeciesId.SCEPTILE,
          SpeciesId.BLAZIKEN,
          SpeciesId.SWAMPERT,
          SpeciesId.TORTERRA,
          SpeciesId.INFERNAPE,
          SpeciesId.EMPOLEON,
          SpeciesId.SERPERIOR,
          SpeciesId.EMBOAR,
          SpeciesId.SAMUROTT,
          SpeciesId.CHESNAUGHT,
          SpeciesId.DELPHOX,
          SpeciesId.GRENINJA,
          SpeciesId.DECIDUEYE,
          SpeciesId.INCINEROAR,
          SpeciesId.PRIMARINA,
          SpeciesId.RILLABOOM,
          SpeciesId.CINDERACE,
          SpeciesId.INTELEON,
          SpeciesId.MEOWSCARADA,
          SpeciesId.SKELEDIRGE,
          SpeciesId.QUAQUAVAL,
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
          SpeciesId.PIDGEOT,
          SpeciesId.NOCTOWL,
          SpeciesId.SWELLOW,
          SpeciesId.STARAPTOR,
          SpeciesId.UNFEZANT,
          SpeciesId.TALONFLAME,
          SpeciesId.TOUCANNON,
          SpeciesId.CORVIKNIGHT,
          SpeciesId.KILOWATTREL,
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
          !pokemonEvolutions.hasOwnProperty(species.speciesId)
          && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
          && species.baseTotal >= 450,
      ),
    )
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.RAYQUAZA], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.PERSIAN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.DUGTRIO, SpeciesId.ALOLA_DUGTRIO]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.HONCHKROW]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.NIDOQUEEN, SpeciesId.NIDOKING]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.KANGASKHAN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Kangaskhan
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.RHYPERIOR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.abilityIndex = 1; // Solid Rock
        p.setBoss(true, 2);
      }),
    ),
  [TrainerType.ROCKET_BOSS_GIOVANNI_2]: new TrainerConfig(++t)
    .setName("Giovanni")
    .initForEvilTeamLeader("Rocket Boss", [], true)
    .setMixedBattleBgm("battle_rocket_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.RHYPERIOR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Solid Rock
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.NIDOKING, SpeciesId.NIDOQUEEN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 2; // Sheer Force
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.HONCHKROW], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.SUCKER_PUNCH)) {
          // Check if Sucker Punch is in the moveset, if not, replace the third move with Sucker Punch.
          p.moveset[2] = new PokemonMove(MoveId.SUCKER_PUNCH);
        }
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.KANGASKHAN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Kangaskhan
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc(
        [SpeciesId.ARTICUNO, SpeciesId.ZAPDOS, SpeciesId.MOLTRES],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ULTRA_BALL;
          p.abilityIndex = 2; // Snow Cloak Articuno, Static Zapdos, Flame Body Moltres
          p.setBoss(true, 2);
        },
      ),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.MEWTWO], TrainerSlot.TRAINER, true, p => {
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
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.TORKOAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Drought
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.SOLROCK]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.WEEZING, SpeciesId.GALAR_WEEZING]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.SCOVILLAIN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 0; // Chlorophyll
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.DONPHAN]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CAMERUPT], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.TYPHLOSION, SpeciesId.SOLROCK], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.NINETALES, SpeciesId.TORKOAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === SpeciesId.NINETALES) {
          p.abilityIndex = 2; // Drought
        } else if (p.species.speciesId === SpeciesId.TORKOAL) {
          p.abilityIndex = 1; // Drought
        }
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.SCOVILLAIN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 0; // Chlorophyll
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.GREAT_TUSK], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.CAMERUPT], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.GROUDON], TrainerSlot.TRAINER, true, p => {
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
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.PELIPPER], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Drizzle
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.WAILORD]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MUK, SpeciesId.ALOLA_MUK]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.LUDICOLO]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.QWILFISH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Swift Swim
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.SHARPEDO], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.LUDICOLO, SpeciesId.EMPOLEON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.POLITOED, SpeciesId.PELIPPER], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === SpeciesId.POLITOED) {
          p.abilityIndex = 2; // Drizzle
        } else if (p.species.speciesId === SpeciesId.PELIPPER) {
          p.abilityIndex = 1; // Drizzle
        }
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.DHELMISE]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.OVERQWIL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Swift Swim
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.SHARPEDO], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.KYOGRE], TrainerSlot.TRAINER, true, p => {
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
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.GYARADOS]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.CROBAT, SpeciesId.HONCHKROW]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MAGNEZONE]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.UXIE, SpeciesId.MESPRIT, SpeciesId.AZELF]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.HOUNDOOM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.WEAVILE], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.CROBAT, SpeciesId.HONCHKROW], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.MAGNEZONE]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.UXIE, SpeciesId.MESPRIT, SpeciesId.AZELF], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.HOUNDOOM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Houndoom
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.WEAVILE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DIALGA, SpeciesId.PALKIA], TrainerSlot.TRAINER, true, p => {
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
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.COFAGRIGUS]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.SEISMITOAD]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.GALVANTULA, SpeciesId.EELEKTROSS]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.DRAPION, SpeciesId.TOXICROAK]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.KINGAMBIT]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.HYDREIGON], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.RUNERIGUS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.JELLICENT, SpeciesId.BASCULEGION], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.formIndex = 0;
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.KINGAMBIT]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.VOLCARONA, SpeciesId.IRON_MOTH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.HYDREIGON, SpeciesId.IRON_JUGULIS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        if (p.species.speciesId === SpeciesId.HYDREIGON) {
          p.gender = Gender.MALE;
        } else if (p.species.speciesId === SpeciesId.IRON_JUGULIS) {
          p.gender = Gender.GENDERLESS;
        }
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.KYUREM], TrainerSlot.TRAINER, true, p => {
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
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.MIENSHAO]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.HONCHKROW, SpeciesId.TALONFLAME]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.PYROAR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.MALAMAR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.AEGISLASH, SpeciesId.HISUI_GOODRA]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GYARADOS], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.PYROAR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.MIENSHAO]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.AEGISLASH, SpeciesId.HISUI_GOODRA]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.VOLCANION], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.GYARADOS], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.ZYGARDE], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.CLEFABLE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.LILLIGANT]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MILOTIC]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GALAR_SLOWBRO, SpeciesId.GALAR_SLOWKING]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.BEWEAR, SpeciesId.LOPUNNY]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.NIHILEGO], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.CLEFABLE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.MILOTIC, SpeciesId.LILLIGANT]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.SILVALLY], TrainerSlot.TRAINER, true, p => {
        p.formIndex = randSeedInt(18); // Random Silvally Form
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.MULTI_ATTACK)) {
          // Check if Multi Attack is in the moveset, if not, replace the first move with Multi Attack.
          p.moveset[0] = new PokemonMove(MoveId.MULTI_ATTACK);
        }
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.PHEROMOSA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.NIHILEGO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.NECROZMA], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.YANMEGA, SpeciesId.LOKIX], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === SpeciesId.YANMEGA) {
          p.abilityIndex = 1; // Tinted Lens
        } else if (p.species.speciesId === SpeciesId.LOKIX) {
          p.abilityIndex = 2; // Tinted Lens
        }
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.HERACROSS]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.SCIZOR, SpeciesId.KLEAVOR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === SpeciesId.SCIZOR) {
          p.abilityIndex = 1; // Technician
        } else if (p.species.speciesId === SpeciesId.KLEAVOR) {
          p.abilityIndex = 2; // Sharpness
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GALVANTULA, SpeciesId.VIKAVOLT]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.PINSIR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // Mega Pinsir
        p.pokeball = PokeballType.ULTRA_BALL;
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GOLISOPOD], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.FIRST_IMPRESSION)) {
          // Check if First Impression is in the moveset, if not, replace the third move with First Impression.
          p.moveset[2] = new PokemonMove(MoveId.FIRST_IMPRESSION);
          p.gender = Gender.MALE;
        }
      }),
    ),
  [TrainerType.GUZMA_2]: new TrainerConfig(++t)
    .setName("Guzma")
    .initForEvilTeamLeader("Skull Boss", [], true)
    .setMixedBattleBgm("battle_skull_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.GOLISOPOD], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.FIRST_IMPRESSION)) {
          // Check if First Impression is in the moveset, if not, replace the third move with First Impression.
          p.moveset[2] = new PokemonMove(MoveId.FIRST_IMPRESSION);
          p.abilityIndex = 2; // Anticipation
          p.gender = Gender.MALE;
        }
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.BUZZWOLE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.CRAWDAUNT, SpeciesId.HISUI_SAMUROTT], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 2; // Sharpness Hisuian Samurott, Adaptability Crawdaunt
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.XURKITREE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.GENESECT], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
        p.formIndex = randSeedInt(4, 1); // Shock, Burn, Chill, or Douse Drive
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TECHNO_BLAST)) {
          // Check if Techno Blast is in the moveset, if not, replace the third move with Techno Blast.
          p.moveset[2] = new PokemonMove(MoveId.TECHNO_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.PINSIR], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.ARCHALUDON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.ESCAVALIER, SpeciesId.FERROTHORN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.SIRFETCHD, SpeciesId.MR_RIME], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.CORVIKNIGHT], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.KLINKLANG, SpeciesId.PERRSERKER], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.COPPERAJAH], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.ARCHALUDON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.CORVIKNIGHT]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.DRACOZOLT, SpeciesId.DRACOVISH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.abilityIndex = 1; // Strong Jaw Dracovish, Hustle Dracozolt
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.MELMETAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.COPPERAJAH], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // G-Max Copperajah
        p.generateName();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.gender = Gender.FEMALE;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc(
        [SpeciesId.GALAR_ARTICUNO, SpeciesId.GALAR_ZAPDOS, SpeciesId.GALAR_MOLTRES],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.setBoss(true, 2);
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ULTRA_BALL;
        },
      ),
    ),
  [TrainerType.PENNY]: new TrainerConfig(++t)
    .setName("Cassiopeia")
    .initForEvilTeamLeader("Star Boss", [])
    .setMixedBattleBgm("battle_star_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.ESPEON]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.UMBREON]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.LEAFEON, SpeciesId.GLACEON]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.VAPOREON, SpeciesId.FLAREON, SpeciesId.JOLTEON]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.SYLVEON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.abilityIndex = 2; // Pixilate
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.HYPER_VOICE)) {
          // Check if Hyper Voice is in the moveset, if not, replace the second move with Hyper Voice.
          p.moveset[1] = new PokemonMove(MoveId.HYPER_VOICE);
          p.gender = Gender.FEMALE;
        }
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.EEVEE], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.SYLVEON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.abilityIndex = 2; // Pixilate
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.HYPER_VOICE)) {
          // Check if Hyper Voice is in the moveset, if not, replace the second move with Hyper Voice.
          p.moveset[1] = new PokemonMove(MoveId.HYPER_VOICE);
          p.gender = Gender.FEMALE;
        }
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.ROTOM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = randSeedInt(5, 1); // Heat, Wash, Frost, Fan, or Mow
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.ESPEON, SpeciesId.UMBREON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = p.species.speciesId === SpeciesId.UMBREON ? 0 : 2; // Synchronize Umbreon, Magic Bounce Espeon
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc(
        [SpeciesId.WALKING_WAKE, SpeciesId.GOUGING_FIRE, SpeciesId.RAGING_BOLT],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ROGUE_BALL;
        },
      ),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = randSeedInt(5, 1); // Random Starmobile form
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
        p.setBoss(true, 2);
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.EEVEE], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.CLAYDOL], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 3);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.VENUSAUR, SpeciesId.COALOSSAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        if (p.species.speciesId === SpeciesId.VENUSAUR) {
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
      getRandomPartyMemberFunc([SpeciesId.AGGRON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // Mega
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.TORKOAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Drought
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.GREAT_TUSK], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.HEATRAN], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.BLISSEY], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 3);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.SNORLAX, SpeciesId.LAPRAS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        p.formIndex = 1; // Gmax
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.AUDINO], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // Mega
        p.generateName();
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GOODRA], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.IRON_HANDS], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CRESSELIA, SpeciesId.ENAMORUS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === SpeciesId.ENAMORUS) {
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
      getRandomPartyMemberFunc([SpeciesId.ARCANINE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 3);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.CINDERACE, SpeciesId.INTELEON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        p.formIndex = 1; // Gmax
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.AERODACTYL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // Mega
        p.generateName();
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.DRAGAPULT], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.IRON_BUNDLE], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.REGIELEKI], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.ALAKAZAM], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 1;
        p.pokeball = PokeballType.ULTRA_BALL;
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.GENGAR, SpeciesId.HATTERENE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        p.formIndex = p.species.speciesId === SpeciesId.GENGAR ? 2 : 1; // Gmax
        p.generateName();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.FLUTTER_MANE], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.HYDREIGON], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.MAGNEZONE], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.LATIOS, SpeciesId.LATIAS], TrainerSlot.TRAINER, true, p => {
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
      getRandomPartyMemberFunc([SpeciesId.LUCARIO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 1;
        p.pokeball = PokeballType.ULTRA_BALL;
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.RILLABOOM, SpeciesId.CENTISKORCH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        p.formIndex = 1; // Gmax
        p.generateName();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.TYRANITAR], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.ROARING_MOON], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.URSALUNA], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.REGIGIGAS, SpeciesId.LANDORUS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === SpeciesId.LANDORUS) {
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
