import BattleScene from "#app/battle-scene.js";
import { LoginPhase } from "#app/phases.js";
import { Mode } from "#app/ui/ui.js";
import { describe, expect, it } from "vitest";
import GameWrapper from "./essentials/gameWrapper";
import {waitUntil} from "#app/test/essentials/utils";

describe("Phases", () => {
  describe("LoginPhase", () => {
    it("should start the login phase", async () => {
      const scene = new BattleScene();
      const game = new GameWrapper();
      game.scene.add("battle", scene);
      await waitUntil(() => scene.ui?.getMode() === Mode.OPTION_SELECT);
      const battleScene = game.scenes["battle"] as BattleScene;
      const loginPhase = new LoginPhase(battleScene);
      loginPhase.start();
      expect(scene.ui.getMode()).to.equal(Mode.LOADING);
    });
  });
});
