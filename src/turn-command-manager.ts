import type { BattlerIndex } from "#enums/battler-index";
import type { Mutable } from "#types/type-helpers";

// TODO: Add more methods and move `lastTurnOrder` here
export class TurnCommandManager {
  /** A preset order of `BattlerIndex`es, used by tests and MEs to fix turn order. */
  public readonly setOrder: BattlerIndex[] | undefined;

  public setTurnOrder(order: BattlerIndex[]): void {
    (this as Mutable<this>).setOrder = order;
  }
}
