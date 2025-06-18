import type BattleScene from "#app/battle-scene";
import type { Phase } from "#app/phase";
import { UiMode } from "#enums/ui-mode";
import UI from "#app/ui/ui";
import type { PhaseString } from "#app/@types/phase-types";
import { vi } from "vitest";

interface PromptHandler {
  phaseTarget?: PhaseString;
  mode?: UiMode;
  callback?: () => void;
  expireFn?: () => boolean;
  awaitingActionInput?: boolean;
}

/** Array of phases which end via player input. */
const endBySetMode: Set<PhaseString> = new Set([
  "TitlePhase",
  "SelectGenderPhase",
  "CommandPhase",
  "SelectModifierPhase",
  "MysteryEncounterPhase",
  "PostMysteryEncounterPhase",
]);

/**
 * The PhaseInterceptor is a wrapper around the `BattleScene`'s {@linkcode PhaseManager}.
 * It allows tests to exert finer control over the phase system, providing logging,
 */
export default class PhaseInterceptor {
  private scene: BattleScene;
  /** A log of phases having been executed. */
  public log: PhaseString[] = [];
  private promptInterval: NodeJS.Timeout;
  private intervalRun: NodeJS.Timeout;
  // TODO: Move prompts to a separate class
  private prompts: PromptHandler[] = [];

  /**
   * Constructor to initialize the scene and properties, and to start the phase handling.
   * @param scene - The scene to be managed.
   */
  constructor(scene: BattleScene) {
    this.scene = scene;
    this.initMocks();
    this.startPromptHandler();
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
    const originalSetMode = UI.prototype.setMode;
    vi.spyOn(UI.prototype, "setMode").mockImplementation((mode, ...args) =>
      this.setMode(originalSetMode, mode, ...args),
    );

    // Mock the private startCurrentPhase method to do nothing to let us
    // handle starting phases manually in the `run` method.
    vi.fn(this.scene.phaseManager["startCurrentPhase"]).mockImplementation(() => {});
  }

  /**
   * Method to start the prompt handler.
   */
  private startPromptHandler() {
    this.promptInterval = setInterval(() => {
      const actionForNextPrompt = this.prompts[0] as PromptHandler | undefined;
      if (!actionForNextPrompt) {
        return;
      }
      const expireFn = actionForNextPrompt.expireFn?.();
      const currentMode = this.scene.ui.getMode();
      const currentPhase = this.scene.phaseManager.getCurrentPhase()?.phaseName;
      const currentHandler = this.scene.ui.getHandler();
      if (expireFn) {
        this.prompts.shift();
      } else if (
        currentMode === actionForNextPrompt.mode &&
        currentPhase === actionForNextPrompt.phaseTarget &&
        currentHandler.active &&
        (!actionForNextPrompt.awaitingActionInput || currentHandler["awaitingActionInput"])
      ) {
        const prompt = this.prompts.shift();
        if (prompt?.callback) {
          prompt.callback();
        }
      }
    });
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
   * @returns A promise that resolves when the transition is complete.
   */
  public async to(targetPhase: PhaseString, runTarget = true): Promise<void> {
    this.intervalRun = setInterval(async () => {
      const currentPhase = this.scene.phaseManager.getCurrentPhase();
      if (!currentPhase) {
        console.log("No phases left to run; resolving.");
        return;
      }

      if (!currentPhase.is(targetPhase)) {
        // Current phase is different; run and wait for it to finish
        await this.run(currentPhase);
        return;
      }

      // target phase reached; run as applicable and resolve
      clearInterval(this.intervalRun);
      if (!runTarget) {
        console.log(`PhaseInterceptor.to: Stopping on run of ${targetPhase}`);
        this.scene.phaseManager.unshiftPhase(currentPhase);
        return;
      }
      await this.run(currentPhase);
      return;
    });
  }

  /**
   * Method to run a phase with an optional skip function.
   * @param phaseTarget - The {@linkcode Phase} to run.
   * @returns A Promise that resolves when the phase is run.
   */
  private async run(phaseTarget: Phase): Promise<void> {
    const currentPhase = this.scene.phaseManager.getCurrentPhase();
    if (!currentPhase?.is(phaseTarget.phaseName)) {
      throw new Error(
        `Wrong phase passed to PhaseInterceptor.run;\nthis is ${currentPhase?.phaseName} and not ${phaseTarget.phaseName}`,
      );
    }

    try {
      this.logPhase(currentPhase.phaseName);
      currentPhase.start();
    } catch (error: unknown) {
      throw error instanceof Error
        ? error
        : new Error(`Unknown error ${error} occurred while running phase ${currentPhase?.phaseName}!`);
    }
  }

  /** Alias for {@linkcode PhaseManager.shiftPhase()} */
  shiftPhase() {
    return this.scene.phaseManager.shiftPhase();
  }

  /**
   * Method to set mode.
   * @param originalSetMode - The original setMode method from the UI.
   * @param mode - The {@linkcode UiMode} to set.
   * @param args - Additional arguments to pass to the original method.
   */
  private async setMode(originalSetMode: typeof UI.prototype.setMode, mode: UiMode, ...args: unknown[]): Promise<void> {
    const currentPhase = this.scene.phaseManager.getCurrentPhase();
    console.log("setMode", `${UiMode[mode]} (=${mode})`, args);
    const ret = originalSetMode.apply(this.scene.ui, [mode, ...args]);
    if (currentPhase && endBySetMode.has(currentPhase.phaseName)) {
      await this.run(currentPhase);
    }
    return ret;
  }

  /**
   * Method to add an action to the next prompt.
   * @param phaseTarget - The target phase for the prompt.
   * @param mode - The mode of the UI.
   * @param callback - The callback function to execute.
   * @param expireFn - The function to determine if the prompt has expired.
   * @param awaitingActionInput
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
    clearInterval(this.promptInterval);
    clearInterval(this.intervalRun);
  }
}
