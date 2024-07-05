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
  private achvsContainer: Phaser.GameObjects.Container;
  private achvIconsContainer: Phaser.GameObjects.Container;

  private achvIconsBg: Phaser.GameObjects.NineSlice;
  private achvIcons: Phaser.GameObjects.Sprite[];
  private titleText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private unlockText: Phaser.GameObjects.Text;

  private cursorObj: Phaser.GameObjects.NineSlice;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
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

    for (let a = 0; a < Object.keys(achvs).length; a++) {
      const x = (a % 17) * 18;
      const y = Math.floor(a / 17) * 18;

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

    const achvUnlocks = this.scene.gameData.achvUnlocks;

    Object.values(achvs).forEach((achv: Achv, i: integer) => {
      const icon = this.achvIcons[i];
      const unlocked = achvUnlocks.hasOwnProperty(achv.id);
      const hidden = !unlocked && achv.secret && (!achv.parentId || !achvUnlocks.hasOwnProperty(achv.parentId));
      const tinted = !hidden && !unlocked;

      icon.setFrame(!hidden ? achv.iconImage : "unknown");
      if (tinted) {
        icon.setTintFill(0);
      } else {
        icon.clearTint();
      }
    });

    this.achvsContainer.setVisible(true);
    this.setCursor(0);

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
      switch (button) {
      case Button.UP:
        if (this.cursor >= 17) {
          success = this.setCursor(this.cursor - 17);
        }
        break;
      case Button.DOWN:
        if (this.cursor + 17 < Object.keys(achvs).length) {
          success = this.setCursor(this.cursor + 17);
        }
        break;
      case Button.LEFT:
        if (this.cursor) {
          success = this.setCursor(this.cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (this.cursor < Object.keys(achvs).length - 1) {
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
      this.cursorObj = this.scene.add.nineslice(0, 0, "select_cursor_highlight", null, 16, 16, 1, 1, 1, 1);
      this.cursorObj.setOrigin(0, 0);
      this.achvIconsContainer.add(this.cursorObj);
      updateAchv = true;
    }

    this.cursorObj.setPositionRelative(this.achvIcons[this.cursor], 0, 0);

    if (updateAchv) {
      this.showAchv(achvs[Object.keys(achvs)[cursor]]);
    }

    return ret;
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
