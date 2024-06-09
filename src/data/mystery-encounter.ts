import BattleScene from "../battle-scene";
import MysteryEncounterIntroVisuals, { MysteryEncounterSpriteConfig } from "../field/mystery-encounter-intro";
import { MysteryEncounterType } from "./enums/mystery-encounter-type";
import MysteryEncounterDialogue, { allMysteryEncounterDialogue } from "./mystery-encounter-dialogue";
import MysteryEncounterOption from "./mystery-encounter-option";
import { EncounterRequirement } from "./mystery-encounter-requirements";
import * as Utils from "../utils";
import {EnemyPartyConfig} from "#app/utils/mystery-encounter-utils";

export enum MysteryEncounterVariant {
  DEFAULT,
  TRAINER_BATTLE,
  WILD_BATTLE,
  BOSS_BATTLE,
  NO_BATTLE
}

export enum MysteryEncounterTier {
  COMMON, // 32/64 odds
  UNCOMMON, // 16/64 odds
  RARE, // 10/64 odds
  SUPER_RARE, // 6/64 odds
  ULTRA_RARE // Not currently used
}

export default interface MysteryEncounter {
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
  requirements?: EncounterRequirement[];
  doEncounterRewards?: (scene: BattleScene) => boolean;
  onInit?: (scene: BattleScene) => boolean;


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
   * Generic property to set any custom data required for the encounter
   */
  misc?: any;


  /**
   * Flags
   */

  /**
   * Can be set for uses programatic dialogue during an encounter (storing the name of one of the party's pokemon, etc.)
   * Example use: see MYSTERIOUS_CHEST
   */
  dialogueTokens?: [RegExp, string][];

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
   * Can be set to true or false depending on the type of encounter
   * Defaults to false
   */
  catchAllowed?: boolean;
}

/**
 * MysteryEncounter class that defines the logic for a single encounter
 * These objects will be saved as part of session data any time the player is on a floor with an encounter
 * Unless you know what you're doing, you should use MysteryEncounterBuilder to create an instance for this class
 */
export default class MysteryEncounter implements MysteryEncounter {
  constructor(encounter: MysteryEncounter) {
    if (!Utils.isNullOrUndefined(encounter)) {
      Object.assign(this, encounter);
    }
    this.encounterTier = this.encounterTier ? this.encounterTier : MysteryEncounterTier.COMMON;
    this.dialogue = allMysteryEncounterDialogue[this.encounterType];
    this.encounterVariant = MysteryEncounterVariant.DEFAULT;
    this.lockEncounterRewardTiers = true;
    this.dialogueTokens = this.dialogueTokens ? this.dialogueTokens : [];
    this.requirements = this.requirements ? this.requirements : [];
    this.enemyPartyConfigs = this.enemyPartyConfigs ? this.enemyPartyConfigs : [];
  }

  /**
   * Checks if the current scene state meets the requirements for the MysteryEncounter to spawn
   * This is used to filter the pool of encounters down to only the ones with all requirements met
   * @param scene
   * @returns
   */
  meetsRequirements?(scene: BattleScene) {
    return !this.requirements.some(requirement => !requirement.meetsRequirement(scene));
  }

  /**
   * Initializes encounter intro sprites based on the sprite configs defined in spriteConfigs
   * @param scene
   */
  initIntroVisuals?(scene: BattleScene) {
    this.introVisuals = new MysteryEncounterIntroVisuals(scene, this);
  }
}

export class MysteryEncounterBuilder implements Partial<MysteryEncounter> {
  encounterType?: MysteryEncounterType;
  options?: [MysteryEncounterOption, MysteryEncounterOption, ...MysteryEncounterOption[]] = [null, null];
  spriteConfigs?: MysteryEncounterSpriteConfig[];

  dialogue?: MysteryEncounterDialogue;
  encounterTier?: MysteryEncounterTier;
  requirements?: EncounterRequirement[] = [];
  dialogueTokens?: [RegExp, string][];
  doEncounterRewards?: (scene: BattleScene) => boolean;
  onInit?: (scene: BattleScene) => boolean;
  enemyPartyConfigs?: EnemyPartyConfig[] = [];

  /**
   * REQUIRED
   */

