import { globalScene } from "#app/global-scene";
import type { Phase } from "#app/phase";
import type { Constructor } from "#app/utils/common";
import { GameManager } from "#test/test-utils/game-manager";
import { mockPhase } from "#test/test-utils/mocks/mock-phase";
import type { PhaseString } from "#types/phase-types";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// TODO: Move these to `mock-phase.ts` if/when unit tests for the phase manager are created
class applePhase extends mockPhase {
  public readonly phaseName = "applePhase";
}

class bananaPhase extends mockPhase {
  public readonly phaseName = "bananaPhase";
}

class coconutPhase extends mockPhase {
  public readonly phaseName = "coconutPhase";
}

class oneSecTimerPhase extends mockPhase {
  public readonly phaseName = "oneSecTimerPhase";
  start() {
    setTimeout(() => {
      console.log("1 sec passed!");
      this.end();
    }, 1000);
  }
}

class unshifterPhase extends mockPhase {
  public readonly phaseName = "unshifterPhase";
  start() {
    globalScene.phaseManager.unshiftPhase(new applePhase() as unknown as Phase);
    globalScene.phaseManager.unshiftPhase(new bananaPhase() as unknown as Phase);
    globalScene.phaseManager.unshiftPhase(new coconutPhase() as unknown as Phase);
    this.end();
  }
}

describe("Utils - Phase Interceptor - Unit", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    setPhases(applePhase, bananaPhase, coconutPhase, bananaPhase, coconutPhase);
  });

  /**
   * Helper function to set the phase manager's phases to the specified values and start the first one.
   * @param phases - An array of constructors to {@linkcode Phase}s to set.
   * Constructors must have no arguments.
   */
  function setPhases(...phases: [Constructor<mockPhase>, ...Constructor<mockPhase>[]]) {
    game.scene.phaseManager.clearAllPhases();
    game.scene.phaseManager.phaseQueue = phases.map(m => new m()) as Phase[];
    game.scene.phaseManager.shiftPhase(); // start the thing going
  }

  function getQueuedPhases(): string[] {
    return game.scene.phaseManager["phaseQueuePrepend"]
      .concat(game.scene.phaseManager.phaseQueue)
      .map(p => p.phaseName);
  }

  function expectAtPhase(phaseName: string) {
    expect(game).toBeAtPhase(phaseName as PhaseString);
  }

  /** Wrapper function to make TS not complain about incompatible argument typing on `PhaseString`. */
  function to(phaseName: string, runTarget?: false): Promise<void> {
    return game.phaseInterceptor.to(phaseName as unknown as PhaseString, runTarget);
  }

  describe("to", () => {
    it("should start the specified phase and resolve after it ends", async () => {
      await to("applePhase");

      expectAtPhase("bananaPhase");
      expect(getQueuedPhases()).toEqual(["coconutPhase", "bananaPhase", "coconutPhase"]);
      expect(game.phaseInterceptor.log).toEqual(["applePhase"]);
    });

    it("should run to the specified phase without starting/logging", async () => {
      await to("applePhase", false);

      expectAtPhase("applePhase");
      expect(getQueuedPhases()).toEqual(["bananaPhase", "coconutPhase", "bananaPhase", "coconutPhase"]);
      expect(game.phaseInterceptor.log).toEqual([]);

      await to("applePhase", false);

      // should not do anything
      expectAtPhase("applePhase");
      expect(getQueuedPhases()).toEqual(["bananaPhase", "coconutPhase", "bananaPhase", "coconutPhase"]);
      expect(game.phaseInterceptor.log).toEqual([]);
    });

    it("should run all phases between start and the first instance of target", async () => {
      await to("coconutPhase");

      expectAtPhase("bananaPhase");
      expect(getQueuedPhases()).toEqual(["coconutPhase"]);
      expect(game.phaseInterceptor.log).toEqual(["applePhase", "bananaPhase", "coconutPhase"]);
    });

    it("should work on newly unshifted phases", async () => {
      setPhases(unshifterPhase, coconutPhase); // adds applePhase, bananaPhase and coconutPhase to queue
      await to("bananaPhase");

      expectAtPhase("coconutPhase");
      expect(getQueuedPhases()).toEqual(["coconutPhase"]);
      expect(game.phaseInterceptor.log).toEqual(["unshifterPhase", "applePhase", "bananaPhase"]);
    });

    it("should wait for asynchronous phases to end", async () => {
      setPhases(oneSecTimerPhase, coconutPhase);
      const callback = vi.fn(() => console.log("fffffff"));
      const spy = vi.spyOn(oneSecTimerPhase.prototype, "end");
      setTimeout(() => {
        callback();
      }, 500);
      await to("coconutPhase");
      expect(callback).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("shift", () => {
    it("should skip the next phase in line without starting it", async () => {
      const startSpy = vi.spyOn(applePhase.prototype, "start");

      game.phaseInterceptor.shiftPhase();

      expectAtPhase("bananaPhase");
      expect(getQueuedPhases()).toEqual(["coconutPhase", "bananaPhase", "coconutPhase"]);
      expect(startSpy).not.toHaveBeenCalled();
      expect(game.phaseInterceptor.log).toEqual([]);
    });
  });
});
