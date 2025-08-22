import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Suction Cups", () => {
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
      .ability(AbilityId.SUCTION_CUPS)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(1);
  });

  it("should prevent the user from being forcibly switched out", async () => {
    await game.classicMode.startBattle([SpeciesId.CRADILY, SpeciesId.SWALOT]);

    const cradily = game.field.getPlayerPokemon();

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.ROAR);
    await game.toEndOfTurn();

    expect(cradily.isOnField()).toBe(true);
    expect(cradily).toHaveAbilityApplied(AbilityId.SUCTION_CUPS);
  });

  it("should not affect the user's own switches", async () => {
    await game.classicMode.startBattle([SpeciesId.CRADILY, SpeciesId.SWALOT]);

    const cradily = game.field.getPlayerPokemon();

    game.move.use(MoveId.U_TURN);
    await game.toEndOfTurn();

    expect(cradily.isOnField()).toBe(false);
    expect(cradily).not.toHaveAbilityApplied(AbilityId.SUCTION_CUPS);
  });
});
