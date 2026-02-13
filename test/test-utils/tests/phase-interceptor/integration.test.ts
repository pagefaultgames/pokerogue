import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Utils - Phase Interceptor - Integration", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
  });

  it("runToTitle", async () => {
    await game.runToTitle();

    expect(game.scene.ui.getMode()).toBe(UiMode.TITLE);
    expect(game).toBeAtPhase("TitlePhase");
  });

  it("runToSummon", async () => {
    await game.classicMode.runToSummon(SpeciesId.ABOMASNOW);

    expect(game).toBeAtPhase("SummonPhase");
  });

  it("startBattle", async () => {
    await game.classicMode.startBattle(SpeciesId.RABOOT);

    expect(game.scene.ui.getMode()).toBe(UiMode.COMMAND);
    expect(game).toBeAtPhase("CommandPhase");
  });

  it("1 Full Turn", async () => {
    await game.classicMode.startBattle(SpeciesId.REGIELEKI);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.scene.ui.getMode()).toBe(UiMode.COMMAND);
    expect(game).toBeAtPhase("CommandPhase");
  });

  it("should not break when phase ended early via prompt", async () => {
    await game.classicMode.startBattle(SpeciesId.REGIELEKI);
    game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      game.endPhase();
    });

    game.move.use(MoveId.BOUNCE);
    await game.phaseInterceptor.to("EnemyCommandPhase");
  });
});
