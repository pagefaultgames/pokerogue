import type { BattleScene } from "#app/battle-scene";
import { UiMode } from "#enums/ui-mode";
import { LoginPhase } from "#phases/login-phase";
import { TitlePhase } from "#phases/title-phase";
import { UnavailablePhase } from "#phases/unavailable-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Phases", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

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
    scene = game.scene;
  });

  describe("LoginPhase", () => {
    it("should start the login phase", async () => {
      const loginPhase = new LoginPhase();
      scene.phaseManager.unshiftPhase(loginPhase);
      await game.phaseInterceptor.to(LoginPhase);
      expect(scene.ui.getMode()).to.equal(UiMode.MESSAGE);
    });
  });

  describe("TitlePhase", () => {
    it("should start the title phase", async () => {
      const titlePhase = new TitlePhase();
      scene.phaseManager.unshiftPhase(titlePhase);
      await game.phaseInterceptor.to(TitlePhase);
      expect(scene.ui.getMode()).to.equal(UiMode.TITLE);
    });
  });

  describe("UnavailablePhase", () => {
    it("should start the unavailable phase", async () => {
      const unavailablePhase = new UnavailablePhase();
      scene.phaseManager.unshiftPhase(unavailablePhase);
      await game.phaseInterceptor.to(UnavailablePhase);
      expect(scene.ui.getMode()).to.equal(UiMode.UNAVAILABLE);
    });
  });
});
