import BattleScene from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { addWindow } from "./ui-theme";
import {Button} from "../enums/buttons";
import i18next from "#app/plugins/i18n.js";
import { SelectStarterPhase, TitlePhase } from "#app/phases.js";

/**
 * Handles all the UI for choosing optional challenges.
 */
export default class GameChallengesUiHandler extends UiHandler {
  private challengesContainer: Phaser.GameObjects.Container;
  private valuesContainer: Phaser.GameObjects.Container;

  private scrollCursor: integer;

  private optionsBg: Phaser.GameObjects.NineSlice;

  private difficultyText: Phaser.GameObjects.Text;

  private descriptionText: Phaser.GameObjects.Text;

  private challengeLabels: Phaser.GameObjects.Text[];
  private challengeValueLabels: Phaser.GameObjects.Text[];

  private cursorObj: Phaser.GameObjects.NineSlice;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
  }

  setup() {
    const ui = this.getUi();

    this.challengesContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.challengesContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 9), 24);
    headerBg.setOrigin(0, 0);

    const headerText = addTextObject(this.scene, 0, 0, i18next.t("challengeUiHandler:CHALLENGE_TITLE"), TextStyle.SETTINGS_LABEL);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);

    const difficultyBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 18) - 2, 24);
    difficultyBg.setOrigin(0, 0);
    difficultyBg.setPositionRelative(headerBg, headerBg.width, 0);

    this.difficultyText = addTextObject(this.scene, 0, 0, "0", TextStyle.SETTINGS_LABEL);
    this.difficultyText.setOrigin(0, 0);
    this.difficultyText.setPositionRelative(difficultyBg, 8, 4);

    const difficultyName = addTextObject(this.scene, 0, 0, i18next.t("challengeUiHandler:CHALLENGE_POINTS"), TextStyle.SETTINGS_LABEL);
    difficultyName.setOrigin(0, 0);
    difficultyName.setPositionRelative(difficultyBg, difficultyBg.width - difficultyName.displayWidth - 8, 4);

    this.optionsBg = addWindow(this.scene, 0, headerBg.height, (this.scene.game.canvas.width / 9), (this.scene.game.canvas.height / 6) - headerBg.height - 2);
    this.optionsBg.setOrigin(0, 0);

    const descriptionBg = addWindow(this.scene, 0, headerBg.height, (this.scene.game.canvas.width / 18) - 2, (this.scene.game.canvas.height / 6) - headerBg.height - 2);
    descriptionBg.setOrigin(0, 0);
    descriptionBg.setPositionRelative(this.optionsBg, this.optionsBg.width, 0);

    this.descriptionText = addTextObject(this.scene, 0, 0, this.scene.gameMode.challenges[0].getDescription(), TextStyle.SETTINGS_LABEL);
    this.descriptionText.setOrigin(0, 0);
    this.descriptionText.setWordWrapWidth(500, true);
    this.descriptionText.setPositionRelative(descriptionBg, 6, 4);

    this.valuesContainer = this.scene.add.container(0, 0);

    this.challengeLabels = [];
    this.challengeValueLabels = [];

    this.scene.gameMode.challenges.forEach((challenge, s) => {
      this.challengeLabels[s] = addTextObject(this.scene, 8, 28 + s * 16, challenge.getName(), TextStyle.SETTINGS_LABEL);
      this.challengeLabels[s].setOrigin(0, 0);

      this.valuesContainer.add(this.challengeLabels[s]);

      this.challengeValueLabels[s] = addTextObject(this.scene, 0, 28 + s * 16, challenge.getValue(), TextStyle.SETTINGS_LABEL);
      this.challengeValueLabels[s].setPositionRelative(this.challengeLabels[s], 100, 0);

      this.valuesContainer.add(this.challengeValueLabels[s]);
    });

    this.challengesContainer.add(headerBg);
    this.challengesContainer.add(headerText);
    this.challengesContainer.add(difficultyBg);
    this.challengesContainer.add(this.difficultyText);
    this.challengesContainer.add(difficultyName);
    this.challengesContainer.add(this.optionsBg);
    this.challengesContainer.add(descriptionBg);
    this.challengesContainer.add(this.descriptionText);
    this.challengesContainer.add(this.valuesContainer);

    ui.add(this.challengesContainer);

    this.setCursor(0);
    this.setScrollCursor(0);

    this.challengesContainer.setVisible(false);
  }


  updateText(): void {
    this.descriptionText.text = this.scene.gameMode.challenges[this.cursor + this.scrollCursor].getDescription();
    this.descriptionText.updateText();

    const totalDifficulty = this.scene.gameMode.challenges.reduce((v, c) => v + c.getDifficulty(), 0);
    const totalMinDifficulty = this.scene.gameMode.challenges.reduce((v, c) => v + c.getMinDifficulty(), 0);
    this.difficultyText.text = `${totalDifficulty}` + (totalMinDifficulty ? `/${totalMinDifficulty}` : "");
    this.difficultyText.updateText();

    this.challengeValueLabels.forEach((t, i) => {
      this.challengeValueLabels[i].text = this.scene.gameMode.challenges[i].getValue();
      this.challengeValueLabels[i].updateText();
    });
  }

  show(args: any[]): boolean {
    super.show(args);

    this.challengesContainer.setVisible(true);
    this.setCursor(0);

    this.updateText();

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
      this.scene.clearPhaseQueue();
      this.scene.pushPhase(new TitlePhase(this.scene));
      this.scene.getCurrentPhase().end();
      success = true;
    } else if (button === Button.SUBMIT) {
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
      const cursor = this.cursor + this.scrollCursor;
      switch (button) {
      case Button.UP:
        if (cursor) {
          if (this.cursor) {
            success = this.setCursor(this.cursor - 1);
          } else {
            success = this.setScrollCursor(this.scrollCursor - 1);
          }
        } else {
          // When at the top of the menu and pressing UP, move to the bottommost item.
          // First, set the cursor to the last visible element, preparing for the scroll to the end.
          const successA = this.setCursor(rowsToDisplay - 1);
          // Then, adjust the scroll to display the bottommost elements of the menu.
          const successB = this.setScrollCursor(this.challengeLabels.length - rowsToDisplay);
          success = successA && successB; // success is just there to play the little validation sound effect
        }
        if (success) {
          this.updateText();
        }
        break;
      case Button.DOWN:
        if (cursor < this.challengeLabels.length - 1) {
          if (this.cursor < rowsToDisplay - 1) { // if the visual cursor is in the frame of 0 to 8
            success = this.setCursor(this.cursor + 1);
          } else if (this.scrollCursor < this.challengeLabels.length - rowsToDisplay) {
            success = this.setScrollCursor(this.scrollCursor + 1);
          }
        } else {
          // When at the bottom of the menu and pressing DOWN, move to the topmost item.
          // First, set the cursor to the first visible element, resetting the scroll to the top.
          const successA = this.setCursor(0);
          // Then, reset the scroll to start from the first element of the menu.
          const successB = this.setScrollCursor(0);
          success = successA && successB; // Indicates a successful cursor and scroll adjustment.
        }
        if (success) {
          this.updateText();
        }
        break;
      case Button.LEFT:
        // Moves the option cursor left, if possible.
        success = this.scene.gameMode.challenges[cursor].decreaseValue();
        if (success) {
          this.updateText();
        }
        break;
      case Button.RIGHT:
        // Moves the option cursor right, if possible.
        success = this.scene.gameMode.challenges[cursor].increaseValue();
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
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, "summary_moves_cursor", null, (this.scene.game.canvas.width / 9) - 10, 16, 1, 1, 1, 1);
      this.cursorObj.setOrigin(0, 0);
      this.valuesContainer.add(this.cursorObj);
    }

    this.cursorObj.setPositionRelative(this.optionsBg, 4, 4 + (this.cursor + this.scrollCursor) * 16);

    return ret;
  }

  setScrollCursor(scrollCursor: integer): boolean {
    if (scrollCursor === this.scrollCursor) {
      return false;
    }

    this.scrollCursor = scrollCursor;

    this.updateChallengesScroll();

    this.setCursor(this.cursor);

    return true;
  }

  updateChallengesScroll(): void {
    this.valuesContainer.setY(-16 * this.scrollCursor);

    for (let s = 0; s < this.challengeLabels.length; s++) {
      const visible = s >= this.scrollCursor && s < this.scrollCursor + 9;
      this.challengeLabels[s].setVisible(visible);
      this.challengeValueLabels[s].setVisible(visible);
    }
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
