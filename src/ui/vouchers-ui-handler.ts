import BattleScene from "../battle-scene";
import { Button } from "#enums/buttons";
import i18next from "../plugins/i18n";
import { Voucher, getVoucherTypeIcon, getVoucherTypeName, vouchers } from "../system/voucher";
import MessageUiHandler from "./message-ui-handler";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";

const itemRows = 4;
const itemCols = 17;

export default class VouchersUiHandler extends MessageUiHandler {
  private vouchersContainer: Phaser.GameObjects.Container;
  private voucherIconsContainer: Phaser.GameObjects.Container;

  private voucherIconsBg: Phaser.GameObjects.NineSlice;
  private voucherIcons: Phaser.GameObjects.Sprite[];
  private titleText: Phaser.GameObjects.Text;
  private unlockText: Phaser.GameObjects.Text;

  private itemsTotal: integer;
  private scrollCursor: integer;

  private cursorObj: Phaser.GameObjects.NineSlice;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);

    this.itemsTotal = Object.keys(vouchers).length;
    this.scrollCursor = 0;
  }

  setup() {
    const ui = this.getUi();

    this.vouchersContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.vouchersContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    headerBg.setOrigin(0, 0);

    const headerText = addTextObject(this.scene, 0, 0, i18next.t("voucher:vouchers"), TextStyle.SETTINGS_LABEL);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);

    this.voucherIconsBg = addWindow(this.scene, 0, headerBg.height, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - headerBg.height - 68);
    this.voucherIconsBg.setOrigin(0, 0);

    this.voucherIconsContainer = this.scene.add.container(6, headerBg.height + 6);

    this.voucherIcons = [];

    for (let a = 0; a < itemRows * itemCols; a++) {
      const x = (a % itemCols) * 18;
      const y = Math.floor(a / itemCols) * 18;

      const icon = this.scene.add.sprite(x, y, "items", "unknown");
      icon.setOrigin(0, 0);
      icon.setScale(0.5);

      this.voucherIcons.push(icon);
      this.voucherIconsContainer.add(icon);
    }

    const titleBg = addWindow(this.scene, 0, headerBg.height + this.voucherIconsBg.height, 220, 24);
    titleBg.setOrigin(0, 0);

    this.titleText = addTextObject(this.scene, 0, 0, "", TextStyle.WINDOW);
    this.titleText.setOrigin(0, 0);
    this.titleText.setPositionRelative(titleBg, 8, 4);

    const unlockBg = addWindow(this.scene, titleBg.x + titleBg.width, titleBg.y, 98, 24);
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

    this.vouchersContainer.add(headerBg);
    this.vouchersContainer.add(headerText);
    this.vouchersContainer.add(this.voucherIconsBg);
    this.vouchersContainer.add(this.voucherIconsContainer);
    this.vouchersContainer.add(titleBg);
    this.vouchersContainer.add(this.titleText);
    this.vouchersContainer.add(unlockBg);
    this.vouchersContainer.add(this.unlockText);
    this.vouchersContainer.add(descriptionBg);
    this.vouchersContainer.add(descriptionText);

    ui.add(this.vouchersContainer);

    this.setCursor(0);

    this.vouchersContainer.setVisible(false);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.vouchersContainer.setVisible(true);
    this.setCursor(0);
    this.setScrollCursor(0);

    this.updateVoucherIcons();

    this.getUi().moveTo(this.vouchersContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
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

    if (button === Button.CANCEL) {
      success = true;
      this.scene.ui.revertMode();
    } else {
      const rowIndex = Math.floor(this.cursor / itemCols);
      const itemOffset = (this.scrollCursor * itemCols);
      switch (button) {
      case Button.UP:
        if (this.cursor < itemCols) {
          if (this.scrollCursor) {
            success = this.setScrollCursor(this.scrollCursor - 1);
          }
        } else {
          success = this.setCursor(this.cursor - itemCols);
        }
        break;
      case Button.DOWN:
        const canMoveDown = (this.cursor + itemOffset) + itemCols < this.itemsTotal;
        if (rowIndex >= itemRows - 1) {
          if (this.scrollCursor < Math.ceil(this.itemsTotal / itemCols) - itemRows && canMoveDown) {
            success = this.setScrollCursor(this.scrollCursor + 1);
          }
        } else if (canMoveDown) {
          success = this.setCursor(this.cursor + itemCols);
        }
        break;
      case Button.LEFT:
        if (!this.cursor && this.scrollCursor) {
          success = this.setScrollCursor(this.scrollCursor - 1) && this.setCursor(this.cursor + (itemCols - 1));
        } else if (this.cursor) {
          success = this.setCursor(this.cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (this.cursor + 1 === itemRows * itemCols && this.scrollCursor < Math.ceil(this.itemsTotal / itemCols) - itemRows) {
          success = this.setScrollCursor(this.scrollCursor + 1) && this.setCursor(this.cursor - (itemCols - 1));
        } else if (this.cursor + itemOffset < Object.keys(vouchers).length - 1) {
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

  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);

    let updateVoucher = ret;

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, "select_cursor_highlight", null, 16, 16, 1, 1, 1, 1);
      this.cursorObj.setOrigin(0, 0);
      this.voucherIconsContainer.add(this.cursorObj);
      updateVoucher = true;
    }

    this.cursorObj.setPositionRelative(this.voucherIcons[this.cursor], 0, 0);

    if (updateVoucher) {
      this.showVoucher(vouchers[Object.keys(vouchers)[cursor + this.scrollCursor * itemCols]]);
    }

    return ret;
  }

  setScrollCursor(scrollCursor: integer): boolean {
    if (scrollCursor === this.scrollCursor) {
      return false;
    }

    this.scrollCursor = scrollCursor;

    this.updateVoucherIcons();

    this.showVoucher(vouchers[Object.keys(vouchers)[Math.min(this.cursor + this.scrollCursor * itemCols, Object.values(vouchers).length - 1)]]);

    return true;
  }

  updateVoucherIcons(): void {
    const voucherUnlocks = this.scene.gameData.voucherUnlocks;

    const itemOffset = this.scrollCursor * itemCols;
    const itemLimit = itemRows * itemCols;

    const voucherRange = Object.values(vouchers).slice(itemOffset, itemLimit + itemOffset);

    voucherRange.forEach((voucher: Voucher, i: integer) => {
      const icon = this.voucherIcons[i];
      const unlocked = voucherUnlocks.hasOwnProperty(voucher.id);

      icon.setFrame(getVoucherTypeIcon(voucher.voucherType));
      icon.setVisible(true);
      if (!unlocked) {
        icon.setTintFill(0);
      } else {
        icon.clearTint();
      }
    });

    if (voucherRange.length < this.voucherIcons.length) {
      this.voucherIcons.slice(voucherRange.length).map(i => i.setVisible(false));
    }
  }

  clear() {
    super.clear();
    this.vouchersContainer.setVisible(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
