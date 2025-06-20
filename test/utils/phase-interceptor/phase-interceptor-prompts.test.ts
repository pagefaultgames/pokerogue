import type { PhaseString } from "#app/@types/phase-types";
import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import type { Constructor } from "#app/utils/common";
import { UiMode } from "#enums/ui-mode";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

abstract class mockPhase extends Phase {
  public override readonly phaseName: any;

  override start() {
    this.end();
  }
}

class testDialogueUiPhase extends mockPhase {
  public readonly phaseName = "testDialogueUiPhase";
  override start() {
    void globalScene.ui.setMode(UiMode.TEST_DIALOGUE);
    super.start();
  }
}

class titleUiPhase extends mockPhase {
  public readonly phaseName = "titleUiPhase";
  override start() {
    void globalScene.ui.setMode(UiMode.TITLE);
    super.start();
  }
}

class dualUiPhase extends mockPhase {
  public readonly phaseName = "dualUiPhase";
  override start() {
    void globalScene.ui.setMode(UiMode.TEST_DIALOGUE);
    void globalScene.ui.setMode(UiMode.TEST_DIALOGUE);
    super.start();
  }
}

class argsUiPhase extends mockPhase {
  public readonly phaseName = "argsUiPhase";
  override start() {
    void globalScene.ui.setMode(UiMode.TEST_DIALOGUE, 1, 2, 3, 4, 5);
    super.start();
  }
}

describe("Utils - Phase Interceptor Prompts", { timeout: 4000 }, () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let setModeInternal: MockInstance<(typeof game.scene.ui)["setModeInternal"]>;
  let setModeHelper: MockInstance<(typeof game.phaseInterceptor)["setMode"]>;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    // Mock the default `setModeInternal` implementation to avoid calling actual UI code (given the distinct lack of handlers).
    setModeInternal = vi.fn(game.scene.ui["setModeInternal"]).mockImplementation(async () => {});
    setModeHelper = vi.fn(game.phaseInterceptor["setMode"]);
    setPhases(testDialogueUiPhase, titleUiPhase, dualUiPhase);
  });

  function setPhases(phase: Constructor<mockPhase>, ...phases: Constructor<mockPhase>[]) {
    game.scene.phaseManager.clearAllPhases();
    game.scene.phaseManager.phaseQueue = [phase, ...phases].map(m => new m());
    game.scene.phaseManager.shiftPhase(); // start the thing going
  }

  /** Wrapper functions to make TS not complain about incompatible argument typing on `PhaseString`. */
  function to(phaseName: string, runTarget = true) {
    return game.phaseInterceptor.to(phaseName as unknown as PhaseString, runTarget);
  }

  function onNextPrompt(target: string, mode: UiMode, callback: () => void, expireFn?: () => boolean) {
    game.onNextPrompt(target as unknown as PhaseString, mode, callback, expireFn);
  }

  it("should wrap and run the specified callback when the given UIMode is reached", async () => {
    const callback = vi.fn();
    onNextPrompt("testDialogueUiPhase", UiMode.TEST_DIALOGUE, () => callback());

    await to("testDialogueUiPhase");
    expect(callback).toHaveBeenCalledAfter(setModeInternal, true);
    expect(setModeInternal).toHaveBeenCalledAfter(setModeHelper, true);
  });

  it("should pass along arguments from the original function to the set mode", async () => {
    setPhases(argsUiPhase); // passes 1, 2, 3, 4, 5 as args

    await to("testDialogueUiPhase");
    expect(setModeHelper.mock.calls[0][1]).toEqual(setModeInternal.mock.calls[0][1]);
    expect(setModeInternal).toHaveBeenCalledWith(setModeHelper, true);
  });

  it("should not run callback if wrong ui mode", async () => {
    const callback = vi.fn();
    onNextPrompt("testDialogueUiPhase", UiMode.TITLE, () => callback());

    await to("testDialogueUiPhase");
    expect(callback).not.toHaveBeenCalled();
  });

  it("should not run callback if wrong phase", async () => {
    const callback = vi.fn();
    onNextPrompt("titleUiPhase", UiMode.TEST_DIALOGUE, () => callback());

    await to("testDialogueUiPhase");
    expect(callback).not.toHaveBeenCalled();
  });

  it("should work if multiple ui mode sets occur in 1 phase", async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    onNextPrompt("dualUiPhase", UiMode.TEST_DIALOGUE, () => callback1());
    onNextPrompt("dualUiPhase", UiMode.TEST_DIALOGUE, () => callback2());

    await to("dualUiPhase");
    expect(callback2).toHaveBeenCalledAfter(callback1, true);
  });
});
