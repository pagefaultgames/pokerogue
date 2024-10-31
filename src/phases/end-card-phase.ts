import { gScene } from "#app/battle-scene";
import { PlayerGender } from "#app/enums/player-gender";
import { Phase } from "#app/phase";
import { addTextObject, TextStyle } from "#app/ui/text";
import i18next from "i18next";

export class EndCardPhase extends Phase {
  public endCard: Phaser.GameObjects.Image;
  public text: Phaser.GameObjects.Text;

  constructor() {
    super();
  }

  start(): void {
    super.start();

    gScene.ui.getMessageHandler().bg.setVisible(false);
    gScene.ui.getMessageHandler().nameBoxContainer.setVisible(false);

    this.endCard = gScene.add.image(0, 0, `end_${gScene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}`);
    this.endCard.setOrigin(0);
    this.endCard.setScale(0.5);
    gScene.field.add(this.endCard);

    this.text = addTextObject(gScene.game.canvas.width / 12, (gScene.game.canvas.height / 6) - 16, i18next.t("battle:congratulations"), TextStyle.SUMMARY, { fontSize: "128px" });
    this.text.setOrigin(0.5);
    gScene.field.add(this.text);

    gScene.ui.clearText();

    gScene.ui.fadeIn(1000).then(() => {

      gScene.ui.showText("", null, () => {
        gScene.ui.getMessageHandler().bg.setVisible(true);
        this.end();
      }, null, true);
    });
  }
}
