import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#enums/battler-index";
import type { Challenges } from "#enums/challenges";
import type { EncounterAnim } from "#enums/encounter-anims";
import type { GameModes } from "#enums/game-modes";
import type { MoveUseMode } from "#enums/move-use-mode";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { StatusEffect } from "#enums/status-effect";
import type { MysteryEncounterSpriteConfig } from "#field/mystery-encounter-intro";
import { MysteryEncounterIntroVisuals } from "#field/mystery-encounter-intro";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import type { PokemonMove } from "#moves/pokemon-move";
import type { EnemyPartyConfig } from "#mystery-encounters/encounter-phase-utils";
import type { MysteryEncounterDialogue, OptionTextDisplay } from "#mystery-encounters/mystery-encounter-dialogue";
import type { MysteryEncounterOption, OptionPhaseCallback } from "#mystery-encounters/mystery-encounter-option";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import {
  EncounterPokemonRequirement,
  EncounterSceneRequirement,
  HealthRatioRequirement,
  PartySizeRequirement,
  StatusEffectRequirement,
  WaveRangeRequirement,
} from "#mystery-encounters/mystery-encounter-requirements";
import { coerceArray, isNullOrUndefined, randSeedInt } from "#utils/common";
import { capitalizeFirstLetter } from "#utils/strings";

export interface EncounterStartOfBattleEffect {
  sourcePokemon?: Pokemon;
  sourceBattlerIndex?: BattlerIndex;
  targets: BattlerIndex[];
  move: PokemonMove;
  useMode: MoveUseMode; // TODO: This should always be ignore PP...
}

const DEFAULT_MAX_ALLOWED_ENCOUNTERS = 2;
const DEFAULT_MAX_ALLOWED_ROGUE_ENCOUNTERS = 1;

/**
 * Used by {@linkcode MysteryEncounterBuilder} class to define required/optional properties on the {@linkcode MysteryEncounter} class when building.
 *
 * Should ONLY contain properties that are necessary for {@linkcode MysteryEncounter} construction.
 * Post-construct and flag data properties are defined in the {@linkcode MysteryEncounter} class itself.
 */
export interface IMysteryEncounter {
  encounterType: MysteryEncounterType;
  options: [MysteryEncounterOption, MysteryEncounterOption, ...MysteryEncounterOption[]];
  spriteConfigs: MysteryEncounterSpriteConfig[];
  encounterTier: MysteryEncounterTier;
  encounterAnimations?: EncounterAnim[];
  disallowedGameModes?: GameModes[];
  disallowedChallenges?: Challenges[];
  hideBattleIntroMessage: boolean;
  autoHideIntroVisuals: boolean;
  enterIntroVisualsFromRight: boolean;
  catchAllowed: boolean;
  fleeAllowed: boolean;
  continuousEncounter: boolean;
  maxAllowedEncounters: number;
  hasBattleAnimationsWithoutTargets: boolean;
  skipEnemyBattleTurns: boolean;
  skipToFightInput: boolean;
  preventGameStatsUpdates: boolean;

  onInit?: () => boolean;
  onVisualsStart?: () => boolean;
  doEncounterExp?: () => boolean;
  doEncounterRewards?: () => boolean;
  doContinueEncounter?: () => Promise<void>;

  requirements: EncounterSceneRequirement[];
  primaryPokemonRequirements: EncounterPokemonRequirement[];
  secondaryPokemonRequirements: EncounterPokemonRequirement[];
  excludePrimaryFromSupportRequirements: boolean;

  dialogue: MysteryEncounterDialogue;
  enemyPartyConfigs: EnemyPartyConfig[];

  dialogueTokens: Record<string, string>;
  expMultiplier: number;
}

/**
 * MysteryEncounter class that defines the logic for a single encounter
 * These objects will be saved as part of session data any time the player is on a floor with an encounter
 * Unless you know what you're doing, you should use MysteryEncounterBuilder to create an instance for this class
 */
export class MysteryEncounter implements IMysteryEncounter {
  // #region Required params

  encounterType: MysteryEncounterType;
  options: [MysteryEncounterOption, MysteryEncounterOption, ...MysteryEncounterOption[]];
  spriteConfigs: MysteryEncounterSpriteConfig[];

  // #region Optional params

