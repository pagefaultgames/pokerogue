import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.SPLASH, MoveId.GIGA_DRAIN])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .enemyLevel(20)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.LIQUID_OOZE)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should drain the attacker's HP after a draining move", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.GIGA_DRAIN);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon()).not.toHaveFullHp();
  });

  it("should not drain the attacker's HP if it ignores indirect damage", async () => {
    game.override.ability(AbilityId.MAGIC_GUARD);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.GIGA_DRAIN);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon()).toHaveFullHp();
  });

  it("should not apply if suppressed", async () => {
    game.override.ability(AbilityId.NEUTRALIZING_GAS);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.GIGA_DRAIN);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon()).toHaveFullHp();
  });
});
