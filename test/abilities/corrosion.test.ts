import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Corrosion", () => {
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
      .moveset([Moves.SPLASH])
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.GRIMER)
      .enemyAbility(Abilities.CORROSION)
      .enemyMoveset(Moves.TOXIC);
  });

  it("If a Poison- or Steel-type Pokémon with this Ability poisons a target with Synchronize, Synchronize does not gain the ability to poison Poison- or Steel-type Pokémon.", async () => {
    game.override.ability(Abilities.SYNCHRONIZE);
    await game.classicMode.startBattle([Species.FEEBAS]);

    const playerPokemon = game.scene.getPlayerPokemon();
    const enemyPokemon = game.scene.getEnemyPokemon();
    expect(playerPokemon!.status).toBeUndefined();

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    expect(playerPokemon!.status).toBeDefined();
    expect(enemyPokemon!.status).toBeUndefined();
  });
});
