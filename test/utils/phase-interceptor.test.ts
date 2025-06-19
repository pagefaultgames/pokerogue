import type { PhaseString } from "#app/@types/phase-types";
import { Phase } from "#app/phase";
import type { Constructor } from "#app/utils/common";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

let phaserGame: Phaser.Game;
let game: GameManager;

abstract class mockPhase extends Phase {
  public override readonly phaseName: any;

  override start() {
    this.end();
  }
}

class normalPhase extends mockPhase {
  public readonly phaseName = "normalPhase";
}

class applePhase extends mockPhase {
  public readonly phaseName = "applePhase";
}

class oneSecTimerPhase extends mockPhase {
  public readonly phaseName = "oneSecTimerPhase";
  override start() {
    setInterval(() => {
      super.start();
    }, 1000);
  }
}

class unshifterPhase extends mockPhase {
  public readonly phaseName = "unshifterPhase";
  override start() {
    game.scene.phaseManager.unshiftPhase(new normalPhase() as unknown as Phase);
    game.scene.phaseManager.unshiftPhase(new applePhase() as unknown as Phase);
    super.start();
  }
}

// reduce timeout so failed tests don't hang as long
describe("Utils - Phase Interceptor", { timeout: 4000 }, () => {
  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    setPhases(normalPhase, applePhase, oneSecTimerPhase, unshifterPhase, normalPhase);
  });

  function setPhases(...phases: Constructor<mockPhase>[]) {
    game.scene.phaseManager.clearAllPhases();
    game.scene.phaseManager.phaseQueue = phases.map(m => new m());
    game.scene.phaseManager.shiftPhase(); // start the thing going
  }

  function getQueuedPhases(): string[] {
    return game.scene.phaseManager["phaseQueuePrepend"]
      .concat(game.scene.phaseManager.phaseQueue)
      .map(p => p.phaseName);
  }

  function getCurrentPhaseName(): string {
    return game.scene.phaseManager.getCurrentPhase()?.phaseName ?? "null";
  }

  /** Wrapper function to make TS not complain about `PhaseString` stuff */
  function to(phaseName: string, runTarget = true) {
    return game.phaseInterceptor.to(phaseName as unknown as PhaseString, runTarget);
  }

  describe("to", () => {
    it("should run the specified phase and halt after it ends", async () => {
      await to("normalPhase");
      expect(getCurrentPhaseName()).toBe("applePhase");
      expect(getQueuedPhases()).toEqual(["oneSecTimerPhase", "unshifterPhase", "normalPhase"]);
      expect(game.phaseInterceptor.log).toEqual(["normalPhase"]);
    });

    it("should run to the specified phase without starting/logging", async () => {
      await to("normalPhase", false);
      expect(getCurrentPhaseName()).toBe("normalPhase");
      expect(getQueuedPhases()).toEqual(["applePhase", "oneSecTimerPhase", "unshifterPhase", "normalPhase"]);
      expect(game.phaseInterceptor.log).toHaveLength(0);
    });

    it("should start all phases between start and target", async () => {
      await to("oneSecTimerPhase");
      expect(getQueuedPhases()).toEqual(["unshifterPhase", "normalPhase"]);
      expect(game.phaseInterceptor.log).toEqual(["normalPhase", "applePhase", "oneSecTimerPhase"]);
    });

    it("should work on newly unshifted phases", async () => {
      setPhases(unshifterPhase); // adds normalPhase and applePhase to queue
      await to("applePhase");
      expect(game.phaseInterceptor.log).toEqual(["unshifterPhase", "normalPhase", "applePhase"]);
    });

    it("should wait until phase finishes before starting next", async () => {
      setPhases(oneSecTimerPhase, applePhase);
      setTimeout(() => expect(getCurrentPhaseName()).toBe("oneSecTimerPhase"), 500);
      await to("applePhase");
    });
  });

  describe("shift", () => {
    it("should skip the next phase without starting", async () => {
      expect(getCurrentPhaseName()).toBe("normalPhase");
      expect(getQueuedPhases()).toEqual(["applePhase", "oneSecTimerPhase", "unshifterPhase", "normalPhase"]);

      game.phaseInterceptor.shiftPhase();

      expect(getCurrentPhaseName()).toBe("applePhase");
      expect(getQueuedPhases()).toEqual(["oneSecTimerPhase", "unshifterPhase", "normalPhase"]);
      expect(game.phaseInterceptor.log).toEqual([]);
    });
  });
});
