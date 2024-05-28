import BattleScene from "../battle-scene";
import { OptionSelectItem } from "../ui/abstact-option-select-ui-handler";

export default abstract class MysteryEncounter {
  scene: BattleScene;
  options: OptionSelectItem[];

  constructor(scene: BattleScene, options: OptionSelectItem[]) {
    this.scene = scene;
    this.options = options;
  }
}

export default interface MysteryEncounter {
  scene: BattleScene
  options: OptionSelectItem[]
}

export class BattleMysteryEncounter extends MysteryEncounter {
  constructor(scene: BattleScene, options: OptionSelectItem[]) {
    super(scene, options);
  }
}

export class OptionSelectMysteryEncounter extends MysteryEncounter {
  constructor(scene: BattleScene, options: OptionSelectItem[]) {
    super(scene, options);
  }
}
