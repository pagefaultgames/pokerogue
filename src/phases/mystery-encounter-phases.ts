import i18next from "i18next";
import { gScene } from "#app/battle-scene";
import { Phase } from "../phase";
import { Mode } from "../ui/ui";
import { transitionMysteryEncounterIntroVisuals, OptionSelectSettings } from "../data/mystery-encounters/utils/encounter-phase-utils";
import MysteryEncounterOption, { OptionPhaseCallback } from "#app/data/mystery-encounters/mystery-encounter-option";
import { getCharVariantFromDialogue } from "../data/dialogue";
import { TrainerSlot } from "../data/trainer-config";
import { BattleSpec } from "#enums/battle-spec";
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
import { SwitchType } from "#enums/switch-type";
import { BattlerTagType } from "#enums/battler-tag-type";

/**
 * Will handle (in order):
 * - Clearing of phase queues to enter the Mystery Encounter game state
 * - Management of session data related to MEs
 * - Initialization of ME option select menu and UI
 * - Execute {@linkcode MysteryEncounter.onPreOptionPhase} logic if it exists for the selected option
 * - Display any `OptionTextDisplay.selected` type dialogue that is set in the {@linkcode MysteryEncounterDialogue} dialogue tree for selected option
 * - Queuing of the {@linkcode MysteryEncounterOptionSelectedPhase}
 */
export class MysteryEncounterPhase extends Phase {
  private readonly FIRST_DIALOGUE_PROMPT_DELAY = 300;
  optionSelectSettings?: OptionSelectSettings;

  /**
   * Mostly useful for having repeated queries during a single encounter, where the queries and options may differ each time
   * @param scene
   * @param optionSelectSettings allows overriding the typical options of an encounter with new ones
   */
  constructor(optionSelectSettings?: OptionSelectSettings) {
    super();
    this.optionSelectSettings = optionSelectSettings;
  }

  /**
   * Updates seed offset, sets seen encounter session data, sets UI mode
   */
  start() {
    super.start();

    // Clears out queued phases that are part of standard battle
    gScene.clearPhaseQueue();
    gScene.clearPhaseQueueSplice();

    const encounter = gScene.currentBattle.mysteryEncounter!;
    encounter.updateSeedOffset();

    if (!this.optionSelectSettings) {
      // Sets flag that ME was encountered, only if this is not a followup option select phase
      // Can be used in later MEs to check for requirements to spawn, run history, etc.
      gScene.mysteryEncounterSaveData.encounteredEvents.push(new SeenEncounterData(encounter.encounterType, encounter.encounterTier, gScene.currentBattle.waveIndex));
    }

    // Initiates encounter dialogue window and option select
    gScene.ui.setMode(Mode.MYSTERY_ENCOUNTER, this.optionSelectSettings);
  }

  /**
   * Triggers after a player selects an option for the encounter
   * @param option
   * @param index
   */
  handleOptionSelect(option: MysteryEncounterOption, index: number): boolean {
    // Set option selected flag
    gScene.currentBattle.mysteryEncounter!.selectedOption = option;

    if (!this.optionSelectSettings) {
      // Saves the selected option in the ME save data, only if this is not a followup option select phase
      // Can be used for analytics purposes to track what options are popular on certain encounters
      const encounterSaveData = gScene.mysteryEncounterSaveData.encounteredEvents[gScene.mysteryEncounterSaveData.encounteredEvents.length - 1];
      if (encounterSaveData.type === gScene.currentBattle.mysteryEncounter?.encounterType) {
        encounterSaveData.selectedOption = index;
      }
    }

    if (!option.onOptionPhase) {
      return false;
    }

    // Populate dialogue tokens for option requirements
    gScene.currentBattle.mysteryEncounter!.populateDialogueTokensFromRequirements();

    if (option.onPreOptionPhase) {
      gScene.executeWithSeedOffset(async () => {
        return await option.onPreOptionPhase!()
          .then((result) => {
            if (isNullOrUndefined(result) || result) {
              this.continueEncounter();
            }
          });
      }, gScene.currentBattle.mysteryEncounter?.getSeedOffset());
    } else {
      this.continueEncounter();
    }

    return true;
  }

