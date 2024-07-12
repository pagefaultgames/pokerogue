import { EnemyPartyConfig } from "#app/data/mystery-encounters/mystery-encounter-utils";
import Pokemon, { PlayerPokemon } from "#app/field/pokemon";
import { isNullOrUndefined } from "#app/utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../battle-scene";
import MysteryEncounterIntroVisuals, { MysteryEncounterSpriteConfig } from "../../field/mystery-encounter-intro";
import * as Utils from "../../utils";
import { StatusEffect } from "../status-effect";
import MysteryEncounterDialogue, {
  OptionTextDisplay
} from "./mystery-encounter-dialogue";
import MysteryEncounterOption, { EncounterOptionMode, MysteryEncounterOptionBuilder, OptionPhaseCallback } from "./mystery-encounter-option";
import {
  EncounterPokemonRequirement,
  EncounterSceneRequirement,
  HealthRatioRequirement,
  PartySizeRequirement,
  StatusEffectRequirement,
  WaveRangeRequirement
} from "./mystery-encounter-requirements";

export enum MysteryEncounterVariant {
  DEFAULT,
  TRAINER_BATTLE,
  WILD_BATTLE,
  BOSS_BATTLE,
  NO_BATTLE
}

export enum MysteryEncounterTier {
  COMMON,
  GREAT,
  ULTRA,
  ROGUE,
  MASTER // Not currently used
}

export default interface IMysteryEncounter {
  /**
   * Required params
   */
  encounterType: MysteryEncounterType;
  options: [MysteryEncounterOption, MysteryEncounterOption, ...MysteryEncounterOption[]];
  spriteConfigs: MysteryEncounterSpriteConfig[];
  /**
   * Optional params
   */
  encounterTier?: MysteryEncounterTier;
  hideBattleIntroMessage?: boolean;
  hideIntroVisuals?: boolean;
  catchAllowed?: boolean;
  doEncounterExp?: (scene: BattleScene) => boolean;
  doEncounterRewards?: (scene: BattleScene) => boolean;
  onInit?: (scene: BattleScene) => boolean;

  /**
   * Requirements
   */
  requirements?: EncounterSceneRequirement[];
  primaryPokemonRequirements?: EncounterPokemonRequirement[];
  secondaryPokemonRequirements?: EncounterPokemonRequirement[]; // A list of requirements that must ALL be met by a subset of pokemon to trigger the event
  excludePrimaryFromSupportRequirements?: boolean;
  // Primary Pokemon is a single pokemon randomly selected from a set of pokemon that meet ALL primary pokemon requirements
  primaryPokemon?: PlayerPokemon;
  // Support Pokemon are pokemon that meet ALL support pokemon requirements.
  // Note that an individual requirement may require multiple pokemon, but the resulting pokemon after all secondary requirements are met may be lower than expected
  // If the primary pokemon and supporting pokemon are the same and ExcludePrimaryFromSupportRequirements flag is true, primary pokemon may be promoted from secondary pool
  secondaryPokemon?: PlayerPokemon[];

  /**
   * Post-construct / Auto-populated params
   */

  /**
   * Dialogue object containing all the dialogue, messages, tooltips, etc. for an encounter
   */
  dialogue?: MysteryEncounterDialogue;
  /**
   * Data used for setting up/initializing enemy party in battles
   * Can store multiple configs so that one can be chosen based on option selected
   */
  enemyPartyConfigs?: EnemyPartyConfig[];
  /**
   * Object instance containing sprite data for an encounter when it is being spawned
   * Otherwise, will be undefined
   * You probably shouldn't do anything with this unless you have a very specific need
   */
  introVisuals?: MysteryEncounterIntroVisuals;

  /**
   * Flags
   */

