import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Stockpile", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.RATTATA)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingLevel(2000)
      .ability(AbilityId.BALL_FETCH);
  });

  it("should gain a stockpile stack and raise DEF and SPDEF when used, up to 3 times", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();

    for (let i = 1; i <= 3; i++) {
      game.move.use(MoveId.STOCKPILE);
      await game.toNextTurn();

      const stockpilingTag = feebas.getTag(BattlerTagType.STOCKPILING)!;
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(i);
      expect(feebas).toHaveStatStage(Stat.DEF, i as 1 | 2 | 3);
      expect(feebas).toHaveStatStage(Stat.SPDEF, i as 1 | 2 | 3);
    }
  });

  it("should fail when used at max stacks", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();

    feebas.addTag(BattlerTagType.STOCKPILING);
    feebas.addTag(BattlerTagType.STOCKPILING);
    feebas.addTag(BattlerTagType.STOCKPILING);

    expect(feebas).toHaveBattlerTag({ tagType: BattlerTagType.STOCKPILING, stockpiledCount: 3 });

    game.move.use(MoveId.STOCKPILE);
    await game.toEndOfTurn();

    // should have failed and did nothing
    expect(feebas).toHaveStatStage(Stat.DEF, 3);
    expect(feebas).toHaveStatStage(Stat.SPDEF, 3);
    expect(feebas).toHaveBattlerTag({ tagType: BattlerTagType.STOCKPILING, stockpiledCount: 3 });
    expect(feebas).toHaveUsedMove({
      move: MoveId.STOCKPILE,
      result: MoveResult.FAIL,
    });
  });

  it("should gain stockpile stacks even when at max stat stages", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    feebas.setStatStage(Stat.DEF, 6);
    feebas.setStatStage(Stat.SPDEF, 6);

    game.move.use(MoveId.STOCKPILE);
    await game.toNextTurn();

    expect(feebas).toHaveBattlerTag({ tagType: BattlerTagType.STOCKPILING, stockpiledCount: 1 });
    expect(feebas).toHaveStatStage(Stat.DEF, 6);
    expect(feebas).toHaveStatStage(Stat.SPDEF, 6);

    game.move.use(MoveId.STOCKPILE);
    await game.toNextTurn();

    expect(feebas).toHaveBattlerTag({ tagType: BattlerTagType.STOCKPILING, stockpiledCount: 2 });
    expect(feebas).toHaveStatStage(Stat.DEF, 6);
    expect(feebas).toHaveStatStage(Stat.SPDEF, 6);
  });
});
