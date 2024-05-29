import BattleScene from "../battle-scene";
import {Achv, getAchievementDescription} from "../system/achv";
import { Voucher } from "../system/voucher";
import { TextStyle, addTextObject } from "./text";

const ICON_Y_OFFSET = 4;
const FONT_SIZE = 72;
const X_OFFSET = 10;
const ACHEIVEMENT_BAR_MIN_HEIGHT = 40;

export default class AchvBar extends Phaser.GameObjects.Container {
  private defaultWidth: number;
  private defaultHeight: number;

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
    this.defaultWidth = 160;
    this.defaultHeight = 40;

    this.bg = this.scene.add.nineslice(0, 0, "achv_bar", null, this.defaultWidth, this.defaultHeight, 41, 6, 16, 4);
    this.bg.setOrigin(0, 0);
    this.add(this.bg);

    this.icon = this.scene.add.sprite(4, ICON_Y_OFFSET, "items");
    this.icon.setOrigin(0, 0);
    this.add(this.icon);

    this.titleText = addTextObject(this.scene, 40, 3, "", TextStyle.MESSAGE, { fontSize: `${FONT_SIZE}px` });
    this.titleText.setOrigin(0, 0);
    this.add(this.titleText);

    this.scoreText = addTextObject(this.scene, 150, 3, "", TextStyle.MESSAGE, { fontSize: `${FONT_SIZE}px` });
    this.scoreText.setOrigin(1, 0);
    this.add(this.scoreText);

    this.descriptionText = addTextObject(this.scene, 43, 16, "", TextStyle.WINDOW_ALT, { fontSize:`${FONT_SIZE}px` });
    this.descriptionText.setOrigin(0, 0);
    this.add(this.descriptionText);

    this.descriptionText.setWordWrapWidth(680);
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

    // Calculate the size and position of the achievement bar based on the length of the achievement name
    this.titleText.width = achv.getName().length*FONT_SIZE;
    this.titleText.x = ((achv.getName().length-30) * -1)+X_OFFSET;
    this.bg.x = ((achv.getName().length+10) * -1) +X_OFFSET;
    this.bg.width = achv.getName().length*FONT_SIZE-50;

    // The description text is decides the height of the achievement bar
    this.descriptionText.setText(getAchievementDescription((achv as Achv).localizationKey));
    this.descriptionText.x = this.titleText.x+3;
    if (this.descriptionText.getBounds().height > ACHEIVEMENT_BAR_MIN_HEIGHT) {
      if (this.descriptionText.getBounds().height/2 < ACHEIVEMENT_BAR_MIN_HEIGHT) {
        this.bg.height = ACHEIVEMENT_BAR_MIN_HEIGHT;
      } else {
        const descriptionHeight = this.descriptionText.getBounds().height/2;
        // Round up to the nearest 10
        const roundedHeight = Math.ceil(descriptionHeight / 10) * 10;
        this.bg.height = roundedHeight;
      }
    } else {
      this.bg.height = ACHEIVEMENT_BAR_MIN_HEIGHT;
    }

    // The icon is positioned based on the height of the achievement bar (centered)
    this.icon.x = ((achv.getName().length+4) * -1)+8;

    // If the height of the achievement bar is more than 40, the icon is positioned at the center of the bar
    if (this.bg.height > 40 && this.bg.height<60) {
      this.icon.y = this.bg.height/2.5 - this.bg.height/4;
    } else if (this.bg.height >= 60) {
      this.icon.y = this.bg.height/2 - this.bg.height/4;
    } else {
      this.icon.y = ICON_Y_OFFSET;
    }

    this.scoreText.setVisible(achv instanceof Achv);
    if (achv instanceof Achv) {
      this.scoreText.setText(`+${(achv as Achv).score}pt`);
    }

    // Take the width of the default interface or the title if longest
    this.bg.width = Math.max(this.defaultWidth, this.icon.displayWidth + this.titleText.displayWidth + this.scoreText.displayWidth + 16);

    this.scoreText.x = this.bg.width - 2;
    this.descriptionText.width = this.bg.width - this.icon.displayWidth - 16;
    this.descriptionText.setWordWrapWidth(this.descriptionText.width * 6);

    // Take the height of the default interface or the description if longest
    this.bg.height = Math.max(this.defaultHeight, this.titleText.displayHeight + this.descriptionText.displayHeight + 8);
    this.icon.y = (this.bg.height / 2) - (this.icon.height / 2);

    (this.scene as BattleScene).playSound("achv");

    this.scene.tweens.add({
      targets: this,
      x: (this.scene.game.canvas.width / 6) - (this.bg.width / 2),
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