  /**
   * Can be set for uses programatic dialogue during an encounter (storing the name of one of the party's pokemon, etc.)
   * Example use: see MYSTERIOUS_CHEST
   */
  dialogueTokens?: Record<string, string>;
  /**
   * Should be set depending upon option selected as part of an encounter
   * For example, if there is no battle as part of the encounter/selected option, should be set to NO_BATTLE
   * Defaults to DEFAULT
   */
  encounterVariant?: MysteryEncounterVariant;
  /**
   * Flag for checking if it's the first time a shop is being shown for an encounter.
   * Defaults to true so that the first shop does not override the specified rewards.
   * Will be set to false after a shop is shown (so can't reroll same rarity items for free)
   */
  lockEncounterRewardTiers?: boolean;
  /**
   * Will be set by option select handlers automatically, and can be used to refer to which option was chosen by later phases
   */
  selectedOption?: MysteryEncounterOption;
  /**
   * Can be set higher or lower based on the type of battle or exp gained for an option/encounter
   * Defaults to 1
   */
  expMultiplier?: number;

  /**
   * Generic property to set any custom data required for the encounter
   * Extremely useful for carrying state/data between onPreOptionPhase/onOptionPhase/onPostOptionPhase
   */
  misc?: any;
}

/**
 * MysteryEncounter class that defines the logic for a single encounter
 * These objects will be saved as part of session data any time the player is on a floor with an encounter
 * Unless you know what you're doing, you should use MysteryEncounterBuilder to create an instance for this class
 */
export default class IMysteryEncounter implements IMysteryEncounter {
  constructor(encounter: IMysteryEncounter) {
    if (!isNullOrUndefined(encounter)) {
      Object.assign(this, encounter);
    }
    this.encounterTier = this.encounterTier ? this.encounterTier : MysteryEncounterTier.COMMON;
    this.dialogue = this.dialogue ?? {};
    this.encounterVariant = MysteryEncounterVariant.DEFAULT;
    this.requirements = this.requirements ? this.requirements : [];
    this.hideBattleIntroMessage = !isNullOrUndefined(this.hideBattleIntroMessage) ? this.hideBattleIntroMessage : false;
    this.hideIntroVisuals = !isNullOrUndefined(this.hideIntroVisuals) ? this.hideIntroVisuals : true;

    // Reset any dirty flags or encounter data
    this.lockEncounterRewardTiers = true;
    this.dialogueTokens = {};
    this.enemyPartyConfigs = [];
    this.introVisuals = null;
    this.misc = null;
    this.expMultiplier = 1;
  }

  /**
   * Checks if the current scene state meets the requirements for the MysteryEncounter to spawn
   * This is used to filter the pool of encounters down to only the ones with all requirements met
   * @param scene
   * @returns
   */
  meetsRequirements?(scene: BattleScene) {
    const sceneReq = !this.requirements.some(requirement => !requirement.meetsRequirement(scene));
    const secReqs = this.meetsSecondaryRequirementAndSecondaryPokemonSelected(scene); // secondary is checked first to handle cases of primary overlapping with secondary
    const priReqs = this.meetsPrimaryRequirementAndPrimaryPokemonSelected(scene);

    // console.log("-------" + MysteryEncounterType[this.encounterType] + " Encounter Check -------");
    // console.log(this);
    // console.log( "sceneCheck: " + sceneReq);
    // console.log( "primaryCheck: " +  priReqs);
    // console.log( "secondaryCheck: " +  secReqs);
    // console.log(MysteryEncounterTier[this.encounterTier]);

    return sceneReq && secReqs && priReqs;
  }

  pokemonMeetsPrimaryRequirements?(scene: BattleScene, pokemon: Pokemon) {
    return !this.primaryPokemonRequirements.some(req => !req.queryParty(scene.getParty()).map(p => p.id).includes(pokemon.id));
  }

