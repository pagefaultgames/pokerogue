import BattleScene from "../battle-scene";
import { DailyRunScoreboard } from "./daily-run-scoreboard";
import OptionSelectUiHandler from "./option-select-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { TextStyle, addTextObject } from "./text";
import { battleCountSplashMessage, splashMessages } from "../data/splash-messages";
import i18next from "i18next";

export default class TitleUiHandler extends OptionSelectUiHandler {
  private titleContainer: Phaser.GameObjects.Container;
  private dailyRunScoreboard: DailyRunScoreboard;
  private playerCountLabel: Phaser.GameObjects.Text;
  private splashMessage: string;
  private splashMessageText: Phaser.GameObjects.Text;

  private titleStatsTimer: number;

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

    this.dailyRunScoreboard = new DailyRunScoreboard(this.scene, 1, 44);
		this.dailyRunScoreboard.setup();

    this.titleContainer.add(this.dailyRunScoreboard);

    this.playerCountLabel = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - 90, `? ${i18next.t("menu:playersOnline")}`, TextStyle.MESSAGE, { fontSize: '54px' });
    this.playerCountLabel.setOrigin(1, 0);
    this.titleContainer.add(this.playerCountLabel);

    this.splashMessageText = addTextObject(this.scene, logo.x + 64, logo.y + logo.displayHeight - 8, '', TextStyle.MONEY, { fontSize: '54px' });
    this.splashMessageText.setOrigin(0.5, 0.5);
    this.splashMessageText.setAngle(-20)
    this.titleContainer.add(this.splashMessageText);

    const originalSplashMessageScale = this.splashMessageText.scale;

    this.scene.tweens.add({
      targets: this.splashMessageText,
      duration: Utils.fixedInt(350),
      scale: originalSplashMessageScale * 1.25,
      loop: -1,
      yoyo: true,
    })
  }

  updateTitleStats(): void {
    Utils.apiFetch(`game/titlestats`)
      .then(request => request.json())
      .then(stats => {
        this.playerCountLabel.setText(`${stats.playerCount} ${i18next.t("menu:playersOnline")}`);
        if (this.splashMessage === battleCountSplashMessage)
          this.splashMessageText.setText(battleCountSplashMessage.replace('{COUNT}', stats.battleCount.toLocaleString('en-US')));
      });
  }

  show(args: any[]): boolean {
    const ret = super.show(args);

    if (ret) {
      this.splashMessage = Utils.randItem(splashMessages);
      this.splashMessageText.setText(this.splashMessage.replace('{COUNT}', '?'));

      const ui = this.getUi();

      this.dailyRunScoreboard.update();

      this.updateTitleStats();

      this.titleStatsTimer = setInterval(() => this.updateTitleStats(), 30000);

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

    clearInterval(this.titleStatsTimer);
    this.titleStatsTimer = null;

    this.scene.tweens.add({
      targets: [ this.titleContainer, ui.getMessageHandler().bg ],
      duration: Utils.fixedInt(325),
      alpha: (target: any) => target === this.titleContainer ? 0 : 1,
      ease: 'Sine.easeInOut'
    });
  }
}