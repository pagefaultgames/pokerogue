import { globalScene } from "#app/global-scene";
import type { Challenge } from "#data/challenge";
import { Button } from "#enums/buttons";
import { Challenges } from "#enums/challenges";
import { Color, ShadowColor } from "#enums/color";
import { TextStyle } from "#enums/text-style";
import type { UiMode } from "#enums/ui-mode";
import { addTextObject } from "#ui/text";
import { UiHandler } from "#ui/ui-handler";
import { addWindow } from "#ui/ui-theme";
import { getLocalizedSpriteKey } from "#utils/common";
import i18next from "i18next";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";

type ChallengeLabel = {
  label: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  leftArrow: Phaser.GameObjects.Image;
  rightArrow: Phaser.GameObjects.Image;
};

const MAX_ROWS_TO_DISPLAY = 9;

/** Handles all the UI for choosing optional challenges. */
export class GameChallengesUiHandler extends UiHandler {
  private challengesContainer: Phaser.GameObjects.Container;
  private valuesContainer: Phaser.GameObjects.Container;

  private scrollCursor: number;

  private optionsBg: Phaser.GameObjects.NineSlice;

  // private difficultyText: Phaser.GameObjects.Text;

  private descriptionText: BBCodeText;

  private readonly challengeLabels: ChallengeLabel[] = [];
  private monoTypeValue: Phaser.GameObjects.Sprite;

  private cursorObj: Phaser.GameObjects.NineSlice | null;

  private startBg: Phaser.GameObjects.NineSlice;
  private startCursor: Phaser.GameObjects.NineSlice;
  private startText: Phaser.GameObjects.Text;
  private hasSelectedChallenge: boolean;

  private optionsWidth: number;

  private widestTextBox: number;

  /** Distance from the label to the left arrow */
  private readonly leftArrowGap: number = 90;
  /** Distance between the arrows and the value area */
  private readonly arrowSpacing: number = 3;

  constructor(mode: UiMode | null = null) {
    super(mode);
  }

