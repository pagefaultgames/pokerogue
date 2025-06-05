import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(SpeciesId.GRIMER)
      .enemyAbility(AbilityId.CORROSION)
      .enemyMoveset(MoveId.TOXIC);
  });

  it.each<{ name: string; species: SpeciesId }>([
    { name: "Poison", species: SpeciesId.GRIMER },
    { name: "Steel", species: SpeciesId.KLINK },
  ])("should grant the user the ability to poison $name-type opponents", async ({ species }) => {
    await game.classicMode.startBattle([species]);

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.status).toBeUndefined();

    game.move.use(MoveId.POISON_GAS);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemyPokemon.status).toBeDefined();
  });

  it("should not affect Toxic Spikes", async () => {
    await game.classicMode.startBattle([SpeciesId.SALANDIT]);

    game.move.use(MoveId.TOXIC_SPIKES);
    await game.doKillOpponents();
    await game.toNextWave();

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.status).toBeUndefined();
  });

  it("should not affect an opponent's Synchronize ability", async () => {
    game.override.ability(AbilityId.SYNCHRONIZE);
    await game.classicMode.startBattle([SpeciesId.ARBOK]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.status?.effect).toBeUndefined();

    game.move.select(MoveId.TOXIC);
    await game.toEndOfTurn()

    expect(playerPokemon.status?.effect).toBe(StatusEffect.TOXIC);
    expect(enemyPokemon.status?.effect).toBeUndefined();
  });

  it("should affect the user's held Toxic Orb", async () => {
    game.override.startingHeldItems([{ name: "TOXIC_ORB", count: 1 }]);
    await game.classicMode.startBattle([SpeciesId.SALAZZLE]);

    const salazzle = game.field.getPlayerPokemon();
    expect(salazzle.status?.effect).toBeUndefined();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(salazzle.status?.effect).toBe(StatusEffect.TOXIC);
  });
});
