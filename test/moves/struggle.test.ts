import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Struggle", () => {
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
      .moveset([MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should not have its power boosted by adaptability or stab", async () => {
    game.override.moveset([MoveId.STRUGGLE]).ability(AbilityId.ADAPTABILITY);
    await game.classicMode.startBattle([SpeciesId.RATTATA]);

    const enemy = game.field.getEnemyPokemon();
    game.move.select(MoveId.STRUGGLE);

    const stabSpy = vi.spyOn(enemy, "calculateStabMultiplier");

    await game.phaseInterceptor.to("BerryPhase");

    expect(stabSpy).toHaveReturnedWith(1);
  });

  it("should ignore type effectiveness", async () => {
    game.override.moveset([MoveId.STRUGGLE]);
    await game.classicMode.startBattle([SpeciesId.GASTLY]);

    const enemy = game.field.getEnemyPokemon();
    game.move.select(MoveId.STRUGGLE);

    const moveEffectivenessSpy = vi.spyOn(enemy, "getMoveEffectiveness");
    await game.phaseInterceptor.to("BerryPhase");

    expect(moveEffectivenessSpy).toHaveReturnedWith(1);
  });
});
