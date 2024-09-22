import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "./pokemon-icon-anim-handler";
import { TextStyle, addTextObject } from "./text";
import MessageUiHandler from "./message-ui-handler";
import { addWindow } from "./ui-theme";
import {Button} from "#enums/buttons";
import i18next from "i18next";
import { ScrollBar } from "./scroll-bar";

export default class EggListUiHandler extends MessageUiHandler {
  private readonly ROWS = 9;
  private readonly COLUMNS = 11;

  private eggListContainer: Phaser.GameObjects.Container;
  private eggListIconContainer: Phaser.GameObjects.Container;
  private eggIcons: Phaser.GameObjects.Sprite[];
  private eggSprite: Phaser.GameObjects.Sprite;
  private eggNameText: Phaser.GameObjects.Text;
  private eggDateText: Phaser.GameObjects.Text;
  private eggHatchWavesText: Phaser.GameObjects.Text;
  private eggGachaInfoText: Phaser.GameObjects.Text;
  private eggListMessageBoxContainer: Phaser.GameObjects.Container;

  private cursorObj: Phaser.GameObjects.Image;
  private scrollCursor: number;
  private scrollBar: ScrollBar;

  private iconAnimHandler: PokemonIconAnimHandler;

  constructor(scene: BattleScene) {
    super(scene, Mode.EGG_LIST);
  }

  setup() {
    const ui = this.getUi();

    this.eggListContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
    this.eggListContainer.setVisible(false);
    ui.add(this.eggListContainer);

    const bgColor = this.scene.add.rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0x006860);
    bgColor.setOrigin(0, 0);
    this.eggListContainer.add(bgColor);

    const eggListBg = this.scene.add.image(0, 0, "egg_list_bg");
    eggListBg.setOrigin(0, 0);
    this.eggListContainer.add(eggListBg);

    this.eggListContainer.add(addWindow(this.scene, 1, 85, 106, 22));
    this.eggListContainer.add(addWindow(this.scene, 1, 102, 106, 50, true));
    this.eggListContainer.add(addWindow(this.scene, 1, 147, 106, 32, true));
    this.eggListContainer.add(addWindow(this.scene, 107, 1, 212, 178));

    this.iconAnimHandler = new PokemonIconAnimHandler();
    this.iconAnimHandler.setup(this.scene);

    this.eggNameText = addTextObject(this.scene, 8, 68, "", TextStyle.SUMMARY);
    this.eggNameText.setOrigin(0, 0);
    this.eggListContainer.add(this.eggNameText);

    this.eggDateText = addTextObject(this.scene, 8, 91, "", TextStyle.TOOLTIP_CONTENT);
    this.eggListContainer.add(this.eggDateText);

    this.eggHatchWavesText = addTextObject(this.scene, 8, 108, "", TextStyle.TOOLTIP_CONTENT);
    this.eggHatchWavesText.setWordWrapWidth(540);
    this.eggListContainer.add(this.eggHatchWavesText);

    this.eggGachaInfoText = addTextObject(this.scene, 8, 152, "", TextStyle.TOOLTIP_CONTENT);
    this.eggGachaInfoText.setWordWrapWidth(540);
    this.eggListContainer.add(this.eggGachaInfoText);

    this.eggListIconContainer = this.scene.add.container(113, 5);
    this.eggListContainer.add(this.eggListIconContainer);

    this.cursorObj = this.scene.add.image(0, 0, "select_cursor");
    this.cursorObj.setOrigin(0, 0);
    this.eggListContainer.add(this.cursorObj);

    this.eggSprite = this.scene.add.sprite(54, 37, "egg");
    this.eggListContainer.add(this.eggSprite);

    this.scrollBar = new ScrollBar(this.scene, 310, 5, 4, 170, this.ROWS);
    this.eggListContainer.add(this.scrollBar);

    this.eggListMessageBoxContainer = this.scene.add.container(0, this.scene.game.canvas.height / 6);
    this.eggListMessageBoxContainer.setVisible(false);
    this.eggListContainer.add(this.eggListMessageBoxContainer);

    const eggListMessageBox = addWindow(this.scene, 1, -1, 318, 28);
    eggListMessageBox.setOrigin(0, 1);
    this.eggListMessageBoxContainer.add(eggListMessageBox);

    this.message = addTextObject(this.scene, 8, -8, "", TextStyle.WINDOW, { maxLines: 1 });
    this.message.setOrigin(0, 1);
    this.eggListMessageBoxContainer.add(this.message);

