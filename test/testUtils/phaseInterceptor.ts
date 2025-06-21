import type BattleScene from "#app/battle-scene";
import type { Phase } from "#app/phase";
import { UiMode } from "#enums/ui-mode";
import type { PhaseString } from "#app/@types/phase-types";
import { vi, type MockInstance } from "vitest";
import { format } from "util";
import AwaitableUiHandler from "#app/ui/awaitable-ui-handler";
interface PromptHandler {
  /** The {@linkcode PhaseString | name} of the Phase to execute the callback during. */
  phaseTarget: PhaseString;
  /** The {@linkcode UIMode} to wait for. */
  mode: UiMode;
  /** The callback function to execute. */
  callback: () => void;
  /**
   * An optional callback function to determine if the prompt has expired and should be removed.
   * Expired prompts are removed upon the next UI mode change without executing their callback.
   */
  expireFn?: () => boolean;
  /**
   * If `true`, restricts the prompt to only activate when the current UI handler is waiting for input.
   * @defaultValue `false`
   */
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
  /** An array of {@linkcode PromptHandler | prompts} with associated callbacks. */
  private prompts: PromptHandler[] = [];
  /** The original `setModeInternal` function, stored for posterity. */
  private originalSetModeInternal: (typeof this.scene.ui)["setModeInternal"];
  /** Whether we are currently running a phase or not. */
  private isRunning = false;

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
    this.originalSetModeInternal = this.scene.ui["setModeInternal"];
    // `any` assertion needed as we are mocking private property
    const uiSpy = vi.spyOn(this.scene.ui as any, "setModeInternal") as MockInstance<
      (typeof this.scene.ui)["setModeInternal"]
    >;
    uiSpy.mockImplementation(async (...args) => {
      this.setMode(args);
    });

    // Mock the private startCurrentPhase method to toggle `isRunning` rather than actually starting the phase.
    vi.spyOn(this.scene.phaseManager as any, "startCurrentPhase").mockImplementation(() => {
      this.isRunning = false;
    });
  }

  /**
   * Method to log the start of a phase.
   * @param phaseName - The name of the phase to log.
   */
  private logPhase(phaseName: PhaseString) {
    // Exclude normal green highlighting due to issues with consoles not rendering it at all
    console.log(`Start Phase ${phaseName}`);
    this.log.push(phaseName);
  }

  /**
   * Method to transition to a target phase.
   * @param target - The name of the {@linkcode Phase} to transition to.
   * @param runTarget - Whether or not to run the target phase; default `true`.
   * @returns A Promise that resolves when {@linkcode target} has been reached.
   */
  public async to(target: PhaseString, runTarget = true): Promise<void> {
    const pm = this.scene.phaseManager;
    let currentPhase = pm.getCurrentPhase();
    while (!currentPhase?.is(target)) {
      if (!currentPhase) {
        console.log("Reached end of phases without hitting target; resolving.");
        return;
      }

      // Current phase is different; run and wait for it to finish.
      // NB: Putting the `vi.waitUntil` inside `run` causes the test to start the next hook somehow.
      // IDK why so will be keeping this here for now.
      await Promise.all([this.run(currentPhase), vi.waitUntil(() => !this.isRunning, { timeout: 2000 })]);
      currentPhase = pm.getCurrentPhase();
    }

    if (!runTarget) {
      // We hit the target; run as applicable and wrap up.
      console.log(`PhaseInterceptor.to: Stopping on run of ${target}`);
      return;
    }

    await Promise.all([this.run(currentPhase), vi.waitUntil(() => !this.isRunning)]);
  }

  /**
   * Wrapper method to run a phase and wait until it finishes.
   * @param currentPhase - The {@linkcode Phase} to run.
   * @returns A Promise that resolves when the phase is run.
   */
  private run(currentPhase: Phase): Promise<void> {
    return new Promise<void>(resolve => {
      this.isRunning = true;
      this.logPhase(currentPhase.phaseName);
      currentPhase.start();
      resolve();
    }).catch((error: unknown) => {
      throw error instanceof Error
        ? error
        : new Error(
            `Unknown error occurred while running phase ${currentPhase.phaseName}!\nError: ${format("%O", error)}`,
          );
    });
  }

  /**
   * Skip the currently running phase.
   * @throws Error if already running a phase.
   * @remarks
   * This function is used for removing phases _not already started_.
   * To stop ones already in the process of running, use `game.endPhase`.
   */
  shiftPhase() {
    if (this.isRunning) {
      throw new Error("Tried skipping phase while already running one!");
    }
    console.log(`Skipping current phase ${this.scene.phaseManager.getCurrentPhase()?.phaseName}`);
    return this.scene.phaseManager.shiftPhase();
  }

  /**
   * Helper method to wrap UI mode changing with custom prompt support.
   * @param originalSetMode - The original setMode method from the UI. Stored during mock initialization.
   * @param args - Arguments having been passed to the original method.
   */
  private async setMode(
    args: Parameters<(typeof this.scene.ui)["setModeInternal"]>,
  ): ReturnType<(typeof this.scene.ui)["setModeInternal"]> {
    const mode = args[0];

    console.log("setMode", `${UiMode[mode]} (=${mode})`, args.slice(1));
    const ret = await this.originalSetModeInternal.apply(this.scene.ui, [args]);
    this.doPromptCheck(mode);
    return ret;
  }

  /**
   * Method to perform prompt handling upon changing UI modes.
   * @param mode - The {@linkcode UiMode} to set.
   */
  private doPromptCheck(uiMode: UiMode): void {
    const leftoverPrompts: PromptHandler[] = [];
    const currentPhase = this.scene.phaseManager.getCurrentPhase()?.phaseName;
    const currentHandler = this.scene.ui.getHandler();
    for (const prompt of this.prompts) {
      // remove expired prompts
      if (prompt.expireFn?.()) {
        continue;
      }

      // If the current mode, phase, and handler match the expected values, execute the callback.
      // If not, add the prompt to the leftover pile.
      if (
        uiMode === prompt.mode &&
        currentPhase === prompt.phaseTarget &&
        currentHandler.active &&
        !(
          prompt.awaitingActionInput &&
          currentHandler instanceof AwaitableUiHandler &&
          !currentHandler["awaitingActionInput"]
        )
      ) {
        prompt.callback();
      } else {
        leftoverPrompts.push(prompt);
      }
    }

    this.prompts = leftoverPrompts;
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
   * Deprecated no-op function.
   *
   * This was previously used to reset timers created using `setInterval` on test end.
   * However, since we now use mocks created by {@linkcode vi.spyOn}
   * that innately reset on test end, this function has become a no-op.
   * @deprecated This is no longer needed and will be removed very shortly
   */
  restoreOg() {}
}
