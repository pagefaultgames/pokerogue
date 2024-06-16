import BattleScene from "../battle-scene";
import { Button } from "#enums/buttons";
import MessageUiHandler from "./message-ui-handler";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import PokemonSpecies, { allSpecies } from "#app/data/pokemon-species.js";
import { DexData } from "#app/system/game-data.js";

const itemRows = 4;
const itemCols = 17;

export default class VouchersUiHandler extends MessageUiHandler {
  private vouchersContainer: Phaser.GameObjects.Container;
  private voucherIconsContainer: Phaser.GameObjects.Container;

  private voucherIconsBg: Phaser.GameObjects.NineSlice;
  private voucherIcons: Phaser.GameObjects.Sprite[];
  private voucherSpecies: PokemonSpecies[];
  private titleText: Phaser.GameObjects.Text;
  private descriptionContainer: Phaser.GameObjects.Container;
  private unlockText: Phaser.GameObjects.Text;

  private itemsTotal: integer;
  private scrollCursor: integer;

  private cursorObj: Phaser.GameObjects.NineSlice;
  private vouchers: DexData;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);


    this.vouchers = scene.gameData.dexData;
    this.itemsTotal = Object.keys(allSpecies).length;
    this.scrollCursor = 0;
  }

  setup() {
    const ui = this.getUi();

    this.vouchersContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.vouchersContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    headerBg.setOrigin(0, 0);

    const headerText = addTextObject(this.scene, 0, 0, "Pokedex", TextStyle.SETTINGS_LABEL);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);

    this.voucherIconsBg = addWindow(this.scene, 0, headerBg.height, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - headerBg.height - 68);
    this.voucherIconsBg.setOrigin(0, 0);

    this.voucherIconsContainer = this.scene.add.container(6, headerBg.height + 6);

    this.voucherIcons = [];
    this.voucherSpecies = [];

    for (let a = 0; a < itemRows * itemCols; a++) {
      const species = allSpecies[a];
      const x = (a % itemCols) * 18;
      const y = Math.floor(a / itemCols) * 18;

      const icon = this.scene.add.sprite(x, y, species.getIconAtlasKey(0));
      icon.setOrigin(0, 0);
      icon.setScale(0.5);

      this.voucherIcons.push(icon);
      this.voucherSpecies.push(species);
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

    this.descriptionContainer = this.scene.add.container(6, descriptionBg.y + descriptionBg.height-40);



    // const descriptionText = addTextObject(this.scene, 0, 0, "", TextStyle.WINDOW, { maxLines: 2 });
    // descriptionText.setWordWrapWidth(1870);
    // descriptionText.setOrigin(0, 0);
    // descriptionText.setPositionRelative(descriptionBg, 8, 4);

    // this.message = descriptionText;
    // this.descriptionContainer.

    this.vouchersContainer.add(headerBg);
    this.vouchersContainer.add(headerText);
    this.vouchersContainer.add(this.voucherIconsBg);
    this.vouchersContainer.add(this.voucherIconsContainer);
    this.vouchersContainer.add(titleBg);
    this.vouchersContainer.add(this.titleText);
    this.vouchersContainer.add(unlockBg);
    this.vouchersContainer.add(this.unlockText);
    this.vouchersContainer.add(descriptionBg);
    // this.vouchersContainer.add(descriptionText);
    this.vouchersContainer.add(this.descriptionContainer);

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

  protected showVoucher(voucher: PokemonSpecies) {
    this.titleText.setText(`#${voucher.speciesId} ${voucher.name}`);
    this.descriptionContainer.removeAll(true);
    console.log({forms: voucher.forms});
    for (let a = 0; a < voucher.forms.length; a++) {
      // const species = allSpecies[a]
      const x = (a % itemCols) * 18;
      const y = Math.floor(a / itemCols) * 18;

      const icon = this.scene.add.sprite(x, y, voucher.getIconAtlasKey(0));
      icon.setTexture(`pokemon_icons_${voucher.generation}`);
      let frame = voucher.getIconId(false);
      if (voucher.forms[a].getFormSpriteKey()) {
        frame += `-${voucher.forms[a].getFormSpriteKey()}`;
      }
      icon.setFrame(frame);
      icon.setOrigin(0, 0);
      icon.setScale(0.5);

      this.descriptionContainer.add(icon);
    }

    // const description = voucher.forms.map(form => {
    //   return form.formName + ' ' + voucher.name
    // }).join(', ')
    // this.showText(description || '');

    const dexEntry = this.scene.gameData.dexData[voucher.speciesId];
    if (dexEntry.caughtAttr) {
      this.unlockText.setText("Caught");
    } else if (dexEntry.seenAttr) {
      this.unlockText.setText("Seen");
    } else {
      this.unlockText.setText("Not seen");
    }
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
        } else if (this.cursor + itemOffset < Object.keys(allSpecies).length - 1) {
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
      this.cursorObj = this.scene.add.nineslice(0, 0, "select_cursor_highlight", null, 18, 18, 1, 1, 1, 1);
      this.cursorObj.setOrigin(0, 0);
      this.voucherIconsContainer.add(this.cursorObj);
      updateVoucher = true;
    }

    this.cursorObj.setPositionRelative(this.voucherIcons[this.cursor], 0, 0);

    if (updateVoucher) {
      this.showVoucher(allSpecies[Object.keys(allSpecies)[cursor + this.scrollCursor * itemCols]]);
    }

    return ret;
  }

  setScrollCursor(scrollCursor: integer): boolean {
    if (scrollCursor === this.scrollCursor) {
      return false;
    }

    this.scrollCursor = scrollCursor;

    this.updateVoucherIcons();

    this.showVoucher(allSpecies[Object.keys(allSpecies)[Math.min(this.cursor + this.scrollCursor * itemCols, Object.values(allSpecies).length - 1)]]);

    return true;
  }

  updateVoucherIcons(): void {

    const itemOffset = this.scrollCursor * itemCols;
    const itemLimit = itemRows * itemCols;

    const voucherRange = Object.values(allSpecies).slice(itemOffset, itemLimit + itemOffset);

    voucherRange.forEach((voucher: PokemonSpecies, i: integer) => {
      const icon = this.voucherIcons[i];
      const species = voucher;
      const dexEntry = this.scene.gameData.dexData[species.speciesId];


      icon.setTexture(`pokemon_icons_${species.generation}`);
      icon.setFrame(species.getIconId(false));
      icon.width = 40;
      icon.height = 30;
      icon.setVisible(true);

      if (dexEntry.caughtAttr) {
        icon.clearTint();
      } else if (dexEntry.seenAttr) {
        icon.setTint(0x808080);
      } else {
        icon.setTint(0);
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