    this.cursor = -1;
    this.scrollCursor = 0;
  }

  show(args: any[]): boolean {
    super.show(args);

    this.initEggIcons();

    this.getUi().bringToTop(this.eggListContainer);

    this.eggListContainer.setVisible(true);

    this.scrollBar.setTotalRows(Math.ceil(this.scene.gameData.eggs.length / this.COLUMNS));

    this.updateEggIcons();
    this.setCursor(0);
    this.setScrollCursor(0);

    return true;
  }

  private initEggIcons() {
    this.eggIcons = [];
    for (let i = 0; i < Math.min(this.ROWS * this.COLUMNS, this.scene.gameData.eggs.length); i++) {
      const x = (i % this.COLUMNS) * 18;
      const y = Math.floor(i / this.COLUMNS) * 18;
      const icon = this.scene.add.sprite(x - 2, y + 2, "egg_icons");
      icon.setScale(0.5);
      icon.setOrigin(0, 0);
      this.eggListIconContainer.add(icon);
      this.eggIcons.push(icon);
    }
  }

  private updateEggIcons() {
    const indexOffset = this.scrollCursor * this.COLUMNS;
    const eggsToShow = Math.min(this.eggIcons.length, this.scene.gameData.eggs.length - indexOffset);

    this.eggIcons.forEach((icon, i) => {
      this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.NONE);
      if (i < eggsToShow) {
        const egg = this.scene.gameData.eggs[i + indexOffset];
        icon.setFrame(egg.getKey());
        icon.setVisible(true);
      } else {
        icon.setVisible(false);
      }
    });

  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    const error = false;

    if (button === Button.CANCEL) {
      ui.revertMode();
      success = true;
    } else {
      const totalEggs = this.scene.gameData.eggs.length;
      const onScreenRows = Math.min(this.ROWS,  Math.ceil(this.eggIcons.length / this.COLUMNS));
      const maxScrollCursor = Math.max(0, Math.ceil(totalEggs / this.COLUMNS) - onScreenRows);
      const currentRowIndex = Math.floor(this.cursor / this.COLUMNS);
      const currentColumnIndex = this.cursor % this.COLUMNS;
      const lastEggIndex = Math.min(this.eggIcons.length - 1, totalEggs - maxScrollCursor * this.COLUMNS - 1);
      switch (button) {
      case Button.UP:
        if (currentRowIndex > 0) {
          success = this.setCursor(this.cursor - this.COLUMNS);
        } else if (this.scrollCursor > 0) {
          success = this.setScrollCursor(this.scrollCursor - 1);
        } else {
          // wrap around to the last row
          const newCursor = this.cursor + (onScreenRows - 1) * this.COLUMNS;
          if (newCursor > lastEggIndex) {
            success = this.setCursor(newCursor - this.COLUMNS);
          } else {
            success = this.setCursor(newCursor);
          }
          success = this.setScrollCursor(maxScrollCursor) || success;
        }
        break;
      case Button.DOWN:
        if (currentRowIndex < onScreenRows - 1) {
          // Go down one row
          success = this.setCursor(Math.min(this.cursor + this.COLUMNS, totalEggs - this.scrollCursor * this.COLUMNS - 1));
        } else if (this.scrollCursor < maxScrollCursor) {
          // Scroll down one row
          success = this.setScrollCursor(this.scrollCursor + 1);
        } else {
          // Wrap around to the top row
          success = this.setCursor(this.cursor % this.COLUMNS);
          success = this.setScrollCursor(0) || success;
        }
        break;
      case Button.LEFT:
        if (currentColumnIndex > 0) {
          success = this.setCursor(this.cursor - 1);
        } else {
          success = this.setCursor(Math.min(this.cursor + this.COLUMNS - 1, lastEggIndex));
        }
        break;
      case Button.RIGHT:
        if (currentColumnIndex === this.COLUMNS - 1 || this.cursor === lastEggIndex) {
          success = this.setCursor(this.cursor - currentColumnIndex);
        } else {
          success = this.setCursor(this.cursor + 1);
        }
        break;
      }
    }

    if (success) {
      ui.playSelect();
    } else if (error) {
      ui.playError();
    }

    return success || error;
  }

  setEggDetails(index: number): void {
    const egg = this.scene.gameData.eggs[index];
    this.eggSprite.setFrame(`egg_${egg.getKey()}`);
    this.eggNameText.setText(`${i18next.t("egg:egg")} (${egg.getEggDescriptor()})`);
    this.eggDateText.setText(
      new Date(egg.timestamp).toLocaleString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "numeric"
      })
    );
    this.eggHatchWavesText.setText(egg.getEggHatchWavesMessage());
    this.eggGachaInfoText.setText(egg.getEggTypeDescriptor(this.scene));
  }

  setCursor(cursor: number): boolean {
    let changed = false;

    const lastCursor = this.cursor;

    changed = super.setCursor(cursor);

    if (changed) {
      const icon = this.eggIcons[cursor];
      this.cursorObj.setPosition(icon.x + 114, icon.y + 5);

      if (lastCursor > -1) {
        this.iconAnimHandler.addOrUpdate(this.eggListIconContainer.getAt(lastCursor) as Phaser.GameObjects.Sprite, PokemonIconAnimMode.NONE);
      }
      this.iconAnimHandler.addOrUpdate(this.eggListIconContainer.getAt(cursor) as Phaser.GameObjects.Sprite, PokemonIconAnimMode.ACTIVE);

      this.setEggDetails(cursor + this.scrollCursor * this.COLUMNS);
    }

    return changed;
  }

  setScrollCursor(cursor: number): boolean {
    if (cursor === this.scrollCursor) {
      return false;
    }

    this.scrollCursor = cursor;
    this.scrollBar.setScrollCursor(cursor);

    const newEggIndex = this.cursor + this.scrollCursor * this.COLUMNS;
    if (newEggIndex >= this.scene.gameData.eggs.length) {
      this.setCursor(this.scene.gameData.eggs.length - this.scrollCursor * this.COLUMNS - 1);
    } else {
      this.setEggDetails(newEggIndex);
    }

    this.updateEggIcons();
    return true;
  }

  clear(): void {
    super.clear();
    this.setScrollCursor(0);
    this.cursor = -1;
    this.eggListContainer.setVisible(false);
    this.iconAnimHandler.removeAll();
    this.eggListIconContainer.removeAll(true);
    this.eggIcons = [];
  }
}
