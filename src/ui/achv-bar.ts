import BattleScene from "../battle-scene";
import {Achv, getAchievementDescription} from "../system/achv";
import { Voucher } from "../system/voucher";
import { TextStyle, addTextObject } from "./text";
import i18next from "i18next";

export default class AchvBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.NineSlice;
  private icon: Phaser.GameObjects.Sprite;
  private titleText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private descriptionText: Phaser.GameObjects.Text;

  private queue: (Achv | Voucher)[] = [];

  public shown: boolean;

  constructor(scene: BattleScene) {
    super(scene, scene.game.canvas.width / 6, 0);
  }

  setup(): void {
    let xNineSlice = 0;
    let heightNineSlice = 40;
    let xicon= 4;
    let titleTextX = 40;
    let descriptionTextX = 43;
    let wordWrapWidth = 664;
    let yicon = 4;
    let bgWidth = 160;
    if (i18next.language === "de") {
      xNineSlice = -20;
      heightNineSlice = 50;
      xicon = -16;
      titleTextX = 20;
      descriptionTextX = 23;
      wordWrapWidth = 720;
      bgWidth = 180;

    }

    this.bg = this.scene.add.nineslice(xNineSlice , 0, "achv_bar", null,bgWidth , heightNineSlice, 41, 6, 16, 4);
    this.bg.setOrigin(0, 0);

    // This can not be done earlier because the bg is not yet created
    if (i18next.language === "de") {
      yicon = this.bg.height/2.5 - this.bg.height/4;
    }

    this.add(this.bg);

    this.icon = this.scene.add.sprite(xicon, yicon, "items");
    this.icon.setOrigin(0, 0);
    this.add(this.icon);

    this.titleText = addTextObject(this.scene, titleTextX, 3, "", TextStyle.MESSAGE, { fontSize: "72px" });
    this.titleText.setOrigin(0, 0);
    this.add(this.titleText);

    this.scoreText = addTextObject(this.scene, 150, 3, "", TextStyle.MESSAGE, { fontSize: "72px" });
    this.scoreText.setOrigin(1, 0);
    this.add(this.scoreText);

    this.descriptionText = addTextObject(this.scene, descriptionTextX, 16, "", TextStyle.WINDOW_ALT, { fontSize: "72px" });
    this.descriptionText.setOrigin(0, 0);
    this.add(this.descriptionText);

    this.descriptionText.setWordWrapWidth(wordWrapWidth);
    this.descriptionText.setLineSpacing(-5);

    this.setScale(0.5);

    this.shown = false;
  }

  showAchv(achv: Achv | Voucher): void {
    if (this.shown) {
      this.queue.push(achv);
      return;
    }

    const tier = achv.getTier();

    this.bg.setTexture(`achv_bar${tier ? `_${tier + 1}` : ""}`);
    this.icon.setFrame(achv.getIconImage());
    this.titleText.setText(achv.getName());
    this.scoreText.setVisible(achv instanceof Achv);
    this.descriptionText.setText(getAchievementDescription((achv as Achv).localizationKey));

    if (achv instanceof Achv) {
      this.scoreText.setText(`+${(achv as Achv).score}pt`);
    }

    (this.scene as BattleScene).playSound("achv");

    this.scene.tweens.add({
      targets: this,
      x: (this.scene.game.canvas.width / 6) - 76,
      duration: 500,
      ease: "Sine.easeOut"
    });

    this.scene.time.delayedCall(10000, () => this.hide());

    this.setVisible(true);
    this.shown = true;
  }

  protected hide(): void {
    if (!this.shown) {
      return;
    }

    this.scene.tweens.add({
      targets: this,
      x: (this.scene.game.canvas.width / 6),
      duration: 500,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.shown = false;
        this.setVisible(false);
        if (this.queue.length) {
          this.showAchv(this.queue.shift());
        }
      }
    });
  }
}
