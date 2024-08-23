import { BattleStat } from "#app/data/battle-stat";
import { StockpilingTag } from "#app/data/battler-tags";
import { MoveResult, TurnMove } from "#app/field/pokemon";
import { CommandPhase } from "#app/phases/command-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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

      game.override.battleType("single");

      game.override.enemySpecies(Species.RATTATA);
      game.override.enemyMoveset(SPLASH_ONLY);
      game.override.enemyAbility(Abilities.NONE);

      game.override.startingLevel(2000);
      game.override.moveset([Moves.STOCKPILE, Moves.SPLASH]);
      game.override.ability(Abilities.NONE);
    });

    it("Gains a stockpile stack and increases DEF and SPDEF by 1 on each use, fails at max stacks (3)", { timeout: 10000 }, async () => {
      await game.startBattle([Species.ABOMASNOW]);

      const user = game.scene.getPlayerPokemon()!;

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

        game.move.select(Moves.STOCKPILE);
        await game.phaseInterceptor.to(TurnInitPhase);

        const stockpilingTag = user.getTag(StockpilingTag)!;
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

      const user = game.scene.getPlayerPokemon()!;

      user.summonData.battleStats[BattleStat.DEF] = 6;
      user.summonData.battleStats[BattleStat.SPDEF] = 6;

      expect(user.getTag(StockpilingTag)).toBeUndefined();
      expect(user.summonData.battleStats[BattleStat.DEF]).toBe(6);
      expect(user.summonData.battleStats[BattleStat.SPDEF]).toBe(6);

      game.move.select(Moves.STOCKPILE);
      await game.phaseInterceptor.to(TurnInitPhase);

      const stockpilingTag = user.getTag(StockpilingTag)!;
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(1);
      expect(user.summonData.battleStats[BattleStat.DEF]).toBe(6);
      expect(user.summonData.battleStats[BattleStat.SPDEF]).toBe(6);

      // do it again, just for good measure
      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.STOCKPILE);
      await game.phaseInterceptor.to(TurnInitPhase);

      const stockpilingTagAgain = user.getTag(StockpilingTag)!;
      expect(stockpilingTagAgain).toBeDefined();
      expect(stockpilingTagAgain.stockpiledCount).toBe(2);
      expect(user.summonData.battleStats[BattleStat.DEF]).toBe(6);
      expect(user.summonData.battleStats[BattleStat.SPDEF]).toBe(6);
    });
  });
});
