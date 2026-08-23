import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { MoveId } from "#enums/move-id";
import type { Pokemon } from "#field/pokemon";
import { PokemonPhase } from "#phases/pokemon-phase";
import type { Move } from "#types/move-types";

/**
 * The phase where Pokemon reflect moves from {@linkcode MoveId.MAGIC_COAT | Magic Coat}
 * or {@linkcode AbilityId.MAGIC_BOUNCE | Magic Bounce}.
 */
// TODO: This shouldn't need to inherit from `PokemonPhase` just to become dynamic
export class MoveReflectPhase extends PokemonPhase {
  public override readonly phaseName = "MoveReflectPhase";

  /** The {@linkcode Pokemon} doing the reflecting. */
  private readonly pokemon: Pokemon;
  /** The pokemon having originally used the move. */
  private readonly opponent: Pokemon;
  /** The {@linkcode Move} being reflected. */
  private readonly move: Move;

  constructor(pokemon: Pokemon, opponent: Pokemon, move: Move) {
    super(pokemon.getBattlerIndex());
    this.pokemon = pokemon;
    this.opponent = opponent;
    this.move = move;
  }

  override start(): void {
    const { pokemon, opponent, move } = this;
    // Magic Coat takes precedence over Magic Bounce if both apply at once
    const magicCoatTag = pokemon.getTag(BattlerTagType.MAGIC_COAT);
    if (magicCoatTag) {
      magicCoatTag.apply(pokemon, opponent, move);
    } else {
      applyAbAttrs("ReflectStatusMoveAbAttr", { pokemon, opponent, move });
    }
    super.end();
  }

  /**
   * Dummy method implemented solely to make this phase dynamic.
   */
  override getPokemon(): Pokemon {
    return this.pokemon;
  }
}
