import { Button } from "#app/enums/buttons";
import { MysteryEncounterBattlePhase, MysteryEncounterOptionSelectedPhase, MysteryEncounterPhase, MysteryEncounterRewardsPhase } from "#app/phases/mystery-encounter-phases";
import MysteryEncounterUiHandler from "#app/ui/mystery-encounter-ui-handler";
import { Mode } from "#app/ui/ui";
import GameManager from "../utils/gameManager";
import MessageUiHandler from "#app/ui/message-ui-handler";
import { Status, StatusEffect } from "#app/data/status-effect";
import { expect, vi } from "vitest";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import PartyUiHandler from "#app/ui/party-ui-handler";
import OptionSelectUiHandler from "#app/ui/settings/option-select-ui-handler";
import { isNullOrUndefined } from "#app/utils";
import { CommandPhase } from "#app/phases/command-phase";
import { VictoryPhase } from "#app/phases/victory-phase";
import { MessagePhase } from "#app/phases/message-phase";

/**
 * Runs a MysteryEncounter to either the start of a battle, or to the MysteryEncounterRewardsPhase, depending on the option selected
 * @param game
 * @param optionNo - human number, not index
 * @param secondaryOptionSelect -
 * @param isBattle - if selecting option should lead to battle, set to true
 */
export async function runMysteryEncounterToEnd(game: GameManager, optionNo: number, secondaryOptionSelect?: { pokemonNo: number, optionNo?: number }, isBattle: boolean = false) {
  vi.spyOn(EncounterPhaseUtils, "selectPokemonForOption");
  await runSelectMysteryEncounterOption(game, optionNo, secondaryOptionSelect);

  // run the selected options phase
  game.onNextPrompt("MysteryEncounterOptionSelectedPhase", Mode.MESSAGE, () => {
    const uiHandler = game.scene.ui.getHandler<MysteryEncounterUiHandler>();
    uiHandler.processInput(Button.ACTION);
  }, () => game.isCurrentPhase(MysteryEncounterBattlePhase) || game.isCurrentPhase(MysteryEncounterRewardsPhase));

  if (isBattle) {
    game.onNextPrompt("DamagePhase", Mode.MESSAGE, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    }, () => game.isCurrentPhase(CommandPhase));

    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    }, () => game.isCurrentPhase(CommandPhase));

    game.onNextPrompt("CheckSwitchPhase", Mode.MESSAGE, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    }, () => game.isCurrentPhase(CommandPhase));

    // If a battle is started, fast forward to end of the battle
    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.clearPhaseQueue();
      game.scene.clearPhaseQueueSplice();
      game.scene.unshiftPhase(new VictoryPhase(game.scene, 0));
      game.endPhase();
    });

    // Handle end of battle trainer messages
    game.onNextPrompt("TrainerVictoryPhase", Mode.MESSAGE, () => {
      const uiHandler = game.scene.ui.getHandler<MessageUiHandler>();
      uiHandler.processInput(Button.ACTION);
    });

    // Handle egg hatch dialogue
    game.onNextPrompt("EggLapsePhase", Mode.MESSAGE, () => {
      const uiHandler = game.scene.ui.getHandler<MessageUiHandler>();
      uiHandler.processInput(Button.ACTION);
    });

    await game.phaseInterceptor.to(CommandPhase);
  } else {
    await game.phaseInterceptor.to(MysteryEncounterRewardsPhase);
  }
}

