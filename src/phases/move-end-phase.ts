import { globalScene } from "#app/global-scene";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { PokemonPhase } from "./pokemon-phase";
import type { BattlerIndex } from "#enums/battler-index";
import { applyPostSummonAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import type Pokemon from "#app/field/pokemon";

export class MoveEndPhase extends PokemonPhase {
  public readonly phaseName = "MoveEndPhase";
  private wasFollowUp: boolean;

  /** Targets from the preceding MovePhase */
  private targets: Pokemon[];
  constructor(battlerIndex: BattlerIndex, targets: Pokemon[], wasFollowUp = false) {
    super(battlerIndex);

    this.targets = targets;
    this.wasFollowUp = wasFollowUp;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    if (!this.wasFollowUp && pokemon?.isActive(true)) {
      pokemon.lapseTags(BattlerTagLapseType.AFTER_MOVE);
    }

    // Remove effects which were set on a Pokemon which removes them on summon (i.e. via Mold Breaker)
    globalScene.arena.setIgnoreAbilities(false);
    for (const target of this.targets) {
      if (target) {
        applyPostSummonAbAttrs("PostSummonRemoveEffectAbAttr", target);
      }
    }

    this.end();
  }
}
