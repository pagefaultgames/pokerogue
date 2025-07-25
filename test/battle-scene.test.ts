import { LoadingScene } from "#app/loading-scene";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("BattleScene", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should remove LoadingScene on create", () => {
    // `BattleScene.create()` is called during the `new GameManager()` call
    expect(game.scene.scene.remove).toHaveBeenCalledWith(LoadingScene.KEY);
  });

  it("should also reset RNG on reset", () => {
    vi.spyOn(game.scene, "resetSeed");

    game.scene.reset();

    expect(game.scene.resetSeed).toHaveBeenCalled();
  });
});
