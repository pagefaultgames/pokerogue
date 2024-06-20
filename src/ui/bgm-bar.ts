import BattleScene from "../battle-scene";
import { TextStyle, addTextObject } from "./text";

const hiddenX = -118;
const shownX = 0;
const baseY = -116;


export default class BgmBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Image;
  private musicText: Phaser.GameObjects.Text;

  private tween: Phaser.Tweens.Tween;
  private autoHideTimer: NodeJS.Timeout;

  public shown: boolean;

  constructor(scene: Scene) {
    super(scene, hiddenX, baseY);
  }

  setup(): void {
    this.bg = this.scene.add.image(0, 0, "ability_bar_left");
    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.musicText = addTextObject(this.scene, 15, 3, "", TextStyle.MESSAGE, { fontSize: "72px" });
    this.musicText.setOrigin(0, 0);
    this.musicText.setWordWrapWidth(600, true);
    this.add(this.musicText);

    this.setVisible(false);
    this.shown = false;
  }

  showBgm(bgmName: string): void {
    this.musicText.setText(bgmName);
    console.log("showBgm", bgmName);
    if (this.shown) {
      return;
    }
    (this.scene as BattleScene).fieldUI.bringToTop(this);

    // Remove this onces it actually works. This is just for testing and hearing that the method is called
    (this.scene as BattleScene).playSound("achv");

    let offset = 0;
    if ((this.scene as BattleScene)?.currentBattle?.double) {
      offset = 14;
    }
    console.log("Offset is", offset);
    this.y = baseY + offset;
    this.tween = this.scene.tweens.add({
      targets: this,
      x: shownX,
      duration: 500,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.tween = null;
        this.resetAutoHideTimer();
      }
    });

    console.log(this.visible);
    this.setVisible(true);
    console.log(this.visible);

    console.log("BgmBar: Position and Size", this.x, this.y, this.width, this.height);
    this.shown = true;
  }


  hide(): void {
    if (!this.shown) {
      return;
    }

    if (this.autoHideTimer) {
      clearInterval(this.autoHideTimer);
    }

    if (this.tween) {
      this.tween.stop();
    }

    this.tween = this.scene.tweens.add({
      targets: this,
      x: -91,
      duration: 500,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.tween = null;
        this.setVisible(false);
      }
    });

    this.shown = false;
  }

  resetAutoHideTimer(): void {
    if (this.autoHideTimer) {
      clearInterval(this.autoHideTimer);
    }
    this.autoHideTimer = setTimeout(() => {
      this.hide();
      this.autoHideTimer = null;
    }, 2500);
  }
}
