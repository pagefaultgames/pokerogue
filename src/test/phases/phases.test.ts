import BattleScene from "#app/battle-scene";
import { LoginPhase } from "#app/phases/login-phase";
import { TitlePhase } from "#app/phases/title-phase";
import { UnavailablePhase } from "#app/phases/unavailable-phase";
import { Mode } from "#app/ui/ui";
import GameManager from "#test/utils/gameManager";
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
      const loginPhase = new LoginPhase(scene);
      scene.unshiftPhase(loginPhase);
      await game.phaseInterceptor.run(LoginPhase);
      expect(scene.ui.getMode()).to.equal(Mode.MESSAGE);
    });
  });

  describe("TitlePhase", () => {
    it("should start the title phase", async () => {
      const titlePhase = new TitlePhase(scene);
      scene.unshiftPhase(titlePhase);
      await game.phaseInterceptor.run(TitlePhase);
      expect(scene.ui.getMode()).to.equal(Mode.TITLE);
    });
  });

  describe("UnavailablePhase", () => {
    it("should start the unavailable phase", async () => {
      const unavailablePhase = new UnavailablePhase(scene);
      scene.unshiftPhase(unavailablePhase);
      await game.phaseInterceptor.run(UnavailablePhase);
      expect(scene.ui.getMode()).to.equal(Mode.UNAVAILABLE);
    }, 20000);
  });
});
