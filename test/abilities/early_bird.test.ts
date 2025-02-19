import { Status } from "#app/data/status-effect";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Early Bird", () => {
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
      .moveset([ Moves.REST, Moves.BELLY_DRUM, Moves.SPLASH ])
      .ability(Abilities.EARLY_BIRD)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("reduces Rest's sleep time to 1 turn", async () => {
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    const player = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.BELLY_DRUM);
    await game.toNextTurn();
    game.move.select(Moves.REST);
    await game.toNextTurn();

    expect(player.status?.effect).toBe(StatusEffect.SLEEP);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(player.status?.effect).toBe(StatusEffect.SLEEP);
    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(player.status?.effect).toBeUndefined();
    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });

  it("reduces 3-turn sleep to 1 turn", async () => {
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    const player = game.scene.getPlayerPokemon()!;
    player.status = new Status(StatusEffect.SLEEP, 0, 4);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(player.status?.effect).toBe(StatusEffect.SLEEP);
    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(player.status?.effect).toBeUndefined();
    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });

  it("reduces 1-turn sleep to 0 turns", async () => {
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    const player = game.scene.getPlayerPokemon()!;
    player.status = new Status(StatusEffect.SLEEP, 0, 2);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(player.status?.effect).toBeUndefined();
    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });
});
