import * as Utils from "../utils";
import i18next from "i18next";
import { defaultStarterSpecies, DexAttrProps, GameData } from "#app/system/game-data.js";
import PokemonSpecies, { getPokemonSpecies, getPokemonSpeciesForm, speciesStarters } from "./pokemon-species";
import Pokemon, { PokemonMove } from "#app/field/pokemon.js";
import { BattleType, FixedBattleConfig } from "#app/battle.js";
import Trainer, { TrainerVariant } from "#app/field/trainer.js";
import { GameMode } from "#app/game-mode.js";
import { Type } from "./type";
import { Challenges } from "#enums/challenges";
import { Species } from "#enums/species";
import { TrainerType } from "#enums/trainer-type";
import { Nature } from "./nature";
import { Moves } from "#app/enums/moves.js";
import { TypeColor, TypeShadow } from "#app/enums/color.js";
import { pokemonEvolutions } from "./pokemon-evolutions";
import { pokemonFormChanges } from "./pokemon-forms";

/** A constant for the default max cost of the starting party before a run */
const DEFAULT_PARTY_MAX_COST = 10;

/**
 * An enum for all the challenge types. The parameter entries on these describe the
 * parameters to use when calling the applyChallenges function.
 */
export enum ChallengeType {
  /**
   * Challenges which modify what starters you can choose
   * @see {@link Challenge.applyStarterChoice}
  */
  STARTER_CHOICE,
  /**
   * Challenges which modify how many starter points you have
   * @see {@link Challenge.applyStarterPoints}
  */
  STARTER_POINTS,
  /**
   * Challenges which modify how many starter points you have
   * @see {@link Challenge.applyStarterPointCost}
  */
  STARTER_COST,
  /**
   * Challenges which modify your starters in some way
   * @see {@link Challenge.applyStarterModify}
  */
  STARTER_MODIFY,
  /**
   * Challenges which limit which pokemon you can have in battle.
   * @see {@link Challenge.applyPokemonInBattle}
  */
  POKEMON_IN_BATTLE,
  /**
   * Adds or modifies the fixed battles in a run
   * @see {@link Challenge.applyFixedBattle}
  */
  FIXED_BATTLES,
  /**
   * Modifies the effectiveness of Type matchups in battle
   * @see {@linkcode Challenge.applyTypeEffectiveness}
  */
  TYPE_EFFECTIVENESS,
  /**
   * Modifies what level the AI pokemon are. UNIMPLEMENTED.
   */
  AI_LEVEL,
  /**
   * Modifies how many move slots the AI has. UNIMPLEMENTED.
   */
  AI_MOVE_SLOTS,
  /**
   * Modifies if a pokemon has its passive. UNIMPLEMENTED.
   */
  PASSIVE_ACCESS,
  /**
   * Modifies the game mode settings in some way. UNIMPLEMENTED.
   */
  GAME_MODE_MODIFY,
  /**
   * Modifies what level AI pokemon can access a move. UNIMPLEMENTED.
   */
  MOVE_ACCESS,
  /**
   * Modifies what weight AI pokemon have when generating movesets. UNIMPLEMENTED.
   */
  MOVE_WEIGHT,
}

/**
 * Used for challenge types that modify movesets, these denote the various sources of moves for pokemon.
 */
export enum MoveSourceType {
  LEVEL_UP, // Currently unimplemented for move access
  RELEARNER, // Relearner moves currently unimplemented
  COMMON_TM,
  GREAT_TM,
  ULTRA_TM,
  COMMON_EGG,
  RARE_EGG
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

