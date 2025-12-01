import { PROMPT_HANDLER_COLOR } from "#constants/colors";
import { UiMode } from "#enums/ui-mode";
import type { GameManager } from "#test/test-utils/game-manager";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import { getEnumStr } from "#test/test-utils/string-utils";
import type { PhaseString } from "#types/phase-types";
import type { AwaitableUiHandler } from "#ui/handlers/awaitable-ui-handler";
import type { UI } from "#ui/ui";
import chalk from "chalk";
import { vi } from "vitest";

interface UIPrompt {
  /** The {@linkcode PhaseString | name} of the Phase during which to execute the callback. */
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
   * If `true`, restricts the prompt to only activate when the current {@linkcode AwaitableUiHandler} is waiting for input.
   * @defaultValue `false`
   */
  awaitingActionInput: boolean;
}

/**
 * Array of phases that hang whiile waiting for player input.
 * Changing UI modes during these phases will halt the phase interceptor.
 * @todo This is an extremely unintuitive solution that only works on a select few phases
 * and does not account for UI handlers not accepting input
 */
const endBySetMode: readonly PhaseString[] = [
  "CommandPhase",
  "TitlePhase",
  "SelectGenderPhase",
  "SelectStarterPhase",
  "SelectModifierPhase",
  "MysteryEncounterPhase",
  "PostMysteryEncounterPhase",
];

/**
 * Helper class to handle executing prompts upon UI mode changes.
 * @todo Remove once a UI overhaul occurs -
 * using this correctly effectively requires one to know the entire phase heiarchy
 */
export class PromptHandler extends GameManagerHelper {
  /** An array of {@linkcode UIPrompt | prompts} with associated callbacks. */
  private readonly prompts: UIPrompt[] = [];
  /** The original `setModeInternal` function, stored for use in {@linkcode setMode}. */
  private readonly originalSetModeInternal: (typeof this.game.scene.ui)["setModeInternal"];

  /** A {@linkcode NodeJS.Timeout | Timeout} containing an interval used to check prompts. */
  public static runInterval?: NodeJS.Timeout;

  constructor(game: GameManager) {
    super(game);

    this.originalSetModeInternal = this.game.scene.ui["setModeInternal"];
    // `any` assertion needed as we are mocking private property
    vi.spyOn(
      this.game.scene.ui as unknown as Pick<{ setModeInternal: UI["setModeInternal"] }, "setModeInternal">,
      "setModeInternal",
    ).mockImplementation((...args) => this.setMode(args));

    // Set an interval to repeatedly check the current prompt.
    if (PromptHandler.runInterval) {
      throw new Error("Prompt handler run interval was not properly cleared on test end!");
    }
    PromptHandler.runInterval = setInterval(() => this.doPromptCheck());
  }

  /**
   * Helper method to wrap UI mode changing.
   * @param args - Arguments being passed to the original method
   * @returns The original return value.
   * @todo Make this wait for the actual UI mode setting
   */
  private setMode(
    args: Parameters<typeof this.originalSetModeInternal>,
  ): ReturnType<typeof this.originalSetModeInternal> {
    const mode = args[0];

    this.doLog(
      `UI mode changed from ${getEnumStr(UiMode, this.game.scene.ui.getMode())} to ${getEnumStr(UiMode, mode)}!`,
    );
    // TODO: Add `await` to this
    const ret = this.originalSetModeInternal.apply(this.game.scene.ui, args);

    const currentPhase = this.game.scene.phaseManager.getCurrentPhase()?.phaseName!;
    if (endBySetMode.includes(currentPhase)) {
      this.game.phaseInterceptor.checkMode();
    }
    return ret;
  }

  /**
   * Method to perform prompt handling every so often.
   */
  private doPromptCheck(): void {
    if (this.prompts.length === 0) {
      return;
    }

    const prompt = this.prompts[0];

    // remove expired prompts
    if (prompt.expireFn?.()) {
      this.prompts.shift();
      return;
    }

    const currentPhase = this.game.scene.phaseManager.getCurrentPhase().phaseName;
    const currentHandler = this.game.scene.ui.getHandler();
    const mode = this.game.scene.ui.getMode();

    // If the current mode, phase, and handler match the expected values, execute the callback and continue.
    // If not, leave it there.
    if (
      mode === prompt.mode
      && currentPhase === prompt.phaseTarget
      && currentHandler.active
      && !(prompt.awaitingActionInput && !(currentHandler as AwaitableUiHandler)["awaitingActionInput"])
    ) {
      prompt.callback();
      this.prompts.shift();
    }
  }

  /**
   * Queue a callback to be executed on the next UI mode change.
   * This can be used to (among other things) simulate inputs or run callbacks mid-phase.
   * @param phaseTarget - The {@linkcode PhaseString | name} of the Phase during which the callback will be executed
   * @param mode - The {@linkcode UiMode} to wait for
   * @param callback - The callback function to execute
   * @param expireFn - Optional function to determine if the prompt has expired
   * @param awaitingActionInput - If `true`, restricts the prompt to only activate when the current {@linkcode AwaitableUiHandler} is waiting for input; default `false`
   * @remarks
   * If multiple prompts are queued up in succession, each will be checked in turn **until the first prompt that neither expires nor matches**.
   * @todo Review all uses of this function to check if they can be made synchronous
   * and if `AwaitableUiHandler`s can be stubbed to always be active
   */
  public addToNextPrompt(
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
   * Wrapper function to add coloration to phase logs.
   * @param args - Arguments to original logging function
   */
  // TODO: Move this to colors.ts & change color after mock console PR
  private doLog(...args: unknown[]): void {
    console.log(chalk.hex(PROMPT_HANDLER_COLOR)(...args));
  }
}
