import BattleScene from "#app/battle-scene.js";
import { LoginPhase, TitlePhase, UnavailablePhase } from "#app/phases.js";
import { Mode } from "#app/ui/ui.js";
import {afterEach, beforeAll, beforeEach, describe, expect, it} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";

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
      loginPhase.start();
      expect(scene.ui.getMode()).to.equal(Mode.MESSAGE);
    });
  });

  describe("TitlePhase", () => {
    it("should start the title phase", async () => {
      const titlePhase = new TitlePhase(scene);
      titlePhase.start();
      expect(scene.ui.getMode()).to.equal(Mode.MESSAGE);
    });
  });

  describe("UnavailablePhase", () => {
    it("should start the unavailable phase", async () => {
      const unavailablePhase = new UnavailablePhase(scene);
      unavailablePhase.start();
      expect(scene.ui.getMode()).to.equal(Mode.UNAVAILABLE);
    });
  });
});