  /**
   * @param id {@link Challenges} The enum value for the challenge
   */
  constructor(id: Challenges, maxValue: integer = Number.MAX_SAFE_INTEGER) {
    this.id = id;

    this.value = 0;
    this.maxValue = maxValue;
    this.severity = 0;
    this.maxSeverity = 0;
    this.conditions = [];
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
   * @returns {@link string} The i18n key for this challenge
   */
  geti18nKey(): string {
    return Challenges[this.id].split("_").map((f, i) => i ? `${f[0]}${f.slice(1).toLowerCase()}` : f.toLowerCase()).join("");
  }

  /**
   * Used for unlockable challenges to check if they're unlocked.
   * @param data {@link GameData} The save data.
   * @returns {@link boolean} Whether this challenge is unlocked.
   */
  isUnlocked(data: GameData): boolean {
    return this.conditions.every(f => f(data));
  }

  /**
   * Adds an unlock condition to this challenge.
   * @param condition {@link ChallengeCondition} The condition to add.
   * @returns {@link Challenge} This challenge
   */
  condition(condition: ChallengeCondition): Challenge {
    this.conditions.push(condition);

    return this;
  }

  /**
   * @returns {@link string} The localised name of this challenge.
   */
  getName(): string {
    return i18next.t(`challenges:${this.geti18nKey()}.name`);
  }

  /**
   * Returns the textual representation of a challenge's current value.
   * @param overrideValue {@link integer} The value to check for. If undefined, gets the current value.
   * @returns {@link string} The localised name for the current value.
   */
  getValue(overrideValue?: integer): string {
    if (overrideValue === undefined) {
      overrideValue = this.value;
    }
    return i18next.t(`challenges:${this.geti18nKey()}.value.${this.value}`);
  }

  /**
   * Returns the description of a challenge's current value.
   * @param overrideValue {@link integer} The value to check for. If undefined, gets the current value.
   * @returns {@link string} The localised description for the current value.
   */
  getDescription(overrideValue?: integer): string {
    if (overrideValue === undefined) {
      overrideValue = this.value;
    }
    return `${i18next.t([`challenges:${this.geti18nKey()}.desc.${this.value}`, `challenges:${this.geti18nKey()}.desc`])}`;
  }

  /**
   * Increase the value of the challenge
   * @returns {@link boolean} Returns true if the value changed
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
   * @returns {@link boolean} Returns true if the value changed
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
   * @returns {@link boolean} Returns true if the value changed
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
   * @returns {@link boolean} Returns true if the value changed
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
   * @returns {@link integer} The difficulty value.
   */
  getDifficulty(): integer {
    return this.value;
  }

  /**
   * Gets the minimum difficulty added by this challenge.
   * @returns {@link integer} The difficulty value.
   */
  getMinDifficulty(): integer {
    return 0;
  }

  /**
   * Clones a challenge, either from another challenge or json. Chainable.
   * @param source The source challenge or json.
   * @returns This challenge.
   */
  static loadChallenge(source: Challenge | any): Challenge {
    throw new Error("Method not implemented! Use derived class");
  }

  /**
   * An apply function for STARTER_CHOICE challenges. Derived classes should alter this.
   * @param pokemon {@link PokemonSpecies} The pokemon to check the validity of.
   * @param valid {@link Utils.BooleanHolder} A BooleanHolder, the value gets set to false if the pokemon isn't allowed.
   * @param dexAttr {@link DexAttrProps} The dex attributes of the pokemon.
   * @param soft {@link boolean} If true, allow it if it could become a valid pokemon.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyStarterChoice(pokemon: PokemonSpecies, valid: Utils.BooleanHolder, dexAttr: DexAttrProps, soft: boolean = false): boolean {
    return false;
  }

  /**
   * An apply function for STARTER_POINTS challenges. Derived classes should alter this.
   * @param points {@link Utils.NumberHolder} The amount of points you have available.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyStarterPoints(points: Utils.NumberHolder): boolean {
    return false;
  }

  /**
   * An apply function for STARTER_COST challenges. Derived classes should alter this.
   * @param species {@link Species} The pokemon to change the cost of.
   * @param cost {@link Utils.NumberHolder} The cost of the starter.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyStarterCost(species: Species, cost: Utils.NumberHolder): boolean {
    return false;
  }

  /**
   * An apply function for STARTER_MODIFY challenges. Derived classes should alter this.
   * @param pokemon {@link Pokemon} The starter pokemon to modify.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyStarterModify(pokemon: Pokemon): boolean {
    return false;
  }

  /**
   * An apply function for POKEMON_IN_BATTLE challenges. Derived classes should alter this.
   * @param pokemon {@link Pokemon} The pokemon to check the validity of.
   * @param valid {@link Utils.BooleanHolder} A BooleanHolder, the value gets set to false if the pokemon isn't allowed.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyPokemonInBattle(pokemon: Pokemon, valid: Utils.BooleanHolder): boolean {
    return false;
  }

  /**
   * An apply function for FIXED_BATTLE challenges. Derived classes should alter this.
   * @param waveIndex {@link Number} The current wave index.
   * @param battleConfig {@link FixedBattleConfig} The battle config to modify.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyFixedBattle(waveIndex: Number, battleConfig: FixedBattleConfig): boolean {
    return false;
  }

  /**
   * An apply function for TYPE_EFFECTIVENESS challenges. Derived classes should alter this.
   * @param effectiveness {@linkcode Utils.NumberHolder} The current effectiveness of the move.
   * @returns Whether this function did anything.
   */
  applyTypeEffectiveness(effectiveness: Utils.NumberHolder): boolean {
    return false;
  }

  /**
   * An apply function for AI_LEVEL challenges. Derived classes should alter this.
   * @param level {@link Utils.IntegerHolder} The generated level.
   * @param levelCap {@link Number} The current level cap.
   * @param isTrainer {@link Boolean} Whether this is a trainer pokemon.
   * @param isBoss {@link Boolean} Whether this is a non-trainer boss pokemon.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyLevelChange(level: Utils.IntegerHolder, levelCap: number, isTrainer: boolean, isBoss: boolean): boolean {
    return false;
  }

  /**
   * An apply function for AI_MOVE_SLOTS challenges. Derived classes should alter this.
   * @param pokemon {@link Pokemon} The pokemon that is being considered.
   * @param moveSlots {@link Utils.IntegerHolder} The amount of move slots.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyMoveSlot(pokemon: Pokemon, moveSlots: Utils.IntegerHolder): boolean {
    return false;
  }

  /**
   * An apply function for PASSIVE_ACCESS challenges. Derived classes should alter this.
   * @param pokemon {@link Pokemon} The pokemon to change.
   * @param hasPassive {@link Utils.BooleanHolder} Whether it should have its passive.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyPassiveAccess(pokemon: Pokemon, hasPassive: Utils.BooleanHolder): boolean {
    return false;
  }

  /**
   * An apply function for GAME_MODE_MODIFY challenges. Derived classes should alter this.
   * @param gameMode {@link GameMode} The current game mode.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyGameModeModify(gameMode: GameMode): boolean {
    return false;
  }

  /**
   * An apply function for MOVE_ACCESS. Derived classes should alter this.
   * @param pokemon {@link Pokemon} What pokemon would learn the move.
   * @param moveSource {@link MoveSourceType} What source the pokemon would get the move from.
   * @param move {@link Moves} The move in question.
   * @param level {@link Utils.IntegerHolder} The level threshold for access.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyMoveAccessLevel(pokemon: Pokemon, moveSource: MoveSourceType, move: Moves, level: Utils.IntegerHolder): boolean {
    return false;
  }

  /**
   * An apply function for MOVE_WEIGHT. Derived classes should alter this.
   * @param pokemon {@link Pokemon} What pokemon would learn the move.
   * @param moveSource {@link MoveSourceType} What source the pokemon would get the move from.
   * @param move {@link Moves} The move in question.
   * @param weight {@link Utils.IntegerHolder} The base weight of the move
   * @returns {@link boolean} Whether this function did anything.
   */
  applyMoveWeight(pokemon: Pokemon, moveSource: MoveSourceType, move: Moves, level: Utils.IntegerHolder): boolean {
    return false;
  }
}

type ChallengeCondition = (data: GameData) => boolean;

/**
 * Implements a mono generation challenge.
 */
export class SingleGenerationChallenge extends Challenge {
  constructor() {
    super(Challenges.SINGLE_GENERATION, 9);
  }

