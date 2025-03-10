import { globalScene } from "#app/global-scene";
import { PlayerGender } from "#app/enums/player-gender";
import { Phase } from "#app/phase";
import { addTextObject, TextStyle } from "#app/ui/text";
import i18next from "i18next";

export class EndCardPhase extends Phase {
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
      globalScene.game.canvas.width / 12,
      globalScene.game.canvas.height / 6 - 16,
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
