import { globalScene } from "#app/global-scene";
import type Pokemon from "#app/field/pokemon";
import { FieldPhase } from "./field-phase";

export abstract class PartyMemberPokemonPhase extends FieldPhase {
  protected partyMemberIndex: integer;
  protected fieldIndex: integer;
  protected player: boolean;

  constructor(partyMemberIndex: integer, player: boolean) {
    super();

    this.partyMemberIndex = partyMemberIndex;
    this.fieldIndex = partyMemberIndex < globalScene.currentBattle.getBattlerCount()
      ? partyMemberIndex
      : -1;
    this.player = player;
  }

  getParty(): Pokemon[] {
    return this.player ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
  }

  getPokemon(): Pokemon {
    return this.getParty()[this.partyMemberIndex];
  }
}