  encounterTier: MysteryEncounterTier;
  /**
   * Custom battle animations that are configured for encounter effects and visuals
   * Specify here so that assets are loaded on initialization of encounter
   */
  encounterAnimations?: EncounterAnim[];
  /**
   * If specified, defines any game modes where the {@linkcode MysteryEncounter} should *NOT* spawn
   */
  disallowedGameModes?: GameModes[];
  /**
   * If specified, defines any challenges (from Challenge game mode) where the {@linkcode MysteryEncounter} should *NOT* spawn
   */
  disallowedChallenges?: Challenges[];
  /**
   * If true, hides "A Wild X Appeared" etc. messages
   * Default true
   */
  hideBattleIntroMessage: boolean;
  /**
   * If true, when an option is selected the field visuals will fade out automatically
   * Default false
   */
  autoHideIntroVisuals: boolean;
  /**
   * Intro visuals on the field will slide in from the right instead of the left
   * Default false
   */
  enterIntroVisualsFromRight: boolean;
  /**
   * If true, allows catching a wild pokemon during the encounter
   * Default false
   */
  catchAllowed: boolean;
  /**
   * If true, allows fleeing from a wild encounter (trainer battle MEs auto-disable fleeing)
   * Default true
   */
  fleeAllowed: boolean;
  /**
   * If true, encounter will continuously run through multiple battles/puzzles/etc. instead of going to next wave
   * MUST EVENTUALLY BE DISABLED TO CONTINUE TO NEXT WAVE
   * Default false
   */
  continuousEncounter: boolean;
  /**
   * Maximum number of times the encounter can be seen per run
   * Rogue tier encounters default to 1, others default to 3
   */
  maxAllowedEncounters: number;
  /**
   * If true, encounter will not animate the target Pokemon as part of battle animations
   * Used for encounters where it is not a "real" battle, but still uses battle animations and commands (see {@linkcode FunAndGamesEncounter} for an example)
   */
  hasBattleAnimationsWithoutTargets: boolean;
  /**
   * If true, will skip enemy pokemon turns during battle for the encounter
   * Used for encounters where it is not a "real" battle, but still uses battle animations and commands (see {@linkcode FunAndGamesEncounter} for an example)
   */
  skipEnemyBattleTurns: boolean;
  /**
   * If true, will skip COMMAND input and go straight to FIGHT (move select) input menu
   */
  skipToFightInput: boolean;
  /**
   * If true, will prevent updating {@linkcode GameStats} for encountering and/or defeating Pokemon
   */
  preventGameStatsUpdates: boolean;

  // #region Event callback functions

  /** Event when Encounter is first loaded, use it for data conditioning */
  onInit?: () => boolean;
  /** Event when battlefield visuals have finished sliding in and the encounter dialogue begins */
  onVisualsStart?: () => boolean;
  /** Event triggered prior to {@linkcode CommandPhase}, during {@linkcode TurnInitPhase} */
  onTurnStart?: () => boolean;
  /** Event prior to any rewards logic in {@linkcode MysteryEncounterRewardsPhase} */
  onRewards?: () => Promise<void>;
  /** Will provide the player party EXP before rewards are displayed for that wave */
  doEncounterExp?: () => boolean;
  /** Will provide the player a rewards shop for that wave */
  doEncounterRewards?: () => boolean;
  /** Will execute callback during VictoryPhase of a continuousEncounter */
  doContinueEncounter?: () => Promise<void>;
  /**
   * Can perform special logic when a ME battle is lost, before GameOver/battle retry prompt.
   * Should return `true` if it is treated as "real" Game Over, `false` if not.
   */
  onGameOver?: () => boolean;

  /**
   * Requirements
   */
  requirements: EncounterSceneRequirement[];
  /** Primary Pokemon is a single pokemon randomly selected from the party that meet ALL primary pokemon requirements */
  primaryPokemonRequirements: EncounterPokemonRequirement[];
  /**
   * Secondary Pokemon are pokemon that meet ALL secondary pokemon requirements
   * Note that an individual requirement may require multiple pokemon, but the resulting pokemon after all secondary requirements are met may be lower than expected
   * If the primary pokemon and secondary pokemon are the same and ExcludePrimaryFromSupportRequirements flag is true, primary pokemon may be promoted from secondary pool
   */
  secondaryPokemonRequirements: EncounterPokemonRequirement[];
  excludePrimaryFromSupportRequirements: boolean;
  primaryPokemon?: PlayerPokemon;
  secondaryPokemon?: PlayerPokemon[];

  // #region Post-construct / Auto-populated params
  localizationKey: string;
  /**
   * Dialogue object containing all the dialogue, messages, tooltips, etc. for an encounter
   */
  dialogue: MysteryEncounterDialogue;
  /**
   * Data used for setting up/initializing enemy party in battles
   * Can store multiple configs so that one can be chosen based on option selected
   * Should usually be defined in `onInit()` or `onPreOptionPhase()`
   */
  enemyPartyConfigs: EnemyPartyConfig[];
  /**
   * Object instance containing sprite data for an encounter when it is being spawned
   * Otherwise, will be undefined
   * You probably shouldn't do anything directly with this unless you have a very specific need
   */
  introVisuals?: MysteryEncounterIntroVisuals;

  // #region Flags

  /**
   * Can be set for uses programatic dialogue during an encounter (storing the name of one of the party's pokemon, etc.)
   * Example use: see MYSTERIOUS_CHEST
   */
  dialogueTokens: Record<string, string>;
  /**
   * Should be set depending upon option selected as part of an encounter
   * For example, if there is no battle as part of the encounter/selected option, should be set to NO_BATTLE
   * Defaults to DEFAULT
   */
  encounterMode: MysteryEncounterMode;
  /**
   * Flag for checking if it's the first time a shop is being shown for an encounter.
   * Defaults to true so that the first shop does not override the specified rewards.
   * Will be set to false after a shop is shown (so can't reroll same rarity items for free)
   */
  lockEncounterRewardTiers: boolean;
  /**
   * Will be set automatically, indicates special moves in startOfBattleEffects are complete (so will not repeat)
   */
  startOfBattleEffectsComplete: boolean;
  /**
   * Will be set by option select handlers automatically, and can be used to refer to which option was chosen by later phases
   */
  selectedOption?: MysteryEncounterOption;
  /**
   * Array containing data pertaining to free moves used at the start of a battle mystery envounter.
   */
  startOfBattleEffects: EncounterStartOfBattleEffect[] = [];
  /**
   * Can be set higher or lower based on the type of battle or exp gained for an option/encounter
   * Defaults to 1
   */
  expMultiplier: number;
  /**
   * Can add any asset load promises here during onInit() to make sure the scene awaits the loads properly
   */
  loadAssets: Promise<void>[];
  /**
   * Generic property to set any custom data required for the encounter
   * Extremely useful for carrying state/data between onPreOptionPhase/onOptionPhase/onPostOptionPhase
   */
  misc?: any;
  /**
   * Used for keeping RNG consistent on session resets, but increments when cycling through multiple "Encounters" on the same wave
   * You should only need to interact via getter/update methods
   */
  private seedOffset?: any;

