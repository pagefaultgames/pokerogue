import { Button } from "#app/enums/buttons";
import { MessagePhase } from "#app/phases";
import { MysteryEncounterOptionSelectedPhase, MysteryEncounterPhase, MysteryEncounterRewardsPhase } from "#app/phases/mystery-encounter-phase";
import MysteryEncounterUiHandler from "#app/ui/mystery-encounter-ui-handler";
import { Mode } from "#app/ui/ui";
import GameManager from "../utils/gameManager";

export async function runSelectMysteryEncounterOption(game: GameManager, optionNo: number) {
  if (game.isCurrentPhase(MessagePhase)) {
    // Handle eventual weather messages (e.g. a downpour started!)
    game.onNextPrompt("MessagePhase", Mode.MESSAGE, () => {
      const uiHandler = game.scene.ui.getHandler<MysteryEncounterUiHandler>();
      uiHandler.processInput(Button.ACTION);
    });
    await game.phaseInterceptor.run(MessagePhase);
  }

  // dispose of intro messages
  game.onNextPrompt("MysteryEncounterPhase", Mode.MESSAGE, () => {
    const uiHandler = game.scene.ui.getHandler<MysteryEncounterUiHandler>();
    uiHandler.processInput(Button.ACTION);
  });
  // select the desired option
  game.onNextPrompt("MysteryEncounterPhase", Mode.MYSTERY_ENCOUNTER, () => {
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
  });
  await game.phaseInterceptor.run(MysteryEncounterPhase);

  // run the selected options phase
  game.onNextPrompt("MysteryEncounterOptionSelectedPhase", Mode.MESSAGE, () => {
    const uiHandler = game.scene.ui.getHandler<MysteryEncounterUiHandler>();
    uiHandler.processInput(Button.ACTION);
  });
  await game.phaseInterceptor.run(MysteryEncounterOptionSelectedPhase);

  await game.phaseInterceptor.to(MysteryEncounterRewardsPhase);
}
