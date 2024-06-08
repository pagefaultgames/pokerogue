import {afterEach, beforeAll, beforeEach, describe, it} from "vitest";
import GameManager from "#app/test/utils/gameManager";
import Phaser from "phaser";
import {LoginPhase} from "#app/phases";

describe("Test Battle Phase", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
  });

  it("should start phase", async() => {
    await game.phaseInterceptor.run(LoginPhase);
  });
});