  /**
   * Queues {@linkcode MysteryEncounterOptionSelectedPhase}, displays option.selected dialogue and ends phase
   */
  continueEncounter() {
    const endDialogueAndContinueEncounter = () => {
      gScene.pushPhase(new MysteryEncounterOptionSelectedPhase());
      this.end();
    };

    const optionSelectDialogue = gScene.currentBattle?.mysteryEncounter?.selectedOption?.dialogue;
    if (optionSelectDialogue?.selected && optionSelectDialogue.selected.length > 0) {
      // Handle intermediate dialogue (between player selection event and the onOptionSelect logic)
      gScene.ui.setMode(Mode.MESSAGE);
      const selectedDialogue = optionSelectDialogue.selected;
      let i = 0;
      const showNextDialogue = () => {
        const nextAction = i === selectedDialogue.length - 1 ? endDialogueAndContinueEncounter : showNextDialogue;
        const dialogue = selectedDialogue[i];
        let title: string | null = null;
        const text: string | null = getEncounterText(dialogue.text);
        if (dialogue.speaker) {
          title = getEncounterText(dialogue.speaker);
        }

        i++;
        if (title) {
          gScene.ui.showDialogue(text ?? "", title, null, nextAction, 0, i === 1 ? this.FIRST_DIALOGUE_PROMPT_DELAY : 0);
        } else {
          gScene.ui.showText(text ?? "", null, nextAction, i === 1 ? this.FIRST_DIALOGUE_PROMPT_DELAY : 0, true);
        }
      };

      showNextDialogue();
    } else {
      endDialogueAndContinueEncounter();
    }
  }

  /**
   * Ends phase
   */
  end() {
    gScene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}

/**
 * Will handle (in order):
 * - Execute {@linkcode MysteryEncounter.onOptionSelect} logic if it exists for the selected option
 *
 * It is important to point out that no phases are directly queued by any logic within this phase
 * Any phase that is meant to follow this one MUST be queued via the onOptionSelect() logic of the selected option
 */
export class MysteryEncounterOptionSelectedPhase extends Phase {
  onOptionSelect: OptionPhaseCallback;

  constructor() {
    super();
    this.onOptionSelect = gScene.currentBattle.mysteryEncounter!.selectedOption!.onOptionPhase;
  }

  /**
   * Will handle (in order):
   * - Execute {@linkcode MysteryEncounter.onOptionSelect} logic if it exists for the selected option
   *
   * It is important to point out that no phases are directly queued by any logic within this phase.
   * Any phase that is meant to follow this one MUST be queued via the {@linkcode MysteryEncounter.onOptionSelect} logic of the selected option.
   */
  start() {
    super.start();
    if (gScene.currentBattle.mysteryEncounter?.autoHideIntroVisuals) {
      transitionMysteryEncounterIntroVisuals().then(() => {
        gScene.executeWithSeedOffset(() => {
          this.onOptionSelect().finally(() => {
            this.end();
          });
        }, gScene.currentBattle.mysteryEncounter?.getSeedOffset() * 500);
      });
    } else {
      gScene.executeWithSeedOffset(() => {
        this.onOptionSelect().finally(() => {
          this.end();
        });
      }, gScene.currentBattle.mysteryEncounter?.getSeedOffset() * 500);
    }
  }
}

/**
 * Runs at the beginning of an Encounter's battle
 * Will clean up any residual flinches, Endure, etc. that are left over from {@linkcode MysteryEncounter.startOfBattleEffects}
 * Will also handle Game Overs, switches, etc. that could happen from {@linkcode handleMysteryEncounterBattleStartEffects}
 * See {@linkcode TurnEndPhase} for more details
 */
export class MysteryEncounterBattleStartCleanupPhase extends Phase {
  constructor() {
    super();
  }

