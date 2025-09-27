import type { FieldBattlerIndex } from "#enums/battler-index";

// TODO: Add more methods and move `lastTurnOrder` here
/** A manager for the commands and moves used in the current battle. */
export class TurnCommandManager {
  /**
   * A preset order of `BattlerIndex`es, used by tests and MEs to "fix" speed order-related effects.
   */
  // TODO: Add a way to specify "partial" ordering of Pokemon
  public setOrder: readonly FieldBattlerIndex[] | undefined;

  /** Reset a prior set turn order. */
  public resetTurnOrder(): void {
    this.setOrder = undefined;
  }
}
