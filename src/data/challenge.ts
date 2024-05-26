import * as Utils from "../utils";
import { Challenges } from "./enums/challenges";
import i18next, { Localizable } from "#app/plugins/i18n.js";
import { GameData } from "#app/system/game-data.js";
import PokemonSpecies, { speciesStarters } from "./pokemon-species";
import { Type } from "./type";
import BattleScene from "#app/battle-scene.js";

export enum ChallengeType {
  STARTER_CHOICE_MODIFY, // Challenges which modify what starters you can choose
  STARTER_POINTS_MODIFY // Challenges which modify how many starter points you have
}

/**
 * A challenge object. Exists only to serve as a base class.
 */
export abstract class Challenge implements Localizable {
  public id: Challenges; // The id of the challenge

  private name: string; // The name of the challenge. Localised.
  private description: string;
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

    this.localize();
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
   * Fetches localised strings into the correct values.
   */
  localize(): void {
    this.name = i18next.t(`challenges:${this.geti18nKey()}.name`);
    this.description = i18next.t(`challenges:${this.geti18nKey()}.description`);
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
    return this.name;
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
    if (overrideValue === 0) {
      return "None";
    }
    return overrideValue.toString();
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
    return this.description;
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
    this.addChallengeType(ChallengeType.STARTER_CHOICE_MODIFY);
    this.maxSeverity = 2;
  }

  apply(challengeType: ChallengeType, args: any[]): boolean {
    if (this.value === 0) {
      return false;
    }

    switch (challengeType) {
    case ChallengeType.STARTER_CHOICE_MODIFY:
      const species = args[0] as PokemonSpecies;
      const isValid = args[1] as Utils.BooleanHolder;
      if (species.generation !== this.value) {
        isValid.value = false;
        return true;
      }
    }
    return false;
  }

  static loadChallenge(source: SingleGenerationChallenge | any): SingleGenerationChallenge {
    const newChallenge = new SingleGenerationChallenge();
    newChallenge.value = source.value;
    newChallenge.severity = source.severity;
    return newChallenge;
  }
}

/**
 * Implements a mono type challenge.
 */
export class SingleTypeChallenge extends Challenge {
  constructor() {
    super(Challenges.SINGLE_TYPE, 18);
    this.addChallengeType(ChallengeType.STARTER_CHOICE_MODIFY);
    this.maxSeverity = 2;
  }

  getValue(overrideValue?: integer): string {
    if (overrideValue === undefined) {
      overrideValue = this.value;
    }
    if (overrideValue) {
      return i18next.t(`pokemonInfo:Type.${Type[overrideValue-1].toString()}`);
    } else {
      return "None";
    }
  }

  apply(challengeType: ChallengeType, args: any[]): boolean {
    if (this.value === 0) {
      return false;
    }

    switch (challengeType) {
    case ChallengeType.STARTER_CHOICE_MODIFY:
      const species = args[0] as PokemonSpecies;
      const isValid = args[1] as Utils.BooleanHolder;
      if (!species.isOfType(this.value - 1)) {
        isValid.value = false;
        return true;
      }
    }
    return false;
  }

  static loadChallenge(source: SingleTypeChallenge | any): SingleTypeChallenge {
    const newChallenge = new SingleTypeChallenge();
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
    this.addChallengeType(ChallengeType.STARTER_CHOICE_MODIFY);
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
    case ChallengeType.STARTER_CHOICE_MODIFY:
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
    this.addChallengeType(ChallengeType.STARTER_POINTS_MODIFY);
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
    case ChallengeType.STARTER_POINTS_MODIFY:
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

export function applyChallenges(scene: BattleScene, challengeType: ChallengeType, ...args: any[]): void {
  scene.gameMode.challenges.forEach(v => {
    if (v.isOfType(challengeType)) {
      v.apply(challengeType, args);
    }
  });
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
    new LowerStarterMaxCostChallenge(),
    new LowerStarterPointsChallenge()
  );
}
