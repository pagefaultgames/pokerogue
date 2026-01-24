import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Move - Return", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should increase the power based on friendship", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    feebas.friendship = 200;

    const powerSpy = vi.spyOn(allMoves[MoveId.RETURN], "calculateBattlePower");

    game.move.use(MoveId.RETURN);
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({ move: MoveId.RETURN, result: MoveResult.SUCCESS });
    expect(powerSpy).toHaveLastReturnedWith(80);
  });

  it("should NOT increase the power based on friendship for wild pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const magikarp = game.field.getEnemyPokemon();
    magikarp.friendship = 200;

    const powerSpy = vi.spyOn(allMoves[MoveId.RETURN], "calculateBattlePower");

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.RETURN);
    await game.toEndOfTurn();

    expect(magikarp).toHaveUsedMove({ move: MoveId.RETURN, result: MoveResult.SUCCESS });
    expect(powerSpy).not.toHaveLastReturnedWith(80);
  });

  it("should increase the power based on friendship for Trainer pokemon", async () => {
    game.override.battleType(BattleType.TRAINER);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const magikarp = game.field.getEnemyPokemon();
    magikarp.friendship = 200;

    const powerSpy = vi.spyOn(allMoves[MoveId.RETURN], "calculateBattlePower");

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.RETURN);
    await game.toEndOfTurn();

    expect(magikarp).toHaveUsedMove({ move: MoveId.RETURN, result: MoveResult.SUCCESS });
    expect(powerSpy).toHaveLastReturnedWith(80);
  });
});
