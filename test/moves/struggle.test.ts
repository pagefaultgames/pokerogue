import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset([Moves.SPLASH])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should not have its power boosted by adaptability or stab", async () => {
    game.override.moveset([Moves.STRUGGLE]).ability(Abilities.ADAPTABILITY);
    await game.classicMode.startBattle([Species.RATTATA]);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.select(Moves.STRUGGLE);

    const stabSpy = vi.spyOn(enemy, "calculateStabMultiplier");

    await game.phaseInterceptor.to("BerryPhase");

    expect(stabSpy).toHaveReturnedWith(1);

    stabSpy.mockRestore();
  });

  it("should ignore type effectiveness", async () => {
    game.override.moveset([Moves.STRUGGLE]);
    await game.classicMode.startBattle([Species.GASTLY]);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.select(Moves.STRUGGLE);

    const moveEffectivenessSpy = vi.spyOn(enemy, "getMoveEffectiveness");

    await game.phaseInterceptor.to("BerryPhase");

    expect(moveEffectivenessSpy).toHaveReturnedWith(1);

    moveEffectivenessSpy.mockRestore();
  });
});
