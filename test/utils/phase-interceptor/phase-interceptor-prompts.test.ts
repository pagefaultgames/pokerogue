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
    void globalScene.ui.setMode(UiMode.TEST_DIALOGUE);
    this.end();
  }
}

class titleUiPhase extends mockPhase {
  public readonly phaseName = "titleUiPhase";
  override start() {
    void globalScene.ui.setMode(UiMode.TITLE);
    this.end();
  }
}

class dualUiPhase extends mockPhase {
  public readonly phaseName = "dualUiPhase";
  override start() {
    void globalScene.ui.setMode(UiMode.TEST_DIALOGUE);
    void globalScene.ui.setMode(UiMode.TEST_DIALOGUE);
    this.end();
  }
}

class argsUiPhase extends mockPhase {
  public readonly phaseName = "argsUiPhase";
  override start() {
    void globalScene.ui.setMode(UiMode.TEST_DIALOGUE, 1, 2, 3, 4, 5);
    this.end();
  }
}

describe("Utils - Phase Interceptor - Prompts", { timeout: 4000 }, () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let setModeInternal: MockInstance<(typeof game.scene.ui)["setModeInternal"]>;
  let setModeHelper: MockInstance<(typeof game.phaseInterceptor)["setMode"]>;

  let callback1: Mock;
  let callback2: Mock;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    // Mock the default `setModeInternal` implementation to avoid calling actual UI code.
    // Done _before_ calling `new GameManager` to ensure the mock gets passed down to the phase interceptor
    setModeInternal = vi.spyOn(UI.prototype as any, "setModeInternal").mockImplementation(async () => {});

    game = new GameManager(phaserGame);
    setModeHelper = vi.spyOn(game.phaseInterceptor as any, "setMode");

    callback1 = vi.fn(() => console.log("callback 1 called!")).mockName("callback 1");
    callback2 = vi.fn(() => console.log("callback 2 called!")).mockName("callback 2");

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

    await to("testDialogueUiPhase");
    expect(callback1).toHaveBeenCalledAfter(setModeInternal, true);
    expect(setModeInternal).toHaveBeenCalledAfter(setModeHelper, true);
    expect(game.phaseInterceptor["prompts"]).toHaveLength(0);
  });

  it("should pass along original function arguments to set mode", async () => {
    setPhases(argsUiPhase); // passes 1, 2, 3, 4, 5 as args

    await to("argsUiPhase");

    expect(setModeHelper.mock.calls[0][1]).toEqual(setModeInternal.mock.calls[0]);
    expect(setModeInternal).toHaveBeenCalledWith(setModeHelper, true);
  });

  it("should not run callback if wrong ui mode", async () => {
    onNextPrompt("testDialogueUiPhase", UiMode.TITLE, () => callback1());

    await to("testDialogueUiPhase");
    expect(callback1).not.toHaveBeenCalled();
    expect(game.phaseInterceptor["prompts"]).toHaveLength(1);
  });

  it("should not run callback if wrong phase", async () => {
    onNextPrompt("titleUiPhase", UiMode.TEST_DIALOGUE, () => callback1());

    await to("testDialogueUiPhase");
    expect(callback1).not.toHaveBeenCalled();
    expect(game.phaseInterceptor["prompts"]).toHaveLength(1);
  });

  it("should not run callback if current UI handler is inactive", async () => {
    vi.spyOn(game.scene.ui, "getHandler").mockReturnValue({
      active: false,
    } as unknown as UiHandler);
    onNextPrompt("testDialogueUiPhase", UiMode.TEST_DIALOGUE, () => callback1());

    await to("testDialogueUiPhase");
    expect(callback1).not.toHaveBeenCalled();
    expect(game.phaseInterceptor["prompts"]).toHaveLength(1);
  });

  it("should not run callback if current UI handler is awaiting input", async () => {
    vi.spyOn(game.scene.ui, "getHandler").mockReturnValue({
      active: true,
      awaitingActionInput: true,
      __proto__: AwaitableUiHandler.prototype,
    } as unknown as AwaitableUiHandler);
    onNextPrompt("testDialogueUiPhase", UiMode.TEST_DIALOGUE, () => callback1());

    await to("testDialogueUiPhase");
    expect(callback1).not.toHaveBeenCalled();
    expect(game.phaseInterceptor["prompts"]).toHaveLength(1);
  });

  it("should be removed regardless of mode/phase if expiry function met", async () => {
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