  constructor(encounter: IMysteryEncounter | null) {
    if (!isNullOrUndefined(encounter)) {
      Object.assign(this, encounter);
    }
    this.encounterTier = this.encounterTier ?? MysteryEncounterTier.COMMON;
    this.localizationKey = this.localizationKey ?? "";
    this.dialogue = this.dialogue ?? {};
    this.spriteConfigs = this.spriteConfigs ? [...this.spriteConfigs] : [];
    // Default max is 1 for ROGUE encounters, 2 for others
    this.maxAllowedEncounters =
      (this.maxAllowedEncounters ?? this.encounterTier === MysteryEncounterTier.ROGUE)
        ? DEFAULT_MAX_ALLOWED_ROGUE_ENCOUNTERS
        : DEFAULT_MAX_ALLOWED_ENCOUNTERS;
    this.encounterMode = MysteryEncounterMode.DEFAULT;
    this.requirements = this.requirements ? this.requirements : [];
    this.hideBattleIntroMessage = this.hideBattleIntroMessage ?? false;
    this.autoHideIntroVisuals = this.autoHideIntroVisuals ?? true;
    this.enterIntroVisualsFromRight = this.enterIntroVisualsFromRight ?? false;
    this.continuousEncounter = this.continuousEncounter ?? false;

    // Reset any dirty flags or encounter data
    this.startOfBattleEffectsComplete = false;
    this.lockEncounterRewardTiers = true;
    this.dialogueTokens = {};
    this.enemyPartyConfigs = [];
    this.startOfBattleEffects = [];
    this.introVisuals = undefined;
    this.misc = null;
    this.expMultiplier = 1;
    this.loadAssets = [];
  }

  /**
   * Checks if the current scene state meets the requirements for the {@linkcode MysteryEncounter} to spawn
   * This is used to filter the pool of encounters down to only the ones with all requirements met
   * @returns
   */
  meetsRequirements(): boolean {
    const sceneReq = !this.requirements.some(requirement => !requirement.meetsRequirement());
    const secReqs = this.meetsSecondaryRequirementAndSecondaryPokemonSelected(); // secondary is checked first to handle cases of primary overlapping with secondary
    const priReqs = this.meetsPrimaryRequirementAndPrimaryPokemonSelected();

    return sceneReq && secReqs && priReqs;
  }

  /**
   * Checks if a specific player pokemon meets all given primary EncounterPokemonRequirements
   * Used automatically as part of {@linkcode meetsRequirements}, but can also be used to manually check certain Pokemon where needed
   * @param pokemon
   */
  pokemonMeetsPrimaryRequirements(pokemon: Pokemon): boolean {
    return !this.primaryPokemonRequirements.some(
      req =>
        !req
          .queryParty(globalScene.getPlayerParty())
          .map(p => p.id)
          .includes(pokemon.id),
    );
  }

  /**
   * Returns true if all PRIMARY {@linkcode EncounterRequirement}s for the option are met,
   * AND there is a valid Pokemon assigned to {@linkcode primaryPokemon}.
   * If both {@linkcode primaryPokemonRequirements} and {@linkcode secondaryPokemonRequirements} are defined,
   * can cause scenarios where there are not enough Pokemon that are sufficient for all requirements.
   */
  private meetsPrimaryRequirementAndPrimaryPokemonSelected(): boolean {
    if (!this.primaryPokemonRequirements || this.primaryPokemonRequirements.length === 0) {
      const activeMon = globalScene.getPlayerParty().filter(p => p.isActive(true));
      if (activeMon.length > 0) {
        this.primaryPokemon = activeMon[0];
      } else {
        this.primaryPokemon = globalScene.getPlayerParty().filter(p => p.isAllowedInBattle())[0];
      }
      return true;
    }
    let qualified: PlayerPokemon[] = globalScene.getPlayerParty();
    for (const req of this.primaryPokemonRequirements) {
      if (req.meetsRequirement()) {
        qualified = qualified.filter(pkmn => req.queryParty(globalScene.getPlayerParty()).includes(pkmn));
      } else {
        this.primaryPokemon = undefined;
        return false;
      }
    }

    if (qualified.length === 0) {
      return false;
    }

    if (this.excludePrimaryFromSupportRequirements && this.secondaryPokemon && this.secondaryPokemon.length > 0) {
      const truePrimaryPool: PlayerPokemon[] = [];
      const overlap: PlayerPokemon[] = [];
      for (const qp of qualified) {
        if (!this.secondaryPokemon.includes(qp)) {
          truePrimaryPool.push(qp);
        } else {
          overlap.push(qp);
        }
      }
      if (truePrimaryPool.length > 0) {
        // Always choose from the non-overlapping pokemon first
        this.primaryPokemon = truePrimaryPool[randSeedInt(truePrimaryPool.length, 0)];
        return true;
      }
      // If there are multiple overlapping pokemon, we're okay - just choose one and take it out of the primary pokemon pool
      if (overlap.length > 1 || this.secondaryPokemon.length - overlap.length >= 1) {
        // is this working?
        // TODO: should this use `randSeedItem`?
        this.primaryPokemon = overlap[randSeedInt(overlap.length, 0)];
        this.secondaryPokemon = this.secondaryPokemon.filter(supp => supp !== this.primaryPokemon);
        return true;
      }
      console.log(
        "Mystery Encounter Edge Case: Requirement not met due to primary pokemon overlapping with secondary pokemon. There's no valid primary pokemon left.",
      );
      return false;
    }
    // this means we CAN have the same pokemon be a primary and secondary pokemon, so just choose any qualifying one randomly.
    // TODO: should this use `randSeedItem`?
    this.primaryPokemon = qualified[randSeedInt(qualified.length, 0)];
    return true;
  }

