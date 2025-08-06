import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { Phase } from "#app/phase";
import type { MagicCoatTag } from "#data/battler-tags";
import { BattlerTagType } from "#enums/battler-tag-type";
// biome-ignore-start lint/correctness/noUnusedImports: TSDoc
import type { MoveId } from "#enums/move-id";
import type { Pokemon } from "#field/pokemon";
import type { Move } from "#types/move-types";
// biome-ignore-end lint/correctness/noUnusedImports: TSDoc

/**
 * The phase where Pokemon reflect moves via {@linkcode MoveId.MAGIC_COAT | Magic Coat} or {@linkcode AbilityId.MAGIC_BOUNCE | Magic Bounce}.
 */
export class MoveReflectPhase extends Phase {
  public override readonly phaseName = "MoveReflectPhase";
  /** The {@linkcode Pokemon} doing the reflecting. */
  private readonly pokemon: Pokemon;
  /** The pokemon having originally used the move. */
  private opponent: Pokemon;
  /** The {@linkcode Move} being reflected. */
  private readonly move: Move;

  constructor(pokemon: Pokemon, opponent: Pokemon, move: Move) {
    super();
    this.pokemon = pokemon;
    this.opponent = opponent;
    this.move = move;
  }

  override start(): void {
    // Magic Coat takes precedeence over Magic Bounce if both apply at once
    const magicCoatTag = this.pokemon.getTag(BattlerTagType.MAGIC_COAT) as MagicCoatTag | undefined;
    if (magicCoatTag) {
      magicCoatTag.apply(this.pokemon, this.opponent, this.move);
    } else {
      applyAbAttrs("ReflectStatusMoveAbAttr", { pokemon: this.pokemon, opponent: this.opponent, move: this.move });
    }
    super.end();
  }
}
