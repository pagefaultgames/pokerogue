import type { FixedBattleConfig } from "#app/battle";
import { getRandomTrainerFunc } from "#app/battle";
import type { GameMode } from "#app/game-mode";
import { globalScene } from "#app/global-scene";
import { defaultStarterSpeciesAndEvolutions } from "#balance/pokemon-evolutions";
import { type StarterSpeciesId, speciesStarterCosts } from "#balance/starters";
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
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Nature } from "#enums/nature";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import { TrainerVariant } from "#enums/trainer-variant";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#field/pokemon";
import { Trainer } from "#field/trainer";
import type { ModifierTypeOption } from "#modifiers/modifier-type";
import { PokemonMove } from "#moves/pokemon-move";
import type { GameData } from "#system/game-data";
import { RibbonData, type RibbonFlag } from "#system/ribbons/ribbon-data";
import type { DexEntry } from "#types/dex-data";
import type { DexAttrProps, StarterDataEntry } from "#types/save-data";
import { type BooleanHolder, isBetween, type NumberHolder, randSeedItem } from "#utils/common";
import { deepCopy } from "#utils/data";
import { getPokemonSpecies, getPokemonSpeciesForm } from "#utils/pokemon-utils";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

/** A constant for the default max cost of the starting party before a run */
const DEFAULT_PARTY_MAX_COST = 10;

type ChallengeCondition = (data: GameData) => boolean;

export abstract class Challenge {
  /** The id of the challenge */
  public readonly id: Challenges;

  /** The "strength" of the challenge, all challenges have a numerical value. */
  public value = 0;
  /** The maximum strength of the challenge. */
  public readonly maxValue: number;
  /** The current severity of the challenge. Some challenges have multiple severities in addition to strength. */
  public severity = 0;
  /** The maximum severity of the challenge. */
  public maxSeverity = 0;
  public conditions: ChallengeCondition[] = [];

  /**
   * The Ribbon awarded on challenge completion, or 0 if the challenge has no ribbon or is not enabled
   *
   * @defaultValue 0
   */
  public get ribbonAwarded(): RibbonFlag {
    return 0n as RibbonFlag;
  }

  /**
   * @param id - The enum value for the challenge
   */
  constructor(id: Challenges, maxValue: number = Number.MAX_SAFE_INTEGER) {
    this.id = id;

    this.maxValue = maxValue;
  }

  /** Reset the challenge to a base state. */
  reset(): void {
    this.value = 0;
    this.severity = 0;
  }

  /** @returns The i18n key for this challenge */
  private geti18nKey(): string {
    return toCamelCase(Challenges[this.id]);
  }

  /**
   * Check if an unlockable challenge is unlocked
   * @param data - The save data
   * @returns Whether this challenge is unlocked
   */
  isUnlocked(data: GameData): boolean {
    return this.conditions.every(f => f(data));
  }

  /**
   * Adds an unlock condition to this challenge.
   * @param condition - The condition to add
   * @returns This challenge
   */
  condition(condition: ChallengeCondition): Challenge {
    this.conditions.push(condition);

    return this;
  }

  /** @returns The localised name of this challenge. */
  getName(): string {
    return i18next.t(`challenges:${this.geti18nKey()}.name`);
  }

  /**
   * Return the textual representation of a challenge's current value.
   * @param overrideValue - (Default `this.value`) Overrides the value used
   * @returns The localised text for the current value.
   */
  getValue(overrideValue: number = this.value): string {
    return i18next.t(`challenges:${this.geti18nKey()}.value.${overrideValue}`);
  }

  /**
   * Return the description of a challenge's current value.
   * @param overrideValue - (Default `this.value`) Overrides the value used
   * @returns The localised description for the current value.
   */
  // TODO: Do we need an override value here? it's currently unused
  getDescription(overrideValue: number = this.value): string {
    return `${i18next.t([`challenges:${this.geti18nKey()}.desc.${overrideValue}`, `challenges:${this.geti18nKey()}.desc`])}`;
  }

  /**
   * Increase the value of the challenge
   * @returns Whether the value changed
   * @sealed
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
   * @returns Whether the value changed
   * @sealed
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
   * @sealed
   */
  hasSeverity(): boolean {
    return this.value !== 0 && this.maxSeverity > 0;
  }

