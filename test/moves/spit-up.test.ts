import { StockpilingTag } from "#data/battler-tags";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import type { Move } from "#moves/move";
import { MovePhase } from "#phases/move-phase";
import { TurnInitPhase } from "#phases/turn-init-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Spit Up", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let spitUp: Move;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    spitUp = allMoves[MoveId.SPIT_UP];
    game = new GameManager(phaserGame);

    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.RATTATA)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.NONE)
      .enemyLevel(2000)
      .moveset(MoveId.SPIT_UP)
      .ability(AbilityId.NONE);

    vi.spyOn(spitUp, "calculateBattlePower");
  });

  describe("consumes all stockpile stacks to deal damage (scaling with stacks)", () => {
    it("1 stack -> 100 power", async () => {
      const stacksToSetup = 1;
      const expectedPower = 100;

      await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

      const pokemon = game.field.getPlayerPokemon();
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag)!;
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(stacksToSetup);

      game.move.select(MoveId.SPIT_UP);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(spitUp.calculateBattlePower).toHaveBeenCalledOnce();
      expect(spitUp.calculateBattlePower).toHaveReturnedWith(expectedPower);

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });

    it("2 stacks -> 200 power", async () => {
      const stacksToSetup = 2;
      const expectedPower = 200;

      await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

      const pokemon = game.field.getPlayerPokemon();
      pokemon.addTag(BattlerTagType.STOCKPILING);
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag)!;
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(stacksToSetup);

      game.move.select(MoveId.SPIT_UP);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(spitUp.calculateBattlePower).toHaveBeenCalledOnce();
      expect(spitUp.calculateBattlePower).toHaveReturnedWith(expectedPower);

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });

    it("3 stacks -> 300 power", async () => {
      const stacksToSetup = 3;
      const expectedPower = 300;

      await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

      const pokemon = game.field.getPlayerPokemon();
      pokemon.addTag(BattlerTagType.STOCKPILING);
      pokemon.addTag(BattlerTagType.STOCKPILING);
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag)!;
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(stacksToSetup);

      game.move.select(MoveId.SPIT_UP);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(spitUp.calculateBattlePower).toHaveBeenCalledOnce();
      expect(spitUp.calculateBattlePower).toHaveReturnedWith(expectedPower);

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });
  });

  it("fails without stacks", async () => {
    await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

    const pokemon = game.field.getPlayerPokemon();

    const stockpilingTag = pokemon.getTag(StockpilingTag)!;
    expect(stockpilingTag).toBeUndefined();

    game.move.select(MoveId.SPIT_UP);
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(pokemon.getMoveHistory().at(-1)).toMatchObject({
      move: MoveId.SPIT_UP,
      result: MoveResult.FAIL,
      targets: [game.field.getEnemyPokemon().getBattlerIndex()],
    });

    expect(spitUp.calculateBattlePower).not.toHaveBeenCalled();
  });

  describe("restores stat boosts granted by stacks", () => {
    it("decreases stats based on stored values (both boosts equal)", async () => {
      await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

      const pokemon = game.field.getPlayerPokemon();
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag)!;
      expect(stockpilingTag).toBeDefined();

      game.move.select(MoveId.SPIT_UP);
      await game.phaseInterceptor.to(MovePhase);

      expect(pokemon.getStatStage(Stat.DEF)).toBe(1);
      expect(pokemon.getStatStage(Stat.SPDEF)).toBe(1);

      await game.phaseInterceptor.to(TurnInitPhase);

      expect(pokemon.getMoveHistory().at(-1)).toMatchObject({
        move: MoveId.SPIT_UP,
        result: MoveResult.SUCCESS,
        targets: [game.field.getEnemyPokemon().getBattlerIndex()],
      });

      expect(spitUp.calculateBattlePower).toHaveBeenCalledOnce();

      expect(pokemon.getStatStage(Stat.DEF)).toBe(0);
      expect(pokemon.getStatStage(Stat.SPDEF)).toBe(0);

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });

    it("decreases stats based on stored values (different boosts)", async () => {
      await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

      const pokemon = game.field.getPlayerPokemon();
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag)!;
      expect(stockpilingTag).toBeDefined();

      // for the sake of simplicity (and because other tests cover the setup), set boost amounts directly
      stockpilingTag.statChangeCounts = {
        [Stat.DEF]: -1,
        [Stat.SPDEF]: 2,
      };

      game.move.select(MoveId.SPIT_UP);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(pokemon.getMoveHistory().at(-1)).toMatchObject({
        move: MoveId.SPIT_UP,
        result: MoveResult.SUCCESS,
        targets: [game.field.getEnemyPokemon().getBattlerIndex()],
      });

      expect(spitUp.calculateBattlePower).toHaveBeenCalledOnce();

      expect(pokemon.getStatStage(Stat.DEF)).toBe(1);
      expect(pokemon.getStatStage(Stat.SPDEF)).toBe(-2);

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });
  });
});
