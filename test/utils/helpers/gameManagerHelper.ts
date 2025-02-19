import type GameManager from "#app/gameManager";

/**
 * Base class for defining all game helpers.
 */
export abstract class GameManagerHelper {
  protected readonly game: GameManager;

  constructor(game: GameManager) {
    this.game = game;
  }
}
