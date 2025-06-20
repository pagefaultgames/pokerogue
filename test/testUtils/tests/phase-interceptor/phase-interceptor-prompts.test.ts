import type { PhaseString } from "#app/@types/phase-types";
import { globalScene } from "#app/global-scene";
import AwaitableUiHandler from "#app/ui/awaitable-ui-handler";
import UI from "#app/ui/ui";
import type UiHandler from "#app/ui/ui-handler";
import type { Constructor } from "#app/utils/common";
import { UiMode } from "#enums/ui-mode";
import GameManager from "#test/testUtils/gameManager";
import { mockPhase } from "#test/testUtils/mocks/mock-phase";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi, type Mock, type MockInstance } from "vitest";

class testDialogueUiPhase extends mockPhase {
  public readonly phaseName = "testDialogueUiPhase";
  override start() {
    void globalScene.ui.setMode(UiMode.TEST_DIALOGUE).then(() => this.end());
  }
}

class titleUiPhase extends mockPhase {
  public readonly phaseName = "titleUiPhase";
  override start() {
    void globalScene.ui.setMode(UiMode.TITLE).then(() => this.end());
  }
}

class dualUiPhase extends mockPhase {
  public readonly phaseName = "dualUiPhase";
  override start() {
    void globalScene.ui
      .setMode(UiMode.TEST_DIALOGUE)
      .then(() => globalScene.ui.setMode(UiMode.TEST_DIALOGUE))
      .then(() => this.end());
  }
}

class argsUiPhase extends mockPhase {
  public readonly phaseName = "argsUiPhase";
  override start() {
    void globalScene.ui.setMode(UiMode.TEST_DIALOGUE, 1, 2, 3, 4, 5).then(() => this.end());
  }
}

describe("Utils - Phase Interceptor - Prompts", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  /** Mock for the **original** `setModeInternal` UI function. */
  let setModeInternal: MockInstance<(typeof game.phaseInterceptor)["originalSetModeInternal"]>;
  /** Mock for the **wrapped** `setMode` phase interceptor function. */
  let setModeHelper: MockInstance<(typeof game.phaseInterceptor)["setMode"]>;

  let callback1: Mock;
  let callback2: Mock;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    // Mock the default `setModeInternal` implementation to avoid calling actual UI code.
    setModeInternal = vi
      .spyOn(game.phaseInterceptor as any, "originalSetModeInternal")
      .mockImplementation(async (..._args) => {})
      .mockName("setModeInternal exterior mock");

    setModeHelper = vi
      .spyOn(game.phaseInterceptor as any, "setMode")
      .mockName("setMode function from phaseInterceptor");

    callback1 = vi.fn(() => console.log("callback 1 called!")).mockName("callback 1");
    callback2 = vi.fn(() => console.log("callback 2 called!")).mockName("callback 2");

    setPhases(testDialogueUiPhase, titleUiPhase, dualUiPhase);
    // Stub out the default UI handler to always be active unless otherwise specified.
    vi.spyOn(game.scene.ui, "getHandler").mockReturnValue({
      active: true,
    } as unknown as UiHandler);
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

  function onNextPrompt(
    target: string,
    mode: UiMode,
    callback: () => void,
    expireFn?: () => boolean,
    awaitingActionInput = false,
  ) {
    game.onNextPrompt(target as unknown as PhaseString, mode, callback, expireFn, awaitingActionInput);
  }

  it("should trigger and remove prompts when the given UIMode is reached", async () => {
    onNextPrompt("testDialogueUiPhase", UiMode.TEST_DIALOGUE, () => callback1());
    console.log(vi.isMockFunction(UI.prototype["setModeInternal"]));

    await to("testDialogueUiPhase");
    // Order: helper --> original function --> callback
    expect(callback1).toHaveBeenCalledAfter(setModeInternal, true);
    expect(setModeInternal).toHaveBeenCalledAfter(setModeHelper, true);
    expect(game.phaseInterceptor["prompts"]).toHaveLength(0);
  });

  it("should pass along original function arguments to set mode", async () => {
    setPhases(argsUiPhase); // passes 1, 2, 3, 4, 5 as extra args
    console.log(vi.isMockFunction(UI.prototype["setModeInternal"]));

    await to("argsUiPhase");

    expect(setModeHelper).toHaveBeenCalledExactlyOnceWith(setModeInternal.mock.calls[0][0]);
  });

  it("should skip running callback if wrong ui mode", async () => {
    onNextPrompt("testDialogueUiPhase", UiMode.TITLE, () => callback1());
    onNextPrompt("testDialogueUiPhase", UiMode.TEST_DIALOGUE, () => callback2());
    console.log(vi.isMockFunction(UI.prototype["setModeInternal"]));

    await to("testDialogueUiPhase");
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
    expect(game.phaseInterceptor["prompts"]).toHaveLength(1);
  });

  it("should skip callback if wrong phase", async () => {
    onNextPrompt("titleUiPhase", UiMode.TEST_DIALOGUE, () => callback1());
    console.log(vi.isMockFunction(UI.prototype["setModeInternal"]));

    await to("testDialogueUiPhase");
    expect(callback1).not.toHaveBeenCalled();
    expect(game.phaseInterceptor["prompts"]).toHaveLength(1);
  });

  it("should skip callback if current UI handler is inactive", async () => {
    vi.spyOn(game.scene.ui, "getHandler").mockReturnValue({
      active: false,
    } as unknown as UiHandler);
    onNextPrompt("testDialogueUiPhase", UiMode.TEST_DIALOGUE, () => callback1());

    await to("testDialogueUiPhase");
    expect(callback1).not.toHaveBeenCalled();
    expect(game.phaseInterceptor["prompts"]).toHaveLength(1);
  });

  it("should skip callback if current UI handler is not awaiting input when expected", async () => {
    vi.spyOn(game.scene.ui, "getHandler").mockReturnValue({
      active: true,
      awaitingActionInput: false,
      __proto__: AwaitableUiHandler.prototype,
    } as unknown as AwaitableUiHandler);
    onNextPrompt("testDialogueUiPhase", UiMode.TEST_DIALOGUE, () => callback1(), undefined, true);

    await to("testDialogueUiPhase");
    expect(callback1).not.toHaveBeenCalled();
    expect(game.phaseInterceptor["prompts"]).toHaveLength(1);
  });

  it("should remove prompts with expiry conditions met", async () => {
    onNextPrompt(
      "titleUiPhase",
      UiMode.TITLE,
      () => callback1(),
      () => true,
    );
    onNextPrompt("titleUiPhase", UiMode.TITLE, () => callback2());

    await to("titleUiPhase");
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledOnce();
    expect(game.phaseInterceptor["prompts"]).toHaveLength(0);
  });

  it("should work if multiple UIMode changes occur in 1 phase", async () => {
    onNextPrompt("dualUiPhase", UiMode.TEST_DIALOGUE, () => callback1());
    onNextPrompt("dualUiPhase", UiMode.TEST_DIALOGUE, () => callback2());

    await to("dualUiPhase");
    expect(callback2).toHaveBeenCalledAfter(callback1, true);
  });
});
