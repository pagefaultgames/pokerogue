import BattleScene from "../battle-scene";
import { DailyRunScoreboard } from "./daily-run-scoreboard";
import OptionSelectUiHandler from "./option-select-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";

export default class TitleUiHandler extends OptionSelectUiHandler {
  private titleContainer: Phaser.GameObjects.Container;
  private dailyRunScoreboard: DailyRunScoreboard;

  constructor(scene: BattleScene, mode: Mode = Mode.TITLE) {
    super(scene, mode);
  }

  setup() {
    super.setup();

    const ui = this.getUi();

    this.titleContainer = this.scene.add.container(0, -(this.scene.game.canvas.height / 6));
    this.titleContainer.setAlpha(0);
    ui.add(this.titleContainer);

    const logo = this.scene.add.image((this.scene.game.canvas.width / 6) / 2, 8, 'logo');
    logo.setOrigin(0.5, 0);
    this.titleContainer.add(logo);

    this.dailyRunScoreboard = new DailyRunScoreboard(this.scene, 1, 49);
		this.dailyRunScoreboard.setup();

    this.titleContainer.add(this.dailyRunScoreboard);
  }

  show(args: any[]): boolean {
    const ret = super.show(args);

    if (ret) {
      const ui = this.getUi();

      this.dailyRunScoreboard.update();

      this.scene.tweens.add({
        targets: [ this.titleContainer, ui.getMessageHandler().bg ],
        duration: Utils.fixedInt(325),
        alpha: (target: any) => target === this.titleContainer ? 1 : 0,
        ease: 'Sine.easeInOut'
      });
    }

    return ret;
  }

  clear(): void {
    super.clear();

    const ui = this.getUi();

    this.scene.tweens.add({
      targets: [ this.titleContainer, ui.getMessageHandler().bg ],
      duration: Utils.fixedInt(325),
      alpha: (target: any) => target === this.titleContainer ? 0 : 1,
      ease: 'Sine.easeInOut'
    });
  }
}