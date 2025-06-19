import type { PhaseString } from "#app/@types/phase-types";
import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import type { Constructor } from "#app/utils/common";
import { UiMode } from "#enums/ui-mode";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
    void globalScene.ui.setMode(UiMode.TITLE);
    super.start();
  }
}

describe("Utils - Phase Interceptor Prompts", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    setPhases(testDialogueUiPhase, titleUiPhase, dualUiPhase);
  });

  function setPhases(...phases: Constructor<mockPhase>[]) {
    game.scene.phaseManager.clearAllPhases();
    game.scene.phaseManager.phaseQueue = phases.map(m => new m());
    game.scene.phaseManager.shiftPhase(); // start the thing going
  }

  /** Wrapper function to make TS not complain about `PhaseString` stuff */
  function to(phaseName: string, runTarget = false) {
    return game.phaseInterceptor.to(phaseName as unknown as PhaseString, runTarget);
  }

  function onNextPrompt(target: string, mode: UiMode, callback: () => void, expireFn?: () => boolean) {
    game.onNextPrompt(target as unknown as PhaseString, mode, callback, expireFn);
  }

  it("should run the specified callback when the given ui mode is reached", async () => {
    const callback = vi.fn();
    onNextPrompt("testDialogueUiPhase", UiMode.TEST_DIALOGUE, () => callback());

    await to("testDialogueUiPhase");
    expect(callback).toHaveBeenCalled();
  });

  it("should not run callback if wrong ui mode", async () => {
    const callback = vi.fn();
    onNextPrompt("testDialogueUiPhase", UiMode.TITLE, () => callback());

    await to("testDialogueUiPhase");
    expect(callback).not.toHaveBeenCalled();
  });

  it("should not run callback if wrong phase", async () => {
    const callback = vi.fn();
    onNextPrompt("titleUiPhase", UiMode.TITLE, () => callback());

    await to("testDialogueUiPhase");
    expect(callback).not.toHaveBeenCalled();
  });

  it("should work in succession", async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    onNextPrompt("dualUiPhase", UiMode.TEST_DIALOGUE, () => callback1());
    onNextPrompt("dualUiPhase", UiMode.TITLE, () => callback2());

    await to("dualUiPhase");
    expect(callback1).not.toHaveBeenCalled();
  });
});
