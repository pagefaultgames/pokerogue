import BattleScene from "../battle-scene";
import MysteryEncounterIntroVisuals, { MysteryEncounterSpriteConfig } from "../field/mystery-encounter-intro";
import { isNullOrUndefined } from "../utils";
import { MysteryEncounterType } from "./enums/mystery-encounter-type";
import EncounterDialogue, { allMysteryEncounterDialogue } from "./mystery-encounter-dialogue";
import { MysteryEncounterRequirements } from "./mystery-encounter-requirements";
import { DarkDealEncounter } from "./mystery-encounters/dark-deal";
import { MysteriousChallengersEncounter } from "./mystery-encounters/mysterious-challengers";
import { MysteriousChestEncounter } from "./mystery-encounters/mysterious-chest";

export enum MysteryEncounterVariant {
  DEFAULT,
  TRAINER_BATTLE,
  WILD_BATTLE
}

export enum MysteryEncounterTier {
  COMMON, // 32/64 odds
  UNCOMMON, // 16/64 odds
  RARE, // 10/64 odds
  SUPER_RARE, // 6/64 odds
  ULTRA_RARE // Not currently used
}

export default abstract class MysteryEncounter<T extends MysteryEncounter<T> = any> {
  encounterType: MysteryEncounterType;
  encounterTier: MysteryEncounterTier;
  dialogue: EncounterDialogue;
  encounterRequirements: MysteryEncounterRequirements;
  introVisuals: MysteryEncounterIntroVisuals;
  spriteConfigs: MysteryEncounterSpriteConfig[];
  doEncounterRewards: (scene: BattleScene) => boolean = null;
  dialogueTokens: [RegExp, string][] = [];

  // Flags
  encounterVariant: MysteryEncounterVariant = MysteryEncounterVariant.DEFAULT; // Should be set depending upon option selected
  lockEncounterRewardTiers: boolean = true; // Flag to check if first time item shop is being shown for encounter. Will be set to false after shop is shown (so can't reroll same rarity items)
  didBattle: boolean = true; // If no battle occurred during mysteryEncounter, flag should be set to false

  constructor(encounterType: MysteryEncounterType, encounterTier: MysteryEncounterTier = MysteryEncounterTier.COMMON) {
    this.encounterType = encounterType;
    this.encounterTier = encounterTier;
    this.dialogue = allMysteryEncounterDialogue[this.encounterType];
  }

  introVisualsConfig(spriteConfigs: MysteryEncounterSpriteConfig[]): this {
    this.spriteConfigs = spriteConfigs;
    return this;
  }

  requirements<U extends MysteryEncounterRequirements>(encounterRequirements: U): this {
    this.encounterRequirements = encounterRequirements;
    return this;
  }

  rewards(doEncounterRewards: (scene: BattleScene) => boolean): this {
    this.doEncounterRewards = doEncounterRewards;
    return this;
  }

  meetsRequirements(scene: BattleScene) {
    return this.encounterRequirements.meetsRequirements(scene);
  }

  initIntroVisuals(scene: BattleScene) {
    this.introVisuals = new MysteryEncounterIntroVisuals(scene, this);
  }

  resetFlags() {
    this.encounterVariant = MysteryEncounterVariant.DEFAULT;
    this.lockEncounterRewardTiers = true;
    this.didBattle = true;
  }
}

export default interface MysteryEncounter<T extends MysteryEncounter<T>> {
  encounterType: MysteryEncounterType;
  encounterTier: MysteryEncounterTier;
  dialogue: EncounterDialogue;
  encounterRequirements: MysteryEncounterRequirements;
  introVisuals: MysteryEncounterIntroVisuals;
  spriteConfigs: MysteryEncounterSpriteConfig[];
  doEncounterRewards: (scene: BattleScene) => boolean;
  dialogueTokens: [RegExp, string][];
}

export class MysteryEncounterOption {
  requirements?: MysteryEncounterRequirements;
  label: string;

  // Executes before any following dialogue or business logic from option. Cannot be async. Usually this will be for calculating dialogueTokens or performing data updates
  onPreSelect: (scene: BattleScene) => void | boolean;

  // Business logic for option
  onSelect: (scene: BattleScene) => Promise<void | boolean>;

  // Executes after the encounter is over. Cannot be async. Usually this will be for calculating dialogueTokens or performing data updates
  onPostSelect: (scene: BattleScene) => void | boolean;

  constructor(onSelect: (scene: BattleScene) => Promise<void | boolean>, onPreSelect?: (scene: BattleScene) => void | boolean, onPostSelect?: (scene: BattleScene) => void | boolean, requirements?: MysteryEncounterRequirements) {
    this.onSelect = onSelect;
    this.onPreSelect = onPreSelect;
    this.onPostSelect = onPostSelect;
    this.requirements = requirements;
  }

  meetsRequirements(scene: BattleScene) {
    if (isNullOrUndefined(this.requirements)) {
      return true;
    }
    return this.requirements.meetsRequirements(scene);
  }
}

/**
 * Concrete class for a mystery encounter with option selections
 */
export class OptionSelectMysteryEncounter extends MysteryEncounter<OptionSelectMysteryEncounter> {
  options: MysteryEncounterOption[] = [];
  constructor(encounterType: MysteryEncounterType, encounterTier: MysteryEncounterTier = MysteryEncounterTier.COMMON) {
    super(encounterType, encounterTier);
  }

  option<T extends MysteryEncounterRequirements>(onSelect: (scene: BattleScene) => Promise<void | boolean>, onPreSelect?: (scene: BattleScene) => void | boolean, onPostSelect?: (scene: BattleScene) => void | boolean, optionRequirements?: T): this {
    const option = new MysteryEncounterOption(onSelect, onPreSelect, onPostSelect, optionRequirements);
    this.options.push(option);

    return this;
  }

  /**
   * Copies everything except flags so that new MysteryEncounters start with wiped flag values
   * @returns
   */
  copy(): OptionSelectMysteryEncounter {
    const newEncounter = new OptionSelectMysteryEncounter(this.encounterType, this.encounterTier);
    newEncounter.options = this.options;
    newEncounter.dialogue = this.dialogue;
    newEncounter.encounterRequirements = this.encounterRequirements;
    newEncounter.introVisuals = this.introVisuals;
    newEncounter.spriteConfigs = this.spriteConfigs;
    newEncounter.doEncounterRewards = this.doEncounterRewards;
    newEncounter.dialogueTokens = this.dialogueTokens;

    return newEncounter;
  }
}


// Factory class used to build and return MysteryEncounters (see data/mystery-encounters/)
export interface MysteryEncounterFactory {
  getEncounter(): MysteryEncounter;
}

export const allMysteryEncounters: MysteryEncounter[] = [];

export function initMysteryEncounters() {
  allMysteryEncounters.push(
    new MysteriousChallengersEncounter().getEncounter(),
    new MysteriousChestEncounter().getEncounter(),
    new DarkDealEncounter().getEncounter()
  );
}
