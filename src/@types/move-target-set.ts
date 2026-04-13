import type { BattlerIndex } from "#enums/battler-index";

export interface MoveTargetSet {
  targets: BattlerIndex[];
  multiple: boolean;
}
