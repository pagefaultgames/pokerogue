import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
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
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingLevel(60)
      .enemySpecies(SpeciesId.CHARMANDER);
  });

  it("will make the user Normal/Grass if targetting a typeless Pokemon affected by Forest's Curse", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const charmander = game.field.getEnemyPokemon();

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.BURN_UP);
    await game.toNextTurn();

    expect(charmander).toHaveTypes(PokemonType.UNKNOWN);
    game.move.use(MoveId.FORESTS_CURSE);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(charmander).toHaveTypes([PokemonType.UNKNOWN, PokemonType.GRASS]);

    game.move.use(MoveId.REFLECT_TYPE);
    await game.toEndOfTurn();

    expect(feebas).toHaveTypes([PokemonType.NORMAL, PokemonType.GRASS]);
  });
});