  /**
   * Returns true if all SECONDARY {@linkcode EncounterRequirement}s for the option are met,
   * AND there is a valid Pokemon assigned to {@linkcode secondaryPokemon} (if applicable).
   * If both {@linkcode primaryPokemonRequirements} and {@linkcode secondaryPokemonRequirements} are defined,
   * can cause scenarios where there are not enough Pokemon that are sufficient for all requirements.
   */
  private meetsSecondaryRequirementAndSecondaryPokemonSelected(): boolean {
    if (!this.secondaryPokemonRequirements || this.secondaryPokemonRequirements.length === 0) {
      this.secondaryPokemon = [];
      return true;
    }

    let qualified: PlayerPokemon[] = globalScene.getPlayerParty();
    for (const req of this.secondaryPokemonRequirements) {
      if (req.meetsRequirement()) {
        qualified = qualified.filter(pkmn => req.queryParty(globalScene.getPlayerParty()).includes(pkmn));
      } else {
        this.secondaryPokemon = [];
        return false;
      }
    }
    this.secondaryPokemon = qualified;
    return true;
  }

  /**
   * Initializes encounter intro sprites based on the sprite configs defined in spriteConfigs
   */
  initIntroVisuals(): void {
    this.introVisuals = new MysteryEncounterIntroVisuals(this);
  }

  /**
   * Auto-pushes dialogue tokens from the encounter (and option) requirements.
   * Will use the first support pokemon in list
   * For multiple support pokemon in the dialogue token, it will have to be overridden.
   */
  populateDialogueTokensFromRequirements(): void {
    this.meetsRequirements();
    if (this.requirements?.length > 0) {
      for (const req of this.requirements) {
        const dialogueToken = req.getDialogueToken();
        if (dialogueToken?.length === 2) {
          this.setDialogueToken(...dialogueToken);
        }
      }
    }
    if (this.primaryPokemon && this.primaryPokemon.length > 0) {
      this.setDialogueToken("primaryName", this.primaryPokemon.getNameToRender());
      for (const req of this.primaryPokemonRequirements) {
        if (!req.invertQuery) {
          const value = req.getDialogueToken(this.primaryPokemon);
          if (value?.length === 2) {
            this.setDialogueToken("primary" + capitalizeFirstLetter(value[0]), value[1]);
          }
        }
      }
    }
    if (this.secondaryPokemonRequirements?.length > 0 && this.secondaryPokemon && this.secondaryPokemon.length > 0) {
      this.setDialogueToken("secondaryName", this.secondaryPokemon[0].getNameToRender());
      for (const req of this.secondaryPokemonRequirements) {
        if (!req.invertQuery) {
          const value = req.getDialogueToken(this.secondaryPokemon[0]);
          if (value?.length === 2) {
            this.setDialogueToken("primary" + capitalizeFirstLetter(value[0]), value[1]);
          }
          this.setDialogueToken("secondary" + capitalizeFirstLetter(value[0]), value[1]);
        }
      }
    }

    // Dialogue tokens for options
    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      opt.meetsRequirements();
      const j = i + 1;
      if (opt.requirements.length > 0) {
        for (const req of opt.requirements) {
          const dialogueToken = req.getDialogueToken();
          if (dialogueToken?.length === 2) {
            this.setDialogueToken("option" + j + capitalizeFirstLetter(dialogueToken[0]), dialogueToken[1]);
          }
        }
      }
      if (opt.primaryPokemonRequirements.length > 0 && opt.primaryPokemon) {
        this.setDialogueToken("option" + j + "PrimaryName", opt.primaryPokemon.getNameToRender());
        for (const req of opt.primaryPokemonRequirements) {
          if (!req.invertQuery) {
            const value = req.getDialogueToken(opt.primaryPokemon);
            if (value?.length === 2) {
              this.setDialogueToken("option" + j + "Primary" + capitalizeFirstLetter(value[0]), value[1]);
            }
          }
        }
      }
      if (opt.secondaryPokemonRequirements?.length > 0 && opt.secondaryPokemon && opt.secondaryPokemon.length > 0) {
        this.setDialogueToken("option" + j + "SecondaryName", opt.secondaryPokemon[0].getNameToRender());
        for (const req of opt.secondaryPokemonRequirements) {
          if (!req.invertQuery) {
            const value = req.getDialogueToken(opt.secondaryPokemon[0]);
            if (value?.length === 2) {
              this.setDialogueToken("option" + j + "Secondary" + capitalizeFirstLetter(value[0]), value[1]);
            }
          }
        }
      }
    }
  }

  /**
   * Used to cache a dialogue token for the encounter.
   * Tokens will be auto-injected via the `{{key}}` pattern with `value`,
   * when using the {@linkcode showEncounterText} and {@linkcode showEncounterDialogue} helper functions.
   *
   * @param key
   * @param value
   */
  setDialogueToken(key: string, value: string): void {
    this.dialogueTokens[key] = value;
  }

  /**
   * If an encounter uses {@linkcode MysteryEncounterMode.continuousEncounter},
   * should rely on this value for seed offset instead of wave index.
   *
   * This offset is incremented for each new {@linkcode MysteryEncounterPhase} that occurs,
   * so multi-encounter RNG will be consistent on resets and not be affected by number of turns, move RNG, etc.
   */
  getSeedOffset() {
    return this.seedOffset;
  }

  /**
   * Maintains seed offset for RNG consistency
   * Increments if the same {@linkcode MysteryEncounter} has multiple option select cycles
   */
  updateSeedOffset() {
    const currentOffset = this.seedOffset ?? globalScene.currentBattle.waveIndex * 1000;
    this.seedOffset = currentOffset + 512;
  }
}

