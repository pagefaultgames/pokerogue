import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MoveResult } from "#app/field/pokemon";
import { BattlerTagType } from "#app/enums/battler-tag-type";

describe("Moves - Taunt", () => {
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
      .enemyMoveset([Moves.TAUNT, Moves.SPLASH])
      .enemySpecies(Species.SHUCKLE)
      .moveset([Moves.GROWL]);
  });

  it("Pokemon should not be able to use Status Moves", async () => {
    await game.classicMode.startBattle([Species.REGIELEKI]);

    const playerPokemon = game.scene.getPlayerPokemon();

    // First turn, Player Pokemon succeeds using Growl without Torment
    game.move.select(Moves.GROWL);
    await game.forceEnemyMove(Moves.TAUNT);
    await game.toNextTurn();
    const move1 = playerPokemon?.getLastXMoves(1)[0]!;
    expect(move1.move).toBe(Moves.GROWL);
    expect(move1.result).toBe(MoveResult.SUCCESS);
    expect(playerPokemon?.getTag(BattlerTagType.TAUNT)).toBeDefined();

    // Second turn, Taunt forces Struggle to occur
    game.move.select(Moves.GROWL);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    const move2 = playerPokemon?.getLastXMoves(1)[0]!;
    expect(move2.move).toBe(Moves.STRUGGLE);
  });
});