  /**
   * Defines the type of encounter which is used as an identifier, should be tied to a unique MysteryEncounterType
   * @param encounterType
   * @returns this
   */
  withEncounterType(encounterType: MysteryEncounterType): this & Pick<MysteryEncounter, "encounterType"> {
    return Object.assign(this, { encounterType: encounterType });
  }

  /**
   * Defines an option for the encounter
   * There should be at least 2 options defined and no more than 4
   * @param option - MysteryEncounterOption to add, can use MysteryEncounterOptionBuilder to create instance
   * @returns
   */
  withOption(option: MysteryEncounterOption): this & Pick<MysteryEncounter, "options"> {
    if (this.options[0] === null) {
      return Object.assign(this, { options: [ option, this.options[0] ] });
    } else if (this.options[1] === null) {
      return Object.assign(this, { options: [this.options[0], option ] });
    } else {
      this.options.push(option);
      return Object.assign(this, { options: this.options });
    }
  }

  /**
   * Defines the sprites that will be shown on the enemy field when the encounter spawns
   * Can be one or more sprites, recommended not to exceed 4
   * @param spriteConfigs
   * @returns
   */
  withIntroSpriteConfigs(spriteConfigs: MysteryEncounterSpriteConfig[]): this & Pick<MysteryEncounter, "spriteConfigs"> {
    return Object.assign(this, { spriteConfigs: spriteConfigs });
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
   * @param encounterType
   * @returns
   */
  withEncounterTier(encounterType: MysteryEncounterTier): this & Required<Pick<MysteryEncounter, "encounterType">> {
    return Object.assign(this, { encounterType: encounterType });
  }

  /**
   * Specifies a requirement for an encounter
   * For example, passing requirement as "new WaveCountRequirement([2, 180])" would create a requirement that the encounter can only be spawned between waves 2 and 180
   * Existing Requirement objects are defined in mystery-encounter-requirements.ts, and more can always be created to meet a requirement need
   * @param requirement
   * @returns
   */
  withRequirement(requirement: EncounterRequirement): this & Required<Pick<MysteryEncounter, "requirements">> {
    this.requirements.push(requirement);
    return Object.assign(this, { requirements: this.requirements });
  }

  /**
   * Can set custom encounter rewards via this callback function
   * If rewards are always deterministic for an encounter, this is a good way to set them
   *
   * NOTE: If rewards are dependent on options selected, runtime data, etc.,
   * It may be better to programmatically set doEncounterRewards elsewhere.
   * For instance, doEncounterRewards could instead be set inside the onOptionPhase() callback function for a MysteryEncounterOption
   * Check other existing mystery encounters for examples on how to use this
   * @param doEncounterRewards - synchronous callback function to perform during rewards phase of the encounter
   * @returns
   */
  withRewards(doEncounterRewards: (scene: BattleScene) => boolean): this & Required<Pick<MysteryEncounter, "doEncounterRewards">> {
    return Object.assign(this, { doEncounterRewards: doEncounterRewards });
  }

  /**
   * Can be used to perform init logic before intro visuals are shown and before the MysteryEncounterPhase begins
   * Useful for performing things like procedural generation of intro sprites, etc.
   *
   * @param onInit - synchronous callback function to perform as soon as the encounter is selected for the next phase
   * @returns
   */
  withOnInit(onInit: (scene: BattleScene) => boolean): this & Required<Pick<MysteryEncounter, "onInit">> {
    return Object.assign(this, { onInit: onInit });
  }

  /**
   * Defines any enemies to use for a battle from the mystery encounter
   * @param enemyPartyConfig
   * @returns
   */
  withEnemyPartyConfig(enemyPartyConfig: EnemyPartyConfig): this & Required<Pick<MysteryEncounter, "enemyPartyConfigs">> {
    this.enemyPartyConfigs.push(enemyPartyConfig);
    return Object.assign(this, { enemyPartyConfigs: this.enemyPartyConfigs });
  }

  /**
 * Can set whether catching is allowed or not on the encounter
 * This flag can also be programmatically set inside option event functions or elsewhere
 * @param catchAllowed - if true, allows enemy pokemon to be caught during the encounter
 * @returns
 */
  withCatchAllowed(catchAllowed: boolean): this & Required<Pick<MysteryEncounter, "catchAllowed">> {
    return Object.assign(this, { catchAllowed: catchAllowed });
  }

  build(this: MysteryEncounter) {
    return new MysteryEncounter(this);
  }
}
