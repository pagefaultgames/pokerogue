import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset([Moves.TACKLE])
      .ability(Abilities.SUPER_LUCK)
      .battleStyle("single")
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should increase the crit stage of a user by 1", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);
    const enemy = game.scene.getEnemyPokemon()!;
    const fn = vi.spyOn(enemy, "getCritStage");
    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(fn).toHaveReturnedWith(1);
    fn.mockRestore();
  });
});
