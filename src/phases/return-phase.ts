import BattleScene from "#app/battle-scene";
import { applyPreSwitchOutAbAttrs, PreSwitchOutAbAttr } from "#app/data/ability";
import { SpeciesFormChangeActiveTrigger } from "#app/data/pokemon-forms";
import { SwitchType } from "#enums/switch-type";
import { SwitchSummonPhase } from "./switch-summon-phase";

export class ReturnPhase extends SwitchSummonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, SwitchType.SWITCH, fieldIndex, -1, true);
  }

  switchAndSummon(): void {
    this.lastPokemon = this.getPokemon();
    applyPreSwitchOutAbAttrs(PreSwitchOutAbAttr, this.lastPokemon);
    this.end();
  }

  summon(): void { }

  onEnd(): void {
    const pokemon = this.getPokemon();

    pokemon.resetSprite();
    pokemon.resetTurnData();
    pokemon.resetSummonData();

    this.scene.updateFieldScale();

    this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger);
  }
}
