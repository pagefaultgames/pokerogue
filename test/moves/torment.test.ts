import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MoveResult } from "#app/field/pokemon";
import { BattlerTagType } from "#enums/battler-tag-type";
import { TurnEndPhase } from "#app/phases/turn-end-phase";

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
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([ Moves.TORMENT, Moves.SPLASH ])
      .enemySpecies(Species.SHUCKLE)
      .enemyLevel(30)
      .moveset([ Moves.TACKLE ])
      .ability(Abilities.BALL_FETCH);
  });

  it("Pokemon should not be able to use the same move consecutively", async () => {
    await game.classicMode.startBattle([ Species.CHANSEY ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    // First turn, Player Pokemon uses Tackle successfully
    game.move.select(Moves.TACKLE);
    await game.forceEnemyMove(Moves.TORMENT);
    await game.toNextTurn();
    const move1 = playerPokemon.getLastXMoves(1)[0]!;
    expect(move1.move).toBe(Moves.TACKLE);
    expect(move1.result).toBe(MoveResult.SUCCESS);
    expect(playerPokemon?.getTag(BattlerTagType.TORMENT)).toBeDefined();

    // Second turn, Torment forces Struggle to occur
    game.move.select(Moves.TACKLE);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    const move2 = playerPokemon.getLastXMoves(1)[0]!;
    expect(move2.move).toBe(Moves.STRUGGLE);

    // Third turn, Tackle can be used.
    game.move.select(Moves.TACKLE);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);
    const move3 = playerPokemon.getLastXMoves(1)[0]!;
    expect(move3.move).toBe(Moves.TACKLE);
  });
});
