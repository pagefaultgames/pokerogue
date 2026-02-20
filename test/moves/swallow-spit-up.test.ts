import { StockpilingTag } from "#app/data/battler-tags";
import { allMoves } from "#app/data/data-lists";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

describe("Moves - Swallow & Spit Up - ", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.RATTATA)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyLevel(100)
      .startingLevel(100)
      .ability(AbilityId.BALL_FETCH);
  });

  describe("Swallow", () => {
    it.each<{ stackCount: number; healPercent: number }>([
      { stackCount: 1, healPercent: 25 },
      { stackCount: 2, healPercent: 50 },
      { stackCount: 3, healPercent: 100 },
    ])("should heal the user by $healPercent% max HP when consuming $stackCount stockpile stacks", async ({
      stackCount,
      healPercent,
    }) => {
      await game.classicMode.startBattle(SpeciesId.SWALOT);

      const swalot = game.field.getPlayerPokemon();
      swalot.hp = 1;

      for (let i = 0; i < stackCount; i++) {
        swalot.addTag(BattlerTagType.STOCKPILING);
      }

      const stockpilingTag = swalot.getTag(StockpilingTag)!;
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(stackCount);

      game.move.use(MoveId.SWALLOW);
      await game.toEndOfTurn();

      if (healPercent === 100) {
        expect(swalot).toHaveFullHp();
      } else {
        expect(swalot).toHaveHp((swalot.getMaxHp() * healPercent) / 100 + 1, { rounding: "half up" });
      }
      expect(swalot).not.toHaveBattlerTag(BattlerTagType.STOCKPILING);
    });

    it("should fail without Stockpile stacks", async () => {
      await game.classicMode.startBattle(SpeciesId.ABOMASNOW);

      const player = game.field.getPlayerPokemon();
      player.hp = 1;

      expect(player).not.toHaveBattlerTag(BattlerTagType.STOCKPILING);

      game.move.use(MoveId.SWALLOW);
      await game.toEndOfTurn();

      expect(player).toHaveUsedMove({
        move: MoveId.SWALLOW,
        result: MoveResult.FAIL,
      });
    });

    it("should count as a success and consume stacks despite displaying message at full HP", async () => {
      await game.classicMode.startBattle(SpeciesId.SWALOT);

      const swalot = game.field.getPlayerPokemon();
      swalot.addTag(BattlerTagType.STOCKPILING);
      expect(swalot).toHaveBattlerTag(BattlerTagType.STOCKPILING);

      game.move.use(MoveId.SWALLOW);
      await game.toEndOfTurn();

      // Swallow counted as a "success" as its other effect (removing Stockpile) _did_ work
      expect(swalot).toHaveUsedMove({
        move: MoveId.SWALLOW,
        result: MoveResult.SUCCESS,
      });
      expect(game.textInterceptor.logs).toContain(
        i18next.t("battle:hpIsFull", {
          pokemonName: getPokemonNameWithAffix(swalot),
        }),
      );
      expect(swalot).not.toHaveBattlerTag(BattlerTagType.STOCKPILING);
    });
  });

  describe("Spit Up", () => {
    let spitUpSpy: MockInstance;

    beforeEach(() => {
      spitUpSpy = vi.spyOn(allMoves[MoveId.SPIT_UP], "calculateBattlePower");
    });

    it.each<{ stackCount: number; power: number }>([
      { stackCount: 1, power: 100 },
      { stackCount: 2, power: 200 },
      { stackCount: 3, power: 300 },
    ])("should have $power base power when consuming $stackCount stockpile stacks", async ({ stackCount, power }) => {
      await game.classicMode.startBattle(SpeciesId.SWALOT);

      const swalot = game.field.getPlayerPokemon();

      for (let i = 0; i < stackCount; i++) {
        swalot.addTag(BattlerTagType.STOCKPILING);
      }

      const stockpilingTag = swalot.getTag(StockpilingTag)!;
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(stackCount);

      game.move.use(MoveId.SPIT_UP);
      await game.toEndOfTurn();

      expect(spitUpSpy).toHaveReturnedWith(power);
      expect(swalot).not.toHaveBattlerTag(BattlerTagType.STOCKPILING);
    });

    it("should fail without Stockpile stacks", async () => {
      await game.classicMode.startBattle(SpeciesId.ABOMASNOW);

      const player = game.field.getPlayerPokemon();

      expect(player).not.toHaveBattlerTag(BattlerTagType.STOCKPILING);

      game.move.use(MoveId.SPIT_UP);
      await game.toEndOfTurn();

      expect(player).toHaveUsedMove({
        move: MoveId.SPIT_UP,
        result: MoveResult.FAIL,
      });
    });
  });

  describe("Stockpile stack removal", () => {
    it("should undo stat boosts when losing stacks", async () => {
      await game.classicMode.startBattle(SpeciesId.SWALOT);

      const player = game.field.getPlayerPokemon();

      game.move.use(MoveId.STOCKPILE);
      await game.toNextTurn();

      expect(player).toHaveBattlerTag(BattlerTagType.STOCKPILING);
      expect(player).toHaveStatStage(Stat.DEF, 1);
      expect(player).toHaveStatStage(Stat.SPDEF, 1);

      // remove the prior stat boost phases from the log
      game.phaseInterceptor.clearLogs();

      game.move.use(MoveId.SWALLOW);
      await game.move.forceEnemyMove(MoveId.ACID_SPRAY);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toEndOfTurn();

      expect(player).toHaveStatStage(Stat.DEF, 0);
      expect(player).toHaveStatStage(Stat.SPDEF, -2); // +1 --> -1 --> -2
      expect(game.phaseInterceptor.log.filter(l => l === "StatStageChangePhase")).toHaveLength(3);
    });

    it("should double stat drops when gaining Simple", async () => {
      await game.classicMode.startBattle(SpeciesId.ABOMASNOW);

      const player = game.field.getPlayerPokemon();

      game.move.use(MoveId.STOCKPILE);
      await game.move.forceEnemyMove(MoveId.SIMPLE_BEAM);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toNextTurn();

      expect(player).toHaveStatStage(Stat.DEF, 1);
      expect(player).toHaveStatStage(Stat.SPDEF, 1);
      expect(player.hasAbility(AbilityId.SIMPLE)).toBe(true);

      game.move.use(MoveId.SWALLOW);
      await game.move.forceEnemyMove(MoveId.SPLASH);
      await game.toEndOfTurn();

      // should have fallen by 2 stages from Simple
      expect(player).toHaveStatStage(Stat.DEF, -1);
      expect(player).toHaveStatStage(Stat.SPDEF, -1);
    });

    it("should invert stat drops when gaining Contrary", async () => {
      game.override.enemyAbility(AbilityId.CONTRARY);
      await game.classicMode.startBattle(SpeciesId.ABOMASNOW);

      const player = game.field.getPlayerPokemon();

      game.move.use(MoveId.STOCKPILE);
      await game.move.forceEnemyMove(MoveId.ENTRAINMENT);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toEndOfTurn();

      expect(player).toHaveStatStage(Stat.DEF, 1);
      expect(player).toHaveStatStage(Stat.SPDEF, 1);
      expect(player.hasAbility(AbilityId.CONTRARY)).toBe(true);

      game.move.use(MoveId.SPIT_UP);
      await game.move.forceEnemyMove(MoveId.SPLASH);
      await game.toEndOfTurn();

      // should have risen 1 stage from Contrary
      expect(player).toHaveStatStage(Stat.DEF, 2);
      expect(player).toHaveStatStage(Stat.SPDEF, 2);
    });
  });
});
