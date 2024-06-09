import * as Utils from "../utils";
import { Challenges } from "./enums/challenges";
import i18next from "#app/plugins/i18n.js";
import { GameData } from "#app/system/game-data.js";
import PokemonSpecies, { getPokemonSpecies, speciesStarters } from "./pokemon-species";
import Pokemon from "#app/field/pokemon.js";
import { BattleType, FixedBattleConfig } from "#app/battle.js";
import { TrainerType } from "./enums/trainer-type";
import Trainer, { TrainerVariant } from "#app/field/trainer.js";
import { GameMode } from "#app/game-mode.js";
import { Species } from "./enums/species";
import { Type } from "./type";

/**
 * An enum for all the challenge types. The parameter entries on these describe the
 * parameters to use when calling the applyChallenges function.
 */
export enum ChallengeType {
   /**
    * Challenges which modify what starters you can choose
    * @param args [0] {@link PokemonSpecies} The species to check
    *             [1] {@link Utils.BooleanHolder} Sets to false if illegal, pass in true.
   */
  STARTER_CHOICE,
   /**
    * Challenges which modify how many starter points you have
    * @param args [0] {@link Utils.NumberHolder} The amount of starter points you have
   */
  STARTER_POINTS,
  /**
   * Challenges which modify your starters in some way
   * Not Fully Implemented
  */
  STARTER_MODIFY,
  /**
   * Challenges which limit which pokemon you can have in battle.
   * @param args [0] {@link Pokemon} The pokemon to check
   *             [1] {@link Utils.BooleanHolder} Sets to false if illegal, pass in true.
  */
  POKEMON_IN_BATTLE,
  /**
   * Adds or modifies the fixed battles in a run
   * @param args [0] integer The wave to get a battle for
   *             [1] {@link FixedBattleConfig} A new fixed battle. It'll be modified if a battle exists.
  */
  FIXED_BATTLES,
}

/**
 * A challenge object. Exists only to serve as a base class.
 */
export abstract class Challenge {
  public id: Challenges; // The id of the challenge

  public value: integer; // The "strength" of the challenge, all challenges have a numerical value.
  public maxValue: integer; // The maximum strength of the challenge.
  public severity: integer; // The current severity of the challenge. Some challenges have multiple severities in addition to strength.
  public maxSeverity: integer; // The maximum severity of the challenge.

  public conditions: ChallengeCondition[];
  public challengeTypes: ChallengeType[];

  /**
   * @param {Challenges} id The enum value for the challenge
   */
  constructor(id: Challenges, maxValue: integer = Number.MAX_SAFE_INTEGER) {
    this.id = id;

    this.value = 0;
    this.maxValue = maxValue;
    this.severity = 0;
    this.maxSeverity = 0;
    this.conditions = [];
    this.challengeTypes = [];
  }

  /**
   * Reset the challenge to a base state.
   */
  reset(): void {
    this.value = 0;
    this.severity = 0;
  }

  /**
   * Gets the localisation key for the challenge
   * @returns The i18n key for this challenge
   */
  geti18nKey(): string {
    return Challenges[this.id].split("_").map((f, i) => i ? `${f[0]}${f.slice(1).toLowerCase()}` : f.toLowerCase()).join("");
  }

  /**
   * Used for unlockable challenges to check if they're unlocked.
   * @param {GameData} data The save data.
   * @returns {boolean} Whether this challenge is unlocked.
   */
  isUnlocked(data: GameData): boolean {
    return this.conditions.every(f => f(data));
  }

  /**
   * Adds an unlock condition to this challenge.
   * @param {ChallengeCondition} condition The condition to add.
   * @returns {Challenge} This challenge
   */
  condition(condition: ChallengeCondition): Challenge {
    this.conditions.push(condition);

    return this;
  }

  /**
   * If this challenge is of a particular type
   * @param {ChallengeType} challengeType The challenge type to check.
   * @returns {Challenge} This challenge
   */
  isOfType(challengeType: ChallengeType): boolean {
    return this.challengeTypes.some(c => c === challengeType);
  }

