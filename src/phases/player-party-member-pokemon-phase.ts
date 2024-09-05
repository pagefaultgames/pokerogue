import BattleScene from "#app/battle-scene.js";
import { PlayerPokemon } from "#app/field/pokemon.js";
import { PartyMemberPokemonPhase } from "./party-member-pokemon-phase";

export abstract class PlayerPartyMemberPokemonPhase extends PartyMemberPokemonPhase {
  constructor(scene: BattleScene, partyMemberIndex: integer) {
    super(scene, partyMemberIndex, true);
  }

  getPlayerPokemon(): PlayerPokemon {
    return super.getPokemon() as PlayerPokemon;
  }
}
