import BattleScene from "../battle-scene";
import MysteryEncounter, { MysteryEncounterOption } from "../data/mystery-encounter";
import { Phase } from "../phase";
import { Mode } from "../ui/ui";
import { removeMysteryEncounterIntroVisuals } from "../utils/mystery-encounter-utils";

export class MysteryEncounterPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    // Initiates encounter dialogue window and option select
    this.scene.ui.setMode(Mode.MYSTERY_ENCOUNTER);
  }

  handleOptionSelect(option: MysteryEncounterOption): boolean {
    if (!option.onSelect) {
      return false;
    }

    this.scene.unshiftPhase(new MysteryEncounterPostOptionSelectPhase(this.scene, option.onSelect));

    this.end();

    return true;
  }

  cancel() {
    // Handle escaping of this option select phase?
    // Unsure if this is necessary

    this.end();
  }

  getMysteryEncounter(): MysteryEncounter {
    return this.scene.currentBattle.mysteryEncounter;
  }

  end() {
    this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}


export class MysteryEncounterPostOptionSelectPhase extends Phase {
  onPostOptionSelect: (scene: BattleScene) => Promise<boolean | void>;

  constructor(scene: BattleScene, onPostOptionSelect: (scene: BattleScene) => Promise<boolean | void>) {
    super(scene);
    this.onPostOptionSelect = onPostOptionSelect;
  }

  start() {
    super.start();
    removeMysteryEncounterIntroVisuals(this.scene).then(() => {
      this.onPostOptionSelect(this.scene).then(() => {
        this.end();
      });
    });
  }

  getMysteryEncounter(): MysteryEncounter {
    return this.scene.currentBattle.mysteryEncounter;
  }
}
