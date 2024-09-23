import { StatusEffect } from "#app/data/status-effect";
import GameManager from "#app/test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
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
      .battleType("single")
      .startingLevel(100)
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.SYNCHRONIZE)
      .moveset([Moves.SPLASH, Moves.THUNDER_WAVE, Moves.SPORE, Moves.PSYCHO_SHIFT])
      .ability(Abilities.NO_GUARD);
  }, 20000);

  it("does not trigger when no status is applied by opponent Pokemon", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getParty()[0].status).toBeUndefined();
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  }, 20000);

  it("sets the status of the source pokemon to Paralysis when paralyzed by it", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.THUNDER_WAVE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getParty()[0].status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.scene.getEnemyParty()[0].status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  }, 20000);

  it("does not trigger on Sleep", async () => {
    await game.classicMode.startBattle();

    game.move.select(Moves.SPORE);

    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getParty()[0].status?.effect).toBeUndefined();
    expect(game.scene.getEnemyParty()[0].status?.effect).toBe(StatusEffect.SLEEP);
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  }, 20000);

  it("does not trigger when Pokemon is statused by Toxic Spikes", async () => {
    game.override
      .ability(Abilities.SYNCHRONIZE)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Array(4).fill(Moves.TOXIC_SPIKES));

    await game.classicMode.startBattle([Species.FEEBAS, Species.MILOTIC]);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getParty()[0].status?.effect).toBe(StatusEffect.POISON);
    expect(game.scene.getEnemyParty()[0].status?.effect).toBeUndefined();
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  }, 20000);

  it("shows ability even if it fails to set the status of the opponent Pokemon", async () => {
    await game.classicMode.startBattle([Species.PIKACHU]);

    game.move.select(Moves.THUNDER_WAVE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getParty()[0].status?.effect).toBeUndefined();
    expect(game.scene.getEnemyParty()[0].status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  }, 20000);

  it("should activate with Psycho Shift after the move clears the status", async () => {
    game.override.statusEffect(StatusEffect.PARALYSIS);
    await game.classicMode.startBattle();

    game.move.select(Moves.PSYCHO_SHIFT);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getParty()[0].status?.effect).toBe(StatusEffect.PARALYSIS); // keeping old gen < V impl for now since it's buggy otherwise
    expect(game.scene.getEnemyParty()[0].status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  }, 20000);
});
