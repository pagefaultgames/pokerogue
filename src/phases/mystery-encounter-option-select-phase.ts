import BattleScene from "../battle-scene";
import MysteryEncounter from "../data/mystery-encounter";
import { Phase } from "../phase";
import { Mode } from "../ui/ui";

export class MysteryEncounterOptionSelectPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.ui.setMode(Mode.MYSTERY_ENCOUNTER);
  }

  handleOptionSelect(option: any): boolean {
    //const playerPokemon = this.scene.getPlayerField()[this.fieldIndex];
    //const enemyField = this.scene.getEnemyField();
    let success: boolean;

    // If option is fight a battle, set up battle here

    // If option is gain an item, do that

    // Etc.

    if (success) {
      this.end();
    }

    return success;
  }

  cancel() {
    // Handle escaping of this option select phase?
    // Unsure if this is necessary

    this.end();
    //if (this.fieldIndex) {
    //  this.scene.unshiftPhase(new CommandPhase(this.scene, 0));
    //  this.scene.unshiftPhase(new CommandPhase(this.scene, 1));
    //  this.end();
    //}
  }

  getMysteryEncounter(): MysteryEncounter {
    return this.scene.currentBattle.mysteryEncounter;
  }

  end() {
    this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}