  /**
   * Cleans up `TURN_END` tags, any {@linkcode PostTurnStatusEffectPhase}s, checks for Pokemon switches, then continues
   */
  start() {
    super.start();

    // Lapse any residual flinches/endures but ignore all other turn-end battle tags
    const includedLapseTags = [ BattlerTagType.FLINCHED, BattlerTagType.ENDURING ];
    const field = gScene.getField(true).filter(p => p.summonData);
    field.forEach(pokemon => {
      const tags = pokemon.summonData.tags;
      tags.filter(t => includedLapseTags.includes(t.tagType)
        && t.lapseTypes.includes(BattlerTagLapseType.TURN_END)
        && !(t.lapse(pokemon, BattlerTagLapseType.TURN_END))).forEach(t => {
        t.onRemove(pokemon);
        tags.splice(tags.indexOf(t), 1);
      });
    });

    // Remove any status tick phases
    while (!!gScene.findPhase(p => p instanceof PostTurnStatusEffectPhase)) {
      gScene.tryRemovePhase(p => p instanceof PostTurnStatusEffectPhase);
    }

    // The total number of Pokemon in the player's party that can legally fight
    const legalPlayerPokemon = gScene.getParty().filter(p => p.isAllowedInBattle());
    // The total number of legal player Pokemon that aren't currently on the field
    const legalPlayerPartyPokemon = legalPlayerPokemon.filter(p => !p.isActive(true));
    if (!legalPlayerPokemon.length) {
      gScene.unshiftPhase(new GameOverPhase());
      return this.end();
    }

    // Check for any KOd player mons and switch
    // For each fainted mon on the field, if there is a legal replacement, summon it
    const playerField = gScene.getPlayerField();
    playerField.forEach((pokemon, i) => {
      if (!pokemon.isAllowedInBattle() && legalPlayerPartyPokemon.length > i) {
        gScene.unshiftPhase(new SwitchPhase(SwitchType.SWITCH, i, true, false));
      }
    });

    // THEN, if is a double battle, and player only has 1 summoned pokemon, center pokemon on field
    if (gScene.currentBattle.double && legalPlayerPokemon.length === 1 && legalPlayerPartyPokemon.length === 0) {
      gScene.unshiftPhase(new ToggleDoublePositionPhase(true));
    }

    this.end();
  }
}

/**
 * Will handle (in order):
 * - Setting BGM
 * - Showing intro dialogue for an enemy trainer or wild Pokemon
 * - Sliding in the visuals for enemy trainer or wild Pokemon, as well as handling summoning animations
 * - Queue the {@linkcode SummonPhase}s, {@linkcode PostSummonPhase}s, etc., required to initialize the phase queue for a battle
 */
export class MysteryEncounterBattlePhase extends Phase {
  disableSwitch: boolean;

  constructor(disableSwitch = false) {
    super();
    this.disableSwitch = disableSwitch;
  }

  /**
   * Sets up a ME battle
   */
  start() {
    super.start();

    this.doMysteryEncounterBattle();
  }

  /**
   * Gets intro battle message for new battle
   * @param scene
   * @private
   */
  private getBattleMessage(): string {
    const enemyField = gScene.getEnemyField();
    const encounterMode = gScene.currentBattle.mysteryEncounter!.encounterMode;

    if (gScene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      return i18next.t("battle:bossAppeared", { bossName: enemyField[0].name });
    }

    if (encounterMode === MysteryEncounterMode.TRAINER_BATTLE) {
      if (gScene.currentBattle.double) {
        return i18next.t("battle:trainerAppearedDouble", { trainerName: gScene.currentBattle.trainer?.getName(TrainerSlot.NONE, true) });

      } else {
        return i18next.t("battle:trainerAppeared", { trainerName: gScene.currentBattle.trainer?.getName(TrainerSlot.NONE, true) });
      }
    }

    return enemyField.length === 1
      ? i18next.t("battle:singleWildAppeared", { pokemonName: enemyField[0].name })
      : i18next.t("battle:multiWildAppeared", { pokemonName1: enemyField[0].name, pokemonName2: enemyField[1].name });
  }

