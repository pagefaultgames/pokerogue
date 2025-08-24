import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Test misc", () => {
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

  it("test fetch mock async", async () => {
    const spy = vi.fn();
    await fetch("https://localhost:8080/account/info")
      .then(response => {
        expect(response.status).toBe(200);
        expect(response.ok).toBe(true);
        return response.json();
      })
      .then(data => {
        spy(); // Call the spy function
        expect(data).toEqual({ username: "greenlamp", lastSessionSlot: 0 });
      });
    expect(spy).toHaveBeenCalled();
  });

  it("test fetch mock sync", async () => {
    const response = await fetch("https://localhost:8080/account/info");
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(data).toEqual({ username: "greenlamp", lastSessionSlot: 0 });
  });

  it("test apifetch mock sync", async () => {
    const data = await game.scene.cachedFetch("./battle-anims/splishy-splash.json");
    expect(data).toBeDefined();
  });
});
