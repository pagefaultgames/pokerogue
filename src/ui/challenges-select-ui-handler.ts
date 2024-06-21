import BattleScene from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { addWindow } from "./ui-theme";
import {Button} from "#enums/buttons";
import i18next from "i18next";
import { SelectStarterPhase, TitlePhase } from "#app/phases.js";
import { Challenge, ChallengeType } from "#app/data/challenge.js";
import * as Utils from "../utils";
import { Challenges } from "#app/enums/challenges.js";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import { Color, ShadowColor } from "#app/enums/color.js";

/**
 * Handles all the UI for choosing optional challenges.
 */
export default class GameChallengesUiHandler extends UiHandler {
  private challengesContainer: Phaser.GameObjects.Container;
  private valuesContainer: Phaser.GameObjects.Container;

  private scrollCursor: integer;

  private optionsBg: Phaser.GameObjects.NineSlice;

  // private difficultyText: Phaser.GameObjects.Text;

  private descriptionText: BBCodeText;

  private challengeLabels: Array<{ label: Phaser.GameObjects.Text, value: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite }>;

  private cursorObj: Phaser.GameObjects.NineSlice;

  private startCursor: Phaser.GameObjects.NineSlice;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
  }

  setup() {
    const ui = this.getUi();

    this.challengesContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);
    this.challengesContainer.setName("container-challenges");

    this.challengesContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    const bgOverlay = this.scene.add.rectangle(-1, -1, this.scene.scaledCanvas.width, this.scene.scaledCanvas.height, 0x424242, 0.8);
    bgOverlay.setName("rect-challenge-overlay");
    bgOverlay.setOrigin(0, 0);
    this.challengesContainer.add(bgOverlay);

    // TODO: Change this back to /9 when adding in difficulty
    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6), 24);
    headerBg.setName("window-header-bg");
    headerBg.setOrigin(0, 0);

    const headerText = addTextObject(this.scene, 0, 0, i18next.t("challenges:title"), TextStyle.SETTINGS_LABEL);
    headerText.setName("text-header");
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);

    // const difficultyBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 18) - 2, 24);
    // difficultyBg.setOrigin(0, 0);
    // difficultyBg.setPositionRelative(headerBg, headerBg.width, 0);

    // this.difficultyText = addTextObject(this.scene, 0, 0, "0", TextStyle.SETTINGS_LABEL);
    // this.difficultyText.setOrigin(0, 0);
    // this.difficultyText.setPositionRelative(difficultyBg, 8, 4);

    // const difficultyName = addTextObject(this.scene, 0, 0, i18next.t("challenges:points"), TextStyle.SETTINGS_LABEL);
    // difficultyName.setOrigin(0, 0);
    // difficultyName.setPositionRelative(difficultyBg, difficultyBg.width - difficultyName.displayWidth - 8, 4);

    this.optionsBg = addWindow(this.scene, 0, headerBg.height, (this.scene.game.canvas.width / 9), (this.scene.game.canvas.height / 6) - headerBg.height - 2);
    this.optionsBg.setName("window-options-bg");
    this.optionsBg.setOrigin(0, 0);

    const descriptionBg = addWindow(this.scene, 0, headerBg.height, (this.scene.game.canvas.width / 18) - 2, (this.scene.game.canvas.height / 6) - headerBg.height - 26);
    descriptionBg.setName("window-desc-bg");
    descriptionBg.setOrigin(0, 0);
    descriptionBg.setPositionRelative(this.optionsBg, this.optionsBg.width, 0);

    this.descriptionText = new BBCodeText(this.scene, descriptionBg.x + 6, descriptionBg.y + 4, "", {
      fontFamily: "emerald, unifont",
      fontSize: 96,
      color: Color.ORANGE,
      padding: {
        bottom: 6
      },
      wrap: {
        mode: "word",
        width: (descriptionBg.width - 12) * 6,
      }
    });
    this.descriptionText.setName("text-desc");
    this.scene.add.existing(this.descriptionText);
    this.descriptionText.setScale(1/6);
    this.descriptionText.setShadow(4, 5, ShadowColor.ORANGE);
    this.descriptionText.setOrigin(0, 0);

    const startBg = addWindow(this.scene, 0, 0, descriptionBg.width, 24);
    startBg.setName("window-start-bg");
    startBg.setOrigin(0, 0);
    startBg.setPositionRelative(descriptionBg, 0, descriptionBg.height);

    const startText = addTextObject(this.scene, 0, 0, i18next.t("common:start"), TextStyle.SETTINGS_LABEL);
    startText.setName("text-start");
    startText.setOrigin(0, 0);
    startText.setPositionRelative(startBg, 8, 4);

    this.startCursor = this.scene.add.nineslice(0, 0, "summary_moves_cursor", null, (this.scene.game.canvas.width / 18) - 10, 16, 1, 1, 1, 1);
    this.startCursor.setName("9s-start-cursor");
    this.startCursor.setOrigin(0, 0);
    this.startCursor.setPositionRelative(startBg, 4, 4);
    this.startCursor.setVisible(false);

    this.valuesContainer = this.scene.add.container(0, 0);
    this.valuesContainer.setName("container-values");

    this.challengeLabels = [];

    for (let i = 0; i < Object.keys(ChallengeType).length; i++) {
      const label = addTextObject(this.scene, 8, 28 + i * 16, "", TextStyle.SETTINGS_LABEL);
      label.setName(`text-challenge-label-${i}`);
      label.setOrigin(0, 0);

      this.valuesContainer.add(label);

      let value;
      if (i === Challenges.SINGLE_TYPE) {
        const type = `types${Utils.verifyLang(i18next.resolvedLanguage) ? `_${i18next.resolvedLanguage}` : ""}`;
        value = this.scene.add.sprite(8, 98, type);
        value.setName("sprite-single-type");
        value.setScale(0.86);
        value.setPositionRelative(label, 113, 8);
      } else {
        value = addTextObject(this.scene, 0, 28 + i * 16, "", TextStyle.SETTINGS_LABEL);
        value.setName(`text-challenge-value-label-${i}`);
        value.setPositionRelative(label, 100, 0);
      }

      this.valuesContainer.add(value);
      this.challengeLabels[i] = {
        label: label,
        value: value
      };
    }

    this.challengesContainer.add(headerBg);
    this.challengesContainer.add(headerText);
    // this.challengesContainer.add(difficultyBg);
    // this.challengesContainer.add(this.difficultyText);
    // this.challengesContainer.add(difficultyName);
    this.challengesContainer.add(this.optionsBg);
    this.challengesContainer.add(descriptionBg);
    this.challengesContainer.add(this.descriptionText);
    this.challengesContainer.add(startBg);
    this.challengesContainer.add(startText);
    this.challengesContainer.add(this.startCursor);
    this.challengesContainer.add(this.valuesContainer);

    ui.add(this.challengesContainer);

    this.setCursor(0);
    this.setScrollCursor(0);

    this.challengesContainer.setVisible(false);
  }

  /**
   * Adds the default text color to the description text
   * @param text text to set to the BBCode description
   */
  setDescription(text: string): void {
    this.descriptionText.setText(`[color=${Color.ORANGE}][shadow=${ShadowColor.ORANGE}]${text}`);
  }

  /**
   * initLabels
   * init all challenge labels
   */
  initLabels(): void {
    this.setDescription(this.scene.gameMode.challenges[this.cursor].getDescription());
    this.scene.gameMode.challenges.forEach((challenge, i) => {
      this.challengeLabels[i].label.setVisible(true);
      this.challengeLabels[i].value.setVisible(true);
      this.challengeLabels[i].label.setText(challenge.getName());
      if (this.challengeLabels[i].value.type.toLowerCase() === "sprite") {
        (this.challengeLabels[i].value as Phaser.GameObjects.Sprite).setFrame(challenge.getValue());
      } else {
        (this.challengeLabels[i].value as Phaser.GameObjects.Text).setText(challenge.getValue());
      }
    });
  }

  /**
   * update the text the cursor is on
   */
  updateText(): void {
    const challenge = this.getActiveChallenge();
    const { id } = challenge;
    this.setDescription(this.getActiveChallenge().getDescription());

    if (this.challengeLabels[id].value.type.toLowerCase() === "sprite") {
      (this.challengeLabels[id].value as Phaser.GameObjects.Sprite).setFrame(challenge.getValue());
    } else {
      (this.challengeLabels[id].value as Phaser.GameObjects.Text).setText(challenge.getValue());
    }
    // const totalDifficulty = this.scene.gameMode.challenges.reduce((v, c) => v + c.getDifficulty(), 0);
    // const totalMinDifficulty = this.scene.gameMode.challenges.reduce((v, c) => v + c.getMinDifficulty(), 0);
    // this.difficultyText.text = `${totalDifficulty}` + (totalMinDifficulty ? `/${totalMinDifficulty}` : "");
    // this.difficultyText.updateText();
  }

  show(args: any[]): boolean {
    super.show(args);

    this.startCursor.setVisible(false);
    this.challengesContainer.setVisible(true);
    this.setCursor(0);

    this.initLabels();

    this.getUi().moveTo(this.challengesContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
  }

  /**
   * Processes input from a specified button.
   * This method handles navigation through a UI menu, including movement through menu items
   * and handling special actions like cancellation. Each button press may adjust the cursor
   * position or the menu scroll, and plays a sound effect if the action was successful.
   *
   * @param button - The button pressed by the user.
   * @returns `true` if the action associated with the button was successfully processed, `false` otherwise.
   */
  processInput(button: Button): boolean {
    const ui = this.getUi();
    // Defines the maximum number of rows that can be displayed on the screen.
    const rowsToDisplay = 9;

    let success = false;

    if (button === Button.CANCEL) {
      if (this.startCursor.visible) {
        this.startCursor.setVisible(false);
        this.cursorObj?.setVisible(true);
      } else {
        this.scene.clearPhaseQueue();
        this.scene.pushPhase(new TitlePhase(this.scene));
        this.scene.getCurrentPhase().end();
      }
      success = true;
    } else if (button === Button.SUBMIT || button === Button.ACTION) {
      if (this.startCursor.visible) {
        const totalDifficulty = this.scene.gameMode.challenges.reduce((v, c) => v + c.getDifficulty(), 0);
        const totalMinDifficulty = this.scene.gameMode.challenges.reduce((v, c) => v + c.getMinDifficulty(), 0);
        if (totalDifficulty >= totalMinDifficulty) {
          this.scene.unshiftPhase(new SelectStarterPhase(this.scene));
          this.scene.getCurrentPhase().end();
          success = true;
        } else {
          success = false;
        }
      } else {
        this.startCursor.setVisible(true);
        this.cursorObj?.setVisible(false);
        success = true;
      }
    } else {
      switch (button) {
      case Button.UP:
        if (this.cursor === 0) {
          if (this.scrollCursor === 0) {
            // When at the top of the menu and pressing UP, move to the bottommost item.
            if (this.scene.gameMode.challenges.length > rowsToDisplay) { // If there are more than 9 challenges, scroll to the bottom
              // First, set the cursor to the last visible element, preparing for the scroll to the end.
              const successA = this.setCursor(rowsToDisplay - 1);
              // Then, adjust the scroll to display the bottommost elements of the menu.
              const successB = this.setScrollCursor(this.scene.gameMode.challenges.length - rowsToDisplay);
              success = successA && successB; // success is just there to play the little validation sound effect
            } else { // If there are 9 or less challenges, just move to the bottom one
              success = this.setCursor(this.scene.gameMode.challenges.length - 1);
            }
          } else {
            success = this.setScrollCursor(this.scrollCursor - 1);
          }
        } else {
          success = this.setCursor(this.cursor - 1);
        }
        if (success) {
          this.updateText();
        }
        break;
      case Button.DOWN:
        if (this.cursor === rowsToDisplay - 1) {
          if (this.scrollCursor < this.scene.gameMode.challenges.length - rowsToDisplay) {
            // When at the bottom and pressing DOWN, scroll if possible.
            success = this.setScrollCursor(this.scrollCursor + 1);
          } else {
            // When at the bottom of a scrolling menu and pressing DOWN, move to the topmost item.
            // First, set the cursor to the first visible element, preparing for the scroll to the top.
            const successA = this.setCursor(0);
            // Then, adjust the scroll to display the topmost elements of the menu.
            const successB = this.setScrollCursor(0);
            success = successA && successB; // success is just there to play the little validation sound effect
          }
        } else if (this.scene.gameMode.challenges.length < rowsToDisplay && this.cursor === this.scene.gameMode.challenges.length - 1) {
          // When at the bottom of a non-scrolling menu and pressing DOWN, move to the topmost item.
          success = this.setCursor(0);
        } else {
          success = this.setCursor(this.cursor + 1);
        }
        if (success) {
          this.updateText();
        }
        break;
      case Button.LEFT:
        // Moves the option cursor left, if possible.
        success = this.getActiveChallenge().decreaseValue();
        if (success) {
          this.updateText();
        }
        break;
      case Button.RIGHT:
        // Moves the option cursor right, if possible.
        success = this.getActiveChallenge().increaseValue();
        if (success) {
          this.updateText();
        }
        break;
      }
    }

    // Plays a select sound effect if an action was successfully processed.
    if (success) {
      ui.playSelect();
    }

    return success;
  }

  setCursor(cursor: integer): boolean {
    let ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, "summary_moves_cursor", null, (this.scene.game.canvas.width / 9) - 10, 16, 1, 1, 1, 1);
      this.cursorObj.setOrigin(0, 0);
      this.valuesContainer.add(this.cursorObj);
    }

    ret ||= !this.cursorObj.visible;
    this.cursorObj.setVisible(true);

    this.cursorObj.setPositionRelative(this.optionsBg, 4, 4 + (this.cursor + this.scrollCursor) * 16);

    return ret;
  }

  setScrollCursor(scrollCursor: integer): boolean {
    if (scrollCursor === this.scrollCursor) {
      return false;
    }

    this.scrollCursor = scrollCursor;

    this.setCursor(this.cursor);

    return true;
  }

  getActiveChallenge(): Challenge {
    return this.scene.gameMode.challenges[this.cursor + this.scrollCursor];
  }

  clear() {
    super.clear();
    this.challengesContainer.setVisible(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
