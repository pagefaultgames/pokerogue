import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "./utils/gameManager";

describe("Daily Mode", () => {
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

  it("should initialize properly", async () => {
    await game.dailyMode.runToSummon();

    const party = game.scene.getParty();
    expect(party).toHaveLength(3);
    party.forEach(pkm => {
      expect(pkm.level).toBe(20);
      expect(pkm.moveset.length).toBeGreaterThan(0);
    });
  });
});