  applyStarterChoice(pokemon: PokemonSpecies, valid: Utils.BooleanHolder, dexAttr: DexAttrProps, soft: boolean = false): boolean {
    const generations = [pokemon.generation];
    if (soft) {
      const speciesToCheck = [pokemon.speciesId];
      while (speciesToCheck.length) {
        const checking = speciesToCheck.pop();
        if (checking && pokemonEvolutions.hasOwnProperty(checking)) {
          pokemonEvolutions[checking].forEach(e => {
            speciesToCheck.push(e.speciesId);
            generations.push(getPokemonSpecies(e.speciesId).generation);
          });
        }
      }
    }

    if (!generations.includes(this.value)) {
      valid.value = false;
      return true;
    }
    return false;
  }

  applyPokemonInBattle(pokemon: Pokemon, valid: Utils.BooleanHolder): boolean {
    const baseGeneration = pokemon.species.speciesId === Species.VICTINI ? 5 : getPokemonSpecies(pokemon.species.speciesId).generation;
    const fusionGeneration = pokemon.isFusion() ? pokemon.fusionSpecies?.speciesId === Species.VICTINI ? 5 : getPokemonSpecies(pokemon.fusionSpecies!.speciesId).generation : 0; // TODO: is the bang on fusionSpecies correct?
    if (pokemon.isPlayer() && (baseGeneration !== this.value || (pokemon.isFusion() && fusionGeneration !== this.value))) {
      valid.value = false;
      return true;
    }
    return false;
  }

