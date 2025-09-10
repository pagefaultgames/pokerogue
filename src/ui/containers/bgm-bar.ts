import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { addTextObject } from "#ui/text";
import { toCamelCase, toTitleCase } from "#utils/strings";
import i18next from "i18next";

const hiddenX = -150;
const shownX = 0;
const baseY = 0;

export class BgmBar extends Phaser.GameObjects.Container {
  private defaultWidth: number;
  private defaultHeight: number;

  private bg: Phaser.GameObjects.NineSlice;
  private musicText: Phaser.GameObjects.Text;

  public shown: boolean;

  constructor() {
    super(globalScene, hiddenX, baseY);
  }

  setup(): void {
    this.defaultWidth = 230;
    this.defaultHeight = 100;

    this.bg = globalScene.add.nineslice(
      -5,
      -5,
      "bgm_bar",
      undefined,
      this.defaultWidth,
      this.defaultHeight,
      0,
      0,
      10,
      10,
    );
    this.bg.setOrigin(0, 0);

    this.add(this.bg);

    this.musicText = addTextObject(5, 5, "", TextStyle.BGM_BAR);
    this.musicText.setOrigin(0, 0);
    this.musicText.setWordWrapWidth(650, true);

    this.add(this.musicText);

    this.setVisible(false);
    this.shown = false;
  }

  /*
   * Set the BGM Name to the BGM bar.
   * @param {string} bgmName The name of the BGM to set.
   */
  setBgmToBgmBar(bgmName: string): void {
    this.musicText.setText(`${i18next.t("bgmName:music")}${this.getRealBgmName(bgmName)}`);

    this.musicText.width = this.bg.width - 20;
    this.musicText.setWordWrapWidth(this.defaultWidth * 4);

    this.bg.width = Math.min(this.defaultWidth, this.musicText.displayWidth + 23);
    this.bg.height = Math.min(this.defaultHeight, this.musicText.displayHeight + 20);

    globalScene.fieldUI.bringToTop(this);

    this.y = baseY;
  }

  /*
    Show or hide the BGM bar.
    @param {boolean} visible Whether to show or hide the BGM bar.
   */
  public toggleBgmBar(visible: boolean): void {
    /*
      Prevents the bar from being displayed if musicText is completely empty.
      This can be the case, for example, when the game's 1st music track takes a long time to reach the client,
      and the menu is opened before it is played.
    */
    if (this.musicText.text === "") {
      this.setVisible(false);
      return;
    }

    if (!globalScene.showBgmBar) {
      this.setVisible(false);
      return;
    }
    globalScene.tweens.add({
      targets: this,
      x: visible ? shownX : hiddenX,
      duration: 500,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.setVisible(true);
      },
    });
  }

  getRealBgmName(bgmName: string): string {
    return i18next.t([`bgmName:${toCamelCase(bgmName)}`, "bgmName:missingEntries"], {
      name: toTitleCase(bgmName),
    });
  }
}
