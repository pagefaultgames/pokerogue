import { BooleanHolder, type NumberHolder, randSeedItem, deepCopy } from "#app/utils/common";
import i18next from "i18next";
import type { DexAttrProps, GameData } from "#app/system/game-data";
import { defaultStarterSpecies } from "#app/system/game-data";
import type PokemonSpecies from "#app/data/pokemon-species";
import { getPokemonSpecies, getPokemonSpeciesForm } from "#app/data/pokemon-species";
import { speciesStarterCosts } from "#app/data/balance/starters";
import type Pokemon from "#app/field/pokemon";
import { PokemonMove } from "#app/field/pokemon";
import type { FixedBattleConfig } from "#app/battle";
import { getRandomTrainerFunc } from "#app/battle";
import { ClassicFixedBossWaves } from "#enums/fixed-boss-waves";
import { BattleType } from "#enums/battle-type";
import Trainer, { TrainerVariant } from "#app/field/trainer";
import { PokemonType } from "#enums/pokemon-type";
import { Challenges } from "#enums/challenges";
import { Species } from "#enums/species";
import { TrainerType } from "#enums/trainer-type";
import { Nature } from "#enums/nature";
import type { Moves } from "#enums/moves";
import { TypeColor, TypeShadow } from "#enums/color";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { globalScene } from "#app/global-scene";
import { pokemonFormChanges } from "./pokemon-forms";
import { pokemonEvolutions } from "./balance/pokemon-evolutions";

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
  /**
   * Modifies what the pokemon stats for Flip Stat Mode.
   */
  FLIP_STAT,
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
  RARE_EGG,
}

/**
 * A challenge object. Exists only to serve as a base class.
 */
export abstract class Challenge {
  public id: Challenges; // The id of the challenge

  public value: number; // The "strength" of the challenge, all challenges have a numerical value.
  public maxValue: number; // The maximum strength of the challenge.
  public severity: number; // The current severity of the challenge. Some challenges have multiple severities in addition to strength.
  public maxSeverity: number; // The maximum severity of the challenge.

  public conditions: ChallengeCondition[];