  /**
   * Adds a challenge type to this challenge.
   * @param {ChallengeType} challengeType The challenge type to add.
   * @returns {Challenge} This challenge
   */
  addChallengeType(challengeType: ChallengeType): Challenge {
    this.challengeTypes.push(challengeType);

    return this;
  }

  /**
   * @returns {string} The localised name of this challenge.
   */
  getName(): string {
    return i18next.t(`challenges:${this.geti18nKey()}.name`);
  }

  /**
   * Returns the textual representation of a challenge's current value.
   * @param {value} overrideValue The value to check for. If undefined, gets the current value.
   * @returns {string} The localised name for the current value.
   */
  getValue(overrideValue?: integer): string {
    if (overrideValue === undefined) {
      overrideValue = this.value;
    }
    return i18next.t(`challenges:${this.geti18nKey()}.value.${this.value}`);
  }

  /**
   * Returns the description of a challenge's current value.
   * @param {value} overrideValue The value to check for. If undefined, gets the current value.
   * @returns {string} The localised description for the current value.
   */
  getDescription(overrideValue?: integer): string {
    if (overrideValue === undefined) {
      overrideValue = this.value;
    }
    return i18next.t(`challenges:${this.geti18nKey()}.desc.${this.value}`);
  }

  /**
   * Increase the value of the challenge
   * @returns {boolean} Returns true if the value changed
   */
  increaseValue(): boolean {
    if (this.value < this.maxValue) {
      this.value = Math.min(this.value + 1, this.maxValue);
      return true;
    }
    return false;
  }

  /**
   * Decrease the value of the challenge
   * @returns {boolean} Returns true if the value changed
   */
  decreaseValue(): boolean {
    if (this.value > 0) {
      this.value = Math.max(this.value - 1, 0);
      return true;
    }
    return false;
  }

  /**
   * Whether to allow choosing this challenge's severity.
   */
  hasSeverity(): boolean {
    return this.value !== 0 && this.maxSeverity > 0;
  }

  /**
   * Decrease the severity of the challenge
   * @returns {boolean} Returns true if the value changed
   */
  decreaseSeverity(): boolean {
    if (this.severity > 0) {
      this.severity = Math.max(this.severity - 1, 0);
      return true;
    }
    return false;
  }

  /**
   * Increase the severity of the challenge
   * @returns {boolean} Returns true if the value changed
   */
  increaseSeverity(): boolean {
    if (this.severity < this.maxSeverity) {
      this.severity = Math.min(this.severity + 1, this.maxSeverity);
      return true;
    }
    return false;
  }

  /**
   * Gets the "difficulty" value of this challenge.
   * @returns {integer} The difficulty value.
   */
  getDifficulty(): integer {
    return this.value;
  }

  /**
   * Gets the minimum difficulty added by this challenge.
   * @returns {integer} The difficulty value.
   */
  getMinDifficulty(): integer {
    return 0;
  }

  /**
   * Modifies the data or game state in some way to apply the challenge.
   * @param {ChallengeType} challengeType Which challenge type this is being applied for.
   * @param args Irrelevant. See the specific challenge's apply function for additional information.
   */
  abstract apply(challengeType: ChallengeType, args: any[]): boolean;

  /**
   * Clones a challenge, either from another challenge or json. Chainable.
   * @param {Challenge | any} source The source challenge of json.
   * @returns {Challenge} This challenge.
   */
  static loadChallenge(source: Challenge | any): Challenge {
    throw new Error("Method not implemented! Use derived class");
  }
}

type ChallengeCondition = (data: GameData) => boolean;

/**
 * Implements a mono generation challenge.
 */
export class SingleGenerationChallenge extends Challenge {
  constructor() {
    super(Challenges.SINGLE_GENERATION, 9);
    this.addChallengeType(ChallengeType.STARTER_CHOICE);
    this.addChallengeType(ChallengeType.POKEMON_IN_BATTLE);
    this.addChallengeType(ChallengeType.FIXED_BATTLES);
  }

