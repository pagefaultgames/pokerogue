import i18next from "i18next";
import BattleScene from "../battle-scene";
import MysteryEncounter, { MysteryEncounterOption } from "../data/mystery-encounter";
import { Phase } from "../phase";
import { Mode } from "../ui/ui";
import { hideMysteryEncounterIntroVisuals } from "../utils/mystery-encounter-utils";
import { NewBattlePhase } from "../phases";

export class MysteryEncounterPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    // TODO: set encountered flag
    this.scene.mysteryEncounterFlags.encounteredEvents.push(this.scene.currentBattle.mysteryEncounter.encounterType);

    // Initiates encounter dialogue window and option select
    this.scene.ui.setMode(Mode.MYSTERY_ENCOUNTER);
  }

  handleOptionSelect(option: MysteryEncounterOption, index: number): boolean {
    if (option.onPreSelect) {
      option.onPreSelect(this.scene);
    }

    if (!option.onSelect) {
      return false;
    }

    const endDialogueAndContinueEncounter = () => {
      this.scene.unshiftPhase(new MysteryEncounterOptionSelectedPhase(this.scene, option.onSelect));
      this.scene.unshiftPhase(new PostMysteryEncounterPhase(this.scene, option.onPostSelect));
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
        this.end();
      });
    });
  }

  getMysteryEncounter(): MysteryEncounter {
    return this.scene.currentBattle.mysteryEncounter;
  }
}

export class PostMysteryEncounterPhase extends Phase {
  onPostEncounterPhase: (scene: BattleScene) => boolean | void;

  constructor(scene: BattleScene, onPostEncounterPhase?: (scene: BattleScene) => boolean | void) {
    super(scene);
    this.onPostEncounterPhase = onPostEncounterPhase;
  }

  start() {
    super.start();

    if (this.onPostEncounterPhase) {
      this.onPostEncounterPhase(this.scene);
    }

    const endDialogueAndContinueEncounter = () => {
      this.scene.pushPhase(new NewBattlePhase(this.scene));
      this.end();
    };

    const outroDialogue = this.scene.currentBattle?.mysteryEncounter?.dialogue?.outro;
    if (outroDialogue?.length > 0) {
      // Handle intermediate dialogue
      this.scene.ui.setMode(Mode.MESSAGE);
      //const selectedDialogue = outroDialogue;
      const dialogueTokens = this.scene.currentBattle?.mysteryEncounter?.dialogueTokens;
      let i = 0;

      const showNextDialogue = () => {
        const nextAction = i === outroDialogue.length - 1 ? endDialogueAndContinueEncounter : showNextDialogue;
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

    this.end();
  }

  getMysteryEncounter(): MysteryEncounter {
    return this.scene.currentBattle.mysteryEncounter;
  }
}