/**
 * Builder class for creating a MysteryEncounter
 * must call `build()` at the end after specifying all params for the MysteryEncounter
 */
export class MysteryEncounterBuilder implements Partial<IMysteryEncounter> {
  options: [MysteryEncounterOption, MysteryEncounterOption, ...MysteryEncounterOption[]];
  enemyPartyConfigs: EnemyPartyConfig[] = [];

  localizationKey = "";
  dialogue: MysteryEncounterDialogue = {};
  requirements: EncounterSceneRequirement[] = [];
  primaryPokemonRequirements: EncounterPokemonRequirement[] = [];
  secondaryPokemonRequirements: EncounterPokemonRequirement[] = [];
  excludePrimaryFromSupportRequirements = true;
  dialogueTokens: Record<string, string> = {};

  hideBattleIntroMessage = false;
  autoHideIntroVisuals = true;
  enterIntroVisualsFromRight = false;
  continuousEncounter = false;
  catchAllowed = false;
  fleeAllowed = true;
  lockEncounterRewardTiers = false;
  startOfBattleEffectsComplete = false;
  hasBattleAnimationsWithoutTargets = false;
  skipEnemyBattleTurns = false;
  skipToFightInput = false;
  preventGameStatsUpdates = false;
  maxAllowedEncounters = 3;
  expMultiplier = 1;

  /**
   * REQUIRED
   */

  /**
   * @static Defines the type of encounter which is used as an identifier, should be tied to a unique MysteryEncounterType
   * NOTE: if new functions are added to {@linkcode MysteryEncounter} class
   * @param encounterType
   * @returns this
   */
  static withEncounterType(
    encounterType: MysteryEncounterType,
  ): MysteryEncounterBuilder & Pick<IMysteryEncounter, "encounterType"> {
    return Object.assign(new MysteryEncounterBuilder(), { encounterType });
  }

  /**
   * Defines an option for the encounter.
   * Use for complex options.
   * There should be at least 2 options defined and no more than 4.
   *
   * @param option MysteryEncounterOption to add, can use MysteryEncounterOptionBuilder to create instance
   * @returns
   */
  withOption(option: MysteryEncounterOption): this & Pick<IMysteryEncounter, "options"> {
    if (!this.options) {
      const options = [option];
      return Object.assign(this, { options });
    }
    this.options.push(option);
    return this;
  }

  /**
   * Defines an option + phase for the encounter.
   * Use for easy/streamlined options.
   * There should be at least 2 options defined and no more than 4.
   * If complex use {@linkcode MysteryEncounterBuilder.withOption}
   *
   * @param dialogue {@linkcode OptionTextDisplay}
   * @param callback {@linkcode OptionPhaseCallback}
   * @returns
   */
  withSimpleOption(
    dialogue: OptionTextDisplay,
    callback: OptionPhaseCallback,
  ): this & Pick<IMysteryEncounter, "options"> {
    return this.withOption(
      MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue(dialogue)
        .withOptionPhase(callback)
        .build(),
    );
  }

  /**
   * Defines an option + phase for the encounter.
   * Use for easy/streamlined options.
   * There should be at least 2 options defined and no more than 4.
   * If complex use {@linkcode MysteryEncounterBuilder.withOption}
   *
   * @param dialogue {@linkcode OptionTextDisplay}
   * @param callback {@linkcode OptionPhaseCallback}
   * @returns
   */
  withSimpleDexProgressOption(
    dialogue: OptionTextDisplay,
    callback: OptionPhaseCallback,
  ): this & Pick<IMysteryEncounter, "options"> {
    return this.withOption(
      MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withHasDexProgress(true)
        .withDialogue(dialogue)
        .withOptionPhase(callback)
        .build(),
    );
  }

  /**
   * Defines the sprites that will be shown on the enemy field when the encounter spawns
   * Can be one or more sprites, recommended not to exceed 4
   * @param spriteConfigs
   * @returns
   */
  withIntroSpriteConfigs(
    spriteConfigs: MysteryEncounterSpriteConfig[],
  ): this & Pick<IMysteryEncounter, "spriteConfigs"> {
    return Object.assign(this, { spriteConfigs });
  }

