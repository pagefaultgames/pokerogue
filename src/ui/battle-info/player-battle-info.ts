import { globalScene } from "#app/global-scene";
import BattleInfo from "./battle-info";

export class PlayerBattleInfo extends BattleInfo {
  constructor() {
    super(Math.floor(globalScene.game.canvas.width / 6) - 10, -72, true);
  }
}
