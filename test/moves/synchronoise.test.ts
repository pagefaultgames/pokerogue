import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Synchronoise", () => {
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
      .moveset([MoveId.SYNCHRONOISE])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  // TODO: Write test
  it.todo("should affect all opponents that share a type with the user");

  it("should consider the user's Tera Type if it is Terastallized", async () => {
    await game.classicMode.startBattle([SpeciesId.BIDOOF]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    playerPokemon.teraType = PokemonType.WATER;
    game.move.selectWithTera(MoveId.SYNCHRONOISE);
    await game.toEndOfTurn();

    expect(enemyPokemon).not.toHaveFullHp();
  });

  // TODO: Write test
  it.todo("should fail if no opponents share a type with the user");

  // TODO: Write test
  it.todo("should fail if the user is typeless");
});
