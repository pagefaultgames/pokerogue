import { gScene } from "#app/battle-scene";
import Pokemon from "#app/field/pokemon";
import { FieldPhase } from "./field-phase";

export abstract class PartyMemberPokemonPhase extends FieldPhase {
  protected partyMemberIndex: integer;
  protected fieldIndex: integer;
  protected player: boolean;

  constructor(partyMemberIndex: integer, player: boolean) {
    super();

    this.partyMemberIndex = partyMemberIndex;
    this.fieldIndex = partyMemberIndex < gScene.currentBattle.getBattlerCount()
      ? partyMemberIndex
      : -1;
    this.player = player;
  }

  getParty(): Pokemon[] {
    return this.player ? gScene.getParty() : gScene.getEnemyParty();
  }

  getPokemon(): Pokemon {
    return this.getParty()[this.partyMemberIndex];
  }
}
