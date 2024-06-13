import BattleScene, {startingWave} from "../battle-scene";
import {ModifierTypeFunc, modifierTypes} from "../modifier/modifier-type";
import {EnemyPokemon} from "../field/pokemon";
import * as Utils from "../utils";
import {PokeballType} from "./pokeball";
import {pokemonEvolutions, pokemonPrevolutions} from "./pokemon-evolutions";
import PokemonSpecies, {getPokemonSpecies, PokemonSpeciesFilter} from "./pokemon-species";
import {tmSpecies} from "./tms";
import {Type} from "./type";
import {doubleBattleDialogue} from "./dialogue";
import {PersistentModifier} from "../modifier/modifier";
import {TrainerVariant} from "../field/trainer";
import {Moves, PartyMemberStrength, Species, TrainerType} from "#enums";
import {getIsInitialized, initI18n} from "#app/plugins/i18n";
import i18next from "i18next";

export enum TrainerPoolTier {
  COMMON,
  UNCOMMON,
  RARE,
  SUPER_RARE,
  ULTRA_RARE
}

export interface TrainerTierPools {
  [key: integer]: Species[]
}

export enum TrainerSlot {
  NONE,
  TRAINER,
  TRAINER_PARTNER
}

export class TrainerPartyTemplate {
  public size: integer;
  public strength: PartyMemberStrength;
  public sameSpecies: boolean;
  public balanced: boolean;

  constructor(size: integer, strength: PartyMemberStrength, sameSpecies?: boolean, balanced?: boolean) {
    this.size = size;
    this.strength = strength;
    this.sameSpecies = !!sameSpecies;
    this.balanced = !!balanced;
  }

  getStrength(index: integer): PartyMemberStrength {
    return this.strength;
  }

  isSameSpecies(index: integer): boolean {
    return this.sameSpecies;
  }

  isBalanced(index: integer): boolean {
    return this.balanced;
  }
}

export class TrainerPartyCompoundTemplate extends TrainerPartyTemplate {
  public templates: TrainerPartyTemplate[];

  constructor(...templates: TrainerPartyTemplate[]) {
    super(templates.reduce((total: integer, template: TrainerPartyTemplate) => {
      total += template.size;
      return total;
    }, 0), PartyMemberStrength.AVERAGE);
    this.templates = templates;
  }

  getStrength(index: integer): PartyMemberStrength {
    let t = 0;
    for (const template of this.templates) {
      if (t + template.size > index) {
        return template.getStrength(index - t);
      }
      t += template.size;
    }

    return super.getStrength(index);
  }

  isSameSpecies(index: integer): boolean {
    let t = 0;
    for (const template of this.templates) {
      if (t + template.size > index) {
        return template.isSameSpecies(index - t);
      }
      t += template.size;
    }

    return super.isSameSpecies(index);
  }

  isBalanced(index: integer): boolean {
    let t = 0;
    for (const template of this.templates) {
      if (t + template.size > index) {
        return template.isBalanced(index - t);
      }
      t += template.size;
    }

    return super.isBalanced(index);
  }
}

export const trainerPartyTemplates = {
  ONE_WEAK_ONE_STRONG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, PartyMemberStrength.WEAK), new TrainerPartyTemplate(1, PartyMemberStrength.STRONG)),
  ONE_AVG: new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE),
  ONE_AVG_ONE_STRONG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, PartyMemberStrength.STRONG)),
  ONE_STRONG: new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
  ONE_STRONGER: new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER),
  TWO_WEAKER: new TrainerPartyTemplate(2, PartyMemberStrength.WEAKER),
  TWO_WEAK: new TrainerPartyTemplate(2, PartyMemberStrength.WEAK),
  TWO_WEAK_ONE_AVG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, PartyMemberStrength.WEAK), new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE)),
  TWO_WEAK_SAME_ONE_AVG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, PartyMemberStrength.WEAK, true), new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE)),
  TWO_WEAK_SAME_TWO_WEAK_SAME: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, PartyMemberStrength.WEAK, true), new TrainerPartyTemplate(2, PartyMemberStrength.WEAK, true)),
  TWO_WEAK_ONE_STRONG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, PartyMemberStrength.WEAK), new TrainerPartyTemplate(1, PartyMemberStrength.STRONG)),
  TWO_AVG: new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE),
  TWO_AVG_ONE_STRONG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, PartyMemberStrength.STRONG)),
  TWO_AVG_SAME_ONE_AVG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE, true), new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE)),
  TWO_AVG_SAME_ONE_STRONG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE, true), new TrainerPartyTemplate(1, PartyMemberStrength.STRONG)),
  TWO_AVG_SAME_TWO_AVG_SAME: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE, true), new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE, true)),
  TWO_STRONG: new TrainerPartyTemplate(2, PartyMemberStrength.STRONG),
  THREE_WEAK: new TrainerPartyTemplate(3, PartyMemberStrength.WEAK),
  THREE_WEAK_SAME: new TrainerPartyTemplate(3, PartyMemberStrength.WEAK, true),
  THREE_AVG: new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE),
  THREE_AVG_SAME: new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE, true),
  THREE_WEAK_BALANCED: new TrainerPartyTemplate(3, PartyMemberStrength.WEAK, false, true),
  FOUR_WEAKER: new TrainerPartyTemplate(4, PartyMemberStrength.WEAKER),
  FOUR_WEAKER_SAME: new TrainerPartyTemplate(4, PartyMemberStrength.WEAKER, true),
  FOUR_WEAK: new TrainerPartyTemplate(4, PartyMemberStrength.WEAK),
  FOUR_WEAK_SAME: new TrainerPartyTemplate(4, PartyMemberStrength.WEAK, true),
  FOUR_WEAK_BALANCED: new TrainerPartyTemplate(4, PartyMemberStrength.WEAK, false, true),
  FIVE_WEAKER: new TrainerPartyTemplate(5, PartyMemberStrength.WEAKER),
  FIVE_WEAK: new TrainerPartyTemplate(5, PartyMemberStrength.WEAK),
  FIVE_WEAK_BALANCED: new TrainerPartyTemplate(5, PartyMemberStrength.WEAK, false, true),
  SIX_WEAKER: new TrainerPartyTemplate(6, PartyMemberStrength.WEAKER),
  SIX_WEAKER_SAME: new TrainerPartyTemplate(6, PartyMemberStrength.WEAKER, true),
  SIX_WEAK_SAME: new TrainerPartyTemplate(6, PartyMemberStrength.WEAKER, true),
  SIX_WEAK_BALANCED: new TrainerPartyTemplate(6, PartyMemberStrength.WEAK, false, true),

  GYM_LEADER_1: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, PartyMemberStrength.STRONG)),
  GYM_LEADER_2: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, PartyMemberStrength.STRONG), new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER)),
  GYM_LEADER_3: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, PartyMemberStrength.STRONG), new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER)),
  GYM_LEADER_4: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, PartyMemberStrength.STRONG), new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER)),
  GYM_LEADER_5: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(2, PartyMemberStrength.STRONG), new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER)),

  ELITE_FOUR: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(3, PartyMemberStrength.STRONG), new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER)),

  CHAMPION: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER), new TrainerPartyTemplate(5, PartyMemberStrength.STRONG, false, true)),

  RIVAL: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, PartyMemberStrength.STRONG), new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE)),
  RIVAL_2: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, PartyMemberStrength.STRONG), new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, PartyMemberStrength.WEAK, false, true)),
  RIVAL_3: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, PartyMemberStrength.STRONG), new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE, false, true), new TrainerPartyTemplate(1, PartyMemberStrength.WEAK, false, true)),
  RIVAL_4: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, PartyMemberStrength.STRONG), new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE, false, true), new TrainerPartyTemplate(1, PartyMemberStrength.WEAK, false, true)),
  RIVAL_5: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, PartyMemberStrength.STRONG), new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE, false, true), new TrainerPartyTemplate(1, PartyMemberStrength.STRONG)),
  RIVAL_6: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, PartyMemberStrength.STRONG), new TrainerPartyTemplate(1, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE, false, true), new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER))
};

type PartyTemplateFunc = (scene: BattleScene) => TrainerPartyTemplate;
type PartyMemberFunc = (scene: BattleScene, level: integer, strength: PartyMemberStrength) => EnemyPokemon;
type GenModifiersFunc = (party: EnemyPokemon[]) => PersistentModifier[];

export interface PartyMemberFuncs {
  [key: integer]: PartyMemberFunc
}