  withIntroDialogue(dialogue: MysteryEncounterDialogue["intro"] = []): this {
    this.dialogue = { ...this.dialogue, intro: dialogue };
    return this;
  }

  withIntro({
    spriteConfigs,
    dialogue,
  }: {
    spriteConfigs: MysteryEncounterSpriteConfig[];
    dialogue?: MysteryEncounterDialogue["intro"];
  }) {
    return this.withIntroSpriteConfigs(spriteConfigs).withIntroDialogue(dialogue);
  }

  /**
   * Sets the localization key used by the encounter
   * @param localizationKey the string used as the key
   * @returns `this`
   */
  setLocalizationKey(localizationKey: string): this {
    this.localizationKey = localizationKey;
    return this;
  }

  /**
   * OPTIONAL
   */

  /**
   * Sets the rarity tier for an encounter
   * If not specified, defaults to COMMON
   * Tiers are:
   * COMMON 32/64 odds
   * GREAT 16/64 odds
   * ULTRA 10/64 odds
   * ROGUE 6/64 odds
   * ULTRA_RARE Not currently used
   * @param encounterTier
   * @returns
   */
  withEncounterTier(encounterTier: MysteryEncounterTier): this & Pick<IMysteryEncounter, "encounterTier"> {
    return Object.assign(this, { encounterTier });
  }

  /**
   * Defines any EncounterAnim animations that are intended to be used during the encounter
   * EncounterAnims are custom battle animations (think Ice Beam) that can be played at any point during an encounter or callback
   * They just need to be specified here so that resources are loaded on encounter init
   * @param encounterAnimations
   * @returns
   */
  withAnimations(
    ...encounterAnimations: EncounterAnim[]
  ): this & Required<Pick<IMysteryEncounter, "encounterAnimations">> {
    const animations = coerceArray(encounterAnimations);
    return Object.assign(this, { encounterAnimations: animations });
  }

  /**
   * Defines any game modes where the Mystery Encounter should *NOT* spawn
   * @returns
   * @param disallowedGameModes
   */
  withDisallowedGameModes(
    ...disallowedGameModes: GameModes[]
  ): this & Required<Pick<IMysteryEncounter, "disallowedGameModes">> {
    const gameModes = coerceArray(disallowedGameModes);
    return Object.assign(this, { disallowedGameModes: gameModes });
  }

  /**
   * Defines any challenges (from Challenge game mode) where the Mystery Encounter should *NOT* spawn
   * @returns
   * @param disallowedChallenges
   */
  withDisallowedChallenges(
    ...disallowedChallenges: Challenges[]
  ): this & Required<Pick<IMysteryEncounter, "disallowedChallenges">> {
    const challenges = coerceArray(disallowedChallenges);
    return Object.assign(this, { disallowedChallenges: challenges });
  }

  /**
   * If true, encounter will continuously run through multiple battles/puzzles/etc. instead of going to next wave
   * MUST EVENTUALLY BE DISABLED TO CONTINUE TO NEXT WAVE
   * Default false
   * @param continuousEncounter
   */
  withContinuousEncounter(
    continuousEncounter: boolean,
  ): this & Required<Pick<IMysteryEncounter, "continuousEncounter">> {
    return Object.assign(this, { continuousEncounter });
  }

  /**
   * If true, encounter will not animate the target Pokemon as part of battle animations
   * Used for encounters where it is not a "real" battle, but still uses battle animations and commands (see {@linkcode FunAndGamesEncounter} for an example)
   * Default false
   * @param hasBattleAnimationsWithoutTargets
   */
  withBattleAnimationsWithoutTargets(
    hasBattleAnimationsWithoutTargets: boolean,
  ): this & Required<Pick<IMysteryEncounter, "hasBattleAnimationsWithoutTargets">> {
    return Object.assign(this, { hasBattleAnimationsWithoutTargets });
  }

  /**
   * If true, encounter will not animate the target Pokemon as part of battle animations
   * Used for encounters where it is not a "real" battle, but still uses battle animations and commands (see {@linkcode FunAndGamesEncounter} for an example)
   * Default false
   * @param skipEnemyBattleTurns
   */
  withSkipEnemyBattleTurns(
    skipEnemyBattleTurns: boolean,
  ): this & Required<Pick<IMysteryEncounter, "skipEnemyBattleTurns">> {
    return Object.assign(this, { skipEnemyBattleTurns });
  }

  /**
   * If true, will skip COMMAND input and go straight to FIGHT (move select) input menu
   * Default false
   * @param skipToFightInput
   */
  withSkipToFightInput(skipToFightInput: boolean): this & Required<Pick<IMysteryEncounter, "skipToFightInput">> {
    return Object.assign(this, { skipToFightInput });
  }

  /**
   * If true, will prevent updating {@linkcode GameStats} for encountering and/or defeating Pokemon
   * Default `false`
   */
  withPreventGameStatsUpdates(
    preventGameStatsUpdates: boolean,
  ): this & Required<Pick<IMysteryEncounter, "preventGameStatsUpdates">> {
    return Object.assign(this, { preventGameStatsUpdates });
  }

  /**
   * Sets the maximum number of times that an encounter can spawn in a given Classic run
   * @param maxAllowedEncounters
   * @returns
   */
  withMaxAllowedEncounters(
    maxAllowedEncounters: number,
  ): this & Required<Pick<IMysteryEncounter, "maxAllowedEncounters">> {
    return Object.assign(this, { maxAllowedEncounters });
  }

