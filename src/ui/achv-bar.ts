import { globalScene } from "#app/global-scene";
import type { PlayerGender } from "#enums/player-gender";
import { TextStyle } from "#enums/text-style";
import { Achv, getAchievementDescription } from "#system/achv";
import { Voucher } from "#system/voucher";
import { addTextObject } from "#ui/text";

export class AchvBar extends Phaser.GameObjects.Container {
  private defaultWidth: number;
  private defaultHeight: number;

  private bg: Phaser.GameObjects.NineSlice;
  private icon: Phaser.GameObjects.Sprite;
  private titleText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private descriptionText: Phaser.GameObjects.Text;

  private queue: (Achv | Voucher)[] = [];
  private playerGender: PlayerGender;

  public shown: boolean;

  constructor() {
    super(globalScene, globalScene.scaledCanvas.width, 0);
    this.playerGender = globalScene.gameData.gender;
  }

  setup(): void {
    this.defaultWidth = 200;
    this.defaultHeight = 40;

    this.bg = globalScene.add.nineslice(
      0,
      0,
      "achv_bar",
      undefined,
      this.defaultWidth,
      this.defaultHeight,
      41,
      6,
      16,
      4,
    );
    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.icon = globalScene.add.sprite(4, 4, "items");
    this.icon.setOrigin(0, 0);
    this.add(this.icon);

    this.titleText = addTextObject(40, 3, "", TextStyle.MESSAGE, {
      fontSize: "72px",
    });
    this.titleText.setOrigin(0, 0);
    this.add(this.titleText);

    this.scoreText = addTextObject(150, 3, "", TextStyle.MESSAGE, {
      fontSize: "72px",
    });
    this.scoreText.setOrigin(1, 0);
    this.add(this.scoreText);

    this.descriptionText = addTextObject(43, 16, "", TextStyle.WINDOW_ALT, {
      fontSize: "72px",
    });
    this.descriptionText.setOrigin(0, 0);
    this.add(this.descriptionText);

    this.descriptionText.setWordWrapWidth(664);
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
    this.titleText.setText(achv.getName(this.playerGender));
    this.scoreText.setVisible(achv instanceof Achv);
    if (achv instanceof Achv) {
      this.descriptionText.setText(getAchievementDescription((achv as Achv).localizationKey));
    } else if (achv instanceof Voucher) {
      this.descriptionText.setText((achv as Voucher).description);
    }

    if (achv instanceof Achv) {
      this.scoreText.setText(`+${(achv as Achv).score}pt`);
    }

    // Take the width of the default interface or the title if longest
    this.bg.width = Math.max(
      this.defaultWidth,
      this.icon.displayWidth + this.titleText.displayWidth + this.scoreText.displayWidth + 16,
    );

    this.scoreText.x = this.bg.width - 2;
    this.descriptionText.width = this.bg.width - this.icon.displayWidth - 16;
    this.descriptionText.setWordWrapWidth(this.descriptionText.width * 6);

    // Take the height of the default interface or the description if longest
    this.bg.height = Math.max(
      this.defaultHeight,
      this.titleText.displayHeight + this.descriptionText.displayHeight + 8,
    );
    this.icon.y = this.bg.height / 2 - this.icon.height / 2;

    globalScene.playSound("se/achv");

    globalScene.tweens.add({
      targets: this,
      x: globalScene.scaledCanvas.width - this.bg.width / 2,
      duration: 500,
      ease: "Sine.easeOut",
    });

    globalScene.time.delayedCall(10000, () => this.hide(this.playerGender));

    this.setVisible(true);
    this.shown = true;
  }

  protected hide(_playerGender: PlayerGender): void {
    if (!this.shown) {
      return;
    }

    globalScene.tweens.add({
      targets: this,
      x: globalScene.scaledCanvas.width,
      duration: 500,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.shown = false;
        this.setVisible(false);
        if (this.queue.length > 0) {
          const shifted = this.queue.shift();
          shifted && this.showAchv(shifted);
        }
      },
    });
  }
}