  apply(challengeType: ChallengeType, args: any[]): boolean {
    if (this.value === 0) {
      return false;
    }

    /**
     * We have special code below for victini because it is classed as a generation 4 pokemon in the code
     * despite being a generation 5 pokemon. This is due to UI constraints, the starter select screen has
     * no more room for pokemon so victini is put in the gen 4 section instead. This code just overrides the
     * normal generation check to correctly treat victini as gen 5.
     */
    switch (challengeType) {
    case ChallengeType.STARTER_CHOICE:
      const species = args[0] as PokemonSpecies;
      const isValidStarter = args[1] as Utils.BooleanHolder;
      const starterGeneration = species.speciesId === Species.VICTINI ? 5 : species.generation;
      if (starterGeneration !== this.value) {
        isValidStarter.value = false;
        return true;
      }
      break;
    case ChallengeType.POKEMON_IN_BATTLE:
      const pokemon = args[0] as Pokemon;
      const isValidPokemon = args[1] as Utils.BooleanHolder;
      const baseGeneration = pokemon.species.speciesId === Species.VICTINI ? 5 : getPokemonSpecies(pokemon.species.speciesId).generation;
      const fusionGeneration = pokemon.isFusion() ? pokemon.fusionSpecies.speciesId === Species.VICTINI ? 5 : getPokemonSpecies(pokemon.fusionSpecies.speciesId).generation : 0;
      if (pokemon.isPlayer() && (baseGeneration !== this.value || (pokemon.isFusion() && fusionGeneration !== this.value))) {
        isValidPokemon.value = false;
        return true;
      }
      break;
    case ChallengeType.FIXED_BATTLES:
      const waveIndex = args[0] as integer;
      const battleConfig = args[1] as FixedBattleConfig;
      let trainerTypes: TrainerType[] = [];
      switch (waveIndex) {
      case 182:
        trainerTypes = [ TrainerType.LORELEI, TrainerType.WILL, TrainerType.SIDNEY, TrainerType.AARON, TrainerType.SHAUNTAL, TrainerType.MALVA, Utils.randSeedItem([ TrainerType.HALA, TrainerType.MOLAYNE ]),TrainerType.MARNIE_ELITE, TrainerType.RIKA ];
        break;
      case 184:
        trainerTypes = [ TrainerType.BRUNO, TrainerType.KOGA, TrainerType.PHOEBE, TrainerType.BERTHA, TrainerType.MARSHAL, TrainerType.SIEBOLD, TrainerType.OLIVIA, TrainerType.NESSA_ELITE, TrainerType.POPPY ];
        break;
      case 186:
        trainerTypes = [ TrainerType.AGATHA, TrainerType.BRUNO, TrainerType.GLACIA, TrainerType.FLINT, TrainerType.GRIMSLEY, TrainerType.WIKSTROM, TrainerType.ACEROLA, Utils.randSeedItem([TrainerType.BEA_ELITE,TrainerType.ALLISTER_ELITE]), TrainerType.LARRY_ELITE ];
        break;
      case 188:
        trainerTypes = [ TrainerType.LANCE, TrainerType.KAREN, TrainerType.DRAKE, TrainerType.LUCIAN, TrainerType.CAITLIN, TrainerType.DRASNA, TrainerType.KAHILI, TrainerType.RAIHAN_ELITE, TrainerType.HASSEL ];
        break;
      case 190:
        trainerTypes = [ TrainerType.BLUE, Utils.randSeedItem([ TrainerType.RED, TrainerType.LANCE_CHAMPION ]), Utils.randSeedItem([ TrainerType.STEVEN, TrainerType.WALLACE ]), TrainerType.CYNTHIA, Utils.randSeedItem([ TrainerType.ALDER, TrainerType.IRIS ]), TrainerType.DIANTHA, TrainerType.HAU, TrainerType.LEON, Utils.randSeedItem([ TrainerType.GEETA, TrainerType.NEMONA ]) ];
        break;
      }
      if (trainerTypes.length === 0) {
        return false;
      } else {
        battleConfig.setBattleType(BattleType.TRAINER).setGetTrainerFunc(scene => new Trainer(scene, trainerTypes[this.value - 1], TrainerVariant.DEFAULT));
        return true;
      }
    }
    return false;
  }

