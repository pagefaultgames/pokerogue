import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { PlayerGender } from "#enums/player-gender";
import { TextStyle } from "#enums/text-style";
import { addTextObject } from "#ui/text";
import i18next from "i18next";

export class EndCardPhase extends Phase {
  public readonly phaseName = "EndCardPhase";
  public endCard: Phaser.GameObjects.Image;
  public text: Phaser.GameObjects.Text;
  start(): void {
    super.start();

    globalScene.ui.getMessageHandler().bg.setVisible(false);
    globalScene.ui.getMessageHandler().nameBoxContainer.setVisible(false);

    this.endCard = globalScene.add.image(
      0,
      0,
      `end_${globalScene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}`,
    );
    this.endCard.setOrigin(0);
    this.endCard.setScale(0.5);
    globalScene.field.add(this.endCard);

    this.text = addTextObject(
      globalScene.scaledCanvas.width / 2,
      globalScene.scaledCanvas.height - 16,
      i18next.t("battle:congratulations"),
      TextStyle.SUMMARY,
      { fontSize: "128px" },
    );
    this.text.setOrigin(0.5);
    globalScene.field.add(this.text);

    globalScene.ui.clearText();

    globalScene.ui.fadeIn(1000).then(() => {
      globalScene.ui.showText(
        "",
        null,
        () => {
          globalScene.ui.getMessageHandler().bg.setVisible(true);
          this.end();
        },
        null,
        true,
      );
    });
  }
}
