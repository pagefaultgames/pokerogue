import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.REST, MoveId.BELLY_DRUM, MoveId.SPLASH])
      .ability(AbilityId.EARLY_BIRD)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("reduces Rest's sleep time to 1 turn", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const player = game.field.getPlayerPokemon();

    game.move.select(MoveId.BELLY_DRUM);
    await game.toNextTurn();
    game.move.select(MoveId.REST);
    await game.toNextTurn();

    expect(player.status?.effect).toBe(StatusEffect.SLEEP);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.status?.effect).toBe(StatusEffect.SLEEP);
    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.status?.effect).toBeUndefined();
    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });

  it("reduces 3-turn sleep to 1 turn", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const player = game.field.getPlayerPokemon();
    player.status = new Status(StatusEffect.SLEEP, 0, 4);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.status?.effect).toBe(StatusEffect.SLEEP);
    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.status?.effect).toBeUndefined();
    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });

  it("reduces 1-turn sleep to 0 turns", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const player = game.field.getPlayerPokemon();
    player.status = new Status(StatusEffect.SLEEP, 0, 2);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.status?.effect).toBeUndefined();
    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });
});
