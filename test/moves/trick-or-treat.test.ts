import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Trick Or Treat", () => {
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
      .moveset([MoveId.FORESTS_CURSE, MoveId.TRICK_OR_TREAT])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("will replace added type from Forest's Curse", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const enemyPokemon = game.field.getEnemyPokemon();
    game.move.select(MoveId.FORESTS_CURSE);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyPokemon.summonData.addedType).toBe(PokemonType.GRASS);

    game.move.select(MoveId.TRICK_OR_TREAT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyPokemon.summonData.addedType).toBe(PokemonType.GHOST);
  });
});
