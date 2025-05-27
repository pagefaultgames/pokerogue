import type { BattlerIndex } from "#app/battle";
import { applyPostMoveUsedAbAttrs, PostMoveUsedAbAttr } from "#app/data/abilities/ability";
import type Move from "#app/data/moves/move";
import { globalScene } from "#app/global-scene";
import type { HitCheckEntry } from "./move-effect-phase";
import { PokemonPhase } from "./pokemon-phase";

/** The phase where all on-field Pokemon trigger Dancer and Dancer-like effects. */
export class DancerPhase extends PokemonPhase {
  constructor(
    battlerIndex: BattlerIndex,
    private targets: BattlerIndex[],
    private move: Move,
    private hitChecks: HitCheckEntry[],
  ) {
    super(battlerIndex);
  }

  // TODO: Add speed order to tis
  override start(): void {
    super.start();
    for (const pokemon of globalScene.getField(true)) {
      applyPostMoveUsedAbAttrs(PostMoveUsedAbAttr, pokemon, this.move, this.getPokemon(), this.targets, this.hitChecks);
    }
    super.end();
  }
}
