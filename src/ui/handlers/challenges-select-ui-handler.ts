import { globalScene } from "#app/global-scene";
import type { Challenge } from "#data/challenge";
import { Button } from "#enums/buttons";
import { Challenges } from "#enums/challenges";
import { Color, ShadowColor } from "#enums/color";
import { TextStyle } from "#enums/text-style";
import type { UiMode } from "#enums/ui-mode";
import { UiHandler } from "#ui/handlers/ui-handler";
import { addTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import { getLocalizedSpriteKey } from "#utils/common";
import i18next from "i18next";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";

/**
 * Handles all the UI for choosing optional challenges.
 */
export class GameChallengesUiHandler extends UiHandler {
  private challengesContainer: Phaser.GameObjects.Container;
  private valuesContainer: Phaser.GameObjects.Container;

  private scrollCursor: number;

  private optionsBg: Phaser.GameObjects.NineSlice;

  // private difficultyText: Phaser.GameObjects.Text;

  private descriptionText: BBCodeText;

  private challengeLabels: Array<{
    label: Phaser.GameObjects.Text;
    value: Phaser.GameObjects.Text;
    leftArrow: Phaser.GameObjects.Image;
    rightArrow: Phaser.GameObjects.Image;
  }>;
  private monoTypeValue: Phaser.GameObjects.Sprite;

  private cursorObj: Phaser.GameObjects.NineSlice | null;

  private startBg: Phaser.GameObjects.NineSlice;
  private startCursor: Phaser.GameObjects.NineSlice;
  private startText: Phaser.GameObjects.Text;
  private hasSelectedChallenge: boolean;

  private optionsWidth: number;

  private widestTextBox: number;

  private readonly leftArrowGap: number = 90; // distance from the label to the left arrow
  private readonly arrowSpacing: number = 3; // distance between the arrows and the value area

  constructor(mode: UiMode | null = null) {
    super(mode);
  }

  setup() {
    const ui = this.getUi();

    this.widestTextBox = 0;

    this.challengesContainer = globalScene.add.container(1, -globalScene.scaledCanvas.height + 1);
    this.challengesContainer.setName("challenges");

    this.challengesContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, globalScene.scaledCanvas.width, globalScene.scaledCanvas.height),
      Phaser.Geom.Rectangle.Contains,
    );

    const bgOverlay = globalScene.add.rectangle(
      -1,
      -1,
      globalScene.scaledCanvas.width,
      globalScene.scaledCanvas.height,
      0x424242,
      0.8,
    );
    bgOverlay.setName("rect-challenge-overlay");
    bgOverlay.setOrigin(0, 0);
    this.challengesContainer.add(bgOverlay);

    // TODO: Change this back to /9 when adding in difficulty
    const headerBg = addWindow(0, 0, globalScene.scaledCanvas.width, 24);
    headerBg.setName("window-header-bg");
    headerBg.setOrigin(0, 0);

    const headerText = addTextObject(0, 0, i18next.t("challenges:title"), TextStyle.HEADER_LABEL);
    headerText.setName("text-header");
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);

    this.optionsWidth = globalScene.scaledCanvas.width * 0.6;
    this.optionsBg = addWindow(
      0,
      headerBg.height,
      this.optionsWidth,
      globalScene.scaledCanvas.height - headerBg.height - 2,
    );
    this.optionsBg.setName("window-options-bg");
    this.optionsBg.setOrigin(0, 0);

    const descriptionBg = addWindow(
      0,
      headerBg.height,
      globalScene.scaledCanvas.width - this.optionsWidth,
      globalScene.scaledCanvas.height - headerBg.height - 26,
    );
    descriptionBg.setName("window-desc-bg");
    descriptionBg.setOrigin(0, 0);
    descriptionBg.setPositionRelative(this.optionsBg, this.optionsBg.width, 0);

    this.descriptionText = new BBCodeText(globalScene, descriptionBg.x + 6, descriptionBg.y + 4, "", {
      fontFamily: "emerald",
      fontSize: 84,
      color: Color.ORANGE,
      padding: {
        bottom: 6,
      },
      wrap: {
        mode: "word",
        width: (descriptionBg.width - 12) * 6,
      },
    });
    this.descriptionText.setName("text-desc");
    globalScene.add.existing(this.descriptionText);
    this.descriptionText.setScale(1 / 6);
    this.descriptionText.setShadow(4, 5, ShadowColor.ORANGE);
    this.descriptionText.setOrigin(0, 0);

    this.startBg = addWindow(0, 0, descriptionBg.width, 24);
    this.startBg.setName("window-start-bg");
    this.startBg.setOrigin(0, 0);
    this.startBg.setPositionRelative(descriptionBg, 0, descriptionBg.height);

    this.startText = addTextObject(0, 0, i18next.t("challenges:noneSelected"), TextStyle.SETTINGS_LABEL);
    this.startText.setName("text-start");
    this.startText.setOrigin(0, 0);
    this.startText.setPositionRelative(this.startBg, (this.startBg.width - this.startText.displayWidth) / 2, 4);

    this.startCursor = globalScene.add.nineslice(
      0,
      0,
      "summary_moves_cursor",
      undefined,
      descriptionBg.width - 8,
      16,
      1,
      1,
      1,
      1,
    );
    this.startCursor.setName("9s-start-cursor");
    this.startCursor.setOrigin(0, 0);
    this.startCursor.setPositionRelative(this.startBg, 4, 3);
    this.startCursor.setVisible(false);

    this.valuesContainer = globalScene.add.container(0, 0);
    this.valuesContainer.setName("values");

    this.challengeLabels = [];

    for (let i = 0; i < 9; i++) {
      const label = addTextObject(8, 28 + i * 16, "", TextStyle.SETTINGS_LABEL);
      label.setName(`text-challenge-label-${i}`);
      label.setOrigin(0, 0);

      this.valuesContainer.add(label);

      const leftArrow = globalScene.add.image(0, 0, "cursor_reverse");
      leftArrow.setName(`challenge-left-arrow-${i}`);
      leftArrow.setOrigin(0, 0);
      leftArrow.setVisible(false);
      leftArrow.setScale(0.75);
      this.valuesContainer.add(leftArrow);

      const rightArrow = globalScene.add.image(0, 0, "cursor");
      rightArrow.setName(`challenge-right-arrow-${i}`);
      rightArrow.setOrigin(0, 0);
      rightArrow.setScale(0.75);
      rightArrow.setVisible(false);
      this.valuesContainer.add(rightArrow);

      const value = addTextObject(0, 28 + i * 16, "", TextStyle.SETTINGS_LABEL);
      value.setName(`challenge-value-text-${i}`);
      value.setPositionRelative(label, 100, 0);
      this.valuesContainer.add(value);

      this.challengeLabels[i] = {
        label,
        value,
        leftArrow,
        rightArrow,
      };
    }

    this.monoTypeValue = globalScene.add.sprite(8, 98, getLocalizedSpriteKey("types"));
    this.monoTypeValue.setName("challenge-value-monotype-sprite");
    this.monoTypeValue.setScale(0.86);
    this.monoTypeValue.setVisible(false);
    this.valuesContainer.add(this.monoTypeValue);

    this.challengesContainer.add(headerBg);
    this.challengesContainer.add(headerText);
    // this.challengesContainer.add(difficultyBg);
    // this.challengesContainer.add(this.difficultyText);
    // this.challengesContainer.add(difficultyName);
    this.challengesContainer.add(this.optionsBg);
    this.challengesContainer.add(descriptionBg);
    this.challengesContainer.add(this.descriptionText);
    this.challengesContainer.add(this.startBg);
    this.challengesContainer.add(this.startText);
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
    this.setDescription(globalScene.gameMode.challenges[0].getDescription());
    this.widestTextBox = 0;
    for (let i = 0; i < 9; i++) {
      if (i < globalScene.gameMode.challenges.length) {
        this.challengeLabels[i].label.setVisible(true);
        this.challengeLabels[i].value.setVisible(true);
        this.challengeLabels[i].leftArrow.setVisible(true);
        this.challengeLabels[i].rightArrow.setVisible(true);

        const tempText = addTextObject(0, 0, "", TextStyle.SETTINGS_LABEL); // this is added here to get the widest text object for this language, which will be used for the arrow placement

        for (let j = 0; j <= globalScene.gameMode.challenges[i].maxValue; j++) {
          // this goes through each challenge's value to find out what the max width will be
          if (globalScene.gameMode.challenges[i].id !== Challenges.SINGLE_TYPE) {
            tempText.setText(globalScene.gameMode.challenges[i].getValue(j));
            if (tempText.displayWidth > this.widestTextBox) {
              this.widestTextBox = tempText.displayWidth;
            }
          }
        }

        tempText.destroy();
      }
    }
  }

  /**
   * update the text the cursor is on
   */
  updateText(): void {
    this.setDescription(this.getActiveChallenge().getDescription());
    let monoTypeVisible = false;
    for (let i = 0; i < Math.min(9, globalScene.gameMode.challenges.length); i++) {
      const challenge = globalScene.gameMode.challenges[this.scrollCursor + i];
      const challengeLabel = this.challengeLabels[i];
      challengeLabel.label.setText(challenge.getName());
      challengeLabel.leftArrow.setPositionRelative(challengeLabel.label, this.leftArrowGap, 4.5);
      challengeLabel.leftArrow.setVisible(challenge.value !== 0);
      challengeLabel.rightArrow.setPositionRelative(
        challengeLabel.leftArrow,
        Math.max(this.monoTypeValue.width, this.widestTextBox)
          + challengeLabel.leftArrow.displayWidth
          + 2 * this.arrowSpacing,
        0,
      );
      challengeLabel.rightArrow.setVisible(challenge.value !== challenge.maxValue);

      // this check looks to make sure that the arrows and value textbox don't take up too much space that they'll clip the right edge of the options background
      if (
        challengeLabel.rightArrow.x + challengeLabel.rightArrow.width + this.optionsBg.rightWidth + this.arrowSpacing
        > this.optionsWidth
      ) {
        // if we go out of bounds of the box, set the x position as far right as we can without going past the box, with this.arrowSpacing to allow a small gap between the arrow and border
        challengeLabel.rightArrow.setX(this.optionsWidth - this.arrowSpacing - this.optionsBg.rightWidth);
      }

      // this line of code gets the center point between the left and right arrows from their left side (Arrow.x gives middle point), taking into account the width of the arrows
      const xLocation = Math.round(
        (challengeLabel.leftArrow.x + challengeLabel.rightArrow.x + challengeLabel.leftArrow.displayWidth) / 2,
      );
      if (challenge.id === Challenges.SINGLE_TYPE) {
        this.monoTypeValue.setX(xLocation);
        this.monoTypeValue.setY(challengeLabel.label.y + 8);
        this.monoTypeValue.setFrame(challenge.getValue());
        this.monoTypeValue.setVisible(true);
        challengeLabel.value.setVisible(false);
        monoTypeVisible = true;
      } else {
        challengeLabel.value.setText(challenge.getValue());
        challengeLabel.value.setX(xLocation);
        challengeLabel.value.setOrigin(0.5, 0);
        challengeLabel.value.setVisible(true);
      }
    }
    if (!monoTypeVisible) {
      this.monoTypeValue.setVisible(false);
    }

    // This checks if a challenge has been selected by the user and updates the text/its opacity accordingly.
    this.hasSelectedChallenge = globalScene.gameMode.challenges.some(c => c.value !== 0);
    if (this.hasSelectedChallenge) {
      this.startText.setText(i18next.t("common:start"));
      this.startText.setAlpha(1);
      this.startText.setPositionRelative(this.startBg, (this.startBg.width - this.startText.displayWidth) / 2, 4);
    } else {
      this.startText.setText(i18next.t("challenges:noneSelected"));
      this.startText.setAlpha(0.5);
      this.startText.setPositionRelative(this.startBg, (this.startBg.width - this.startText.displayWidth) / 2, 4);
    }
    this.challengesContainer.update();
  }

  show(args: any[]): boolean {
    super.show(args);

    this.startCursor.setVisible(false);
    this.updateChallengeArrows(false);
    this.challengesContainer.setVisible(true);
    // Should always be false at the start
    this.hasSelectedChallenge = globalScene.gameMode.challenges.some(c => c.value !== 0);
    this.setCursor(0);

    this.initLabels();
    this.updateText();

    this.getUi().moveTo(this.challengesContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
  }

  /* This code updates the challenge starter arrows to be tinted/not tinted when the start button is selected to show they can't be changed
   */
  updateChallengeArrows(tinted: boolean) {
    for (let i = 0; i < Math.min(9, globalScene.gameMode.challenges.length); i++) {
      const challengeLabel = this.challengeLabels[i];
      if (tinted) {
        challengeLabel.leftArrow.setTint(0x808080);
        challengeLabel.rightArrow.setTint(0x808080);
      } else {
        challengeLabel.leftArrow.clearTint();
        challengeLabel.rightArrow.clearTint();
      }
    }
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
        // If the user presses cancel when the start cursor has been activated, the game deactivates the start cursor and allows typical challenge selection behavior
        this.startCursor.setVisible(false);
        this.cursorObj?.setVisible(true);
        this.updateChallengeArrows(this.startCursor.visible);
      } else {
        globalScene.phaseManager.toTitleScreen();
        globalScene.phaseManager.getCurrentPhase().end();
      }
      success = true;
    } else if (button === Button.SUBMIT || button === Button.ACTION) {
      if (this.hasSelectedChallenge) {
        if (this.startCursor.visible) {
          globalScene.phaseManager.unshiftNew("SelectStarterPhase");
          globalScene.phaseManager.getCurrentPhase().end();
        } else {
          this.startCursor.setVisible(true);
          this.cursorObj?.setVisible(false);
          this.updateChallengeArrows(this.startCursor.visible);
        }
        success = true;
      } else {
        success = false;
      }
    } else if (this.cursorObj?.visible && !this.startCursor.visible) {
      switch (button) {
        case Button.UP:
          if (this.cursor === 0) {
            if (this.scrollCursor === 0) {
              // When at the top of the menu and pressing UP, move to the bottommost item.
              if (globalScene.gameMode.challenges.length > rowsToDisplay) {
                // If there are more than 9 challenges, scroll to the bottom
                // First, set the cursor to the last visible element, preparing for the scroll to the end.
                const successA = this.setCursor(rowsToDisplay - 1);
                // Then, adjust the scroll to display the bottommost elements of the menu.
                const successB = this.setScrollCursor(globalScene.gameMode.challenges.length - rowsToDisplay);
                success = successA && successB; // success is just there to play the little validation sound effect
              } else {
                // If there are 9 or less challenges, just move to the bottom one
                success = this.setCursor(globalScene.gameMode.challenges.length - 1);
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
            if (this.scrollCursor < globalScene.gameMode.challenges.length - rowsToDisplay) {
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
          } else if (
            globalScene.gameMode.challenges.length < rowsToDisplay
            && this.cursor === globalScene.gameMode.challenges.length - 1
          ) {
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

  setCursor(cursor: number): boolean {
    let ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add.nineslice(
        0,
        0,
        "summary_moves_cursor",
        undefined,
        this.optionsWidth - 8,
        16,
        1,
        1,
        1,
        1,
      );
      this.cursorObj.setOrigin(0, 0);
      this.valuesContainer.add(this.cursorObj);
    }

    ret ||= !this.cursorObj.visible;
    this.cursorObj.setVisible(true);

    this.cursorObj.setPositionRelative(this.optionsBg, 4, 4 + (this.cursor + this.scrollCursor) * 16);

    return ret;
  }

  setScrollCursor(scrollCursor: number): boolean {
    if (scrollCursor === this.scrollCursor) {
      return false;
    }

    this.scrollCursor = scrollCursor;

    this.setCursor(this.cursor);

    return true;
  }

  getActiveChallenge(): Challenge {
    return globalScene.gameMode.challenges[this.cursor + this.scrollCursor];
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
