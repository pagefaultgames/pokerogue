import { BattlerIndex } from "#app/battle";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
      .moveset([MoveId.TACKLE, MoveId.SPLASH])
      .battleStyle("double")
      .disableCrits()
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should increase the accuracy of its user", async () => {
    await game.classicMode.startBattle([SpeciesId.VICTINI, SpeciesId.MAGIKARP]);

    const user = game.scene.getPlayerField()[0];

    vi.spyOn(user, "getAccuracyMultiplier");
    game.move.select(MoveId.TACKLE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(user.getAccuracyMultiplier).toHaveReturnedWith(1.1);
  });

  it("should increase the accuracy of its user's ally", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.VICTINI]);

    const ally = game.scene.getPlayerField()[0];
    vi.spyOn(ally, "getAccuracyMultiplier");

    game.move.select(MoveId.TACKLE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(ally.getAccuracyMultiplier).toHaveReturnedWith(1.1);
  });
});
