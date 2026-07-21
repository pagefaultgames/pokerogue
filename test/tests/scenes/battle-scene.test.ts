import { LoadingScene } from "#app/loading-scene";
import { GameManager } from "#test/framework/game-manager";
import { beforeAll, beforeEach, describe, expect, it, test, vi } from "vitest";

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

  it("should remove LoadingScene on create", () => {
    // `BattleScene.create()` is called during the `new GameManager()` call
    expect(game.scene.scene.remove).toHaveBeenCalledWith(LoadingScene.KEY);
  });

  it("should also reset RNG on reset", () => {
    vi.spyOn(game.scene, "resetSeed");

    game.scene.reset();

    expect(game.scene.resetSeed).toHaveBeenCalled();
  });

  test("should run consecutive resets without leaking memory", async () => {
    global.gc?.();
    const initialHeap = process.memoryUsage().heapUsed;

    for (let i = 0; i < 20; i++) {
      game.scene.reset(true);
    }

    global.gc?.();
    const finalHeap = process.memoryUsage().heapUsed;
    const heapGrowthMB = (finalHeap - initialHeap) / (1024 * 1024);

    console.log(`Heap Growth: ${heapGrowthMB.toFixed(2)} MB`);
    // Margin baseline is ~15mb
    expect(heapGrowthMB).toBeLessThan(30);
  }, 10000);
});
