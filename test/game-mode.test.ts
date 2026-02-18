import type { GameMode } from "#app/game-mode";
import { getGameMode } from "#app/game-mode";
import { GameModes } from "#enums/game-modes";
import { GameManager } from "#test/test-utils/game-manager";
import * as Utils from "#utils/common";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("game-mode", () => {
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

  describe("classic", () => {
    let classicGameMode: GameMode;
    beforeEach(() => {
      classicGameMode = getGameMode(GameModes.CLASSIC);
    });
    it("does NOT spawn trainers within 3 waves of fixed battle", () => {
      // set wave 16 to be a fixed trainer fight meaning wave 13-19 don't allow trainer spawns
      vi.spyOn(classicGameMode, "isFixedBattle").mockImplementation((n: number) => n === 16);
      vi.spyOn(game.scene.arena, "trainerChance", "get").mockReturnValue(1);
      vi.spyOn(Utils, "randSeedInt").mockReturnValue(0);
      expect(classicGameMode.isWaveTrainer(11)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(12)).toBeTruthy();
      expect(classicGameMode.isWaveTrainer(13)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(14)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(15)).toBeFalsy();
      // Wave 16 is a fixed trainer battle
      expect(classicGameMode.isWaveTrainer(17)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(18)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(19)).toBeFalsy();
    });
  });
});
