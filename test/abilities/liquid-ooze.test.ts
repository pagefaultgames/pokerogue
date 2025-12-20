import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Liquid Ooze", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .enemyLevel(20)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.LIQUID_OOZE)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should reverse the effect of HP-draining moves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.GIGA_DRAIN);
    await game.toEndOfTurn();

    const karp = game.field.getEnemyPokemon();
    expect(karp).toHaveAbilityApplied(AbilityId.LIQUID_OOZE);
    expect(karp).not.toHaveFullHp();
    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveTakenDamage(karp.getInverseHp() / 2);
  });

  it("should not drain the attacker's HP if it ignores indirect damage", async () => {
    game.override.ability(AbilityId.MAGIC_GUARD);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.GIGA_DRAIN);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveFullHp();
  });

  // Regression test
  it("should not apply if suppressed", async () => {
    game.override.ability(AbilityId.NEUTRALIZING_GAS);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.GIGA_DRAIN);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveFullHp();
  });

  // TODO: Write test
  it.todo("should reverse drains from Leech Seed");
});