  /**
   * @param id {@link Challenges} The enum value for the challenge
   */
  constructor(id: Challenges, maxValue: number = Number.MAX_SAFE_INTEGER) {
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
    return Challenges[this.id]
      .split("_")
      .map((f, i) => (i ? `${f[0]}${f.slice(1).toLowerCase()}` : f.toLowerCase()))
      .join("");
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
   * @param overrideValue {@link number} The value to check for. If undefined, gets the current value.
   * @returns {@link string} The localised name for the current value.
   */
  getValue(overrideValue?: number): string {
    const value = overrideValue ?? this.value;
    return i18next.t(`challenges:${this.geti18nKey()}.value.${value}`);
  }

  /**
   * Returns the description of a challenge's current value.
   * @param overrideValue {@link number} The value to check for. If undefined, gets the current value.
   * @returns {@link string} The localised description for the current value.
   */
  getDescription(overrideValue?: number): string {
    const value = overrideValue ?? this.value;
    return `${i18next.t([`challenges:${this.geti18nKey()}.desc.${value}`, `challenges:${this.geti18nKey()}.desc`])}`;
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
  getDifficulty(): number {
    return this.value;
  }

  /**
   * Gets the minimum difficulty added by this challenge.
   * @returns {@link integer} The difficulty value.
   */
  getMinDifficulty(): number {
    return 0;
  }

  /**
   * Clones a challenge, either from another challenge or json. Chainable.
   * @param source The source challenge or json.
   * @returns This challenge.
   */
  static loadChallenge(_source: Challenge | any): Challenge {
    throw new Error("Method not implemented! Use derived class");
  }

  /**
   * An apply function for STARTER_CHOICE challenges. Derived classes should alter this.
   * @param _pokemon {@link PokemonSpecies} The pokemon to check the validity of.
   * @param _valid {@link BooleanHolder} A BooleanHolder, the value gets set to false if the pokemon isn't allowed.
   * @param _dexAttr {@link DexAttrProps} The dex attributes of the pokemon.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyStarterChoice(_pokemon: PokemonSpecies, _valid: BooleanHolder, _dexAttr: DexAttrProps): boolean {
    return false;
  }

  /**
   * An apply function for STARTER_POINTS challenges. Derived classes should alter this.
   * @param _points {@link NumberHolder} The amount of points you have available.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyStarterPoints(_points: NumberHolder): boolean {
    return false;
  }

  /**
   * An apply function for STARTER_COST challenges. Derived classes should alter this.
   * @param _species {@link Species} The pokemon to change the cost of.
   * @param _cost {@link NumberHolder} The cost of the starter.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyStarterCost(_species: Species, _cost: NumberHolder): boolean {
    return false;
  }

  /**
   * An apply function for STARTER_MODIFY challenges. Derived classes should alter this.
   * @param _pokemon {@link Pokemon} The starter pokemon to modify.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyStarterModify(_pokemon: Pokemon): boolean {
    return false;
  }

  /**
   * An apply function for POKEMON_IN_BATTLE challenges. Derived classes should alter this.
   * @param _pokemon {@link Pokemon} The pokemon to check the validity of.
   * @param _valid {@link BooleanHolder} A BooleanHolder, the value gets set to false if the pokemon isn't allowed.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyPokemonInBattle(_pokemon: Pokemon, _valid: BooleanHolder): boolean {
    return false;
  }

  /**
   * An apply function for FIXED_BATTLE challenges. Derived classes should alter this.
   * @param _waveIndex {@link Number} The current wave index.
   * @param _battleConfig {@link FixedBattleConfig} The battle config to modify.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyFixedBattle(_waveIndex: number, _battleConfig: FixedBattleConfig): boolean {
    return false;
  }

  /**
   * An apply function for TYPE_EFFECTIVENESS challenges. Derived classes should alter this.
   * @param _effectiveness {@linkcode NumberHolder} The current effectiveness of the move.
   * @returns Whether this function did anything.
   */
  applyTypeEffectiveness(_effectiveness: NumberHolder): boolean {
    return false;
  }

  /**
   * An apply function for AI_LEVEL challenges. Derived classes should alter this.
   * @param _level {@link NumberHolder} The generated level.
   * @param _levelCap {@link Number} The current level cap.
   * @param _isTrainer {@link Boolean} Whether this is a trainer pokemon.
   * @param _isBoss {@link Boolean} Whether this is a non-trainer boss pokemon.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyLevelChange(_level: NumberHolder, _levelCap: number, _isTrainer: boolean, _isBoss: boolean): boolean {
    return false;
  }

  /**
   * An apply function for AI_MOVE_SLOTS challenges. Derived classes should alter this.
   * @param pokemon {@link Pokemon} The pokemon that is being considered.
   * @param moveSlots {@link NumberHolder} The amount of move slots.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyMoveSlot(_pokemon: Pokemon, _moveSlots: NumberHolder): boolean {
    return false;
  }

  /**
   * An apply function for PASSIVE_ACCESS challenges. Derived classes should alter this.
   * @param pokemon {@link Pokemon} The pokemon to change.
   * @param hasPassive {@link BooleanHolder} Whether it should have its passive.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyPassiveAccess(_pokemon: Pokemon, _hasPassive: BooleanHolder): boolean {
    return false;
  }

  /**
   * An apply function for GAME_MODE_MODIFY challenges. Derived classes should alter this.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyGameModeModify(): boolean {
    return false;
  }

  /**
   * An apply function for MOVE_ACCESS. Derived classes should alter this.
   * @param _pokemon {@link Pokemon} What pokemon would learn the move.
   * @param _moveSource {@link MoveSourceType} What source the pokemon would get the move from.
   * @param _move {@link Moves} The move in question.
   * @param _level {@link NumberHolder} The level threshold for access.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyMoveAccessLevel(_pokemon: Pokemon, _moveSource: MoveSourceType, _move: Moves, _level: NumberHolder): boolean {
    return false;
  }

  /**
   * An apply function for MOVE_WEIGHT. Derived classes should alter this.
   * @param _pokemon {@link Pokemon} What pokemon would learn the move.
   * @param _moveSource {@link MoveSourceType} What source the pokemon would get the move from.
   * @param _move {@link Moves} The move in question.
   * @param _weight {@link NumberHolder} The base weight of the move
   * @returns {@link boolean} Whether this function did anything.
   */
  applyMoveWeight(_pokemon: Pokemon, _moveSource: MoveSourceType, _move: Moves, _level: NumberHolder): boolean {
    return false;
  }

  /**
   * An apply function for FlipStats. Derived classes should alter this.
   * @param _pokemon {@link Pokemon} What pokemon would learn the move.
   * @param _baseStats  What are the stats to flip.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyFlipStat(_pokemon: Pokemon, _baseStats: number[]) {
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

  applyStarterChoice(pokemon: PokemonSpecies, valid: BooleanHolder): boolean {
    if (pokemon.generation !== this.value) {
      valid.value = false;
      return true;
    }
    return false;
  }

  applyPokemonInBattle(pokemon: Pokemon, valid: BooleanHolder): boolean {
    const baseGeneration = getPokemonSpecies(pokemon.species.speciesId).generation;
    const fusionGeneration = pokemon.isFusion() ? getPokemonSpecies(pokemon.fusionSpecies!.speciesId).generation : 0;
    if (
      pokemon.isPlayer() &&
      (baseGeneration !== this.value || (pokemon.isFusion() && fusionGeneration !== this.value))
    ) {
      valid.value = false;
      return true;
    }
    return false;
  }

  applyFixedBattle(waveIndex: number, battleConfig: FixedBattleConfig): boolean {
    let trainerTypes: (TrainerType | TrainerType[])[] = [];
    const evilTeamWaves: number[] = [
      ClassicFixedBossWaves.EVIL_GRUNT_1,
      ClassicFixedBossWaves.EVIL_GRUNT_2,
      ClassicFixedBossWaves.EVIL_GRUNT_3,
      ClassicFixedBossWaves.EVIL_ADMIN_1,
      ClassicFixedBossWaves.EVIL_GRUNT_4,
      ClassicFixedBossWaves.EVIL_ADMIN_2,
      ClassicFixedBossWaves.EVIL_BOSS_1,
      ClassicFixedBossWaves.EVIL_BOSS_2,
    ];
    const evilTeamGrunts = [
      [TrainerType.ROCKET_GRUNT],
      [TrainerType.ROCKET_GRUNT],
      [TrainerType.MAGMA_GRUNT, TrainerType.AQUA_GRUNT],
      [TrainerType.GALACTIC_GRUNT],
      [TrainerType.PLASMA_GRUNT],
      [TrainerType.FLARE_GRUNT],
      [TrainerType.AETHER_GRUNT, TrainerType.SKULL_GRUNT],
      [TrainerType.MACRO_GRUNT],
      [TrainerType.STAR_GRUNT],
    ];
    const evilTeamAdmins = [
      [TrainerType.ARCHER, TrainerType.ARIANA, TrainerType.PROTON, TrainerType.PETREL],
      [TrainerType.ARCHER, TrainerType.ARIANA, TrainerType.PROTON, TrainerType.PETREL],
      [
        [TrainerType.TABITHA, TrainerType.COURTNEY],
        [TrainerType.MATT, TrainerType.SHELLY],
      ],
      [TrainerType.JUPITER, TrainerType.MARS, TrainerType.SATURN],
      [TrainerType.ZINZOLIN, TrainerType.COLRESS],
      [TrainerType.XEROSIC, TrainerType.BRYONY],
      [TrainerType.FABA, TrainerType.PLUMERIA],
      [TrainerType.OLEANA],
      [TrainerType.GIACOMO, TrainerType.MELA, TrainerType.ATTICUS, TrainerType.ORTEGA, TrainerType.ERI],
    ];
    const evilTeamBosses = [
      [TrainerType.ROCKET_BOSS_GIOVANNI_1],
      [TrainerType.ROCKET_BOSS_GIOVANNI_1],
      [TrainerType.MAXIE, TrainerType.ARCHIE],
      [TrainerType.CYRUS],
      [TrainerType.GHETSIS],
      [TrainerType.LYSANDRE],
      [TrainerType.LUSAMINE, TrainerType.GUZMA],
      [TrainerType.ROSE],
      [TrainerType.PENNY],
    ];
    const evilTeamBossRematches = [
      [TrainerType.ROCKET_BOSS_GIOVANNI_2],
      [TrainerType.ROCKET_BOSS_GIOVANNI_2],
      [TrainerType.MAXIE_2, TrainerType.ARCHIE_2],
      [TrainerType.CYRUS_2],
      [TrainerType.GHETSIS_2],
      [TrainerType.LYSANDRE_2],
      [TrainerType.LUSAMINE_2, TrainerType.GUZMA_2],
      [TrainerType.ROSE_2],
      [TrainerType.PENNY_2],
    ];
    switch (waveIndex) {
      case ClassicFixedBossWaves.EVIL_GRUNT_1:
        trainerTypes = evilTeamGrunts[this.value - 1];
        battleConfig.setBattleType(BattleType.TRAINER).setGetTrainerFunc(getRandomTrainerFunc(trainerTypes, true));
        return true;
      case ClassicFixedBossWaves.EVIL_GRUNT_2:
      case ClassicFixedBossWaves.EVIL_GRUNT_3:
      case ClassicFixedBossWaves.EVIL_GRUNT_4:
        trainerTypes = evilTeamGrunts[this.value - 1];
        break;
      case ClassicFixedBossWaves.EVIL_ADMIN_1:
      case ClassicFixedBossWaves.EVIL_ADMIN_2:
        trainerTypes = evilTeamAdmins[this.value - 1];
        break;
      case ClassicFixedBossWaves.EVIL_BOSS_1:
        trainerTypes = evilTeamBosses[this.value - 1];
        battleConfig
          .setBattleType(BattleType.TRAINER)
          .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
          .setGetTrainerFunc(getRandomTrainerFunc(trainerTypes, true))
          .setCustomModifierRewards({
            guaranteedModifierTiers: [
              ModifierTier.ROGUE,
              ModifierTier.ROGUE,
              ModifierTier.ULTRA,
              ModifierTier.ULTRA,
              ModifierTier.ULTRA,
            ],
            allowLuckUpgrades: false,
          });
        return true;
      case ClassicFixedBossWaves.EVIL_BOSS_2:
        trainerTypes = evilTeamBossRematches[this.value - 1];
        battleConfig
          .setBattleType(BattleType.TRAINER)
          .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
          .setGetTrainerFunc(getRandomTrainerFunc(trainerTypes, true))
          .setCustomModifierRewards({
            guaranteedModifierTiers: [
              ModifierTier.ROGUE,
              ModifierTier.ROGUE,
              ModifierTier.ULTRA,
              ModifierTier.ULTRA,
              ModifierTier.ULTRA,
              ModifierTier.ULTRA,
            ],
            allowLuckUpgrades: false,
          });
        return true;
      case ClassicFixedBossWaves.ELITE_FOUR_1:
        trainerTypes = [
          TrainerType.LORELEI,
          TrainerType.WILL,
          TrainerType.SIDNEY,
          TrainerType.AARON,
          TrainerType.SHAUNTAL,
          TrainerType.MALVA,
          randSeedItem([TrainerType.HALA, TrainerType.MOLAYNE]),
          TrainerType.MARNIE_ELITE,
          TrainerType.RIKA,
        ];
        break;
      case ClassicFixedBossWaves.ELITE_FOUR_2:
        trainerTypes = [
          TrainerType.BRUNO,
          TrainerType.KOGA,
          TrainerType.PHOEBE,
          TrainerType.BERTHA,
          TrainerType.MARSHAL,
          TrainerType.SIEBOLD,
          TrainerType.OLIVIA,
          TrainerType.NESSA_ELITE,
          TrainerType.POPPY,
        ];
        break;
      case ClassicFixedBossWaves.ELITE_FOUR_3:
        trainerTypes = [
          TrainerType.AGATHA,
          TrainerType.BRUNO,
          TrainerType.GLACIA,
          TrainerType.FLINT,
          TrainerType.GRIMSLEY,
          TrainerType.WIKSTROM,
          TrainerType.ACEROLA,
          randSeedItem([TrainerType.BEA_ELITE, TrainerType.ALLISTER_ELITE]),
          TrainerType.LARRY_ELITE,
        ];
        break;
      case ClassicFixedBossWaves.ELITE_FOUR_4:
        trainerTypes = [
          TrainerType.LANCE,
          TrainerType.KAREN,
          TrainerType.DRAKE,
          TrainerType.LUCIAN,
          TrainerType.CAITLIN,
          TrainerType.DRASNA,
          TrainerType.KAHILI,
          TrainerType.RAIHAN_ELITE,
          TrainerType.HASSEL,
        ];
        break;
      case ClassicFixedBossWaves.CHAMPION:
        trainerTypes = [
          TrainerType.BLUE,
          randSeedItem([TrainerType.RED, TrainerType.LANCE_CHAMPION]),
          randSeedItem([TrainerType.STEVEN, TrainerType.WALLACE]),
          TrainerType.CYNTHIA,
          randSeedItem([TrainerType.ALDER, TrainerType.IRIS]),
          TrainerType.DIANTHA,
          randSeedItem([TrainerType.KUKUI, TrainerType.HAU]),
          randSeedItem([TrainerType.LEON, TrainerType.MUSTARD]),
          randSeedItem([TrainerType.GEETA, TrainerType.NEMONA]),
        ];
        break;
    }
    if (trainerTypes.length === 0) {
      return false;
    }
    if (evilTeamWaves.includes(waveIndex)) {
      battleConfig
        .setBattleType(BattleType.TRAINER)
        .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
        .setGetTrainerFunc(getRandomTrainerFunc(trainerTypes, true));
      return true;
    }
    if (waveIndex >= ClassicFixedBossWaves.ELITE_FOUR_1 && waveIndex <= ClassicFixedBossWaves.CHAMPION) {
      const ttypes = trainerTypes as TrainerType[];
      battleConfig
        .setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(() => new Trainer(ttypes[this.value - 1], TrainerVariant.DEFAULT));
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
  getValue(overrideValue?: number): string {
    const value = overrideValue ?? this.value;
    if (value === 0) {
      return i18next.t("settings:off");
    }
    return i18next.t(`starterSelectUiHandler:gen${value}`);
  }

  /**
   * Returns the description of a challenge's current value.
   * @param {value} overrideValue The value to check for. If undefined, gets the current value.
   * @returns {string} The localised description for the current value.
   */
  getDescription(overrideValue?: number): string {
    const value = overrideValue ?? this.value;
    if (value === 0) {
      return i18next.t("challenges:singleGeneration.desc_default");
    }
    return i18next.t("challenges:singleGeneration.desc", {
      gen: i18next.t(`challenges:singleGeneration.gen_${value}`),
    });
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
  type: PokemonType;
  /** If part of a fusion, should we check the fused species instead of the base species? */
  fusion: boolean;
}

/**
 * Implements a mono type challenge.
 */
export class SingleTypeChallenge extends Challenge {
  private static TYPE_OVERRIDES: monotypeOverride[] = [
    { species: Species.CASTFORM, type: PokemonType.NORMAL, fusion: false },
  ];
  // TODO: Find a solution for all Pokemon with this ssui issue, including Basculin and Burmy

  constructor() {
    super(Challenges.SINGLE_TYPE, 18);
  }

  override applyStarterChoice(pokemon: PokemonSpecies, valid: BooleanHolder, dexAttr: DexAttrProps): boolean {
    const speciesForm = getPokemonSpeciesForm(pokemon.speciesId, dexAttr.formIndex);
    const types = [speciesForm.type1, speciesForm.type2];
    if (!types.includes(this.value - 1)) {
      valid.value = false;
      return true;
    }
    return false;
  }

  applyPokemonInBattle(pokemon: Pokemon, valid: BooleanHolder): boolean {
    if (
      pokemon.isPlayer() &&
      !pokemon.isOfType(this.value - 1, false, false, true) &&
      !SingleTypeChallenge.TYPE_OVERRIDES.some(
        o =>
          o.type === this.value - 1 &&
          (pokemon.isFusion() && o.fusion ? pokemon.fusionSpecies! : pokemon.species).speciesId === o.species,
      )
    ) {
      // TODO: is the bang on fusionSpecies correct?
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
  getValue(overrideValue?: number): string {
    if (overrideValue === undefined) {
      overrideValue = this.value;
    }
    return PokemonType[this.value - 1].toLowerCase();
  }

  /**
   * Returns the description of a challenge's current value.
   * @param {value} overrideValue The value to check for. If undefined, gets the current value.
   * @returns {string} The localised description for the current value.
   */
  getDescription(overrideValue?: number): string {
    if (overrideValue === undefined) {
      overrideValue = this.value;
    }
    const type = i18next.t(`pokemonInfo:Type.${PokemonType[this.value - 1]}`);
    const typeColor = `[color=${TypeColor[PokemonType[this.value - 1]]}][shadow=${TypeShadow[PokemonType[this.value - 1]]}]${type}[/shadow][/color]`;
    const defaultDesc = i18next.t("challenges:singleType.desc_default");
    const typeDesc = i18next.t("challenges:singleType.desc", {
      type: typeColor,
    });
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

  applyStarterChoice(pokemon: PokemonSpecies, valid: BooleanHolder): boolean {
    if (!defaultStarterSpecies.includes(pokemon.speciesId)) {
      valid.value = false;
      return true;
    }
    return false;
  }

  applyStarterCost(species: Species, cost: NumberHolder): boolean {
    if (defaultStarterSpecies.includes(species)) {
      cost.value = speciesStarterCosts[species];
      return true;
    }
    return false;
  }

  applyStarterModify(pokemon: Pokemon): boolean {
    pokemon.abilityIndex = 0; // Always base ability, not hidden ability
    pokemon.passive = false; // Passive isn't unlocked
    pokemon.nature = Nature.HARDY; // Neutral nature
    pokemon.moveset = pokemon.species
      .getLevelMoves()
      .filter(m => m[0] <= 5)
      .map(lm => lm[1])
      .slice(0, 4)
      .map(m => new PokemonMove(m)); // No egg moves
    pokemon.luck = 0; // No luck
    pokemon.shiny = false; // Not shiny
    pokemon.variant = 0; // Not shiny
    pokemon.formIndex = 0; // Froakie should be base form
    pokemon.ivs = [15, 15, 15, 15, 15, 15]; // Default IVs of 15 for all stats (Updated to 15 from 10 in 1.2.0)
    pokemon.teraType = pokemon.species.type1; // Always primary tera type
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

  applyTypeEffectiveness(effectiveness: NumberHolder): boolean {
    if (effectiveness.value < 1) {
      effectiveness.value = 2;
      return true;
    }
    if (effectiveness.value > 1) {
      effectiveness.value = 0.5;
      return true;
    }

    return false;
  }
}

/**
 * Implements a flip stat challenge.
 */
export class FlipStatChallenge extends Challenge {
  constructor() {
    super(Challenges.FLIP_STAT, 1);
  }

  override applyFlipStat(_pokemon: Pokemon, baseStats: number[]) {
    const origStats = deepCopy(baseStats);
    baseStats[0] = origStats[5];
    baseStats[1] = origStats[4];
    baseStats[2] = origStats[3];
    baseStats[3] = origStats[2];
    baseStats[4] = origStats[1];
    baseStats[5] = origStats[0];
    return true;
  }

  static loadChallenge(source: FlipStatChallenge | any): FlipStatChallenge {
    const newChallenge = new FlipStatChallenge();
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
  }

  /**
   * @override
   */
  getValue(overrideValue?: number): string {
    if (overrideValue === undefined) {
      overrideValue = this.value;
    }
    return (DEFAULT_PARTY_MAX_COST - overrideValue).toString();
  }

  applyStarterChoice(pokemon: PokemonSpecies, valid: BooleanHolder): boolean {
    if (speciesStarterCosts[pokemon.speciesId] > DEFAULT_PARTY_MAX_COST - this.value) {
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
  getValue(overrideValue?: number): string {
    if (overrideValue === undefined) {
      overrideValue = this.value;
    }
    return (DEFAULT_PARTY_MAX_COST - overrideValue).toString();
  }

  applyStarterPoints(points: NumberHolder): boolean {
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
 * @param challengeType {@link ChallengeType} ChallengeType.STARTER_CHOICE
 * @param pokemon {@link PokemonSpecies} The pokemon to check the validity of.
 * @param valid {@link BooleanHolder} A BooleanHolder, the value gets set to false if the pokemon isn't allowed.
 * @param dexAttr {@link DexAttrProps} The dex attributes of the pokemon.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.STARTER_CHOICE,
  pokemon: PokemonSpecies,
  valid: BooleanHolder,
  dexAttr: DexAttrProps,
): boolean;
/**
 * Apply all challenges that modify available total starter points.
 * @param challengeType {@link ChallengeType} ChallengeType.STARTER_POINTS
 * @param points {@link NumberHolder} The amount of points you have available.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(challengeType: ChallengeType.STARTER_POINTS, points: NumberHolder): boolean;
/**
 * Apply all challenges that modify the cost of a starter.
 * @param challengeType {@link ChallengeType} ChallengeType.STARTER_COST
 * @param species {@link Species} The pokemon to change the cost of.
 * @param points {@link NumberHolder} The cost of the pokemon.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.STARTER_COST,
  species: Species,
  cost: NumberHolder,
): boolean;
/**
 * Apply all challenges that modify a starter after selection.
 * @param challengeType {@link ChallengeType} ChallengeType.STARTER_MODIFY
 * @param pokemon {@link Pokemon} The starter pokemon to modify.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(challengeType: ChallengeType.STARTER_MODIFY, pokemon: Pokemon): boolean;
/**
 * Apply all challenges that what pokemon you can have in battle.
 * @param challengeType {@link ChallengeType} ChallengeType.POKEMON_IN_BATTLE
 * @param pokemon {@link Pokemon} The pokemon to check the validity of.
 * @param valid {@link BooleanHolder} A BooleanHolder, the value gets set to false if the pokemon isn't allowed.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.POKEMON_IN_BATTLE,
  pokemon: Pokemon,
  valid: BooleanHolder,
): boolean;
/**
 * Apply all challenges that modify what fixed battles there are.
 * @param challengeType {@link ChallengeType} ChallengeType.FIXED_BATTLES
 * @param waveIndex {@link Number} The current wave index.
 * @param battleConfig {@link FixedBattleConfig} The battle config to modify.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.FIXED_BATTLES,
  waveIndex: number,
  battleConfig: FixedBattleConfig,
): boolean;
/**
 * Apply all challenges that modify type effectiveness.
 * @param challengeType {@linkcode ChallengeType} ChallengeType.TYPE_EFFECTIVENESS
 * @param effectiveness {@linkcode NumberHolder} The current effectiveness of the move.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(challengeType: ChallengeType.TYPE_EFFECTIVENESS, effectiveness: NumberHolder): boolean;
/**
 * Apply all challenges that modify what level AI are.
 * @param challengeType {@link ChallengeType} ChallengeType.AI_LEVEL
 * @param level {@link NumberHolder} The generated level of the pokemon.
 * @param levelCap {@link Number} The maximum level cap for the current wave.
 * @param isTrainer {@link Boolean} Whether this is a trainer pokemon.
 * @param isBoss {@link Boolean} Whether this is a non-trainer boss pokemon.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.AI_LEVEL,
  level: NumberHolder,
  levelCap: number,
  isTrainer: boolean,
  isBoss: boolean,
): boolean;
/**
 * Apply all challenges that modify how many move slots the AI has.
 * @param challengeType {@link ChallengeType} ChallengeType.AI_MOVE_SLOTS
 * @param pokemon {@link Pokemon} The pokemon being considered.
 * @param moveSlots {@link NumberHolder} The amount of move slots.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.AI_MOVE_SLOTS,
  pokemon: Pokemon,
  moveSlots: NumberHolder,
): boolean;
/**
 * Apply all challenges that modify whether a pokemon has its passive.
 * @param challengeType {@link ChallengeType} ChallengeType.PASSIVE_ACCESS
 * @param pokemon {@link Pokemon} The pokemon to modify.
 * @param hasPassive {@link BooleanHolder} Whether it has its passive.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.PASSIVE_ACCESS,
  pokemon: Pokemon,
  hasPassive: BooleanHolder,
): boolean;
/**
 * Apply all challenges that modify the game modes settings.
 * @param challengeType {@link ChallengeType} ChallengeType.GAME_MODE_MODIFY
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(challengeType: ChallengeType.GAME_MODE_MODIFY): boolean;
/**
 * Apply all challenges that modify what level a pokemon can access a move.
 * @param challengeType {@link ChallengeType} ChallengeType.MOVE_ACCESS
 * @param pokemon {@link Pokemon} What pokemon would learn the move.
 * @param moveSource {@link MoveSourceType} What source the pokemon would get the move from.
 * @param move {@link Moves} The move in question.
 * @param level {@link NumberHolder} The level threshold for access.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.MOVE_ACCESS,
  pokemon: Pokemon,
  moveSource: MoveSourceType,
  move: Moves,
  level: NumberHolder,
): boolean;
/**
 * Apply all challenges that modify what weight a pokemon gives to move generation
 * @param challengeType {@link ChallengeType} ChallengeType.MOVE_WEIGHT
 * @param pokemon {@link Pokemon} What pokemon would learn the move.
 * @param moveSource {@link MoveSourceType} What source the pokemon would get the move from.
 * @param move {@link Moves} The move in question.
 * @param weight {@link NumberHolder} The weight of the move.
 * @returns True if any challenge was successfully applied.
 */
export function applyChallenges(
  challengeType: ChallengeType.MOVE_WEIGHT,
  pokemon: Pokemon,
  moveSource: MoveSourceType,
  move: Moves,
  weight: NumberHolder,
): boolean;

export function applyChallenges(challengeType: ChallengeType.FLIP_STAT, pokemon: Pokemon, baseStats: number[]): boolean;

export function applyChallenges(challengeType: ChallengeType, ...args: any[]): boolean {
  let ret = false;
  globalScene.gameMode.challenges.forEach(c => {
    if (c.value !== 0) {
      switch (challengeType) {
        case ChallengeType.STARTER_CHOICE:
          ret ||= c.applyStarterChoice(args[0], args[1], args[2]);
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
          ret ||= c.applyGameModeModify();
          break;
        case ChallengeType.MOVE_ACCESS:
          ret ||= c.applyMoveAccessLevel(args[0], args[1], args[2], args[3]);
          break;
        case ChallengeType.MOVE_WEIGHT:
          ret ||= c.applyMoveWeight(args[0], args[1], args[2], args[3]);
          break;
        case ChallengeType.FLIP_STAT:
          ret ||= c.applyFlipStat(args[0], args[1]);
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
    case Challenges.FLIP_STAT:
      return FlipStatChallenge.loadChallenge(source);
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
    new FlipStatChallenge(),
  );
}

/**
 * Apply all challenges to the given starter (and form) to check its validity.
 * Differs from {@linkcode checkSpeciesValidForChallenge} which only checks form changes.
 * @param species - The {@linkcode PokemonSpecies} to check the validity of.
 * @param dexAttr - The {@linkcode DexAttrProps | dex attributes} of the species, including its form index.
 * @param soft - If `true`, allow it if it could become valid through evolution or form change.
 * @returns `true` if the species is considered valid.
 */
export function checkStarterValidForChallenge(species: PokemonSpecies, props: DexAttrProps, soft: boolean) {
  if (!soft) {
    const isValidForChallenge = new BooleanHolder(true);
    applyChallenges(ChallengeType.STARTER_CHOICE, species, isValidForChallenge, props);
    return isValidForChallenge.value;
  }
  // We check the validity of every evolution and form change, and require that at least one is valid
  const speciesToCheck = [species.speciesId];
  while (speciesToCheck.length) {
    const checking = speciesToCheck.pop();
    // Linter complains if we don't handle this
    if (!checking) {
      return false;
    }
    const checkingSpecies = getPokemonSpecies(checking);
    if (checkSpeciesValidForChallenge(checkingSpecies, props, true)) {
      return true;
    }
    if (checking && pokemonEvolutions.hasOwnProperty(checking)) {
      pokemonEvolutions[checking].forEach(e => {
        // Form check to deal with cases such as Basculin -> Basculegion
        // TODO: does this miss anything if checking forms of a stage 2 Pokémon?
        if (!e?.preFormKey || e.preFormKey === species.forms[props.formIndex].formKey) {
          speciesToCheck.push(e.speciesId);
        }
      });
    }
  }
  return false;
}

/**
 * Apply all challenges to the given species (and form) to check its validity.
 * Differs from {@linkcode checkStarterValidForChallenge} which also checks evolutions.
 * @param species - The {@linkcode PokemonSpecies} to check the validity of.
 * @param dexAttr - The {@linkcode DexAttrProps | dex attributes} of the species, including its form index.
 * @param soft - If `true`, allow it if it could become valid through a form change.
 * @returns `true` if the species is considered valid.
 */
function checkSpeciesValidForChallenge(species: PokemonSpecies, props: DexAttrProps, soft: boolean) {
  const isValidForChallenge = new BooleanHolder(true);
  applyChallenges(ChallengeType.STARTER_CHOICE, species, isValidForChallenge, props);
  if (!soft || !pokemonFormChanges.hasOwnProperty(species.speciesId)) {
    return isValidForChallenge.value;
  }
  // If the form in props is valid, return true before checking other form changes
  if (soft && isValidForChallenge.value) {
    return true;
  }

  const result = pokemonFormChanges[species.speciesId].some(f1 => {
    // Exclude form changes that require the mon to be on the field to begin with
    if (!("item" in f1.trigger)) {
      return false;
    }

    return species.forms.some((f2, formIndex) => {
      if (f1.formKey === f2.formKey) {
        const formProps = { ...props, formIndex };
        const isFormValidForChallenge = new BooleanHolder(true);
        applyChallenges(ChallengeType.STARTER_CHOICE, species, isFormValidForChallenge, formProps);
        return isFormValidForChallenge.value;
      }
      return false;
    });
  });
  return result;
}
