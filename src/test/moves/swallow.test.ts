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

    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(2000);

    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SWALLOW, Moves.SWALLOW, Moves.SWALLOW, Moves.SWALLOW]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
  });

  describe("consumes all stockpile stacks to heal (scaling with stacks)", () => {
    it("1 stack -> 25% heal", { timeout: 10000 }, async () => {
      const stacksToSetup = 1;
      const expectedHeal = 25;

      await game.startBattle([Species.ABOMASNOW]);

      const pokemon = game.scene.getPlayerPokemon();
      vi.spyOn(pokemon, "getMaxHp").mockReturnValue(100);
      pokemon["hp"] = 1;

      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag);
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(stacksToSetup);

      vi.spyOn(pokemon, "heal");

      game.doAttack(0);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(pokemon.heal).toHaveBeenCalledOnce();
      expect(pokemon.heal).toHaveReturnedWith(expectedHeal);

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });

    it("2 stacks -> 50% heal", { timeout: 10000 }, async () => {
      const stacksToSetup = 2;
      const expectedHeal = 50;

      await game.startBattle([Species.ABOMASNOW]);

      const pokemon = game.scene.getPlayerPokemon();
      vi.spyOn(pokemon, "getMaxHp").mockReturnValue(100);
      pokemon["hp"] = 1;

      pokemon.addTag(BattlerTagType.STOCKPILING);
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag);
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(stacksToSetup);

      vi.spyOn(pokemon, "heal");

      game.doAttack(0);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(pokemon.heal).toHaveBeenCalledOnce();
      expect(pokemon.heal).toHaveReturnedWith(expectedHeal);

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });

    it("3 stacks -> 100% heal", { timeout: 10000 }, async () => {
      const stacksToSetup = 3;
      const expectedHeal = 100;

      await game.startBattle([Species.ABOMASNOW]);

      const pokemon = game.scene.getPlayerPokemon();
      vi.spyOn(pokemon, "getMaxHp").mockReturnValue(100);
      pokemon["hp"] = 0.0001;

      pokemon.addTag(BattlerTagType.STOCKPILING);
      pokemon.addTag(BattlerTagType.STOCKPILING);
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag);
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(stacksToSetup);

      vi.spyOn(pokemon, "heal");

      game.doAttack(0);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(pokemon.heal).toHaveBeenCalledOnce();
      expect(pokemon.heal).toHaveReturnedWith(expect.closeTo(expectedHeal));

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });
  });

  it("fails without stacks", { timeout: 10000 }, async () => {
    await game.startBattle([Species.ABOMASNOW]);

    const pokemon = game.scene.getPlayerPokemon();

    const stockpilingTag = pokemon.getTag(StockpilingTag);
    expect(stockpilingTag).toBeUndefined();

    game.doAttack(0);
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(pokemon.getMoveHistory().at(-1)).toMatchObject<TurnMove>({ move: Moves.SWALLOW, result: MoveResult.FAIL });
  });

  describe("restores stat boosts granted by stacks", () => {
    it("decreases stats based on stored values (both boosts equal)", { timeout: 10000 }, async () => {
      await game.startBattle([Species.ABOMASNOW]);

      const pokemon = game.scene.getPlayerPokemon();
      pokemon.addTag(BattlerTagType.STOCKPILING);

      const stockpilingTag = pokemon.getTag(StockpilingTag);
      expect(stockpilingTag).toBeDefined();

      game.doAttack(0);
      await game.phaseInterceptor.to(MovePhase);

      expect(pokemon.summonData.battleStats[BattleStat.DEF]).toBe(1);
      expect(pokemon.summonData.battleStats[BattleStat.SPDEF]).toBe(1);

      await game.phaseInterceptor.to(TurnInitPhase);

      expect(pokemon.getMoveHistory().at(-1)).toMatchObject<TurnMove>({ move: Moves.SWALLOW, result: MoveResult.SUCCESS });

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

      game.doAttack(0);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(pokemon.getMoveHistory().at(-1)).toMatchObject<TurnMove>({ move: Moves.SWALLOW, result: MoveResult.SUCCESS });

      expect(pokemon.summonData.battleStats[BattleStat.DEF]).toBe(1);
      expect(pokemon.summonData.battleStats[BattleStat.SPDEF]).toBe(-2);

      expect(pokemon.getTag(StockpilingTag)).toBeUndefined();
    });
  });
});
