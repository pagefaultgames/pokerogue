import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { PlayerGender } from "#enums/player-gender";
import { TextStyle } from "#enums/text-style";
import type { UiMode } from "#enums/ui-mode";
import type { Achv } from "#system/achv";
import { achvs, getAchievementDescription } from "#system/achv";
import type { AchvUnlocks, VoucherUnlocks } from "#system/game-data";
import type { Voucher } from "#system/voucher";
import { getVoucherTypeIcon, getVoucherTypeName, vouchers } from "#system/voucher";
import { ScrollBar } from "#ui/containers/scroll-bar";
import { MessageUiHandler } from "#ui/handlers/message-ui-handler";
import { addTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import i18next from "i18next";

const Page = {
  ACHIEVEMENTS: 0,
  VOUCHERS: 1,
} as const;
type Page = (typeof Page)[keyof typeof Page];

interface LanguageSetting {
  TextSize: string;
}

const languageSettings: { [key: string]: LanguageSetting } = {
  de: { TextSize: "80px" },
};

export class AchvsUiHandler extends MessageUiHandler {
  private readonly ROWS = 4;
  private readonly COLS = 18;

  private mainContainer: Phaser.GameObjects.Container;
  private iconsContainer: Phaser.GameObjects.Container;

  private headerBg: Phaser.GameObjects.NineSlice;
  private headerText: Phaser.GameObjects.Text;
  private headerActionText: Phaser.GameObjects.Text;
  private headerActionButton: Phaser.GameObjects.Sprite;
  private headerBgX: number;
  private iconsBg: Phaser.GameObjects.NineSlice;
  private icons: Phaser.GameObjects.Sprite[];

  private titleBg: Phaser.GameObjects.NineSlice;
  private titleText: Phaser.GameObjects.Text;
  private scoreContainer: Phaser.GameObjects.Container;
  private scoreText: Phaser.GameObjects.Text;
  private unlockText: Phaser.GameObjects.Text;

  private achvsName: string;
  private achvsTotal: number;
  private vouchersName: string;
  private vouchersTotal: number;
  private currentTotal: number;

  private scrollBar: ScrollBar;
  private scrollCursor: number;
  private cursorObj: Phaser.GameObjects.NineSlice | null;
  private currentPage: Page;

  constructor(mode: UiMode | null = null) {
    super(mode);

    this.achvsTotal = Object.keys(achvs).length;
    this.vouchersTotal = Object.keys(vouchers).length;
    this.scrollCursor = 0;
  }

  setup() {
    const ui = this.getUi();

    /** Width of the global canvas / 6 */
    const WIDTH = globalScene.scaledCanvas.width;
    /** Height of the global canvas / 6 */
    const HEIGHT = globalScene.scaledCanvas.height;

    this.mainContainer = globalScene.add.container(1, -HEIGHT + 1);

    this.mainContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, WIDTH, HEIGHT), Phaser.Geom.Rectangle.Contains);

    this.headerBg = addWindow(0, 0, WIDTH - 2, 24);

    this.headerText = addTextObject(0, 0, "", TextStyle.HEADER_LABEL)
      .setOrigin(0)
      .setPositionRelative(this.headerBg, 8, 4);
    this.headerActionButton = new Phaser.GameObjects.Sprite(globalScene, 0, 0, "keyboard", "ACTION.png")
      .setOrigin(0)
      .setPositionRelative(this.headerBg, 236, 6);
    this.headerActionText = addTextObject(0, 0, "", TextStyle.WINDOW, { fontSize: "60px" })
      .setOrigin(0)
      .setPositionRelative(this.headerBg, 264, 8);

    // We need to get the player gender from the game data to add the correct prefix to the achievement name
    const genderIndex = globalScene.gameData.gender ?? PlayerGender.MALE;
    const genderStr = PlayerGender[genderIndex].toLowerCase();

    this.achvsName = i18next.t("achv:achievements.name", { context: genderStr });
    this.vouchersName = i18next.t("voucher:vouchers");

    this.iconsBg = addWindow(0, this.headerBg.height, WIDTH - 2, HEIGHT - this.headerBg.height - 68).setOrigin(0);

    const yOffset = 6;
    this.scrollBar = new ScrollBar(
      this.iconsBg.width - 9,
      this.iconsBg.y + yOffset,
      4,
      this.iconsBg.height - yOffset * 2,
      this.ROWS,
    );

    this.iconsContainer = globalScene.add.container(5, this.headerBg.height + 8);

    this.icons = [];

    for (let a = 0; a < this.ROWS * this.COLS; a++) {
      const x = (a % this.COLS) * 17;
      const y = Math.floor(a / this.COLS) * 19;

      const icon = globalScene.add.sprite(x, y, "items", "unknown").setOrigin(0).setScale(0.5);

      this.icons.push(icon);
      this.iconsContainer.add(icon);
    }

    const titleBg = addWindow(0, this.headerBg.height + this.iconsBg.height, 174, 24);
    this.titleBg = titleBg;

    this.titleText = addTextObject(0, 0, "", TextStyle.WINDOW).setOrigin();
    const textSize = languageSettings[i18next.language]?.TextSize ?? this.titleText.style.fontSize;
    this.titleText.setFontSize(textSize);
    const titleBgCenterX = titleBg.x + titleBg.width / 2;
    const titleBgCenterY = titleBg.y + titleBg.height / 2;
    this.titleText.setPosition(titleBgCenterX, titleBgCenterY);

    this.scoreContainer = globalScene.add.container(titleBg.x + titleBg.width, titleBg.y);
    const scoreBg = addWindow(0, 0, 46, 24);

    this.scoreText = addTextObject(scoreBg.width / 2, scoreBg.height / 2, "", TextStyle.WINDOW).setOrigin();
    this.scoreContainer.add([scoreBg, this.scoreText]);

    const unlockBg = addWindow(this.scoreContainer.x + scoreBg.width, titleBg.y, 98, 24);

    this.unlockText = addTextObject(0, 0, "", TextStyle.WINDOW)
      .setPositionRelative(unlockBg, unlockBg.width / 2, unlockBg.height / 2)
      .setOrigin();

    const descriptionBg = addWindow(0, titleBg.y + titleBg.height, WIDTH - 2, 42);

    const descriptionText = addTextObject(0, 0, "", TextStyle.WINDOW, { maxLines: 2 })
      .setWordWrapWidth(1870)
      .setOrigin(0)
      .setPositionRelative(descriptionBg, 8, 4);

    this.message = descriptionText;

    this.mainContainer.add([
      this.headerBg,
      this.headerActionButton,
      this.headerText,
      this.headerActionText,
      this.iconsBg,
      this.scrollBar,
      this.iconsContainer,
      titleBg,
      this.titleText,
      this.scoreContainer,
      unlockBg,
      this.unlockText,
      descriptionBg,
      descriptionText,
    ]);

    ui.add(this.mainContainer);

    this.currentPage = Page.ACHIEVEMENTS;

    this.mainContainer.setVisible(false);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.headerBgX = this.headerBg.getTopRight().x;
    this.updateAchvIcons();

    this.mainContainer.setVisible(true);
    this.setCursor(0);
    this.setScrollCursor(0);
    this.scrollBar.setTotalRows(Math.ceil(this.currentTotal / this.COLS));
    this.scrollBar.setScrollCursor(0);

    this.getUi().moveTo(this.mainContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
  }

  protected showAchv(achv: Achv) {
    // We need to get the player gender from the game data to add the correct prefix to the achievement name
    const genderIndex = globalScene.gameData.gender ?? PlayerGender.MALE;
    const genderStr = PlayerGender[genderIndex].toLowerCase();

    achv.name = i18next.t(`achv:${achv.localizationKey}.name`, {
      context: genderStr,
    });
    achv.description = getAchievementDescription(achv.localizationKey);
    const achvUnlocks = globalScene.gameData.achvUnlocks;
    const unlocked = achvUnlocks.hasOwnProperty(achv.id);
    const hidden = !unlocked && achv.secret && (!achv.parentId || !achvUnlocks.hasOwnProperty(achv.parentId));
    this.titleText.setText(unlocked ? achv.name : "???");
    this.showText(!hidden ? achv.description : "");
    this.scoreText.setText(`${achv.score}pt`);
    this.unlockText.setText(
      unlocked ? new Date(achvUnlocks[achv.id]).toLocaleDateString() : i18next.t("achv:locked.name"),
    );
  }

  protected showVoucher(voucher: Voucher) {
    const voucherUnlocks = globalScene.gameData.voucherUnlocks;
    const unlocked = voucherUnlocks.hasOwnProperty(voucher.id);

    this.titleText.setText(getVoucherTypeName(voucher.voucherType));
    this.showText(voucher.description);
    this.unlockText.setText(
      unlocked ? new Date(voucherUnlocks[voucher.id]).toLocaleDateString() : i18next.t("voucher:locked"),
    );
  }

  // #region Input Processing
  /**
   * Submethod of {@linkcode processInput} that handles the action button input
   * @returns Whether the success sound should be played
   */
  private processActionInput(): true {
    this.setScrollCursor(0);
    if (this.currentPage === Page.ACHIEVEMENTS) {
      this.currentPage = Page.VOUCHERS;
      this.updateVoucherIcons();
    } else if (this.currentPage === Page.VOUCHERS) {
      this.currentPage = Page.ACHIEVEMENTS;
      this.updateAchvIcons();
    }
    this.setCursor(0, true);
    this.scrollBar.setTotalRows(Math.ceil(this.currentTotal / this.COLS));
    this.scrollBar.setScrollCursor(0);
    this.mainContainer.update();
    return true;
  }

  /**
   * Submethod of {@linkcode processInput} that handles the up button input
   * @returns Whether the success sound should be played
   */
  private processUpInput(): boolean {
    if (this.cursor >= this.COLS) {
      return this.setCursor(this.cursor - this.COLS);
    }
    if (this.scrollCursor) {
      return this.setScrollCursor(this.scrollCursor - 1);
    }

    // Wrap around to the last row
    const success = this.setScrollCursor(Math.ceil(this.currentTotal / this.COLS) - this.ROWS);
    let newCursorIndex = this.cursor + (this.ROWS - 1) * this.COLS;
    if (newCursorIndex > this.currentTotal - this.scrollCursor * this.COLS - 1) {
      newCursorIndex -= this.COLS;
    }
    return success && this.setCursor(newCursorIndex);
  }

  /**
   * Submethod of {@linkcode processInput} that handles the down button input
   * @returns Whether the success sound should be played
   */
  private processDownInput(): boolean {
    const rowIndex = Math.floor(this.cursor / this.COLS);
    const itemOffset = this.scrollCursor * this.COLS;
    const canMoveDown = itemOffset + 1 < this.currentTotal;

    if (rowIndex >= this.ROWS - 1) {
      if (this.scrollCursor < Math.ceil(this.currentTotal / this.COLS) - this.ROWS && canMoveDown) {
        // scroll down one row
        return this.setScrollCursor(this.scrollCursor + 1);
      }
      // wrap back to the first row
      return this.setScrollCursor(0) && this.setCursor(this.cursor % this.COLS);
    }
    if (canMoveDown) {
      return this.setCursor(Math.min(this.cursor + this.COLS, this.currentTotal - itemOffset - 1));
    }
    return false;
  }

  /**
   * Submethod of {@linkcode processInput} that handles the left button input
   * @returns Whether the success sound should be played
   */
  private processLeftInput(): boolean {
    const itemOffset = this.scrollCursor * this.COLS;
    if (this.cursor % this.COLS === 0) {
      return this.setCursor(Math.min(this.cursor + this.COLS - 1, this.currentTotal - itemOffset - 1));
    }
    return this.setCursor(this.cursor - 1);
  }

  /**
   * Submethod of {@linkcode processInput} that handles the right button input
   * @returns Whether the success sound should be played
   */
  private processRightInput(): boolean {
    const itemOffset = this.scrollCursor * this.COLS;
    if ((this.cursor + 1) % this.COLS === 0 || this.cursor + itemOffset === this.currentTotal - 1) {
      return this.setCursor(this.cursor - (this.cursor % this.COLS));
    }
    return this.setCursor(this.cursor + 1);
  }

  /**
   * Process user input to navigate through the achievements and vouchers UI.
   * @param button - The button that was pressed
   * @returns Whether an action was successfully processed
   */
  processInput(button: Button): boolean {
    let success = false;

    switch (button) {
      case Button.ACTION:
        success = this.processActionInput();
        break;
      case Button.CANCEL:
        success = true;
        globalScene.ui.revertMode();
        break;
      case Button.UP:
        success = this.processUpInput();
        break;
      case Button.DOWN:
        success = this.processDownInput();
        break;
      case Button.LEFT:
        success = this.processLeftInput();
        break;
      case Button.RIGHT:
        success = this.processRightInput();
        break;
    }

    if (success) {
      this.getUi().playSelect();
    }

    return success;
  }
  // #endregion Input Processing

  setCursor(cursor: number, pageChange?: boolean): boolean {
    const ret = super.setCursor(cursor);

    let update = ret;

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add
        .nineslice(0, 0, "select_cursor_highlight", undefined, 16, 16, 1, 1, 1, 1)
        .setOrigin(0);
      this.iconsContainer.add(this.cursorObj);
      update = true;
    }

    this.cursorObj.setPositionRelative(this.icons[this.cursor], 0, 0);
    if (!update && !pageChange) {
      return ret;
    }

    switch (this.currentPage) {
      case Page.ACHIEVEMENTS:
        if (pageChange) {
          this.titleBg.width = 174;
          this.titleText.x = this.titleBg.width / 2;
          this.scoreContainer.setVisible(true);
        }
        this.showAchv(achvs[Object.keys(achvs)[cursor + this.scrollCursor * this.COLS]]);
        break;
      case Page.VOUCHERS:
        if (pageChange) {
          this.titleBg.width = 220;
          this.titleText.x = this.titleBg.width / 2;
          this.scoreContainer.setVisible(false);
        }
        this.showVoucher(vouchers[Object.keys(vouchers)[cursor + this.scrollCursor * this.COLS]]);
        break;
    }
    return ret;
  }

  /**
   * setScrollCursor(scrollCursor: number) : boolean
   * scrollCursor refers to the page's position within the entire sum of the data, unlike cursor, which refers to a user's position within displayed data
   * @param scrollCursor takes a value that has been updated based on user behavior
   * @returns returns a boolean that indicates whether the updated scrollCursor led to an update in the data displayed.
   */
  setScrollCursor(scrollCursor: number): boolean {
    if (scrollCursor === this.scrollCursor) {
      return false;
    }

    this.scrollCursor = scrollCursor;
    this.scrollBar.setScrollCursor(this.scrollCursor);

    // Cursor cannot go farther than the last element in the list
    const maxCursor = Math.min(this.cursor, this.currentTotal - this.scrollCursor * this.COLS - 1);
    if (maxCursor !== this.cursor) {
      this.setCursor(maxCursor);
    }

    switch (this.currentPage) {
      case Page.ACHIEVEMENTS:
        this.updateAchvIcons();
        this.showAchv(achvs[Object.keys(achvs)[this.cursor + this.scrollCursor * this.COLS]]);
        break;
      case Page.VOUCHERS:
        this.updateVoucherIcons();
        this.showVoucher(vouchers[Object.keys(vouchers)[this.cursor + this.scrollCursor * this.COLS]]);
        break;
    }
    return true;
  }

  /**
   * Updates the icons displayed on the UI based on the current page and scroll cursor.
   * @param items - The items to display (achievements or vouchers).
   * @param unlocks - The unlocks data for the items.
   * @param getIconFrame - A function to determine the frame for each item.
   * @param headerText - The text for the header.
   * @param actionText - The text for the action button.
   * @param totalItems - The total number of items.
   * @param forAchievements - `True` when updating icons for the achievements page, `false` for the vouchers page.
   */
  private updateIcons<T extends boolean>(
    items: T extends true ? Achv[] : Voucher[],
    unlocks: T extends true ? AchvUnlocks : VoucherUnlocks,
    headerText: string,
    actionText: string,
    totalItems: number,
    forAchievements: T,
  ): void {
    // type ItemType = T extends true ? Achv : Voucher;
    // type RangeType = ItemType[];
    this.headerText.text = headerText;
    this.headerActionText.text = actionText;
    const textPosition = this.headerBgX - this.headerActionText.displayWidth - 8;
    this.headerActionText.setX(textPosition);
    this.headerActionButton.setX(textPosition - this.headerActionButton.displayWidth - 4);

    const itemOffset = this.scrollCursor * this.COLS;
    const itemLimit = this.ROWS * this.COLS;

    const itemRange = items.slice(itemOffset, itemLimit + itemOffset);

    itemRange.forEach((item: (typeof itemRange)[0], i: number) => {
      const icon = this.icons[i];
      const unlocked = unlocks.hasOwnProperty(item.id);
      let tinted = !unlocked;
      if (forAchievements) {
        // Typescript cannot properly infer the type of `item` here, so we need to cast it
        const achv = item as Achv;
        const hidden = !unlocked && achv.secret && (!achv.parentId || !unlocks.hasOwnProperty(achv.parentId));
        tinted &&= !hidden;
        icon.setFrame(!hidden ? achv.iconImage : "unknown");
      } else {
        icon.setFrame(getVoucherTypeIcon((item as Voucher).voucherType));
      }

      icon.setVisible(true);
      if (tinted) {
        icon.setTintFill(0);
      } else {
        icon.clearTint();
      }
    });

    if (itemRange.length < this.icons.length) {
      this.icons.slice(itemRange.length).forEach(i => i.setVisible(false));
    }

    this.currentTotal = totalItems;
  }

  /**
   * Update the achievement icons displayed on the UI based on the current scroll cursor.
   */
  updateAchvIcons(): void {
    this.updateIcons(
      Object.values(achvs),
      globalScene.gameData.achvUnlocks,
      this.achvsName,
      this.vouchersName,
      this.achvsTotal,
      true,
    );
  }

  /**
   * Update the voucher icons displayed on the UI based on the current scroll cursor.
   */
  updateVoucherIcons(): void {
    this.updateIcons(
      Object.values(vouchers),
      globalScene.gameData.voucherUnlocks,
      this.vouchersName,
      this.achvsName,
      this.vouchersTotal,
      false,
    );
  }

  clear() {
    super.clear();
    this.currentPage = Page.ACHIEVEMENTS;
    this.mainContainer.setVisible(false);
    this.setScrollCursor(0);
    this.setCursor(0, true);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
