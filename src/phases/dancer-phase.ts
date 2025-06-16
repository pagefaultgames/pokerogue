import type { BattlerIndex } from "#enums/battler-index";
import { applyPostMoveUsedAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import type Move from "#app/data/moves/move";
import { globalScene } from "#app/global-scene";
import type { HitCheckEntry } from "#app/phases/move-effect-phase";
import { PokemonPhase } from "#app/phases/pokemon-phase";

/** The phase where all on-field Pokemon trigger Dancer and Dancer-like effects. */
export class DancerPhase extends PokemonPhase {
  public override readonly phaseName: "DancerPhase";

  constructor(
    battlerIndex: BattlerIndex,
    private targets: BattlerIndex[],
    private move: Move,
    private hitChecks: HitCheckEntry[],
  ) {
    super(battlerIndex);
  }

  // TODO: Make iteration occur in speed order
  override start(): void {
    super.start();
    for (const pokemon of globalScene.getField(true)) {
      applyPostMoveUsedAbAttrs(
        "PostMoveUsedAbAttr",
        pokemon,
        this.move,
        this.getPokemon(),
        this.targets,
        this.hitChecks,
      );
    }
    super.end();
  }
}
