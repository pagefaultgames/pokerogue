import i18next from "i18next";
import BattleScene from "../battle-scene";
import { Phase } from "../phase";
import { Mode } from "../ui/ui";
import { hideMysteryEncounterIntroVisuals } from "../utils/mystery-encounter-utils";
import { CheckSwitchPhase, NewBattlePhase, PostSummonPhase, ReturnPhase, ScanIvsPhase, ShinySparklePhase, SummonPhase, ToggleDoublePositionPhase } from "../phases";
import MysteryEncounterOption from "../data/mystery-encounter-option";
import { MysteryEncounterVariant } from "../data/mystery-encounter";
import { getCharVariantFromDialogue } from "../data/dialogue";
import { TrainerSlot } from "../data/trainer-config";
import { BattleSpec } from "../enums/battle-spec";
import { BattlerIndex } from "../battle";
import { Tutorial, handleTutorial } from "../tutorial";
import { IvScannerModifier } from "../modifier/modifier";
import * as Utils from "../utils";

export class MysteryEncounterPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    // Clears out queued phases that are part of standard battle
    this.scene.clearPhaseQueue();
    this.scene.clearPhaseQueueSplice();

    // Sets flag that ME was encountered
    // Can be used in later MEs to check for requirements to spawn
    this.scene.mysteryEncounterFlags.encounteredEvents.push(this.scene.currentBattle.mysteryEncounter.encounterType);

    // Initiates encounter dialogue window and option select
    this.scene.ui.setMode(Mode.MYSTERY_ENCOUNTER);
  }

  handleOptionSelect(option: MysteryEncounterOption, index: number): boolean {
    // Set option selected flag
    this.scene.currentBattle.mysteryEncounter.selectedOption = option;

    if (option.onPreOptionPhase) {
      option.onPreOptionPhase(this.scene);
    }

    if (!option.onOptionPhase) {
      return false;
    }

    const endDialogueAndContinueEncounter = () => {
      this.scene.pushPhase(new MysteryEncounterOptionSelectedPhase(this.scene));
      this.end();
    };

    const optionSelectDialogue = this.scene.currentBattle?.mysteryEncounter?.dialogue?.encounterOptionsDialogue?.options?.[index];
    if (optionSelectDialogue?.selected?.length > 0) {
      // Handle intermediate dialogue (between player selection event and the onOptionSelect logic)
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
  onOptionSelect: (scene: BattleScene) => Promise<boolean | void>;

  constructor(scene: BattleScene) {
    super(scene);
    this.onOptionSelect = this.scene.currentBattle.mysteryEncounter.selectedOption.onOptionPhase;
  }

  start() {
    super.start();
    //this.scene.pushPhase(new PostMysteryEncounterPhase(this.scene));
    hideMysteryEncounterIntroVisuals(this.scene).then(() => {
      this.onOptionSelect(this.scene).finally(() => {
        this.end();
      });
    });
  }
}

export class MysteryEncounterBattlePhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.doMysteryEncounterBattle(this.scene);
  }

  getBattleMessage(scene: BattleScene): string {
    const enemyField = scene.getEnemyField();
    const encounterVariant = scene.currentBattle.mysteryEncounter.encounterVariant;

    if (scene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      return i18next.t("battle:bossAppeared", { bossName: enemyField[0].name });
    }

    if (encounterVariant === MysteryEncounterVariant.TRAINER_BATTLE) {
      if (scene.currentBattle.double) {
        return i18next.t("battle:trainerAppearedDouble", { trainerName: scene.currentBattle.trainer.getName(TrainerSlot.NONE, true) });

      } else {
        return i18next.t("battle:trainerAppeared", { trainerName: scene.currentBattle.trainer.getName(TrainerSlot.NONE, true) });
      }
    }

    return enemyField.length === 1
      ? i18next.t("battle:singleWildAppeared", { pokemonName: enemyField[0].name })
      : i18next.t("battle:multiWildAppeared", { pokemonName1: enemyField[0].name, pokemonName2: enemyField[1].name });
  }

  doMysteryEncounterBattle(scene: BattleScene, showEncounterMessage: boolean = true) {
    const encounterVariant = scene.currentBattle.mysteryEncounter.encounterVariant;
    if (encounterVariant === MysteryEncounterVariant.WILD_BATTLE || encounterVariant === MysteryEncounterVariant.BOSS_BATTLE) {
      // Summons the wild/boss Pokemon
      const availablePartyMembers = scene.getEnemyParty().filter(p => !p.isFainted()).length;
      scene.unshiftPhase(new SummonPhase(scene, 0, false));
      if (scene.currentBattle.double && availablePartyMembers > 1) {
        scene.unshiftPhase(new SummonPhase(scene, 1, false));
      }

      if (showEncounterMessage) {
        scene.ui.showText(this.getBattleMessage(scene), null, () => this.endBattleSetup(scene), 1500);
      } else {
        this.endBattleSetup(scene);
      }
    } else if (encounterVariant === MysteryEncounterVariant.TRAINER_BATTLE) {
      // Show enemy trainer
      const trainer = scene.currentBattle.trainer;
      trainer.alpha = 0;
      trainer.x += 16;
      trainer.y -= 16;
      scene.tweens.add({
        targets: scene.currentBattle.trainer,
        x: "-=16",
        y: "+=16",
        alpha: 1,
        ease: "Sine.easeInOut",
        duration: 750,
        onComplete: () => {
          trainer.untint(100, "Sine.easeOut");
          trainer.playAnim();
        }
      });

      const doSummon = () => {
        scene.currentBattle.started = true;
        scene.playBgm(undefined);
        scene.pbTray.showPbTray(scene.getParty());
        scene.pbTrayEnemy.showPbTray(scene.getEnemyParty());
        const doTrainerSummon = () => {
          this.hideEnemyTrainer();
          const availablePartyMembers = scene.getEnemyParty().filter(p => !p.isFainted()).length;
          scene.unshiftPhase(new SummonPhase(scene, 0, false));
          if (scene.currentBattle.double && availablePartyMembers > 1) {
            scene.unshiftPhase(new SummonPhase(scene, 1, false));
          }
          this.endBattleSetup(scene);
        };
        if (showEncounterMessage) {
          scene.ui.showText(this.getBattleMessage(scene), null, doTrainerSummon, 1500, true);
        } else {
          doTrainerSummon();
        }
      };

      const encounterMessages = scene.currentBattle.trainer.getEncounterMessages();

      if (!encounterMessages?.length) {
        doSummon();
      } else {
        let message: string;
        scene.executeWithSeedOffset(() => message = Utils.randSeedItem(encounterMessages), scene.currentBattle.waveIndex);

        const showDialogueAndSummon = () => {
          scene.ui.showDialogue(message, trainer.getName(TrainerSlot.NONE, true), null, () => {
            scene.charSprite.hide().then(() => scene.hideFieldOverlay(250).then(() => doSummon()));
          });
        };
        if (scene.currentBattle.trainer.config.hasCharSprite && !scene.ui.shouldSkipDialogue(message)) {
          scene.showFieldOverlay(500).then(() => scene.charSprite.showCharacter(trainer.getKey(), getCharVariantFromDialogue(encounterMessages[0])).then(() => showDialogueAndSummon()));
        } else {
          showDialogueAndSummon();
        }
      }
    }
  }

  endBattleSetup(scene: BattleScene) {
    const enemyField = scene.getEnemyField();
    const encounterVariant = scene.currentBattle.mysteryEncounter.encounterVariant;

    enemyField.forEach((enemyPokemon, e) => {
      if (enemyPokemon.isShiny()) {
        scene.unshiftPhase(new ShinySparklePhase(scene, BattlerIndex.ENEMY + e));
      }
    });

    if (encounterVariant !== MysteryEncounterVariant.TRAINER_BATTLE) {
      enemyField.map(p => scene.pushPhase(new PostSummonPhase(scene, p.getBattlerIndex())));
      const ivScannerModifier = scene.findModifier(m => m instanceof IvScannerModifier);
      if (ivScannerModifier) {
        enemyField.map(p => scene.pushPhase(new ScanIvsPhase(scene, p.getBattlerIndex(), Math.min(ivScannerModifier.getStackCount() * 2, 6))));
      }
    }

    const availablePartyMembers = scene.getParty().filter(p => !p.isFainted());

    if (!availablePartyMembers[0].isOnField()) {
      scene.pushPhase(new SummonPhase(scene, 0));
    }

    if (scene.currentBattle.double) {
      if (availablePartyMembers.length > 1) {
        scene.pushPhase(new ToggleDoublePositionPhase(scene, true));
        if (!availablePartyMembers[1].isOnField()) {
          scene.pushPhase(new SummonPhase(scene, 1));
        }
      }
    } else {
      if (availablePartyMembers.length > 1 && availablePartyMembers[1].isOnField()) {
        scene.pushPhase(new ReturnPhase(scene, 1));
      }
      scene.pushPhase(new ToggleDoublePositionPhase(scene, false));
    }

    if (encounterVariant !== MysteryEncounterVariant.TRAINER_BATTLE && (scene.currentBattle.waveIndex > 1 || !scene.gameMode.isDaily)) {
      const minPartySize = scene.currentBattle.double ? 2 : 1;
      if (availablePartyMembers.length > minPartySize) {
        scene.pushPhase(new CheckSwitchPhase(scene, 0, scene.currentBattle.double));
        if (scene.currentBattle.double) {
          scene.pushPhase(new CheckSwitchPhase(scene, 1, scene.currentBattle.double));
        }
      }
    }

    // TODO:
    handleTutorial(this.scene, Tutorial.Access_Menu).then(() => super.end());
  }

  hideEnemyTrainer(): void {
    this.scene.tweens.add({
      targets: this.scene.currentBattle.trainer,
      x: "+=16",
      y: "-=16",
      alpha: 0,
      ease: "Sine.easeInOut",
      duration: 750
    });
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

  constructor(scene: BattleScene) {
    super(scene);
    this.onPostOptionSelect = this.scene.currentBattle.mysteryEncounter.selectedOption.onPostOptionPhase;
  }

  start() {
    super.start();

    if (this.onPostOptionSelect) {
      this.onPostOptionSelect(this.scene);
    }

    const endPhase = () => {
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

  //end() {
  //  this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  //}
}
