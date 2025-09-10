import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { getCharVariantFromDialogue } from "#data/dialogue";
import { BattleSpec } from "#enums/battle-spec";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { SwitchType } from "#enums/switch-type";
import { TrainerSlot } from "#enums/trainer-slot";
import { UiMode } from "#enums/ui-mode";
import { IvScannerModifier } from "#modifiers/modifier";
import { getEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import type { OptionSelectSettings } from "#mystery-encounters/encounter-phase-utils";
import { transitionMysteryEncounterIntroVisuals } from "#mystery-encounters/encounter-phase-utils";
import type { MysteryEncounterOption, OptionPhaseCallback } from "#mystery-encounters/mystery-encounter-option";
import { SeenEncounterData } from "#mystery-encounters/mystery-encounter-save-data";
import { isNullOrUndefined, randSeedItem } from "#utils/common";
import i18next from "i18next";

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
  public readonly phaseName = "MysteryEncounterPhase";
  private readonly FIRST_DIALOGUE_PROMPT_DELAY = 300;
  optionSelectSettings?: OptionSelectSettings;

  /**
   * Mostly useful for having repeated queries during a single encounter, where the queries and options may differ each time
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
    globalScene.phaseManager.clearPhaseQueue();
    globalScene.phaseManager.clearPhaseQueueSplice();

    const encounter = globalScene.currentBattle.mysteryEncounter!;
    encounter.updateSeedOffset();

    if (!this.optionSelectSettings) {
      // Sets flag that ME was encountered, only if this is not a followup option select phase
      // Can be used in later MEs to check for requirements to spawn, run history, etc.
      globalScene.mysteryEncounterSaveData.encounteredEvents.push(
        new SeenEncounterData(encounter.encounterType, encounter.encounterTier, globalScene.currentBattle.waveIndex),
      );
    }

    // Initiates encounter dialogue window and option select
    globalScene.ui.setMode(UiMode.MYSTERY_ENCOUNTER, this.optionSelectSettings);
  }

  /**
   * Triggers after a player selects an option for the encounter
   * @param option
   * @param index
   */
  handleOptionSelect(option: MysteryEncounterOption, index: number): boolean {
    // Set option selected flag
    globalScene.currentBattle.mysteryEncounter!.selectedOption = option;

    if (!this.optionSelectSettings) {
      // Saves the selected option in the ME save data, only if this is not a followup option select phase
      // Can be used for analytics purposes to track what options are popular on certain encounters
      const encounterSaveData = globalScene.mysteryEncounterSaveData.encounteredEvents.at(-1)!;
      if (encounterSaveData.type === globalScene.currentBattle.mysteryEncounter?.encounterType) {
        encounterSaveData.selectedOption = index;
      }
    }

    if (!option.onOptionPhase) {
      return false;
    }

    // Populate dialogue tokens for option requirements
    globalScene.currentBattle.mysteryEncounter!.populateDialogueTokensFromRequirements();

    if (option.onPreOptionPhase) {
      globalScene.executeWithSeedOffset(async () => {
        return await option.onPreOptionPhase!().then(result => {
          if (isNullOrUndefined(result) || result) {
            this.continueEncounter();
          }
        });
      }, globalScene.currentBattle.mysteryEncounter?.getSeedOffset());
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
      globalScene.phaseManager.pushNew("MysteryEncounterOptionSelectedPhase");
      this.end();
    };

    const optionSelectDialogue = globalScene.currentBattle?.mysteryEncounter?.selectedOption?.dialogue;
    if (optionSelectDialogue?.selected && optionSelectDialogue.selected.length > 0) {
      // Handle intermediate dialogue (between player selection event and the onOptionSelect logic)
      globalScene.ui.setMode(UiMode.MESSAGE);
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
          globalScene.ui.showDialogue(
            text ?? "",
            title,
            null,
            nextAction,
            0,
            i === 1 ? this.FIRST_DIALOGUE_PROMPT_DELAY : 0,
          );
        } else {
          globalScene.ui.showText(text ?? "", null, nextAction, i === 1 ? this.FIRST_DIALOGUE_PROMPT_DELAY : 0, true);
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
    globalScene.ui.setMode(UiMode.MESSAGE).then(() => super.end());
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
  public readonly phaseName = "MysteryEncounterOptionSelectedPhase";
  onOptionSelect: OptionPhaseCallback;

  constructor() {
    super();
    this.onOptionSelect = globalScene.currentBattle.mysteryEncounter!.selectedOption!.onOptionPhase;
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
    if (globalScene.currentBattle.mysteryEncounter?.autoHideIntroVisuals) {
      transitionMysteryEncounterIntroVisuals().then(() => {
        globalScene.executeWithSeedOffset(() => {
          this.onOptionSelect().finally(() => {
            this.end();
          });
        }, globalScene.currentBattle.mysteryEncounter?.getSeedOffset() * 500);
      });
    } else {
      globalScene.executeWithSeedOffset(() => {
        this.onOptionSelect().finally(() => {
          this.end();
        });
      }, globalScene.currentBattle.mysteryEncounter?.getSeedOffset() * 500);
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
  public readonly phaseName = "MysteryEncounterBattleStartCleanupPhase";
  /**
   * Cleans up `TURN_END` tags, any {@linkcode PostTurnStatusEffectPhase}s, checks for Pokemon switches, then continues
   */
  start() {
    super.start();

    // Lapse any residual flinches/endures but ignore all other turn-end battle tags
    const includedLapseTags = [BattlerTagType.FLINCHED, BattlerTagType.ENDURING];
    globalScene.getField(true).forEach(pokemon => {
      const tags = pokemon.summonData.tags;
      tags
        .filter(
          t =>
            includedLapseTags.includes(t.tagType)
            && t.lapseTypes.includes(BattlerTagLapseType.TURN_END)
            && !t.lapse(pokemon, BattlerTagLapseType.TURN_END),
        )
        .forEach(t => {
          t.onRemove(pokemon);
          tags.splice(tags.indexOf(t), 1);
        });
    });

    // Remove any status tick phases
    while (globalScene.phaseManager.findPhase(p => p.is("PostTurnStatusEffectPhase"))) {
      globalScene.phaseManager.tryRemovePhase(p => p.is("PostTurnStatusEffectPhase"));
    }

    // The total number of Pokemon in the player's party that can legally fight
    const legalPlayerPokemon = globalScene.getPokemonAllowedInBattle();
    // The total number of legal player Pokemon that aren't currently on the field
    const legalPlayerPartyPokemon = legalPlayerPokemon.filter(p => !p.isActive(true));
    if (legalPlayerPokemon.length === 0) {
      globalScene.phaseManager.unshiftNew("GameOverPhase");
      return this.end();
    }

    // Check for any KOd player mons and switch
    // For each fainted mon on the field, if there is a legal replacement, summon it
    const playerField = globalScene.getPlayerField();
    playerField.forEach((pokemon, i) => {
      if (!pokemon.isAllowedInBattle() && legalPlayerPartyPokemon.length > i) {
        globalScene.phaseManager.unshiftNew("SwitchPhase", SwitchType.SWITCH, i, true, false);
      }
    });

    // THEN, if is a double battle, and player only has 1 summoned pokemon, center pokemon on field
    if (globalScene.currentBattle.double && legalPlayerPokemon.length === 1 && legalPlayerPartyPokemon.length === 0) {
      globalScene.phaseManager.unshiftNew("ToggleDoublePositionPhase", true);
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
  public readonly phaseName = "MysteryEncounterBattlePhase";
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
   * @private
   */
  private getBattleMessage(): string {
    const enemyField = globalScene.getEnemyField();
    const encounterMode = globalScene.currentBattle.mysteryEncounter!.encounterMode;

    if (globalScene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      return i18next.t("battle:bossAppeared", { bossName: enemyField[0].name });
    }

    if (encounterMode === MysteryEncounterMode.TRAINER_BATTLE) {
      if (globalScene.currentBattle.double) {
        return i18next.t("battle:trainerAppearedDouble", {
          trainerName: globalScene.currentBattle.trainer?.getName(TrainerSlot.NONE, true),
        });
      }
      return i18next.t("battle:trainerAppeared", {
        trainerName: globalScene.currentBattle.trainer?.getName(TrainerSlot.NONE, true),
      });
    }

    return enemyField.length === 1
      ? i18next.t("battle:singleWildAppeared", {
          pokemonName: enemyField[0].name,
        })
      : i18next.t("battle:multiWildAppeared", {
          pokemonName1: enemyField[0].name,
          pokemonName2: enemyField[1].name,
        });
  }

  /**
   * Queues {@linkcode SummonPhase}s for the new battle, and handles trainer animations/dialogue if it's a Trainer battle
   * @private
   */
  private doMysteryEncounterBattle() {
    const encounterMode = globalScene.currentBattle.mysteryEncounter!.encounterMode;
    if (encounterMode === MysteryEncounterMode.WILD_BATTLE || encounterMode === MysteryEncounterMode.BOSS_BATTLE) {
      // Summons the wild/boss Pokemon
      if (encounterMode === MysteryEncounterMode.BOSS_BATTLE) {
        globalScene.playBgm();
      }
      const availablePartyMembers = globalScene.getEnemyParty().filter(p => !p.isFainted()).length;
      globalScene.phaseManager.unshiftNew("SummonPhase", 0, false);
      if (globalScene.currentBattle.double && availablePartyMembers > 1) {
        globalScene.phaseManager.unshiftNew("SummonPhase", 1, false);
      }

      if (!globalScene.currentBattle.mysteryEncounter?.hideBattleIntroMessage) {
        globalScene.ui.showText(this.getBattleMessage(), null, () => this.endBattleSetup(), 0);
      } else {
        this.endBattleSetup();
      }
    } else if (encounterMode === MysteryEncounterMode.TRAINER_BATTLE) {
      this.showEnemyTrainer();
      const doSummon = () => {
        globalScene.currentBattle.started = true;
        globalScene.playBgm();
        globalScene.pbTray.showPbTray(globalScene.getPlayerParty());
        globalScene.pbTrayEnemy.showPbTray(globalScene.getEnemyParty());
        const doTrainerSummon = () => {
          this.hideEnemyTrainer();
          const availablePartyMembers = globalScene.getEnemyParty().filter(p => !p.isFainted()).length;
          globalScene.phaseManager.unshiftNew("SummonPhase", 0, false);
          if (globalScene.currentBattle.double && availablePartyMembers > 1) {
            globalScene.phaseManager.unshiftNew("SummonPhase", 1, false);
          }
          this.endBattleSetup();
        };
        if (!globalScene.currentBattle.mysteryEncounter?.hideBattleIntroMessage) {
          globalScene.ui.showText(this.getBattleMessage(), null, doTrainerSummon, 1000, true);
        } else {
          doTrainerSummon();
        }
      };

      const encounterMessages = globalScene.currentBattle.trainer?.getEncounterMessages();

      if (!encounterMessages || encounterMessages.length === 0) {
        doSummon();
      } else {
        const trainer = globalScene.currentBattle.trainer;
        let message: string;
        globalScene.executeWithSeedOffset(
          () => (message = randSeedItem(encounterMessages)),
          globalScene.currentBattle.mysteryEncounter?.getSeedOffset(),
        );
        message = message!; // tell TS compiler it's defined now
        const showDialogueAndSummon = () => {
          globalScene.ui.showDialogue(message, trainer?.getName(TrainerSlot.NONE, true), null, () => {
            globalScene.charSprite.hide().then(() => globalScene.hideFieldOverlay(250).then(() => doSummon()));
          });
        };
        if (globalScene.currentBattle.trainer?.config.hasCharSprite && !globalScene.ui.shouldSkipDialogue(message)) {
          globalScene
            .showFieldOverlay(500)
            .then(() =>
              globalScene.charSprite
                .showCharacter(trainer?.getKey()!, getCharVariantFromDialogue(encounterMessages[0]))
                .then(() => showDialogueAndSummon()),
            ); // TODO: is this bang correct?
        } else {
          showDialogueAndSummon();
        }
      }
    }
  }

  /**
   * Initiate {@linkcode SummonPhase}s, {@linkcode ScanIvsPhase}, {@linkcode PostSummonPhase}s, etc.
   * @private
   */
  private endBattleSetup() {
    const enemyField = globalScene.getEnemyField();
    const encounterMode = globalScene.currentBattle.mysteryEncounter!.encounterMode;

    // PostSummon and ShinySparkle phases are handled by SummonPhase

    if (encounterMode !== MysteryEncounterMode.TRAINER_BATTLE) {
      const ivScannerModifier = globalScene.findModifier(m => m instanceof IvScannerModifier);
      if (ivScannerModifier) {
        enemyField.map(p => globalScene.phaseManager.pushNew("ScanIvsPhase", p.getBattlerIndex()));
      }
    }

    const availablePartyMembers = globalScene.getPlayerParty().filter(p => p.isAllowedInBattle());

    if (!availablePartyMembers[0].isOnField()) {
      globalScene.phaseManager.pushNew("SummonPhase", 0);
    }

    if (globalScene.currentBattle.double) {
      if (availablePartyMembers.length > 1) {
        globalScene.phaseManager.pushNew("ToggleDoublePositionPhase", true);
        if (!availablePartyMembers[1].isOnField()) {
          globalScene.phaseManager.pushNew("SummonPhase", 1);
        }
      }
    } else {
      if (availablePartyMembers.length > 1 && availablePartyMembers[1].isOnField()) {
        globalScene.getPlayerField().forEach(pokemon => pokemon.lapseTag(BattlerTagType.COMMANDED));
        globalScene.phaseManager.pushNew("ReturnPhase", 1);
      }
      globalScene.phaseManager.pushNew("ToggleDoublePositionPhase", false);
    }

    if (encounterMode !== MysteryEncounterMode.TRAINER_BATTLE && !this.disableSwitch) {
      const minPartySize = globalScene.currentBattle.double ? 2 : 1;
      if (availablePartyMembers.length > minPartySize) {
        globalScene.phaseManager.pushNew("CheckSwitchPhase", 0, globalScene.currentBattle.double);
        if (globalScene.currentBattle.double) {
          globalScene.phaseManager.pushNew("CheckSwitchPhase", 1, globalScene.currentBattle.double);
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
    const trainer = globalScene.currentBattle.trainer;
    if (!trainer) {
      return;
    }
    trainer.alpha = 0;
    trainer.x += 16;
    trainer.y -= 16;
    trainer.setVisible(true);
    globalScene.tweens.add({
      targets: trainer,
      x: "-=16",
      y: "+=16",
      alpha: 1,
      ease: "Sine.easeInOut",
      duration: 750,
      onComplete: () => {
        trainer.untint(100, "Sine.easeOut");
        trainer.playAnim();
      },
    });
  }

  private hideEnemyTrainer(): void {
    globalScene.tweens.add({
      targets: globalScene.currentBattle.trainer,
      x: "+=16",
      y: "-=16",
      alpha: 0,
      ease: "Sine.easeInOut",
      duration: 750,
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
  public readonly phaseName = "MysteryEncounterRewardsPhase";
  addHealPhase: boolean;

  constructor(addHealPhase = false) {
    super();
    this.addHealPhase = addHealPhase;
  }

  /**
   * Runs {@linkcode MysteryEncounter.doContinueEncounter} and ends phase, OR {@linkcode MysteryEncounter.onRewards} then continues encounter
   */
  start() {
    super.start();
    const encounter = globalScene.currentBattle.mysteryEncounter!;

    if (encounter.doContinueEncounter) {
      encounter.doContinueEncounter().then(() => {
        this.end();
      });
    } else {
      globalScene.executeWithSeedOffset(() => {
        if (encounter.onRewards) {
          encounter.onRewards().then(() => {
            this.doEncounterRewardsAndContinue();
          });
        } else {
          this.doEncounterRewardsAndContinue();
        }
        // Do not use ME's seedOffset for rewards, these should always be consistent with waveIndex (once per wave)
      }, globalScene.currentBattle.waveIndex * 1000);
    }
  }

  /**
   * Queues encounter EXP and rewards phases, {@linkcode PostMysteryEncounterPhase}, and ends phase
   */
  doEncounterRewardsAndContinue() {
    const encounter = globalScene.currentBattle.mysteryEncounter!;

    if (encounter.doEncounterExp) {
      encounter.doEncounterExp();
    }

    if (encounter.doEncounterRewards) {
      encounter.doEncounterRewards();
    } else if (this.addHealPhase) {
      globalScene.phaseManager.tryRemovePhase(p => p.is("SelectModifierPhase"));
      globalScene.phaseManager.unshiftNew("SelectModifierPhase", 0, undefined, {
        fillRemaining: false,
        rerollMultiplier: -1,
      });
    }

    globalScene.phaseManager.pushNew("PostMysteryEncounterPhase");
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
  public readonly phaseName = "PostMysteryEncounterPhase";
  private readonly FIRST_DIALOGUE_PROMPT_DELAY = 750;
  onPostOptionSelect?: OptionPhaseCallback;

  constructor() {
    super();
    this.onPostOptionSelect = globalScene.currentBattle.mysteryEncounter?.selectedOption?.onPostOptionPhase;
  }

  /**
   * Runs {@linkcode MysteryEncounter.onPostOptionSelect} then continues encounter
   */
  start() {
    super.start();

    if (this.onPostOptionSelect) {
      globalScene.executeWithSeedOffset(async () => {
        return await this.onPostOptionSelect!().then(result => {
          if (isNullOrUndefined(result) || result) {
            this.continueEncounter();
          }
        });
      }, globalScene.currentBattle.mysteryEncounter?.getSeedOffset() * 2000);
    } else {
      this.continueEncounter();
    }
  }

  /**
   * Queues {@linkcode NewBattlePhase}, plays outro dialogue and ends phase
   */
  continueEncounter() {
    const endPhase = () => {
      if (globalScene.gameMode.hasRandomBiomes || globalScene.isNewBiome()) {
        globalScene.phaseManager.pushNew("SelectBiomePhase");
      }

      globalScene.phaseManager.pushNew("NewBattlePhase");
      this.end();
    };

    const outroDialogue = globalScene.currentBattle?.mysteryEncounter?.dialogue?.outro;
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
        globalScene.ui.setMode(UiMode.MESSAGE);
        if (title) {
          globalScene.ui.showDialogue(
            text ?? "",
            title,
            null,
            nextAction,
            0,
            i === 1 ? this.FIRST_DIALOGUE_PROMPT_DELAY : 0,
          );
        } else {
          globalScene.ui.showText(text ?? "", null, nextAction, i === 1 ? this.FIRST_DIALOGUE_PROMPT_DELAY : 0, true);
        }
      };

      showNextDialogue();
    } else {
      endPhase();
    }
  }
}
