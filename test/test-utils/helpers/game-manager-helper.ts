import type GameManager from "../game-manager";

/**
 * Base class for defining all game helpers.
 */
export abstract class GameManagerHelper {
  protected readonly game: GameManager;

  constructor(game: GameManager) {
    this.game = game;
  }
}
