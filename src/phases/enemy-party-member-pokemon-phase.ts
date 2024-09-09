import BattleScene from "#app/battle-scene";
import { EnemyPokemon } from "#app/field/pokemon";
import { PartyMemberPokemonPhase } from "./party-member-pokemon-phase";
import * as LoggerTools from "../logger";

export abstract class EnemyPartyMemberPokemonPhase extends PartyMemberPokemonPhase {
  constructor(scene: BattleScene, partyMemberIndex: integer) {
    super(scene, partyMemberIndex, false);
  }

  getEnemyPokemon(): EnemyPokemon {
    return super.getPokemon() as EnemyPokemon;
  }
}
