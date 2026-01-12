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
    await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

    const user = game.field.getPlayerPokemon();

    expect(user).toHaveStatStage(Stat.DEF, 0);
    expect(user).toHaveStatStage(Stat.SPDEF, 0);

    // use Stockpile thrice
    for (let i = 0; i < 3; i++) {
      game.move.use(MoveId.STOCKPILE);
      await game.toNextTurn();

      const stockpilingTag = user.getTag(BattlerTagType.STOCKPILING)!;
      expect(stockpilingTag).toBeDefined();
      expect(stockpilingTag.stockpiledCount).toBe(i + 1);
      expect(user).toHaveStatStage(Stat.DEF, i + 1);
      expect(user).toHaveStatStage(Stat.SPDEF, i + 1);
    }
  });

  it("should fail when used at max stacks", async () => {
    await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

    const user = game.field.getPlayerPokemon();

    user.addTag(BattlerTagType.STOCKPILING);
    user.addTag(BattlerTagType.STOCKPILING);
    user.addTag(BattlerTagType.STOCKPILING);

    const stockpilingTag = user.getTag(BattlerTagType.STOCKPILING)!;
    expect(stockpilingTag).toBeDefined();
    expect(stockpilingTag.stockpiledCount).toBe(3);

    game.move.use(MoveId.STOCKPILE);
    await game.toNextTurn();

    // should have failed
    expect(user).toHaveStatStage(Stat.DEF, 3);
    expect(user).toHaveStatStage(Stat.SPDEF, 3);
    expect(stockpilingTag.stockpiledCount).toBe(3);
    expect(user).toHaveUsedMove({
      move: MoveId.STOCKPILE,
      result: MoveResult.FAIL,
    });
  });

  it("gains a stockpile stack even if user's DEF and SPDEF stat stages are at +6", async () => {
    await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

    const user = game.field.getPlayerPokemon();

    user.setStatStage(Stat.DEF, 6);
    user.setStatStage(Stat.SPDEF, 6);

    expect(user).not.toHaveBattlerTag(BattlerTagType.STOCKPILING);

    game.move.use(MoveId.STOCKPILE);
    await game.toNextTurn();

    const stockpilingTag = user.getTag(BattlerTagType.STOCKPILING)!;
    expect(stockpilingTag).toBeDefined();
    expect(stockpilingTag.stockpiledCount).toBe(1);
    expect(user).toHaveStatStage(Stat.DEF, 6);
    expect(user).toHaveStatStage(Stat.SPDEF, 6);

    game.move.use(MoveId.STOCKPILE);
    await game.toNextTurn();

    const stockpilingTagAgain = user.getTag(BattlerTagType.STOCKPILING)!;
    expect(stockpilingTagAgain).toBeDefined();
    expect(stockpilingTagAgain.stockpiledCount).toBe(2);
    expect(user).toHaveStatStage(Stat.DEF, 6);
    expect(user).toHaveStatStage(Stat.SPDEF, 6);
  });
});
