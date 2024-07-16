import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { CommandPhase, TurnInitPhase } from "#app/phases";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { BattleStat } from "#app/data/battle-stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StockpilingTag } from "#app/data/battler-tags.js";
import { MoveResult, TurnMove } from "#app/field/pokemon.js";

describe("Moves - Stockpile", () => {
  describe("integration tests", () => {
    let phaserGame: Phaser.Game;
    let game: GameManager;

    beforeAll(() => {
      phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
    });

    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);

      vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);

      vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
      vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);

      vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(2000);
      vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.STOCKPILE, Moves.SPLASH]);
      vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    });

    it("Gains a stockpile stack and increases DEF and SPDEF by 1 on each use, fails at max stacks (3)", { timeout: 10000 }, async () => {
      await game.startBattle([Species.ABOMASNOW]);

      const user = game.scene.getPlayerPokemon();

      // Unfortunately, Stockpile stacks are not directly queryable (i.e. there is no pokemon.getStockpileStacks()),
      // we just have to know that they're implemented as a BattlerTag.

      expect(user.getTag(StockpilingTag)).toBeUndefined();
      expect(user.summonData.battleStats[BattleStat.DEF]).toBe(0);
      expect(user.summonData.battleStats[BattleStat.SPDEF]).toBe(0);

      // use Stockpile four times
      for (let i = 0; i < 4; i++) {
        if (i !== 0) {
          await game.phaseInterceptor.to(CommandPhase);
        }

        game.doAttack(getMovePosition(game.scene, 0, Moves.STOCKPILE));
        await game.phaseInterceptor.to(TurnInitPhase);

        const stockpilingTag = user.getTag(StockpilingTag);
        const def = user.summonData.battleStats[BattleStat.DEF];
        const spdef = user.summonData.battleStats[BattleStat.SPDEF];

        if (i < 3) { // first three uses should behave normally
          expect(def).toBe(i + 1);
          expect(spdef).toBe(i + 1);
          expect(stockpilingTag).toBeDefined();
          expect(stockpilingTag.stockpiledCount).toBe(i + 1);

        } else { // fourth should have failed
          expect(def).toBe(3);
          expect(spdef).toBe(3);
          expect(stockpilingTag).toBeDefined();
          expect(stockpilingTag.stockpiledCount).toBe(3);
          expect(user.getMoveHistory().at(-1)).toMatchObject<TurnMove>({ result: MoveResult.FAIL, move: Moves.STOCKPILE });
        }
      }
    });

    it("Gains a stockpile stack even if DEF and SPDEF are at +6", { timeout: 10000 }, async () => {
      await game.startBattle([Species.ABOMASNOW]);

      const user = game.scene.getPlayerPokemon();

      user.summonData.battleStats[BattleStat.DEF] = 6;
      user.summonData.battleStats[BattleStat.SPDEF] = 6;

      expect(user.getTag(StockpilingTag)).toBeUndefined();
      expect(user.summonData.battleStats[BattleStat.DEF]).toBe(6);
      expect(user.summonData.battleStats[BattleStat.SPDEF]).toBe(6);

      game.doAttack(getMovePosition(game.scene, 0, Moves.STOCKPILE));
      await game.phaseInterceptor.to(TurnInitPhase);

      const stockpilingTag = user.getTag(StockpilingTag);
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(1);
      expect(user.summonData.battleStats[BattleStat.DEF]).toBe(6);
      expect(user.summonData.battleStats[BattleStat.SPDEF]).toBe(6);

      // do it again, just for good measure
      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 0, Moves.STOCKPILE));
      await game.phaseInterceptor.to(TurnInitPhase);

      const stockpilingTagAgain = user.getTag(StockpilingTag);
      expect(stockpilingTagAgain).toBeDefined();
      expect(stockpilingTagAgain.stockpiledCount).toBe(2);
      expect(user.summonData.battleStats[BattleStat.DEF]).toBe(6);
      expect(user.summonData.battleStats[BattleStat.SPDEF]).toBe(6);
    });
  });
});
