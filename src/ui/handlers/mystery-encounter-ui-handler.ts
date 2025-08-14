import { globalScene } from "#app/global-scene";
import { getPokeballAtlasKey } from "#data/pokeball";
import { Button } from "#enums/buttons";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { getEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import type { OptionSelectSettings } from "#mystery-encounters/encounter-phase-utils";
import type { MysteryEncounterOption } from "#mystery-encounters/mystery-encounter-option";
import type { MysteryEncounterPhase } from "#phases/mystery-encounter-phases";
import { PartyUiMode } from "#ui/handlers/party-ui-handler";
import { UiHandler } from "#ui/handlers/ui-handler";
import { addBBCodeTextObject, getBBCodeFrag } from "#ui/text";
import { addWindow, WindowVariant } from "#ui/ui-theme";
import { fixedInt, isNullOrUndefined } from "#utils/common";
import i18next from "i18next";
import type BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";

export class MysteryEncounterUiHandler extends UiHandler {
  private cursorContainer: Phaser.GameObjects.Container;
  private cursorObj?: Phaser.GameObjects.Image;

  private optionsContainer: Phaser.GameObjects.Container;
  // Length = max number of allowable options (4)
  private optionScrollTweens: (Phaser.Tweens.Tween | null)[] = new Array(4).fill(null);

  private tooltipWindow: Phaser.GameObjects.NineSlice;
  private tooltipContainer: Phaser.GameObjects.Container;
  private tooltipScrollTween?: Phaser.Tweens.Tween;

  private descriptionWindow: Phaser.GameObjects.NineSlice;
  private descriptionContainer: Phaser.GameObjects.Container;
  private descriptionScrollTween?: Phaser.Tweens.Tween;
  private rarityBall: Phaser.GameObjects.Sprite;

  private dexProgressWindow: Phaser.GameObjects.NineSlice;
  private dexProgressContainer: Phaser.GameObjects.Container;
  private showDexProgress = false;

  private overrideSettings?: OptionSelectSettings;
  private encounterOptions: MysteryEncounterOption[] = [];
  private optionsMeetsReqs: boolean[];

  protected viewPartyIndex = 0;
  protected viewPartyXPosition = 0;

  protected blockInput = true;

  constructor() {
    super(UiMode.MYSTERY_ENCOUNTER);
  }

  override setup() {
    const ui = this.getUi();

    this.cursorContainer = globalScene.add.container(18, -38.7);
    this.cursorContainer.setVisible(false);
    ui.add(this.cursorContainer);
    this.optionsContainer = globalScene.add.container(12, -38.7);
    this.optionsContainer.setVisible(false);
    ui.add(this.optionsContainer);
    this.dexProgressContainer = globalScene.add.container(214, -43);
    this.dexProgressContainer.setVisible(false);
    ui.add(this.dexProgressContainer);
    this.descriptionContainer = globalScene.add.container(0, -152);
    this.descriptionContainer.setVisible(false);
    ui.add(this.descriptionContainer);
    this.tooltipContainer = globalScene.add.container(210, -48);
    this.tooltipContainer.setVisible(false);
    ui.add(this.tooltipContainer);

    this.setCursor(this.getCursor());

    this.descriptionWindow = addWindow(0, 0, 150, 105, false, false, 0, 0, WindowVariant.THIN);
    this.descriptionContainer.add(this.descriptionWindow);

    this.tooltipWindow = addWindow(0, 0, 110, 48, false, false, 0, 0, WindowVariant.THIN);
    this.tooltipContainer.add(this.tooltipWindow);

    this.dexProgressWindow = addWindow(0, 0, 24, 28, false, false, 0, 0, WindowVariant.THIN);
    this.dexProgressContainer.add(this.dexProgressWindow);

    this.rarityBall = globalScene.add.sprite(141, 9, "pb");
    this.rarityBall.setScale(0.75);
    this.descriptionContainer.add(this.rarityBall);

    const dexProgressIndicator = globalScene.add.sprite(12, 10, "encounter_radar");
    dexProgressIndicator.setScale(0.8);
    this.dexProgressContainer.add(dexProgressIndicator);
    this.dexProgressContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, 24, 28), Phaser.Geom.Rectangle.Contains);
  }

  override show(args: any[]): boolean {
    super.show(args);

    this.overrideSettings = (args[0] as OptionSelectSettings) ?? {};
    const showDescriptionContainer = isNullOrUndefined(this.overrideSettings?.hideDescription)
      ? true
      : !this.overrideSettings.hideDescription;
    const slideInDescription = isNullOrUndefined(this.overrideSettings?.slideInDescription)
      ? true
      : this.overrideSettings.slideInDescription;
    const startingCursorIndex = this.overrideSettings?.startingCursorIndex ?? 0;

    this.cursorContainer.setVisible(true);
    this.descriptionContainer.setVisible(showDescriptionContainer);
    this.optionsContainer.setVisible(true);
    this.dexProgressContainer.setVisible(true);
    this.displayEncounterOptions(slideInDescription);
    const cursor = this.getCursor();
    if (cursor === (this.optionsContainer?.length || 0) - 1) {
      // Always resets cursor on view party button if it was last there
      this.setCursor(cursor);
    } else {
      this.setCursor(startingCursorIndex);
    }
    if (this.blockInput) {
      setTimeout(() => {
        this.unblockInput();
      }, 1000);
    }
    this.displayOptionTooltip();

    return true;
  }

  override processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const cursor = this.getCursor();

    if (button === Button.CANCEL || button === Button.ACTION) {
      if (button === Button.ACTION) {
        const selected = this.encounterOptions[cursor];
        if (cursor === this.viewPartyIndex) {
          // Handle view party
          success = true;
          const overrideSettings: OptionSelectSettings = {
            ...this.overrideSettings,
            slideInDescription: false,
          };
          globalScene.ui.setMode(UiMode.PARTY, PartyUiMode.CHECK, -1, () => {
            globalScene.ui.setMode(UiMode.MYSTERY_ENCOUNTER, overrideSettings);
            setTimeout(() => {
              this.setCursor(this.viewPartyIndex);
              this.unblockInput();
            }, 300);
          });
        } else if (
          this.blockInput
          || (!this.optionsMeetsReqs[cursor]
            && (selected.optionMode === MysteryEncounterOptionMode.DISABLED_OR_DEFAULT
              || selected.optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL))
        ) {
          success = false;
        } else if (
          (globalScene.phaseManager.getCurrentPhase() as MysteryEncounterPhase).handleOptionSelect(selected, cursor)
        ) {
          success = true;
        } else {
          ui.playError();
        }
      } else {
        // TODO: If we need to handle cancel option? Maybe default logic to leave/run from encounter idk
      }
    } else {
      switch (this.optionsContainer.getAll()?.length) {
        // biome-ignore lint/suspicious/useDefaultSwitchClauseLast: Default shares logic with case 3 and it makes more sense for the statements to be ordered by the case value
        default:
        case 3:
          success = this.handleTwoOptionMoveInput(button);
          break;
        case 4:
          success = this.handleThreeOptionMoveInput(button);
          break;
        case 5:
          success = this.handleFourOptionMoveInput(button);
          break;
      }

      this.displayOptionTooltip();
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  private handleTwoOptionMoveInput(button: Button): boolean {
    let success = false;
    const cursor = this.getCursor();
    switch (button) {
      case Button.UP:
        if (cursor < this.viewPartyIndex) {
          success = this.setCursor(this.viewPartyIndex);
        }
        break;
      case Button.DOWN:
        if (cursor === this.viewPartyIndex) {
          success = this.setCursor(1);
        }
        break;
      case Button.LEFT:
        if (cursor > 0) {
          success = this.setCursor(cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (cursor < this.viewPartyIndex) {
          success = this.setCursor(cursor + 1);
        }
        break;
    }

    return success;
  }

  private handleThreeOptionMoveInput(button: Button): boolean {
    let success = false;
    const cursor = this.getCursor();
    switch (button) {
      case Button.UP:
        if (cursor === 2) {
          success = this.setCursor(cursor - 2);
        } else {
          success = this.setCursor(this.viewPartyIndex);
        }
        break;
      case Button.DOWN:
        if (cursor === this.viewPartyIndex) {
          success = this.setCursor(1);
        } else {
          success = this.setCursor(2);
        }
        break;
      case Button.LEFT:
        if (cursor === this.viewPartyIndex) {
          success = this.setCursor(1);
        } else if (cursor === 1) {
          success = this.setCursor(cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (cursor === 1) {
          success = this.setCursor(this.viewPartyIndex);
        } else if (cursor < 1) {
          success = this.setCursor(cursor + 1);
        }
        break;
    }

    return success;
  }

  private handleFourOptionMoveInput(button: Button): boolean {
    let success = false;
    const cursor = this.getCursor();
    switch (button) {
      case Button.UP:
        if (cursor >= 2 && cursor !== this.viewPartyIndex) {
          success = this.setCursor(cursor - 2);
        } else {
          success = this.setCursor(this.viewPartyIndex);
        }
        break;
      case Button.DOWN:
        if (cursor <= 1) {
          success = this.setCursor(cursor + 2);
        } else if (cursor === this.viewPartyIndex) {
          success = this.setCursor(1);
        }
        break;
      case Button.LEFT:
        if (cursor === this.viewPartyIndex) {
          success = this.setCursor(1);
        } else if (cursor % 2 === 1) {
          success = this.setCursor(cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (cursor === 1) {
          success = this.setCursor(this.viewPartyIndex);
        } else if (cursor % 2 === 0 && cursor !== this.viewPartyIndex) {
          success = this.setCursor(cursor + 1);
        }
        break;
    }

    return success;
  }

  /**
   * When ME UI first displays, the option buttons will be disabled temporarily to prevent player accidentally clicking through hastily
   * This method is automatically called after a short delay but can also be called manually
   */
  unblockInput() {
    if (this.blockInput) {
      this.blockInput = false;
      for (let i = 0; i < this.optionsContainer.length - 1; i++) {
        const optionMode = this.encounterOptions[i].optionMode;
        if (
          !this.optionsMeetsReqs[i]
          && (optionMode === MysteryEncounterOptionMode.DISABLED_OR_DEFAULT
            || optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
        ) {
          continue;
        }
        (this.optionsContainer.getAt(i) as Phaser.GameObjects.Text).setAlpha(1);
      }
    }
  }

  override getCursor(): number {
    return this.cursor ? this.cursor : 0;
  }

  override setCursor(cursor: number): boolean {
    const prevCursor = this.getCursor();
    const changed = prevCursor !== cursor;
    if (changed) {
      this.cursor = cursor;
    }

    this.viewPartyIndex = this.optionsContainer.getAll()?.length - 1;

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add.image(0, 0, "cursor");
      this.cursorContainer.add(this.cursorObj);
    }

    if (cursor === this.viewPartyIndex) {
      this.cursorObj.setPosition(this.viewPartyXPosition, -17);
    } else if (this.optionsContainer.getAll()?.length === 3) {
      // 2 Options
      this.cursorObj.setPosition(-10.5 + (cursor % 2 === 1 ? 100 : 0), 15);
    } else if (this.optionsContainer.getAll()?.length === 4) {
      // 3 Options
      this.cursorObj.setPosition(-10.5 + (cursor % 2 === 1 ? 100 : 0), 7 + (cursor > 1 ? 16 : 0));
    } else if (this.optionsContainer.getAll()?.length === 5) {
      // 4 Options
      this.cursorObj.setPosition(-10.5 + (cursor % 2 === 1 ? 100 : 0), 7 + (cursor > 1 ? 16 : 0));
    }

    return changed;
  }

  displayEncounterOptions(slideInDescription = true): void {
    this.getUi().clearText();
    const mysteryEncounter = globalScene.currentBattle.mysteryEncounter!;
    this.encounterOptions = this.overrideSettings?.overrideOptions ?? mysteryEncounter.options;
    this.optionsMeetsReqs = [];

    const titleText: string | null = getEncounterText(
      mysteryEncounter.dialogue.encounterOptionsDialogue?.title,
      TextStyle.TOOLTIP_TITLE,
    );
    const descriptionText: string | null = getEncounterText(
      mysteryEncounter.dialogue.encounterOptionsDialogue?.description,
      TextStyle.TOOLTIP_CONTENT,
    );
    const queryText: string | null = getEncounterText(
      mysteryEncounter.dialogue.encounterOptionsDialogue?.query,
      TextStyle.TOOLTIP_CONTENT,
    );

    // Clear options container (except cursor)
    this.optionsContainer.removeAll(true);

    // Options Window
    for (let i = 0; i < this.encounterOptions.length; i++) {
      const option = this.encounterOptions[i];

      let optionText: BBCodeText;
      switch (this.encounterOptions.length) {
        // biome-ignore lint/suspicious/useDefaultSwitchClauseLast: default shares logic with case 2 and it makes more sense for the statements to be ordered by the case number
        default:
        case 2:
          optionText = addBBCodeTextObject(i % 2 === 0 ? 0 : 100, 8, "-", TextStyle.WINDOW, {
            fontSize: "80px",
            lineSpacing: -8,
          });
          break;
        case 3:
          optionText = addBBCodeTextObject(i % 2 === 0 ? 0 : 100, i < 2 ? 0 : 16, "-", TextStyle.WINDOW, {
            fontSize: "80px",
            lineSpacing: -8,
          });
          break;
        case 4:
          optionText = addBBCodeTextObject(i % 2 === 0 ? 0 : 100, i < 2 ? 0 : 16, "-", TextStyle.WINDOW, {
            fontSize: "80px",
            lineSpacing: -8,
          });
          break;
      }

      this.optionsMeetsReqs.push(option.meetsRequirements());
      const optionDialogue = option.dialogue!;
      const label =
        !this.optionsMeetsReqs[i] && optionDialogue.disabledButtonLabel
          ? optionDialogue.disabledButtonLabel
          : optionDialogue.buttonLabel;
      let text: string | null;
      if (
        option.hasRequirements()
        && this.optionsMeetsReqs[i]
        && (option.optionMode === MysteryEncounterOptionMode.DEFAULT_OR_SPECIAL
          || option.optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
      ) {
        // Options with special requirements that are met are automatically colored green
        text = getEncounterText(label, TextStyle.ME_OPTION_SPECIAL);
      } else {
        text = getEncounterText(label, optionDialogue.style ? optionDialogue.style : TextStyle.ME_OPTION_DEFAULT);
      }

      if (text) {
        optionText.setText(text);
      }

      if (
        !this.optionsMeetsReqs[i]
        && (option.optionMode === MysteryEncounterOptionMode.DISABLED_OR_DEFAULT
          || option.optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
      ) {
        optionText.setAlpha(0.5);
      }
      if (this.blockInput) {
        optionText.setAlpha(0.5);
      }

      // Sets up the mask that hides the option text to give an illusion of scrolling
      const nonScrollWidth = 90;
      const optionTextMaskRect = globalScene.make.graphics({});
      optionTextMaskRect.setScale(6);
      optionTextMaskRect.fillStyle(0xffffff);
      optionTextMaskRect.beginPath();
      optionTextMaskRect.fillRect(optionText.x + 11, optionText.y + 140, nonScrollWidth, 18);

      const optionTextMask = optionTextMaskRect.createGeometryMask();
      optionText.setMask(optionTextMask);

      const optionTextWidth = optionText.displayWidth;

      const tween = this.optionScrollTweens[i];
      if (tween) {
        tween.remove();
        this.optionScrollTweens[i] = null;
      }

      // Animates the option text scrolling sideways
      if (optionTextWidth > nonScrollWidth) {
        this.optionScrollTweens[i] = globalScene.tweens.add({
          targets: optionText,
          delay: fixedInt(2000),
          loop: -1,
          hold: fixedInt(2000),
          duration: fixedInt(((optionTextWidth - nonScrollWidth) / 15) * 2000),
          x: `-=${optionTextWidth - nonScrollWidth}`,
        });
      }

      this.optionsContainer.add(optionText);
    }

    // View Party Button
    const viewPartyText = addBBCodeTextObject(
      globalScene.scaledCanvas.width,
      -24,
      getBBCodeFrag(i18next.t("mysteryEncounterMessages:viewPartyButton"), TextStyle.PARTY),
      TextStyle.PARTY,
    );
    this.optionsContainer.add(viewPartyText);
    viewPartyText.x -= viewPartyText.displayWidth + 16;
    this.viewPartyXPosition = viewPartyText.x - 10;

    // Description Window
    const titleTextObject = addBBCodeTextObject(0, 0, titleText ?? "", TextStyle.TOOLTIP_TITLE, {
      wordWrap: { width: 750 },
      align: "center",
      lineSpacing: -8,
    });
    this.descriptionContainer.add(titleTextObject);
    titleTextObject.setPosition(72 - titleTextObject.displayWidth / 2, 5.5);

    // Rarity of encounter
    const index =
      mysteryEncounter.encounterTier === MysteryEncounterTier.COMMON
        ? 0
        : mysteryEncounter.encounterTier === MysteryEncounterTier.GREAT
          ? 1
          : mysteryEncounter.encounterTier === MysteryEncounterTier.ULTRA
            ? 2
            : mysteryEncounter.encounterTier === MysteryEncounterTier.ROGUE
              ? 3
              : 4;
    const ballType = getPokeballAtlasKey(index);
    this.rarityBall.setTexture("pb", ballType);

    const descriptionTextObject = addBBCodeTextObject(6, 25, descriptionText ?? "", TextStyle.TOOLTIP_CONTENT, {
      wordWrap: { width: 830 },
    });

    // Sets up the mask that hides the description text to give an illusion of scrolling
    const descriptionTextMaskRect = globalScene.make.graphics({});
    descriptionTextMaskRect.setScale(6);
    descriptionTextMaskRect.fillStyle(0xffffff);
    descriptionTextMaskRect.beginPath();
    descriptionTextMaskRect.fillRect(6, 53, 206, 57);

    const abilityDescriptionTextMask = descriptionTextMaskRect.createGeometryMask();

    descriptionTextObject.setMask(abilityDescriptionTextMask);

    const descriptionLineCount = Math.floor(descriptionTextObject.displayHeight / 9.2);

    if (this.descriptionScrollTween) {
      this.descriptionScrollTween.remove();
      this.descriptionScrollTween = undefined;
    }

    // Animates the description text moving upwards
    if (descriptionLineCount > 6) {
      this.descriptionScrollTween = globalScene.tweens.add({
        targets: descriptionTextObject,
        delay: fixedInt(2000),
        loop: -1,
        hold: fixedInt(2000),
        duration: fixedInt((descriptionLineCount - 6) * 2000),
        y: `-=${10 * (descriptionLineCount - 6)}`,
      });
    }

    this.descriptionContainer.add(descriptionTextObject);

    const queryTextObject = addBBCodeTextObject(0, 0, queryText ?? "", TextStyle.TOOLTIP_CONTENT, {
      wordWrap: { width: 830 },
    });
    this.descriptionContainer.add(queryTextObject);
    queryTextObject.setPosition(75 - queryTextObject.displayWidth / 2, 90);

    // Slide in description container
    if (slideInDescription) {
      this.descriptionContainer.x -= 150;
      globalScene.tweens.add({
        targets: this.descriptionContainer,
        x: "+=150",
        ease: "Sine.easeInOut",
        duration: 1000,
      });
    }
  }

  /**
   * Updates and displays the tooltip for a given option
   * The tooltip will auto wrap and scroll if it is too long
   */
  private displayOptionTooltip() {
    const cursor = this.getCursor();
    // Clear tooltip box
    if (this.tooltipContainer.length > 1) {
      this.tooltipContainer.removeBetween(1, this.tooltipContainer.length, true);
    }
    this.tooltipContainer.setVisible(true);

    if (isNullOrUndefined(cursor) || cursor > this.optionsContainer.length - 2) {
      // Ignore hovers on view party button
      // Hide dex progress if visible
      this.showHideDexProgress(false);
      return;
    }

    let text: string | null;
    const cursorOption = this.encounterOptions[cursor];
    const optionDialogue = cursorOption.dialogue!;
    if (
      !this.optionsMeetsReqs[cursor]
      && (cursorOption.optionMode === MysteryEncounterOptionMode.DISABLED_OR_DEFAULT
        || cursorOption.optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
      && optionDialogue.disabledButtonTooltip
    ) {
      text = getEncounterText(optionDialogue.disabledButtonTooltip, TextStyle.TOOLTIP_CONTENT);
    } else {
      text = getEncounterText(optionDialogue.buttonTooltip, TextStyle.TOOLTIP_CONTENT);
    }

    // Auto-color options green/blue for good/bad by looking for (+)/(-)
    if (text) {
      const primaryStyleString = [...text.match(new RegExp(/\[color=[^[]*\]\[shadow=[^[]*\]/i))!][0];
      text = text.replace(
        /(\(\+\)[^([]*)/gi,
        substring =>
          "[/color][/shadow]"
          + getBBCodeFrag(substring, TextStyle.SUMMARY_GREEN)
          + "[/color][/shadow]"
          + primaryStyleString,
      );
      text = text.replace(
        /(\(-\)[^([]*)/gi,
        substring =>
          "[/color][/shadow]"
          + getBBCodeFrag(substring, TextStyle.SUMMARY_BLUE)
          + "[/color][/shadow]"
          + primaryStyleString,
      );
    }

    if (text) {
      const tooltipTextObject = addBBCodeTextObject(6, 7, text, TextStyle.TOOLTIP_CONTENT, {
        wordWrap: { width: 600 },
        fontSize: "72px",
        padding: { top: 8 },
        lineSpacing: 1.25,
      });
      this.tooltipContainer.add(tooltipTextObject);

      // Sets up the mask that hides the description text to give an illusion of scrolling
      const tooltipTextMaskRect = globalScene.make.graphics({});
      tooltipTextMaskRect.setScale(6);
      tooltipTextMaskRect.fillStyle(0xffffff);
      tooltipTextMaskRect.beginPath();
      tooltipTextMaskRect.fillRect(this.tooltipContainer.x, this.tooltipContainer.y + 188.5, 150, 32);

      const textMask = tooltipTextMaskRect.createGeometryMask();
      tooltipTextObject.setMask(textMask);

      const tooltipLineCount = Math.floor(tooltipTextObject.displayHeight / 10.2);

      if (this.tooltipScrollTween) {
        this.tooltipScrollTween.remove();
        this.tooltipScrollTween = undefined;
      }

      // Animates the tooltip text moving upwards
      if (tooltipLineCount > 3) {
        this.tooltipScrollTween = globalScene.tweens.add({
          targets: tooltipTextObject,
          delay: fixedInt(1200),
          loop: -1,
          hold: fixedInt(1200),
          duration: fixedInt((tooltipLineCount - 3) * 1200),
          y: `-=${11.2 * (tooltipLineCount - 3)}`,
        });
      }
    }

    // Dex progress indicator
    if (cursorOption.hasDexProgress && !this.showDexProgress) {
      this.showHideDexProgress(true);
    } else if (!cursorOption.hasDexProgress) {
      this.showHideDexProgress(false);
    }
  }

  override clear(): void {
    super.clear();
    this.overrideSettings = undefined;
    this.optionsContainer.setVisible(false);
    this.optionsContainer.removeAll(true);
    this.dexProgressContainer.setVisible(false);
    this.descriptionContainer.setVisible(false);
    this.tooltipContainer.setVisible(false);
    // Keeps container background and pokeball
    this.descriptionContainer.removeBetween(2, this.descriptionContainer.length, true);
    this.getUi().getMessageHandler().clearText();
    this.eraseCursor();
  }

  private eraseCursor(): void {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = undefined;
  }

  /**
   * Will show or hide the Dex progress icon for an option that has dex progress
   * @param show - if true does show, if false does hide
   */
  private showHideDexProgress(show: boolean) {
    if (show && !this.showDexProgress) {
      this.showDexProgress = true;
      globalScene.tweens.killTweensOf(this.dexProgressContainer);
      globalScene.tweens.add({
        targets: this.dexProgressContainer,
        y: -63,
        ease: "Sine.easeInOut",
        duration: 750,
        onComplete: () => {
          this.dexProgressContainer.on("pointerover", () => {
            globalScene.ui.showTooltip("", i18next.t("mysteryEncounterMessages:affectsPokedex"), true);
          });
          this.dexProgressContainer.on("pointerout", () => {
            globalScene.ui.hideTooltip();
          });
        },
      });
    } else if (!show && this.showDexProgress) {
      this.showDexProgress = false;
      globalScene.tweens.killTweensOf(this.dexProgressContainer);
      globalScene.tweens.add({
        targets: this.dexProgressContainer,
        y: -43,
        ease: "Sine.easeInOut",
        duration: 750,
        onComplete: () => {
          this.dexProgressContainer.off("pointerover");
          this.dexProgressContainer.off("pointerout");
        },
      });
    }
  }
}
