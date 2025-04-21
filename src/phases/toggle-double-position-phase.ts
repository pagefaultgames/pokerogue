import { globalScene } from "#app/global-scene";
import { FieldPosition } from "#app/field/pokemon";
import { BattlePhase } from "./battle-phase";

export class ToggleDoublePositionPhase extends BattlePhase {
  private double: boolean;

  constructor(double: boolean) {
    super();

    this.double = double;
  }

  start() {
    super.start();

    const playerPokemon = globalScene.getPlayerField().find(p => p.isActive(true));
    if (playerPokemon) {
      playerPokemon
        .setFieldPosition(
          this.double && globalScene.getPokemonAllowedInBattle().length > 1 ? FieldPosition.LEFT : FieldPosition.CENTER,
          500,
        )
        .then(() => {
          if (playerPokemon.getFieldIndex() === 1) {
            const party = globalScene.getPlayerParty();
            party[1] = party[0];
            party[0] = playerPokemon;
          }
          this.end();
        });
    } else {
      this.end();
    }
  }
}
