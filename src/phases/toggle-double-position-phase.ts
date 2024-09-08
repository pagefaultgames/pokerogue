import BattleScene from "#app/battle-scene.js";
import { FieldPosition } from "#app/field/pokemon.js";
import { BattlePhase } from "./battle-phase";

export class ToggleDoublePositionPhase extends BattlePhase {
  private double: boolean;

  constructor(scene: BattleScene, double: boolean) {
    super(scene);

    this.double = double;
  }

  start() {
    super.start();

    const playerPokemon = this.scene.getPlayerField().find(p => p.isActive(true));
    if (playerPokemon) {
      playerPokemon.setFieldPosition(this.double && this.scene.getParty().filter(p => p.isAllowedInBattle()).length > 1 ? FieldPosition.LEFT : FieldPosition.CENTER, 500).then(() => {
        if (playerPokemon.getFieldIndex() === 1) {
          const party = this.scene.getParty();
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
