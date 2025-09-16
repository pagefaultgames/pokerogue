import { globalScene } from "#app/global-scene";
import type { Pokemon } from "#field/pokemon";
import { FieldPhase } from "#phases/field-phase";

export abstract class PartyMemberPokemonPhase extends FieldPhase {
  protected partyMemberIndex: number;
  protected fieldIndex: number;
  protected player: boolean;

  constructor(partyMemberIndex: number, player: boolean) {
    super();

    this.partyMemberIndex = partyMemberIndex;
    this.fieldIndex = partyMemberIndex < globalScene.currentBattle.getBattlerCount() ? partyMemberIndex : -1;
    this.player = player;
  }

  getParty(): Pokemon[] {
    return this.player ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
  }

  getPokemon(): Pokemon {
    return this.getParty()[this.partyMemberIndex];
  }
}
