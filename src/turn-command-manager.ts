import type { FieldBattlerIndex } from "#enums/battler-index";

// TODO: Add more methods and move `lastTurnOrder` here
/** A manager for the commands and moves used in the current battle. */
export class TurnCommandManager {
  /** A preset order of `BattlerIndex`es, used by tests and MEs to "fix" turn order-related effects. */
  public setOrder: readonly FieldBattlerIndex[] | undefined;
}
