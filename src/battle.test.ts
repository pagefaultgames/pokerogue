import { expect, describe, it, beforeAll, vi, afterAll } from "vitest";
import Battle, { BattleType } from "./battle";
import { GameMode } from "./game-mode";
import Trainer from "./field/trainer";
import { BattleSpec } from "./enums/battle-spec";
import BattleScene from "./battle-scene";
import { TrainerType } from "./data/enums/trainer-type";

const NUM_TEST_RUNS = 10;

describe("battle", () => {
  beforeAll(() => {
    // Prevent errors
    vi.mock('./data/biomes', () => ({}));
    vi.mock('./form-change-phase', () => ({}));
    vi.mock('./data/move', () => ({
      initMoves: () => {}, 
    }));
    vi.mock("./field/trainer", () => ({
      default: vi.fn().mockImplementation(() => ({
        getPartyLevels: (_waveIndex: integer) => [1]
      })),
    }));
    vi.mock("./data/pokemon-forms", () => ({}));
    vi.mock("./data/pokemon-evolutions", () => ({}));
  });

  afterAll(() => {
    vi.clearAllMocks();
  });
  
  // private method but calls in constructor and updates battleSpec
  describe("initBattleSpec", () => {
    const trainer = new Trainer(new BattleScene(), TrainerType.ARTIST, 0); // 0 = TrainerVariant.DEFAULT

    it("has final boss as battleSpec when wave 200 and classic mode", () => {
        const battle = new Battle(new GameMode(1, { isClassic: true }), 200, BattleType.TRAINER, trainer, false);

        expect(battle.battleSpec).toBe(BattleSpec.FINAL_BOSS);
    });

    it("has default as battleSpec when not wave 200 and classic mode", () => {
        const battle = new Battle(new GameMode(1, { isClassic: true }), 190, BattleType.TRAINER, trainer, false);

        expect(battle.battleSpec).toBe(BattleSpec.DEFAULT);
    });

    it("has default as battleSpec when not classic mode", () => {
        const battle = new Battle(new GameMode(1, { isClassic: false }), 190, BattleType.TRAINER, trainer, false);
        const battle2 = new Battle(new GameMode(1, { isClassic: false }), 200, BattleType.TRAINER, trainer, false);

        expect(battle.battleSpec).toBe(BattleSpec.DEFAULT);
        expect(battle2.battleSpec).toBe(BattleSpec.DEFAULT);
    });
  });

  // private method but calls in constructor and updates enemyLevels for battleType !== BattleType.TRAINER
  describe("getLevelForWave", () => {
    const trainer = new Trainer(new BattleScene(), TrainerType.ARTIST, 0); // 0 = TrainerVariant.DEFAULT

    it("has 2 or 3 as enemyLevels when first wave and single battle", () => {
        for (let i = 0; i < NUM_TEST_RUNS; i++) {
          const battle = new Battle(new GameMode(1, { isClassic: true }), 1, BattleType.WILD, trainer, false);
          
          expect(battle.enemyLevels.length).toBe(1);
          expect([2, 3]).toContain(battle.enemyLevels[0]);
        }
    });

    it("has 2 or 3 x2 as enemyLevels when first wave and double battle", () => {
      for (let i = 0; i < NUM_TEST_RUNS; i++) {
        const battle = new Battle(new GameMode(1, { isClassic: true }), 1, BattleType.WILD, trainer, true);

        expect(battle.enemyLevels.length).toBe(2);
        expect(battle.enemyLevels.every(level => [2, 3].includes(level))).toBeTruthy();
      }
    });

    it("has 164<=x<=184 as enemyLevels when 199th wave and single battle", () => {
      for (let i = 0; i < NUM_TEST_RUNS; i++) {
        const battle = new Battle(new GameMode(1, { isClassic: true }), 199, BattleType.WILD, trainer, false);
        
        expect(battle.enemyLevels.length).toBe(1);
        expect(battle.enemyLevels[0] >= 164 && battle.enemyLevels[0] <= 184).toBeTruthy();
      }
    });

    it("has 164<=x<=184 x2 as enemyLevels when 199th wave and double battle", () => {
      for (let i = 0; i < NUM_TEST_RUNS; i++) {
        const battle = new Battle(new GameMode(1, { isClassic: true }), 199, BattleType.WILD, trainer, true);

        expect(battle.enemyLevels.length).toBe(2);
        expect(battle.enemyLevels.every(level => level >= 164 && level <= 184)).toBeTruthy();
      }
    });

    it("has 6<=x<=8 as enemyLevels when 10th wave and single battle", () => {
      for (let i = 0; i < NUM_TEST_RUNS; i++) {
        const battle = new Battle(new GameMode(1, { isClassic: true }), 10, BattleType.WILD, trainer, false);
        
        expect(battle.enemyLevels.length).toBe(1);
        expect(battle.enemyLevels[0] >= 6 && battle.enemyLevels[0] <= 8).toBeTruthy();
      }
    });

    it("has 6<=x<=8 x2 as enemyLevels when 10th wave and double battle", () => {
      for (let i = 0; i < NUM_TEST_RUNS; i++) {
        const battle = new Battle(new GameMode(1, { isClassic: true }), 10, BattleType.WILD, trainer, true);
        
        expect(battle.enemyLevels.length).toBe(2);
        expect(battle.enemyLevels.every(level => level >= 6 && level <= 8)).toBeTruthy();
      }
    });

    it("has 165<=x<=203 as enemyLevels when 190th wave and single battle", () => {
      for (let i = 0; i < NUM_TEST_RUNS; i++) {
        const battle = new Battle(new GameMode(1, { isClassic: true }), 190, BattleType.WILD, trainer, false);
        
        expect(battle.enemyLevels.length).toBe(1);
        expect(battle.enemyLevels[0] >= 165 && battle.enemyLevels[0] <= 203).toBeTruthy();
      }
    });

    it("has 165<=x<=203 x2 as enemyLevels when 190th wave and double battle", () => {
      for (let i = 0; i < NUM_TEST_RUNS; i++) {
        const battle = new Battle(new GameMode(1, { isClassic: true }), 190, BattleType.WILD, trainer, true);
        
        expect(battle.enemyLevels.length).toBe(2);
        expect(battle.enemyLevels.every(level => level >= 165 && level <= 203)).toBeTruthy();
      }
    });

    it("has 200 as enemyLevels when 200th wave, final boss", () => {
      for (let i = 0; i < NUM_TEST_RUNS; i++) {
        const battle = new Battle(new GameMode(1, { isClassic: true }), 200, BattleType.WILD, trainer, false);
        
        expect(battle.enemyLevels).toStrictEqual([200]);
      }
    });

    it("has 275 as enemyLevels when 250th wave", () => {
      for (let i = 0; i < NUM_TEST_RUNS; i++) {
        const battle = new Battle(new GameMode(1, { isClassic: true }), 250, BattleType.WILD, trainer, false);
        
        expect(battle.enemyLevels).toStrictEqual([275]);
      }
    });

    it("has 800 as enemyLevels when 500th wave", () => {
      for (let i = 0; i < NUM_TEST_RUNS; i++) {
        const battle = new Battle(new GameMode(1, { isClassic: true }), 500, BattleType.WILD, trainer, false);
        
        expect(battle.enemyLevels).toStrictEqual([800]);
      }
    });
  });
});
