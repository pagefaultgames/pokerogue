import BattleScene from "../battle-scene";
import { Button } from "#enums/buttons";
import i18next from "i18next";
import { Achv, achvs, getAchievementDescription } from "../system/achv";
import { Voucher, getVoucherTypeIcon, getVoucherTypeName, vouchers } from "../system/voucher";
import MessageUiHandler from "./message-ui-handler";
import { addTextObject, TextStyle } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import { PlayerGender } from "#enums/player-gender";

enum Page {
  ACHIEVEMENTS,
  VOUCHERS
}

interface LanguageSetting {
  TextSize: string,
}

const languageSettings: { [key: string]: LanguageSetting } = {
  "de":{
    TextSize: "80px"
  }
};

export default class AchvsUiHandler extends MessageUiHandler {
  private readonly ROWS = 4;
  private readonly COLS = 17;

  private mainContainer: Phaser.GameObjects.Container;
  private iconsContainer: Phaser.GameObjects.Container;

  private headerBg: Phaser.GameObjects.NineSlice;
  private headerText: Phaser.GameObjects.Text;
  private headerActionText: Phaser.GameObjects.Text;
  private headerActionButton: Phaser.GameObjects.Sprite;
  private headerBgX: number;
  private iconsBg: Phaser.GameObjects.NineSlice;
  private icons: Phaser.GameObjects.Sprite[];

  private titleText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private unlockText: Phaser.GameObjects.Text;

  private achvsName: string;
  private achvsTotal: number;
  private vouchersName: string;
  private vouchersTotal: number;
  private currentTotal: number;

  private scrollCursor: number;
  private cursorObj: Phaser.GameObjects.NineSlice | null;
  private currentPage: Page;

  constructor(scene: BattleScene, mode: Mode | null = null) {
    super(scene, mode);

    this.achvsTotal = Object.keys(achvs).length;
    this.vouchersTotal = Object.keys(vouchers).length;
    this.scrollCursor = 0;
  }

