import { globalScene } from "#app/global-scene";
import { BattlerIndex } from "#app/battle";
import type Pokemon from "#app/field/pokemon";
import { FieldPhase } from "./field-phase";

export abstract class PokemonPhase extends FieldPhase {
  protected battlerIndex: BattlerIndex | number;
  public player: boolean;
  public fieldIndex: number;

  constructor(battlerIndex?: BattlerIndex | number) {
    super();

    battlerIndex = battlerIndex ?? globalScene.getField().find(p => p?.isActive())!.getBattlerIndex(); // TODO: is the bang correct here?
    if (battlerIndex === undefined) {
      console.warn("There are no Pokemon on the field!"); // TODO: figure out a suitable fallback behavior
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
