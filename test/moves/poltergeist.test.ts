import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Poltergeist", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
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

  it("should not crash when used after both opponents have fainted", async () => {
    game.override.battleStyle("double").enemyLevel(5);
    await game.classicMode.startBattle([SpeciesId.STARYU, SpeciesId.SLOWPOKE]);

    game.move.use(MoveId.DAZZLING_GLEAM);
    game.move.use(MoveId.POLTERGEIST, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    const [_, poltergeistUser] = game.scene.getPlayerField();
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toEndOfTurn();
    // Expect poltergeist to have failed
    expect(poltergeistUser).toHaveUsedMove({ move: MoveId.POLTERGEIST, result: MoveResult.FAIL });
    // If the test makes it to the end of turn, no crash occurred. Nothing to assert
  });
});