  /**
   * Specifies a requirement for an encounter
   * For example, passing requirement as "new WaveCountRequirement([2, 180])" would create a requirement that the encounter can only be spawned between waves 2 and 180
   * Existing Requirement objects are defined in mystery-encounter-requirements.ts, and more can always be created to meet a requirement need
   * @param requirement
   * @returns
   */
  withSceneRequirement(
    requirement: EncounterSceneRequirement,
  ): this & Required<Pick<IMysteryEncounter, "requirements">> {
    if (requirement instanceof EncounterPokemonRequirement) {
      new Error("Incorrectly added pokemon requirement as scene requirement.");
    }
    this.requirements.push(requirement);
    return this;
  }

  /**
   * Specifies a wave range requirement for an encounter.
   *
   * @param min min wave (or exact wave if only min is given)
   * @param max optional max wave. If not given, defaults to min => exact wave
   * @returns
   */
  withSceneWaveRangeRequirement(min: number, max?: number): this & Required<Pick<IMysteryEncounter, "requirements">> {
    return this.withSceneRequirement(new WaveRangeRequirement([min, max ?? min]));
  }

  /**
   * Specifies a party size requirement for an encounter.
   *
   * @param min min wave (or exact size if only min is given)
   * @param max optional max size. If not given, defaults to min => exact wave
   * @param excludeDisallowedPokemon if true, only counts allowed (legal in Challenge/unfainted) mons
   * @returns
   */
  withScenePartySizeRequirement(
    min: number,
    max?: number,
    excludeDisallowedPokemon = false,
  ): this & Required<Pick<IMysteryEncounter, "requirements">> {
    return this.withSceneRequirement(new PartySizeRequirement([min, max ?? min], excludeDisallowedPokemon));
  }

  /**
   * Add a primary pokemon requirement
   *
   * @param requirement {@linkcode EncounterPokemonRequirement}
   * @returns
   */
  withPrimaryPokemonRequirement(
    requirement: EncounterPokemonRequirement,
  ): this & Required<Pick<IMysteryEncounter, "primaryPokemonRequirements">> {
    if (requirement instanceof EncounterSceneRequirement) {
      new Error("Incorrectly added scene requirement as pokemon requirement.");
    }

    this.primaryPokemonRequirements.push(requirement);
    return Object.assign(this, {
      primaryPokemonRequirements: this.primaryPokemonRequirements,
    });
  }

  /**
   * Add a primary pokemon status effect requirement
   *
   * @param statusEffect the status effect/s to check
   * @param minNumberOfPokemon minimum number of pokemon to have the effect
   * @param invertQuery if true will invert the query
   * @returns
   */
  withPrimaryPokemonStatusEffectRequirement(
    statusEffect: StatusEffect | StatusEffect[],
    minNumberOfPokemon = 1,
    invertQuery = false,
  ): this & Required<Pick<IMysteryEncounter, "primaryPokemonRequirements">> {
    return this.withPrimaryPokemonRequirement(
      new StatusEffectRequirement(statusEffect, minNumberOfPokemon, invertQuery),
    );
  }

  /**
   * Add a primary pokemon health ratio requirement
   *
   * @param requiredHealthRange the health range to check
   * @param minNumberOfPokemon minimum number of pokemon to have the health range
   * @param invertQuery if true will invert the query
   * @returns
   */
  withPrimaryPokemonHealthRatioRequirement(
    requiredHealthRange: [number, number],
    minNumberOfPokemon = 1,
    invertQuery = false,
  ): this & Required<Pick<IMysteryEncounter, "primaryPokemonRequirements">> {
    return this.withPrimaryPokemonRequirement(
      new HealthRatioRequirement(requiredHealthRange, minNumberOfPokemon, invertQuery),
    );
  }

  // TODO: Maybe add an optional parameter for excluding primary pokemon from the support cast?
  // ex. if your only grass type pokemon, a snivy, is chosen as primary, if the support pokemon requires a grass type, the event won't trigger because
  // it's already been
  withSecondaryPokemonRequirement(
    requirement: EncounterPokemonRequirement,
    excludePrimaryFromSecondaryRequirements = false,
  ): this & Required<Pick<IMysteryEncounter, "secondaryPokemonRequirements">> {
    if (requirement instanceof EncounterSceneRequirement) {
      new Error("Incorrectly added scene requirement as pokemon requirement.");
    }

    this.secondaryPokemonRequirements.push(requirement);
    this.excludePrimaryFromSupportRequirements = excludePrimaryFromSecondaryRequirements;
    return Object.assign(this, {
      excludePrimaryFromSecondaryRequirements: this.excludePrimaryFromSupportRequirements,
      secondaryPokemonRequirements: this.secondaryPokemonRequirements,
    });
  }

  /**
   * Can set custom encounter rewards via this callback function
   * If rewards are always deterministic for an encounter, this is a good way to set them
   *
   * NOTE: If rewards are dependent on options selected, runtime data, etc.,
   * It may be better to programmatically set doEncounterRewards elsewhere.
   * There is a helper function in mystery-encounter utils, setEncounterRewards(), which can be called programmatically to set rewards
   * @param doEncounterRewards Synchronous callback function to perform during rewards phase of the encounter
   * @returns
   */
  withRewards(doEncounterRewards: () => boolean): this & Required<Pick<IMysteryEncounter, "doEncounterRewards">> {
    return Object.assign(this, { doEncounterRewards });
  }

