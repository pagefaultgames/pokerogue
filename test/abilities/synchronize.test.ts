import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Synchronize", () => {
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
      .startingLevel(100)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.SYNCHRONIZE)
      .moveset([MoveId.SPLASH, MoveId.THUNDER_WAVE, MoveId.SPORE, MoveId.PSYCHO_SHIFT])
      .ability(AbilityId.NO_GUARD);
  });

  it("does not trigger when no status is applied by opponent Pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().status).toBeUndefined();
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });

  it("sets the status of the source pokemon to Paralysis when paralyzed by it", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.THUNDER_WAVE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.field.getEnemyPokemon().status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  });

  it("does not trigger on Sleep", async () => {
    await game.classicMode.startBattle();

    game.move.select(MoveId.SPORE);

    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().status?.effect).toBeUndefined();
    expect(game.field.getEnemyPokemon().status?.effect).toBe(StatusEffect.SLEEP);
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });

  it("does not trigger when Pokemon is statused by Toxic Spikes", async () => {
    game.override.ability(AbilityId.SYNCHRONIZE).enemyAbility(AbilityId.BALL_FETCH).enemyMoveset(MoveId.TOXIC_SPIKES);

    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().status?.effect).toBe(StatusEffect.POISON);
    expect(game.field.getEnemyPokemon().status?.effect).toBeUndefined();
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });

  it("shows ability even if it fails to set the status of the opponent Pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    game.move.select(MoveId.THUNDER_WAVE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().status?.effect).toBeUndefined();
    expect(game.field.getEnemyPokemon().status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  });
});