  /**
   * @overrides
   */
  getDifficulty(): number {
    return this.value > 0 ? 1 : 0;
  }

  static loadChallenge(source: SingleGenerationChallenge | any): SingleGenerationChallenge {
    const newChallenge = new SingleGenerationChallenge();
    newChallenge.value = source.value;
    newChallenge.severity = source.severity;
    return newChallenge;
  }
}

interface monotypeOverride {
  /** The species to override */
  species: Species;
  /** The type to count as */
  type: Type;
  /** If part of a fusion, should we check the fused species instead of the base species? */
  fusion: boolean;
}

/**
 * Implements a mono type challenge.
 */
export class SingleTypeChallenge extends Challenge {
  private static TYPE_OVERRIDES: monotypeOverride[] = [
    {species: Species.MELOETTA, type: Type.PSYCHIC, fusion: true},
    {species: Species.CASTFORM, type: Type.NORMAL, fusion: false},
  ];

  constructor() {
    super(Challenges.SINGLE_TYPE, 18);
    this.addChallengeType(ChallengeType.STARTER_CHOICE);
    this.addChallengeType(ChallengeType.POKEMON_IN_BATTLE);
  }

  apply(challengeType: ChallengeType, args: any[]): boolean {
    if (this.value === 0) {
      return false;
    }

    switch (challengeType) {
    case ChallengeType.STARTER_CHOICE:
      const species = args[0] as PokemonSpecies;
      const isValidStarter = args[1] as Utils.BooleanHolder;
      if (!species.isOfType(this.value - 1)) {
        isValidStarter.value = false;
        return true;
      }
      break;
    case ChallengeType.POKEMON_IN_BATTLE:
      const pokemon = args[0] as Pokemon;
      const isValidPokemon = args[1] as Utils.BooleanHolder;
      if (pokemon.isPlayer() && !pokemon.isOfType(this.value - 1, false, false, true)
        && !SingleTypeChallenge.TYPE_OVERRIDES.some(o => o.type === (this.value - 1) && (pokemon.isFusion() && o.fusion ? pokemon.fusionSpecies : pokemon.species).speciesId === o.species)) {
        isValidPokemon.value = false;
        return true;
      }
      break;
    }
    return false;
  }

  /**
   * @overrides
   */
  getDifficulty(): number {
    return this.value > 0 ? 1 : 0;
  }

  static loadChallenge(source: SingleTypeChallenge | any): SingleTypeChallenge {
    const newChallenge = new SingleTypeChallenge();
    newChallenge.value = source.value;
    newChallenge.severity = source.severity;
    return newChallenge;
  }
}

/**
 * Implements a fresh start challenge.
 */
export class FreshStartChallenge extends Challenge {
  constructor() {
    super(Challenges.FRESH_START, 1);
    this.addChallengeType(ChallengeType.STARTER_CHOICE);
    this.addChallengeType(ChallengeType.STARTER_MODIFY);
  }

  apply(challengeType: ChallengeType, args: any[]): boolean {
    if (this.value === 0) {
      return false;
    }

    switch (challengeType) {
    case ChallengeType.STARTER_CHOICE:
      const species = args[0] as PokemonSpecies;
      const isValidStarter = args[1] as Utils.BooleanHolder;
      if (species) {
        isValidStarter.value = false;
        return true;
      }
      break;
    }
    return false;
  }

  /**
   * @overrides
   */
  getDifficulty(): number {
    return 0;
  }

