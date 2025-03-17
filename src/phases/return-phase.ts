import { globalScene } from "#app/global-scene";
import { SpeciesFormChangeActiveTrigger } from "#app/data/pokemon-forms";
import { SwitchType } from "#enums/switch-type";
import { SwitchSummonPhase } from "./switch-summon-phase";

export class ReturnPhase extends SwitchSummonPhase {
  constructor(fieldIndex: number) {
    super(SwitchType.SWITCH, fieldIndex, -1, true);
  }

  switchAndSummon(): void {
    this.end();
  }

  summon(): void {}

  onEnd(): void {
    const pokemon = this.getPokemon();

    pokemon.resetSprite();
    pokemon.resetTurnData();
    pokemon.resetSummonData();

    globalScene.updateFieldScale();

    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger);
  }
}
