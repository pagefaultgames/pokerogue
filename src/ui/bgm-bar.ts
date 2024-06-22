import BattleScene from "../battle-scene";
import { TextStyle, addTextObject } from "./text";


const hiddenX = -150;
const shownX = 0;
const baseY = 0;


export default class BgmBar extends Phaser.GameObjects.Container {
  private defaultWidth: number;
  private defaultHeight: number;

  private bg: Phaser.GameObjects.NineSlice;
  private musicText: Phaser.GameObjects.Text;
  private noteText: Phaser.GameObjects.Text;

  private tween: Phaser.Tweens.Tween;
  private autoHideTimer: NodeJS.Timeout;
  private queue: (string)[] = [];


  public shown: boolean;

  constructor(scene: BattleScene) {
    super(scene, hiddenX, baseY);
  }

  setup(): void {
    this.defaultWidth = 200;
    this.defaultHeight = 100;

    this.bg = this.scene.add.nineslice(0, -5, "ability_bar_left", null, this.defaultWidth,this.defaultHeight, 0, 0, 10, 10);
    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.noteText = addTextObject(this.scene, 5, 5, "♫ :", TextStyle.MESSAGE, { fontSize: "72px" });
    this.noteText.setOrigin(0, 0);
    this.add(this.noteText);

    this.musicText = addTextObject(this.scene, 15, 5, "", TextStyle.MESSAGE, { fontSize: "72px" });
    this.musicText.setOrigin(0, 0);
    this.musicText.setWordWrapWidth(650, true);

    this.add(this.musicText);

    this.setVisible(false);
    this.shown = false;
  }

  showBgm(bgmName: string): void {
    this.musicText.setText(`${(this.scene as BattleScene).getRealBgmName(bgmName)}`);
    if (!(this.scene as BattleScene).showBgmBar) {
      return;
    }


    this.musicText.width = this.bg.width - 20;
    this.musicText.setWordWrapWidth(this.defaultWidth*4);
    this.bg.width= Math.min(this.defaultWidth, this.noteText.displayWidth+this.musicText.displayWidth+20);

    this.bg.height = Math.min(this.defaultHeight, this.musicText.displayHeight+20);

    (this.scene as BattleScene).fieldUI.bringToTop(this);

    this.y = baseY;



  }

  public toggleBgmBar(visible:boolean): void {
    if (!(this.scene as BattleScene).showBgmBar) {
      return;
    }
    this.scene.tweens.add({
      targets: this,
      x: visible ? shownX : hiddenX,
      duration: 500,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.setVisible(true);
      }
    });
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
