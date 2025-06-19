import type BattleScene from "#app/battle-scene";
import type { Phase } from "#app/phase";
import { UiMode } from "#enums/ui-mode";
import UI from "#app/ui/ui";
import type { PhaseString } from "#app/@types/phase-types";
import { vi, type MockInstance } from "vitest";
import { format } from "util";

interface PromptHandler {
  phaseTarget: PhaseString;
  mode: UiMode;
  callback: () => void;
  expireFn?: () => boolean;
  awaitingActionInput: boolean;
}

/**
 * The PhaseInterceptor is a wrapper around the `BattleScene`'s {@linkcode PhaseManager}.
 * It allows tests to exert finer control over the phase system, providing logging, manual advancing, etc etc.
 */
export default class PhaseInterceptor {
  private scene: BattleScene;
  /** A log of phases having been executed. */
  public log: PhaseString[] = [];
  private prompts: PromptHandler[] = [];

  /**
   * Constructor to initialize the scene and properties, and to start the phase handling.
   * @param scene - The scene to be managed.
   */
  constructor(scene: BattleScene) {
    this.scene = scene;
    this.initMocks();
  }

  /**
   * Clears phase logs
   */
  clearLogs() {
    this.log = [];
  }

  /**
   * Method to initialize various mocks for intercepting phases.
   */
  initMocks() {
    const originalSetMode = UI.prototype["setModeInternal"];
    // `any` assertion needed as we are mocking private property
    const uiSpy = vi.spyOn(UI.prototype as any, "setModeInternal") as MockInstance<
      (typeof UI.prototype)["setModeInternal"]
    >;
    uiSpy.mockImplementation(async (...args) => {
      this.setMode(originalSetMode, args);
    });

    // Mock the private startCurrentPhase method to do nothing to let us
    // start them manually ourselves.
    vi.spyOn(this.scene.phaseManager as any, "startCurrentPhase").mockImplementation(() => {});
  }

  /**
   * Method to log the start of a phase.
   * @param phaseName - The name of the phase to log.
   */
  private logPhase(phaseName: PhaseString) {
    // Exclude normal green highlighting due to issues with consoles
    console.log(`Start Phase ${phaseName}`);
    this.log.push(phaseName);
  }

  /**
   * Method to transition to a target phase.
   * @param targetPhase - The name of the phase to transition to.
   * @param runTarget - Whether or not to run the target phase; default `true`.
   * @returns A Promise that resolves when the target phase is reached.
   */
  public async to(targetPhase: PhaseString, runTarget = true): Promise<void> {
    const pm = this.scene.phaseManager;
    let currentPhase = pm.getCurrentPhase();
    while (!currentPhase?.is(targetPhase)) {
      if (!currentPhase) {
        console.log("Reached end of phases without hitting target; resolving.");
        return;
      }

      // Current phase is different; run and wait for it to finish
      await this.run(currentPhase);
      currentPhase = pm.getCurrentPhase();
    }

    // We hit the target; run as applicable and wrap up.
    if (!runTarget) {
      console.log(`PhaseInterceptor.to: Stopping on run of ${targetPhase}`);
      return;
    }

    await this.run(currentPhase);
  }

  /**
   * Wrapper method to run a phase and start the next phase.
   * @param currentPhase - The {@linkcode Phase} to run.
   * @returns A Promise that resolves when the phase is run.
   */
  private async run(currentPhase: Phase): Promise<void> {
    try {
      this.logPhase(currentPhase.phaseName);
      currentPhase.start();
    } catch (error: unknown) {
      throw error instanceof Error
        ? error
        : new Error(
            `Unknown error occurred while running phase ${currentPhase.phaseName}!\nError: ${format("%O", error)}`,
          );
    }
  }

  /** Alias for {@linkcode PhaseManager.shiftPhase()}. */
  shiftPhase() {
    console.log(`Skipping current phase ${this.scene.phaseManager.getCurrentPhase()?.phaseName}`);
    return this.scene.phaseManager.shiftPhase();
  }

  /**
   * Method to override UI mode setting with custom prompt support.
   * @param originalSetMode - The original setMode method from the UI.
   * @param mode - The {@linkcode UiMode} to set.
   * @param args - Additional arguments to pass to the original method.
   */
  private async setMode(
    originalSetMode: (typeof UI.prototype)["setModeInternal"],
    args: Parameters<(typeof UI.prototype)["setModeInternal"]>,
  ): ReturnType<(typeof UI.prototype)["setModeInternal"]> {
    const mode = args[0];

    console.log("setMode", `${UiMode[mode]} (=${mode})`, args);
    const ret = originalSetMode.apply(this.scene.ui, [args]);
    this.doPromptCheck(mode);
    return ret;
  }

  /**
   * Method to start the prompt handler.
   */
  private doPromptCheck(uiMode: UiMode) {
    const actionForNextPrompt = this.prompts[0] as PromptHandler | undefined;
    if (!actionForNextPrompt) {
      return;
    }

    // Check for prompt expiry, removing prompt if applicable.
    if (actionForNextPrompt.expireFn?.()) {
      this.prompts.shift();
      return;
    }

    // Check if the current mode, phase, and handler match the expected values.
    // If not, we just skip and wait.
    // TODO: Should this check all prompts or only the first one?
    const currentPhase = this.scene.phaseManager.getCurrentPhase()?.phaseName;
    const currentHandler = this.scene.ui.getHandler();
    if (
      uiMode === actionForNextPrompt.mode ||
      currentPhase !== actionForNextPrompt.phaseTarget ||
      !currentHandler.active ||
      (actionForNextPrompt.awaitingActionInput && !currentHandler["awaitingActionInput"])
    ) {
      return;
    }

    // Prompt matches; perform callback as applicable and return
    this.prompts.shift();
    actionForNextPrompt.callback();
  }

  /**
   * Method to add a callback to the next prompt.
   * @param phaseTarget - The {@linkcode PhaseString | name} of the Phase to execute the callback during.
   * @param mode - The {@linkcode UIMode} to wait for.
   * @param callback - The callback function to execute.
   * @param expireFn - The function to determine if the prompt has expired.
   * @param awaitingActionInput - If `true`, will only activate when the current UI handler is waiting for input; default `false`
   */
  addToNextPrompt(
    phaseTarget: PhaseString,
    mode: UiMode,
    callback: () => void,
    expireFn?: () => boolean,
    awaitingActionInput = false,
  ) {
    this.prompts.push({
      phaseTarget,
      mode,
      callback,
      expireFn,
      awaitingActionInput,
    });
  }

  /**
   * Restores the original state of phases and clears intervals.
   */
  restoreOg() {
    // clearInterval(this.promptInterval);
    // clearInterval(this.intervalRun);
  }
}