export class TrainerConfig {
  public trainerType: TrainerType;
  public trainerTypeDouble: TrainerType;
  public name: string;
  public nameFemale: string;
  public nameDouble: string;
  public title: string;
  public titleDouble: string;
  public hasGenders: boolean = false;
  public hasDouble: boolean = false;
  public hasCharSprite: boolean = false;
  public doubleOnly: boolean = false;
  public moneyMultiplier: number = 1;
  public isBoss: boolean = false;
  public hasStaticParty: boolean = false;
  public useSameSeedForAllMembers: boolean = false;
  public mixedBattleBgm: string;
  public battleBgm: string;
  public encounterBgm: string;
  public femaleEncounterBgm: string;
  public doubleEncounterBgm: string;
  public victoryBgm: string;
  public genModifiersFunc: GenModifiersFunc;
  public modifierRewardFuncs: ModifierTypeFunc[] = [];
  public partyTemplates: TrainerPartyTemplate[];
  public partyTemplateFunc: PartyTemplateFunc;
  public partyMemberFuncs: PartyMemberFuncs = {};
  public speciesPools: TrainerTierPools;
  public speciesFilter: PokemonSpeciesFilter;
  public specialtyTypes: Type[] = [];

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
    this.name = Utils.toReadableString(TrainerType[this.getDerivedType()]);
    this.battleBgm = "battle_trainer";
    this.mixedBattleBgm = "battle_trainer";
    this.victoryBgm = "victory_trainer";
    this.partyTemplates = [trainerPartyTemplates.TWO_AVG];
    this.speciesFilter = species => (allowLegendaries || (!species.legendary && !species.subLegendary && !species.mythical)) && !species.isTrainerForbidden();
  }

  getKey(): string {
    return TrainerType[this.getDerivedType()].toString().toLowerCase();
  }

  getSpriteKey(female?: boolean,isDouble: boolean = false): string {
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
  getDerivedType(trainerTypeToDeriveFrom: TrainerType = null): TrainerType {
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
   * @param {string} [nameFemale] - The name of the female trainer. If 'Ivy', a localized name will be assigned.
   * @param {TrainerType | string} [femaleEncounterBgm] - The encounter BGM for the female trainer, which can be a TrainerType or a string.
   * @returns {TrainerConfig} - The updated TrainerConfig instance.
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
      this.nameFemale = nameFemale;
    }

    // Indicate that this trainer configuration includes genders.
    this.hasGenders = true;

    // If a female encounter BGM is provided.
    if (femaleEncounterBgm) {
      // If the BGM is a TrainerType (number), convert it to a string, replace underscores with spaces, and convert to lowercase.
      // Otherwise, assign the provided string as the BGM.
      this.femaleEncounterBgm = typeof femaleEncounterBgm === "number"
        ? TrainerType[femaleEncounterBgm].toString().replace(/_/g, " ").toLowerCase()
        : femaleEncounterBgm;
    }

    // Return the updated TrainerConfig instance.
    return this;
  }

  /**
   * Sets the configuration for trainers with double battles, including the name of the double trainer and the encounter BGM.
   * @param nameDouble - The name of the double trainer (e.g., "Ace Duo" for Trainer Class Doubles or "red_blue_double" for NAMED trainer doubles).
   * @param doubleEncounterBgm - The encounter BGM for the double trainer, which can be a TrainerType or a string.
   * @returns {TrainerConfig} - The updated TrainerConfig instance.
   */
  setHasDouble(nameDouble: string, doubleEncounterBgm?: TrainerType | string): TrainerConfig {
    this.hasDouble = true;
    this.nameDouble = nameDouble;
    if (doubleEncounterBgm) {
      this.doubleEncounterBgm = typeof doubleEncounterBgm === "number" ? TrainerType[doubleEncounterBgm].toString().replace(/\_/g, " ").toLowerCase() : doubleEncounterBgm;
    }
    return this;
  }

  /**
   * Sets the trainer type for double battles.
   * @param trainerTypeDouble - The TrainerType of the partner in a double battle.
   * @returns {TrainerConfig} - The updated TrainerConfig instance.
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
   * @param titleDouble - the key for the title in the i18n file. (e.g., "champion_double").
   * @returns {TrainerConfig} - The updated TrainerConfig instance.
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
    this.encounterBgm = typeof encounterBgm === "number" ? TrainerType[encounterBgm].toString().toLowerCase() : encounterBgm;
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

  setPartyMemberFunc(slotIndex: integer, partyMemberFunc: PartyMemberFunc): TrainerConfig {
    this.partyMemberFuncs[slotIndex] = partyMemberFunc;
    return this;
  }

  setSpeciesPools(speciesPools: TrainerTierPools | Species[]): TrainerConfig {
    this.speciesPools = (Array.isArray(speciesPools) ? {[TrainerPoolTier.COMMON]: speciesPools} : speciesPools) as unknown as TrainerTierPools;
    return this;
  }

  setSpeciesFilter(speciesFilter: PokemonSpeciesFilter, allowLegendaries?: boolean): TrainerConfig {
    const baseFilter = this.speciesFilter;
    this.speciesFilter = allowLegendaries ? speciesFilter : species => speciesFilter(species) && baseFilter(species);
    return this;
  }

  setSpecialtyTypes(...specialtyTypes: Type[]): TrainerConfig {
    this.specialtyTypes = specialtyTypes;
    return this;
  }

  setGenModifiersFunc(genModifiersFunc: GenModifiersFunc): TrainerConfig {
    this.genModifiersFunc = genModifiersFunc;
    return this;
  }

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
     * Initializes the trainer configuration for an evil team leader. Temporarily hardcoding evil leader teams though.
     * @param {Species | Species[]} signatureSpecies - The signature species for the evil team leader.
     * @param {Type[]} specialtyTypes - The specialty types for the evil team Leader.
     * @returns {TrainerConfig} - The updated TrainerConfig instance.
     * **/
  initForEvilTeamLeader(title: string, signatureSpecies: (Species | Species[])[], ...specialtyTypes: Type[]): TrainerConfig {
    if (!getIsInitialized()) {
      initI18n();
    }
    this.setPartyTemplates(trainerPartyTemplates.RIVAL_5);
    signatureSpecies.forEach((speciesPool, s) => {
      if (!Array.isArray(speciesPool)) {
        speciesPool = [speciesPool];
      }
      this.setPartyMemberFunc(-(s + 1), getRandomPartyMemberFunc(speciesPool));
    });
    if (specialtyTypes.length) {
      this.setSpeciesFilter(p => specialtyTypes.find(t => p.isOfType(t)) !== undefined);
      this.setSpecialtyTypes(...specialtyTypes);
    }
    const nameForCall = this.name.toLowerCase().replace(/\s/g, "_");
    this.name = i18next.t(`trainerNames:${nameForCall}`);
    this.setTitle(title);
    this.setMoneyMultiplier(2.5);
    this.setBoss();
    this.setStaticParty();
    this.setBattleBgm("battle_unova_gym"); // TODO: change
    this.setVictoryBgm("victory_gym"); // TODO: change

    return this;
  }

  /**
   * Initializes the trainer configuration for a Gym Leader.
   * @param {Species | Species[]} signatureSpecies - The signature species for the Gym Leader.
   * @param {Type[]} specialtyTypes - The specialty types for the Gym Leader.
   * @param isMale - Whether the Gym Leader is Male or Not (for localization of the title).
   * @returns {TrainerConfig} - The updated TrainerConfig instance.
   * **/
  initForGymLeader(signatureSpecies: (Species | Species[])[],isMale:boolean, ...specialtyTypes: Type[]): TrainerConfig {
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

    // If specialty types are provided, set species filter and specialty types.
    if (specialtyTypes.length) {
      this.setSpeciesFilter(p => specialtyTypes.find(t => p.isOfType(t)) !== undefined);
      this.setSpecialtyTypes(...specialtyTypes);
    }

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
    this.setBattleBgm("battle_unova_gym");
    this.setVictoryBgm("victory_gym");
    this.setGenModifiersFunc(party => {
      const waveIndex = party[0].scene.currentBattle.waveIndex;
      return getRandomTeraModifiers(party, waveIndex >= 100 ? 1 : 0, specialtyTypes.length ? specialtyTypes : null);
    });

    return this;
  }

  /**
   * Initializes the trainer configuration for an Elite Four member.
   * @param {Species | Species[]} signatureSpecies - The signature species for the Elite Four member.
   * @param {Type[]} specialtyTypes - The specialty types for the Elite Four member.
   * @param isMale - Whether the Elite Four Member is Male or Female (for localization of the title).
   * @returns {TrainerConfig} - The updated TrainerConfig instance.
   **/
  initForEliteFour(signatureSpecies: (Species | Species[])[],isMale: boolean, ...specialtyTypes: Type[]): TrainerConfig {
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

    // Set species filter and specialty types if provided, otherwise filter by base total.
    if (specialtyTypes.length) {
      this.setSpeciesFilter(p => specialtyTypes.find(t => p.isOfType(t)) && p.baseTotal >= 450);
      this.setSpecialtyTypes(...specialtyTypes);
    } else {
      this.setSpeciesFilter(p => p.baseTotal >= 450);
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
    this.setBattleBgm("battle_unova_elite");
    this.setVictoryBgm("victory_gym");
    this.setGenModifiersFunc(party => getRandomTeraModifiers(party, 2, specialtyTypes.length ? specialtyTypes : null));

    return this;
  }

  /**
   * Initializes the trainer configuration for a Champion.
   * @param {Species | Species[]} signatureSpecies - The signature species for the Champion.
   * @param isMale - Whether the Champion is Male or Female (for localization of the title).
   * @returns {TrainerConfig} - The updated TrainerConfig instance.
   **/
  initForChampion(signatureSpecies: (Species | Species[])[], isMale: boolean): TrainerConfig {
    // Check if the internationalization (i18n) system is initialized.
    if (!getIsInitialized()) {
      initI18n();
    }

    // Set the party templates for the Champion.
    this.setPartyTemplates(trainerPartyTemplates.CHAMPION);

    // Set up party members with their corresponding species.
    signatureSpecies.forEach((speciesPool, s) => {
      // Ensure speciesPool is an array.
      if (!Array.isArray(speciesPool)) {
        speciesPool = [speciesPool];
      }
      // Set a function to get a random party member from the species pool.
      this.setPartyMemberFunc(-(s + 1), getRandomPartyMemberFunc(speciesPool));
    });

    // Set species filter to only include species with a base total of 470 or higher.
    this.setSpeciesFilter(p => p.baseTotal >= 470);

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
    this.setBattleBgm("battle_champion_alder");
    this.setVictoryBgm("victory_champion");
    this.setGenModifiersFunc(party => getRandomTeraModifiers(party, 3));

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
        if (variant === TrainerVariant.FEMALE || (variant === TrainerVariant.DOUBLE && trainerSlot === TrainerSlot.TRAINER_PARTNER)) {
          return this.nameFemale;
        }
      } else
      // Check if !variant is true, if so return the name, else return the name with _female appended
        if (variant) {
          if (!getIsInitialized()) {
            initI18n();
          }
          // Check if the female version exists in the i18n file
          if (i18next.exists(`trainerClasses:${this.name.toLowerCase()}`)) {
          // If it does, return
            return ret + "_female";
          } else {
          // If it doesn't, we do not do anything and go to the normal return
          // This is to prevent the game from displaying an error if a female version of the trainer does not exist in the localization
          }
        }
    }

    return ret;
  }

  loadAssets(scene: BattleScene, variant: TrainerVariant): Promise<void> {
    return new Promise(resolve => {
      const isDouble = variant === TrainerVariant.DOUBLE;
      const trainerKey = this.getSpriteKey(variant === TrainerVariant.FEMALE, false);
      const partnerTrainerKey = this.getSpriteKey(true,true);
      scene.loadAtlas(trainerKey, "trainer");
      if (isDouble) {
        scene.loadAtlas(partnerTrainerKey, "trainer");
      }
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        const originalWarn = console.warn;
        // Ignore warnings for missing frames, because there will be a lot
        console.warn = () => {
        };
        const frameNames = scene.anims.generateFrameNames(trainerKey, {zeroPad: 4,suffix: ".png",start: 1,end: 128});
        const partnerFrameNames = isDouble
          ? scene.anims.generateFrameNames(partnerTrainerKey, {zeroPad: 4,suffix: ".png",start: 1,end: 128})
          : null;
        console.warn = originalWarn;
        if (!(scene.anims.exists(trainerKey))) {
          scene.anims.create({
            key: trainerKey,
            frames: frameNames,
            frameRate: 24,
            repeat: -1
          });
        }
        if (isDouble && !(scene.anims.exists(partnerTrainerKey))) {
          scene.anims.create({
            key: partnerTrainerKey,
            frames: partnerFrameNames,
            frameRate: 24,
            repeat: -1
          });
        }
        resolve();
      });
      if (!scene.load.isLoading()) {
        scene.load.start();
      }
    });
  }
}

let t = 0;

interface TrainerConfigs {
  [key: integer]: TrainerConfig
}

/**
 * The function to get variable strength grutns
 * @param scene the singleton scene being passed in
 * @returns the correct TrainerPartyTemplate
 */
function getEvilGruntPartyTemplate(scene: BattleScene): TrainerPartyTemplate {
  const waveIndex = scene.currentBattle?.waveIndex;
  if (waveIndex < 40) {
    return trainerPartyTemplates.TWO_AVG;
  } else if (waveIndex < 80) {
    switch (waveIndex) {
    case 62:
      return trainerPartyTemplates.THREE_AVG;
    case 64:
      return trainerPartyTemplates.TWO_AVG_ONE_STRONG;
    case 65:
      return trainerPartyTemplates.GYM_LEADER_4; // 3avg 1 strong 1 stronger
    }
  } else {
    switch (waveIndex) {
    case 112:
      return trainerPartyTemplates.GYM_LEADER_4; // 3avg 1 strong 1 stronger
    case 114:
      return trainerPartyTemplates.GYM_LEADER_5; // 3 avg 2 strong 1 stronger
    }
  }
}

function getWavePartyTemplate(scene: BattleScene, ...templates: TrainerPartyTemplate[]) {
  return templates[Math.min(Math.max(Math.ceil((scene.gameMode.getWaveForDifficulty(scene.currentBattle?.waveIndex || startingWave, true) - 20) / 30), 0), templates.length - 1)];
}

function getGymLeaderPartyTemplate(scene: BattleScene) {
  return getWavePartyTemplate(scene, trainerPartyTemplates.GYM_LEADER_1, trainerPartyTemplates.GYM_LEADER_2, trainerPartyTemplates.GYM_LEADER_3, trainerPartyTemplates.GYM_LEADER_4, trainerPartyTemplates.GYM_LEADER_5);
}

function getRandomPartyMemberFunc(speciesPool: Species[], trainerSlot: TrainerSlot = TrainerSlot.TRAINER, ignoreEvolution: boolean = false, postProcess?: (enemyPokemon: EnemyPokemon) => void): PartyMemberFunc {
  return (scene: BattleScene, level: integer, strength: PartyMemberStrength) => {
    let species = Utils.randSeedItem(speciesPool);
    if (!ignoreEvolution) {
      species = getPokemonSpecies(species).getTrainerSpeciesForLevel(level, true, strength);
    }
    return scene.addEnemyPokemon(getPokemonSpecies(species), level, trainerSlot, undefined, undefined, postProcess);
  };
}

function getSpeciesFilterRandomPartyMemberFunc(speciesFilter: PokemonSpeciesFilter, trainerSlot: TrainerSlot = TrainerSlot.TRAINER, allowLegendaries?: boolean, postProcess?: (EnemyPokemon: EnemyPokemon) => void): PartyMemberFunc {
  const originalSpeciesFilter = speciesFilter;
  speciesFilter = (species: PokemonSpecies) => (allowLegendaries || (!species.legendary && !species.subLegendary && !species.mythical)) && !species.isTrainerForbidden() && originalSpeciesFilter(species);
  return (scene: BattleScene, level: integer, strength: PartyMemberStrength) => {
    const ret = scene.addEnemyPokemon(getPokemonSpecies(scene.randomSpecies(scene.currentBattle.waveIndex, level, false, speciesFilter).getTrainerSpeciesForLevel(level, true, strength)), level, trainerSlot, undefined, undefined, postProcess);
    return ret;
  };
}

function getRandomTeraModifiers(party: EnemyPokemon[], count: integer, types?: Type[]): PersistentModifier[] {
  const ret: PersistentModifier[] = [];
  const partyMemberIndexes = new Array(party.length).fill(null).map((_, i) => i);
  for (let t = 0; t < Math.min(count, party.length); t++) {
    const randomIndex = Utils.randSeedItem(partyMemberIndexes);
    partyMemberIndexes.splice(partyMemberIndexes.indexOf(randomIndex), 1);
    ret.push(modifierTypes.TERA_SHARD().generateType(null, [Utils.randSeedItem(types ? types : party[randomIndex].getTypes())]).withIdFromFunc(modifierTypes.TERA_SHARD).newModifier(party[randomIndex]) as PersistentModifier);
  }
  return ret;
}

type SignatureSpecies = {
  [key in string]: (Species | Species[])[];
};

/*
 * The signature species for each Gym Leader, Elite Four member, and Champion.
 * The key is the trainer type, and the value is an array of Species or Species arrays.
 * This is in a separate const so it can be accessed from other places and not just the trainerConfigs
 */