  private meetsPrimaryRequirementAndPrimaryPokemonSelected?(scene: BattleScene) {
    if (this.primaryPokemonRequirements.length === 0) {
      const activeMon = scene.getParty().filter(p => p.isActive(true));
      if (activeMon.length > 0) {
        this.primaryPokemon = activeMon[0];
      } else {
        this.primaryPokemon = scene.getParty().filter(p => !p.isFainted())[0];
      }
      return true;
    }
    let qualified: PlayerPokemon[] = scene.getParty();
    for (const req of this.primaryPokemonRequirements) {
      console.log(req);
      if (req.meetsRequirement(scene)) {
        if (req instanceof EncounterPokemonRequirement) {
          qualified = qualified.filter(pkmn => req.queryParty(scene.getParty()).includes(pkmn));
        }
      } else {
        this.primaryPokemon = null;
        return false;
      }
    }

    if (qualified.length === 0) {
      return false;
    }

    if (this.excludePrimaryFromSupportRequirements && this.secondaryPokemon) {
      const truePrimaryPool = [];
      const overlap = [];
      for (const qp of qualified) {
        if (!this.secondaryPokemon.includes(qp)) {
          truePrimaryPool.push(qp);
        } else {
          overlap.push(qp);
        }

      }
      if (truePrimaryPool.length > 0) {
        // always choose from the non-overlapping pokemon first
        this.primaryPokemon = truePrimaryPool[Utils.randSeedInt(truePrimaryPool.length, 0)];
        return true;
      } else {
        // if there are multiple overlapping pokemon, we're okay - just choose one and take it out of the primary pokemon pool
        if (overlap.length > 1 || (this.secondaryPokemon.length - overlap.length >= 1)) {
          // is this working?
          this.primaryPokemon = overlap[Utils.randSeedInt(overlap.length, 0)];
          this.secondaryPokemon = this.secondaryPokemon.filter((supp) => supp !== this.primaryPokemon);
          return true;
        }
        console.log("Mystery Encounter Edge Case: Requirement not met due to primary pokemon overlapping with secondary pokemon. There's no valid primary pokemon left.");
        return false;
      }
    } else {
      // this means we CAN have the same pokemon be a primary and secondary pokemon, so just choose any qualifying one randomly.
      this.primaryPokemon = qualified[Utils.randSeedInt(qualified.length, 0)];
      return true;
    }
  }

