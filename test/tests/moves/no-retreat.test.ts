import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - No Retreat", () => {
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
      .startingLevel(100)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .criticalHits(false);
  });

  it.each([
    { name: "Mean Look", move: MoveId.MEAN_LOOK },
    { name: "Jaw Lock", move: MoveId.JAW_LOCK },
  ])("should only succeed once when already trapped by $name", async ({ move: trappingMove }) => {
    await game.classicMode.startBattle(SpeciesId.FALINKS);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(trappingMove);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(playerPokemon).toHaveBattlerTag(BattlerTagType.TRAPPED);

    game.move.use(MoveId.NO_RETREAT);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(playerPokemon).toHaveUsedMove({ move: MoveId.NO_RETREAT, result: MoveResult.SUCCESS });
    expect(playerPokemon).toHaveStatStage(Stat.ATK, 1);
    expect(playerPokemon).toHaveStatStage(Stat.DEF, 1);
    expect(playerPokemon).toHaveStatStage(Stat.SPATK, 1);
    expect(playerPokemon).toHaveStatStage(Stat.SPDEF, 1);
    expect(playerPokemon).toHaveStatStage(Stat.SPD, 1);

    game.move.use(MoveId.NO_RETREAT);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon).toHaveUsedMove({ move: MoveId.NO_RETREAT, result: MoveResult.FAIL });
  });

  it("should succeed again after the user switches out and back in", async () => {
    await game.classicMode.startBattle(SpeciesId.FALINKS, SpeciesId.MAGIKARP);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.use(MoveId.NO_RETREAT);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(playerPokemon).toHaveUsedMove({ move: MoveId.NO_RETREAT, result: MoveResult.SUCCESS });

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.ROAR);
    await game.toNextTurn();

    expect(game.field.getPlayerPokemon()).not.toBe(playerPokemon);

    game.doSwitchPokemon(1);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.field.getPlayerPokemon()).toBe(playerPokemon);

    game.move.use(MoveId.NO_RETREAT);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon).toHaveUsedMove({ move: MoveId.NO_RETREAT, result: MoveResult.SUCCESS });
  });
});