export const signatureSpecies: SignatureSpecies = {
  BROCK: [Species.GEODUDE, Species.ONIX],
  MISTY: [Species.STARYU, Species.PSYDUCK],
  LT_SURGE: [Species.VOLTORB, Species.PIKACHU, Species.ELECTABUZZ],
  ERIKA: [Species.ODDISH, Species.BELLSPROUT, Species.TANGELA, Species.HOPPIP],
  JANINE: [Species.VENONAT, Species.SPINARAK, Species.ZUBAT],
  SABRINA: [Species.ABRA, Species.MR_MIME, Species.ESPEON],
  BLAINE: [Species.GROWLITHE, Species.PONYTA, Species.MAGMAR],
  GIOVANNI: [Species.SANDILE, Species.MURKROW, Species.NIDORAN_M, Species.NIDORAN_F],
  FALKNER: [Species.PIDGEY, Species.HOOTHOOT, Species.DODUO],
  BUGSY: [Species.SCYTHER, Species.HERACROSS, Species.SHUCKLE, Species.PINSIR],
  WHITNEY: [Species.GIRAFARIG, Species.MILTANK],
  MORTY: [Species.GASTLY, Species.MISDREAVUS, Species.SABLEYE],
  CHUCK: [Species.POLIWRATH, Species.MANKEY],
  JASMINE: [Species.MAGNEMITE, Species.STEELIX],
  PRYCE: [Species.SEEL, Species.SWINUB],
  CLAIR: [Species.DRATINI, Species.HORSEA, Species.GYARADOS],
  ROXANNE: [Species.GEODUDE, Species.NOSEPASS],
  BRAWLY: [Species.MACHOP, Species.MAKUHITA],
  WATTSON: [Species.MAGNEMITE, Species.VOLTORB, Species.ELECTRIKE],
  FLANNERY: [Species.SLUGMA, Species.TORKOAL, Species.NUMEL],
  NORMAN: [Species.SLAKOTH, Species.SPINDA, Species.CHANSEY, Species.KANGASKHAN],
  WINONA: [Species.SWABLU, Species.WINGULL, Species.TROPIUS, Species.SKARMORY],
  TATE: [Species.SOLROCK, Species.NATU, Species.CHIMECHO, Species.GALLADE],
  LIZA: [Species.LUNATONE, Species.SPOINK, Species.BALTOY, Species.GARDEVOIR],
  JUAN: [Species.HORSEA, Species.BARBOACH, Species.SPHEAL, Species.RELICANTH],
  ROARK: [Species.CRANIDOS, Species.LARVITAR, Species.GEODUDE],
  GARDENIA: [Species.ROSELIA, Species.TANGELA, Species.TURTWIG],
  MAYLENE: [Species.LUCARIO, Species.MEDITITE, Species.CHIMCHAR],
  CRASHER_WAKE: [Species.BUIZEL, Species.MAGIKARP, Species.PIPLUP],
  FANTINA: [Species.MISDREAVUS, Species.DRIFLOON, Species.SPIRITOMB],
  BYRON: [Species.SHIELDON, Species.BRONZOR, Species.AGGRON],
  CANDICE: [Species.SNEASEL, Species.SNOVER, Species.SNORUNT],
  VOLKNER: [Species.SHINX, Species.CHINCHOU, Species.ROTOM],
  CILAN: [Species.PANSAGE, Species.COTTONEE, Species.PETILIL],
  CHILI: [Species.PANSEAR, Species.DARUMAKA, Species.HEATMOR],
  CRESS: [Species.PANPOUR, Species.BASCULIN, Species.TYMPOLE],
  CHEREN: [Species.LILLIPUP, Species.MINCCINO, Species.PATRAT],
  LENORA: [Species.KANGASKHAN, Species.DEERLING, Species.AUDINO],
  ROXIE: [Species.VENIPEDE, Species.TRUBBISH, Species.SKORUPI],
  BURGH: [Species.SEWADDLE, Species.SHELMET, Species.KARRABLAST],
  ELESA: [Species.EMOLGA, Species.BLITZLE, Species.JOLTIK],
  CLAY: [Species.DRILBUR, Species.SANDILE, Species.GOLETT],
  SKYLA: [Species.DUCKLETT, Species.WOOBAT, Species.RUFFLET],
  BRYCEN: [Species.CRYOGONAL, Species.VANILLITE, Species.CUBCHOO],
  DRAYDEN: [Species.DRUDDIGON, Species.AXEW, Species.DEINO],
  MARLON: [Species.WAILMER, Species.FRILLISH, Species.TIRTOUGA],
  VIOLA: [Species.SURSKIT, Species.SCATTERBUG],
  GRANT: [Species.AMAURA, Species.TYRUNT],
  KORRINA: [Species.HAWLUCHA, Species.LUCARIO, Species.MIENFOO],
  RAMOS: [Species.SKIDDO, Species.HOPPIP, Species.BELLSPROUT],
  CLEMONT: [Species.HELIOPTILE, Species.MAGNEMITE, Species.EMOLGA],
  VALERIE: [Species.SYLVEON, Species.MAWILE, Species.MR_MIME],
  OLYMPIA: [Species.ESPURR, Species.SIGILYPH, Species.SLOWKING],
  WULFRIC: [Species.BERGMITE, Species.SNOVER, Species.CRYOGONAL],
  MILO: [Species.GOSSIFLEUR, Species.APPLIN, Species.BOUNSWEET],
  NESSA: [Species.CHEWTLE, Species.ARROKUDA, Species.WIMPOD],
  KABU: [Species.SIZZLIPEDE, Species.VULPIX, Species.TORKOAL],
  BEA: [Species.GALAR_FARFETCHD, Species.MACHOP, Species.CLOBBOPUS],
  ALLISTER: [Species.GALAR_YAMASK, Species.GALAR_CORSOLA, Species.GASTLY],
  OPAL: [Species.MILCERY, Species.TOGETIC, Species.GALAR_WEEZING],
  BEDE: [Species.HATENNA, Species.GALAR_PONYTA, Species.GARDEVOIR],
  GORDIE: [Species.ROLYCOLY, Species.STONJOURNER, Species.BINACLE],
  MELONY: [Species.SNOM, Species.GALAR_DARUMAKA, Species.GALAR_MR_MIME],
  PIERS: [Species.GALAR_ZIGZAGOON, Species.SCRAGGY, Species.INKAY],
  MARNIE: [Species.IMPIDIMP, Species.PURRLOIN, Species.MORPEKO],
  RAIHAN: [Species.DURALUDON, Species.TURTONATOR, Species.GOOMY],
  KATY: [Species.NYMBLE, Species.TAROUNTULA, Species.HERACROSS],
  BRASSIUS: [Species.SMOLIV, Species.SHROOMISH, Species.ODDISH],
  IONO: [Species.TADBULB, Species.WATTREL, Species.VOLTORB],
  KOFU: [Species.VELUZA, Species.WIGLETT, Species.WINGULL],
  LARRY: [Species.STARLY, Species.DUNSPARCE, Species.KOMALA],
  RYME: [Species.GREAVARD, Species.SHUPPET, Species.MIMIKYU],
  TULIP: [Species.GIRAFARIG, Species.FLITTLE, Species.RALTS],
  GRUSHA: [Species.CETODDLE, Species.ALOLA_VULPIX, Species.CUBCHOO],
  LORELEI: [Species.JYNX, [Species.SLOWBRO, Species.GALAR_SLOWBRO], Species.LAPRAS, [Species.ALOLA_SANDSLASH, Species.CLOYSTER]],
  BRUNO: [Species.MACHAMP, Species.HITMONCHAN, Species.HITMONLEE, [Species.ALOLA_GOLEM, Species.GOLEM]],
  AGATHA: [Species.GENGAR, [Species.ARBOK, Species.WEEZING], Species.CROBAT, Species.ALOLA_MAROWAK],
  LANCE: [Species.DRAGONITE, Species.GYARADOS, Species.AERODACTYL, Species.ALOLA_EXEGGUTOR],
  WILL: [Species.XATU, Species.JYNX, [Species.SLOWBRO, Species.SLOWKING], Species.EXEGGUTOR],
  KOGA: [[Species.WEEZING, Species.MUK], [Species.VENOMOTH, Species.ARIADOS], Species.CROBAT, Species.TENTACRUEL],
  KAREN: [Species.UMBREON, Species.HONCHKROW, Species.HOUNDOOM, Species.WEAVILE],
  SIDNEY: [[Species.SHIFTRY, Species.CACTURNE], [Species.SHARPEDO, Species.CRAWDAUNT], Species.ABSOL, Species.MIGHTYENA],
  PHOEBE: [Species.SABLEYE, Species.DUSKNOIR, Species.BANETTE, [Species.MISMAGIUS, Species.DRIFBLIM]],
  GLACIA: [Species.GLALIE, Species.WALREIN, Species.FROSLASS, Species.ABOMASNOW],
  DRAKE: [Species.ALTARIA, Species.SALAMENCE, Species.FLYGON, Species.KINGDRA],
  AARON: [[Species.SCIZOR, Species.KLEAVOR], Species.HERACROSS, [Species.VESPIQUEN, Species.YANMEGA], Species.DRAPION],
  BERTHA: [Species.WHISCASH, Species.HIPPOWDON, Species.GLISCOR, Species.RHYPERIOR],
  FLINT: [[Species.FLAREON, Species.RAPIDASH], Species.MAGMORTAR, [Species.STEELIX, Species.LOPUNNY], Species.INFERNAPE],
  LUCIAN: [Species.MR_MIME, Species.GALLADE, Species.BRONZONG, [Species.ALAKAZAM, Species.ESPEON]],
  SHAUNTAL: [Species.COFAGRIGUS, Species.CHANDELURE, Species.GOLURK, Species.JELLICENT],
  MARSHAL: [Species.CONKELDURR, Species.MIENSHAO, Species.THROH, Species.SAWK],
  GRIMSLEY: [Species.LIEPARD, Species.KINGAMBIT, Species.SCRAFTY, Species.KROOKODILE],
  CAITLIN: [Species.MUSHARNA, Species.GOTHITELLE, Species.SIGILYPH, Species.REUNICLUS],
  MALVA: [Species.PYROAR, Species.TORKOAL, Species.CHANDELURE, Species.TALONFLAME],
  SIEBOLD: [Species.CLAWITZER, Species.GYARADOS, Species.BARBARACLE, Species.STARMIE],
  WIKSTROM: [Species.KLEFKI, Species.PROBOPASS, Species.SCIZOR, Species.AEGISLASH],
  DRASNA: [Species.DRAGALGE, Species.DRUDDIGON, Species.ALTARIA, Species.NOIVERN],
  HALA: [Species.HARIYAMA, Species.BEWEAR, Species.CRABOMINABLE, [Species.POLIWRATH, Species.ANNIHILAPE]],
  MOLAYNE: [Species.KLEFKI, Species.MAGNEZONE, Species.METAGROSS, Species.ALOLA_DUGTRIO],
  OLIVIA: [Species.RELICANTH, Species.CARBINK, Species.ALOLA_GOLEM, Species.LYCANROC],
  ACEROLA: [[Species.BANETTE, Species.DRIFBLIM], Species.MIMIKYU, Species.DHELMISE, Species.PALOSSAND],
  KAHILI: [[Species.BRAVIARY, Species.MANDIBUZZ], Species.HAWLUCHA, Species.ORICORIO, Species.TOUCANNON],
  MARNIE_ELITE: [Species.MORPEKO, Species.LIEPARD, [Species.TOXICROAK, Species.SCRAFTY], Species.GRIMMSNARL],
  NESSA_ELITE: [Species.GOLISOPOD, [Species.PELIPPER, Species.QUAGSIRE], Species.TOXAPEX, Species.DREDNAW],
  BEA_ELITE: [Species.HAWLUCHA, [Species.GRAPPLOCT, Species.SIRFETCHD], Species.FALINKS, Species.MACHAMP],
  ALLISTER_ELITE:[Species.DUSKNOIR, [Species.POLTEAGEIST, Species.RUNERIGUS], Species.CURSOLA, Species.GENGAR],
  RAIHAN_ELITE: [Species.GOODRA, [Species.TORKOAL, Species.TURTONATOR], Species.FLYGON, Species.ARCHALUDON],
  RIKA: [Species.WHISCASH, [Species.DONPHAN, Species.DUGTRIO], Species.CAMERUPT, Species.CLODSIRE],
  POPPY: [Species.COPPERAJAH, Species.BRONZONG, Species.CORVIKNIGHT, Species.TINKATON],
  LARRY_ELITE: [Species.STARAPTOR, Species.FLAMIGO, Species.ALTARIA, Species.TROPIUS],
  HASSEL: [Species.NOIVERN, [Species.FLAPPLE, Species.APPLETUN], Species.DRAGALGE, Species.BAXCALIBUR],
  CRISPIN: [Species.TALONFLAME, Species.CAMERUPT, Species.MAGMORTAR, Species.BLAZIKEN],
  AMARYS: [Species.SKARMORY, Species.EMPOLEON, Species.SCIZOR, Species.METAGROSS],
  LACEY: [Species.EXCADRILL, Species.PRIMARINA, [Species.ALCREMIE, Species.GRANBULL], Species.WHIMSICOTT],
  DRAYTON: [Species.DRAGONITE, Species.ARCHALUDON, Species.HAXORUS, Species.SCEPTILE],
  BLUE: [[Species.GYARADOS, Species.EXEGGUTOR, Species.ARCANINE], Species.HO_OH, [Species.RHYPERIOR, Species.MAGNEZONE]], // Alakazam lead, Mega Pidgeot
  RED: [Species.LUGIA, Species.SNORLAX, [Species.ESPEON, Species.UMBREON, Species.SYLVEON]], // GMax Pikachu lead, Mega gen 1 starter
  LANCE_CHAMPION: [Species.DRAGONITE, Species.KINGDRA, Species.ALOLA_EXEGGUTOR], // Aerodactyl lead, Mega Latias/Latios
  STEVEN: [Species.AGGRON, [Species.ARMALDO, Species.CRADILY], Species.DIALGA], // Skarmory lead, Mega Metagross
  WALLACE: [Species.MILOTIC, Species.PALKIA, Species.LUDICOLO], // Pelipper lead, Mega Swampert
  CYNTHIA: [Species.GIRATINA, Species.LUCARIO, Species.TOGEKISS], // Spiritomb lead, Mega Garchomp
  ALDER: [Species.VOLCARONA, Species.ZEKROM, [Species.ACCELGOR, Species.ESCAVALIER], Species.KELDEO], // Bouffalant/Braviary lead
  IRIS: [Species.HAXORUS, Species.RESHIRAM, Species.ARCHEOPS], // Druddigon lead, Gmax Lapras
  DIANTHA: [Species.HAWLUCHA, Species.XERNEAS, Species.GOODRA], // Gourgeist lead, Mega Gardevoir
  HAU: [[Species.SOLGALEO, Species.LUNALA], Species.NOIVERN, [Species.DECIDUEYE, Species.INCINEROAR, Species.PRIMARINA], [Species.TAPU_BULU, Species.TAPU_FINI, Species.TAPU_KOKO, Species.TAPU_LELE]], // Alola Raichu lead
  LEON: [Species.DRAGAPULT, [Species.ZACIAN, Species.ZAMAZENTA], Species.AEGISLASH], // Rillaboom/Cinderace/Inteleon lead, GMax Charizard
  GEETA: [Species.MIRAIDON, [Species.ESPATHRA, Species.VELUZA], [Species.AVALUGG, Species.HISUI_AVALUGG], Species.KINGAMBIT], // Glimmora lead
  NEMONA: [Species.KORAIDON, Species.PAWMOT, [Species.DUDUNSPARCE, Species.ORTHWORM], [Species.MEOWSCARADA, Species.SKELEDIRGE, Species.QUAQUAVAL]], // Lycanroc lead
  KIERAN: [[Species.GRIMMSNARL, Species.INCINEROAR, Species.PORYGON_Z], Species.OGERPON, Species.TERAPAGOS, Species.HYDRAPPLE], // Poliwrath/Politoed lead
};

