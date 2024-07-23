import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { MovePhase, TurnInitPhase } from "#app/phases";
import { BattleStat } from "#app/data/battle-stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StockpilingTag } from "#app/data/battler-tags.js";
import { MoveResult, TurnMove } from "#app/field/pokemon.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { allMoves } from "#app/data/move.js";

describe("Moves - Spit Up", () => {
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

    vi.spyOn(overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(2000);

    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPIT_UP, Moves.SPIT_UP, Moves.SPIT_UP, Moves.SPIT_UP]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
  });

  describe("consumes all stockpile stacks to deal damage (scaling with stacks)", () => {
    it("1 stack -> 100 power", { timeout: 10000 }, async () => {
      const stacksToSetup = 1;
      const expectedPower = 100;

      await game.startBattle([Species.ABOMASNOW]);

      const pokemon = game.scene.getPlayerPokemon();
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag);
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(stacksToSetup);

      vi.spyOn(allMoves[Moves.SPIT_UP], "calculateBattlePower");

      game.doAttack(0);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(allMoves[Moves.SPIT_UP].calculateBattlePower).toHaveBeenCalledOnce();
      expect(allMoves[Moves.SPIT_UP].calculateBattlePower).toHaveReturnedWith(expectedPower);

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });

    it("2 stacks -> 200 power", { timeout: 10000 }, async () => {
      const stacksToSetup = 2;
      const expectedPower = 200;

      await game.startBattle([Species.ABOMASNOW]);

      const pokemon = game.scene.getPlayerPokemon();
      pokemon.addTag(BattlerTagType.STOCKPILING);
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag);
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(stacksToSetup);

      vi.spyOn(allMoves[Moves.SPIT_UP], "calculateBattlePower");

      game.doAttack(0);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(allMoves[Moves.SPIT_UP].calculateBattlePower).toHaveBeenCalledOnce();
      expect(allMoves[Moves.SPIT_UP].calculateBattlePower).toHaveReturnedWith(expectedPower);

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });

    it("3 stacks -> 300 power", { timeout: 10000 }, async () => {
      const stacksToSetup = 3;
      const expectedPower = 300;

      await game.startBattle([Species.ABOMASNOW]);

      const pokemon = game.scene.getPlayerPokemon();
      pokemon.addTag(BattlerTagType.STOCKPILING);
      pokemon.addTag(BattlerTagType.STOCKPILING);
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag);
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(stacksToSetup);

      vi.spyOn(allMoves[Moves.SPIT_UP], "calculateBattlePower");

      game.doAttack(0);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(allMoves[Moves.SPIT_UP].calculateBattlePower).toHaveBeenCalledOnce();
      expect(allMoves[Moves.SPIT_UP].calculateBattlePower).toHaveReturnedWith(expectedPower);

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });
  });

  it("fails without stacks", { timeout: 10000 }, async () => {
    await game.startBattle([Species.ABOMASNOW]);

    const pokemon = game.scene.getPlayerPokemon();

    const stockpilingTag = pokemon.getTag(StockpilingTag);
    expect(stockpilingTag).toBeUndefined();

    vi.spyOn(allMoves[Moves.SPIT_UP], "calculateBattlePower");

    game.doAttack(0);
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(pokemon.getMoveHistory().at(-1)).toMatchObject<TurnMove>({ move: Moves.SPIT_UP, result: MoveResult.FAIL });

    expect(allMoves[Moves.SPIT_UP].calculateBattlePower).not.toHaveBeenCalled();
  });

  describe("restores stat boosts granted by stacks", () => {
    it("decreases stats based on stored values (both boosts equal)", { timeout: 10000 }, async () => {
      await game.startBattle([Species.ABOMASNOW]);

      const pokemon = game.scene.getPlayerPokemon();
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag);
      expect(stockpilingTag).toBeDefined();

      vi.spyOn(allMoves[Moves.SPIT_UP], "calculateBattlePower");

      game.doAttack(0);
      await game.phaseInterceptor.to(MovePhase);

      expect(pokemon.summonData.battleStats[BattleStat.DEF]).toBe(1);
      expect(pokemon.summonData.battleStats[BattleStat.SPDEF]).toBe(1);

      await game.phaseInterceptor.to(TurnInitPhase);

      expect(pokemon.getMoveHistory().at(-1)).toMatchObject<TurnMove>({ move: Moves.SPIT_UP, result: MoveResult.SUCCESS });

      expect(allMoves[Moves.SPIT_UP].calculateBattlePower).toHaveBeenCalledOnce();

      expect(pokemon.summonData.battleStats[BattleStat.DEF]).toBe(0);
      expect(pokemon.summonData.battleStats[BattleStat.SPDEF]).toBe(0);

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });

    it("decreases stats based on stored values (different boosts)", { timeout: 10000 }, async () => {
      await game.startBattle([Species.ABOMASNOW]);

      const pokemon = game.scene.getPlayerPokemon();
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag);
      expect(stockpilingTag).toBeDefined();

      // for the sake of simplicity (and because other tests cover the setup), set boost amounts directly
      stockpilingTag.statChangeCounts = {
        [BattleStat.DEF]: -1,
        [BattleStat.SPDEF]: 2,
      };

      expect(stockpilingTag.statChangeCounts).toMatchObject({
        [BattleStat.DEF]: -1,
        [BattleStat.SPDEF]: 2,
      });

      vi.spyOn(allMoves[Moves.SPIT_UP], "calculateBattlePower");

      game.doAttack(0);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(pokemon.getMoveHistory().at(-1)).toMatchObject<TurnMove>({ move: Moves.SPIT_UP, result: MoveResult.SUCCESS });

      expect(allMoves[Moves.SPIT_UP].calculateBattlePower).toHaveBeenCalledOnce();

      expect(pokemon.summonData.battleStats[BattleStat.DEF]).toBe(1);
      expect(pokemon.summonData.battleStats[BattleStat.SPDEF]).toBe(-2);

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });
  });
});
