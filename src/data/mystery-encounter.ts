import i18next from "i18next";
import BattleScene from "../battle-scene";
import { EncounterOptionSelectItem } from "../ui/mystery-encounter-ui-handler";

export default abstract class MysteryEncounter {
  scene: BattleScene;
  options: EncounterOptionSelectItem[];
  index: number;

  constructor(scene: BattleScene, index: number) {
    this.scene = scene;
    this.index = index;

    // Generate encounter options based on the index
    const options: EncounterOptionSelectItem[] = [
      {
        label: i18next.t("mysteryEncounter:encounter_0_option_1"),
        handler: () => {
          // Do stuff
          return true;
        }
      },
      {
        label: i18next.t("mysteryEncounter:encounter_0_option_2"),
        handler: () => {
          // Do stuff
          return true;
        }
      },
      {
        label: i18next.t("mysteryEncounter:encounter_0_option_3"),
        handler: () => {
          // Do stuff
          return true;
        }
      },
      {
        label: i18next.t("mysteryEncounter:encounter_0_option_4"),
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

  getMysteryEncounterOptions(): EncounterOptionSelectItem[] {
    return this.options;
  }
}

export default interface MysteryEncounter {
  scene: BattleScene;
  options: EncounterOptionSelectItem[];
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
