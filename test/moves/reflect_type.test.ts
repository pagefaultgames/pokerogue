import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { PokemonType } from "#enums/pokemon-type";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Reflect Type", () => {
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
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  it("will make the user Normal/Grass if targetting a typeless Pokemon affected by Forest's Curse", async () => {
    game.override
      .moveset([MoveId.FORESTS_CURSE, MoveId.REFLECT_TYPE])
      .startingLevel(60)
      .enemySpecies(SpeciesId.CHARMANDER)
      .enemyMoveset([MoveId.BURN_UP, MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const playerPokemon = game.scene.getPlayerPokemon();
    const enemyPokemon = game.scene.getEnemyPokemon();

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.BURN_UP);
    await game.toNextTurn();

    game.move.select(MoveId.FORESTS_CURSE);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();
    expect(enemyPokemon?.getTypes().includes(PokemonType.UNKNOWN)).toBe(true);
    expect(enemyPokemon?.getTypes().includes(PokemonType.GRASS)).toBe(true);

    game.move.select(MoveId.REFLECT_TYPE);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon?.getTypes()[0]).toBe(PokemonType.NORMAL);
    expect(playerPokemon?.getTypes().includes(PokemonType.GRASS)).toBe(true);
  });
});
