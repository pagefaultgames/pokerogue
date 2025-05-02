import { BattlerIndex } from "#app/battle";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Victory Star", () => {
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
      .moveset([Moves.TACKLE, Moves.SPLASH])
      .battleStyle("double")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should increase the accuracy of its user", async () => {
    await game.classicMode.startBattle([Species.VICTINI, Species.MAGIKARP]);

    const user = game.scene.getPlayerField()[0];

    vi.spyOn(user, "getAccuracyMultiplier");
    game.move.select(Moves.TACKLE, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(user.getAccuracyMultiplier).toHaveReturnedWith(1.1);
  });

  it("should increase the accuracy of its user's ally", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP, Species.VICTINI]);

    const ally = game.scene.getPlayerField()[0];
    vi.spyOn(ally, "getAccuracyMultiplier");

    game.move.select(Moves.TACKLE, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(ally.getAccuracyMultiplier).toHaveReturnedWith(1.1);
  });
});
