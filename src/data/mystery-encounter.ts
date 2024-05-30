import BattleScene from "../battle-scene";
import { OptionSelectItem } from "../ui/abstact-option-select-ui-handler";

export default abstract class MysteryEncounter {
  scene: BattleScene;
  options: OptionSelectItem[];
  index: number;

  constructor(scene: BattleScene, index: number) {
    this.scene = scene;
    this.index = index;

    // Generate encounter options based on the index
    const options: OptionSelectItem[] = [
      {
        label: "Option 1",
        handler: () => {
          // Do stuff
          return true;
        }
      },
      {
        label: "Option 2",
        handler: () => {
          // Do stuff
          return true;
        }
      }
    ];

    this.options = options;
  }

  getMysteryEncounterIndex(): number {
    return this.index;
  }
}

export default interface MysteryEncounter {
  scene: BattleScene;
  options: OptionSelectItem[];
}

export class BattleMysteryEncounter extends MysteryEncounter {
  constructor(scene: BattleScene, index: number) {
    super(scene, index);
  }
}

export class OptionSelectMysteryEncounter extends MysteryEncounter {
  constructor(scene: BattleScene, index: number) {
    super(scene, index);
  }
}