  setup() {
    const ui = this.getUi();

    this.mainContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.mainContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    this.headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    this.headerBg.setOrigin(0, 0);

    this.headerText = addTextObject(this.scene, 0, 0, "", TextStyle.SETTINGS_LABEL);
    this.headerText.setOrigin(0, 0);
    this.headerText.setPositionRelative(this.headerBg, 8, 4);
    this.headerActionButton = new Phaser.GameObjects.Sprite(this.scene, 0, 0, "keyboard", "ACTION.png");
    this.headerActionButton.setOrigin(0, 0);
    this.headerActionButton.setPositionRelative(this.headerBg, 236, 6);
    this.headerActionText = addTextObject(this.scene, 0, 0, "", TextStyle.WINDOW, {fontSize:"60px"});
    this.headerActionText.setOrigin(0, 0);
    this.headerActionText.setPositionRelative(this.headerBg, 264, 8);

    // We need to get the player gender from the game data to add the correct prefix to the achievement name
    const genderIndex = this.scene.gameData.gender ?? PlayerGender.MALE;
    const genderStr = PlayerGender[genderIndex].toLowerCase();

    this.achvsName = i18next.t("achv:Achievements.name", { context: genderStr });
    this.vouchersName = i18next.t("voucher:vouchers");

    this.iconsBg = addWindow(this.scene, 0, this.headerBg.height, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - this.headerBg.height - 68);
    this.iconsBg.setOrigin(0, 0);

    this.iconsContainer = this.scene.add.container(6, this.headerBg.height + 6);

    this.icons = [];

    for (let a = 0; a < this.ROWS * this.COLS; a++) {
      const x = (a % this.COLS) * 18;
      const y = Math.floor(a / this.COLS) * 18;

      const icon = this.scene.add.sprite(x, y, "items", "unknown");
      icon.setOrigin(0, 0);
      icon.setScale(0.5);

      this.icons.push(icon);
      this.iconsContainer.add(icon);
    }

    const titleBg = addWindow(this.scene, 0, this.headerBg.height + this.iconsBg.height, 174, 24);
    titleBg.setOrigin(0, 0);

    this.titleText = addTextObject(this.scene, 0, 0, "", TextStyle.WINDOW);
    const textSize = languageSettings[i18next.language]?.TextSize ?? this.titleText.style.fontSize;
    this.titleText.setFontSize(textSize);
    this.titleText.setOrigin(0, 0);
    const titleBgCenterX = titleBg.x + titleBg.width / 2;
    const titleBgCenterY = titleBg.y + titleBg.height / 2;
    this.titleText.setOrigin(0.5, 0.5);
    this.titleText.setPosition(titleBgCenterX, titleBgCenterY);

    const scoreBg = addWindow(this.scene, titleBg.x + titleBg.width, titleBg.y, 46, 24);
    scoreBg.setOrigin(0, 0);

    this.scoreText = addTextObject(this.scene, 0, 0, "", TextStyle.WINDOW);
    this.scoreText.setOrigin(0, 0);
    this.scoreText.setPositionRelative(scoreBg, 8, 4);

    const unlockBg = addWindow(this.scene, scoreBg.x + scoreBg.width, scoreBg.y, 98, 24);
    unlockBg.setOrigin(0, 0);

    this.unlockText = addTextObject(this.scene, 0, 0, "", TextStyle.WINDOW);
    this.unlockText.setOrigin(0, 0);
    this.unlockText.setPositionRelative(unlockBg, 8, 4);

    const descriptionBg = addWindow(this.scene, 0, titleBg.y + titleBg.height, (this.scene.game.canvas.width / 6) - 2, 42);
    descriptionBg.setOrigin(0, 0);

    const descriptionText = addTextObject(this.scene, 0, 0, "", TextStyle.WINDOW, { maxLines: 2 });
    descriptionText.setWordWrapWidth(1870);
    descriptionText.setOrigin(0, 0);
    descriptionText.setPositionRelative(descriptionBg, 8, 4);

    this.message = descriptionText;

    this.mainContainer.add(this.headerBg);
    this.mainContainer.add(this.headerActionButton);
    this.mainContainer.add(this.headerText);
    this.mainContainer.add(this.headerActionText);
    this.mainContainer.add(this.iconsBg);
    this.mainContainer.add(this.iconsContainer);
    this.mainContainer.add(titleBg);
    this.mainContainer.add(this.titleText);
    this.mainContainer.add(scoreBg);
    this.mainContainer.add(this.scoreText);
    this.mainContainer.add(unlockBg);
    this.mainContainer.add(this.unlockText);
    this.mainContainer.add(descriptionBg);
    this.mainContainer.add(descriptionText);

    ui.add(this.mainContainer);

    this.currentPage = Page.ACHIEVEMENTS;
    this.setCursor(0);

    this.mainContainer.setVisible(false);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.headerBgX = this.headerBg.getTopRight().x;
    this.updateAchvIcons();

    this.mainContainer.setVisible(true);
    this.setCursor(0);
    this.setScrollCursor(0);

    this.getUi().moveTo(this.mainContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
  }

  protected showAchv(achv: Achv) {
    // We need to get the player gender from the game data to add the correct prefix to the achievement name
    const genderIndex = this.scene.gameData.gender ?? PlayerGender.MALE;
    const genderStr = PlayerGender[genderIndex].toLowerCase();

    achv.name = i18next.t(`achv:${achv.localizationKey}.name`, { context: genderStr });
    achv.description = getAchievementDescription(achv.localizationKey);
    const achvUnlocks = this.scene.gameData.achvUnlocks;
    const unlocked = achvUnlocks.hasOwnProperty(achv.id);
    const hidden = !unlocked && achv.secret && (!achv.parentId || !achvUnlocks.hasOwnProperty(achv.parentId));
    this.titleText.setText(unlocked ? achv.name : "???");
    this.showText(!hidden ? achv.description : "");
    this.scoreText.setText(`${achv.score}pt`);
    this.unlockText.setText(unlocked ? new Date(achvUnlocks[achv.id]).toLocaleDateString() : i18next.t("achv:Locked.name"));
  }

  protected showVoucher(voucher: Voucher) {
    const voucherUnlocks = this.scene.gameData.voucherUnlocks;
    const unlocked = voucherUnlocks.hasOwnProperty(voucher.id);

    this.titleText.setText(getVoucherTypeName(voucher.voucherType));
    this.showText(voucher.description);
    this.unlockText.setText(unlocked ? new Date(voucherUnlocks[voucher.id]).toLocaleDateString() : i18next.t("voucher:locked"));
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    if (button === Button.ACTION) {
      success = true;
      this.setScrollCursor(0);
      if (this.currentPage === Page.ACHIEVEMENTS) {
        this.currentPage = Page.VOUCHERS;
        this.updateVoucherIcons();
      } else if (this.currentPage === Page.VOUCHERS) {
        this.currentPage = Page.ACHIEVEMENTS;
        this.updateAchvIcons();
      }
      this.setCursor(0, true);
      this.mainContainer.update();
    }
    if (button === Button.CANCEL) {
      success = true;
      this.scene.ui.revertMode();
    } else {
      const rowIndex = Math.floor(this.cursor / this.COLS);
      const itemOffset = (this.scrollCursor * this.COLS);
      switch (button) {
      case Button.UP:
        if (this.cursor < this.COLS) {
          if (this.scrollCursor) {
            success = this.setScrollCursor(this.scrollCursor - 1);
          }
        } else {
          success = this.setCursor(this.cursor - this.COLS);
        }
        break;
      case Button.DOWN:
        const canMoveDown = (this.cursor + itemOffset) + this.COLS < this.currentTotal;
        if (rowIndex >= this.ROWS - 1) {
          if (this.scrollCursor < Math.ceil(this.currentTotal / this.COLS) - this.ROWS && canMoveDown) {
            success = this.setScrollCursor(this.scrollCursor + 1);
          }
        } else if (canMoveDown) {
          success = this.setCursor(this.cursor + this.COLS);
        }
        break;
      case Button.LEFT:
        if (!this.cursor && this.scrollCursor) {
          success = this.setScrollCursor(this.scrollCursor - 1) && this.setCursor(this.cursor + (this.COLS - 1));
        } else if (this.cursor) {
          success = this.setCursor(this.cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (this.cursor + 1 === this.ROWS * this.COLS && this.scrollCursor < Math.ceil(this.currentTotal / this.COLS) - this.ROWS) {
          success = this.setScrollCursor(this.scrollCursor + 1) && this.setCursor(this.cursor - (this.COLS - 1));
        } else if (this.cursor + itemOffset < this.currentTotal - 1) {
          success = this.setCursor(this.cursor + 1);
        }
        break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  setCursor(cursor: integer, pageChange?: boolean): boolean {
    const ret = super.setCursor(cursor);

    let update = ret;

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, "select_cursor_highlight", undefined, 16, 16, 1, 1, 1, 1);
      this.cursorObj.setOrigin(0, 0);
      this.iconsContainer.add(this.cursorObj);
      update = true;
    }

    this.cursorObj.setPositionRelative(this.icons[this.cursor], 0, 0);

    if (update || pageChange) {
      switch (this.currentPage) {
      case Page.ACHIEVEMENTS:
        this.showAchv(achvs[Object.keys(achvs)[cursor + this.scrollCursor * this.COLS]]);
        break;
      case Page.VOUCHERS:
        this.showVoucher(vouchers[Object.keys(vouchers)[cursor + this.scrollCursor * this.COLS]]);
        break;
      }
    }
    return ret;
  }

  /**
   * setScrollCursor(scrollCursor: integer) : boolean
   * scrollCursor refers to the page's position within the entire sum of the data, unlike cursor, which refers to a user's position within displayed data
   * @param takes a scrollCursor that has been updated based on user behavior
   * @returns returns a boolean that indicates whether the updated scrollCursor led to an update in the data displayed.
   */
  setScrollCursor(scrollCursor: integer): boolean {
    if (scrollCursor === this.scrollCursor) {
      return false;
    }

    this.scrollCursor = scrollCursor;

    switch (this.currentPage) {
    case Page.ACHIEVEMENTS:
      this.updateAchvIcons();
      this.showAchv(achvs[Object.keys(achvs)[Math.min(this.cursor + this.scrollCursor * this.COLS, Object.values(achvs).length - 1)]]);
      break;
    case Page.VOUCHERS:
      this.updateVoucherIcons();
      this.showVoucher(vouchers[Object.keys(vouchers)[Math.min(this.cursor + this.scrollCursor * this.COLS, Object.values(vouchers).length - 1)]]);
      break;
    }
    return true;
  }


  /**
   * updateAchvIcons(): void
   * Determines what data is to be displayed on the UI and updates it accordingly based on the current value of this.scrollCursor
   */
  updateAchvIcons(): void {
    this.headerText.text = this.achvsName;
    this.headerActionText.text = this.vouchersName;
    const textPosition = this.headerBgX - this.headerActionText.displayWidth - 8;
    this.headerActionText.setX(textPosition);
    this.headerActionButton.setX(textPosition - this.headerActionButton.displayWidth - 4);

    const achvUnlocks = this.scene.gameData.achvUnlocks;

    const itemOffset = this.scrollCursor * this.COLS;
    const itemLimit = this.ROWS * this.COLS;

    const achvRange = Object.values(achvs).slice(itemOffset, itemLimit + itemOffset);

    achvRange.forEach((achv: Achv, i: integer) => {
      const icon = this.icons[i];
      const unlocked = achvUnlocks.hasOwnProperty(achv.id);
      const hidden = !unlocked && achv.secret && (!achv.parentId || !achvUnlocks.hasOwnProperty(achv.parentId));
      const tinted = !hidden && !unlocked;

      icon.setFrame(!hidden ? achv.iconImage : "unknown");
      icon.setVisible(true);
      if (tinted) {
        icon.setTintFill(0);
      } else {
        icon.clearTint();
      }
    });

    if (achvRange.length < this.icons.length) {
      this.icons.slice(achvRange.length).map(i => i.setVisible(false));
    }

    this.currentTotal = this.achvsTotal;
  }

  /**
   * updateVoucherIcons(): void
   * Determines what data is to be displayed on the UI and updates it accordingly based on the current value of this.scrollCursor
   */
  updateVoucherIcons(): void {
    this.headerText.text = this.vouchersName;
    this.headerActionText.text = this.achvsName;
    const textPosition = this.headerBgX - this.headerActionText.displayWidth - 8;
    this.headerActionText.setX(textPosition);
    this.headerActionButton.setX(textPosition - this.headerActionButton.displayWidth - 4);

    const voucherUnlocks = this.scene.gameData.voucherUnlocks;

    const itemOffset = this.scrollCursor * this.COLS;
    const itemLimit = this.ROWS * this.COLS;

    const voucherRange = Object.values(vouchers).slice(itemOffset, itemLimit + itemOffset);

    voucherRange.forEach((voucher: Voucher, i: integer) => {
      const icon = this.icons[i];
      const unlocked = voucherUnlocks.hasOwnProperty(voucher.id);

      icon.setFrame(getVoucherTypeIcon(voucher.voucherType));
      icon.setVisible(true);
      if (!unlocked) {
        icon.setTintFill(0);
      } else {
        icon.clearTint();
      }
    });

    if (voucherRange.length < this.icons.length) {
      this.icons.slice(voucherRange.length).map(i => i.setVisible(false));
    }
    this.currentTotal = this.vouchersTotal;
  }

  clear() {
    super.clear();
    this.currentPage = Page.ACHIEVEMENTS;
    this.mainContainer.setVisible(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
