import { Stat } from "#enums/stat";
import { StockpilingTag } from "#app/data/battler-tags";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import type { TurnMove } from "#app/field/pokemon";
import { MoveResult } from "#enums/move-result";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Swallow", () => {
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

    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.RATTATA)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyLevel(1000)
      .startingLevel(1000)
      .ability(AbilityId.BALL_FETCH);
  });

  it.each<{ stackCount: number; healPercent: number }>([
    { stackCount: 1, healPercent: 25 },
    { stackCount: 2, healPercent: 50 },
    { stackCount: 3, healPercent: 100 },
  ])(
    "should heal the user by $healPercent% when consuming $count stockpile stacks",
    async ({ stackCount, healPercent }) => {
      await game.classicMode.startBattle([SpeciesId.SWALOT]);

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

      expect(swalot.getHpRatio()).toBeCloseTo(healPercent / 100, 1);
      expect(swalot.getTag(StockpilingTag)).toBeUndefined();
    },
  );

  it("should fail without stacks", async () => {
    await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

    const pokemon = game.scene.getPlayerPokemon()!;

    const stockpilingTag = pokemon.getTag(StockpilingTag)!;
    expect(stockpilingTag).toBeUndefined();

    game.move.use(MoveId.SWALLOW);
    await game.toEndOfTurn();

    expect(pokemon.getLastXMoves()[0]).toMatchObject({
      move: MoveId.SWALLOW,
      result: MoveResult.FAIL,
      targets: [pokemon.getBattlerIndex()],
    });
  });

  describe("should reset stat stage boosts granted by stacks", () => {
    it("decreases stats based on stored values (both boosts equal)", async () => {
      await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

      const pokemon = game.scene.getPlayerPokemon()!;
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag)!;
      expect(stockpilingTag).toBeDefined();
      expect(pokemon.getStatStage(Stat.DEF)).toBe(1);
      expect(pokemon.getStatStage(Stat.SPDEF)).toBe(1);

      game.move.use(MoveId.SWALLOW);
      await game.toEndOfTurn();

      expect(pokemon.getLastXMoves()[0]).toMatchObject({
        move: MoveId.SWALLOW,
        result: MoveResult.SUCCESS,
        targets: [pokemon.getBattlerIndex()],
      });

      expect(pokemon.getStatStage(Stat.DEF)).toBe(0);
      expect(pokemon.getStatStage(Stat.SPDEF)).toBe(0);
    });

    it("lower stat stages based on stored values (different boosts)", async () => {
      await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

      const pokemon = game.scene.getPlayerPokemon()!;
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag)!;
      expect(stockpilingTag).toBeDefined();
      // for the sake of simplicity (and because other tests cover the setup), set boost amounts directly
      stockpilingTag.statChangeCounts = {
        [Stat.DEF]: -1,
        [Stat.SPDEF]: 2,
      };

      game.move.select(MoveId.SWALLOW);
      await game.toEndOfTurn();

      expect(pokemon.getLastXMoves()[0]).toMatchObject<TurnMove>({
        move: MoveId.SWALLOW,
        result: MoveResult.SUCCESS,
        targets: [pokemon.getBattlerIndex()],
      });

      expect(pokemon.getStatStage(Stat.DEF)).toBe(1);
      expect(pokemon.getStatStage(Stat.SPDEF)).toBe(-2);
    });
  });
});
