import { BattlerIndex } from "#app/battle";
import BattleScene from "#app/battle-scene";
import Pokemon from "#app/field/pokemon";
import { FieldPhase } from "#app/phases/field-phase";

export abstract class PokemonPhase extends FieldPhase {
  protected battlerIndex: BattlerIndex | number;
  public isPlayer: boolean;
  public fieldIndex: number;

  constructor(scene: BattleScene, battlerIndex?: BattlerIndex | number) {
    super(scene);

    if (battlerIndex === undefined) {
      battlerIndex = scene.getField().find(p => p?.isActive())?.getBattlerIndex();
    }

    if (battlerIndex !== undefined) {
      this.battlerIndex = battlerIndex;
      this.isPlayer = battlerIndex < 2;
      this.fieldIndex = battlerIndex % 2;
    } else {
      console.warn("Unable to find pokemon battlerIndex!");
    }
  }

  getPokemon(): Pokemon {
    if (this.battlerIndex > BattlerIndex.ENEMY_2) {
      return this.scene.getPokemonById(this.battlerIndex)!; //TODO: is this bang correct?
    }
    return this.scene.getField()[this.battlerIndex];
  }
}
