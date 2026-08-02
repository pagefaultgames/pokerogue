import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { PlayerGender } from "#enums/player-gender";
import { TextStyle } from "#enums/text-style";
import type { Achv } from "#system/achv";
import { achvs } from "#system/achv";
import type { Voucher } from "#system/voucher";
import { getVoucherTypeIcon, getVoucherTypeName, vouchers } from "#system/voucher";
import { MessageUiHandler } from "#ui/message-ui-handler";
import { ScrollableGridHelper } from "#ui/scrollable-grid-helper";
import { addTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import i18next from "i18next";

const Page = {
  ACHIEVEMENTS: 0,
  VOUCHERS: 1,
} as const;
type Page = (typeof Page)[keyof typeof Page];

type GridItem = Achv | Voucher;

const languageSettings: Record<string, { TextSize: string }> = {
  de: { TextSize: "80px" },
};

const COLS = 18;
const SHOWN_ROWS = 4;

export class AchvsUiHandler extends MessageUiHandler {
  private mainContainer: Phaser.GameObjects.Container;

  private headerBg: Phaser.GameObjects.NineSlice;
  private headerText: Phaser.GameObjects.Text;
  private headerActionText: Phaser.GameObjects.Text;
  private headerActionButton: Phaser.GameObjects.Sprite;
  private headerBgX: number;
  private iconsBg: Phaser.GameObjects.NineSlice;

  private titleBg: Phaser.GameObjects.NineSlice;
  private titleText: Phaser.GameObjects.Text;
  private scoreContainer: Phaser.GameObjects.Container;
  private scoreText: Phaser.GameObjects.Text;
  private unlockText: Phaser.GameObjects.Text;

  private achvsName: string;
  private vouchersName: string;

  private gridHelper: ScrollableGridHelper<Phaser.GameObjects.Sprite, GridItem>;
  private currentPage: Page = Page.ACHIEVEMENTS;

  setup() {
    const ui = this.getUi();
    const WIDTH = globalScene.scaledCanvas.width;
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
    this.gridHelper = new ScrollableGridHelper<Phaser.GameObjects.Sprite, GridItem>(5, this.headerBg.height + 8, {
      rows: SHOWN_ROWS,
      columns: COLS,
      scrollBar: {
        offsetX: -1,
        offsetY: -2,
        width: 4,
        height: this.iconsBg.height - yOffset * 2,
      },
      cells: {
        spacingX: 17,
        spacingY: 19,
        createCell: () => globalScene.add.sprite(0, 0, "items", "unknown").setOrigin(0).setScale(0.5),
        renderCell: (icon, item) => this.renderIcon(icon, item),
      },
      onItemSelected: (_cell, item) => this.onItemSelected(item),
    });

    const titleBg = addWindow(0, this.headerBg.height + this.iconsBg.height, 174, 24);
    this.titleBg = titleBg;
    this.titleText = addTextObject(0, 0, "", TextStyle.WINDOW).setOrigin();
    this.titleText.setFontSize(languageSettings[i18next.language]?.TextSize ?? this.titleText.style.fontSize);
    this.titleText.setPosition(titleBg.x + titleBg.width / 2, titleBg.y + titleBg.height / 2);

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
      this.gridHelper,
      titleBg,
      this.titleText,
      this.scoreContainer,
      unlockBg,
      this.unlockText,
      descriptionBg,
      descriptionText,
    ]);

    ui.add(this.mainContainer);
    this.mainContainer.setVisible(false);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.headerBgX = this.headerBg.getTopRight().x;
    this.applyPage(this.currentPage);
    this.mainContainer.setVisible(true);
    this.getUi()
      .moveTo(this.mainContainer, this.getUi().length - 1)
      .hideTooltip();
    return true;
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
        this.applyPage(this.currentPage === Page.ACHIEVEMENTS ? Page.VOUCHERS : Page.ACHIEVEMENTS);
        success = true;
        break;
      case Button.CANCEL:
        globalScene.ui.revertMode();
        success = true;
        break;
      default:
        success = this.gridHelper.processInput(button);
        break;
    }

    if (success) {
      this.getUi().playSelect();
    }
    return success;
  }

  clear() {
    super.clear();
    this.currentPage = Page.ACHIEVEMENTS;
    this.mainContainer.setVisible(false);
    this.gridHelper.reset();
  }

  /**
   * Set the visuals to those corresponding to the provided page.
   * @param page - The page to use
   */
  private applyPage(page: Page): void {
    this.currentPage = page;
    const isAchv = page === Page.ACHIEVEMENTS;

    this.headerText.text = isAchv ? this.achvsName : this.vouchersName;
    this.headerActionText.text = isAchv ? this.vouchersName : this.achvsName;
    const textX = this.headerBgX - this.headerActionText.displayWidth - 8;
    this.headerActionText.setX(textX);
    this.headerActionButton.setX(textX - this.headerActionButton.displayWidth - 4);

    this.titleBg.width = isAchv ? 174 : 220;
    this.titleText.x = this.titleBg.width / 2;
    this.scoreContainer.setVisible(isAchv);

    this.gridHelper.setItems(isAchv ? Object.values(achvs) : Object.values(vouchers));
  }

  /**
   * Grid callback to render a particular icon.
   * @param icon - The sprite to render, frame set based on type and hidden status
   * @param item - The underlying achievement or voucher
   */
  private renderIcon(icon: Phaser.GameObjects.Sprite, item: GridItem): void {
    if (this.currentPage === Page.ACHIEVEMENTS) {
      const achv = item as Achv;
      const unlocks = globalScene.gameData.achvUnlocks;
      const unlocked = Object.hasOwn(unlocks, achv.id);
      const hidden = !unlocked && achv.secret && (!achv.parentId || !Object.hasOwn(unlocks, achv.parentId));
      icon.setFrame(hidden ? "unknown" : achv.iconImage);
      !unlocked && !hidden ? icon.setTintFill(0) : icon.clearTint();
    } else {
      const v = item as Voucher;
      const unlocks = globalScene.gameData.voucherUnlocks;
      icon.setFrame(getVoucherTypeIcon(v.voucherType));
      Object.hasOwn(unlocks, v.id) ? icon.clearTint() : icon.setTintFill(0);
    }
  }

  /** Grid callback to run when an item is selected
   *   todo this could probably be more type safe
   */
  private onItemSelected(item: GridItem): void {
    this.currentPage === Page.ACHIEVEMENTS ? this.showAchv(item as Achv) : this.showVoucher(item as Voucher);
  }

  /**
   * Detail panel handler to show an achievement.
   * @param achv - The achievement to show
   */
  protected showAchv(achv: Achv): void {
    const achvUnlocks = globalScene.gameData.achvUnlocks;
    const unlocked = Object.hasOwn(achvUnlocks, achv.id);
    const hidden = !unlocked && achv.secret && (!achv.parentId || !Object.hasOwn(achvUnlocks, achv.parentId));
    this.titleText.setText(unlocked ? achv.name : "???");
    this.showText(hidden ? "" : achv.description);
    this.scoreText.setText(`${achv.score}pt`);
    this.unlockText.setText(
      unlocked ? new Date(achvUnlocks[achv.id]).toLocaleDateString() : i18next.t("achv:locked.name"),
    );
  }

  /**
   * Detail panel handler to show a voucher.
   * @param voucher - The voucher to show
   */
  protected showVoucher(voucher: Voucher): void {
    const voucherUnlocks = globalScene.gameData.voucherUnlocks;
    const unlocked = Object.hasOwn(voucherUnlocks, voucher.id);
    this.titleText.setText(getVoucherTypeName(voucher.voucherType));
    this.showText(voucher.description);
    this.unlockText.setText(
      unlocked ? new Date(voucherUnlocks[voucher.id]).toLocaleDateString() : i18next.t("voucher:locked"),
    );
  }
}
