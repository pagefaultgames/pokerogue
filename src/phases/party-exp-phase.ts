import BattleScene from "#app/battle-scene.js";
import { Phase } from "#app/phase";

export class PartyExpPhase extends Phase {
  expValue: number;

  constructor(scene: BattleScene, expValue: number) {
    super(scene);

    this.expValue = expValue;
  }

  start() {
    super.start();

    this.scene.applyPartyExp(this.expValue);

    this.end();
  }
}
