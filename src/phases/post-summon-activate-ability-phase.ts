import { applyAbAttrs } from "#app/data/abilities/apply-ab-attrs";
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
    // TODO: Check with Dean on whether or not passive must be provided to `this.passive`
    applyAbAttrs("PostSummonAbAttr", { pokemon: this.getPokemon(), passive: this.passive });

    this.end();
  }

  public override getPriority() {
    return this.priority;
  }
}
