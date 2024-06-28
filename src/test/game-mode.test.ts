import { GameMode, GameModes, getGameMode } from "#app/game-mode.js";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import GameManager from "./utils/gameManager";

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
      /** set wave 10 to be a trainer fight meaning wave 7-13 don't allow trainer spawns */
      vi.spyOn(classicGameMode, "isFixedBattle").mockImplementation(
        (n: number) => (n === 10 ? true : false)
      );
      vi.spyOn(arena, "getTrainerChance").mockReturnValue(0);

      expect(classicGameMode.isWaveTrainer(5, arena)).not.toBeTruthy(); // just to be sure..
      expect(classicGameMode.isWaveTrainer(6, arena)).not.toBeTruthy();
      expect(classicGameMode.isWaveTrainer(7, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(8, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(9, arena)).toBeFalsy();
      // 10 is fixed battle
      expect(classicGameMode.isWaveTrainer(11, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(12, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(13, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(14, arena)).not.toBeTruthy();
      expect(classicGameMode.isWaveTrainer(15, arena)).not.toBeTruthy(); // just to be sure...
    });
  });
});
