import { globalScene } from "#app/global-scene";
import BattleInfo from "./battle-info";

export class PlayerBattleInfo extends BattleInfo {
  constructor() {
    super(Math.floor(globalScene.game.canvas.width / 6) - 10, -72, true);

    this.hpNumbersContainer = globalScene.add.container(-15, 10);
    this.hpNumbersContainer.setName("container_hp");
    this.add(this.hpNumbersContainer);

    const expBar = globalScene.add.image(-98, 18, "overlay_exp");
    expBar.setName("overlay_exp");
    expBar.setOrigin(0);
    this.add(expBar);

    const expMaskRect = globalScene.make
      .graphics({})
      .setScale(6)
      .fillStyle(0xffffff)
      .beginPath()
      .fillRect(127, 126, 85, 2);

    const expMask = expMaskRect.createGeometryMask();

    expBar.setMask(expMask);

    this.expBar = expBar;
    this.expMaskRect = expMaskRect;
  }
}
