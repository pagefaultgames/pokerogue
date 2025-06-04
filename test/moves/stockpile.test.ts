import { Stat } from "#enums/stat";
import { StockpilingTag } from "#app/data/battler-tags";
import type { TurnMove } from "#app/field/pokemon";
import { MoveResult } from "#app/field/pokemon";
import { CommandPhase } from "#app/phases/command-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
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

      game.override.battleStyle("single");

      game.override.enemySpecies(SpeciesId.RATTATA);
      game.override.enemyMoveset(MoveId.SPLASH);
      game.override.enemyAbility(AbilityId.NONE);

      game.override.startingLevel(2000);
      game.override.moveset([MoveId.STOCKPILE, MoveId.SPLASH]);
      game.override.ability(AbilityId.NONE);
    });

    it("gains a stockpile stack and raises user's DEF and SPDEF stat stages by 1 on each use, fails at max stacks (3)", async () => {
      await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

      const user = game.scene.getPlayerPokemon()!;

      // Unfortunately, Stockpile stacks are not directly queryable (i.e. there is no pokemon.getStockpileStacks()),
      // we just have to know that they're implemented as a BattlerTag.

      expect(user.getTag(StockpilingTag)).toBeUndefined();
      expect(user.getStatStage(Stat.DEF)).toBe(0);
      expect(user.getStatStage(Stat.SPDEF)).toBe(0);

      // use Stockpile four times
      for (let i = 0; i < 4; i++) {
        if (i !== 0) {
          await game.phaseInterceptor.to(CommandPhase);
        }

        game.move.select(MoveId.STOCKPILE);
        await game.phaseInterceptor.to(TurnInitPhase);

        const stockpilingTag = user.getTag(StockpilingTag)!;

        if (i < 3) {
          // first three uses should behave normally
          expect(user.getStatStage(Stat.DEF)).toBe(i + 1);
          expect(user.getStatStage(Stat.SPDEF)).toBe(i + 1);
          expect(stockpilingTag).toBeDefined();
          expect(stockpilingTag.stockpiledCount).toBe(i + 1);
        } else {
          // fourth should have failed
          expect(user.getStatStage(Stat.DEF)).toBe(3);
          expect(user.getStatStage(Stat.SPDEF)).toBe(3);
          expect(stockpilingTag).toBeDefined();
          expect(stockpilingTag.stockpiledCount).toBe(3);
          expect(user.getMoveHistory().at(-1)).toMatchObject<TurnMove>({
            result: MoveResult.FAIL,
            move: MoveId.STOCKPILE,
            targets: [user.getBattlerIndex()],
          });
        }
      }
    });

    it("gains a stockpile stack even if user's DEF and SPDEF stat stages are at +6", async () => {
      await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

      const user = game.scene.getPlayerPokemon()!;

      user.setStatStage(Stat.DEF, 6);
      user.setStatStage(Stat.SPDEF, 6);

      expect(user.getTag(StockpilingTag)).toBeUndefined();
      expect(user.getStatStage(Stat.DEF)).toBe(6);
      expect(user.getStatStage(Stat.SPDEF)).toBe(6);

      game.move.select(MoveId.STOCKPILE);
      await game.phaseInterceptor.to(TurnInitPhase);

      const stockpilingTag = user.getTag(StockpilingTag)!;
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(1);
      expect(user.getStatStage(Stat.DEF)).toBe(6);
      expect(user.getStatStage(Stat.SPDEF)).toBe(6);

      // do it again, just for good measure
      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(MoveId.STOCKPILE);
      await game.phaseInterceptor.to(TurnInitPhase);

      const stockpilingTagAgain = user.getTag(StockpilingTag)!;
      expect(stockpilingTagAgain).toBeDefined();
      expect(stockpilingTagAgain.stockpiledCount).toBe(2);
      expect(user.getStatStage(Stat.DEF)).toBe(6);
      expect(user.getStatStage(Stat.SPDEF)).toBe(6);
    });
  });
});
