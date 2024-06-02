import BattleScene from "../battle-scene";
import MysteryEncounter, { MysteryEncounterOption } from "../data/mystery-encounter";
import { Phase } from "../phase";
import { Mode } from "../ui/ui";
import { MysteryEncounterPostOptionSelectPhase } from "./mystery-encounter-phase";

export class MysteryEncounterOptionSelectPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

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