  /**
   * Decrease the severity of the challenge
   * @returns Whether the value changed
   * @sealed
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
   * @returns Whether the value changed
   * @sealed
   */
  increaseSeverity(): boolean {
    if (this.severity < this.maxSeverity) {
      this.severity = Math.min(this.severity + 1, this.maxSeverity);
      return true;
    }
    return false;
  }

  /** @returns The difficulty value of this challenge. */
  getDifficulty(): number {
    return this.value;
  }

  /** @returns The minimum difficulty value of this challenge. */
  getMinDifficulty(): number {
    return 0;
  }

  // TODO: Refactor the class hierarchy to remove the need for having all these methods on every class
  // biome-ignore-start lint/correctness/noUnusedFunctionParameters: pseudo-abstract methods

  /**
   * Clones a challenge, either from another challenge or json.
   * @param source - The source challenge or json.
   * @returns This challenge.
   */
  // TODO: remove `| any`
  static loadChallenge(source: Challenge | any): Challenge {
    throw new Error("Method not implemented! Use derived class");
  }

  /**
   * Modifies the availability of starters.
   * @param species - The Pokémon to check the validity of
   * @param isValid - Holder for whether the Pokémon is valid or not
   * @param dexAttr - The dex attributes of the Pokémon
   * @returns Whether this function did anything.
   */
  applyStarterChoice(species: PokemonSpecies, isValid: BooleanHolder, dexAttr: DexAttrProps): boolean {
    return false;
  }

  /**
   * Modifies the maximum points available for the player to spend on starters.
   * @param points - Holder for amount of starter points the user has to spend
   * @returns Whether this function did anything
   */
  applyStarterPoints(points: NumberHolder): boolean {
    return false;
  }

  /**
   * Modifies the cost of starters.
   * @param speciesId - The pokémon to change the cost of
   * @param cost - Holder for the cost of the starter Pokémon
   * @returns Whether this function did anything.
   */
  applyStarterCost(speciesId: StarterSpeciesId, cost: NumberHolder): boolean {
    return false;
  }

  /**
   * Modifies the dex and/or starter data of starters.
   * @param speciesId - The id of the starter Pokémon to modify.
   * @param dexEntry - The starter's dex entry
   * @param starterDataEntry - The starter's data
   * @returns Whether this function did anything.
   */
  applyStarterSelectModify(speciesId: SpeciesId, dexEntry: DexEntry, starterDataEntry: StarterDataEntry): boolean {
    return false;
  }

  /**
   * Modifies the data of chosen starters.
   * @param pokemon - The starter Pokémon to modify.
   * @returns Whether this function did anything.
   */
  applyStarterModify(pokemon: Pokemon): boolean {
    return false;
  }

  /**
   * Modifies which pokemon are allowed in battle.
   * @param pokemon - The Pokémon to check the validity of
   * @param isValid - Holds a boolean that will be set to `false` if the Pokémon isn't allowed
   * @returns Whether this function did anything
   */
  applyPokemonInBattle(pokemon: Pokemon, isValid: BooleanHolder): boolean {
    return false;
  }

  /**
   * Modifies fixed battles (e.g. Gym Leaders).
   * @param waveIndex The current wave index
   * @param battleConfig - The battle config to modify
   * @returns Whether this function did anything
   */
  applyFixedBattle(waveIndex: number, battleConfig: FixedBattleConfig): boolean {
    return false;
  }

  /**
   * Modifies the type chart (e.g. changing which types are effective against which).
   * @param effectiveness - The current effectiveness of the move
   * @returns Whether this function did anything
   */
  applyTypeEffectiveness(effectiveness: NumberHolder): boolean {
    return false;
  }

  /**
   * Modifies the level of AI Pokemon.
   * @param level - The generated level.
   * @param levelCap - The current level cap.
   * @param isTrainer - Whether this is a trainer Pokémon
   * @param isBoss - Whether this is a non-trainer boss Pokémon
   * @returns - Whether this function did anything
   */
  applyLevelChange(level: NumberHolder, levelCap: number, isTrainer: boolean, isBoss: boolean): boolean {
    return false;
  }

  /**
   * Modifies the number of move slots an AI Pokemon can have.
   * @param pokemon - The Pokémon that is being considered
   * @param moveSlots - The amount of move slots
   * @returns Whether this function did anything
   */
  applyMoveSlot(pokemon: Pokemon, moveSlots: NumberHolder): boolean {
    return false;
  }

