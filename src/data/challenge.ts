import type { FixedBattleConfig } from "#app/battle";
import { getRandomTrainerFunc } from "#app/battle";
import { defaultStarterSpeciesAndEvolutions } from "#balance/pokemon-evolutions";
import { speciesStarterCosts } from "#balance/starters";
import type { PokemonSpecies } from "#data/pokemon-species";
import { AbilityAttr } from "#enums/ability-attr";
import { BattleType } from "#enums/battle-type";
import { Challenges } from "#enums/challenges";
import { TypeColor, TypeShadow } from "#enums/color";
import { DexAttr } from "#enums/dex-attr";
import { ClassicFixedBossWaves } from "#enums/fixed-boss-waves";
import { ModifierTier } from "#enums/modifier-tier";
import { MoveId } from "#enums/move-id";
import type { MoveSourceType } from "#enums/move-source-type";
import { Nature } from "#enums/nature";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import { TrainerVariant } from "#enums/trainer-variant";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#field/pokemon";
import { Trainer } from "#field/trainer";
import type { ModifierTypeOption } from "#modifiers/modifier-type";
import { PokemonMove } from "#moves/pokemon-move";
import type { DexAttrProps, GameData, StarterDataEntry } from "#system/game-data";
import { RibbonData, type RibbonFlag } from "#system/ribbons/ribbon-data";
import type { DexEntry } from "#types/dex-data";
import { type BooleanHolder, isBetween, type NumberHolder, randSeedItem } from "#utils/common";
import { deepCopy } from "#utils/data";
import { getPokemonSpecies, getPokemonSpeciesForm } from "#utils/pokemon-utils";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