export const trainerConfigs: TrainerConfigs = {
  [TrainerType.UNKNOWN]: new TrainerConfig(0).setHasGenders(),
  [TrainerType.ACE_TRAINER]: new TrainerConfig(++t).setHasGenders("Ace Trainer Female").setHasDouble("Ace Duo").setMoneyMultiplier(2.25).setEncounterBgm(TrainerType.ACE_TRAINER)
    .setPartyTemplateFunc(scene => getWavePartyTemplate(scene, trainerPartyTemplates.THREE_WEAK_BALANCED, trainerPartyTemplates.FOUR_WEAK_BALANCED, trainerPartyTemplates.FIVE_WEAK_BALANCED, trainerPartyTemplates.SIX_WEAK_BALANCED)),
  [TrainerType.ARTIST]: new TrainerConfig(++t).setEncounterBgm(TrainerType.RICH).setPartyTemplates(trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.THREE_AVG)
    .setSpeciesPools([Species.SMEARGLE]),
  [TrainerType.BACKERS]: new TrainerConfig(++t).setHasGenders("Backers").setDoubleOnly().setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.BACKPACKER]: new TrainerConfig(++t).setHasGenders("Backpacker Female").setHasDouble("Backpackers").setSpeciesFilter(s => s.isOfType(Type.FLYING) || s.isOfType(Type.ROCK)).setEncounterBgm(TrainerType.BACKPACKER)
    .setPartyTemplates(trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.ONE_WEAK_ONE_STRONG, trainerPartyTemplates.ONE_AVG_ONE_STRONG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.RHYHORN, Species.AIPOM, Species.MAKUHITA, Species.MAWILE, Species.NUMEL, Species.LILLIPUP, Species.SANDILE, Species.WOOLOO],
      [TrainerPoolTier.UNCOMMON]: [Species.GIRAFARIG, Species.ZANGOOSE, Species.SEVIPER, Species.CUBCHOO, Species.PANCHAM, Species.SKIDDO, Species.MUDBRAY],
      [TrainerPoolTier.RARE]: [Species.TAUROS, Species.STANTLER, Species.DARUMAKA, Species.BOUFFALANT, Species.DEERLING, Species.IMPIDIMP],
      [TrainerPoolTier.SUPER_RARE]: [Species.GALAR_DARUMAKA, Species.TEDDIURSA]
    }),
  [TrainerType.BAKER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CLERK).setMoneyMultiplier(1.35).setSpeciesFilter(s => s.isOfType(Type.GRASS) || s.isOfType(Type.FIRE)),
  [TrainerType.BEAUTY]: new TrainerConfig(++t).setMoneyMultiplier(1.55).setEncounterBgm(TrainerType.PARASOL_LADY),
  [TrainerType.BIKER]: new TrainerConfig(++t).setMoneyMultiplier(1.4).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.POISON)),
  [TrainerType.BLACK_BELT]: new TrainerConfig(++t).setHasGenders("Battle Girl", TrainerType.PSYCHIC).setHasDouble("Crush Kin").setEncounterBgm(TrainerType.ROUGHNECK).setSpecialtyTypes(Type.FIGHTING)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK_ONE_AVG, trainerPartyTemplates.TWO_WEAK_ONE_AVG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_ONE_STRONG, trainerPartyTemplates.THREE_AVG, trainerPartyTemplates.TWO_AVG_ONE_STRONG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.NIDORAN_F, Species.NIDORAN_M, Species.MACHOP, Species.MAKUHITA, Species.MEDITITE, Species.CROAGUNK, Species.TIMBURR],
      [TrainerPoolTier.UNCOMMON]: [Species.MANKEY, Species.POLIWRATH, Species.TYROGUE, Species.BRELOOM, Species.SCRAGGY, Species.MIENFOO, Species.PANCHAM, Species.STUFFUL, Species.CRABRAWLER],
      [TrainerPoolTier.RARE]: [Species.HERACROSS, Species.RIOLU, Species.THROH, Species.SAWK, Species.PASSIMIAN, Species.CLOBBOPUS],
      [TrainerPoolTier.SUPER_RARE]: [Species.HITMONTOP, Species.INFERNAPE, Species.GALLADE, Species.HAWLUCHA, Species.HAKAMO_O],
      [TrainerPoolTier.ULTRA_RARE]: [Species.KUBFU]
    }),
  [TrainerType.BREEDER]: new TrainerConfig(++t).setMoneyMultiplier(1.325).setEncounterBgm(TrainerType.POKEFAN).setHasGenders("Breeder Female").setHasDouble("Breeders")
    .setPartyTemplateFunc(scene => getWavePartyTemplate(scene, trainerPartyTemplates.FOUR_WEAKER, trainerPartyTemplates.FIVE_WEAKER, trainerPartyTemplates.SIX_WEAKER))
    .setSpeciesFilter(s => s.baseTotal < 450),
  [TrainerType.CLERK]: new TrainerConfig(++t).setHasGenders("Clerk Female").setHasDouble("Colleagues").setEncounterBgm(TrainerType.CLERK)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.THREE_WEAK, trainerPartyTemplates.ONE_AVG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_ONE_AVG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.MEOWTH, Species.PSYDUCK, Species.BUDEW, Species.PIDOVE, Species.CINCCINO, Species.LITLEO],
      [TrainerPoolTier.UNCOMMON]: [Species.JIGGLYPUFF, Species.MAGNEMITE, Species.MARILL, Species.COTTONEE, Species.SKIDDO],
      [TrainerPoolTier.RARE]: [Species.BUIZEL, Species.SNEASEL, Species.KLEFKI, Species.INDEEDEE]
    }),
  [TrainerType.CYCLIST]: new TrainerConfig(++t).setMoneyMultiplier(1.3).setHasGenders("Cyclist Female").setHasDouble("Cyclists").setEncounterBgm(TrainerType.CYCLIST)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.ONE_AVG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.PICHU, Species.STARLY, Species.TAILLOW, Species.BOLTUND],
      [TrainerPoolTier.UNCOMMON]: [Species.DODUO, Species.ELECTRIKE, Species.BLITZLE, Species.WATTREL],
      [TrainerPoolTier.RARE]: [Species.YANMA, Species.NINJASK, Species.WHIRLIPEDE, Species.EMOLGA],
      [TrainerPoolTier.SUPER_RARE]: [Species.ACCELGOR, Species.DREEPY]
    }),
  [TrainerType.DANCER]: new TrainerConfig(++t).setMoneyMultiplier(1.55).setEncounterBgm(TrainerType.CYCLIST)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.ONE_AVG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_SAME_TWO_WEAK_SAME)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.RALTS, Species.SPOINK, Species.LOTAD, Species.BUDEW],
      [TrainerPoolTier.UNCOMMON]: [Species.SPINDA, Species.SWABLU, Species.MARACTUS,],
      [TrainerPoolTier.RARE]: [Species.BELLOSSOM, Species.HITMONTOP, Species.MIME_JR, Species.ORICORIO],
      [TrainerPoolTier.SUPER_RARE]: [Species.POPPLIO]
    }),
  [TrainerType.DEPOT_AGENT]: new TrainerConfig(++t).setMoneyMultiplier(1.45).setEncounterBgm(TrainerType.CLERK),
  [TrainerType.DOCTOR]: new TrainerConfig(++t).setHasGenders("Nurse", "lass").setHasDouble("Medical Team").setMoneyMultiplier(3).setEncounterBgm(TrainerType.CLERK)
    .setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === Moves.HEAL_PULSE)),
  [TrainerType.FIREBREATHER]: new TrainerConfig(++t).setMoneyMultiplier(1.4).setEncounterBgm(TrainerType.ROUGHNECK)
    .setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === Moves.SMOG) || s.isOfType(Type.FIRE)),
  [TrainerType.FISHERMAN]: new TrainerConfig(++t).setMoneyMultiplier(1.25).setEncounterBgm(TrainerType.BACKPACKER).setSpecialtyTypes(Type.WATER)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG, trainerPartyTemplates.ONE_AVG, trainerPartyTemplates.THREE_WEAK_SAME, trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.SIX_WEAKER)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.TENTACOOL, Species.MAGIKARP, Species.GOLDEEN, Species.STARYU, Species.REMORAID, Species.SKRELP, Species.CLAUNCHER, Species.ARROKUDA],
      [TrainerPoolTier.UNCOMMON]: [Species.POLIWAG, Species.SHELLDER, Species.KRABBY, Species.HORSEA, Species.CARVANHA, Species.BARBOACH, Species.CORPHISH, Species.FINNEON, Species.TYMPOLE, Species.BASCULIN, Species.FRILLISH, Species.INKAY],
      [TrainerPoolTier.RARE]: [Species.CHINCHOU, Species.CORSOLA, Species.WAILMER, Species.BARBOACH, Species.CLAMPERL, Species.LUVDISC, Species.MANTYKE, Species.ALOMOMOLA, Species.TATSUGIRI, Species.VELUZA],
      [TrainerPoolTier.SUPER_RARE]: [Species.LAPRAS, Species.FEEBAS, Species.RELICANTH, Species.DONDOZO]
    }),
  [TrainerType.GUITARIST]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.ROUGHNECK).setSpecialtyTypes(Type.ELECTRIC).setSpeciesFilter(s => s.isOfType(Type.ELECTRIC)),
  [TrainerType.HARLEQUIN]: new TrainerConfig(++t).setEncounterBgm(TrainerType.PSYCHIC).setSpeciesFilter(s => tmSpecies[Moves.TRICK_ROOM].indexOf(s.speciesId) > -1),
  [TrainerType.HIKER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.BACKPACKER)
    .setPartyTemplates(trainerPartyTemplates.TWO_AVG_SAME_ONE_AVG, trainerPartyTemplates.TWO_AVG_SAME_ONE_STRONG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.FOUR_WEAK, trainerPartyTemplates.ONE_STRONG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.SANDSHREW, Species.DIGLETT, Species.GEODUDE, Species.MACHOP, Species.ARON, Species.ROGGENROLA, Species.DRILBUR, Species.NACLI],
      [TrainerPoolTier.UNCOMMON]: [Species.ZUBAT, Species.RHYHORN, Species.ONIX, Species.CUBONE, Species.WOOBAT, Species.SWINUB, Species.NOSEPASS, Species.HIPPOPOTAS, Species.DWEBBLE, Species.KLAWF, Species.TOEDSCOOL],
      [TrainerPoolTier.RARE]: [Species.TORKOAL, Species.TRAPINCH, Species.BARBOACH, Species.GOLETT, Species.ALOLA_DIGLETT, Species.ALOLA_GEODUDE, Species.GALAR_STUNFISK, Species.PALDEA_WOOPER],
      [TrainerPoolTier.SUPER_RARE]: [Species.MAGBY, Species.LARVITAR]
    }),
  [TrainerType.HOOLIGANS]: new TrainerConfig(++t).setDoubleOnly().setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.POISON) || s.isOfType(Type.DARK)),
  [TrainerType.HOOPSTER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.INFIELDER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.JANITOR]: new TrainerConfig(++t).setMoneyMultiplier(1.1).setEncounterBgm(TrainerType.CLERK),
  [TrainerType.LINEBACKER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.MAID]: new TrainerConfig(++t).setMoneyMultiplier(1.6).setEncounterBgm(TrainerType.RICH),
  [TrainerType.MUSICIAN]: new TrainerConfig(++t).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === Moves.SING)),
  [TrainerType.HEX_MANIAC]: new TrainerConfig(++t).setMoneyMultiplier(1.5).setEncounterBgm(TrainerType.PSYCHIC)
    .setPartyTemplates(trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.ONE_AVG_ONE_STRONG, trainerPartyTemplates.TWO_AVG_SAME_ONE_AVG, trainerPartyTemplates.THREE_AVG, trainerPartyTemplates.TWO_STRONG)
    .setSpeciesFilter(s => s.isOfType(Type.GHOST)),
  [TrainerType.NURSERY_AIDE]: new TrainerConfig(++t).setMoneyMultiplier(1.3).setEncounterBgm("lass"),
  [TrainerType.OFFICER]: new TrainerConfig(++t).setMoneyMultiplier(1.55).setEncounterBgm(TrainerType.CLERK)
    .setPartyTemplates(trainerPartyTemplates.ONE_AVG, trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.VULPIX, Species.GROWLITHE, Species.SNUBBULL, Species.POOCHYENA, Species.ELECTRIKE, Species.LILLIPUP, Species.YAMPER, Species.FIDOUGH],
      [TrainerPoolTier.UNCOMMON]: [Species.HOUNDOUR, Species.ROCKRUFF, Species.MASCHIFF],
      [TrainerPoolTier.RARE]: [Species.JOLTEON, Species.RIOLU],
      [TrainerPoolTier.SUPER_RARE]: [],
      [TrainerPoolTier.ULTRA_RARE]: [Species.ENTEI, Species.SUICUNE, Species.RAIKOU]
    }),
  [TrainerType.PARASOL_LADY]: new TrainerConfig(++t).setMoneyMultiplier(1.55).setEncounterBgm(TrainerType.PARASOL_LADY).setSpeciesFilter(s => s.isOfType(Type.WATER)),
  [TrainerType.PILOT]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CLERK).setSpeciesFilter(s => tmSpecies[Moves.FLY].indexOf(s.speciesId) > -1),
  [TrainerType.POKEFAN]: new TrainerConfig(++t).setMoneyMultiplier(1.4).setName("PokéFan").setHasGenders("PokéFan Female").setHasDouble("PokéFan Family").setEncounterBgm(TrainerType.POKEFAN)
    .setPartyTemplates(trainerPartyTemplates.SIX_WEAKER, trainerPartyTemplates.FOUR_WEAK, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.FOUR_WEAK_SAME, trainerPartyTemplates.FIVE_WEAK, trainerPartyTemplates.SIX_WEAKER_SAME),
  [TrainerType.PRESCHOOLER]: new TrainerConfig(++t).setMoneyMultiplier(0.2).setEncounterBgm(TrainerType.YOUNGSTER).setHasGenders("Preschooler Female", "lass").setHasDouble("Preschoolers")
    .setPartyTemplates(trainerPartyTemplates.THREE_WEAK, trainerPartyTemplates.FOUR_WEAKER, trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG, trainerPartyTemplates.FIVE_WEAKER)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.CATERPIE, Species.PICHU, Species.SANDSHREW, Species.LEDYBA, Species.BUDEW, Species.BURMY, Species.WOOLOO, Species.PAWMI, Species.SMOLIV],
      [TrainerPoolTier.UNCOMMON]: [Species.EEVEE, Species.CLEFFA, Species.IGGLYBUFF, Species.SWINUB, Species.WOOPER, Species.DRIFLOON, Species.DEDENNE, Species.STUFFUL],
      [TrainerPoolTier.RARE]: [Species.RALTS, Species.RIOLU, Species.JOLTIK, Species.TANDEMAUS],
      [TrainerPoolTier.SUPER_RARE]: [Species.DARUMAKA, Species.TINKATINK],
    }),
  [TrainerType.PSYCHIC]: new TrainerConfig(++t).setHasGenders("Psychic Female").setHasDouble("Psychics").setMoneyMultiplier(1.4).setEncounterBgm(TrainerType.PSYCHIC)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG, trainerPartyTemplates.TWO_WEAK_SAME_TWO_WEAK_SAME, trainerPartyTemplates.ONE_STRONGER)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.ABRA, Species.DROWZEE, Species.RALTS, Species.SPOINK, Species.GOTHITA, Species.SOLOSIS, Species.BLIPBUG, Species.ESPURR, Species.HATENNA],
      [TrainerPoolTier.UNCOMMON]: [Species.MIME_JR, Species.EXEGGCUTE, Species.MEDITITE, Species.NATU, Species.EXEGGCUTE, Species.WOOBAT, Species.INKAY, Species.ORANGURU],
      [TrainerPoolTier.RARE]: [Species.ELGYEM, Species.SIGILYPH, Species.BALTOY, Species.GIRAFARIG, Species.MEOWSTIC],
      [TrainerPoolTier.SUPER_RARE]: [Species.BELDUM, Species.ESPEON, Species.STANTLER],
    }),
  [TrainerType.RANGER]: new TrainerConfig(++t).setMoneyMultiplier(1.4).setName("Pokémon Ranger").setEncounterBgm(TrainerType.BACKPACKER).setHasGenders("Pokémon Ranger Female").setHasDouble("Pokémon Rangers")
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.PICHU, Species.GROWLITHE, Species.PONYTA, Species.ZIGZAGOON, Species.SEEDOT, Species.BIDOOF, Species.RIOLU, Species.SEWADDLE, Species.SKIDDO, Species.SALANDIT, Species.YAMPER],
      [TrainerPoolTier.UNCOMMON]: [Species.AZURILL, Species.TAUROS, Species.MAREEP, Species.FARFETCHD, Species.TEDDIURSA, Species.SHROOMISH, Species.ELECTRIKE, Species.BUDEW, Species.BUIZEL, Species.MUDBRAY, Species.STUFFUL],
      [TrainerPoolTier.RARE]: [Species.EEVEE, Species.SCYTHER, Species.KANGASKHAN, Species.RALTS, Species.MUNCHLAX, Species.ZORUA, Species.PALDEA_TAUROS, Species.TINKATINK, Species.CYCLIZAR, Species.FLAMIGO],
      [TrainerPoolTier.SUPER_RARE]: [Species.LARVESTA],
    }),
  [TrainerType.RICH]: new TrainerConfig(++t).setMoneyMultiplier(5).setName("Gentleman").setHasGenders("Madame").setHasDouble("Rich Couple"),
  [TrainerType.RICH_KID]: new TrainerConfig(++t).setMoneyMultiplier(3.75).setName("Rich Boy").setHasGenders("Lady").setHasDouble("Rich Kids").setEncounterBgm(TrainerType.RICH),
  [TrainerType.ROUGHNECK]: new TrainerConfig(++t).setMoneyMultiplier(1.4).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.DARK)),
  [TrainerType.SAILOR]: new TrainerConfig(++t).setMoneyMultiplier(1.4).setEncounterBgm(TrainerType.BACKPACKER).setSpeciesFilter(s => s.isOfType(Type.WATER) || s.isOfType(Type.FIGHTING)),
  [TrainerType.SCIENTIST]: new TrainerConfig(++t).setHasGenders("Scientist Female").setHasDouble("Scientists").setMoneyMultiplier(1.7).setEncounterBgm(TrainerType.SCIENTIST)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.MAGNEMITE, Species.GRIMER, Species.DROWZEE, Species.VOLTORB, Species.KOFFING],
      [TrainerPoolTier.UNCOMMON]: [Species.BALTOY, Species.BRONZOR, Species.FERROSEED, Species.KLINK, Species.CHARJABUG, Species.BLIPBUG, Species.HELIOPTILE],
      [TrainerPoolTier.RARE]: [Species.ABRA, Species.DITTO, Species.PORYGON, Species.ELEKID, Species.SOLOSIS, Species.GALAR_WEEZING],
      [TrainerPoolTier.SUPER_RARE]: [Species.OMANYTE, Species.KABUTO, Species.AERODACTYL, Species.LILEEP, Species.ANORITH, Species.CRANIDOS, Species.SHIELDON, Species.TIRTOUGA, Species.ARCHEN, Species.ARCTOVISH, Species.ARCTOZOLT, Species.DRACOVISH, Species.DRACOZOLT],
      [TrainerPoolTier.ULTRA_RARE]: [Species.ROTOM, Species.MELTAN]
    }),
  [TrainerType.SMASHER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.SNOW_WORKER]: new TrainerConfig(++t).setName("Worker").setHasGenders("Worker Female").setHasDouble("Workers").setMoneyMultiplier(1.7).setEncounterBgm(TrainerType.CLERK).setSpeciesFilter(s => s.isOfType(Type.ICE) || s.isOfType(Type.STEEL)),
  [TrainerType.STRIKER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.SCHOOL_KID]: new TrainerConfig(++t).setMoneyMultiplier(0.75).setEncounterBgm(TrainerType.YOUNGSTER).setHasGenders("School Kid Female", "lass").setHasDouble("School Kids")
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.ODDISH, Species.EXEGGCUTE, Species.TEDDIURSA, Species.WURMPLE, Species.RALTS, Species.SHROOMISH, Species.FLETCHLING],
      [TrainerPoolTier.UNCOMMON]: [Species.VOLTORB, Species.WHISMUR, Species.MEDITITE, Species.MIME_JR, Species.NYMBLE],
      [TrainerPoolTier.RARE]: [Species.TANGELA, Species.EEVEE, Species.YANMA],
      [TrainerPoolTier.SUPER_RARE]: [Species.TADBULB]
    }),
  [TrainerType.SWIMMER]: new TrainerConfig(++t).setMoneyMultiplier(1.3).setEncounterBgm(TrainerType.PARASOL_LADY).setHasGenders("Swimmer Female").setHasDouble("Swimmers").setSpecialtyTypes(Type.WATER).setSpeciesFilter(s => s.isOfType(Type.WATER)),
  [TrainerType.TWINS]: new TrainerConfig(++t).setDoubleOnly().setMoneyMultiplier(0.65).setUseSameSeedForAllMembers()
    .setPartyTemplateFunc(scene => getWavePartyTemplate(scene, trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_STRONG))
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.PLUSLE, Species.VOLBEAT, Species.PACHIRISU, Species.SILCOON, Species.METAPOD, Species.IGGLYBUFF, Species.PETILIL, Species.EEVEE]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.MINUN, Species.ILLUMISE, Species.EMOLGA, Species.CASCOON, Species.KAKUNA, Species.CLEFFA, Species.COTTONEE, Species.EEVEE], TrainerSlot.TRAINER_PARTNER))
    .setEncounterBgm(TrainerType.TWINS),
  [TrainerType.VETERAN]: new TrainerConfig(++t).setHasGenders("Veteran Female").setHasDouble("Veteran Duo").setMoneyMultiplier(2.5).setEncounterBgm(TrainerType.ACE_TRAINER).setSpeciesFilter(s => s.isOfType(Type.DRAGON)),
  [TrainerType.WAITER]: new TrainerConfig(++t).setHasGenders("Waitress").setHasDouble("Restaurant Staff").setMoneyMultiplier(1.5).setEncounterBgm(TrainerType.CLERK)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.CLEFFA, Species.CHATOT, Species.PANSAGE, Species.PANSEAR, Species.PANPOUR, Species.MINCCINO],
      [TrainerPoolTier.UNCOMMON]: [Species.TROPIUS, Species.PETILIL, Species.BOUNSWEET, Species.INDEEDEE],
      [TrainerPoolTier.RARE]: [Species.APPLIN, Species.SINISTEA, Species.POLTCHAGEIST]
    }),
  [TrainerType.WORKER]: new TrainerConfig(++t).setHasGenders("Worker Female").setHasDouble("Workers").setEncounterBgm(TrainerType.CLERK).setMoneyMultiplier(1.7).setSpeciesFilter(s => s.isOfType(Type.ROCK) || s.isOfType(Type.STEEL)),
  [TrainerType.YOUNGSTER]: new TrainerConfig(++t).setMoneyMultiplier(0.5).setEncounterBgm(TrainerType.YOUNGSTER).setHasGenders("Lass", "lass").setHasDouble("Beginners").setPartyTemplates(trainerPartyTemplates.TWO_WEAKER)
    .setSpeciesPools(
      [Species.CATERPIE, Species.WEEDLE, Species.RATTATA, Species.SENTRET, Species.POOCHYENA, Species.ZIGZAGOON, Species.WURMPLE, Species.BIDOOF, Species.PATRAT, Species.LILLIPUP]
    ),
  [TrainerType.ROCKET_GRUNT]: new TrainerConfig(++t).setHasGenders("Rocket Grunt Female").setHasDouble("Rocket Grunts").setMoneyMultiplier(1.0).setEncounterBgm(TrainerType.PLASMA_GRUNT).setBattleBgm("battle_plasma_grunt").setPartyTemplateFunc(scene => getEvilGruntPartyTemplate(scene))
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.WEEDLE, Species.RATTATA, Species.EKANS, Species.SANDSHREW, Species.ZUBAT, Species.GEODUDE, Species.KOFFING],
      [TrainerPoolTier.UNCOMMON]: [Species.GRIMER, Species.CUBONE, Species.ODDISH, Species.GROWLITHE, Species.MURKROW, Species.GASTLY, Species.EXEGGCUTE, Species.VOLTORB],
      [TrainerPoolTier.RARE]: [Species.GYARADOS, Species.TAUROS, Species.SCYTHER],
      [TrainerPoolTier.SUPER_RARE]: [Species.PORYGON, Species.ALOLA_RATTATA, Species.ALOLA_SANDSHREW, Species.ALOLA_MEOWTH, Species.ALOLA_GRIMER, Species.ALOLA_GEODUDE],
      [TrainerPoolTier.ULTRA_RARE]: [Species.DRATINI, Species.LARVITAR]
    }),
  [TrainerType.MAGMA_GRUNT]: new TrainerConfig(++t).setHasGenders("Magma Grunt Female").setHasDouble("Magma Grunts").setMoneyMultiplier(1.0).setEncounterBgm(TrainerType.PLASMA_GRUNT).setBattleBgm("battle_plasma_grunt").setPartyTemplateFunc(scene => getEvilGruntPartyTemplate(scene))
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [Species.SLUGMA, Species.POOCHYENA, Species.NUMEL, Species.ZIGZAGOON, Species.DIGLETT, Species.MAGBY],
      [TrainerPoolTier.UNCOMMON]: [Species.PHANPY, Species.SWINUB, Species.GLIGAR, Species.TORKOAL, Species.BALTOY, Species.BARBOACH],
      [TrainerPoolTier.RARE]: [Species.SOLROCK, Species.HIPPOPOTAS, Species.SANDACONDA],
      [TrainerPoolTier.SUPER_RARE]: [Species.TRAPINCH, Species.HEATMOR],
      [TrainerPoolTier.ULTRA_RARE]: [Species.TURTONATOR, Species.CHARCADET]
    }),
  [TrainerType.AQUA_GRUNT]: new TrainerConfig(++t).setHasGenders("Aqua Grunt Female").setHasDouble("Aqua Grunts").setMoneyMultiplier(1.0).setEncounterBgm(TrainerType.PLASMA_GRUNT).setBattleBgm("battle_plasma_grunt").setPartyTemplateFunc(scene => getEvilGruntPartyTemplate(scene))
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.CARVANHA, Species.WAILMER, Species.ZIGZAGOON, Species.LOTAD, Species.CORPHISH],
      [TrainerPoolTier.UNCOMMON]: [Species.SPHEAL, Species.CHINCHOU, Species.WOOPER, Species.WINGULL, Species.TENTACOOL ],
      [TrainerPoolTier.RARE]: [Species.CLAMPERL, Species.REMORAID, Species.ARROKUDA],
      [TrainerPoolTier.SUPER_RARE]: [Species.MANTINE, Species.BASCULEGION],
      [TrainerPoolTier.ULTRA_RARE]: [Species.DONDOZO]
    }),
  [TrainerType.GALACTIC_GRUNT]: new TrainerConfig(++t).setHasGenders("Galactic Grunt Female").setHasDouble("Galactic Grunts").setMoneyMultiplier(1.0).setEncounterBgm(TrainerType.PLASMA_GRUNT).setBattleBgm("battle_plasma_grunt").setPartyTemplateFunc(scene => getEvilGruntPartyTemplate(scene))
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.GLAMEOW, Species.STUNKY, Species.CROAGUNK, Species.SHINX, Species.WURMPLE],
      [TrainerPoolTier.UNCOMMON]: [Species.BRONZOR, Species.DRIFLOON, Species.BURMY],
      [TrainerPoolTier.RARE]: [Species.CARNIVINE],
      [TrainerPoolTier.SUPER_RARE]: [Species.HISUI_GROWLITHE, Species.HISUI_QWILFISH, Species.HISUI_SNEASEL],
      [TrainerPoolTier.ULTRA_RARE]: [Species.HISUI_ZORUA, Species.HISUI_SLIGGOO]
    }),
  [TrainerType.PLASMA_GRUNT]: new TrainerConfig(++t).setHasGenders("Plasma Grunt Female").setHasDouble("Plasma Grunts").setMoneyMultiplier(1.0).setEncounterBgm(TrainerType.PLASMA_GRUNT).setBattleBgm("battle_plasma_grunt").setPartyTemplateFunc(scene => getEvilGruntPartyTemplate(scene))
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.PATRAT, Species.LILLIPUP, Species.PURRLOIN, Species.SCRAFTY, Species.WOOBAT, Species.VANILLITE],
      [TrainerPoolTier.UNCOMMON]: [ Species.FRILLISH, Species.VENIPEDE, Species.SANDILE, Species.TRUBBISH, Species.GOLETT],
      [TrainerPoolTier.RARE]: [Species.TIMBURR, Species.DARUMAKA, Species.AMOONGUSS, Species.DRILBUR, Species.KLINK, Species.VULLABY],
      [TrainerPoolTier.SUPER_RARE]: [Species.PAWNIARD, Species.VULLABY, Species.DRUDDIGON, Species.BOUFFALANT, Species.ZORUA],
      [TrainerPoolTier.ULTRA_RARE]: [Species.AXEW, Species.DEINO, Species.DURANT]
    }),
  [TrainerType.FLARE_GRUNT]: new TrainerConfig(++t).setHasGenders("Flare Grunt Female").setHasDouble("Flare Grunts").setMoneyMultiplier(1.0).setEncounterBgm(TrainerType.PLASMA_GRUNT).setBattleBgm("battle_plasma_grunt").setPartyTemplateFunc(scene => getEvilGruntPartyTemplate(scene))
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.FLETCHLING, Species.LITLEO, Species.PONYTA, Species.INKAY, Species.HOUNDOUR, Species.SKORUPI],
      [TrainerPoolTier.UNCOMMON]: [Species.HELIOPTILE, Species.ELECTRIKE, Species.SKRELP, Species.GULPIN],
      [TrainerPoolTier.RARE]: [Species.LITWICK, Species.SNEASEL],
      [TrainerPoolTier.SUPER_RARE]: [Species.NOIVERN],
      [TrainerPoolTier.ULTRA_RARE]: []
    }),
  [TrainerType.BROCK]: new TrainerConfig((t = TrainerType.BROCK)).initForGymLeader(signatureSpecies["BROCK"],true, Type.ROCK).setBattleBgm("battle_kanto_gym").setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.MISTY]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["MISTY"],false, Type.WATER).setBattleBgm("battle_kanto_gym").setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.LT_SURGE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["LT_SURGE"],true, Type.ELECTRIC).setBattleBgm("battle_kanto_gym").setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.ERIKA]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["ERIKA"],false, Type.GRASS).setBattleBgm("battle_kanto_gym").setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.JANINE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["JANINE"],false, Type.POISON).setBattleBgm("battle_kanto_gym").setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.SABRINA]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["SABRINA"],false, Type.PSYCHIC).setBattleBgm("battle_kanto_gym").setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.BLAINE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["BLAINE"],true, Type.FIRE).setBattleBgm("battle_kanto_gym").setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.GIOVANNI]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["GIOVANNI"],true, Type.DARK).setBattleBgm("battle_kanto_gym").setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.FALKNER]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["FALKNER"],true, Type.FLYING).setBattleBgm("battle_johto_gym").setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.BUGSY]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["BUGSY"],true, Type.BUG).setBattleBgm("battle_johto_gym").setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.WHITNEY]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["WHITNEY"],false, Type.NORMAL).setBattleBgm("battle_johto_gym").setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.MORTY]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["MORTY"],true, Type.GHOST).setBattleBgm("battle_johto_gym").setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.CHUCK]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["CHUCK"],true, Type.FIGHTING).setBattleBgm("battle_johto_gym").setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.JASMINE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["JASMINE"],false, Type.STEEL).setBattleBgm("battle_johto_gym").setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.PRYCE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["PRYCE"],true, Type.ICE).setBattleBgm("battle_johto_gym").setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.CLAIR]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["CLAIR"],false, Type.DRAGON).setBattleBgm("battle_johto_gym").setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.ROXANNE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["ROXANNE"],false, Type.ROCK).setBattleBgm("battle_hoenn_gym").setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.BRAWLY]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["BRAWLY"],true, Type.FIGHTING).setBattleBgm("battle_hoenn_gym").setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.WATTSON]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["WATTSON"],true, Type.ELECTRIC).setBattleBgm("battle_hoenn_gym").setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.FLANNERY]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["FLANNERY"],false, Type.FIRE).setBattleBgm("battle_hoenn_gym").setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.NORMAN]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["NORMAN"],true, Type.NORMAL).setBattleBgm("battle_hoenn_gym").setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.WINONA]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["WINONA"],false, Type.FLYING).setBattleBgm("battle_hoenn_gym").setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.TATE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["TATE"],true, Type.PSYCHIC).setBattleBgm("battle_hoenn_gym").setMixedBattleBgm("battle_hoenn_gym").setHasDouble("tate_liza_double").setDoubleTrainerType(TrainerType.LIZA).setDoubleTitle("gym_leader_double"),
  [TrainerType.LIZA]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["LIZA"],false, Type.PSYCHIC).setBattleBgm("battle_hoenn_gym").setMixedBattleBgm("battle_hoenn_gym").setHasDouble("liza_tate_double").setDoubleTrainerType(TrainerType.TATE).setDoubleTitle("gym_leader_double"),
  [TrainerType.JUAN]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["JUAN"],true, Type.WATER).setBattleBgm("battle_hoenn_gym").setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.ROARK]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["ROARK"],true, Type.ROCK).setBattleBgm("battle_sinnoh_gym").setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.GARDENIA]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["GARDENIA"],false, Type.GRASS).setBattleBgm("battle_sinnoh_gym").setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.MAYLENE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["MAYLENE"],false, Type.FIGHTING).setBattleBgm("battle_sinnoh_gym").setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.CRASHER_WAKE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["CRASHER_WAKE"],true, Type.WATER).setBattleBgm("battle_sinnoh_gym").setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.FANTINA]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["FANTINA"],false, Type.GHOST).setBattleBgm("battle_sinnoh_gym").setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.BYRON]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["BYRON"],true, Type.STEEL).setBattleBgm("battle_sinnoh_gym").setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.CANDICE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["CANDICE"],false, Type.ICE).setBattleBgm("battle_sinnoh_gym").setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.VOLKNER]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["VOLKNER"],true, Type.ELECTRIC).setBattleBgm("battle_sinnoh_gym").setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.CILAN]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["CILAN"],true, Type.GRASS).setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.CHILI]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["CHILI"],true, Type.FIRE).setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.CRESS]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["CRESS"],true, Type.WATER).setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.CHEREN]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["CHEREN"],true, Type.NORMAL).setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.LENORA]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["LENORA"],false, Type.NORMAL).setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.ROXIE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["ROXIE"],false, Type.POISON).setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.BURGH]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["BURGH"],true, Type.BUG).setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.ELESA]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["ELESA"],false, Type.ELECTRIC).setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.CLAY]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["CLAY"],true, Type.GROUND).setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.SKYLA]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["SKYLA"],false, Type.FLYING).setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.BRYCEN]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["BRYCEN"],true, Type.ICE).setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.DRAYDEN]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["DRAYDEN"],true, Type.DRAGON).setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.MARLON]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["MARLON"],true, Type.WATER).setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.VIOLA]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["VIOLA"],false, Type.BUG).setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.GRANT]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["GRANT"],true, Type.ROCK).setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.KORRINA]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["KORRINA"],false, Type.FIGHTING).setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.RAMOS]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["RAMOS"],true, Type.GRASS).setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.CLEMONT]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["CLEMONT"],true, Type.ELECTRIC).setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.VALERIE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["VALERIE"],false, Type.FAIRY).setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.OLYMPIA]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["OLYMPIA"],false, Type.PSYCHIC).setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.WULFRIC]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["WULFRIC"],true, Type.ICE).setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.MILO]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["MILO"],true, Type.GRASS).setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.NESSA]: new TrainerConfig(++t).setName("Nessa").initForGymLeader(signatureSpecies["NESSA"],false, Type.WATER).setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.KABU]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["KABU"],true, Type.FIRE).setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.BEA]: new TrainerConfig(++t).setName("Bea").initForGymLeader(signatureSpecies["BEA"],false, Type.FIGHTING).setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.ALLISTER]: new TrainerConfig(++t).setName("Allister").initForGymLeader(signatureSpecies["ALLISTER"],true, Type.GHOST).setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.OPAL]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["OPAL"],false, Type.FAIRY).setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.BEDE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["BEDE"],true, Type.FAIRY).setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.GORDIE]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["GORDIE"],true, Type.ROCK).setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.MELONY]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["MELONY"],false, Type.ICE).setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.PIERS]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["PIERS"],true, Type.DARK).setHasDouble("piers_marnie_double").setDoubleTrainerType(TrainerType.MARNIE).setDoubleTitle("gym_leader_double").setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.MARNIE]: new TrainerConfig(++t).setName("Marnie").initForGymLeader(signatureSpecies["MARNIE"],false, Type.DARK).setHasDouble("marnie_piers_double").setDoubleTrainerType(TrainerType.PIERS).setDoubleTitle("gym_leader_double").setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.RAIHAN]: new TrainerConfig(++t).setName("Raihan").initForGymLeader(signatureSpecies["RAIHAN"],true, Type.DRAGON).setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.KATY]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["KATY"],false, Type.BUG).setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.BRASSIUS]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["BRASSIUS"],true, Type.GRASS).setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.IONO]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["IONO"],false, Type.ELECTRIC).setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.KOFU]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["KOFU"],true, Type.WATER).setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.LARRY]: new TrainerConfig(++t).setName("Larry").initForGymLeader(signatureSpecies["LARRY"],true, Type.NORMAL).setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.RYME]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["RYME"],false, Type.GHOST).setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.TULIP]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["TULIP"],false, Type.PSYCHIC).setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.GRUSHA]: new TrainerConfig(++t).initForGymLeader(signatureSpecies["GRUSHA"],true, Type.ICE).setMixedBattleBgm("battle_paldea_gym"),

  [TrainerType.LORELEI]: new TrainerConfig((t = TrainerType.LORELEI)).initForEliteFour(signatureSpecies["LORELEI"],false, Type.ICE).setBattleBgm("battle_kanto_gym").setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.BRUNO]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["BRUNO"], true, Type.FIGHTING).setBattleBgm("battle_kanto_gym").setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.AGATHA]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["AGATHA"], false,Type.GHOST).setBattleBgm("battle_kanto_gym").setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.LANCE]: new TrainerConfig(++t).setName("Lance").initForEliteFour(signatureSpecies["LANCE"],true, Type.DRAGON).setBattleBgm("battle_kanto_gym").setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.WILL]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["WILL"],true, Type.PSYCHIC).setBattleBgm("battle_johto_gym").setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.KOGA]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["KOGA"], true, Type.POISON).setBattleBgm("battle_johto_gym").setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.KAREN]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["KAREN"],false, Type.DARK).setBattleBgm("battle_johto_gym").setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.SIDNEY]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["SIDNEY"],true, Type.DARK).setMixedBattleBgm("battle_hoenn_elite"),
  [TrainerType.PHOEBE]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["PHOEBE"],false, Type.GHOST).setMixedBattleBgm("battle_hoenn_elite"),
  [TrainerType.GLACIA]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["GLACIA"],false, Type.ICE).setMixedBattleBgm("battle_hoenn_elite"),
  [TrainerType.DRAKE]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["DRAKE"],true, Type.DRAGON).setMixedBattleBgm("battle_hoenn_elite"),
  [TrainerType.AARON]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["AARON"],true, Type.BUG).setBattleBgm("battle_sinnoh_gym").setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.BERTHA]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["BERTHA"],false, Type.GROUND).setBattleBgm("battle_sinnoh_gym").setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.FLINT]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["FLINT"],true, Type.FIRE).setBattleBgm("battle_sinnoh_gym").setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.LUCIAN]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["LUCIAN"], true,Type.PSYCHIC).setBattleBgm("battle_sinnoh_gym").setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.SHAUNTAL]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["SHAUNTAL"],false, Type.GHOST).setMixedBattleBgm("battle_unova_elite"),
  [TrainerType.MARSHAL]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["MARSHAL"],true, Type.FIGHTING).setMixedBattleBgm("battle_unova_elite"),
  [TrainerType.GRIMSLEY]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["GRIMSLEY"],true, Type.DARK).setMixedBattleBgm("battle_unova_elite"),
  [TrainerType.CAITLIN]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["CAITLIN"],false, Type.PSYCHIC).setMixedBattleBgm("battle_unova_elite"),
  [TrainerType.MALVA]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["MALVA"], false,Type.FIRE).setMixedBattleBgm("battle_kalos_elite"),
  [TrainerType.SIEBOLD]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["SIEBOLD"], true,Type.WATER).setMixedBattleBgm("battle_kalos_elite"),
  [TrainerType.WIKSTROM]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["WIKSTROM"],true, Type.STEEL).setMixedBattleBgm("battle_kalos_elite"),
  [TrainerType.DRASNA]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["DRASNA"],false, Type.DRAGON).setMixedBattleBgm("battle_kalos_elite"),
  [TrainerType.HALA]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["HALA"],true, Type.FIGHTING).setMixedBattleBgm("battle_alola_elite"),
  [TrainerType.MOLAYNE]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["MOLAYNE"],true, Type.STEEL).setMixedBattleBgm("battle_alola_elite"),
  [TrainerType.OLIVIA]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["OLIVIA"],false, Type.ROCK).setMixedBattleBgm("battle_alola_elite"),
  [TrainerType.ACEROLA]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["ACEROLA"],false, Type.GHOST).setMixedBattleBgm("battle_alola_elite"),
  [TrainerType.KAHILI]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["KAHILI"],false, Type.FLYING).setMixedBattleBgm("battle_alola_elite"),
  [TrainerType.MARNIE_ELITE]: new TrainerConfig(++t).setName("Marnie").initForEliteFour(signatureSpecies["MARNIE_ELITE"],false, Type.DARK).setMixedBattleBgm("battle_galar_elite"),
  [TrainerType.NESSA_ELITE]: new TrainerConfig(++t).setName("Nessa").initForEliteFour(signatureSpecies["NESSA_ELITE"],false, Type.WATER).setMixedBattleBgm("battle_galar_elite"),
  [TrainerType.BEA_ELITE]: new TrainerConfig(++t).setName("Bea").initForEliteFour(signatureSpecies["BEA_ELITE"],false, Type.FIGHTING).setMixedBattleBgm("battle_galar_elite"),
  [TrainerType.ALLISTER_ELITE]: new TrainerConfig(++t).setName("Allister").initForEliteFour(signatureSpecies["ALLISTER_ELITE"],true, Type.GHOST).setMixedBattleBgm("battle_galar_elite"),
  [TrainerType.RAIHAN_ELITE]: new TrainerConfig(++t).setName("Raihan").initForEliteFour(signatureSpecies["RAIHAN_ELITE"],true, Type.DRAGON).setMixedBattleBgm("battle_galar_elite"),
  [TrainerType.RIKA]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["RIKA"],false, Type.GROUND).setMixedBattleBgm("battle_paldea_elite"),
  [TrainerType.POPPY]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["POPPY"],false, Type.STEEL).setMixedBattleBgm("battle_paldea_elite"),
  [TrainerType.LARRY_ELITE]: new TrainerConfig(++t).setName("Larry").initForEliteFour(signatureSpecies["LARRY_ELITE"],true, Type.NORMAL, Type.FLYING).setMixedBattleBgm("battle_paldea_elite"),
  [TrainerType.HASSEL]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["HASSEL"],true, Type.DRAGON).setMixedBattleBgm("battle_paldea_elite"),
  [TrainerType.CRISPIN]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["CRISPIN"],true, Type.FIRE).setMixedBattleBgm("battle_bb_elite"),
  [TrainerType.AMARYS]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["AMARYS"],false, Type.STEEL).setMixedBattleBgm("battle_bb_elite"),
  [TrainerType.LACEY]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["LACEY"],false, Type.FAIRY).setMixedBattleBgm("battle_bb_elite"),
  [TrainerType.DRAYTON]: new TrainerConfig(++t).initForEliteFour(signatureSpecies["DRAYTON"],true, Type.DRAGON).setMixedBattleBgm("battle_bb_elite"),

  [TrainerType.BLUE]: new TrainerConfig((t = TrainerType.BLUE)).initForChampion(signatureSpecies["BLUE"],true).setBattleBgm("battle_kanto_champion").setMixedBattleBgm("battle_kanto_champion").setHasDouble("blue_red_double").setDoubleTrainerType(TrainerType.RED).setDoubleTitle("champion_double")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.ALAKAZAM], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.PIDGEOT], TrainerSlot.TRAINER, true, p => {
      p.formIndex = 1;
      p.generateAndPopulateMoveset();
    })),
  [TrainerType.RED]: new TrainerConfig(++t).initForChampion(signatureSpecies["RED"],true).setBattleBgm("battle_johto_champion").setMixedBattleBgm("battle_johto_champion").setHasDouble("red_blue_double").setDoubleTrainerType(TrainerType.BLUE).setDoubleTitle("champion_double")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.PIKACHU], TrainerSlot.TRAINER, true, p => {
      p.formIndex = 8;
      p.generateAndPopulateMoveset();
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE], TrainerSlot.TRAINER, true, p => {
      p.formIndex = 1;
      p.generateAndPopulateMoveset();
    })),
  [TrainerType.LANCE_CHAMPION]: new TrainerConfig(++t).setName("Lance").initForChampion(signatureSpecies["LANCE_CHAMPION"],true).setBattleBgm("battle_johto_champion").setMixedBattleBgm("battle_johto_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.AERODACTYL], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.LATIAS, Species.LATIOS], TrainerSlot.TRAINER, true, p => {
      p.formIndex = 1;
      p.generateAndPopulateMoveset();
    })),
  [TrainerType.STEVEN]: new TrainerConfig(++t).initForChampion(signatureSpecies["STEVEN"],true).setBattleBgm("battle_hoenn_champion").setMixedBattleBgm("battle_hoenn_champion").setHasDouble("steven_wallace_double").setDoubleTrainerType(TrainerType.WALLACE).setDoubleTitle("champion_double")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.SKARMORY], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.METAGROSS], TrainerSlot.TRAINER, true, p => {
      p.formIndex = 1;
      p.generateAndPopulateMoveset();
    })),
  [TrainerType.WALLACE]: new TrainerConfig(++t).initForChampion(signatureSpecies["WALLACE"],true).setBattleBgm("battle_hoenn_champion").setMixedBattleBgm("battle_hoenn_champion").setHasDouble("wallace_steven_double").setDoubleTrainerType(TrainerType.STEVEN).setDoubleTitle("champion_double")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.PELIPPER], TrainerSlot.TRAINER, true, p => {
      p.abilityIndex = 1; // Drizzle
      p.generateAndPopulateMoveset();
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.SWAMPERT], TrainerSlot.TRAINER, true, p => {
      p.formIndex = 1;
      p.generateAndPopulateMoveset();
    })),
  [TrainerType.CYNTHIA]: new TrainerConfig(++t).initForChampion(signatureSpecies["CYNTHIA"],false).setBattleBgm("battle_sinnoh_champion").setMixedBattleBgm("battle_sinnoh_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.SPIRITOMB], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.GARCHOMP], TrainerSlot.TRAINER, true, p => {
      p.formIndex = 1;
      p.generateAndPopulateMoveset();
    })),
  [TrainerType.ALDER]: new TrainerConfig(++t).initForChampion(signatureSpecies["ALDER"],true).setHasDouble("alder_iris_double").setDoubleTrainerType(TrainerType.IRIS).setDoubleTitle("champion_double").setBattleBgm("battle_champion_alder").setMixedBattleBgm("battle_champion_alder")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.BOUFFALANT, Species.BRAVIARY], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
    })),
  [TrainerType.IRIS]: new TrainerConfig(++t).initForChampion(signatureSpecies["IRIS"],false).setBattleBgm("battle_champion_iris").setMixedBattleBgm("battle_champion_iris").setHasDouble("iris_alder_double").setDoubleTrainerType(TrainerType.ALDER).setDoubleTitle("champion_double")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.DRUDDIGON], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.LAPRAS], TrainerSlot.TRAINER, true, p => {
      p.formIndex = 1;
      p.generateAndPopulateMoveset();
    })),
  [TrainerType.DIANTHA]: new TrainerConfig(++t).initForChampion(signatureSpecies["DIANTHA"],false).setMixedBattleBgm("battle_kalos_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.GOURGEIST], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.GARDEVOIR], TrainerSlot.TRAINER, true, p => {
      p.formIndex = 1;
      p.generateAndPopulateMoveset();
    })),
  [TrainerType.HAU]: new TrainerConfig(++t).initForChampion(signatureSpecies["HAU"],true).setMixedBattleBgm("battle_alola_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.ALOLA_RAICHU], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
    })),
  [TrainerType.LEON]: new TrainerConfig(++t).initForChampion(signatureSpecies["LEON"],true).setMixedBattleBgm("battle_galar_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.RILLABOOM, Species.CINDERACE, Species.INTELEON], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.CHARIZARD], TrainerSlot.TRAINER, true, p => {
      p.formIndex = 3;
      p.generateAndPopulateMoveset();
    })),
  [TrainerType.GEETA]: new TrainerConfig(++t).initForChampion(signatureSpecies["GEETA"],false).setMixedBattleBgm("battle_champion_geeta")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.GLIMMORA], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
    })),
  [TrainerType.NEMONA]: new TrainerConfig(++t).initForChampion(signatureSpecies["NEMONA"],false).setMixedBattleBgm("battle_champion_nemona")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.LYCANROC], TrainerSlot.TRAINER, true, p => {
      p.formIndex = 0; // Midday form
      p.generateAndPopulateMoveset();
    })),
  [TrainerType.KIERAN]: new TrainerConfig(++t).initForChampion(signatureSpecies["KIERAN"],true).setMixedBattleBgm("battle_champion_kieran")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.POLIWRATH, Species.POLITOED], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
    })),

  [TrainerType.RIVAL]: new TrainerConfig((t = TrainerType.RIVAL)).setName("Finn").setHasGenders("Ivy").setHasCharSprite().setTitle("Rival").setStaticParty().setEncounterBgm(TrainerType.RIVAL).setBattleBgm("battle_rival").setMixedBattleBgm("battle_rival").setPartyTemplates(trainerPartyTemplates.RIVAL)
    .setModifierRewardFuncs(() => modifierTypes.SUPER_EXP_CHARM, () => modifierTypes.EXP_SHARE)
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE, Species.CHIKORITA, Species.CYNDAQUIL, Species.TOTODILE, Species.TREECKO, Species.TORCHIC, Species.MUDKIP, Species.TURTWIG, Species.CHIMCHAR, Species.PIPLUP, Species.SNIVY, Species.TEPIG, Species.OSHAWOTT, Species.CHESPIN, Species.FENNEKIN, Species.FROAKIE, Species.ROWLET, Species.LITTEN, Species.POPPLIO, Species.GROOKEY, Species.SCORBUNNY, Species.SOBBLE, Species.SPRIGATITO, Species.FUECOCO, Species.QUAXLY], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.PIDGEY, Species.HOOTHOOT, Species.TAILLOW, Species.STARLY, Species.PIDOVE, Species.FLETCHLING, Species.PIKIPEK, Species.ROOKIDEE, Species.WATTREL], TrainerSlot.TRAINER, true)),
  [TrainerType.RIVAL_2]: new TrainerConfig(++t).setName("Finn").setHasGenders("Ivy").setHasCharSprite().setTitle("Rival").setStaticParty().setMoneyMultiplier(1.25).setEncounterBgm(TrainerType.RIVAL).setBattleBgm("battle_rival").setMixedBattleBgm("battle_rival").setPartyTemplates(trainerPartyTemplates.RIVAL_2)
    .setModifierRewardFuncs(() => modifierTypes.EXP_SHARE)
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.IVYSAUR, Species.CHARMELEON, Species.WARTORTLE, Species.BAYLEEF, Species.QUILAVA, Species.CROCONAW, Species.GROVYLE, Species.COMBUSKEN, Species.MARSHTOMP, Species.GROTLE, Species.MONFERNO, Species.PRINPLUP, Species.SERVINE, Species.PIGNITE, Species.DEWOTT, Species.QUILLADIN, Species.BRAIXEN, Species.FROGADIER, Species.DARTRIX, Species.TORRACAT, Species.BRIONNE, Species.THWACKEY, Species.RABOOT, Species.DRIZZILE, Species.FLORAGATO, Species.CROCALOR, Species.QUAXWELL], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.PIDGEOTTO, Species.HOOTHOOT, Species.TAILLOW, Species.STARAVIA, Species.TRANQUILL, Species.FLETCHINDER, Species.TRUMBEAK, Species.CORVISQUIRE, Species.WATTREL], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450)),
  [TrainerType.RIVAL_3]: new TrainerConfig(++t).setName("Finn").setHasGenders("Ivy").setHasCharSprite().setTitle("Rival").setStaticParty().setMoneyMultiplier(1.5).setEncounterBgm(TrainerType.RIVAL).setBattleBgm("battle_rival").setMixedBattleBgm("battle_rival").setPartyTemplates(trainerPartyTemplates.RIVAL_3)
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE, Species.MEGANIUM, Species.TYPHLOSION, Species.FERALIGATR, Species.SCEPTILE, Species.BLAZIKEN, Species.SWAMPERT, Species.TORTERRA, Species.INFERNAPE, Species.EMPOLEON, Species.SERPERIOR, Species.EMBOAR, Species.SAMUROTT, Species.CHESNAUGHT, Species.DELPHOX, Species.GRENINJA, Species.DECIDUEYE, Species.INCINEROAR, Species.PRIMARINA, Species.RILLABOOM, Species.CINDERACE, Species.INTELEON, Species.MEOWSCARADA, Species.SKELEDIRGE, Species.QUAQUAVAL], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.PIDGEOT, Species.NOCTOWL, Species.SWELLOW, Species.STARAPTOR, Species.UNFEZANT, Species.TALONFLAME, Species.TOUCANNON, Species.CORVIKNIGHT, Species.KILOWATTREL], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450))
    .setSpeciesFilter(species => species.baseTotal >= 540),
  [TrainerType.RIVAL_4]: new TrainerConfig(++t).setName("Finn").setHasGenders("Ivy").setHasCharSprite().setTitle("Rival").setBoss().setStaticParty().setMoneyMultiplier(1.75).setEncounterBgm(TrainerType.RIVAL).setBattleBgm("battle_rival_2").setMixedBattleBgm("battle_rival_2").setPartyTemplates(trainerPartyTemplates.RIVAL_4)
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE, Species.MEGANIUM, Species.TYPHLOSION, Species.FERALIGATR, Species.SCEPTILE, Species.BLAZIKEN, Species.SWAMPERT, Species.TORTERRA, Species.INFERNAPE, Species.EMPOLEON, Species.SERPERIOR, Species.EMBOAR, Species.SAMUROTT, Species.CHESNAUGHT, Species.DELPHOX, Species.GRENINJA, Species.DECIDUEYE, Species.INCINEROAR, Species.PRIMARINA, Species.RILLABOOM, Species.CINDERACE, Species.INTELEON, Species.MEOWSCARADA, Species.SKELEDIRGE, Species.QUAQUAVAL], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.PIDGEOT, Species.NOCTOWL, Species.SWELLOW, Species.STARAPTOR, Species.UNFEZANT, Species.TALONFLAME, Species.TOUCANNON, Species.CORVIKNIGHT, Species.KILOWATTREL], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450))
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setGenModifiersFunc(party => {
      const starter = party[0];
      return [modifierTypes.TERA_SHARD().generateType(null, [starter.species.type1]).withIdFromFunc(modifierTypes.TERA_SHARD).newModifier(starter) as PersistentModifier];
    }),
  [TrainerType.RIVAL_5]: new TrainerConfig(++t).setName("Finn").setHasGenders("Ivy").setHasCharSprite().setTitle("Rival").setBoss().setStaticParty().setMoneyMultiplier(2.25).setEncounterBgm(TrainerType.RIVAL).setBattleBgm("battle_rival_3").setMixedBattleBgm("battle_rival_3").setPartyTemplates(trainerPartyTemplates.RIVAL_5)
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE, Species.MEGANIUM, Species.TYPHLOSION, Species.FERALIGATR, Species.SCEPTILE, Species.BLAZIKEN, Species.SWAMPERT, Species.TORTERRA, Species.INFERNAPE, Species.EMPOLEON, Species.SERPERIOR, Species.EMBOAR, Species.SAMUROTT, Species.CHESNAUGHT, Species.DELPHOX, Species.GRENINJA, Species.DECIDUEYE, Species.INCINEROAR, Species.PRIMARINA, Species.RILLABOOM, Species.CINDERACE, Species.INTELEON, Species.MEOWSCARADA, Species.SKELEDIRGE, Species.QUAQUAVAL], TrainerSlot.TRAINER, true,
      p => p.setBoss(true, 2)))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.PIDGEOT, Species.NOCTOWL, Species.SWELLOW, Species.STARAPTOR, Species.UNFEZANT, Species.TALONFLAME, Species.TOUCANNON, Species.CORVIKNIGHT, Species.KILOWATTREL], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450))
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([Species.RAYQUAZA], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 3);
      p.pokeball = PokeballType.MASTER_BALL;
      p.shiny = true;
      p.variant = 1;
    }))
    .setGenModifiersFunc(party => {
      const starter = party[0];
      return [modifierTypes.TERA_SHARD().generateType(null, [starter.species.type1]).withIdFromFunc(modifierTypes.TERA_SHARD).newModifier(starter) as PersistentModifier];
    }),
  [TrainerType.RIVAL_6]: new TrainerConfig(++t).setName("Finn").setHasGenders("Ivy").setHasCharSprite().setTitle("Rival").setBoss().setStaticParty().setMoneyMultiplier(3).setEncounterBgm("final").setBattleBgm("battle_rival_3").setMixedBattleBgm("battle_rival_3").setPartyTemplates(trainerPartyTemplates.RIVAL_6)
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE, Species.MEGANIUM, Species.TYPHLOSION, Species.FERALIGATR, Species.SCEPTILE, Species.BLAZIKEN, Species.SWAMPERT, Species.TORTERRA, Species.INFERNAPE, Species.EMPOLEON, Species.SERPERIOR, Species.EMBOAR, Species.SAMUROTT, Species.CHESNAUGHT, Species.DELPHOX, Species.GRENINJA, Species.DECIDUEYE, Species.INCINEROAR, Species.PRIMARINA, Species.RILLABOOM, Species.CINDERACE, Species.INTELEON, Species.MEOWSCARADA, Species.SKELEDIRGE, Species.QUAQUAVAL], TrainerSlot.TRAINER, true,
      p => {
        p.setBoss(true, 3);
        p.generateAndPopulateMoveset();
      }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([Species.PIDGEOT, Species.NOCTOWL, Species.SWELLOW, Species.STARAPTOR, Species.UNFEZANT, Species.TALONFLAME, Species.TOUCANNON, Species.CORVIKNIGHT, Species.KILOWATTREL], TrainerSlot.TRAINER, true,
      p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450))
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([Species.RAYQUAZA], TrainerSlot.TRAINER, true, p => {
      p.setBoss();
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.MASTER_BALL;
      p.shiny = true;
      p.variant = 1;
      p.formIndex = 1;
    }))
    .setGenModifiersFunc(party => {
      const starter = party[0];
      return [modifierTypes.TERA_SHARD().generateType(null, [starter.species.type1]).withIdFromFunc(modifierTypes.TERA_SHARD).newModifier(starter) as PersistentModifier];
    }),

  [TrainerType.ROCKET_BOSS_GIOVANNI_1]: new TrainerConfig(t = TrainerType.ROCKET_BOSS_GIOVANNI_1).setName("Giovanni").initForEvilTeamLeader("Rocket Boss",[])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.PERSIAN , Species.ALOLA_PERSIAN]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.NIDOKING , Species.NIDOQUEEN ]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([ Species.RHYPERIOR ]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([ Species.DUGTRIO, Species.ALOLA_DUGTRIO ]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([ Species.MAROWAK , Species.ALOLA_MAROWAK]))
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.KANGASKHAN ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
      p.formIndex = 1;
    })),
  [TrainerType.ROCKET_BOSS_GIOVANNI_2]: new TrainerConfig(++t).setName("Giovanni").initForEvilTeamLeader("Rocket Boss", [])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.TYRANITAR , Species.IRON_THORNS], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.EXCADRILL ]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([ Species.HIPPOWDON ]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([ Species.KANGASKHAN ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
      p.formIndex = 1;
    }))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([ Species.GASTRODON]))
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.MEWTWO ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.MASTER_BALL;
    })),
  [TrainerType.MAXIE]: new TrainerConfig(++t).setName("Maxie").initForEvilTeamLeader("Magma Boss",[])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.MIGHTYENA ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.CROBAT, Species.GLISCOR ]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([ Species.WEEZING, Species.GALAR_WEEZING ]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([ Species.MAGMORTAR, Species.TORKOAL ]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([ Species.FLYGON]))
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.CAMERUPT ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
      p.formIndex = 1;
    })),
  [TrainerType.MAXIE_2]: new TrainerConfig(++t).setName("Maxie").initForEvilTeamLeader("Magma Boss",[])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.SOLROCK, Species.HOUNDOOM ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.GREAT_TUSK ]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([ Species.SHIFTRY, Species.SCOVILLAIN ], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
      p.abilityIndex = 0; // Chlorophyll
    }))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([ Species.TORKOAL, Species.NINETALES ], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
      p.abilityIndex = 2; // DROUGHT
    }))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([ Species.GROUDON ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.MASTER_BALL;
    }))
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.CAMERUPT ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
      p.formIndex = 1;
    })),
  [TrainerType.ARCHIE]: new TrainerConfig(++t).setName("Archie").initForEvilTeamLeader("Aqua Boss",[])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.LINOONE ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.CROBAT, Species.PELIPPER ]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([ Species.MUK, Species.ALOLA_MUK ]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([ Species.TENTACRUEL ]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([ Species.RELICANTH, Species.WAILORD ]))
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.SHARPEDO ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
      p.formIndex = 1;
    })),
  [TrainerType.ARCHIE_2]: new TrainerConfig(++t).setName("Archie").initForEvilTeamLeader("Aqua Boss",[])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.KINGDRA, Species.LUDICOLO ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.BEARTIC, Species.ARMALDO ], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
      p.abilityIndex = 2; // Swift Swim
    }))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([ Species.HUNTAIL, Species.GOREBYSS ], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
      p.abilityIndex = 0; // Swift Swim
    }))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([ Species.POLITOED, Species.PELIPPER ], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
      p.abilityIndex = 2; // Drizzle
    }))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([ Species.KYOGRE ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.MASTER_BALL;
    }))
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.SHARPEDO ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
      p.formIndex = 1;
    })),
  [TrainerType.CYRUS]: new TrainerConfig(++t).setName("Cyrus").initForEvilTeamLeader("Galactic Boss",[])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.GYARADOS, Species.BASCULEGION ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.HONCHKROW, Species.HISUI_BRAVIARY ]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([ Species.CROBAT, Species.OVERQWIL ]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([ Species.AZELF, Species.UXIE, Species.MESPRIT ]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([ Species.HOUNDOOM ], TrainerSlot.TRAINER, true, p => {
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
      p.formIndex = 1;
    }))
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.WEAVILE ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
    })),
  [TrainerType.CYRUS_2]: new TrainerConfig(++t).setName("Cyrus").initForEvilTeamLeader("Galactic Boss",[])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.AZELF, Species.UXIE, Species.MESPRIT ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.ELECTRODE, Species.HISUI_ELECTRODE ]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([ Species.SALAMENCE, Species.ROARING_MOON ]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([ Species.HISUI_ZOROARK ]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([ Species.DARKRAI ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.MASTER_BALL;
    }))
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.WEAVILE ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
    })),
  [TrainerType.GHETSIS]: new TrainerConfig(++t).setName("Ghetsis").initForEvilTeamLeader("Plasma Boss",[])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.COFAGRIGUS, Species.RUNERIGUS ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.BOUFFALANT ]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([ Species.SEISMITOAD, Species.CARRACOSTA ]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([ Species.EELEKTROSS, Species.GALVANTULA ]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([ Species.VOLCARONA ]))
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.HYDREIGON ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
    })),
  [TrainerType.GHETSIS_2]: new TrainerConfig(++t).setName("Ghetsis").initForEvilTeamLeader("Plasma Boss",[])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.SLITHER_WING, Species.IRON_MOTH ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.DURANT ]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([ Species.DARMANITAN, Species.GALAR_DARMANITAN ]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([ Species.KINGAMBIT ]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([ Species.KYUREM ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.MASTER_BALL;
    }))
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.HYDREIGON, Species.IRON_JUGULIS ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
    })),
  [TrainerType.LYSANDRE]: new TrainerConfig(++t).setName("Lysandre").initForEvilTeamLeader("Flare Boss",[])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.MIENSHAO ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.HONCHKROW, Species.TALONFLAME ]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([ Species.PYROAR ]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([ Species.MILOTIC ]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([ Species.HELIOLISK ]))
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.GYARADOS ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
      p.formIndex = 1;
    })),
  [TrainerType.LYSANDRE_2]: new TrainerConfig(++t).setName("Lysandre").initForEvilTeamLeader("Flare Boss",[])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.SCREAM_TAIL, Species.FLUTTER_MANE ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
    }))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.GHOLDENGO, Species.AEGISLASH ]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([ Species.PYROAR ]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([ Species.GOODRA, Species.HISUI_GOODRA ]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([ Species.YVELTAL ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.MASTER_BALL;
    }))
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.GYARADOS ], TrainerSlot.TRAINER, true, p => {
      p.setBoss(true, 2);
      p.generateAndPopulateMoveset();
      p.pokeball = PokeballType.ULTRA_BALL;
      p.formIndex = 1;
    })),
};
