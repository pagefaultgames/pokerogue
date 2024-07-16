import i18next from "i18next";
import BattleScene from "../battle-scene";
import { Phase } from "../phase";
import { Mode } from "../ui/ui";
import { hideMysteryEncounterIntroVisuals, OptionSelectSettings } from "../data/mystery-encounters/utils/encounter-phase-utils";
import { CheckSwitchPhase, NewBattlePhase, ReturnPhase, ScanIvsPhase, SelectModifierPhase, SummonPhase, ToggleDoublePositionPhase } from "../phases";
import MysteryEncounterOption from "../data/mystery-encounters/mystery-encounter-option";
import { MysteryEncounterVariant } from "../data/mystery-encounters/mystery-encounter";
import { getCharVariantFromDialogue } from "../data/dialogue";
import { TrainerSlot } from "../data/trainer-config";
import { BattleSpec } from "#enums/battle-spec";
import { Tutorial, handleTutorial } from "../tutorial";
import { IvScannerModifier } from "../modifier/modifier";
import * as Utils from "../utils";
import { isNullOrUndefined } from "../utils";
import { getEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";

/**
 * Will handle (in order):
 * - Clearing of phase queues to enter the Mystery Encounter game state
 * - Management of session data related to MEs
 * - Initialization of ME option select menu and UI
 * - Execute onPreOptionPhase() logic if it exists for the selected option
 * - Display any OptionTextDisplay.selected type dialogue that is set in the MysteryEncounterDialogue dialogue tree for selected option
 * - Queuing of the MysteryEncounterOptionSelectedPhase
 */
export class MysteryEncounterPhase extends Phase {
  optionSelectSettings: OptionSelectSettings;

  /**
   *
   * @param scene
   * @param optionSelectSettings - allows overriding the typical options of an encounter with new ones
   * Mostly useful for having repeated queries during a single encounter, where the queries and options may differ each time
   */
  constructor(scene: BattleScene, optionSelectSettings?: OptionSelectSettings) {
    super(scene);
    this.optionSelectSettings = optionSelectSettings;
  }

  start() {
    super.start();

    // Clears out queued phases that are part of standard battle
    this.scene.clearPhaseQueue();
    this.scene.clearPhaseQueueSplice();

    // Generates seed offset for RNG consistency, but incremented if the same MysteryEncounter has multiple option select cycles
    const offset = this.scene.currentBattle.mysteryEncounter.seedOffset ?? this.scene.currentBattle.waveIndex * 1000;
    this.scene.currentBattle.mysteryEncounter.seedOffset = offset + 512;

    if (!this.optionSelectSettings) {
      // Sets flag that ME was encountered, only if this is not a followup option select phase
      // Can be used in later MEs to check for requirements to spawn, etc.
      this.scene.mysteryEncounterData.encounteredEvents.push([this.scene.currentBattle.mysteryEncounter.encounterType, this.scene.currentBattle.mysteryEncounter.encounterTier]);
    }

    // Initiates encounter dialogue window and option select
    this.scene.ui.setMode(Mode.MYSTERY_ENCOUNTER, this.optionSelectSettings);
  }

  handleOptionSelect(option: MysteryEncounterOption, index: number): boolean {
    // Set option selected flag
    this.scene.currentBattle.mysteryEncounter.selectedOption = option;

    if (!option.onOptionPhase) {
      return false;
    }

    // Populate dialogue tokens for option requirements
    this.scene.currentBattle.mysteryEncounter.populateDialogueTokensFromRequirements(this.scene);

    if (option.onPreOptionPhase) {
      this.scene.executeWithSeedOffset(async () => {
        return await option.onPreOptionPhase(this.scene)
          .then((result) => {
            if (isNullOrUndefined(result) || result) {
              this.continueEncounter();
            }
          });
      }, this.scene.currentBattle.mysteryEncounter.seedOffset);
    } else {
      this.continueEncounter();
    }

    return true;
  }

  continueEncounter() {
    const endDialogueAndContinueEncounter = () => {
      this.scene.pushPhase(new MysteryEncounterOptionSelectedPhase(this.scene));
      this.end();
    };

    const optionSelectDialogue = this.scene.currentBattle?.mysteryEncounter?.selectedOption?.dialogue;
    if (optionSelectDialogue?.selected?.length > 0) {
      // Handle intermediate dialogue (between player selection event and the onOptionSelect logic)
      this.scene.ui.setMode(Mode.MESSAGE);
      const selectedDialogue = optionSelectDialogue.selected;
      let i = 0;
      const showNextDialogue = () => {
        const nextAction = i === selectedDialogue.length - 1 ? endDialogueAndContinueEncounter : showNextDialogue;
        const dialogue = selectedDialogue[i];
        let title: string = null;
        const text: string = getEncounterText(this.scene, dialogue.text);
        if (dialogue.speaker) {
          title = getEncounterText(this.scene, dialogue.speaker);
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
  }

  cancel() {
    this.end();
  }

  end() {
    this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}

/**
 * Will handle (in order):
 * - Execute onOptionSelect() logic if it exists for the selected option
 *
 * It is important to point out that no phases are directly queued by any logic within this phase
 * Any phase that is meant to follow this one MUST be queued via the onOptionSelect() logic of the selected option
 */
export class MysteryEncounterOptionSelectedPhase extends Phase {
  onOptionSelect: (scene: BattleScene) => Promise<boolean | void>;

  constructor(scene: BattleScene) {
    super(scene);
    this.onOptionSelect = this.scene.currentBattle.mysteryEncounter.selectedOption.onOptionPhase;
  }

  start() {
    super.start();
    if (this.scene.currentBattle.mysteryEncounter.hideIntroVisuals) {
      hideMysteryEncounterIntroVisuals(this.scene).then(() => {
        this.scene.executeWithSeedOffset(() => {
          this.onOptionSelect(this.scene).finally(() => {
            this.end();
          });
        }, this.scene.currentBattle.mysteryEncounter.seedOffset);
      });
    } else {
      this.scene.executeWithSeedOffset(() => {
        this.onOptionSelect(this.scene).finally(() => {
          this.end();
        });
      }, this.scene.currentBattle.mysteryEncounter.seedOffset);
    }
  }
}

/**
 * Will handle (in order):
 * - Setting BGM
 * - Showing intro dialogue for an enemy trainer or wild Pokemon
 * - Sliding in the visuals for enemy trainer or wild Pokemon, as well as handling summoning animations
 * - Queue the SummonPhases, PostSummonPhases, etc., required to initialize the phase queue for a battle
 */
export class MysteryEncounterBattlePhase extends Phase {
  disableSwitch: boolean;

  constructor(scene: BattleScene, disableSwitch = false) {
    super(scene);
    this.disableSwitch = disableSwitch;
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

  doMysteryEncounterBattle(scene: BattleScene) {
    const encounterVariant = scene.currentBattle.mysteryEncounter.encounterVariant;
    if (encounterVariant === MysteryEncounterVariant.WILD_BATTLE || encounterVariant === MysteryEncounterVariant.BOSS_BATTLE) {
      // Summons the wild/boss Pokemon
      if (encounterVariant === MysteryEncounterVariant.BOSS_BATTLE) {
        scene.playBgm(undefined);
      }
      const availablePartyMembers = scene.getEnemyParty().filter(p => !p.isFainted()).length;
      scene.unshiftPhase(new SummonPhase(scene, 0, false));
      if (scene.currentBattle.double && availablePartyMembers > 1) {
        scene.unshiftPhase(new SummonPhase(scene, 1, false));
      }

      if (!scene.currentBattle.mysteryEncounter.hideBattleIntroMessage) {
        scene.ui.showText(this.getBattleMessage(scene), null, () => this.endBattleSetup(scene), 500);
      } else {
        this.endBattleSetup(scene);
      }
    } else if (encounterVariant === MysteryEncounterVariant.TRAINER_BATTLE) {
      this.showEnemyTrainer();
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
        if (!scene.currentBattle.mysteryEncounter.hideBattleIntroMessage) {
          scene.ui.showText(this.getBattleMessage(scene), null, doTrainerSummon, 1500, true);
        } else {
          doTrainerSummon();
        }
      };

      const encounterMessages = scene.currentBattle.trainer.getEncounterMessages();

      if (!encounterMessages?.length) {
        doSummon();
      } else {
        const trainer = this.scene.currentBattle.trainer;
        let message: string;
        scene.executeWithSeedOffset(() => message = Utils.randSeedItem(encounterMessages), this.scene.currentBattle.mysteryEncounter.seedOffset);

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

    // PostSummon and ShinySparkle phases are handled by SummonPhase

    if (encounterVariant !== MysteryEncounterVariant.TRAINER_BATTLE) {
      const ivScannerModifier = this.scene.findModifier(m => m instanceof IvScannerModifier);
      if (ivScannerModifier) {
        enemyField.map(p => this.scene.pushPhase(new ScanIvsPhase(this.scene, p.getBattlerIndex(), Math.min(ivScannerModifier.getStackCount() * 2, 6))));
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

    if (encounterVariant !== MysteryEncounterVariant.TRAINER_BATTLE && !this.disableSwitch) {
      const minPartySize = scene.currentBattle.double ? 2 : 1;
      if (availablePartyMembers.length > minPartySize) {
        scene.pushPhase(new CheckSwitchPhase(scene, 0, scene.currentBattle.double));
        if (scene.currentBattle.double) {
          scene.pushPhase(new CheckSwitchPhase(scene, 1, scene.currentBattle.double));
        }
      }
    }

    // TODO: remove?
    handleTutorial(this.scene, Tutorial.Access_Menu).then(() => super.end());
  }

  showEnemyTrainer(): void {
    // Show enemy trainer
    const trainer = this.scene.currentBattle.trainer;
    trainer.alpha = 0;
    trainer.x += 16;
    trainer.y -= 16;
    trainer.setVisible(true);
    this.scene.tweens.add({
      targets: trainer,
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
 * - Any encounter reward logic that is set within MysteryEncounter doEncounterExp
 * - Any encounter reward logic that is set within MysteryEncounter doEncounterRewards
 * - Otherwise, can add a no-reward-item shop with only Potions, etc. if addHealPhase is true
 * - Queuing of the PostMysteryEncounterPhase
 */
export class MysteryEncounterRewardsPhase extends Phase {
  addHealPhase: boolean;

  constructor(scene: BattleScene, addHealPhase: boolean = false) {
    super(scene);
    this.addHealPhase = addHealPhase;
  }

  start() {
    super.start();

    this.scene.executeWithSeedOffset(() => {
      if (this.scene.currentBattle.mysteryEncounter.doEncounterExp) {
        this.scene.currentBattle.mysteryEncounter.doEncounterExp(this.scene);
      }

      if (this.scene.currentBattle.mysteryEncounter.doEncounterRewards) {
        this.scene.currentBattle.mysteryEncounter.doEncounterRewards(this.scene);
      } else if (this.addHealPhase) {
        this.scene.tryRemovePhase(p => p instanceof SelectModifierPhase);
        this.scene.unshiftPhase(new SelectModifierPhase(this.scene, 0, null, { fillRemaining: false, rerollMultiplier: 0 }));
      }
      // Do not use ME's seedOffset for rewards, these should always be consistent with waveIndex (once per wave)
    }, this.scene.currentBattle.waveIndex * 1000);

    this.scene.pushPhase(new PostMysteryEncounterPhase(this.scene));
    this.end();
  }
}

/**
 * Will handle (in order):
 * - onPostOptionSelect logic (based on an option that was selected)
 * - Showing any outro dialogue messages
 * - Cleanup of any leftover intro visuals
 * - Queuing of the next wave
 */
export class PostMysteryEncounterPhase extends Phase {
  onPostOptionSelect: (scene: BattleScene) => Promise<void | boolean>;

  constructor(scene: BattleScene) {
    super(scene);
    this.onPostOptionSelect = this.scene.currentBattle.mysteryEncounter.selectedOption.onPostOptionPhase;
  }

  start() {
    super.start();

    if (this.onPostOptionSelect) {
      this.scene.executeWithSeedOffset(async () => {
        return await this.onPostOptionSelect(this.scene)
          .then((result) => {
            if (isNullOrUndefined(result) || result) {
              this.continueEncounter();
            }
          });
      }, this.scene.currentBattle.mysteryEncounter.seedOffset);
    } else {
      this.continueEncounter();
    }
  }

  continueEncounter() {
    const endPhase = () => {
      this.scene.pushPhase(new NewBattlePhase(this.scene));
      this.end();
    };

    const outroDialogue = this.scene.currentBattle?.mysteryEncounter?.dialogue?.outro;
    if (outroDialogue?.length > 0) {
      let i = 0;
      const showNextDialogue = () => {
        const nextAction = i === outroDialogue.length - 1 ? endPhase : showNextDialogue;
        const dialogue = outroDialogue[i];
        let title: string = null;
        const text: string = getEncounterText(this.scene, dialogue.text);
        if (dialogue.speaker) {
          title = getEncounterText(this.scene, dialogue.speaker);
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
}
