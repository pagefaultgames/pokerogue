import type { PhaseString } from "#app/@types/phase-types";
import type { BattleScene } from "#app/battle-scene";
import { PHASE_INTERCEPTOR_COLOR, PHASE_START_COLOR } from "#app/constants/colors";
import type { Phase } from "#app/phase";
import { UiMode } from "#enums/ui-mode";
import type { GameManager } from "#test/test-utils/game-manager";
import type { PromptHandler } from "#test/test-utils/helpers/prompt-handler";
import { inspect } from "util";
import chalk from "chalk";
import { vi } from "vitest";
import { getEnumStr } from "./string-utils";

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
  private readonly scene: BattleScene;
  /**
   * A log containing all phases having been executed in FIFO order. \
   * Entries are appended each time {@linkcode run} is called, and can be cleared manually with {@linkcode clearLogs}.
   */
  public readonly log: PhaseString[] = [];
  /**
   * The interceptor's current state.
   * @see {@linkcode StateType}
   * @defaultValue `idling`
   */
  private state: StateType = "idling";
  /** The current target that is being ran to. */
  private target: PhaseString;

  /**
   * Initialize a new PhaseInterceptor.
   * @param scene - The scene to be managed
   * @remarks
   * This overrides {@linkcode PhaseManager.startCurrentPhase} to toggle the interceptor's state
   * instead of immediately starting the next phase.
   */
  // TODO: This should take a `GameManager` instance once multi-scene things become a reality
  // (though our entire Phase system will likely have to be redone anyways)
  constructor(scene: BattleScene) {
    this.scene = scene;
    // Persistently stub out `this.scene.phaseManager.getCurrentPhase`
    // to toggle the interceptor's state (rather than starting a new phase).
    // We do not use `vi.spyOn` as that will reset once the test ends
    this.scene.phaseManager["startCurrentPhase"] = () => {
      this.state = "idling";
    };
  }

  /**
   * Method to transition to a target phase.
   * @param target - The name of the {@linkcode Phase} to transition to
   * @param runTarget - Whether or not to run the target phase before resolving; default `true`
   * @returns A Promise that resolves once `target` has been reached.
   * @remarks
   * This will not resolve for _any_ reason until the target phase has been reached.
   * @example
   * ```ts
   * await game.phaseInterceptor.to("MoveEffectPhase", false);
   * ```
   */
  public async to(target: PhaseString, runTarget = true): Promise<void> {
    this.target = target;

    const pm = this.scene.phaseManager;

    let currentPhase = pm.getCurrentPhase();
    let didLog = false;

    // NB: This has to use an interval to wait for UI prompts to activate
    // since our UI code effectively stalls when waiting for input.
    // This entire function can likely be made synchronous once UI code is moved to a separate scene.
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

        currentPhase = pm.getCurrentPhase();
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
      `PhaseInterceptor.to: Stopping ${this.state === "interrupted" ? `after reaching ${getEnumStr(UiMode, this.scene.ui.getMode())} during` : "on completion of"} ${this.target}`,
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
        : new Error(`Unknown error occurred while running phase ${currentPhase.phaseName}!\nError: ${inspect(error)}`);
    }
  }

  /**
   * If this is at the target phase, unlock the interceptor and
   * return control back to the caller once the calling phase has finished.
   * @remarks
   * This should not be called by anything other than {@linkcode PromptHandler}.
   */
  public checkMode(): void {
    const currentPhase = this.scene.phaseManager.getCurrentPhase();
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
   * game.phaseInterceptor.shiftPhase(); // skips LoginPhase without starting it
   */
  public shiftPhase(): void {
    const phaseName = this.scene.phaseManager.getCurrentPhase().phaseName;
    if (this.state !== "idling") {
      throw new Error(`PhaseInterceptor.shiftPhase attempted to skip phase ${phaseName} mid-execution!`);
    }
    this.doLog(`Skipping current phase: ${phaseName}`);
    this.scene.phaseManager.shiftPhase();
  }

  /**
   * Method to log the start of a phase.
   * Called in place of {@linkcode PhaseManager.startCurrentPhase} to allow for manual intervention.
   * @param phaseName - The name of the phase to log
   */
  private logPhase(phaseName: PhaseString): void {
    console.log(`%cStart Phase: ${phaseName}`, `color:${PHASE_START_COLOR}`);
    this.log.push(phaseName);
  }

  /**
   * Clear all prior phase logs.
   */
  public clearLogs(): void {
    this.log.splice(0, this.log.length);
  }

  /**
   * Wrapper function to add coral coloration to phase logs.
   * @param args - Arguments to original logging function
   */
  private doLog(...args: unknown[]): void {
    console.log(chalk.hex(PHASE_INTERCEPTOR_COLOR)(...args));
  }
}
