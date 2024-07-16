import BattleScene from "#app/battle-scene.js";
import { initWithStarters } from "./initWithStarters";
import { BallCommand } from "./BattlePhaseAPI";
import { AttemptCapturePhase, CommandPhase } from "#app/phases.js";
import { Phase } from "#app/phase.js";
import CommandUiHandler from "#app/ui/command-ui-handler.js";
import { Mode } from "#app/ui/ui.js";

/**
 * Automates the game
 *
 * This function serves as the main entry point for participants in the Pokerogue hackathon.
 * It will be called after the game is run and is responsible for setting up the game
 * with a specific set of starter Pokémon. Participants can modify this function to
 * interact with the game via the Pokerogue hackathon API and implement their own logic.
 *
 * @param game - The Phaser game instance.
 */
export const automateGame = async (game: Phaser.Game) => {
  // Initialise the game with three starter Pokémon.
  // Participants can change the species numbers to select different starters.
  const battleScene = await initWithStarters(game, [1, 155, 258]);

  phaseApi(battleScene);

  // Additional logic to interact with the game via the Pokerogue hackathon API can be added here.
  // For example, participants can use this space to automate player actions,
  // simulate gameplay scenarios, or manipulate game data for testing purposes.

  // Participants are encouraged to refer to the Pokerogue hackathon API documentation
  // for detailed information on available functions and their usage.
};

const phaseApi = (scene: BattleScene) => {
  const checkPhase = (currentPhase: Phase) => {
    if (currentPhase instanceof CommandPhase) {
      BallCommand(scene);
    } else {
      console.log("Some other phase not yet implemented");
      if (scene.ui.getHandler() instanceof CommandUiHandler) {
        scene.ui.getHandler().clear();
        scene.ui.setMode(Mode.MESSAGE);
      }
    }
  };

  // Add the checkPhase function as a listener for phase changes
  scene.addPhaseChangeListener(checkPhase);
};

export default automateGame;
