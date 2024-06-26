import { afterEach, beforeAll, beforeEach, describe, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Moves } from "#enums/moves";

describe("Moves - Dragon Rage", () => {
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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.DRAGON_RAGE]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });

  it("ignores weaknesses", async () => {
  });

  it("ignores resistances", async () => {
  });

  it("ignores stat changes", async () => {
  });

  it("ignores enemy damage boost", async () => {
  });

  it("ignores enemy damage reduction", async () => {
  });

  it("ignores damage reduction from multi lens, but still hits multiple times", async () => {
  });

  it("ignores stab", async () => {
  });

  it("ignores criticals", async () => {
  });

  it("ignores damage modification from abilities such as ice scales", async () => {
  });
});
