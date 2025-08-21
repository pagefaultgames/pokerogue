import type { PhaseString } from "#app/@types/phase-types";
import type { BattleScene } from "#app/battle-scene";
import type { Phase } from "#app/phase";
import type { Constructor } from "#app/utils/common";
import { UiMode } from "#enums/ui-mode";
// biome-ignore-start lint/correctness/noUnusedImports: TSDoc imports
import type { GameManager } from "#test/test-utils/game-manager";
import type { PromptHandler } from "#test/test-utils/helpers/prompt-handler";
// biome-ignore-end lint/correctness/noUnusedImports: TSDoc imports
import { format } from "util";
import chalk from "chalk";
import { vi } from "vitest";

/**
 * A Set containing phase names that will not be shown in the console when started.
 *
 * Used to reduce console noise from very repetitive phases.
 */
const blacklistedPhaseNames: ReadonlySet<PhaseString> = new Set(["ActivatePriorityQueuePhase"]);

/**
 * The interceptor's current state.
 * Possible values are the following:
 * - `running`: The interceptor is currently running a phase.
 * - `interrupted`: The interceptor has been interrupted by a UI prompt or similar mechanism,
 *    and is currently waiting for the current phase to end.
 * - `idling`: The interceptor is not currently running a phase and is ready to start a new one.
 */
type StateType = "running" | "interrupted" | "idling";

/**
 * The PhaseInterceptor is a wrapper around the `BattleScene`'s {@linkcode PhaseManager}.
 * It allows tests to exert finer control over the phase system, providing logging, manual advancing, and other helpful utilities.
 */
export class PhaseInterceptor {
  private scene: BattleScene;
  /**
   * A log containing all phases having been executed in FIFO order. \
   * Entries are appended each time {@linkcode run} is called, and can be cleared manually with {@linkcode clearLogs}.
   */
  public log: PhaseString[] = [];
  /**
   * The interceptor's current state.
   * Possible values are the following:
   * - `running`: The interceptor is currently running a phase.
   * - `interrupted`: The interceptor has been interrupted by a UI prompt and is waiting for the caller to end it.
   * - `idling`: The interceptor is not currently running a phase and is ready to start a new one.
   */
  private state: StateType = "idling";

  private target: PhaseString;

  /**
   * Constructor to initialize the scene and properties, and to start the phase handling.
   * @param scene - The scene to be managed
   */
  constructor(scene: BattleScene) {
    this.scene = scene;
    // Mock the private startCurrentPhase method to toggle `isRunning` rather than actually starting anything
    vi.spyOn(this.scene.phaseManager as any, "startCurrentPhase").mockImplementation(() => {
      this.state = "idling";
    });
  }

  /**
   * Method to transition to a target phase.
   * @param target - The name of the {@linkcode Phase} to transition to
   * @param runTarget - Whether or not to run the target phase before resolving; default `true`
   * @returns A Promise that resolves once {@linkcode target} has been reached.
   * @todo remove `Constructor` from type signature in favor of phase strings
   * @remarks
   * This will not resolve for *any* reason until the target phase has been reached.
   * @example
   * await game.phaseInterceptor.to("MoveEffectPhase", false);
   */
  public async to(target: PhaseString | Constructor<Phase>, runTarget = true): Promise<void> {
    this.target = typeof target === "string" ? target : (target.name as PhaseString);

    const pm = this.scene.phaseManager;

    // TODO: remove bangs once signature is updated
    let currentPhase: Phase = pm.getCurrentPhase()!;

    let didLog = false;

    // NB: This has to use an interval to wait for UI prompts to activate.
    // TODO: Rework after UI rework
    await vi.waitUntil(
      async () => {
        // If we were interrupted by a UI prompt, we assume that the calling code will queue inputs to
        // end the current phase manually, so we just wait for the phase to end from the caller.
        if (this.state === "interrupted") {
          if (!didLog) {
            this.doLog("PhaseInterceptor.to: Waiting for phase to end after being interrupted!");
            didLog = true;
          }
          return false;
        }

        currentPhase = pm.getCurrentPhase()!;
        // TODO: Remove proof-of-concept error throw after signature update
        if (!currentPhase) {
          throw new Error("currentPhase is null after being started!");
        }

        if (currentPhase.is(this.target)) {
          return true;
        }

        // Current phase is different; run and wait for it to finish.
        await this.run(currentPhase);
        return false;
      },
      { interval: 0, timeout: 20_000 },
    );

    // We hit the target; run as applicable and wrap up.
    if (!runTarget) {
      this.doLog(`PhaseInterceptor.to: Stopping before running ${this.target}`);
      return;
    }

    await this.run(currentPhase);
    this.doLog(
      `PhaseInterceptor.to: Stopping ${this.state === "interrupted" ? `after reaching UiMode.${UiMode[this.scene.ui.getMode()]} during` : "on completion of"} ${this.target}`,
    );
  }

