import BattleScene from "../battle-scene";
import { Button } from "#enums/buttons";
import i18next from "i18next";
import { Achv, achvs, getAchievementDescription } from "../system/achv";
import MessageUiHandler from "./message-ui-handler";
import { addTextObject, TextStyle } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import { ParseKeys } from "i18next";
import { PlayerGender } from "#enums/player-gender";

export default class AchvsUiHandler extends MessageUiHandler {
  private readonly ACHV_ROWS = 4;
  private readonly ACHV_COLS = 17;

  private achvsContainer: Phaser.GameObjects.Container;
  private achvIconsContainer: Phaser.GameObjects.Container;

  private achvIconsBg: Phaser.GameObjects.NineSlice;
  private achvIcons: Phaser.GameObjects.Sprite[];
  private titleText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private unlockText: Phaser.GameObjects.Text;

  private achvsTotal: number;
  private scrollCursor: number;

  private cursorObj: Phaser.GameObjects.NineSlice | null;

  constructor(scene: BattleScene, mode: Mode | null = null) {
    super(scene, mode);

    this.achvsTotal = Object.keys(achvs).length;
    this.scrollCursor = 0;
  }

  setup() {
    const ui = this.getUi();

    this.achvsContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.achvsContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    headerBg.setOrigin(0, 0);

    // We need to get the player gender from the game data to add the correct prefix to the achievement name
    const playerGender = this.scene.gameData.gender;
    let genderPrefix = "PGM";
    if (playerGender === PlayerGender.FEMALE) {
      genderPrefix = "PGF";
    }

    const headerText = addTextObject(this.scene, 0, 0, i18next.t(`${genderPrefix}achv:Achievements.name` as ParseKeys), TextStyle.SETTINGS_LABEL);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);

    this.achvIconsBg = addWindow(this.scene, 0, headerBg.height, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - headerBg.height - 68);
    this.achvIconsBg.setOrigin(0, 0);

    this.achvIconsContainer = this.scene.add.container(6, headerBg.height + 6);

    this.achvIcons = [];

    for (let a = 0; a < this.ACHV_ROWS * this.ACHV_COLS; a++) {
      const x = (a % this.ACHV_COLS) * 18;
      const y = Math.floor(a / this.ACHV_COLS) * 18;

      const icon = this.scene.add.sprite(x, y, "items", "unknown");
      icon.setOrigin(0, 0);
      icon.setScale(0.5);

      this.achvIcons.push(icon);
      this.achvIconsContainer.add(icon);
    }

    const titleBg = addWindow(this.scene, 0, headerBg.height + this.achvIconsBg.height, 174, 24);
    titleBg.setOrigin(0, 0);

    this.titleText = addTextObject(this.scene, 0, 0, "", TextStyle.WINDOW);
    this.titleText.setOrigin(0, 0);
    this.titleText.setPositionRelative(titleBg, 8, 4);

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

    this.achvsContainer.add(headerBg);
    this.achvsContainer.add(headerText);
    this.achvsContainer.add(this.achvIconsBg);
    this.achvsContainer.add(this.achvIconsContainer);
    this.achvsContainer.add(titleBg);
    this.achvsContainer.add(this.titleText);
    this.achvsContainer.add(scoreBg);
    this.achvsContainer.add(this.scoreText);
    this.achvsContainer.add(unlockBg);
    this.achvsContainer.add(this.unlockText);
    this.achvsContainer.add(descriptionBg);
    this.achvsContainer.add(descriptionText);

    ui.add(this.achvsContainer);

    this.setCursor(0);

    this.achvsContainer.setVisible(false);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.updateAchvIcons();

    this.achvsContainer.setVisible(true);
    this.setCursor(0);
    this.setScrollCursor(0);

    this.getUi().moveTo(this.achvsContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
  }