  /**
   * Queues {@linkcode SummonPhase}s for the new battle, and handles trainer animations/dialogue if it's a Trainer battle
   * @param scene
   * @private
   */
  private doMysteryEncounterBattle() {
    const encounterMode = gScene.currentBattle.mysteryEncounter!.encounterMode;
    if (encounterMode === MysteryEncounterMode.WILD_BATTLE || encounterMode === MysteryEncounterMode.BOSS_BATTLE) {
      // Summons the wild/boss Pokemon
      if (encounterMode === MysteryEncounterMode.BOSS_BATTLE) {
        gScene.playBgm();
      }
      const availablePartyMembers = gScene.getEnemyParty().filter(p => !p.isFainted()).length;
      gScene.unshiftPhase(new SummonPhase(0, false));
      if (gScene.currentBattle.double && availablePartyMembers > 1) {
        gScene.unshiftPhase(new SummonPhase(1, false));
      }

      if (!gScene.currentBattle.mysteryEncounter?.hideBattleIntroMessage) {
        gScene.ui.showText(this.getBattleMessage(), null, () => this.endBattleSetup(), 0);
      } else {
        this.endBattleSetup();
      }
    } else if (encounterMode === MysteryEncounterMode.TRAINER_BATTLE) {
      this.showEnemyTrainer();
      const doSummon = () => {
        gScene.currentBattle.started = true;
        gScene.playBgm();
        gScene.pbTray.showPbTray(gScene.getParty());
        gScene.pbTrayEnemy.showPbTray(gScene.getEnemyParty());
        const doTrainerSummon = () => {
          this.hideEnemyTrainer();
          const availablePartyMembers = gScene.getEnemyParty().filter(p => !p.isFainted()).length;
          gScene.unshiftPhase(new SummonPhase(0, false));
          if (gScene.currentBattle.double && availablePartyMembers > 1) {
            gScene.unshiftPhase(new SummonPhase(1, false));
          }
          this.endBattleSetup();
        };
        if (!gScene.currentBattle.mysteryEncounter?.hideBattleIntroMessage) {
          gScene.ui.showText(this.getBattleMessage(), null, doTrainerSummon, 1000, true);
        } else {
          doTrainerSummon();
        }
      };

      const encounterMessages = gScene.currentBattle.trainer?.getEncounterMessages();

      if (!encounterMessages || !encounterMessages.length) {
        doSummon();
      } else {
        const trainer = gScene.currentBattle.trainer;
        let message: string;
        gScene.executeWithSeedOffset(() => message = Utils.randSeedItem(encounterMessages), gScene.currentBattle.mysteryEncounter?.getSeedOffset());
        message = message!; // tell TS compiler it's defined now
        const showDialogueAndSummon = () => {
          gScene.ui.showDialogue(message, trainer?.getName(TrainerSlot.NONE, true), null, () => {
            gScene.charSprite.hide().then(() => gScene.hideFieldOverlay(250).then(() => doSummon()));
          });
        };
        if (gScene.currentBattle.trainer?.config.hasCharSprite && !gScene.ui.shouldSkipDialogue(message)) {
          gScene.showFieldOverlay(500).then(() => gScene.charSprite.showCharacter(trainer?.getKey()!, getCharVariantFromDialogue(encounterMessages[0])).then(() => showDialogueAndSummon())); // TODO: is this bang correct?
        } else {
          showDialogueAndSummon();
        }
      }
    }
  }

  /**
   * Initiate {@linkcode SummonPhase}s, {@linkcode ScanIvsPhase}, {@linkcode PostSummonPhase}s, etc.
   * @param scene
   * @private
   */
  private endBattleSetup() {
    const enemyField = gScene.getEnemyField();
    const encounterMode = gScene.currentBattle.mysteryEncounter!.encounterMode;

    // PostSummon and ShinySparkle phases are handled by SummonPhase

    if (encounterMode !== MysteryEncounterMode.TRAINER_BATTLE) {
      const ivScannerModifier = gScene.findModifier(m => m instanceof IvScannerModifier);
      if (ivScannerModifier) {
        enemyField.map(p => gScene.pushPhase(new ScanIvsPhase(p.getBattlerIndex(), Math.min(ivScannerModifier.getStackCount() * 2, 6))));
      }
    }

    const availablePartyMembers = gScene.getParty().filter(p => p.isAllowedInBattle());

    if (!availablePartyMembers[0].isOnField()) {
      gScene.pushPhase(new SummonPhase(0));
    }

    if (gScene.currentBattle.double) {
      if (availablePartyMembers.length > 1) {
        gScene.pushPhase(new ToggleDoublePositionPhase(true));
        if (!availablePartyMembers[1].isOnField()) {
          gScene.pushPhase(new SummonPhase(1));
        }
      }
    } else {
      if (availablePartyMembers.length > 1 && availablePartyMembers[1].isOnField()) {
        gScene.pushPhase(new ReturnPhase(1));
      }
      gScene.pushPhase(new ToggleDoublePositionPhase(false));
    }

    if (encounterMode !== MysteryEncounterMode.TRAINER_BATTLE && !this.disableSwitch) {
      const minPartySize = gScene.currentBattle.double ? 2 : 1;
      if (availablePartyMembers.length > minPartySize) {
        gScene.pushPhase(new CheckSwitchPhase(0, gScene.currentBattle.double));
        if (gScene.currentBattle.double) {
          gScene.pushPhase(new CheckSwitchPhase(1, gScene.currentBattle.double));
        }
      }
    }

    this.end();
  }

