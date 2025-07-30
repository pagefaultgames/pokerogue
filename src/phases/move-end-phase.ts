import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#enums/battler-index";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { MoveId } from "#enums/move-id";
import type { Pokemon } from "#field/pokemon";
import { PokemonPhase } from "#phases/pokemon-phase";

export class MoveEndPhase extends PokemonPhase {
  public readonly phaseName = "MoveEndPhase";
  /**
   * Whether the current move was a follow-up attack or not.
   * Used to prevent ticking down Encore and similar effects when copying moves.
   */
  private wasFollowUp: boolean;
  /**
   * Whether the current move successfully executed and showed usage text.
   * Used to update the "last move used" tracker after successful move usage.
   */
  private passedPreUsageChecks: boolean;

  /** Targets from the preceding MovePhase */
  private targets: Pokemon[];

  constructor(battlerIndex: BattlerIndex, targets: Pokemon[], wasFollowUp: boolean, passedPreUsageChecks: boolean) {
    super(battlerIndex);

    this.targets = targets;
    this.wasFollowUp = wasFollowUp;
    this.passedPreUsageChecks = passedPreUsageChecks;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    if (!this.wasFollowUp && pokemon?.isActive(true)) {
      pokemon.lapseTags(BattlerTagLapseType.AFTER_MOVE);
    }

    // Update the "last move used" counter for Copycat and co.
    if (this.passedPreUsageChecks) {
      // TODO: Make this check a move in flight instead of a hackjob
      globalScene.currentBattle.lastMove = pokemon.getLastXMoves()[0]?.move ?? MoveId.NONE;
    }

    // Remove effects which were set on a Pokemon which removes them on summon (i.e. via Mold Breaker)
    globalScene.arena.setIgnoreAbilities(false);
    for (const target of this.targets) {
      if (target) {
        applyAbAttrs("PostSummonRemoveEffectAbAttr", { pokemon: target });
      }
    }

    this.end();
  }
}