  /**
   * Modifies the availability of passive abilities.
   * @param pokemon - The Pokémon to change
   * @param hasPassive - Whether it should have its passive
   * @returns Whether this function did anything
   */
  applyPassiveAccess(pokemon: Pokemon, hasPassive: BooleanHolder): boolean {
    return false;
  }

  /**
   * Modifies {@linkcode GameMode | globalScene.gameMode}.
   * @returns Whether this function did anything
   */
  applyGameModeModify(): boolean {
    return false;
  }

  /**
   * Modifies the levels moves can be learned at.
   * @param pokemon - What Pokémon would learn the move
   * @param moveSource - What source the Pokémon would get the move from
   * @param moveId - The move in question
   * @param level - The level threshold for access
   * @returns Whether this function did anything
   */
  applyMoveAccessLevel(pokemon: Pokemon, moveSource: MoveSourceType, moveId: MoveId, level: NumberHolder): boolean {
    return false;
  }

  /**
   * Modifies the weighting of moves when generating AI movesets.
   * @param pokemon - What Pokémon would learn the move
   * @param moveSource - What source the Pokémon would get the move from
   * @param moveId - The move in question.
   * @param weight - The base weight of the move
   * @returns Whether this function did anything
   */
  applyMoveWeight(pokemon: Pokemon, moveSource: MoveSourceType, moveId: MoveId, weight: NumberHolder): boolean {
    return false;
  }

  /**
   * Modifies the base stats of a Pokemon.
   * @param pokemon - What Pokémon would learn the move
   * @param baseStats  What are the stats to flip
   * @returns Whether this function did anything
   */
  // TODO: rename / make into a more generic function
  applyFlipStat(pokemon: Pokemon, baseStats: number[]) {
    return false;
  }

  /**
   * Modifies whether the automatic party healing after every 10th wave is enabled or not.
   * @param isEnabled - Whether party healing is enabled or not
   * @returns Whether this function did anything
   */
  applyPartyHeal(isEnabled: BooleanHolder): boolean {
    return false;
  }

  /**
   * Modifies whether the shop is available at the end of each wave.
   * @param isEnabled - Whether the shop is or is not available after a wave
   * @returns Whether this function did anything
   */
  applyShop(isEnabled: BooleanHolder) {
    return false;
  }

  /**
   * Modifies whether a Pokemon can be added to the party.
   * @param pokemon - The Pokémon being caught
   * @param isValid - Whether the Pokémon can be added to the party or not
   * @returns Whether this function did anything
   */
  applyPokemonAddToParty(pokemon: EnemyPokemon, isValid: BooleanHolder): boolean {
    return false;
  }

  /**
   * An apply function for POKEMON_FUSION. Derived classes should alter this.
   * @param pokemon - The Pokémon being checked
   * @param isValid - Whether the selected Pokémon is allowed to fuse or not
   * @returns Whether this function did anything
   */
  applyPokemonFusion(pokemon: PlayerPokemon, isValid: BooleanHolder): boolean {
    return false;
  }

  /**
   * Modifies whether a move can be used in battle.
   * @param moveId - The {@linkcode MoveId} being checked
   * @param isValid - A {@linkcode BooleanHolder} containing the move's usability status
   * @returns Whether this function did anything
   */
  applyPokemonMove(moveId: MoveId, isValid: BooleanHolder): boolean {
    return false;
  }

  /**
   * Modifies the items available in the shop.
   * @param shopItem - The item being checked
   * @param isValid - Whether the item should be added to the shop or not
   * @returns Whether this function did anything
   */
  // TODO: why can the item be `null`?
  applyShopItem(shopItem: ModifierTypeOption | null, isValid: BooleanHolder): boolean {
    return false;
  }

  /**
   * Modifies the items available as post-wave rewards.
   * @param reward - The reward being checked
   * @param isValid - Whether the reward should be added to the reward options or not
   * @returns Whether this function did anything
   */
  // TODO: why can the item be `null`?
  applyWaveReward(reward: ModifierTypeOption | null, isValid: BooleanHolder): boolean {
    return false;
  }

  /**
   * Modifies whether Pokemon can be revived.
   * @param isValid - Whether fainting is a permanent status or not
   * @returns Whether this function did anything
   */
  applyPreventRevive(isValid: BooleanHolder): boolean {
    return false;
  }

