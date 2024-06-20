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
  private queue: (string)[] = [];


  public shown: boolean;

  constructor(scene: BattleScene) {
    super(scene, hiddenX, baseY);
  }

  setup(): void {
    this.bg = this.scene.add.image(0, 0, "ability_bar_left");

    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.musicText = addTextObject(this.scene, 15, 3, "", TextStyle.MESSAGE, { fontSize: "72px" });
    this.musicText.setOrigin(0, 0);
    this.musicText.setWordWrapWidth(650, true);
    this.add(this.musicText);

    this.setVisible(false);
    this.shown = false;
  }

  showBgm(bgmName: string): void {
    this.musicText.setText(`♫ : ${(this.scene as BattleScene).getRealBgmName(bgmName)}`);
    console.log("showBgm", bgmName);
    if (this.shown) {
      this.queue.push(bgmName);
      return;
    }
    (this.scene as BattleScene).fieldUI.bringToTop(this);



    let offset = -25;
    if ((this.scene as BattleScene)?.currentBattle?.double) {
      offset = -10;
    } else if ((this.scene as BattleScene)?.currentBattle) {
      offset = -20;
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
        if (this.queue.length) {
          this.showBgm(this.queue.shift());
        }
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
