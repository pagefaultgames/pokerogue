import type { PostMoveUsedAbAttrParams } from "#abilities/ab-attrs";
import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { Phase } from "#app/phase";
import type { Pokemon } from "#field/pokemon";
import type { DynamicPhase } from "#types/phase-types";

/**
 * The Phase where on-field Pokemon trigger Dancer and Dancer-like effects. \
 * Made into a separate phase solely to ensure proper ability flyout timings.
 */
export class DancerPhase extends Phase implements DynamicPhase {
  public override readonly phaseName = "DancerPhase";
  private readonly params: Readonly<PostMoveUsedAbAttrParams>;

  constructor(params: Readonly<PostMoveUsedAbAttrParams>) {
    super();

    this.params = params;
  }

  public getPokemon(): Pokemon {
    return this.params.pokemon;
  }

  override start(): void {
    super.start();
    applyAbAttrs("PostMoveUsedAbAttr", this.params);
    super.end();
  }
}
