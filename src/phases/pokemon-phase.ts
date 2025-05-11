import { globalScene } from "#app/global-scene";
import { BattlerIndex } from "#app/battle";
import type Pokemon from "#app/field/pokemon";
import { FieldPhase } from "./field-phase";

export abstract class PokemonPhase extends FieldPhase {
  protected battlerIndex: BattlerIndex;
  public player: boolean;
  public fieldIndex: number;

  constructor(battlerIndex?: BattlerIndex | number) {
    super();

    battlerIndex =
      battlerIndex ??
      globalScene
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

  getPokemon(): Pokemon {
    if (this.battlerIndex > BattlerIndex.ENEMY_2) {
      return globalScene.getPokemonById(this.battlerIndex)!; //TODO: is this bang correct?
    }
    return globalScene.getField()[this.battlerIndex]!; //TODO: is this bang correct?
  }
}
