import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Torment", () => {
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
      .battleStyle("single")
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.TORMENT, MoveId.SPLASH])
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyLevel(30)
      .moveset([MoveId.TACKLE])
      .ability(AbilityId.BALL_FETCH);
  });

  it("Pokemon should not be able to use the same move consecutively", async () => {
    await game.classicMode.startBattle([SpeciesId.CHANSEY]);

    const playerPokemon = game.field.getPlayerPokemon();

    // First turn, Player Pokemon uses Tackle successfully
    game.move.select(MoveId.TACKLE);
    await game.move.selectEnemyMove(MoveId.TORMENT);
    await game.toNextTurn();
    const move1 = playerPokemon.getLastXMoves(1)[0]!;
    expect(move1.move).toBe(MoveId.TACKLE);
    expect(move1.result).toBe(MoveResult.SUCCESS);
    expect(playerPokemon?.getTag(BattlerTagType.TORMENT)).toBeDefined();

    // Second turn, Torment forces Struggle to occur
    game.move.select(MoveId.TACKLE);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();
    const move2 = playerPokemon.getLastXMoves(1)[0]!;
    expect(move2.move).toBe(MoveId.STRUGGLE);

    // Third turn, Tackle can be used.
    game.move.select(MoveId.TACKLE);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);
    const move3 = playerPokemon.getLastXMoves(1)[0]!;
    expect(move3.move).toBe(MoveId.TACKLE);
  });
});