  /**
   * Can set custom encounter exp via this callback function
   * If exp always deterministic for an encounter, this is a good way to set them
   *
   * NOTE: If rewards are dependent on options selected, runtime data, etc.,
   * It may be better to programmatically set doEncounterExp elsewhere.
   * There is a helper function in mystery-encounter utils, setEncounterExp(), which can be called programmatically to set rewards
   * @param doEncounterExp Synchronous callback function to perform during rewards phase of the encounter
   * @returns
   */
  withExp(doEncounterExp: () => boolean): this & Required<Pick<IMysteryEncounter, "doEncounterExp">> {
    return Object.assign(this, { doEncounterExp });
  }

  /**
   * Can be used to perform init logic before intro visuals are shown and before the MysteryEncounterPhase begins
   * Useful for performing things like procedural generation of intro sprites, etc.
   *
   * @param onInit Synchronous callback function to perform as soon as the encounter is selected for the next phase
   * @returns
   */
  withOnInit(onInit: () => boolean): this & Required<Pick<IMysteryEncounter, "onInit">> {
    return Object.assign(this, { onInit });
  }

  /**
   * Can be used to perform some extra logic (usually animations) when the enemy field is finished sliding in
   *
   * @param onVisualsStart Synchronous callback function to perform as soon as the enemy field finishes sliding in
   * @returns
   */
  withOnVisualsStart(onVisualsStart: () => boolean): this & Required<Pick<IMysteryEncounter, "onVisualsStart">> {
    return Object.assign(this, { onVisualsStart });
  }

  /**
   * Can set whether catching is allowed or not on the encounter
   * This flag can also be programmatically set inside option event functions or elsewhere
   * @param catchAllowed If `true`, allows enemy pokemon to be caught during the encounter
   * @returns
   */
  withCatchAllowed(catchAllowed: boolean): this & Required<Pick<IMysteryEncounter, "catchAllowed">> {
    return Object.assign(this, { catchAllowed });
  }

  /**
   * Can set whether fleeing is allowed or not on the encounter
   * @param fleeAllowed If `false`, prevents fleeing from a wild battle (trainer battle MEs already have flee disabled)
   * @returns
   */
  withFleeAllowed(fleeAllowed: boolean): this & Required<Pick<IMysteryEncounter, "fleeAllowed">> {
    return Object.assign(this, { fleeAllowed });
  }

  /**
   * @param hideBattleIntroMessage If `true`, will not show the trainerAppeared/wildAppeared/bossAppeared message for an encounter
   * @returns
   */
  withHideWildIntroMessage(
    hideBattleIntroMessage: boolean,
  ): this & Required<Pick<IMysteryEncounter, "hideBattleIntroMessage">> {
    return Object.assign(this, {
      hideBattleIntroMessage,
    });
  }

  /**
   * @param autoHideIntroVisuals If `false`, will not hide the intro visuals that are displayed at the beginning of encounter
   * @returns
   */
  withAutoHideIntroVisuals(
    autoHideIntroVisuals: boolean,
  ): this & Required<Pick<IMysteryEncounter, "autoHideIntroVisuals">> {
    return Object.assign(this, { autoHideIntroVisuals });
  }

  /**
   * @param enterIntroVisualsFromRight If `true`, will slide in intro visuals from the right side of the screen. If false, slides in from left, as normal
   * Default false
   * @returns
   */
  withEnterIntroVisualsFromRight(
    enterIntroVisualsFromRight: boolean,
  ): this & Required<Pick<IMysteryEncounter, "enterIntroVisualsFromRight">> {
    return Object.assign(this, {
      enterIntroVisualsFromRight,
    });
  }

  /**
   * Add a title for the encounter
   *
   * @param title Title of the encounter
   * @returns
   */
  withTitle(title: string): this {
    const encounterOptionsDialogue = this.dialogue.encounterOptionsDialogue ?? {};

    this.dialogue = {
      ...this.dialogue,
      encounterOptionsDialogue: {
        ...encounterOptionsDialogue,
        title,
      },
    };

    return this;
  }

  /**
   * Add a description of the encounter
   *
   * @param description Description of the encounter
   * @returns
   */
  withDescription(description: string): this {
    const encounterOptionsDialogue = this.dialogue.encounterOptionsDialogue ?? {};

    this.dialogue = {
      ...this.dialogue,
      encounterOptionsDialogue: {
        ...encounterOptionsDialogue,
        description,
      },
    };

    return this;
  }

  /**
   * Add a query for the encounter
   *
   * @param query Query to use for the encounter
   * @returns
   */
  withQuery(query: string): this {
    const encounterOptionsDialogue = this.dialogue.encounterOptionsDialogue ?? {};

    this.dialogue = {
      ...this.dialogue,
      encounterOptionsDialogue: {
        ...encounterOptionsDialogue,
        query,
      },
    };

    return this;
  }

  /**
   * Add outro dialogue/s for the encounter
   *
   * @param dialogue Outro dialogue(s)
   * @returns
   */
  withOutroDialogue(dialogue: MysteryEncounterDialogue["outro"] = []): this {
    this.dialogue = { ...this.dialogue, outro: dialogue };
    return this;
  }

  /**
   * Builds the mystery encounter
   *
   * @returns
   */
  build(this: IMysteryEncounter): MysteryEncounter {
    return new MysteryEncounter(this);
  }
}