  public override setup(): void {
    const ui = this.getUi();
    const { width: canvasWidth, height: canvasHeight } = globalScene.scaledCanvas;

    this.widestTextBox = 0;

    this.challengesContainer = globalScene.add //
      .container(1, -canvasHeight + 1)
      .setName("challenges");

    this.challengesContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, canvasWidth, canvasHeight),
      Phaser.Geom.Rectangle.Contains,
    );

    const bgOverlay = globalScene.add
      .rectangle(-1, -1, canvasWidth, canvasHeight, 0x424242, 0.8)
      .setName("rect-challenge-overlay")
      .setOrigin(0);
    this.challengesContainer.add(bgOverlay);

    // TODO: Change this back to /9 when adding in difficulty
    const headerBg = addWindow(0, 0, canvasWidth, 24) //
      .setName("window-header-bg")
      .setOrigin(0);

    const headerText = addTextObject(0, 0, i18next.t("challenges:title"), TextStyle.HEADER_LABEL)
      .setName("text-header")
      .setOrigin(0)
      .setPositionRelative(headerBg, 8, 4);

    this.optionsWidth = canvasWidth * 0.6;
    this.optionsBg = addWindow(0, headerBg.height, this.optionsWidth, canvasHeight - headerBg.height - 2)
      .setName("window-options-bg")
      .setOrigin(0);

    const descriptionBg = addWindow(
      0,
      headerBg.height,
      canvasWidth - this.optionsWidth,
      canvasHeight - headerBg.height - 26,
    )
      .setName("window-desc-bg")
      .setOrigin(0)
      .setPositionRelative(this.optionsBg, this.optionsBg.width, 0);

    this.descriptionText = new BBCodeText(globalScene, descriptionBg.x + 6, descriptionBg.y + 4, "", {
      fontFamily: "emerald",
      fontSize: 84,
      color: Color.ORANGE,
      padding: { bottom: 6 },
      wrap: { mode: "word", width: (descriptionBg.width - 12) * 6 },
    })
      .setName("text-desc")
      .setScale(1 / 6)
      .setShadow(4, 5, ShadowColor.ORANGE)
      .setOrigin(0);
    globalScene.add.existing(this.descriptionText);

    this.startBg = addWindow(0, 0, descriptionBg.width, 24)
      .setName("window-start-bg")
      .setOrigin(0)
      .setPositionRelative(descriptionBg, 0, descriptionBg.height);

    this.startText = addTextObject(0, 0, i18next.t("challenges:noneSelected"), TextStyle.SETTINGS_LABEL)
      .setName("text-start")
      .setOrigin(0);
    this.startText.setPositionRelative(this.startBg, (this.startBg.width - this.startText.displayWidth) / 2, 4);

    this.startCursor = globalScene.add
      .nineslice(0, 0, "summary_moves_cursor", undefined, descriptionBg.width - 8, 16, 1, 1, 1, 1)
      .setName("9s-start-cursor")
      .setOrigin(0)
      .setPositionRelative(this.startBg, 4, 3)
      .setVisible(false);

    this.valuesContainer = globalScene.add //
      .container(0, 0)
      .setName("values");

    for (let i = 0; i < MAX_ROWS_TO_DISPLAY; i++) {
      const label = addTextObject(8, 28 + i * 16, "", TextStyle.SETTINGS_LABEL)
        .setName(`text-challenge-label-${i}`)
        .setOrigin(0);

      const leftArrow = globalScene.add
        .image(0, 0, "cursor_reverse")
        .setName(`challenge-left-arrow-${i}`)
        .setOrigin(0)
        .setVisible(false)
        .setScale(0.75);

      const rightArrow = globalScene.add
        .image(0, 0, "cursor")
        .setName(`challenge-right-arrow-${i}`)
        .setOrigin(0)
        .setScale(0.75)
        .setVisible(false);

      const value = addTextObject(0, 28 + i * 16, "", TextStyle.SETTINGS_LABEL)
        .setName(`challenge-value-text-${i}`)
        .setPositionRelative(label, 100, 0);

      this.valuesContainer.add([label, leftArrow, rightArrow, value]);

      this.challengeLabels[i] = { label, value, leftArrow, rightArrow };
    }

    this.monoTypeValue = globalScene.add
      .sprite(8, 98, getLocalizedSpriteKey("types"))
      .setName("challenge-value-monotype-sprite")
      .setScale(0.86)
      .setVisible(false);
    this.valuesContainer.add(this.monoTypeValue);

    this.challengesContainer.add([
      headerBg,
      headerText,
      // difficultyBg,
      // this.difficultyText,
      // difficultyName,
      this.optionsBg,
      descriptionBg,
      this.descriptionText,
      this.startBg,
      this.startText,
      this.startCursor,
      this.valuesContainer,
    ]);

    ui.add(this.challengesContainer);

    this.setCursor(0);
    this.setScrollCursor(0);

    this.challengesContainer.setVisible(false);
  }

  /**
   * Sets the description text, using orange for the text & shadow colors.
   * @param text - The text to set
   */
  private setDescription(text: string): void {
    this.descriptionText.setText(`[color=${Color.ORANGE}][shadow=${ShadowColor.ORANGE}]${text}`);
  }

  private initLabels(): void {
    const { challenges } = globalScene.gameMode;

    this.setDescription(challenges[0].getDescription());
    this.widestTextBox = 0;
    for (let i = 0; i < MAX_ROWS_TO_DISPLAY; i++) {
      if (i >= challenges.length) {
        break;
      }

      this.challengeLabels[i].label.setVisible(true);
      this.challengeLabels[i].value.setVisible(true);
      this.challengeLabels[i].leftArrow.setVisible(true);
      this.challengeLabels[i].rightArrow.setVisible(true);

      // this is used to get the widest text object for this language, which will be used for the arrow placement
      const tempText = addTextObject(0, 0, "", TextStyle.SETTINGS_LABEL);

      for (let j = 0; j <= challenges[i].maxValue; j++) {
        if (challenges[i].id === Challenges.SINGLE_TYPE) {
          continue;
        }

        tempText.setText(challenges[i].getValue(j));
        if (tempText.displayWidth > this.widestTextBox) {
          this.widestTextBox = tempText.displayWidth;
        }
      }

      tempText.destroy();
    }
  }

  private updateText(): void {
    const { challenges } = globalScene.gameMode;

    this.setDescription(this.getActiveChallenge().getDescription());
    let monoTypeVisible = false;
    for (let i = 0; i < Math.min(MAX_ROWS_TO_DISPLAY, challenges.length); i++) {
      const challenge = challenges[this.scrollCursor + i];
      const challengeLabel = this.challengeLabels[i];
      challengeLabel.label.setText(challenge.getName());
      challengeLabel.leftArrow
        .setPositionRelative(challengeLabel.label, this.leftArrowGap, 4.5)
        .setVisible(challenge.value !== 0);
      challengeLabel.rightArrow
        .setPositionRelative(
          challengeLabel.leftArrow,
          Math.max(this.monoTypeValue.width, this.widestTextBox)
            + challengeLabel.leftArrow.displayWidth
            + 2 * this.arrowSpacing,
          0,
        )
        .setVisible(challenge.value !== challenge.maxValue);

      // this check looks to make sure that the arrows and value textbox don't take up too much space
      // that they'll clip the right edge of the options background
      if (
        challengeLabel.rightArrow.x + challengeLabel.rightArrow.width + this.optionsBg.rightWidth + this.arrowSpacing
        > this.optionsWidth
      ) {
        // if we go out of bounds of the box, set the x position as far right as we can without going past the box,
        // with `this.arrowSpacing` to allow a small gap between the arrow and border
        challengeLabel.rightArrow.setX(this.optionsWidth - this.arrowSpacing - this.optionsBg.rightWidth);
      }

      // this line of code gets the center point between the left and right arrows from their left side
      // (`Arrow.x` gives middle point), taking into account the width of the arrows
      const xLocation = Math.round(
        (challengeLabel.leftArrow.x + challengeLabel.rightArrow.x + challengeLabel.leftArrow.displayWidth) / 2,
      );
      if (challenge.id === Challenges.SINGLE_TYPE) {
        this.monoTypeValue
          .setX(xLocation)
          .setY(challengeLabel.label.y + 8)
          .setFrame(challenge.getValue())
          .setVisible(true);
        challengeLabel.value.setVisible(false);
        monoTypeVisible = true;
      } else {
        challengeLabel.value //
          .setText(challenge.getValue())
          .setX(xLocation)
          .setOrigin(0.5, 0)
          .setVisible(true);
      }
    }
    if (!monoTypeVisible) {
      this.monoTypeValue.setVisible(false);
    }

    this.hasSelectedChallenge = challenges.some(c => c.value !== 0);
    let i18nKey = "common:start";
    let alphaValue = 1;
    if (!this.hasSelectedChallenge) {
      i18nKey = "challenges:noneSelected";
      alphaValue = 0.5;
    }
    this.startText
      .setText(i18next.t(i18nKey))
      .setAlpha(alphaValue)
      .setPositionRelative(this.startBg, (this.startBg.width - this.startText.displayWidth) / 2, 4);

    this.challengesContainer.update();
  }

  public override show(args: any[]): boolean {
    super.show(args);

    const { challenges } = globalScene.gameMode;

    this.startCursor.setVisible(false);
    this.updateChallengeArrowsTint(false);
    this.challengesContainer.setVisible(true);
    this.hasSelectedChallenge = challenges.some(c => c.value !== 0);
    this.setCursor(0);

    this.initLabels();
    this.updateText();

    this.getUi().moveTo(this.challengesContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
  }

  private updateChallengeArrowsTint(tinted: boolean): void {
    const { challenges } = globalScene.gameMode;

    for (let i = 0; i < Math.min(MAX_ROWS_TO_DISPLAY, challenges.length); i++) {
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
   *
   * This method handles navigation through a UI menu,
   * including movement through menu item and handling special actions like cancellation. \
   * Each button press may adjust the cursor position or the menu scroll,
   * and plays a sound effect if the action was successful.
   *
   * @param button - The button pressed by the user.
   * @returns Whether the action associated with the button was successfully processed
   */
  public override processInput(button: Button): boolean {
    const ui = this.getUi();
    const { gameMode, phaseManager } = globalScene;
    const { challenges } = gameMode;

    let success = false;

    if (button === Button.CANCEL) {
      if (this.startCursor.visible) {
        // If the user presses cancel when the start cursor has been activated,
        // the game deactivates the start cursor and allows typical challenge selection behavior
        this.startCursor.setVisible(false);
        this.cursorObj?.setVisible(true);
        this.updateChallengeArrowsTint(this.startCursor.visible);
      } else {
        phaseManager.toTitleScreen();
        phaseManager.getCurrentPhase().end();
      }
      success = true;
    } else if (button === Button.SUBMIT || button === Button.ACTION) {
      if (this.hasSelectedChallenge) {
        if (this.startCursor.visible) {
          phaseManager.unshiftNew("SelectStarterPhase");
          phaseManager.getCurrentPhase().end();
        } else {
          this.startCursor.setVisible(true);
          this.cursorObj?.setVisible(false);
          this.updateChallengeArrowsTint(this.startCursor.visible);
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
              if (challenges.length > MAX_ROWS_TO_DISPLAY) {
                // If there are more than `MAX_ROWS_TO_DISPLAY` challenges, scroll to the bottom
                // First, set the cursor to the last visible element, preparing for the scroll to the end.
                const successA = this.setCursor(MAX_ROWS_TO_DISPLAY - 1);
                // Then, adjust the scroll to display the bottommost elements of the menu.
                const successB = this.setScrollCursor(challenges.length - MAX_ROWS_TO_DISPLAY);
                success = successA && successB; // success is just there to play the little validation sound effect
              } else {
                // If there are `MAX_ROWS_TO_DISPLAY` or less challenges, just move to the bottom one
                success = this.setCursor(challenges.length - 1);
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
          if (this.cursor === MAX_ROWS_TO_DISPLAY - 1) {
            if (this.scrollCursor < challenges.length - MAX_ROWS_TO_DISPLAY) {
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
          } else if (challenges.length < MAX_ROWS_TO_DISPLAY && this.cursor === challenges.length - 1) {
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
          success = this.getActiveChallenge().decreaseValue();
          if (success) {
            this.updateText();
          }
          break;
        case Button.RIGHT:
          success = this.getActiveChallenge().increaseValue();
          if (success) {
            this.updateText();
          }
          break;
      }
    }

    if (success) {
      ui.playSelect();
    }
    return success;
  }

  public override setCursor(cursor: number): boolean {
    let ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add
        .nineslice(0, 0, "summary_moves_cursor", undefined, this.optionsWidth - 8, 16, 1, 1, 1, 1)
        .setOrigin(0);
      this.valuesContainer.add(this.cursorObj);
    }

    ret ||= !this.cursorObj.visible;
    this.cursorObj //
      .setVisible(true)
      .setPositionRelative(this.optionsBg, 4, 4 + (this.cursor + this.scrollCursor) * 16);

    return ret;
  }

  private setScrollCursor(scrollCursor: number): boolean {
    if (scrollCursor === this.scrollCursor) {
      return false;
    }

    this.scrollCursor = scrollCursor;

    this.setCursor(this.cursor);

    return true;
  }

  private getActiveChallenge(): Challenge {
    return globalScene.gameMode.challenges[this.cursor + this.scrollCursor];
  }

  public override clear(): void {
    super.clear();
    this.challengesContainer.setVisible(false);
    this.eraseCursor();
  }

  private eraseCursor(): void {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