export async function runSelectMysteryEncounterOption(game: GameManager, optionNo: number, secondaryOptionSelect?: { pokemonNo: number, optionNo?: number }) {
  // Handle any eventual queued messages (e.g. weather phase, etc.)
  game.onNextPrompt("MessagePhase", Mode.MESSAGE, () => {
    const uiHandler = game.scene.ui.getHandler<MessageUiHandler>();
    uiHandler.processInput(Button.ACTION);
  }, () => game.isCurrentPhase(MysteryEncounterOptionSelectedPhase));

  if (game.isCurrentPhase(MessagePhase)) {
    await game.phaseInterceptor.run(MessagePhase);
  }

  // dispose of intro messages
  game.onNextPrompt("MysteryEncounterPhase", Mode.MESSAGE, () => {
    const uiHandler = game.scene.ui.getHandler<MysteryEncounterUiHandler>();
    uiHandler.processInput(Button.ACTION);
  }, () => game.isCurrentPhase(MysteryEncounterOptionSelectedPhase));

  await game.phaseInterceptor.to(MysteryEncounterPhase, true);

  // select the desired option
  const uiHandler = game.scene.ui.getHandler<MysteryEncounterUiHandler>();
  uiHandler.unblockInput(); // input are blocked by 1s to prevent accidental input. Tests need to handle that

  switch (optionNo) {
  default:
  case 1:
    // no movement needed. Default cursor position
    break;
  case 2:
    uiHandler.processInput(Button.RIGHT);
    break;
  case 3:
    uiHandler.processInput(Button.DOWN);
    break;
  case 4:
    uiHandler.processInput(Button.RIGHT);
    uiHandler.processInput(Button.DOWN);
    break;
  }

  if (!isNullOrUndefined(secondaryOptionSelect?.pokemonNo)) {
    await handleSecondaryOptionSelect(game, secondaryOptionSelect!.pokemonNo, secondaryOptionSelect!.optionNo);
  } else {
    uiHandler.processInput(Button.ACTION);
  }
}

async function handleSecondaryOptionSelect(game: GameManager, pokemonNo: number, optionNo?: number) {
  // Handle secondary option selections
  const partyUiHandler = game.scene.ui.handlers[Mode.PARTY] as PartyUiHandler;
  vi.spyOn(partyUiHandler, "show");

  const encounterUiHandler = game.scene.ui.getHandler<MysteryEncounterUiHandler>();
  encounterUiHandler.processInput(Button.ACTION);

  await vi.waitFor(() => expect(partyUiHandler.show).toHaveBeenCalled());

  for (let i = 1; i < pokemonNo; i++) {
    partyUiHandler.processInput(Button.DOWN);
  }

  // Open options on Pokemon
  partyUiHandler.processInput(Button.ACTION);
  // Click "Select" on Pokemon options
  partyUiHandler.processInput(Button.ACTION);

  // If there is a second choice to make after selecting a Pokemon
  if (!isNullOrUndefined(optionNo)) {
    // Wait for Summary menu to close and second options to spawn
    const secondOptionUiHandler = game.scene.ui.handlers[Mode.OPTION_SELECT] as OptionSelectUiHandler;
    vi.spyOn(secondOptionUiHandler, "show");
    await vi.waitFor(() => expect(secondOptionUiHandler.show).toHaveBeenCalled());

    // Navigate down to the correct option
    for (let i = 1; i < optionNo!; i++) {
      secondOptionUiHandler.processInput(Button.DOWN);
    }

    // Select the option
    secondOptionUiHandler.processInput(Button.ACTION);
  }
}

/**
 * For any MysteryEncounter that has a battle, can call this to skip battle and proceed to MysteryEncounterRewardsPhase
 * @param game
 * @param runRewardsPhase
 */
export async function skipBattleRunMysteryEncounterRewardsPhase(game: GameManager, runRewardsPhase: boolean = true) {
  game.scene.clearPhaseQueue();
  game.scene.clearPhaseQueueSplice();
  game.scene.getEnemyParty().forEach(p => {
    p.hp = 0;
    p.status = new Status(StatusEffect.FAINT);
    game.scene.field.remove(p);
  });
  game.scene.pushPhase(new VictoryPhase(game.scene, 0));
  game.phaseInterceptor.superEndPhase();
  game.setMode(Mode.MESSAGE);
  await game.phaseInterceptor.to(MysteryEncounterRewardsPhase, runRewardsPhase);
}
