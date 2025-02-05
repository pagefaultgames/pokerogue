import type { EnemyPokemon } from "#app/field/pokemon";
import { PartyMemberPokemonPhase } from "./party-member-pokemon-phase";

export abstract class EnemyPartyMemberPokemonPhase extends PartyMemberPokemonPhase {
  constructor(partyMemberIndex: number) {
    super(partyMemberIndex, false);
  }

  getEnemyPokemon(): EnemyPokemon {
    return super.getPokemon() as EnemyPokemon;
  }
}