  /**
   * Internal wrapper method to start a phase and wait until it finishes.
   * @param currentPhase - The {@linkcode Phase} to run
   * @returns A Promise that resolves when the phase has completed running.
   */
  private async run(currentPhase: Phase): Promise<void> {
    try {
      this.state = "running";
      this.logPhase(currentPhase.phaseName);
      currentPhase.start();
      await vi.waitUntil(
        () => this.state !== "running",
        { interval: 50, timeout: 20_000 }, // TODO: Figure out an appropriate timeout for individual phases
      );
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error(
            `Unknown error occurred while running phase ${currentPhase.phaseName}!\nError: ${format("%O", error)}`,
          );
    }
  }

  /**
   * If this is at the target phase, unlock the interceptor and
   * return control back to the caller once the calling phase has finished.
   * @remarks
   * This should not be called by anything other than {@linkcode PromptHandler}.
   */
  public checkMode(): void {
    const currentPhase = this.scene.phaseManager.getCurrentPhase()!;
    if (!currentPhase.is(this.target) || this.state === "interrupted") {
      // Wrong phase / already interrupted = do nothing
      return;
    }

    // Interrupt the phase and return control to the caller
    this.state = "interrupted";
  }

  /**
   * Skip the next upcoming phase.
   * @throws Error if currently running a phase.
   * @remarks
   * This function should be used for skipping phases _not yet started_.
   * To end ones already in the process of running, use {@linkcode GameManager.endPhase}.
   * @example
   * await game.phaseInterceptor.to("LoginPhase", false);
   * game.phaseInterceptor.shiftPhase();
   */
  public shiftPhase(): void {
    const phaseName = this.scene.phaseManager.getCurrentPhase()!.phaseName;
    if (this.state !== "idling") {
      throw new Error(`shiftPhase attempted to skip phase ${phaseName} mid-execution!`);
    }
    this.doLog(`Skipping current phase ${phaseName}`);
    this.scene.phaseManager.shiftPhase();
  }

  /**
   * Deprecated no-op function.
   *
   * This was previously used to reset timers created using `setInterval` to wait for phase end
   * and undo various method stubs upon a test ending. \
   * However, since we now use {@linkcode vi.waitUntil} and {@linkcode vi.spyOn} to perform these tasks
   * respectively, this function has become no longer needed.
   * @deprecated This is no longer needed and will be removed in a future PR
   */
  public restoreOg() {}

  /**
   * Method to log the start of a phase.
   * @param phaseName - The name of the phase to log.
   */
  private logPhase(phaseName: PhaseString) {
    if (!blacklistedPhaseNames.has(phaseName)) {
      console.log(`%cStart Phase: ${phaseName}`, "color:green");
    }
    this.log.push(phaseName);
  }

  /**
   * Clear all prior phase logs.
   */
  public clearLogs(): void {
    this.log = [];
  }

  /**
   * Wrapper function to add coral coloration to phase logs.
   * @param args - Arguments to original logging function.
   */
  private doLog(...args: unknown[]): void {
    console.log(chalk.hex("#ff7f50")(...args));
  }
}
