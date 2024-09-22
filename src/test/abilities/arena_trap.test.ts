import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

describe("Abilities - Arena Trap", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const TIMEOUT = 20 * 1000;

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
      .moveset(Moves.SPLASH)
      .ability(Abilities.ARENA_TRAP)
      .enemySpecies(Species.RALTS)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.TELEPORT);
  });

  // TODO: Enable test when Issue #935 is addressed
  it.todo("should not allow grounded Pokémon to flee", async () => {
    game.override.battleType("single");

    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon();

    game.move.select(Moves.SPLASH);

    await game.toNextTurn();

    expect(enemy).toBe(game.scene.getEnemyPokemon());
  }, TIMEOUT);

  it("should guarantee double battle with any one LURE", async () => {
    game.override
      .startingModifier([
        { name: "LURE" },
      ])
      .startingWave(2);

    await game.classicMode.startBattle();

    expect(game.scene.getEnemyField().length).toBe(2);
  }, TIMEOUT);
});
