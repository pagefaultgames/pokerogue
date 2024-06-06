import i18next from "i18next";
import BattleScene from "../battle-scene";
import { Phase } from "../phase";
import { Mode } from "../ui/ui";
import { hideMysteryEncounterIntroVisuals } from "../utils/mystery-encounter-utils";
import { EggLapsePhase, NewBattlePhase } from "../phases";
import MysteryEncounterOption from "../data/mystery-encounter-option";
import { MysteryEncounterVariant } from "../data/mystery-encounter";

export class MysteryEncounterPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    // Sets flag that ME was encountered
    // Can be used in later MEs to check for requirements to spawn
    this.scene.mysteryEncounterFlags.encounteredEvents.push(this.scene.currentBattle.mysteryEncounter.encounterType);

    // Initiates encounter dialogue window and option select
    this.scene.ui.setMode(Mode.MYSTERY_ENCOUNTER);
  }

  handleOptionSelect(option: MysteryEncounterOption, index: number): boolean {
    if (option.onPreOptionPhase) {
      option.onPreOptionPhase(this.scene);
    }

    if (!option.onOptionPhase) {
      return false;
    }

    const endDialogueAndContinueEncounter = () => {
      this.scene.unshiftPhase(new MysteryEncounterOptionSelectedPhase(this.scene, option.onOptionPhase));
      this.scene.unshiftPhase(new PostMysteryEncounterPhase(this.scene, option.onPostOptionPhase));
      this.end();
    };

    const optionSelectDialogue = this.scene.currentBattle?.mysteryEncounter?.dialogue?.encounterOptionsDialogue?.options?.[index];
    if (optionSelectDialogue?.selected?.length > 0) {
      // Handle intermediate dialogue
      this.scene.ui.setMode(Mode.MESSAGE);
      const selectedDialogue = optionSelectDialogue.selected;
      const dialogueTokens = this.scene.currentBattle?.mysteryEncounter?.dialogueTokens;
      let i = 0;

      const showNextDialogue = () => {
        const nextAction = i === selectedDialogue.length - 1 ? endDialogueAndContinueEncounter : showNextDialogue;
        const dialogue = selectedDialogue[i];
        let title: string = null;
        let text: string = i18next.t(dialogue.text);
        if (dialogue.speaker) {
          title = i18next.t(dialogue.speaker);
        }

        if (dialogueTokens) {
          dialogueTokens.forEach((token) => {
            if (title) {
              title = title.replace(token[0], token[1]);
            }
            text = text.replace(token[0], token[1]);
          });
        }

        if (title) {
          this.scene.ui.showDialogue(text, title, null, nextAction, 0, i === 0 ? 750 : 0);
        } else {
          this.scene.ui.showText(text, null, nextAction, i === 0 ? 750 : 0, true);
        }
        i++;
      };

      showNextDialogue();
    } else {
      endDialogueAndContinueEncounter();
    }

    return true;
  }

  // TODO: Handle escaping of this option select phase?
  // Unsure if this is necessary
  cancel() {
    this.end();
  }

  end() {
    this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}


/**
 * Will handle (in order):
 * - onOptionSelect logic (based on an option that was selected)
 * - Issuing Rewards for non-combat encounters (combat encounters issue rewards on their own)
 */
export class MysteryEncounterOptionSelectedPhase extends Phase {
  onPostOptionSelect: (scene: BattleScene) => Promise<boolean | void>;

  constructor(scene: BattleScene, onPostOptionSelect: (scene: BattleScene) => Promise<boolean | void>) {
    super(scene);
    this.onPostOptionSelect = onPostOptionSelect;
  }

  start() {
    super.start();
    hideMysteryEncounterIntroVisuals(this.scene).then(() => {
      this.onPostOptionSelect(this.scene).then(() => {
        // doEncounterRewards will instead be called from the VictoryPhase in the case of a combat encounter
        if (this.scene.currentBattle.mysteryEncounter.doEncounterRewards && this.scene.currentBattle.mysteryEncounter.encounterVariant === MysteryEncounterVariant.NO_BATTLE) {
          this.scene.currentBattle.mysteryEncounter.doEncounterRewards(this.scene);
        }

        this.end();
      });
    });
  }

  end() {
    this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}

/**
 * Will handle (in order):
 * - onPostOptionSelect logic (based on an option that was selected)
 * - Showing any outro dialogue messages
 * - Resetting encounter-specific flags (not session flags)
 * - Queuing of the next wave
 */
export class PostMysteryEncounterPhase extends Phase {
  onPostOptionSelect: (scene: BattleScene) => boolean | void;

  constructor(scene: BattleScene, onPostOptionSelect?: (scene: BattleScene) => boolean | void) {
    super(scene);
    this.onPostOptionSelect = onPostOptionSelect;
  }

  start() {
    super.start();

    if (this.onPostOptionSelect) {
      this.onPostOptionSelect(this.scene);
    }

    const endPhase = () => {
      // Clear out any leftover phases and clean queues
      this.scene.clearPhaseQueue();
      this.scene.clearPhaseQueueSplice();
      // Queues new egg phase and battle after outro dialogue
      this.scene.pushPhase(new EggLapsePhase(this.scene));
      this.scene.pushPhase(new NewBattlePhase(this.scene));
      this.end();
    };

    const outroDialogue = this.scene.currentBattle?.mysteryEncounter?.dialogue?.outro;
    if (outroDialogue?.length > 0) {
      const dialogueTokens = this.scene.currentBattle?.mysteryEncounter?.dialogueTokens;
      let i = 0;

      const showNextDialogue = () => {
        const nextAction = i === outroDialogue.length - 1 ? endPhase : showNextDialogue;
        const dialogue = outroDialogue[i];
        let title: string = null;
        let text: string = i18next.t(dialogue.text);
        if (dialogue.speaker) {
          title = i18next.t(dialogue.speaker);
        }

        if (dialogueTokens) {
          dialogueTokens.forEach((token) => {
            if (title) {
              title = title.replace(token[0], token[1]);
            }
            text = text.replace(token[0], token[1]);
          });
        }

        this.scene.ui.setMode(Mode.MESSAGE);
        if (title) {
          this.scene.ui.showDialogue(text, title, null, nextAction, 0, i === 0 ? 750 : 0);
        } else {
          this.scene.ui.showText(text, null, nextAction, i === 0 ? 750 : 0, true);
        }
        i++;
      };

      showNextDialogue();
    } else {
      endPhase();
    }
  }

  end() {
    this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}
