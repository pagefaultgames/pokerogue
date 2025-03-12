import { applyPriorityBasedAbAttrs } from "#app/data/ability";
import { PokemonPhase } from "#app/phases/pokemon-phase";

/**
 * Phase to apply (post-summon) ability attributes for "priority" abilities
 *
 * Priority abilities activate before others and before hazards
 *
 * @see Example - {@link https://bulbapedia.bulbagarden.net/wiki/Neutralizing_Gas_(Ability) | Neutralizing Gas}
 */
export class PriorityAbilityActivationPhase extends PokemonPhase {
  start() {
    super.start();

    applyPriorityBasedAbAttrs(this.getPokemon(), true);

    this.end();
  }
}