/** A constant for the default max cost of the starting party before a run */
const DEFAULT_PARTY_MAX_COST = 10;

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
   * The Ribbon awarded on challenge completion, or 0 if the challenge has no ribbon or is not enabled
   *
   * @defaultValue 0
   */
  public get ribbonAwarded(): RibbonFlag {
    return 0n as RibbonFlag;
  }

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
   * Gets the localization key for the challenge
   * @returns The i18n key for this challenge as camel case.
   */
  geti18nKey(): string {
    return toCamelCase(Challenges[this.id]);
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
   * Return the textual representation of a challenge's current value.
   * @param overrideValue - The value to check for; default {@linkcode this.value}
   * @returns The localised text for the current value.
   */
  getValue(overrideValue: number = this.value): string {
    return i18next.t(`challenges:${this.geti18nKey()}.value.${overrideValue}`);
  }

  /**
   * Return the description of a challenge's current value.
   * @param overrideValue - The value to check for; default {@linkcode this.value}
   * @returns The localised description for the current value.
   */
  // TODO: Do we need an override value here? it's currently unused
  getDescription(overrideValue: number = this.value): string {
    return `${i18next.t([`challenges:${this.geti18nKey()}.desc.${overrideValue}`, `challenges:${this.geti18nKey()}.desc`])}`;
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
   * @param _species {@link SpeciesId} The pokemon to change the cost of.
   * @param _cost {@link NumberHolder} The cost of the starter.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyStarterCost(_species: SpeciesId, _cost: NumberHolder): boolean {
    return false;
  }

  /**
   * An apply function for STARTER_SELECT_MODIFY challenges. Derived classes should alter this.
   * @param _pokemon {@link Pokemon} The starter pokemon to modify.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyStarterSelectModify(_speciesId: SpeciesId, _dexEntry: DexEntry, _starterDataEntry: StarterDataEntry): boolean {
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
   * @param _move {@link MoveId} The move in question.
   * @param _level {@link NumberHolder} The level threshold for access.
   * @returns {@link boolean} Whether this function did anything.
   */
  applyMoveAccessLevel(_pokemon: Pokemon, _moveSource: MoveSourceType, _move: MoveId, _level: NumberHolder): boolean {
    return false;
  }

  /**
   * An apply function for MOVE_WEIGHT. Derived classes should alter this.
   * @param _pokemon {@link Pokemon} What pokemon would learn the move.
   * @param _moveSource {@link MoveSourceType} What source the pokemon would get the move from.
   * @param _move {@link MoveId} The move in question.
   * @param _weight {@link NumberHolder} The base weight of the move
   * @returns {@link boolean} Whether this function did anything.
   */
  applyMoveWeight(_pokemon: Pokemon, _moveSource: MoveSourceType, _move: MoveId, _level: NumberHolder): boolean {
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

  /**
   * An apply function for PARTY_HEAL. Derived classes should alter this.
   * @param _status - Whether party healing is enabled or not
   * @returns Whether this function did anything
   */
  applyPartyHeal(_status: BooleanHolder): boolean {
    return false;
  }

  /**
   * An apply function for SHOP. Derived classes should alter this.
   * @param _status - Whether the shop is or is not available after a wave
   * @returns Whether this function did anything
   */
  applyShop(_status: BooleanHolder) {
    return false;
  }

  /**
   * An apply function for POKEMON_ADD_TO_PARTY. Derived classes should alter this.
   * @param _pokemon - The pokemon being caught
   * @param _status - Whether the pokemon can be added to the party or not
   * @return Whether this function did anything
   */
  applyPokemonAddToParty(_pokemon: EnemyPokemon, _status: BooleanHolder): boolean {
    return false;
  }

  /**
   * An apply function for POKEMON_FUSION. Derived classes should alter this.
   * @param _pokemon - The pokemon being checked
   * @param _status - Whether the selected pokemon is allowed to fuse or not
   * @returns Whether this function did anything
   */
  applyPokemonFusion(_pokemon: PlayerPokemon, _status: BooleanHolder): boolean {
    return false;
  }

  /**
   * An apply function for POKEMON_MOVE. Derived classes should alter this.
   * @param _moveId - The {@linkcode MoveId} being checked
   * @param _status - A {@linkcode BooleanHolder} containing the move's usability status
   * @returns Whether this function did anything
   */
  applyPokemonMove(_moveId: MoveId, _status: BooleanHolder): boolean {
    return false;
  }

  /**
   * An apply function for SHOP_ITEM. Derived classes should alter this.
   * @param _shopItem - The item being checked
   * @param _status - Whether the item should be added to the shop or not
   * @returns Whether this function did anything
   */
  applyShopItem(_shopItem: ModifierTypeOption | null, _status: BooleanHolder): boolean {
    return false;
  }

  /**
   * An apply function for WAVE_REWARD. Derived classes should alter this.
   * @param _reward - The reward being checked
   * @param _status - Whether the reward should be added to the reward options or not
   * @returns Whether this function did anything
   */
  applyWaveReward(_reward: ModifierTypeOption | null, _status: BooleanHolder): boolean {
    return false;
  }

  /**
   * An apply function for PREVENT_REVIVE. Derived classes should alter this.
   * @param _status - Whether fainting is a permanent status or not
   * @returns Whether this function did anything
   */
  applyPreventRevive(_status: BooleanHolder): boolean {
    return false;
  }
}

type ChallengeCondition = (data: GameData) => boolean;

/**
 * Implements a mono generation challenge.
 */
export class SingleGenerationChallenge extends Challenge {
  public override get ribbonAwarded(): RibbonFlag {
    // NOTE: This logic will not work for the eventual mono gen 10 ribbon, as
    // as its flag will not be in sequence with the other mono gen ribbons.
    return this.value ? ((RibbonData.MONO_GEN_1 << (BigInt(this.value) - 1n)) as RibbonFlag) : 0n;
  }

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
      pokemon.isPlayer()
      && (baseGeneration !== this.value || (pokemon.isFusion() && fusionGeneration !== this.value))
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

  getValue(overrideValue: number = this.value): string {
    if (overrideValue === 0) {
      return i18next.t("settings:off");
    }
    return i18next.t(`starterSelectUiHandler:gen${overrideValue}`);
  }

  getDescription(overrideValue: number = this.value): string {
    if (overrideValue === 0) {
      return i18next.t("challenges:singleGeneration.descDefault");
    }
    return i18next.t("challenges:singleGeneration.desc", {
      gen: i18next.t(`challenges:singleGeneration.gen.${overrideValue}`),
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
  species: SpeciesId;
  /** The type to count as */
  type: PokemonType;
  /** If part of a fusion, should we check the fused species instead of the base species? */
  fusion: boolean;
}

/**
 * Implements a mono type challenge.
 */
export class SingleTypeChallenge extends Challenge {
  public override get ribbonAwarded(): RibbonFlag {
    // `this.value` represents the 1-based index of pokemon type
    // `RibbonData.MONO_NORMAL` starts the flag position for the types,
    // and we shift it by 1 for the specific type.
    return this.value ? ((RibbonData.MONO_NORMAL << (BigInt(this.value) - 1n)) as RibbonFlag) : 0n;
  }
  private static TYPE_OVERRIDES: monotypeOverride[] = [
    { species: SpeciesId.CASTFORM, type: PokemonType.NORMAL, fusion: false },
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
      pokemon.isPlayer()
      && !pokemon.isOfType(this.value - 1, false, false, true)
      && !SingleTypeChallenge.TYPE_OVERRIDES.some(
        o =>
          o.type === this.value - 1
          && (pokemon.isFusion() && o.fusion ? pokemon.fusionSpecies! : pokemon.species).speciesId === o.species,
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

  getValue(overrideValue: number = this.value): string {
    return PokemonType[overrideValue - 1].toLowerCase();
  }

  getDescription(overrideValue: number = this.value): string {
    const type = i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[overrideValue - 1])}`);
    const typeColor = `[color=${TypeColor[PokemonType[overrideValue - 1]]}][shadow=${TypeShadow[PokemonType[this.value - 1]]}]${type}[/shadow][/color]`;
    const defaultDesc = i18next.t("challenges:singleType.descDefault");
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
  public override get ribbonAwarded(): RibbonFlag {
    return this.value ? RibbonData.FRESH_START : 0n;
  }
  constructor() {
    super(Challenges.FRESH_START, 2);
  }

  applyStarterChoice(pokemon: PokemonSpecies, valid: BooleanHolder): boolean {
    if (this.value === 1 && !defaultStarterSpeciesAndEvolutions.includes(pokemon.speciesId)) {
      valid.value = false;
      return true;
    }
    return false;
  }

  applyStarterCost(species: SpeciesId, cost: NumberHolder): boolean {
    cost.value = speciesStarterCosts[species];
    return true;
  }

  applyStarterSelectModify(speciesId: SpeciesId, dexEntry: DexEntry, starterDataEntry: StarterDataEntry): boolean {
    // Remove all egg moves
    starterDataEntry.eggMoves = 0;

    // Remove hidden and passive ability
    const defaultAbilities = AbilityAttr.ABILITY_1 | AbilityAttr.ABILITY_2;
    starterDataEntry.abilityAttr &= defaultAbilities;
    starterDataEntry.passiveAttr = 0;

    // Remove cost reduction
    starterDataEntry.valueReduction = 0;

    // Remove natures except for the default ones
    const neutralNaturesAttr =
      (1 << (Nature.HARDY + 1))
      | (1 << (Nature.DOCILE + 1))
      | (1 << (Nature.SERIOUS + 1))
      | (1 << (Nature.BASHFUL + 1))
      | (1 << (Nature.QUIRKY + 1));
    dexEntry.natureAttr &= neutralNaturesAttr;

    // Cap all ivs at 15
    for (let i = 0; i < 6; i++) {
      dexEntry.ivs[i] = Math.min(dexEntry.ivs[i], 15);
    }

    // Removes shiny and variants
    dexEntry.caughtAttr &= ~DexAttr.SHINY;
    dexEntry.caughtAttr &= ~(DexAttr.VARIANT_2 | DexAttr.VARIANT_3);

    // Remove unlocked forms for specific species
    if (speciesId === SpeciesId.ZYGARDE) {
      // Sets ability from power construct to aura break
      const formMask = (DexAttr.DEFAULT_FORM << 2n) - 1n;
      dexEntry.caughtAttr &= formMask;
    } else if (
      [
        SpeciesId.PIKACHU,
        SpeciesId.EEVEE,
        SpeciesId.PICHU,
        SpeciesId.ROTOM,
        SpeciesId.MELOETTA,
        SpeciesId.FROAKIE,
      ].includes(speciesId)
    ) {
      const formMask = (DexAttr.DEFAULT_FORM << 1n) - 1n; // These mons are set to form 0 because they're meant to be unlocks or mid-run form changes
      dexEntry.caughtAttr &= formMask;
    }

    return true;
  }

  applyStarterModify(pokemon: Pokemon): boolean {
    pokemon.abilityIndex = pokemon.abilityIndex % 2; // Always base ability, if you set it to hidden it wraps to first ability
    pokemon.passive = false; // Passive isn't unlocked
    let validMoves = pokemon.species
      .getLevelMoves()
      .filter(m => isBetween(m[0], 1, 5))
      .map(lm => lm[1]);
    // Filter egg moves out of the moveset
    pokemon.moveset = pokemon.moveset.filter(pm => validMoves.includes(pm.moveId));
    if (pokemon.moveset.length < 4) {
      // If there's empty slots fill with remaining valid moves
      const existingMoveIds = pokemon.moveset.map(pm => pm.moveId);
      validMoves = validMoves.filter(m => !existingMoveIds.includes(m));
      pokemon.moveset = pokemon.moveset.concat(validMoves.map(m => new PokemonMove(m))).slice(0, 4);
    }
    pokemon.luck = 0; // No luck
    pokemon.shiny = false; // Not shiny
    pokemon.variant = 0; // Not shiny
    if (pokemon.species.speciesId === SpeciesId.ZYGARDE && pokemon.formIndex >= 2) {
      pokemon.formIndex -= 2; // Sets 10%-PC to 10%-AB and 50%-PC to 50%-AB
    } else if (
      pokemon.formIndex > 0
      && [
        SpeciesId.PIKACHU,
        SpeciesId.EEVEE,
        SpeciesId.PICHU,
        SpeciesId.ROTOM,
        SpeciesId.MELOETTA,
        SpeciesId.FROAKIE,
      ].includes(pokemon.species.speciesId)
    ) {
      pokemon.formIndex = 0; // These mons are set to form 0 because they're meant to be unlocks or mid-run form changes
    }
    // Cap all ivs at 15
    for (let i = 0; i < 6; i++) {
      pokemon.ivs[i] = Math.min(pokemon.ivs[i], 15);
    }
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
  public override get ribbonAwarded(): RibbonFlag {
    return this.value ? RibbonData.INVERSE : 0n;
  }
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
  public override get ribbonAwarded(): RibbonFlag {
    return this.value ? RibbonData.FLIP_STATS : 0n;
  }
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

  getValue(overrideValue: number = this.value): string {
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

  getValue(overrideValue: number = this.value): string {
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
 * Implements a No Support challenge
 */
export class LimitedSupportChallenge extends Challenge {
  public override get ribbonAwarded(): RibbonFlag {
    return this.value ? ((RibbonData.NO_HEAL << (BigInt(this.value) - 1n)) as RibbonFlag) : 0n;
  }
  constructor() {
    super(Challenges.LIMITED_SUPPORT, 3);
  }

  override applyPartyHeal(status: BooleanHolder): boolean {
    if (status.value) {
      status.value = this.value === 2;
      return true;
    }
    return false;
  }

  override applyShop(status: BooleanHolder): boolean {
    if (status.value) {
      status.value = this.value === 1;
      return true;
    }
    return false;
  }

  static override loadChallenge(source: LimitedSupportChallenge | any): LimitedSupportChallenge {
    const newChallenge = new LimitedSupportChallenge();
    newChallenge.value = source.value;
    newChallenge.severity = source.severity;
    return newChallenge;
  }
}

/**
 * Implements a Limited Catch challenge
 */
export class LimitedCatchChallenge extends Challenge {
  public override get ribbonAwarded(): RibbonFlag {
    return this.value ? RibbonData.LIMITED_CATCH : 0n;
  }
  constructor() {
    super(Challenges.LIMITED_CATCH, 1);
  }

  override applyPokemonAddToParty(pokemon: EnemyPokemon, status: BooleanHolder): boolean {
    if (status.value) {
      status.value = pokemon.metWave % 10 === 1;
      return true;
    }
    return false;
  }

  static override loadChallenge(source: LimitedCatchChallenge | any): LimitedCatchChallenge {
    const newChallenge = new LimitedCatchChallenge();
    newChallenge.value = source.value;
    newChallenge.severity = source.severity;
    return newChallenge;
  }
}

/**
 * Implements a Permanent Faint challenge
 */
export class HardcoreChallenge extends Challenge {
  public override get ribbonAwarded(): RibbonFlag {
    return this.value ? RibbonData.HARDCORE : 0n;
  }
  constructor() {
    super(Challenges.HARDCORE, 1);
  }

  override applyPokemonFusion(pokemon: PlayerPokemon, status: BooleanHolder): boolean {
    if (!status.value) {
      status.value = pokemon.isFainted();
      return true;
    }
    return false;
  }

  override applyShopItem(shopItem: ModifierTypeOption | null, status: BooleanHolder): boolean {
    status.value = shopItem?.type.group !== "revive";
    return true;
  }

  override applyWaveReward(reward: ModifierTypeOption | null, status: BooleanHolder): boolean {
    return this.applyShopItem(reward, status);
  }

  override applyPokemonMove(moveId: MoveId, status: BooleanHolder) {
    if (status.value) {
      status.value = moveId !== MoveId.REVIVAL_BLESSING;
      return true;
    }
    return false;
  }

  override applyPreventRevive(status: BooleanHolder): boolean {
    if (!status.value) {
      status.value = true;
      return true;
    }
    return false;
  }

  static override loadChallenge(source: HardcoreChallenge | any): HardcoreChallenge {
    const newChallenge = new HardcoreChallenge();
    newChallenge.value = source.value;
    newChallenge.severity = source.severity;
    return newChallenge;
  }
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
    case Challenges.LIMITED_CATCH:
      return LimitedCatchChallenge.loadChallenge(source);
    case Challenges.LIMITED_SUPPORT:
      return LimitedSupportChallenge.loadChallenge(source);
    case Challenges.HARDCORE:
      return HardcoreChallenge.loadChallenge(source);
  }
  throw new Error("Unknown challenge copied");
}

export const allChallenges: Challenge[] = [];

export function initChallenges() {
  allChallenges.push(
    new FreshStartChallenge(),
    new HardcoreChallenge(),
    new LimitedCatchChallenge(),
    new LimitedSupportChallenge(),
    new SingleGenerationChallenge(),
    new SingleTypeChallenge(),
    new InverseBattleChallenge(),
    new FlipStatChallenge(),
  );
}
