import BattleScene from "../battle-scene";
import { Achv } from "../system/achv";
import { Voucher } from "../system/voucher";
import { TextStyle, addTextObject } from "./text";

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
    this.bg = this.scene.add.nineslice(0, 0, "achv_bar", null, 160, 40, 41, 6, 16, 4);
    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.icon = this.scene.add.sprite(4, 4, "items");
    this.icon.setOrigin(0, 0);
    this.add(this.icon);

    this.titleText = addTextObject(this.scene, 40, 3, "", TextStyle.MESSAGE, { fontSize: "72px" });
    this.titleText.setOrigin(0, 0);
    this.add(this.titleText);

    this.scoreText = addTextObject(this.scene, 150, 3, "", TextStyle.MESSAGE, { fontSize: "72px" });
    this.scoreText.setOrigin(1, 0);
    this.add(this.scoreText);

    this.descriptionText = addTextObject(this.scene, 43, 16, "", TextStyle.WINDOW_ALT, { fontSize: "72px" });
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
    this.titleText.setText(achv.getName());
    this.scoreText.setVisible(achv instanceof Achv);
    this.descriptionText.setText(achv.description);

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
