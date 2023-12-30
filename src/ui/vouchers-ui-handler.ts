import BattleScene, { Button } from "../battle-scene";
import { Voucher, getVoucherTypeIcon, getVoucherTypeName, vouchers } from "../system/voucher";
import MessageUiHandler from "./message-ui-handler";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./window";

export default class VouchersUiHandler extends MessageUiHandler {
  private vouchersContainer: Phaser.GameObjects.Container;
  private voucherIconsContainer: Phaser.GameObjects.Container;

  private voucherIconsBg: Phaser.GameObjects.NineSlice;
  private voucherIcons: Phaser.GameObjects.Sprite[];
  private titleText: Phaser.GameObjects.Text;
  private unlockText: Phaser.GameObjects.Text;

  private cursorObj: Phaser.GameObjects.NineSlice;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
  }

  setup() {
    const ui = this.getUi();
    
    this.vouchersContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.vouchersContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    headerBg.setOrigin(0, 0);

    const headerText = addTextObject(this.scene, 0, 0, 'Vouchers', TextStyle.SETTINGS_LABEL);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);

    this.voucherIconsBg = addWindow(this.scene, 0, headerBg.height, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - headerBg.height - 68);
    this.voucherIconsBg.setOrigin(0, 0);

    this.voucherIconsContainer = this.scene.add.container(6, headerBg.height + 6);
    
    this.voucherIcons = [];

    for (let a = 0; a < Object.keys(vouchers).length; a++) {
      const x = (a % 17) * 18;
      const y = Math.floor(a / 17) * 18;

      const icon = this.scene.add.sprite(x, y, 'items', 'unknown');
      icon.setOrigin(0, 0);
      icon.setScale(0.5);

      this.voucherIcons.push(icon);
      this.voucherIconsContainer.add(icon);
    }

    const titleBg = addWindow(this.scene, 0, headerBg.height + this.voucherIconsBg.height, 220, 24);
    titleBg.setOrigin(0, 0);

    this.titleText = addTextObject(this.scene, 0, 0, '', TextStyle.WINDOW);
    this.titleText.setOrigin(0, 0);
    this.titleText.setPositionRelative(titleBg, 8, 4);

    const unlockBg = addWindow(this.scene, titleBg.x + titleBg.width, titleBg.y, 98, 24);
    unlockBg.setOrigin(0, 0);

    this.unlockText = addTextObject(this.scene, 0, 0, '', TextStyle.WINDOW);
    this.unlockText.setOrigin(0, 0);
    this.unlockText.setPositionRelative(unlockBg, 8, 4);

    const descriptionBg = addWindow(this.scene, 0, titleBg.y + titleBg.height, (this.scene.game.canvas.width / 6) - 2, 42);
    descriptionBg.setOrigin(0, 0);

    const descriptionText = addTextObject(this.scene, 0, 0, '', TextStyle.WINDOW, { maxLines: 2 });
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

    const voucherUnlocks = this.scene.gameData.voucherUnlocks;

    Object.values(vouchers).forEach((voucher: Voucher, i: integer) => {
      const icon = this.voucherIcons[i];
      const unlocked = voucherUnlocks.hasOwnProperty(voucher.id);

      icon.setFrame(getVoucherTypeIcon(voucher.voucherType));
      if (!unlocked)
        icon.setTintFill(0);
      else
        icon.clearTint();
    });

    this.vouchersContainer.setVisible(true);
    this.setCursor(0);

    this.getUi().moveTo(this.vouchersContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
  }

  protected showVoucher(voucher: Voucher) {
    const voucherUnlocks = this.scene.gameData.voucherUnlocks;
    const unlocked = voucherUnlocks.hasOwnProperty(voucher.id);

    this.titleText.setText(getVoucherTypeName(voucher.voucherType));
    this.showText(voucher.description);
    this.unlockText.setText(unlocked ? new Date(voucherUnlocks[voucher.id]).toLocaleDateString() : 'Locked');
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    if (button === Button.CANCEL) {
      success = true;
      this.scene.ui.revertMode();
    } else {
      switch (button) {
        case Button.UP:
          if (this.cursor >= 17)
            success = this.setCursor(this.cursor - 17);
          break;
        case Button.DOWN:
          if (this.cursor + 17 < Object.keys(vouchers).length)
            success = this.setCursor(this.cursor + 17);
          break;
        case Button.LEFT:
          if (this.cursor)
            success = this.setCursor(this.cursor - 1);
          break;
        case Button.RIGHT:
          if (this.cursor < Object.keys(vouchers).length - 1)
            success = this.setCursor(this.cursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();

    return success;
  }

  setCursor(cursor: integer): boolean {
    let ret = super.setCursor(cursor);

    let updateVoucher = ret;

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, 'starter_select_cursor_highlight', null, 16, 16, 1, 1, 1, 1);
      this.cursorObj.setOrigin(0, 0);
      this.voucherIconsContainer.add(this.cursorObj);
      updateVoucher = true;
    }

    this.cursorObj.setPositionRelative(this.voucherIcons[this.cursor], 0, 0);

    if (updateVoucher)
      this.showVoucher(vouchers[Object.keys(vouchers)[cursor]]);

    return ret;
  }

  clear() {
    super.clear();
    this.vouchersContainer.setVisible(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj)
      this.cursorObj.destroy();
    this.cursorObj = null;
  }
}