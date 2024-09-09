import BattleScene from "#app/battle-scene";
import { PlayerPokemon } from "#app/field/pokemon";
import { PartyMemberPokemonPhase } from "./party-member-pokemon-phase";
import * as LoggerTools from "../logger";

export abstract class PlayerPartyMemberPokemonPhase extends PartyMemberPokemonPhase {
  constructor(scene: BattleScene, partyMemberIndex: integer) {
    super(scene, partyMemberIndex, true);
  }

  getPlayerPokemon(): PlayerPokemon {
    return super.getPokemon() as PlayerPokemon;
  }
}
