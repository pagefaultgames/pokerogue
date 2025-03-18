import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Liquid Ooze", () => {
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
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.LIQUID_OOZE)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should drain the attacker's HP after a draining move", async () => {
    game.override.moveset(Moves.GIGA_DRAIN).enemyLevel(20);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.GIGA_DRAIN);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()?.isFullHp()).toBe(false);
  });

  it("should not drain the attacker's HP if it ignores indirect damage", async () => {
    game.override.moveset(Moves.GIGA_DRAIN).enemyLevel(20).ability(Abilities.MAGIC_GUARD);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.GIGA_DRAIN);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()?.isFullHp()).toBe(true);
  });

  it("should not apply if suppressed", async () => {
    game.override.moveset(Moves.GIGA_DRAIN).enemyLevel(20).ability(Abilities.NEUTRALIZING_GAS);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.GIGA_DRAIN);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()?.isFullHp()).toBe(true);
  });
});
