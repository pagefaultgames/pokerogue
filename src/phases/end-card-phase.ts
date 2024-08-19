import BattleScene from "#app/battle-scene.js";
import { PlayerGender } from "#app/enums/player-gender.js";
import { Phase } from "#app/phase.js";
import { addTextObject, TextStyle } from "#app/ui/text.js";
import i18next from "i18next";

export class EndCardPhase extends Phase {
  public endCard: Phaser.GameObjects.Image;
  public text: Phaser.GameObjects.Text;

  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    super.start();

    this.scene.ui.getMessageHandler().bg.setVisible(false);
    this.scene.ui.getMessageHandler().nameBoxContainer.setVisible(false);

    this.endCard = this.scene.add.image(0, 0, `end_${this.scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}`);
    this.endCard.setOrigin(0);
    this.endCard.setScale(0.5);
    this.scene.field.add(this.endCard);

    this.text = addTextObject(this.scene, this.scene.game.canvas.width / 12, (this.scene.game.canvas.height / 6) - 16, i18next.t("battle:congratulations"), TextStyle.SUMMARY, { fontSize: "128px" });
    this.text.setOrigin(0.5);
    this.scene.field.add(this.text);

    this.scene.ui.clearText();

    this.scene.ui.fadeIn(1000).then(() => {

      this.scene.ui.showText("", null, () => {
        this.scene.ui.getMessageHandler().bg.setVisible(true);
        this.end();
      }, null, true);
    });
  }
}