  // biome-ignore-end lint/correctness/noUnusedFunctionParameters: pseudo-abstract methods
}

/** Implements a mono generation challenge. */
export class SingleGenerationChallenge extends Challenge {
  public override get ribbonAwarded(): RibbonFlag {
    // NOTE: This logic will not work for the eventual mono gen 10 ribbon,
    // as its flag will not be in sequence with the other mono gen ribbons.
    return this.value ? ((RibbonData.MONO_GEN_1 << (BigInt(this.value) - 1n)) as RibbonFlag) : 0n;
  }

  constructor() {
    super(Challenges.SINGLE_GENERATION, 9);
  }

  applyStarterChoice(species: PokemonSpecies, isValid: BooleanHolder): boolean {
    if (species.generation !== this.value) {
      isValid.value = false;
      return true;
    }
    return false;
  }

  applyStarterSelectModify(speciesId: SpeciesId, dexEntry: DexEntry, _starterDataEntry: StarterDataEntry): boolean {
    // Ralts must be male and Snorunt must be female
    if (this.value === 4) {
      if (speciesId === SpeciesId.RALTS) {
        dexEntry.caughtAttr &= ~DexAttr.FEMALE;
      }
      if (speciesId === SpeciesId.SNORUNT) {
        dexEntry.caughtAttr &= ~DexAttr.MALE;
      }
    }

    return true;
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
      ClassicFixedBossWaves.EVIL_ADMIN_3,
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
    const evilAdminFight1 = [
      [TrainerType.PETREL],
      [TrainerType.PETREL],
      [
        [TrainerType.TABITHA, TrainerType.COURTNEY],
        [TrainerType.MATT, TrainerType.SHELLY],
      ],
      [TrainerType.JUPITER, TrainerType.MARS, TrainerType.SATURN],
      [TrainerType.COLRESS],
      [TrainerType.BRYONY],
      [TrainerType.FABA, TrainerType.PLUMERIA],
      [TrainerType.OLEANA],
      [TrainerType.GIACOMO, TrainerType.MELA, TrainerType.ATTICUS, TrainerType.ORTEGA, TrainerType.ERI],
    ];
    const evilAdminFight2 = [
      [TrainerType.PROTON],
      [TrainerType.PROTON],
      [
        [TrainerType.TABITHA, TrainerType.COURTNEY],
        [TrainerType.MATT, TrainerType.SHELLY],
      ],
      [TrainerType.JUPITER, TrainerType.MARS, TrainerType.SATURN],
      [TrainerType.ZINZOLIN],
      [TrainerType.BRYONY, TrainerType.XEROSIC],
      [TrainerType.FABA, TrainerType.PLUMERIA],
      [TrainerType.OLEANA],
      [TrainerType.GIACOMO, TrainerType.MELA, TrainerType.ATTICUS, TrainerType.ORTEGA, TrainerType.ERI],
    ];
    const evilAdminFight3 = [
      [TrainerType.ARCHER, TrainerType.ARIANA],
      [TrainerType.ARCHER, TrainerType.ARIANA],
      [
        [TrainerType.TABITHA, TrainerType.COURTNEY],
        [TrainerType.MATT, TrainerType.SHELLY],
      ],
      [TrainerType.JUPITER, TrainerType.MARS, TrainerType.SATURN],
      [TrainerType.COLRESS],
      [TrainerType.XEROSIC],
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
        trainerTypes = evilAdminFight1[this.value - 1];
        break;
      case ClassicFixedBossWaves.EVIL_ADMIN_2:
        trainerTypes = evilAdminFight2[this.value - 1];
        break;
      case ClassicFixedBossWaves.EVIL_ADMIN_3:
        trainerTypes = evilAdminFight3[this.value - 1];
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

  override getDifficulty(): number {
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

interface MonotypeOverride {
  /** The species to override */
  species: SpeciesId;
  /** The type to count as */
  type: PokemonType;
  /** If part of a fusion, should we check the fused species instead of the base species? */
  fusion: boolean;
}

/** Implements a mono type challenge. */
export class SingleTypeChallenge extends Challenge {
  public override get ribbonAwarded(): RibbonFlag {
    // `this.value` represents the 1-based index of pokemon type
    // `RibbonData.MONO_NORMAL` starts the flag position for the types,
    // and we shift it by 1 for the specific type.
    return this.value ? ((RibbonData.MONO_NORMAL << (BigInt(this.value) - 1n)) as RibbonFlag) : 0n;
  }

  // TODO: Find a solution for all Pokemon with this ssui issue, including Basculin and Burmy
  private static TYPE_OVERRIDES: MonotypeOverride[] = [
    { species: SpeciesId.CASTFORM, type: PokemonType.NORMAL, fusion: false },
  ];

  constructor() {
    super(Challenges.SINGLE_TYPE, 18);
  }

  override applyStarterChoice(species: PokemonSpecies, isValid: BooleanHolder, dexAttr: DexAttrProps): boolean {
    const speciesForm = getPokemonSpeciesForm(species.speciesId, dexAttr.formIndex);
    const types = [speciesForm.type1, speciesForm.type2];
    if (!types.includes(this.value - 1)) {
      isValid.value = false;
      return true;
    }
    return false;
  }

  applyStarterSelectModify(speciesId: SpeciesId, dexEntry: DexEntry, _starterDataEntry: StarterDataEntry): boolean {
    const type = this.value - 1;

    if (speciesId === SpeciesId.RALTS && type === PokemonType.FIGHTING) {
      dexEntry.caughtAttr &= ~DexAttr.FEMALE;
    } else if (speciesId === SpeciesId.SNORUNT && type === PokemonType.GHOST) {
      dexEntry.caughtAttr &= ~DexAttr.MALE;
    } else if (speciesId === SpeciesId.BURMY) {
      if (type === PokemonType.FLYING) {
        dexEntry.caughtAttr &= ~DexAttr.FEMALE;
      } else if ([PokemonType.GRASS, PokemonType.GROUND, PokemonType.STEEL].includes(type)) {
        dexEntry.caughtAttr &= ~DexAttr.MALE;
      }
    }

    return true;
  }

  applyPokemonInBattle(pokemon: Pokemon, valid: BooleanHolder): boolean {
    if (
      pokemon.isPlayer()
      && !pokemon.isOfType(this.value - 1, false, false, true)
      && !SingleTypeChallenge.TYPE_OVERRIDES.some(
        o =>
          o.type === this.value - 1
          && (pokemon.isFusion() && o.fusion ? pokemon.fusionSpecies! : pokemon.species).speciesId === o.species, // TODO: is the bang on fusionSpecies correct?
      )
    ) {
      valid.value = false;
      return true;
    }
    return false;
  }

  override getDifficulty(): number {
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

/** Implements a fresh start challenge. */
export class FreshStartChallenge extends Challenge {
  public override get ribbonAwarded(): RibbonFlag {
    return this.value ? RibbonData.FRESH_START : 0n;
  }
  constructor() {
    super(Challenges.FRESH_START, 2);
  }

  applyStarterChoice(species: PokemonSpecies, isValid: BooleanHolder): boolean {
    if (this.value === 1 && !defaultStarterSpeciesAndEvolutions.includes(species.speciesId)) {
      isValid.value = false;
      return true;
    }
    return false;
  }

  applyStarterCost(speciesId: StarterSpeciesId, cost: NumberHolder): boolean {
    cost.value = speciesStarterCosts[speciesId];
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
    pokemon.abilityIndex %= 2; // Always base ability, if you set it to hidden it wraps to first ability
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

/** Implements an inverse battle challenge. */
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

/** Implements a flip stat challenge. */
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

/** Lowers the amount of starter points available. */
export class LowerStarterMaxCostChallenge extends Challenge {
  constructor() {
    super(Challenges.LOWER_MAX_STARTER_COST, 9);
  }

  getValue(overrideValue: number = this.value): string {
    return (DEFAULT_PARTY_MAX_COST - overrideValue).toString();
  }

  applyStarterChoice(species: PokemonSpecies, isValid: BooleanHolder): boolean {
    if (speciesStarterCosts[species.speciesId] > DEFAULT_PARTY_MAX_COST - this.value) {
      isValid.value = false;
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

/** Lowers the maximum cost of starters available. */
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

/** Implements a No Support challenge */
export class LimitedSupportChallenge extends Challenge {
  public override get ribbonAwarded(): RibbonFlag {
    switch (this.value) {
      case 1:
        return RibbonData.NO_HEAL as RibbonFlag;
      case 2:
        return RibbonData.NO_SHOP as RibbonFlag;
      case 3:
        return (RibbonData.NO_HEAL | RibbonData.NO_SHOP | RibbonData.NO_SUPPORT) as RibbonFlag;
      default:
        return 0n as RibbonFlag;
    }
  }
  constructor() {
    super(Challenges.LIMITED_SUPPORT, 3);
  }

  override applyPartyHeal(isEnabled: BooleanHolder): boolean {
    if (isEnabled.value) {
      isEnabled.value = this.value === 2;
      return true;
    }
    return false;
  }

  override applyShop(isEnabled: BooleanHolder): boolean {
    if (isEnabled.value) {
      isEnabled.value = this.value === 1;
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

/** Implements a Limited Catch challenge */
export class LimitedCatchChallenge extends Challenge {
  public override get ribbonAwarded(): RibbonFlag {
    return this.value ? RibbonData.LIMITED_CATCH : 0n;
  }
  constructor() {
    super(Challenges.LIMITED_CATCH, 1);
  }

  override applyPokemonAddToParty(pokemon: EnemyPokemon, isValid: BooleanHolder): boolean {
    if (isValid.value) {
      const isTeleporter =
        globalScene.currentBattle.mysteryEncounter?.encounterType === MysteryEncounterType.TELEPORTING_HIJINKS
        && globalScene.currentBattle.mysteryEncounter.selectedOption
          !== globalScene.currentBattle.mysteryEncounter.options[2]; // don't allow catch when not choosing biome change option
      const isFirstWave = pokemon.metWave % 10 === 1;
      isValid.value = isTeleporter || isFirstWave;
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

/** Implements a Permanent Faint challenge */
export class HardcoreChallenge extends Challenge {
  public override get ribbonAwarded(): RibbonFlag {
    return this.value ? RibbonData.HARDCORE : 0n;
  }
  constructor() {
    super(Challenges.HARDCORE, 1);
  }

  override applyPokemonFusion(pokemon: PlayerPokemon, isValid: BooleanHolder): boolean {
    if (!isValid.value) {
      isValid.value = pokemon.isFainted();
      return true;
    }
    return false;
  }

  override applyShopItem(shopItem: ModifierTypeOption | null, isValid: BooleanHolder): boolean {
    isValid.value = shopItem?.type.group !== "revive";
    return true;
  }

  override applyWaveReward(reward: ModifierTypeOption | null, isValid: BooleanHolder): boolean {
    return this.applyShopItem(reward, isValid);
  }

  override applyPokemonMove(moveId: MoveId, isValid: BooleanHolder) {
    if (isValid.value) {
      isValid.value = moveId !== MoveId.REVIVAL_BLESSING;
      return true;
    }
    return false;
  }

  override applyPreventRevive(isValid: BooleanHolder): boolean {
    if (!isValid.value) {
      isValid.value = true;
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

export class PassivesChallenge extends Challenge {
  public override get ribbonAwarded(): RibbonFlag {
    return this.value ? RibbonData.PASSIVE_CHALLENGE : 0n;
  }

  constructor() {
    super(Challenges.PASSIVES, 2);
  }

  override applyPassiveAccess(pokemon: Pokemon, hasPassive: BooleanHolder): boolean {
    const isTrainer = pokemon.hasTrainer() && pokemon.isEnemy();
    const isFinalBoss = pokemon.isBoss() && globalScene.gameMode.isWaveFinal(globalScene.currentBattle?.waveIndex);
    if (!isTrainer && this.value === 1 && !isFinalBoss) {
      return false;
    }
    hasPassive.value = true;
    return true;
  }

  static override loadChallenge(source: PassivesChallenge | any): PassivesChallenge {
    const newChallenge = new PassivesChallenge();
    newChallenge.value = source.value;
    newChallenge.severity = source.severity;
    return newChallenge;
  }
}

/**
 * @param source - A challenge to copy, or an object of a challenge's properties. Missing values are treated as defaults.
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
    case Challenges.PASSIVES:
      return PassivesChallenge.loadChallenge(source);
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
    new PassivesChallenge(),
    new InverseBattleChallenge(),
    new FlipStatChallenge(),
  );
}
