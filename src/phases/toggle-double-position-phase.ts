import { globalScene } from "#app/global-scene";
import { FieldPosition } from "#enums/field-position";
import { BattlePhase } from "#phases/battle-phase";

export class ToggleDoublePositionPhase extends BattlePhase {
  public readonly phaseName = "ToggleDoublePositionPhase";
  private double: boolean;

  // TODO: JUST FUCKING USE `globalScene.currentBattle.double`
  constructor(double: boolean) {
    super();

    this.double = double;
  }

  start() {
    super.start();

    // TODO: Pass the pokemon in from the caller
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
