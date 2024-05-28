import { Phase } from "./phase";
import BattleScene from "./battle-scene";
import { Mode } from "./ui/ui";
import MysteryEncounter, { OptionSelectMysteryEncounter } from "./data/mystery-encounter";
import { OptionSelectItem } from "./ui/abstact-option-select-ui-handler";

export class MysteryEncounterPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.ui.setModeForceTransition(Mode.MYSTERY_ENCOUNTER).then(() => {
      // Determine the Mystery Encounter
      const mysteryEncounter = this.getMysteryEncounter(this.scene);

      // If there is no mysteryEncounter, skip phase and go to next battle/floor as normal
      if (!mysteryEncounter) {
        this.end();
        return;
      }

      // Render UI for Encounter
      this.renderMysteryEncounter(this.scene, mysteryEncounter);

      this.end();
    });
  }

  end() {
    super.end();
  }

  getMysteryEncounter(scene: BattleScene): MysteryEncounter {
    // Do some logic to figure out what encounter spawned

    // Init and return encounter object

    // This should be moved/serialized elsewhere, but sticking here for now
    // Ideally, the OptionSelectMysteryEncounter should create its own options array on initialization based on the Encounter type
    const options: OptionSelectItem[] = [
      {
        label: "Option 2",
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

    const encounter = new OptionSelectMysteryEncounter(scene, options);

    return encounter;
  }

  renderMysteryEncounter(scene: BattleScene, encounter: MysteryEncounter): void {
    this.scene.ui.showText("render mystery encounter text heere", null, () => this.scene.ui.setOverlayMode(Mode.OPTION_SELECT, { options: encounter.options }));
  }
}
