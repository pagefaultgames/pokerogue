import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Super Luck", () => {
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
      .moveset([MoveId.TACKLE])
      .ability(AbilityId.SUPER_LUCK)
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should increase the user's crit stage by 1", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const enemy = game.field.getEnemyPokemon();
    const critSpy = vi.spyOn(enemy, "getCritStage"); // crit stage is called on enemy

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(critSpy).toHaveReturnedWith(1);
  });
});
