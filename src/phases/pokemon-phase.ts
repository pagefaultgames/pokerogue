import { globalScene } from "#app/global-scene";
import { BattlerIndex } from "#enums/battler-index";
import type { Pokemon } from "#field/pokemon";
import { FieldPhase } from "#phases/field-phase";

export abstract class PokemonPhase extends FieldPhase {
  /**
   * The battler index this phase refers to, or the pokemon ID if greater than 3.
   * TODO: Make this either use IDs or `BattlerIndex`es, not a weird mix of both
   */
  protected battlerIndex: BattlerIndex | number;
  // TODO: Why is this needed?
  public player: boolean;
  /** @todo Remove in favor of `battlerIndex` pleas for fuck's sake */
  public fieldIndex: number;

  constructor(battlerIndex?: BattlerIndex | number) {
    super();

    battlerIndex =
      battlerIndex
      ?? globalScene
        .getField()
        .find(p => p?.isActive())
        ?.getBattlerIndex();
    if (battlerIndex === undefined) {
      // TODO: figure out a suitable fallback behavior
      console.warn("There are no Pokemon on the field!");
      battlerIndex = BattlerIndex.PLAYER;
    }

    this.battlerIndex = battlerIndex;
    this.player = battlerIndex < 2;
    this.fieldIndex = battlerIndex % 2;
  }

  // TODO: This should have `undefined` in its signature
  getPokemon(): Pokemon {
    if (this.battlerIndex > BattlerIndex.ENEMY_2) {
      return globalScene.getPokemonById(this.battlerIndex)!;
    }
    return globalScene.getField()[this.battlerIndex]!;
  }
}
