import { globalScene } from "#app/global-scene";
import { BattlerTagLapseType } from "#app/data/battler-tags";
import { PokemonPhase } from "./pokemon-phase";
import type { BattlerIndex } from "#app/battle";
import { applyPostSummonAbAttrs, PostSummonRemoveEffectAbAttr } from "#app/data/abilities/ability";
import type Pokemon from "#app/field/pokemon";

export class MoveEndPhase extends PokemonPhase {
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
    globalScene.arena.setIgnoreAbilities(false);

    // Remove effects which were set on a Pokemon which removes them on summon (i.e. via Mold Breaker)
    for (const target of this.targets) {
      if (target) {
        applyPostSummonAbAttrs(PostSummonRemoveEffectAbAttr, target);
      }
    }

    this.end();
  }
}