  /**
   * Ease in enemy trainer
   * @private
   */
  private showEnemyTrainer(): void {
    // Show enemy trainer
    const trainer = gScene.currentBattle.trainer;
    if (!trainer) {
      return;
    }
    trainer.alpha = 0;
    trainer.x += 16;
    trainer.y -= 16;
    trainer.setVisible(true);
    gScene.tweens.add({
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

  private hideEnemyTrainer(): void {
    gScene.tweens.add({
      targets: gScene.currentBattle.trainer,
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
 * - Any encounter reward logic that is set within {@linkcode MysteryEncounter.doEncounterExp}
 * - Any encounter reward logic that is set within {@linkcode MysteryEncounter.doEncounterRewards}
 * - Otherwise, can add a no-reward-item shop with only Potions, etc. if addHealPhase is true
 * - Queuing of the {@linkcode PostMysteryEncounterPhase}
 */
export class MysteryEncounterRewardsPhase extends Phase {
  addHealPhase: boolean;

  constructor(addHealPhase: boolean = false) {
    super();
    this.addHealPhase = addHealPhase;
  }

  /**
   * Runs {@linkcode MysteryEncounter.doContinueEncounter} and ends phase, OR {@linkcode MysteryEncounter.onRewards} then continues encounter
   */
  start() {
    super.start();
    const encounter = gScene.currentBattle.mysteryEncounter!;

    if (encounter.doContinueEncounter) {
      encounter.doContinueEncounter().then(() => {
        this.end();
      });
    } else {
      gScene.executeWithSeedOffset(() => {
        if (encounter.onRewards) {
          encounter.onRewards().then(() => {
            this.doEncounterRewardsAndContinue();
          });
        } else {
          this.doEncounterRewardsAndContinue();
        }
        // Do not use ME's seedOffset for rewards, these should always be consistent with waveIndex (once per wave)
      }, gScene.currentBattle.waveIndex * 1000);
    }
  }

  /**
   * Queues encounter EXP and rewards phases, {@linkcode PostMysteryEncounterPhase}, and ends phase
   */
  doEncounterRewardsAndContinue() {
    const encounter = gScene.currentBattle.mysteryEncounter!;

    if (encounter.doEncounterExp) {
      encounter.doEncounterExp();
    }

    if (encounter.doEncounterRewards) {
      encounter.doEncounterRewards();
    } else if (this.addHealPhase) {
      gScene.tryRemovePhase(p => p instanceof SelectModifierPhase);
      gScene.unshiftPhase(new SelectModifierPhase(0, undefined, { fillRemaining: false, rerollMultiplier: -1 }));
    }

    gScene.pushPhase(new PostMysteryEncounterPhase());
    this.end();
  }
}

/**
 * Will handle (in order):
 * - {@linkcode MysteryEncounter.onPostOptionSelect} logic (based on an option that was selected)
 * - Showing any outro dialogue messages
 * - Cleanup of any leftover intro visuals
 * - Queuing of the next wave
 */
export class PostMysteryEncounterPhase extends Phase {
  private readonly FIRST_DIALOGUE_PROMPT_DELAY = 750;
  onPostOptionSelect?: OptionPhaseCallback;

  constructor() {
    super();
    this.onPostOptionSelect = gScene.currentBattle.mysteryEncounter?.selectedOption?.onPostOptionPhase;
  }

  /**
   * Runs {@linkcode MysteryEncounter.onPostOptionSelect} then continues encounter
   */
  start() {
    super.start();

    if (this.onPostOptionSelect) {
      gScene.executeWithSeedOffset(async () => {
        return await this.onPostOptionSelect!()
          .then((result) => {
            if (isNullOrUndefined(result) || result) {
              this.continueEncounter();
            }
          });
      }, gScene.currentBattle.mysteryEncounter?.getSeedOffset() * 2000);
    } else {
      this.continueEncounter();
    }
  }

  /**
   * Queues {@linkcode NewBattlePhase}, plays outro dialogue and ends phase
   */
  continueEncounter() {
    const endPhase = () => {
      gScene.pushPhase(new NewBattlePhase());
      this.end();
    };

    const outroDialogue = gScene.currentBattle?.mysteryEncounter?.dialogue?.outro;
    if (outroDialogue && outroDialogue.length > 0) {
      let i = 0;
      const showNextDialogue = () => {
        const nextAction = i === outroDialogue.length - 1 ? endPhase : showNextDialogue;
        const dialogue = outroDialogue[i];
        let title: string | null = null;
        const text: string | null = getEncounterText(dialogue.text);
        if (dialogue.speaker) {
          title = getEncounterText(dialogue.speaker);
        }

        i++;
        gScene.ui.setMode(Mode.MESSAGE);
        if (title) {
          gScene.ui.showDialogue(text ?? "", title, null, nextAction, 0, i === 1 ? this.FIRST_DIALOGUE_PROMPT_DELAY : 0);
        } else {
          gScene.ui.showText(text ?? "", null, nextAction, i === 1 ? this.FIRST_DIALOGUE_PROMPT_DELAY : 0, true);
        }
      };

      showNextDialogue();
    } else {
      endPhase();
    }
  }
}
