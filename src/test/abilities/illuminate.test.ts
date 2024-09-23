import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

describe("Abilities - Illuminate", () => {
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
      .ability(Abilities.ILLUMINATE)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SAND_ATTACK);
  });

  it("should prevent ACC stat stage from being lowered", async () => {
    game.override.battleType("single");

    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;

    expect(player.getStatStage(Stat.ACC)).toBe(0);

    game.move.select(Moves.SPLASH);

    await game.toNextTurn();

    expect(player.getStatStage(Stat.ACC)).toBe(0);
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
