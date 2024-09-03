import BattleScene from "#app/battle-scene.js";
import Pokemon from "#app/field/pokemon.js";
import { FieldPhase } from "./field-phase";

export abstract class PartyMemberPokemonPhase extends FieldPhase {
  protected partyMemberIndex: integer;
  protected fieldIndex: integer;
  protected player: boolean;

  constructor(scene: BattleScene, partyMemberIndex: integer, player: boolean) {
    super(scene);

    this.partyMemberIndex = partyMemberIndex;
    this.fieldIndex = partyMemberIndex < this.scene.currentBattle.getBattlerCount()
      ? partyMemberIndex
      : -1;
    this.player = player;
  }

  getParty(): Pokemon[] {
    return this.player ? this.scene.getParty() : this.scene.getEnemyParty();
  }

  getPokemon(): Pokemon {
    return this.getParty()[this.partyMemberIndex];
  }
}