  static loadChallenge(source: FreshStartChallenge | any): FreshStartChallenge {
    const newChallenge = new FreshStartChallenge();
    newChallenge.value = source.value;
    newChallenge.severity = source.severity;
    return newChallenge;
  }
}

/**
 * Lowers the amount of starter points available.
 */
export class LowerStarterMaxCostChallenge extends Challenge {
  constructor() {
    super(Challenges.LOWER_MAX_STARTER_COST, 9);
    this.addChallengeType(ChallengeType.STARTER_CHOICE);
  }

  /**
   * @override
   */
  getValue(overrideValue?: integer): string {
    if (overrideValue === undefined) {
      overrideValue = this.value;
    }
    return (10 - overrideValue).toString();
  }

  apply(challengeType: ChallengeType, args: any[]): boolean {
    if (this.value === 0) {
      return false;
    }

    switch (challengeType) {
    case ChallengeType.STARTER_CHOICE:
      const species = args[0] as PokemonSpecies;
      const isValid = args[1] as Utils.BooleanHolder;
      if (speciesStarters[species.speciesId] > 10 - this.value) {
        isValid.value = false;
        return true;
      }
    }
    return false;
  }

  static loadChallenge(source: LowerStarterMaxCostChallenge | any): LowerStarterMaxCostChallenge {
    const newChallenge = new LowerStarterMaxCostChallenge();
    newChallenge.value = source.value;
    newChallenge.severity = source.severity;
    return newChallenge;
  }
}

/**
 * Lowers the maximum cost of starters available.
 */
export class LowerStarterPointsChallenge extends Challenge {
  constructor() {
    super(Challenges.LOWER_STARTER_POINTS, 9);
    this.addChallengeType(ChallengeType.STARTER_POINTS);
  }

  /**
   * @override
   */
  getValue(overrideValue?: integer): string {
    if (overrideValue === undefined) {
      overrideValue = this.value;
    }
    return (10 - overrideValue).toString();
  }

  apply(challengeType: ChallengeType, args: any[]): boolean {
    if (this.value === 0) {
      return false;
    }

    switch (challengeType) {
    case ChallengeType.STARTER_POINTS:
      const points = args[0] as Utils.NumberHolder;
      points.value -= this.value;
      return true;
    }
    return false;
  }

  static loadChallenge(source: LowerStarterPointsChallenge | any): LowerStarterPointsChallenge {
    const newChallenge = new LowerStarterPointsChallenge();
    newChallenge.value = source.value;
    newChallenge.severity = source.severity;
    return newChallenge;
  }
}

/**
 * Apply all challenges of a given challenge type.
 * @param {BattleScene} scene The current scene
 * @param {ChallengeType} challengeType What challenge type to apply
 * @param {any[]} args Any args for that challenge type
 * @returns {boolean} True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType, ...args: any[]): boolean {
  let ret = false;
  gameMode.challenges.forEach(v => {
    if (v.isOfType(challengeType)) {
      ret ||= v.apply(challengeType, args);
    }
  });
  return ret;
}

export function copyChallenge(source: Challenge | any): Challenge {
  switch (source.id) {
  case Challenges.SINGLE_GENERATION:
    return SingleGenerationChallenge.loadChallenge(source);
  case Challenges.SINGLE_TYPE:
    return SingleTypeChallenge.loadChallenge(source);
  case Challenges.LOWER_MAX_STARTER_COST:
    return LowerStarterMaxCostChallenge.loadChallenge(source);
  case Challenges.LOWER_STARTER_POINTS:
    return LowerStarterPointsChallenge.loadChallenge(source);
  }
  throw new Error("Unknown challenge copied");
}

export const allChallenges: Challenge[] = [];

export function initChallenges() {
  allChallenges.push(
    new SingleGenerationChallenge(),
    new SingleTypeChallenge(),
    // new LowerStarterMaxCostChallenge(),
    // new LowerStarterPointsChallenge(),
    // new FreshStartChallenge()
  );
}
