import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, describe, expect, test } from "vitest";

describe("clearScene", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    game = new GameManager(phaserGame);
    (game.scene.input.manager as any) ??= {
      canvas: {
        style: {
          cursor: "default",
        },
      },
    };
  });

  test("should run consecutive resets without leaking memory", async () => {
    const initialHeap = process.memoryUsage().heapUsed;

    for (let i = 0; i < 20; i++) {
      game.scene.reset(true);
    }

    const finalHeap = process.memoryUsage().heapUsed;
    const heapGrowthMB = (finalHeap - initialHeap) / (1024 * 1024);

    // Margin baseline is ~15mb
    expect(heapGrowthMB).toBeLessThan(30);
  }, 10000);
});
