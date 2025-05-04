import type Pokemon from "#app/field/pokemon";
import { BattlePhase } from "#app/phases/battle-phase";

/**
 * Phase which handles resetting a Pokemon's status to none
 *
 * This is necessary to perform in a phase primarly to ensure that the status icon disappears at the correct time in the battle
 */
export class ResetStatusPhase extends BattlePhase {
  private readonly pokemon: Pokemon;
  private readonly affectConfusion: boolean;
  private readonly reloadAssets: boolean;

  constructor(pokemon: Pokemon, affectConfusion: boolean, reloadAssets: boolean) {
    super();

    this.pokemon = pokemon;
    this.affectConfusion = affectConfusion;
    this.reloadAssets = reloadAssets;
  }

  public override start() {
    this.pokemon.clearStatus(this.affectConfusion, this.reloadAssets);
    this.end();
  }
}
