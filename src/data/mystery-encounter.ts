import BattleScene from "../battle-scene";
import MysteryEncounterIntroVisuals, { MysteryEncounterSpriteConfig } from "../field/mystery-encounter-intro";
import { MysteryEncounterType } from "./enums/mystery-encounter-type";
import MysteryEncounterDialogue, { allMysteryEncounterDialogue } from "./mystery-encounter-dialogue";
import MysteryEncounterOption from "./mystery-encounter-option";
import { MysteryEncounterRequirements } from "./mystery-encounter-requirements";

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
  requirements?: MysteryEncounterRequirements;
  doEncounterRewards?: (scene: BattleScene) => boolean;


  /**
   * Post-construct / Auto-populated params
   */
  dialogue?: MysteryEncounterDialogue;
  introVisuals?: MysteryEncounterIntroVisuals;


  /**
   * Flags
   */
  // Can be set for things like programatic dialogue (party pokemon of name "xyz", etc.)
  // Example use: see MYSTERIOUS_CHEST
  dialogueTokens?: [RegExp, string][];
  // Should be set depending upon option selected
  encounterVariant?: MysteryEncounterVariant;
  // Flag to check if first time item shop is being shown for encounter. Will be set to false after shop is shown (so can't reroll same rarity items)
  lockEncounterRewardTiers?: boolean;
  // If no battle occurred during mysteryEncounter, flag should be set to false
  didBattle?: boolean;
}

export default class MysteryEncounter implements MysteryEncounter {
  constructor(encounter: MysteryEncounter) {
    Object.assign(this, encounter);
    this.encounterTier = this.encounterTier ? this.encounterTier : MysteryEncounterTier.COMMON;
    this.dialogue = allMysteryEncounterDialogue[this.encounterType];
    this.encounterVariant = MysteryEncounterVariant.DEFAULT;
    this.lockEncounterRewardTiers = true;
    this.didBattle = true;
  }

  meetsRequirements?(scene: BattleScene) {
    return this.requirements.meetsRequirements(scene);
  }

  initIntroVisuals?(scene: BattleScene) {
    this.introVisuals = new MysteryEncounterIntroVisuals(scene, this);
  }

  resetFlags?() {
    this.encounterVariant = MysteryEncounterVariant.DEFAULT;
    this.lockEncounterRewardTiers = true;
  }
}

export class MysteryEncounterBuilder implements Partial<MysteryEncounter> {
  encounterType?: MysteryEncounterType;
  options?: [MysteryEncounterOption, MysteryEncounterOption, ...MysteryEncounterOption[]] = [null, null];
  spriteConfigs?: MysteryEncounterSpriteConfig[];

  dialogue?: MysteryEncounterDialogue;
  encounterTier?: MysteryEncounterTier;
  requirements?: MysteryEncounterRequirements;
  dialogueTokens?: [RegExp, string][];
  doEncounterRewards?: (scene: BattleScene) => boolean;

  /**
   * REQUIRED
   */

  withEncounterType(encounterType: MysteryEncounterType): this & Pick<MysteryEncounter, "encounterType"> {
    return Object.assign(this, { encounterType: encounterType });
  }

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

  withIntroSpriteConfigs(spriteConfigs: MysteryEncounterSpriteConfig[]): this & Pick<MysteryEncounter, "spriteConfigs"> {
    return Object.assign(this, { spriteConfigs: spriteConfigs });
  }

  /**
   * OPTIONAL
   */

  withEncounterTier(encounterType: MysteryEncounterTier): this & Required<Pick<MysteryEncounter, "encounterType">> {
    return Object.assign(this, { encounterType: encounterType });
  }

  withRequirements(requirements: MysteryEncounterRequirements): this & Required<Pick<MysteryEncounter, "requirements">> {
    return Object.assign(this, { requirements: requirements });
  }

  withRewards(doEncounterRewards: (scene: BattleScene) => boolean): this & Required<Pick<MysteryEncounter, "doEncounterRewards">> {
    return Object.assign(this, { doEncounterRewards: doEncounterRewards });
  }

  build(this: MysteryEncounter) {
    return new MysteryEncounter(this);
  }
}
