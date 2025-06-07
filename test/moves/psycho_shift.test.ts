import { StatusEffect } from "#app/enums/status-effect";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Psycho Shift", () => {
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
      .moveset([MoveId.PSYCHO_SHIFT])
      .ability(AbilityId.BALL_FETCH)
      .statusEffect(StatusEffect.POISON)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyLevel(20)
      .enemyAbility(AbilityId.SYNCHRONIZE)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("If Psycho Shift is used on a Pokémon with Synchronize, the user of Psycho Shift will already be afflicted with a status condition when Synchronize activates", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const playerPokemon = game.scene.getPlayerPokemon();
    const enemyPokemon = game.scene.getEnemyPokemon();
    expect(enemyPokemon?.status).toBeUndefined();

    game.move.select(MoveId.PSYCHO_SHIFT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon?.status).toBeNull();
    expect(enemyPokemon?.status).toBeDefined();
  });
});