  protected showAchv(achv: Achv) {
    // We need to get the player gender from the game data to add the correct prefix to the achievement name
    const playerGender = this.scene.gameData.gender;
    let genderPrefix = "PGM";
    if (playerGender === PlayerGender.FEMALE) {
      genderPrefix = "PGF";
    }

    achv.name = i18next.t(`${genderPrefix}achv:${achv.localizationKey}.name` as ParseKeys);
    achv.description = getAchievementDescription(achv.localizationKey);
    const achvUnlocks = this.scene.gameData.achvUnlocks;
    const unlocked = achvUnlocks.hasOwnProperty(achv.id);
    const hidden = !unlocked && achv.secret && (!achv.parentId || !achvUnlocks.hasOwnProperty(achv.parentId));
    this.titleText.setText(unlocked ? achv.name : "???");
    this.showText(!hidden ? achv.description : "");
    this.scoreText.setText(`${achv.score}pt`);
    this.unlockText.setText(unlocked ? new Date(achvUnlocks[achv.id]).toLocaleDateString() : i18next.t(`${genderPrefix}achv:Locked.name` as ParseKeys));
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    if (button === Button.CANCEL) {
      success = true;
      this.scene.ui.revertMode();
    } else {
      const rowIndex = Math.floor(this.cursor / this.ACHV_COLS);
      const itemOffset = (this.scrollCursor * this.ACHV_COLS);
      switch (button) {
      case Button.UP:
        if (this.cursor < this.ACHV_COLS) {
          if (this.scrollCursor) {
            success = this.setScrollCursor(this.scrollCursor - 1);
          }
        } else {
          success = this.setCursor(this.cursor - this.ACHV_COLS);
        }
        break;
      case Button.DOWN:
        const canMoveDown = (this.cursor + itemOffset) + this.ACHV_COLS < this.achvsTotal;
        if (rowIndex >= this.ACHV_ROWS - 1) {
          if (this.scrollCursor < Math.ceil(this.achvsTotal / this.ACHV_COLS) - this.ACHV_ROWS && canMoveDown) {
            success = this.setScrollCursor(this.scrollCursor + 1);
          }
        } else if (canMoveDown) {
          success = this.setCursor(this.cursor + this.ACHV_COLS);
        }
        break;
      case Button.LEFT:
        if (!this.cursor && this.scrollCursor) {
          success = this.setScrollCursor(this.scrollCursor - 1) && this.setCursor(this.cursor + (this.ACHV_COLS - 1));
        } else if (this.cursor) {
          success = this.setCursor(this.cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (this.cursor + 1 === this.ACHV_ROWS * this.ACHV_COLS && this.scrollCursor < Math.ceil(this.achvsTotal / this.ACHV_COLS) - this.ACHV_ROWS) {
          success = this.setScrollCursor(this.scrollCursor + 1) && this.setCursor(this.cursor - (this.ACHV_COLS - 1));
        } else if (this.cursor + itemOffset < this.achvsTotal - 1) {
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

    let updateAchv = ret;

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, "select_cursor_highlight", undefined, 16, 16, 1, 1, 1, 1);
      this.cursorObj.setOrigin(0, 0);
      this.achvIconsContainer.add(this.cursorObj);
      updateAchv = true;
    }

    this.cursorObj.setPositionRelative(this.achvIcons[this.cursor], 0, 0);

    if (updateAchv) {
      this.showAchv(achvs[Object.keys(achvs)[cursor + this.scrollCursor * this.ACHV_COLS]]);
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

    this.updateAchvIcons();

    this.showAchv(achvs[Object.keys(achvs)[Math.min(this.cursor + this.scrollCursor * this.ACHV_COLS, Object.values(achvs).length - 1)]]);

    return true;
  }


  /**
   * updateAchvIcons(): void
   * Determines what data is to be displayed on the UI and updates it accordingly based on the current value of this.scrollCursor
   */
  updateAchvIcons(): void {
    const achvUnlocks = this.scene.gameData.achvUnlocks;

    const itemOffset = this.scrollCursor * this.ACHV_COLS;
    const itemLimit = this.ACHV_ROWS * this.ACHV_COLS;

    const achvRange = Object.values(achvs).slice(itemOffset, itemLimit + itemOffset);

    achvRange.forEach((achv: Achv, i: integer) => {
      const icon = this.achvIcons[i];
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

    if (achvRange.length < this.achvIcons.length) {
      this.achvIcons.slice(achvRange.length).map(i => i.setVisible(false));
    }
  }

  clear() {
    super.clear();
    this.achvsContainer.setVisible(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
