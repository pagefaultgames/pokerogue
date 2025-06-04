import { Stat } from "#app/enums/stat";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

describe("Abilities - Illuminate", () => {
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
      .moveset(MoveId.SPLASH)
      .ability(AbilityId.ILLUMINATE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SAND_ATTACK);
  });

  it("should prevent ACC stat stage from being lowered", async () => {
    game.override.battleStyle("single");

    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;

    expect(player.getStatStage(Stat.ACC)).toBe(0);

    game.move.select(MoveId.SPLASH);

    await game.toNextTurn();

    expect(player.getStatStage(Stat.ACC)).toBe(0);
  });

  it("should guarantee double battle with any one LURE", async () => {
    game.override.startingModifier([{ name: "LURE" }]).startingWave(2);

    await game.classicMode.startBattle();

    expect(game.scene.getEnemyField().length).toBe(2);
  });
});
