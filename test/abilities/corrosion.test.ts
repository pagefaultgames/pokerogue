import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
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
      .criticalHits(false)
      .enemySpecies(SpeciesId.GRIMER)
      .ability(AbilityId.CORROSION)
      .enemyAbility(AbilityId.NO_GUARD)
      .enemyMoveset(MoveId.SPLASH);
  });

  it.each<{ name: string; species: SpeciesId }>([
    { name: "Poison", species: SpeciesId.GRIMER },
    { name: "Steel", species: SpeciesId.KLINK },
  ])("should grant the user the ability to poison $name-type opponents", async ({ species }) => {
    game.override.enemySpecies(species);
    await game.classicMode.startBattle([SpeciesId.SALANDIT]);

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.status?.effect).toBeUndefined();

    game.move.use(MoveId.POISON_GAS);
    await game.toEndOfTurn();

    expect(enemy.status?.effect).toBe(StatusEffect.POISON);
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
    game.override.enemyAbility(AbilityId.SYNCHRONIZE);
    await game.classicMode.startBattle([SpeciesId.ARBOK]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.status?.effect).toBeUndefined();

    game.move.use(MoveId.TOXIC);
    await game.toEndOfTurn();

    expect(enemyPokemon.status?.effect).toBe(StatusEffect.TOXIC);
    expect(playerPokemon.status?.effect).toBeUndefined();
  });

  it("should affect the user's held Toxic Orb", async () => {
    game.override.startingHeldItems([{ name: "TOXIC_ORB", count: 1 }]);
    await game.classicMode.startBattle([SpeciesId.SALAZZLE]);

    const salazzle = game.field.getPlayerPokemon();
    expect(salazzle.status?.effect).toBeUndefined();

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(salazzle.status?.effect).toBe(StatusEffect.TOXIC);
  });
});
