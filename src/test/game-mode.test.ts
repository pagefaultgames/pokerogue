import { GameMode, GameModes, getGameMode } from "#app/game-mode";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as Utils from "../utils";
import GameManager from "./utils/gameManager";
import { getPartyLuckValue } from "#app/modifier/modifier-type";
describe("game-mode", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });
  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.resetAllMocks();
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
      const { arena } = game.scene;
      /** set wave 16 to be a fixed trainer fight meaning wave 13-19 don't allow trainer spawns */
      vi.spyOn(classicGameMode, "isFixedBattle").mockImplementation(
        (n: number) => (n === 16 ? true : false)
      );
      vi.spyOn(arena, "getTrainerChance").mockReturnValue(1);
      vi.spyOn(Utils, "randSeedInt").mockReturnValue(0);
      expect(classicGameMode.isWaveTrainer(11, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(12, arena)).toBeTruthy();
      expect(classicGameMode.isWaveTrainer(13, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(14, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(15, arena)).toBeFalsy();
      // Wave 16 is a fixed trainer battle
      expect(classicGameMode.isWaveTrainer(17, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(18, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(19, arena)).toBeFalsy();
    });
  });
  //*
  //Need to figure out how to override my party members' luck to calculate this
  describe("Luck Check", async () => {
    let classicGameMode: GameMode;
    let dailyGameMode: GameMode;

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
      classicGameMode = getGameMode(GameModes.CLASSIC);
      dailyGameMode = getGameMode(GameModes.DAILY);
    });

    it("does not apply luck in Daily Runs", () => {
      game.override
        .shinyLevel(true, 2);
      const party = game.scene.getParty();
      const oldmode = game.scene.gameMode;
      game.scene.gameMode = classicGameMode!;
      expect(getPartyLuckValue(party)).toBe(3);
      game.scene.gameMode = dailyGameMode!;
      expect(getPartyLuckValue(party)).toBe(0);
      game.scene.gameMode = oldmode;
    });
  });
  //*/
});
