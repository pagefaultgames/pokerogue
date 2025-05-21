import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Chloroblast", () => {
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
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH);
  });

  it("should not deal recoil damage if the opponent uses protect", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.use(Moves.CHLOROBLAST);
    await game.move.forceEnemyMove(Moves.PROTECT);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();

    expect(player.isFullHp()).toBe(true);
    expect(player.getLastXMoves()[0]).toMatchObject({ result: MoveResult.MISS, move: Moves.CHLOROBLAST });
  });
});
