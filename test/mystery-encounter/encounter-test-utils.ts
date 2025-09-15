import { Status } from "#data/status-effect";
import { Button } from "#enums/buttons";
import { StatusEffect } from "#enums/status-effect";
import { UiMode } from "#enums/ui-mode";
// biome-ignore lint/performance/noNamespaceImport: Necessary for mocks
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import { MessagePhase } from "#phases/message-phase";
import { MysteryEncounterBattlePhase, MysteryEncounterRewardsPhase } from "#phases/mystery-encounter-phases";
import { VictoryPhase } from "#phases/victory-phase";
import type { GameManager } from "#test/test-utils/game-manager";
import type { MessageUiHandler } from "#ui/message-ui-handler";
import type { MysteryEncounterUiHandler } from "#ui/mystery-encounter-ui-handler";
import type { OptionSelectUiHandler } from "#ui/option-select-ui-handler";
import type { PartyUiHandler } from "#ui/party-ui-handler";
import { expect, vi } from "vitest";

/**
 * Runs a {@linkcode MysteryEncounter} to either the start of a battle, or to the {@linkcode MysteryEncounterRewardsPhase}, depending on the option selected
 * @param game
 * @param optionNo Human number, not index
 * @param secondaryOptionSelect
 * @param isBattle If selecting option should lead to battle, set to `true`
 */
export async function runMysteryEncounterToEnd(
  game: GameManager,
  optionNo: number,
  secondaryOptionSelect?: { pokemonNo: number; optionNo?: number },
  isBattle = false,
) {
  vi.spyOn(EncounterPhaseUtils, "selectPokemonForOption");
  await runSelectMysteryEncounterOption(game, optionNo, secondaryOptionSelect);

  // run the selected options phase
  game.onNextPrompt(
    "MysteryEncounterOptionSelectedPhase",
    UiMode.MESSAGE,
    () => {
      const uiHandler = game.scene.ui.getHandler<MysteryEncounterUiHandler>();
      uiHandler.processInput(Button.ACTION);
    },
    () => game.isCurrentPhase(MysteryEncounterBattlePhase) || game.isCurrentPhase(MysteryEncounterRewardsPhase),
  );

  if (!isBattle) {
    return await game.phaseInterceptor.to("MysteryEncounterRewardsPhase");
  }
  game.onNextPrompt(
    "CheckSwitchPhase",
    UiMode.CONFIRM,
    () => {
      game.setMode(UiMode.MESSAGE);
      game.endPhase();
    },
    () => game.isCurrentPhase("CommandPhase") || game.isCurrentPhase("TurnInitPhase"),
  );
  await game.toNextTurn();
}

export async function runSelectMysteryEncounterOption(
  game: GameManager,
  optionNo: number,
  secondaryOptionSelect?: { pokemonNo: number; optionNo?: number },
) {
  // Handle any eventual queued messages (e.g. weather phase, etc.)
  game.onNextPrompt(
    "MessagePhase",
    UiMode.MESSAGE,
    () => {
      const uiHandler = game.scene.ui.getHandler<MessageUiHandler>();
      uiHandler.processInput(Button.ACTION);
    },
    () => game.isCurrentPhase("MysteryEncounterOptionSelectedPhase", "CommandPhase", "TurnInitPhase"),
  );

  if (game.isCurrentPhase(MessagePhase)) {
    await game.phaseInterceptor.to("MessagePhase");
  }

  // dispose of intro messages
  game.onNextPrompt(
    "MysteryEncounterPhase",
    UiMode.MESSAGE,
    () => {
      const uiHandler = game.scene.ui.getHandler<MysteryEncounterUiHandler>();
      uiHandler.processInput(Button.ACTION);
    },
    () => game.isCurrentPhase("MysteryEncounterOptionSelectedPhase", "CommandPhase", "TurnInitPhase"),
  );

  await game.phaseInterceptor.to("MysteryEncounterPhase", true);

  // select the desired option
  const uiHandler = game.scene.ui.getHandler<MysteryEncounterUiHandler>();
  uiHandler.unblockInput(); // input are blocked by 1s to prevent accidental input. Tests need to handle that

  switch (optionNo) {
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
    default:
      // no movement needed. Default cursor position
      break;
  }

  if (secondaryOptionSelect?.pokemonNo != null) {
    await handleSecondaryOptionSelect(game, secondaryOptionSelect.pokemonNo, secondaryOptionSelect.optionNo);
  } else {
    uiHandler.processInput(Button.ACTION);
  }

async function handleSecondaryOptionSelect(game: GameManager, pokemonNo: number, optionNo?: number) {
  // Handle secondary option selections
  const partyUiHandler = game.scene.ui.handlers[UiMode.PARTY] as PartyUiHandler;
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
  if (optionNo != null) {
    // Wait for Summary menu to close and second options to spawn
    const secondOptionUiHandler = game.scene.ui.handlers[UiMode.OPTION_SELECT] as OptionSelectUiHandler;
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
 * For any {@linkcode MysteryEncounter} that has a battle, can call this to skip battle and proceed to {@linkcode MysteryEncounterRewardsPhase}
 * @param game
 * @param runRewardsPhase
 */
export async function skipBattleRunMysteryEncounterRewardsPhase(game: GameManager, runRewardsPhase = true) {
  game.scene.phaseManager.clearPhaseQueue();
  game.scene.phaseManager.clearPhaseQueueSplice();
  game.scene.getEnemyParty().forEach(p => {
    p.hp = 0;
    p.status = new Status(StatusEffect.FAINT);
    game.scene.field.remove(p);
  });
  game.scene.phaseManager.pushPhase(new VictoryPhase(0));
  game.endPhase();
  game.setMode(UiMode.MESSAGE);
  await game.phaseInterceptor.to("MysteryEncounterRewardsPhase", runRewardsPhase);
}
