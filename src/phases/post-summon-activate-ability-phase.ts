import type { BattlerIndex } from "#app/battle";
import { applyPriorityBasedAbAttrs } from "#app/data/ability";
import { PokemonPhase } from "#app/phases/pokemon-phase";

/**
 * Phase to apply (post-summon) ability attributes for abilities with nonzero priority
 *
 * Priority abilities activate before others and before hazards
 *
 * @see Example - {@link https://bulbapedia.bulbagarden.net/wiki/Neutralizing_Gas_(Ability) | Neutralizing Gas}
 */
export class PostSummonActivateAbilityPhase extends PokemonPhase {
  private priority: number;

  constructor(battlerIndex: BattlerIndex, priority: number) {
    super(battlerIndex);
    this.priority = priority;
  }

  start() {
    super.start();

    applyPriorityBasedAbAttrs(this.getPokemon(), (p: number) => p === this.priority);

    this.end();
  }

  public getPriority() {
    return this.priority;
  }
}
