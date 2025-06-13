import { applyPostSummonAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import { PostSummonPhase } from "#app/phases/post-summon-phase";
import type { BattlerIndex } from "#enums/battler-index";

/**
 * Helper to {@linkcode PostSummonPhase} which applies abilities
 */
export class PostSummonActivateAbilityPhase extends PostSummonPhase {
  private priority: number;
  private passive: boolean;

  constructor(battlerIndex: BattlerIndex, priority: number, passive: boolean) {
    super(battlerIndex);
    this.priority = priority;
    this.passive = passive;
  }

  start() {
    applyPostSummonAbAttrs("PostSummonAbAttr", this.getPokemon(), this.passive, false);

    this.end();
  }

  public override getPriority() {
    return this.priority;
  }
}
