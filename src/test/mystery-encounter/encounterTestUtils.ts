import { Button } from "#app/enums/buttons";
import { CommandPhase, MessagePhase, VictoryPhase } from "#app/phases";
import { MysteryEncounterPhase, MysteryEncounterRewardsPhase } from "#app/phases/mystery-encounter-phases";
import MysteryEncounterUiHandler from "#app/ui/mystery-encounter-ui-handler";
import { Mode } from "#app/ui/ui";
import GameManager from "../utils/gameManager";
import MessageUiHandler from "#app/ui/message-ui-handler";
import { Status, StatusEffect } from "#app/data/status-effect";

/**
 * Runs a MysteryEncounter to either the start of a battle, or to the MysteryEncounterRewardsPhase, depending on the option selected
 * @param game
 * @param optionNo - human number, not index
 * @param isBattle - if selecting option should lead to battle, set to true
 */
export async function runSelectMysteryEncounterOption(game: GameManager, optionNo: number, isBattle: boolean = false) {
  // Handle any eventual queued messages (e.g. weather phase, etc.)
  game.onNextPrompt("MessagePhase", Mode.MESSAGE, () => {
    const uiHandler = game.scene.ui.getHandler<MessageUiHandler>();
    uiHandler.processInput(Button.ACTION);
  });

  if (game.isCurrentPhase(MessagePhase)) {
    await game.phaseInterceptor.run(MessagePhase);
  }

  // dispose of intro messages
  game.onNextPrompt("MysteryEncounterPhase", Mode.MESSAGE, () => {
    const uiHandler = game.scene.ui.getHandler<MysteryEncounterUiHandler>();
    uiHandler.processInput(Button.ACTION);
  });

  await game.phaseInterceptor.to(MysteryEncounterPhase, true);

  // select the desired option
  const uiHandler = game.scene.ui.getHandler<MysteryEncounterUiHandler>();
  uiHandler.unblockInput(); // input are blocked by 1s to prevent accidental input. Tests need to handle that

  switch (optionNo) {
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

  uiHandler.processInput(Button.ACTION);

  // run the selected options phase
  game.onNextPrompt("MysteryEncounterOptionSelectedPhase", Mode.MESSAGE, () => {
    const uiHandler = game.scene.ui.getHandler<MysteryEncounterUiHandler>();
    uiHandler.processInput(Button.ACTION);
  });

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

  if (isBattle) {
    await game.phaseInterceptor.to(CommandPhase);
  } else {
    await game.phaseInterceptor.to(MysteryEncounterRewardsPhase);
  }
}

/**
 * For any MysteryEncounter that has a battle, can call this to skip battle and proceed to MysteryEncounterRewardsPhase
 * @param game
 */
export async function skipBattleRunMysteryEncounterRewardsPhase(game: GameManager) {
  game.scene.clearPhaseQueue();
  game.scene.clearPhaseQueueSplice();
  game.scene.getEnemyParty().forEach(p => {
    p.hp = 0;
    p.status = new Status(StatusEffect.FAINT);
    game.scene.field.remove(p);
  });
  game.scene.pushPhase(new VictoryPhase(game.scene, 0));
  game.phaseInterceptor.superEndPhase();
  await game.phaseInterceptor.to(MysteryEncounterRewardsPhase, true);
}