  applyFixedBattle(waveIndex: Number, battleConfig: FixedBattleConfig): boolean {
    let trainerTypes: TrainerType[] = [];
    switch (waveIndex) {
    case 182:
      trainerTypes = [ TrainerType.LORELEI, TrainerType.WILL, TrainerType.SIDNEY, TrainerType.AARON, TrainerType.SHAUNTAL, TrainerType.MALVA, Utils.randSeedItem([ TrainerType.HALA, TrainerType.MOLAYNE ]), TrainerType.MARNIE_ELITE, TrainerType.RIKA ];
      break;
    case 184:
      trainerTypes = [ TrainerType.BRUNO, TrainerType.KOGA, TrainerType.PHOEBE, TrainerType.BERTHA, TrainerType.MARSHAL, TrainerType.SIEBOLD, TrainerType.OLIVIA, TrainerType.NESSA_ELITE, TrainerType.POPPY ];
      break;
    case 186:
      trainerTypes = [ TrainerType.AGATHA, TrainerType.BRUNO, TrainerType.GLACIA, TrainerType.FLINT, TrainerType.GRIMSLEY, TrainerType.WIKSTROM, TrainerType.ACEROLA, Utils.randSeedItem([TrainerType.BEA_ELITE, TrainerType.ALLISTER_ELITE]), TrainerType.LARRY_ELITE ];
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

  /**
   * @overrides
   */
  getDifficulty(): number {
    return this.value > 0 ? 1 : 0;
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
    if (this.value === 0) {
      return i18next.t("settings:off");
    }
    return i18next.t(`starterSelectUiHandler:gen${this.value}`);
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
    if (this.value === 0) {
      return i18next.t("challenges:singleGeneration.desc_default");
    }
    return i18next.t("challenges:singleGeneration.desc", { gen: i18next.t(`challenges:singleGeneration.gen_${this.value}`) });
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
  }

  applyStarterChoice(pokemon: PokemonSpecies, valid: Utils.BooleanHolder, dexAttr: DexAttrProps, soft: boolean = false): boolean {
    const speciesForm = getPokemonSpeciesForm(pokemon.speciesId, dexAttr.formIndex);
    const types = [speciesForm.type1, speciesForm.type2];
    if (soft) {
      const speciesToCheck = [pokemon.speciesId];
      while (speciesToCheck.length) {
        const checking = speciesToCheck.pop();
        if (checking && pokemonEvolutions.hasOwnProperty(checking)) {
          pokemonEvolutions[checking].forEach(e => {
            speciesToCheck.push(e.speciesId);
            types.push(getPokemonSpecies(e.speciesId).type1, getPokemonSpecies(e.speciesId).type2);
          });
        }
        if (checking && pokemonFormChanges.hasOwnProperty(checking)) {
          pokemonFormChanges[checking].forEach(f1 => {
            getPokemonSpecies(checking).forms.forEach(f2 => {
              if (f1.formKey === f2.formKey) {
                types.push(f2.type1, f2.type2);
              }
            });
          });
        }
      }
    }
    if (!types.includes(this.value - 1)) {
      valid.value = false;
      return true;
    }
    return false;
  }

  applyPokemonInBattle(pokemon: Pokemon, valid: Utils.BooleanHolder): boolean {
    if (pokemon.isPlayer() && !pokemon.isOfType(this.value - 1, false, false, true)
      && !SingleTypeChallenge.TYPE_OVERRIDES.some(o => o.type === (this.value - 1) && (pokemon.isFusion() && o.fusion ? pokemon.fusionSpecies! : pokemon.species).speciesId === o.species)) { // TODO: is the bang on fusionSpecies correct?
      valid.value = false;
      return true;
    }
    return false;
  }

  /**
   * @overrides
   */
  getDifficulty(): number {
    return this.value > 0 ? 1 : 0;
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
    return Type[this.value - 1].toLowerCase();
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
    const type = i18next.t(`pokemonInfo:Type.${Type[this.value - 1]}`);
    const typeColor = `[color=${TypeColor[Type[this.value-1]]}][shadow=${TypeShadow[Type[this.value-1]]}]${type}[/shadow][/color]`;
    const defaultDesc = i18next.t("challenges:singleType.desc_default");
    const typeDesc = i18next.t("challenges:singleType.desc", {type: typeColor});
    return this.value === 0 ? defaultDesc : typeDesc;
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
  }

  applyStarterChoice(pokemon: PokemonSpecies, valid: Utils.BooleanHolder): boolean {
    if (!defaultStarterSpecies.includes(pokemon.speciesId)) {
      valid.value = false;
      return true;
    }
    return false;
  }

  applyStarterCost(species: Species, cost: Utils.NumberHolder): boolean {
    if (defaultStarterSpecies.includes(species)) {
      cost.value = speciesStarters[species];
      return true;
    }
    return false;
  }

  applyStarterModify(pokemon: Pokemon): boolean {
    pokemon.abilityIndex = 0; // Always base ability, not hidden ability
    pokemon.passive = false; // Passive isn't unlocked
    pokemon.nature = Nature.HARDY; // Neutral nature
    pokemon.moveset = pokemon.species.getLevelMoves().filter(m => m[0] <= 5).map(lm => lm[1]).slice(0, 4).map(m => new PokemonMove(m)); // No egg moves
    pokemon.luck = 0; // No luck
    pokemon.shiny = false; // Not shiny
    pokemon.variant = 0; // Not shiny
    pokemon.formIndex = 0; // Froakie should be base form
    pokemon.ivs = [10, 10, 10, 10, 10, 10]; // Default IVs of 10 for all stats
    return true;
  }

  override getDifficulty(): number {
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
 * Implements an inverse battle challenge.
 */
export class InverseBattleChallenge extends Challenge {
  constructor() {
    super(Challenges.INVERSE_BATTLE, 1);
  }

  static loadChallenge(source: InverseBattleChallenge | any): InverseBattleChallenge {
    const newChallenge = new InverseBattleChallenge();
    newChallenge.value = source.value;
    newChallenge.severity = source.severity;
    return newChallenge;
  }

  override getDifficulty(): number {
    return 0;
  }

  applyTypeEffectiveness(effectiveness: Utils.NumberHolder): boolean {
    if (effectiveness.value < 1) {
      effectiveness.value = 2;
      return true;
    } else if (effectiveness.value > 1) {
      effectiveness.value = 0.5;
      return true;
    }

    return false;
  }
}

/**
 * Lowers the amount of starter points available.
 */
export class LowerStarterMaxCostChallenge extends Challenge {
  constructor() {
    super(Challenges.LOWER_MAX_STARTER_COST, 9);
  }

  /**
   * @override
   */
  getValue(overrideValue?: integer): string {
    if (overrideValue === undefined) {
      overrideValue = this.value;
    }
    return (DEFAULT_PARTY_MAX_COST - overrideValue).toString();
  }

  applyStarterChoice(pokemon: PokemonSpecies, valid: Utils.BooleanHolder): boolean {
    if (speciesStarters[pokemon.speciesId] > DEFAULT_PARTY_MAX_COST - this.value) {
      valid.value = false;
      return true;
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
  }

  /**
   * @override
   */
  getValue(overrideValue?: integer): string {
    if (overrideValue === undefined) {
      overrideValue = this.value;
    }
    return (DEFAULT_PARTY_MAX_COST - overrideValue).toString();
  }

  applyStarterPoints(points: Utils.NumberHolder): boolean {
    points.value -= this.value;
    return true;
  }

  static loadChallenge(source: LowerStarterPointsChallenge | any): LowerStarterPointsChallenge {
    const newChallenge = new LowerStarterPointsChallenge();
    newChallenge.value = source.value;
    newChallenge.severity = source.severity;
    return newChallenge;
  }
}

/**
 * Apply all challenges that modify starter choice.
 * @param gameMode {@link GameMode} The current gameMode
 * @param challengeType {@link ChallengeType} ChallengeType.STARTER_CHOICE
 * @param pokemon {@link PokemonSpecies} The pokemon to check the validity of.
 * @param valid {@link Utils.BooleanHolder} A BooleanHolder, the value gets set to false if the pokemon isn't allowed.
 * @param dexAttr {@link DexAttrProps} The dex attributes of the pokemon.
 * @param soft {@link boolean} If true, allow it if it could become a valid pokemon.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType.STARTER_CHOICE, pokemon: PokemonSpecies, valid: Utils.BooleanHolder, dexAttr: DexAttrProps, soft: boolean): boolean;
/**
 * Apply all challenges that modify available total starter points.
 * @param gameMode {@link GameMode} The current gameMode
 * @param challengeType {@link ChallengeType} ChallengeType.STARTER_POINTS
 * @param points {@link Utils.NumberHolder} The amount of points you have available.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType.STARTER_POINTS, points: Utils.NumberHolder): boolean;
/**
 * Apply all challenges that modify the cost of a starter.
 * @param gameMode {@link GameMode} The current gameMode
 * @param challengeType {@link ChallengeType} ChallengeType.STARTER_COST
 * @param species {@link Species} The pokemon to change the cost of.
 * @param points {@link Utils.NumberHolder} The cost of the pokemon.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType.STARTER_COST, species: Species, cost: Utils.NumberHolder): boolean;
/**
 * Apply all challenges that modify a starter after selection.
 * @param gameMode {@link GameMode} The current gameMode
 * @param challengeType {@link ChallengeType} ChallengeType.STARTER_MODIFY
 * @param pokemon {@link Pokemon} The starter pokemon to modify.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType.STARTER_MODIFY, pokemon: Pokemon): boolean;
/**
 * Apply all challenges that what pokemon you can have in battle.
 * @param gameMode {@link GameMode} The current gameMode
 * @param challengeType {@link ChallengeType} ChallengeType.POKEMON_IN_BATTLE
 * @param pokemon {@link Pokemon} The pokemon to check the validity of.
 * @param valid {@link Utils.BooleanHolder} A BooleanHolder, the value gets set to false if the pokemon isn't allowed.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType.POKEMON_IN_BATTLE, pokemon: Pokemon, valid: Utils.BooleanHolder): boolean;
/**
 * Apply all challenges that modify what fixed battles there are.
 * @param gameMode {@link GameMode} The current gameMode
 * @param challengeType {@link ChallengeType} ChallengeType.FIXED_BATTLES
 * @param waveIndex {@link Number} The current wave index.
 * @param battleConfig {@link FixedBattleConfig} The battle config to modify.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType.FIXED_BATTLES, waveIndex: Number, battleConfig: FixedBattleConfig): boolean;
/**
 * Apply all challenges that modify type effectiveness.
 * @param gameMode {@linkcode GameMode} The current gameMode
 * @param challengeType {@linkcode ChallengeType} ChallengeType.TYPE_EFFECTIVENESS
 * @param effectiveness {@linkcode Utils.NumberHolder} The current effectiveness of the move.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType.TYPE_EFFECTIVENESS, effectiveness: Utils.NumberHolder): boolean;
/**
 * Apply all challenges that modify what level AI are.
 * @param gameMode {@link GameMode} The current gameMode
 * @param challengeType {@link ChallengeType} ChallengeType.AI_LEVEL
 * @param level {@link Utils.IntegerHolder} The generated level of the pokemon.
 * @param levelCap {@link Number} The maximum level cap for the current wave.
 * @param isTrainer {@link Boolean} Whether this is a trainer pokemon.
 * @param isBoss {@link Boolean} Whether this is a non-trainer boss pokemon.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType.AI_LEVEL, level: Utils.IntegerHolder, levelCap: number, isTrainer: boolean, isBoss: boolean): boolean;
/**
 * Apply all challenges that modify how many move slots the AI has.
 * @param gameMode {@link GameMode} The current gameMode
 * @param challengeType {@link ChallengeType} ChallengeType.AI_MOVE_SLOTS
 * @param pokemon {@link Pokemon} The pokemon being considered.
 * @param moveSlots {@link Utils.IntegerHolder} The amount of move slots.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType.AI_MOVE_SLOTS, pokemon: Pokemon, moveSlots: Utils.IntegerHolder): boolean;
/**
 * Apply all challenges that modify whether a pokemon has its passive.
 * @param gameMode {@link GameMode} The current gameMode
 * @param challengeType {@link ChallengeType} ChallengeType.PASSIVE_ACCESS
 * @param pokemon {@link Pokemon} The pokemon to modify.
 * @param hasPassive {@link Utils.BooleanHolder} Whether it has its passive.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType.PASSIVE_ACCESS, pokemon: Pokemon, hasPassive: Utils.BooleanHolder): boolean;
/**
 * Apply all challenges that modify the game modes settings.
 * @param gameMode {@link GameMode} The current gameMode
 * @param challengeType {@link ChallengeType} ChallengeType.GAME_MODE_MODIFY
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType.GAME_MODE_MODIFY): boolean;
/**
 * Apply all challenges that modify what level a pokemon can access a move.
 * @param gameMode {@link GameMode} The current gameMode
 * @param challengeType {@link ChallengeType} ChallengeType.MOVE_ACCESS
 * @param pokemon {@link Pokemon} What pokemon would learn the move.
 * @param moveSource {@link MoveSourceType} What source the pokemon would get the move from.
 * @param move {@link Moves} The move in question.
 * @param level {@link Utils.IntegerHolder} The level threshold for access.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType.MOVE_ACCESS, pokemon: Pokemon, moveSource: MoveSourceType, move: Moves, level: Utils.IntegerHolder): boolean;
/**
 * Apply all challenges that modify what weight a pokemon gives to move generation
 * @param gameMode {@link GameMode} The current gameMode
 * @param challengeType {@link ChallengeType} ChallengeType.MOVE_WEIGHT
 * @param pokemon {@link Pokemon} What pokemon would learn the move.
 * @param moveSource {@link MoveSourceType} What source the pokemon would get the move from.
 * @param move {@link Moves} The move in question.
 * @param weight {@link Utils.IntegerHolder} The weight of the move.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType.MOVE_WEIGHT, pokemon: Pokemon, moveSource: MoveSourceType, move: Moves, weight: Utils.IntegerHolder): boolean;
export function applyChallenges(gameMode: GameMode, challengeType: ChallengeType, ...args: any[]): boolean {
  let ret = false;
  gameMode.challenges.forEach(c => {
    if (c.value !== 0) {
      switch (challengeType) {
      case ChallengeType.STARTER_CHOICE:
        ret ||= c.applyStarterChoice(args[0], args[1], args[2], args[3]);
        break;
      case ChallengeType.STARTER_POINTS:
        ret ||= c.applyStarterPoints(args[0]);
        break;
      case ChallengeType.STARTER_COST:
        ret ||= c.applyStarterCost(args[0], args[1]);
        break;
      case ChallengeType.STARTER_MODIFY:
        ret ||= c.applyStarterModify(args[0]);
        break;
      case ChallengeType.POKEMON_IN_BATTLE:
        ret ||= c.applyPokemonInBattle(args[0], args[1]);
        break;
      case ChallengeType.FIXED_BATTLES:
        ret ||= c.applyFixedBattle(args[0], args[1]);
        break;
      case ChallengeType.TYPE_EFFECTIVENESS:
        ret ||= c.applyTypeEffectiveness(args[0]);
        break;
      case ChallengeType.AI_LEVEL:
        ret ||= c.applyLevelChange(args[0], args[1], args[2], args[3]);
        break;
      case ChallengeType.AI_MOVE_SLOTS:
        ret ||= c.applyMoveSlot(args[0], args[1]);
        break;
      case ChallengeType.PASSIVE_ACCESS:
        ret ||= c.applyPassiveAccess(args[0], args[1]);
        break;
      case ChallengeType.GAME_MODE_MODIFY:
        ret ||= c.applyGameModeModify(gameMode);
        break;
      case ChallengeType.MOVE_ACCESS:
        ret ||= c.applyMoveAccessLevel(args[0], args[1], args[2], args[3]);
        break;
      case ChallengeType.MOVE_WEIGHT:
        ret ||= c.applyMoveWeight(args[0], args[1], args[2], args[3]);
        break;
      }
    }
  });
  return ret;
}

/**
 *
 * @param source A challenge to copy, or an object of a challenge's properties. Missing values are treated as defaults.
 * @returns The challenge in question.
 */
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
  case Challenges.FRESH_START:
    return FreshStartChallenge.loadChallenge(source);
  case Challenges.INVERSE_BATTLE:
    return InverseBattleChallenge.loadChallenge(source);
  }
  throw new Error("Unknown challenge copied");
}

export const allChallenges: Challenge[] = [];

export function initChallenges() {
  allChallenges.push(
    new SingleGenerationChallenge(),
    new SingleTypeChallenge(),
    new FreshStartChallenge(),
    new InverseBattleChallenge(),
  );
}
