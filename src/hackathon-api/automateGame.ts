import { initWithStarters } from "./initWithStarters";

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
export const automateGame = (game: Phaser.Game) => {
  // Initialise the game with three starter Pokémon.
  // Participants can change the species numbers to select different starters.
  initWithStarters(game, [1, 155, 258]);

  // Additional logic to interact with the game via the Pokerogue hackathon API can be added here.
  // For example, participants can use this space to automate player actions,
  // simulate gameplay scenarios, or manipulate game data for testing purposes.

  // Participants are encouraged to refer to the Pokerogue hackathon API documentation
  // for detailed information on available functions and their usage.
};

export default automateGame;
