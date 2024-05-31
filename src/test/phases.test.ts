import BattleScene from "#app/battle-scene.js";
import { LoginPhase, TitlePhase, UnavailablePhase } from "#app/phases.js";
import { Mode } from "#app/ui/ui.js";
import { describe, expect, it } from "vitest";
import GameWrapper from "./essentials/gameWrapper";

describe("Phases", () => {
  describe("LoginPhase", () => {
    it("should start the login phase", async () => {
      const scene = new BattleScene();
      const game = new GameWrapper();
      game.scene.add("battle", scene);
      const battleScene = game.scenes["battle"] as BattleScene;
      const loginPhase = new LoginPhase(battleScene);
      loginPhase.start();
      expect(scene.ui.getMode()).to.equal(Mode.LOADING);
    });
  });

  describe("TitlePhase", () => {
    it("should start the title phase", async () => {
      const scene = new BattleScene();
      const game = new GameWrapper();
      game.scene.add("battle", scene);
      const battleScene = game.scenes["battle"] as BattleScene;
      const titlePhase = new TitlePhase(battleScene);
      titlePhase.start();
      expect(scene.ui.getMode()).to.equal(Mode.MESSAGE);
    });
  });

  describe("UnavailablePhase", () => {
    it("should start the unavailable phase", async () => {
      const scene = new BattleScene();
      const game = new GameWrapper();
      game.scene.add("battle", scene);
      const battleScene = game.scenes["battle"] as BattleScene;
      const unavailablePhase = new UnavailablePhase(battleScene);
      unavailablePhase.start();
      expect(scene.ui.getMode()).to.equal(Mode.UNAVAILABLE);
    });
  });
});
