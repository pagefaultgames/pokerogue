import BattleScene from "../battle-scene";
import { isNullOrUndefined } from "../utils";
import { MysteryEncounterRequirements } from "./mystery-encounter-requirements";

export default interface MysteryEncounterOption {
  requirements?: MysteryEncounterRequirements;
  // Executes before any following dialogue or business logic from option. Cannot be async. Usually this will be for calculating dialogueTokens or performing data updates
  onPreOptionPhase?: (scene: BattleScene) => void | boolean;
  // Business logic for option
  onOptionPhase?: (scene: BattleScene) => Promise<void | boolean>;
  // Executes after the encounter is over. Cannot be async. Usually this will be for calculating dialogueTokens or performing data updates
  onPostOptionPhase?: (scene: BattleScene) => void | boolean;
}

export default class MysteryEncounterOption implements MysteryEncounterOption {
  constructor(option: MysteryEncounterOption) {
    Object.assign(this, option);
  }

  meetsRequirements?(scene: BattleScene) {
    if (isNullOrUndefined(this.requirements)) {
      return true;
    }
    return this.requirements.meetsRequirements(scene);
  }
}

export class MysteryEncounterOptionBuilder implements Partial<MysteryEncounterOption> {
  requirements?: MysteryEncounterRequirements;
  onPreOptionPhase?: (scene: BattleScene) => void | boolean;
  onOptionPhase?: (scene: BattleScene) => Promise<void | boolean>;
  onPostOptionPhase?: (scene: BattleScene) => void | boolean;

  withRequirements(requirements: MysteryEncounterRequirements): this & Required<Pick<MysteryEncounterOption, "requirements">> {
    return Object.assign(this, { requirements: requirements });
  }

  withPreOptionPhase(onPreOptionPhase: (scene: BattleScene) => void | boolean): this & Required<Pick<MysteryEncounterOption, "onPreOptionPhase">> {
    return Object.assign(this, { onPreOptionPhase: onPreOptionPhase });
  }

  withOptionPhase(onOptionPhase: (scene: BattleScene) => Promise<void | boolean>): this & Required<Pick<MysteryEncounterOption, "onOptionPhase">> {
    return Object.assign(this, { onOptionPhase: onOptionPhase });
  }

  withPostOptionPhase(onPostOptionPhase: (scene: BattleScene) => void | boolean): this & Required<Pick<MysteryEncounterOption, "onPostOptionPhase">> {
    return Object.assign(this, { onPostOptionPhase: onPostOptionPhase });
  }

  build(this: MysteryEncounterOption) {
    return new MysteryEncounterOption(this);
  }
}