  private meetsSecondaryRequirementAndSecondaryPokemonSelected?(scene: BattleScene) {
    if (!this.secondaryPokemonRequirements) {
      this.secondaryPokemon = [];
      return true;
    }

    let qualified: PlayerPokemon[] = scene.getParty();
    for (const req of this.secondaryPokemonRequirements) {
      if (req.meetsRequirement(scene)) {
        if (req instanceof EncounterPokemonRequirement) {
          qualified = qualified.filter(pkmn => req.queryParty(scene.getParty()).includes(pkmn));

        }
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
   * @param scene
   */
  initIntroVisuals?(scene: BattleScene) {
    this.introVisuals = new MysteryEncounterIntroVisuals(scene, this);
  }

  /**
   * Auto-pushes dialogue tokens from the encounter (and option) requirements.
   * Will use the first support pokemon in list
   * For multiple support pokemon in the dialogue token, it will have to be overridden.
   */
  populateDialogueTokensFromRequirements?(scene: BattleScene) {
    this.meetsRequirements(scene);
    if (this.requirements?.length > 0) {
      for (const req of this.requirements) {
        const dialogueToken = req.getDialogueToken(scene);
        this.setDialogueToken(...dialogueToken);
      }
    }
    if (this.primaryPokemon?.length > 0) {
      this.setDialogueToken("primaryName", this.primaryPokemon.name);
      for (const req of this.primaryPokemonRequirements) {
        if (!req.invertQuery) {
          const value = req.getDialogueToken(scene, this.primaryPokemon);
          this.setDialogueToken("primary" + this.capitalizeFirstLetter(value[0]), value[1]);
        }
      }
    }
    if (this.secondaryPokemonRequirements?.length > 0 && this.secondaryPokemon?.length > 0) {
      this.setDialogueToken("secondaryName", this.secondaryPokemon[0].name);
      for (const req of this.secondaryPokemonRequirements) {
        if (!req.invertQuery) {
          const value = req.getDialogueToken(scene, this.secondaryPokemon[0]);
          this.setDialogueToken("secondary" + this.capitalizeFirstLetter(value[0]), value[1]);
        }
      }
    }

    // Dialogue tokens for options
    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      opt.meetsRequirements(scene);
      const j = i + 1;
      if (opt.requirements?.length > 0) {
        for (const req of opt.requirements) {
          const dialogueToken = req.getDialogueToken(scene);
          this.setDialogueToken("option" + j + this.capitalizeFirstLetter(dialogueToken[0]), dialogueToken[1]);
        }
      }
      if (opt.primaryPokemonRequirements?.length > 0 && opt.primaryPokemon?.length > 0) {
        this.setDialogueToken("option" + j + "PrimaryName", opt.primaryPokemon.name);
        for (const req of opt.primaryPokemonRequirements) {
          if (!req.invertQuery) {
            const value = req.getDialogueToken(scene, opt.primaryPokemon);
            this.setDialogueToken("option" + j + "Primary" + this.capitalizeFirstLetter(value[0]), value[1]);
          }
        }
      }
      if (opt.secondaryPokemonRequirements?.length > 0 && opt.secondaryPokemon?.length > 0) {
        this.setDialogueToken("option" + j + "SecondaryName", opt.secondaryPokemon[0].name);
        for (const req of opt.secondaryPokemonRequirements) {
          if (!req.invertQuery) {
            const value = req.getDialogueToken(scene, opt.secondaryPokemon[0]);
            this.setDialogueToken("option" + j + "Secondary" + this.capitalizeFirstLetter(value[0]), value[1]);
          }
        }
      }
    }
  }

  setDialogueToken?(key: string, value: string) {
    this.dialogueTokens[key] = value;
  }

  private capitalizeFirstLetter?(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export class MysteryEncounterBuilder implements Partial<IMysteryEncounter> {
  encounterType?: MysteryEncounterType;
  options?: [MysteryEncounterOption, MysteryEncounterOption, ...MysteryEncounterOption[]] = [null, null];
  spriteConfigs?: MysteryEncounterSpriteConfig[];

  dialogue?: MysteryEncounterDialogue;
  encounterTier?: MysteryEncounterTier;
  requirements?: EncounterSceneRequirement[] = [];
  primaryPokemonRequirements?: EncounterPokemonRequirement[] = [];
  secondaryPokemonRequirements ?: EncounterPokemonRequirement[] = [];
  excludePrimaryFromSupportRequirements?: boolean;
  dialogueTokens?: Record<string, string>;
  doEncounterExp?: (scene: BattleScene) => boolean;
  doEncounterRewards?: (scene: BattleScene) => boolean;
  onInit?: (scene: BattleScene) => boolean;
  onDone?: (scene: BattleScene) => boolean;
  hideBattleIntroMessage?: boolean;
  hideIntroVisuals?: boolean;
  enemyPartyConfigs?: EnemyPartyConfig[] = [];

  /**
   * REQUIRED
   */

  /**
   * @statif Defines the type of encounter which is used as an identifier, should be tied to a unique MysteryEncounterType
   * @param encounterType
   * @returns this
   */
  static withEncounterType(encounterType: MysteryEncounterType): MysteryEncounterBuilder & Pick<IMysteryEncounter, "encounterType"> {
    return Object.assign(new MysteryEncounterBuilder(), { encounterType: encounterType });
  }

  /**
   * Defines an option for the encounter.
   * Use for complex options.
   * There should be at least 2 options defined and no more than 4.
   * If easy/streamlined use {@linkcode MysteryEncounterBuilder.withOptionPhase}
   *
   * @param option - MysteryEncounterOption to add, can use MysteryEncounterOptionBuilder to create instance
   * @returns
   */
  withOption(option: MysteryEncounterOption): this & Pick<IMysteryEncounter, "options"> {
    if (this.options[0] === null) {
      return Object.assign(this, { options: [option, this.options[0]] });
    } else if (this.options[1] === null) {
      return Object.assign(this, { options: [this.options[0], option] });
    } else {
      this.options.push(option);
      return Object.assign(this, { options: this.options });
    }
  }

  /**
   * Defines an option + phasefor the encounter.
   * Use for easy/streamlined options.
   * There should be at least 2 options defined and no more than 4.
   * If complex use {@linkcode MysteryEncounterBuilder.withOption}
   *
   * @param dialogue - {@linkcode OptionTextDisplay}
   * @param callback - {@linkcode OptionPhaseCallback}
   * @returns
   */
  withSimpleOption(dialogue: OptionTextDisplay, callback: OptionPhaseCallback) {
    return this.withOption(new MysteryEncounterOptionBuilder().withOptionMode(EncounterOptionMode.DEFAULT).withDialogue(dialogue).withOptionPhase(callback).build());
  }

  /**
   * Defines the sprites that will be shown on the enemy field when the encounter spawns
   * Can be one or more sprites, recommended not to exceed 4
   * @param spriteConfigs
   * @returns
   */
  withIntroSpriteConfigs(spriteConfigs: MysteryEncounterSpriteConfig[]): this & Pick<IMysteryEncounter, "spriteConfigs"> {
    return Object.assign(this, { spriteConfigs: spriteConfigs });
  }

  withIntroDialogue(dialogue: MysteryEncounterDialogue["intro"] = []) {
    this.dialogue = {...this.dialogue, intro: dialogue };
    return this;
  }

  withIntro({spriteConfigs, dialogue} : {spriteConfigs: MysteryEncounterSpriteConfig[], dialogue?:  MysteryEncounterDialogue["intro"]}) {
    return this.withIntroSpriteConfigs(spriteConfigs).withIntroDialogue(dialogue);
  }

  /**
   * OPTIONAL
   */

  /**
   * Sets the rarity tier for an encounter
   * If not specified, defaults to COMMON
   * Tiers are:
   * COMMON 32/64 odds
   * UNCOMMON 16/64 odds
   * RARE 10/64 odds
   * SUPER_RARE 6/64 odds
   * ULTRA_RARE Not currently used
   * @param encounterTier
   * @returns
   */
  withEncounterTier(encounterTier: MysteryEncounterTier): this & Required<Pick<IMysteryEncounter, "encounterTier">> {
    return Object.assign(this, { encounterTier: encounterTier });
  }

  /**
   * Specifies a requirement for an encounter
   * For example, passing requirement as "new WaveCountRequirement([2, 180])" would create a requirement that the encounter can only be spawned between waves 2 and 180
   * Existing Requirement objects are defined in mystery-encounter-requirements.ts, and more can always be created to meet a requirement need
   * @param requirement
   * @returns
   */
  withSceneRequirement(requirement: EncounterSceneRequirement): this & Required<Pick<IMysteryEncounter, "requirements">> {
    if (requirement instanceof EncounterPokemonRequirement) {
      Error("Incorrectly added pokemon requirement as scene requirement.");
    }
    this.requirements.push(requirement);
    return Object.assign(this, { requirements: this.requirements });
  }

  /**
   * Specifies a wave range requirement for an encounter.
   *
   * @param min min wave (or exact wave if only min is given)
   * @param max optional max wave. If not given, defaults to min => exact wave
   * @returns
   */
  withSceneWaveRangeRequirement(min: number, max?: number) {
    return this.withSceneRequirement(new WaveRangeRequirement([min, max ?? min]));
  }

  /**
   * Specifies a party size requirement for an encounter.
   *
   * @param min min wave (or exact size if only min is given)
   * @param max optional max size. If not given, defaults to min => exact wave
   * @returns
   */
  withScenePartySizeRequirement(min: number, max?: number) {
    return this.withSceneRequirement(new PartySizeRequirement([min, max ?? min]));
  }

  /**
   * Add a primary pokemon requirement
   *
   * @param requirement {@linkcode EncounterPokemonRequirement}
   * @returns
   */
  withPrimaryPokemonRequirement(requirement: EncounterPokemonRequirement): this & Required<Pick<IMysteryEncounter, "primaryPokemonRequirements">> {
    this.primaryPokemonRequirements.push(requirement);
    return Object.assign(this, { primaryPokemonRequirements: this.primaryPokemonRequirements });
  }

  /**
   * Add a primary pokemon status effect requirement
   *
   * @param statusEffect the status effect/s to check
   * @param minNumberOfPokemon minimum number of pokemon to have the effect
   * @param invertQuery if true will invert the query
   * @returns
   */
  withPrimaryPokemonStatusEffectRequirement(statusEffect: StatusEffect | StatusEffect[], minNumberOfPokemon: number = 1, invertQuery: boolean = false): this & Required<Pick<IMysteryEncounter, "primaryPokemonRequirements">> {
    return this.withPrimaryPokemonRequirement(new StatusEffectRequirement(statusEffect, minNumberOfPokemon, invertQuery));
  }

  /**
   * Add a primary pokemon health ratio requirement
   *
   * @param requiredHealthRange the health range to check
   * @param minNumberOfPokemon minimum number of pokemon to have the health range
   * @param invertQuery if true will invert the query
   * @returns
   */
  withPrimaryPokemonHealthRatioRequirement(requiredHealthRange: [number, number], minNumberOfPokemon: number = 1, invertQuery: boolean = false): this & Required<Pick<IMysteryEncounter, "primaryPokemonRequirements">> {
    return this.withPrimaryPokemonRequirement(new HealthRatioRequirement(requiredHealthRange, minNumberOfPokemon, invertQuery));
  }

  // TODO: Maybe add an optional parameter for excluding primary pokemon from the support cast?
  // ex. if your only grass type pokemon, a snivy, is chosen as primary, if the support pokemon requires a grass type, the event won't trigger because
  // it's already been
  withSecondaryPokemonRequirement(requirement: EncounterPokemonRequirement, excludePrimaryFromSecondaryRequirements: boolean = false): this & Required<Pick<IMysteryEncounter, "secondaryPokemonRequirements">> {
    this.secondaryPokemonRequirements.push(requirement);
    this.excludePrimaryFromSupportRequirements = excludePrimaryFromSecondaryRequirements;
    return Object.assign(this, { excludePrimaryFromSecondaryRequirements: this.excludePrimaryFromSupportRequirements, secondaryPokemonRequirements: this.secondaryPokemonRequirements });
  }

  /**
   * Can set custom encounter rewards via this callback function
   * If rewards are always deterministic for an encounter, this is a good way to set them
   *
   * NOTE: If rewards are dependent on options selected, runtime data, etc.,
   * It may be better to programmatically set doEncounterRewards elsewhere.
   * There is a helper function in mystery-encounter utils, setEncounterRewards(), which can be called programmatically to set rewards
   * @param doEncounterRewards - synchronous callback function to perform during rewards phase of the encounter
   * @returns
   */
  withRewards(doEncounterRewards: (scene: BattleScene) => boolean): this & Required<Pick<IMysteryEncounter, "doEncounterRewards">> {
    return Object.assign(this, { doEncounterRewards: doEncounterRewards });
  }

  /**
   * Can set custom encounter exp via this callback function
   * If exp always deterministic for an encounter, this is a good way to set them
   *
   * NOTE: If rewards are dependent on options selected, runtime data, etc.,
   * It may be better to programmatically set doEncounterExp elsewhere.
   * There is a helper function in mystery-encounter utils, setEncounterExp(), which can be called programmatically to set rewards
   * @param doEncounterExp - synchronous callback function to perform during rewards phase of the encounter
   * @returns
   */
  withExp(doEncounterExp: (scene: BattleScene) => boolean): this & Required<Pick<IMysteryEncounter, "doEncounterExp">> {
    return Object.assign(this, { doEncounterExp: doEncounterExp });
  }

  /**
   * Can be used to perform init logic before intro visuals are shown and before the MysteryEncounterPhase begins
   * Useful for performing things like procedural generation of intro sprites, etc.
   *
   * @param onInit - synchronous callback function to perform as soon as the encounter is selected for the next phase
   * @returns
   */
  withOnInit(onInit: (scene: BattleScene) => boolean): this & Required<Pick<IMysteryEncounter, "onInit">> {
    return Object.assign(this, { onInit: onInit });
  }

  /**
   * Defines any enemies to use for a battle from the mystery encounter
   * @param enemyPartyConfig
   * @returns
   */
  withEnemyPartyConfig(enemyPartyConfig: EnemyPartyConfig): this & Required<Pick<IMysteryEncounter, "enemyPartyConfigs">> {
    this.enemyPartyConfigs.push(enemyPartyConfig);
    return Object.assign(this, { enemyPartyConfigs: this.enemyPartyConfigs });
  }

  /**
   * Can set whether catching is allowed or not on the encounter
   * This flag can also be programmatically set inside option event functions or elsewhere
   * @param catchAllowed - if true, allows enemy pokemon to be caught during the encounter
   * @returns
   */
  withCatchAllowed(catchAllowed: boolean): this & Required<Pick<IMysteryEncounter, "catchAllowed">> {
    return Object.assign(this, { catchAllowed: catchAllowed });
  }

  /**
   * @param hideBattleIntroMessage - if true, will not show the trainerAppeared/wildAppeared/bossAppeared message for an encounter
   * @returns
   */
  withHideWildIntroMessage(hideBattleIntroMessage: boolean): this & Required<Pick<IMysteryEncounter, "hideBattleIntroMessage">> {
    return Object.assign(this, { hideBattleIntroMessage: hideBattleIntroMessage });
  }

  /**
   * @param hideIntroVisuals - if false, will not hide the intro visuals that are displayed at the beginning of encounter
   * @returns
   */
  withHideIntroVisuals(hideIntroVisuals: boolean): this & Required<Pick<IMysteryEncounter, "hideIntroVisuals">> {
    return Object.assign(this, { hideIntroVisuals: hideIntroVisuals });
  }

  /**
   * Add a title for the encounter
   *
   * @param title - title of the encounter
   * @returns
   */
  withTitle(title: string) {
    const encounterOptionsDialogue = this.dialogue.encounterOptionsDialogue ?? {};

    this.dialogue = {
      ...this.dialogue,
      encounterOptionsDialogue: {
        ...encounterOptionsDialogue,
        title,
      }
    };

    return this;
  }

  /**
   * Add a description of the encounter
   *
   * @param description - description of the encounter
   * @returns
   */
  withDescription(description: string) {
    const encounterOptionsDialogue = this.dialogue.encounterOptionsDialogue ?? {};

    this.dialogue = {
      ...this.dialogue,
      encounterOptionsDialogue: {
        ...encounterOptionsDialogue,
        description,
      }
    };

    return this;
  }

  /**
   * Add a query for the encounter
   *
   * @param query - query to use for the encounter
   * @returns
   */
  withQuery(query: string) {
    const encounterOptionsDialogue = this.dialogue.encounterOptionsDialogue ?? {};

    this.dialogue = {
      ...this.dialogue,
      encounterOptionsDialogue: {
        ...encounterOptionsDialogue,
        query,
      }
    };

    return this;
  }

  /**
   * Add outro dialogue/s for the encounter
   *
   * @param dialogue - outro dialogue/s
   * @returns
   */
  withOutroDialogue(dialogue: MysteryEncounterDialogue["outro"] = []) {
    this.dialogue = {...this.dialogue, outro: dialogue };
    return this;
  }

  /**
   * Builds the mystery encounter
   *
   * @param this - MysteryEncounter
   * @returns
   */
  build(this: IMysteryEncounter) {
    return new IMysteryEncounter(this);
  }
}
