import i18next from "i18next";
import BattleScene from "../battle-scene";
import { Phase } from "../phase";
import { Mode } from "../ui/ui";
import { transitionMysteryEncounterIntroVisuals, OptionSelectSettings } from "../data/mystery-encounters/utils/encounter-phase-utils";
import MysteryEncounterOption, { OptionPhaseCallback } from "../data/mystery-encounters/mystery-encounter-option";
import { getCharVariantFromDialogue } from "../data/dialogue";
import { TrainerSlot } from "../data/trainer-config";
import { BattleSpec } from "#enums/battle-spec";
import { Tutorial, handleTutorial } from "../tutorial";
import { IvScannerModifier } from "../modifier/modifier";
import * as Utils from "../utils";
import { isNullOrUndefined } from "../utils";
import { getEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { BattlerTagLapseType } from "#app/data/battler-tags";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { PostTurnStatusEffectPhase } from "#app/phases/post-turn-status-effect-phase";
import { SummonPhase } from "#app/phases/summon-phase";
import { ScanIvsPhase } from "#app/phases/scan-ivs-phase";
import { ToggleDoublePositionPhase } from "#app/phases/toggle-double-position-phase";
import { ReturnPhase } from "#app/phases/return-phase";
import { CheckSwitchPhase } from "#app/phases/check-switch-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { NewBattlePhase } from "#app/phases/new-battle-phase";
import { GameOverPhase } from "#app/phases/game-over-phase";
import { SwitchPhase } from "#app/phases/switch-phase";
import { SeenEncounterData } from "#app/data/mystery-encounters/mystery-encounter-save-data";

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
  private readonly FIRST_DIALOGUE_PROMPT_DELAY = 300;
  optionSelectSettings?: OptionSelectSettings;

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

    const encounter = this.scene.currentBattle.mysteryEncounter!;
    encounter.updateSeedOffset(this.scene);

    if (!this.optionSelectSettings) {
      // Sets flag that ME was encountered, only if this is not a followup option select phase
      // Can be used in later MEs to check for requirements to spawn, run history, etc.
      this.scene.mysteryEncounterSaveData.encounteredEvents.push(new SeenEncounterData(encounter.encounterType, encounter.encounterTier, this.scene.currentBattle.waveIndex));
    }

    // Initiates encounter dialogue window and option select
    this.scene.ui.setMode(Mode.MYSTERY_ENCOUNTER, this.optionSelectSettings);
  }

  handleOptionSelect(option: MysteryEncounterOption, index: number): boolean {
    // Set option selected flag
    this.scene.currentBattle.mysteryEncounter!.selectedOption = option;

    if (!this.optionSelectSettings) {
      // Saves the selected option in the ME save data, only if this is not a followup option select phase
      // Can be used for analytics purposes to track what options are popular on certain encounters
      const encounterSaveData = this.scene.mysteryEncounterSaveData.encounteredEvents[this.scene.mysteryEncounterSaveData.encounteredEvents.length - 1];
      if (encounterSaveData.type === this.scene.currentBattle.mysteryEncounter?.encounterType) {
        encounterSaveData.selectedOption = index;
      }
    }

    if (!option.onOptionPhase) {
      return false;
    }

    // Populate dialogue tokens for option requirements
    this.scene.currentBattle.mysteryEncounter!.populateDialogueTokensFromRequirements(this.scene);

    if (option.onPreOptionPhase) {
      this.scene.executeWithSeedOffset(async () => {
        return await option.onPreOptionPhase!(this.scene)
          .then((result) => {
            if (isNullOrUndefined(result) || result) {
              this.continueEncounter();
            }
          });
      }, this.scene.currentBattle.mysteryEncounter?.getSeedOffset());
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
    if (optionSelectDialogue?.selected && optionSelectDialogue.selected.length > 0) {
      // Handle intermediate dialogue (between player selection event and the onOptionSelect logic)
      this.scene.ui.setMode(Mode.MESSAGE);
      const selectedDialogue = optionSelectDialogue.selected;
      let i = 0;
      const showNextDialogue = () => {
        const nextAction = i === selectedDialogue.length - 1 ? endDialogueAndContinueEncounter : showNextDialogue;
        const dialogue = selectedDialogue[i];
        let title: string | null = null;
        const text: string | null = getEncounterText(this.scene, dialogue.text);
        if (dialogue.speaker) {
          title = getEncounterText(this.scene, dialogue.speaker);
        }

        i++;
        if (title) {
          this.scene.ui.showDialogue(text ?? "", title, null, nextAction, 0, i === 1 ? this.FIRST_DIALOGUE_PROMPT_DELAY : 0);
        } else {
          this.scene.ui.showText(text ?? "", null, nextAction, i === 1 ? this.FIRST_DIALOGUE_PROMPT_DELAY : 0, true);
        }
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
  onOptionSelect: OptionPhaseCallback;

  constructor(scene: BattleScene) {
    super(scene);
    this.onOptionSelect = this.scene.currentBattle.mysteryEncounter!.selectedOption!.onOptionPhase;
  }

  start() {
    super.start();
    if (this.scene.currentBattle.mysteryEncounter?.autoHideIntroVisuals) {
      transitionMysteryEncounterIntroVisuals(this.scene).then(() => {
        this.scene.executeWithSeedOffset(() => {
          this.onOptionSelect(this.scene).finally(() => {
            this.end();
          });
        }, this.scene.currentBattle.mysteryEncounter?.getSeedOffset() * 500);
      });
    } else {
      this.scene.executeWithSeedOffset(() => {
        this.onOptionSelect(this.scene).finally(() => {
          this.end();
        });
      }, this.scene.currentBattle.mysteryEncounter?.getSeedOffset() * 500);
    }
  }
}

/**
 * Runs at the beginning of an Encounter's battle
 * Will clean up any residual flinches, Endure, etc. that are left over from startOfBattleEffects
 * Will also handle Game Overs, switches, etc. that could happen from handleMysteryEncounterBattleStartEffects
 * See [TurnEndPhase](../phases.ts) for more details
 */
export class MysteryEncounterBattleStartCleanupPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const field = this.scene.getField(true).filter(p => p.summonData);
    field.forEach(pokemon => {
      pokemon.lapseTags(BattlerTagLapseType.TURN_END);
    });

    // Remove any status tick phases
    while (!!this.scene.findPhase(p => p instanceof PostTurnStatusEffectPhase)) {
      this.scene.tryRemovePhase(p => p instanceof PostTurnStatusEffectPhase);
    }

    // The total number of Pokemon in the player's party that can legally fight
    const legalPlayerPokemon = this.scene.getParty().filter(p => p.isAllowedInBattle());
    // The total number of legal player Pokemon that aren't currently on the field
    const legalPlayerPartyPokemon = legalPlayerPokemon.filter(p => !p.isActive(true));
    if (!legalPlayerPokemon.length) {
      this.scene.unshiftPhase(new GameOverPhase(this.scene));
    }

    // Check for any KOd player mons and switch
    // For each fainted mon on the field, if there is a legal replacement, summon it
    const playerField = this.scene.getPlayerField();
    playerField.forEach((pokemon, i) => {
      if (!pokemon.isAllowedInBattle() && legalPlayerPartyPokemon.length > i) {
        this.scene.unshiftPhase(new SwitchPhase(this.scene, i, true, false));
      }
    });

    // THEN, if is a double battle, and player only has 1 summoned pokemon, center pokemon on field
    if (this.scene.currentBattle.double && legalPlayerPokemon.length === 1 && legalPlayerPartyPokemon.length === 0) {
      this.scene.unshiftPhase(new ToggleDoublePositionPhase(this.scene, true));
    }

    super.end();
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
    const encounterMode = scene.currentBattle.mysteryEncounter!.encounterMode;

    if (scene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      return i18next.t("battle:bossAppeared", { bossName: enemyField[0].name });
    }

    if (encounterMode === MysteryEncounterMode.TRAINER_BATTLE) {
      if (scene.currentBattle.double) {
        return i18next.t("battle:trainerAppearedDouble", { trainerName: scene.currentBattle.trainer?.getName(TrainerSlot.NONE, true) });

      } else {
        return i18next.t("battle:trainerAppeared", { trainerName: scene.currentBattle.trainer?.getName(TrainerSlot.NONE, true) });
      }
    }

    return enemyField.length === 1
      ? i18next.t("battle:singleWildAppeared", { pokemonName: enemyField[0].name })
      : i18next.t("battle:multiWildAppeared", { pokemonName1: enemyField[0].name, pokemonName2: enemyField[1].name });
  }

  doMysteryEncounterBattle(scene: BattleScene) {
    const encounterMode = scene.currentBattle.mysteryEncounter!.encounterMode;
    if (encounterMode === MysteryEncounterMode.WILD_BATTLE || encounterMode === MysteryEncounterMode.BOSS_BATTLE) {
      // Summons the wild/boss Pokemon
      if (encounterMode === MysteryEncounterMode.BOSS_BATTLE) {
        scene.playBgm(undefined);
      }
      const availablePartyMembers = scene.getEnemyParty().filter(p => !p.isFainted()).length;
      scene.unshiftPhase(new SummonPhase(scene, 0, false));
      if (scene.currentBattle.double && availablePartyMembers > 1) {
        scene.unshiftPhase(new SummonPhase(scene, 1, false));
      }

      if (!scene.currentBattle.mysteryEncounter?.hideBattleIntroMessage) {
        scene.ui.showText(this.getBattleMessage(scene), null, () => this.endBattleSetup(scene), 0);
      } else {
        this.endBattleSetup(scene);
      }
    } else if (encounterMode === MysteryEncounterMode.TRAINER_BATTLE) {
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
        if (!scene.currentBattle.mysteryEncounter?.hideBattleIntroMessage) {
          scene.ui.showText(this.getBattleMessage(scene), null, doTrainerSummon, 1000, true);
        } else {
          doTrainerSummon();
        }
      };

      const encounterMessages = scene.currentBattle.trainer?.getEncounterMessages();

      if (!encounterMessages || !encounterMessages.length) {
        doSummon();
      } else {
        const trainer = this.scene.currentBattle.trainer;
        let message: string;
        scene.executeWithSeedOffset(() => message = Utils.randSeedItem(encounterMessages), this.scene.currentBattle.mysteryEncounter?.getSeedOffset());
        message = message!; // tell TS compiler it's defined now
        const showDialogueAndSummon = () => {
          scene.ui.showDialogue(message, trainer?.getName(TrainerSlot.NONE, true), null, () => {
            scene.charSprite.hide().then(() => scene.hideFieldOverlay(250).then(() => doSummon()));
          });
        };
        if (this.scene.currentBattle.trainer?.config.hasCharSprite && !this.scene.ui.shouldSkipDialogue(message)) {
          this.scene.showFieldOverlay(500).then(() => this.scene.charSprite.showCharacter(trainer?.getKey()!, getCharVariantFromDialogue(encounterMessages[0])).then(() => showDialogueAndSummon())); // TODO: is this bang correct?
        } else {
          showDialogueAndSummon();
        }
      }
    }
  }

  endBattleSetup(scene: BattleScene) {
    const enemyField = scene.getEnemyField();
    const encounterMode = scene.currentBattle.mysteryEncounter!.encounterMode;

    // PostSummon and ShinySparkle phases are handled by SummonPhase

    if (encounterMode !== MysteryEncounterMode.TRAINER_BATTLE) {
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

    if (encounterMode !== MysteryEncounterMode.TRAINER_BATTLE && !this.disableSwitch) {
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
    if (!trainer) {
      return;
    }
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
 * - doContinueEncounter() callback for continuous encounters with back-to-back battles (this should push/shift its own phases as needed)
 *
 * OR
 *
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
    const encounter = this.scene.currentBattle.mysteryEncounter!;

    if (encounter.doContinueEncounter) {
      encounter.doContinueEncounter(this.scene).then(() => {
        this.end();
      });
    } else {
      this.scene.executeWithSeedOffset(() => {
        if (encounter.onRewards) {
          encounter.onRewards(this.scene).then(() => {
            this.doEncounterRewardsAndContinue();
          });
        } else {
          this.doEncounterRewardsAndContinue();
        }
        // Do not use ME's seedOffset for rewards, these should always be consistent with waveIndex (once per wave)
      }, this.scene.currentBattle.waveIndex * 1000);
    }
  }

  doEncounterRewardsAndContinue() {
    const encounter = this.scene.currentBattle.mysteryEncounter!;

    if (encounter.doEncounterExp) {
      encounter.doEncounterExp(this.scene);
    }

    if (encounter.doEncounterRewards) {
      encounter.doEncounterRewards(this.scene);
    } else if (this.addHealPhase) {
      this.scene.tryRemovePhase(p => p instanceof SelectModifierPhase);
      this.scene.unshiftPhase(new SelectModifierPhase(this.scene, 0, undefined, { fillRemaining: false, rerollMultiplier: 0 }));
    }

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
  private readonly FIRST_DIALOGUE_PROMPT_DELAY = 750;
  onPostOptionSelect?: OptionPhaseCallback;

  constructor(scene: BattleScene) {
    super(scene);
    this.onPostOptionSelect = this.scene.currentBattle.mysteryEncounter?.selectedOption?.onPostOptionPhase;
  }

  start() {
    super.start();

    if (this.onPostOptionSelect) {
      this.scene.executeWithSeedOffset(async () => {
        return await this.onPostOptionSelect!(this.scene)
          .then((result) => {
            if (isNullOrUndefined(result) || result) {
              this.continueEncounter();
            }
          });
      }, this.scene.currentBattle.mysteryEncounter?.getSeedOffset() * 2000);
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
    if (outroDialogue && outroDialogue.length > 0) {
      let i = 0;
      const showNextDialogue = () => {
        const nextAction = i === outroDialogue.length - 1 ? endPhase : showNextDialogue;
        const dialogue = outroDialogue[i];
        let title: string | null = null;
        const text: string | null = getEncounterText(this.scene, dialogue.text);
        if (dialogue.speaker) {
          title = getEncounterText(this.scene, dialogue.speaker);
        }

        i++;
        this.scene.ui.setMode(Mode.MESSAGE);
        if (title) {
          this.scene.ui.showDialogue(text ?? "", title, null, nextAction, 0, i === 1 ? this.FIRST_DIALOGUE_PROMPT_DELAY : 0);
        } else {
          this.scene.ui.showText(text ?? "", null, nextAction, i === 1 ? this.FIRST_DIALOGUE_PROMPT_DELAY : 0, true);
        }
      };

      showNextDialogue();
    } else {
      endPhase();
    }
  }
}
