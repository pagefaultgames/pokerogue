import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
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
      .moveset([Moves.SPLASH, Moves.TOXIC, Moves.TOXIC_SPIKES])
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.GRIMER)
      .enemyAbility(Abilities.CORROSION)
      .enemyMoveset(Moves.TOXIC);
  });

  it.each<{ name: string; species: Species }>([
    { name: "Poison", species: Species.GRIMER },
    { name: "Steel", species: Species.KLINK },
  ])("should grant the user the ability to poison $name-type opponents", async ({ species }) => {
    game.override.ability(Abilities.SYNCHRONIZE);
    await game.classicMode.startBattle([species]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    expect(enemyPokemon.status).toBeUndefined();

    game.move.select(Moves.TOXIC);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemyPokemon.status).toBeDefined();
  });

  it("should not affect Toxic Spikes", async () => {
    await game.classicMode.startBattle([Species.SALANDIT]);

    game.move.select(Moves.TOXIC_SPIKES);
    await game.doKillOpponents();
    await game.toNextWave();

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    expect(enemyPokemon.status).toBeUndefined();
  });

  it("should not affect an opponent's Synchronize ability", async () => {
    game.override.ability(Abilities.SYNCHRONIZE);
    await game.classicMode.startBattle([Species.ARBOK]);

    const playerPokemon = game.scene.getPlayerPokemon();
    const enemyPokemon = game.scene.getEnemyPokemon();
    expect(playerPokemon!.status).toBeUndefined();

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    expect(playerPokemon!.status).toBeDefined();
    expect(enemyPokemon!.status).toBeUndefined();
  });

  it("should affect the user's held a Toxic Orb", async () => {
    game.override.startingHeldItems([{ name: "TOXIC_ORB", count: 1 }]);
    await game.classicMode.startBattle([Species.SALAZZLE]);

    const salazzle = game.scene.getPlayerPokemon()!;
    expect(salazzle.status?.effect).toBeUndefined();

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();
    expect(salazzle.status?.effect).toBe(StatusEffect.TOXIC);
  });
});
