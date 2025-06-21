import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import GameManager from "#test/testUtils/gameManager";
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

  it("run to title", async () => {
    await game.runToTitle();

    expect(game.scene.ui.getMode()).toBe(UiMode.TITLE);
    expect(game.scene.phaseManager.getCurrentPhase()?.phaseName).toBe("TitlePhase");
  });

  it("run to summon", async () => {
    await game.classicMode.runToSummon([SpeciesId.ABOMASNOW]);

    expect(game.scene.phaseManager.getCurrentPhase()?.phaseName).toBe("SummonPhase");
  });

  it("classicMode startBattle", async () => {
    await game.classicMode.startBattle([SpeciesId.RABOOT]);

    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.phaseManager.getCurrentPhase()?.phaseName).toBe("CommandPhase");
  });

  it("should not break when phase ended early via prompt", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    game.onNextPrompt("CommandPhase", UiMode.FIGHT, () => {
      game.endPhase();
    });

    game.move.use(MoveId.BOUNCE);
    await game.phaseInterceptor.to("EnemyCommandPhase");
  });
});
