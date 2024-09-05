import BattleScene from "../battle-scene";
import { addBBCodeTextObject, getBBCodeFrag, TextStyle } from "./text";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { Button } from "#enums/buttons";
import { addWindow, WindowVariant } from "./ui-theme";
import { MysteryEncounterPhase } from "../phases/mystery-encounter-phases";
import { PartyUiMode } from "./party-ui-handler";
import MysteryEncounterOption from "../data/mystery-encounters/mystery-encounter-option";
import * as Utils from "../utils";
import { isNullOrUndefined } from "../utils";
import { getPokeballAtlasKey } from "../data/pokeball";
import { OptionSelectSettings } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { getEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import i18next from "i18next";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";

export default class MysteryEncounterUiHandler extends UiHandler {
  private cursorContainer: Phaser.GameObjects.Container;
  private cursorObj?: Phaser.GameObjects.Image;

  private optionsContainer: Phaser.GameObjects.Container;
  private optionScrollTweens: (Phaser.Tweens.Tween | null)[] = [null, null, null, null];

  private tooltipWindow: Phaser.GameObjects.NineSlice;
  private tooltipContainer: Phaser.GameObjects.Container;
  private tooltipScrollTween?: Phaser.Tweens.Tween;

  private descriptionWindow: Phaser.GameObjects.NineSlice;
  private descriptionContainer: Phaser.GameObjects.Container;
  private descriptionScrollTween?: Phaser.Tweens.Tween;
  private rarityBall: Phaser.GameObjects.Sprite;

  private dexProgressWindow: Phaser.GameObjects.NineSlice;
  private dexProgressContainer: Phaser.GameObjects.Container;
  private showDexProgress: boolean = false;

  private overrideSettings?: OptionSelectSettings;
  private encounterOptions: MysteryEncounterOption[] = [];
  private optionsMeetsReqs: boolean[];

  protected viewPartyIndex: integer = 0;

  protected blockInput: boolean = true;

  constructor(scene: BattleScene) {
    super(scene, Mode.MYSTERY_ENCOUNTER);
  }

  setup() {
    const ui = this.getUi();

    this.cursorContainer = this.scene.add.container(18, -38.7);
    this.cursorContainer.setVisible(false);
    ui.add(this.cursorContainer);
    this.optionsContainer = this.scene.add.container(12, -38.7);
    this.optionsContainer.setVisible(false);
    ui.add(this.optionsContainer);
    this.dexProgressContainer = this.scene.add.container(214, -43);
    this.dexProgressContainer.setVisible(false);
    ui.add(this.dexProgressContainer);
    this.descriptionContainer = this.scene.add.container(0, -152);
    this.descriptionContainer.setVisible(false);
    ui.add(this.descriptionContainer);
    this.tooltipContainer = this.scene.add.container(210, -48);
    this.tooltipContainer.setVisible(false);
    ui.add(this.tooltipContainer);

    this.setCursor(this.getCursor());

    this.descriptionWindow = addWindow(this.scene, 0, 0, 150, 105, false, false, 0, 0, WindowVariant.THIN);
    this.descriptionContainer.add(this.descriptionWindow);

    this.tooltipWindow = addWindow(this.scene, 0, 0, 110, 48, false, false, 0, 0, WindowVariant.THIN);
    this.tooltipContainer.add(this.tooltipWindow);

    this.dexProgressWindow = addWindow(this.scene, 0, 0, 24, 28, false, false, 0, 0, WindowVariant.THIN);
    this.dexProgressContainer.add(this.dexProgressWindow);

    this.rarityBall = this.scene.add.sprite(141, 9, "pb");
    this.rarityBall.setScale(0.75);
    this.descriptionContainer.add(this.rarityBall);

    const dexProgressIndicator = this.scene.add.sprite(12, 10, "encounter_radar");
    dexProgressIndicator.setScale(0.80);
    this.dexProgressContainer.add(dexProgressIndicator);
    this.dexProgressContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, 24, 28), Phaser.Geom.Rectangle.Contains);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.overrideSettings = args[0] as OptionSelectSettings ?? {};
    const showDescriptionContainer = isNullOrUndefined(this.overrideSettings?.hideDescription) ? true : !this.overrideSettings?.hideDescription;
    const slideInDescription = isNullOrUndefined(this.overrideSettings?.slideInDescription) ? true : this.overrideSettings?.slideInDescription;
    const startingCursorIndex = this.overrideSettings?.startingCursorIndex ?? 0;

    this.cursorContainer.setVisible(true);
    this.descriptionContainer.setVisible(showDescriptionContainer);
    this.optionsContainer.setVisible(true);
    this.dexProgressContainer.setVisible(true);
    this.displayEncounterOptions(slideInDescription);
    const cursor = this.getCursor();
    if (cursor === (this?.optionsContainer?.length || 0) - 1) {
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

  processInput(button: Button): boolean {
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
            slideInDescription: false
          };
          this.scene.ui.setMode(Mode.PARTY, PartyUiMode.CHECK, -1, () => {
            this.scene.ui.setMode(Mode.MYSTERY_ENCOUNTER, overrideSettings);
            setTimeout(() => {
              this.setCursor(this.viewPartyIndex);
              this.unblockInput();
            }, 300);
          });
        } else if (this.blockInput || (!this.optionsMeetsReqs[cursor] && (selected.optionMode === MysteryEncounterOptionMode.DISABLED_OR_DEFAULT || selected.optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL))) {
          success = false;
        } else {
          if ((this.scene.getCurrentPhase() as MysteryEncounterPhase).handleOptionSelect(selected, cursor)) {
            success = true;
          } else {
            ui.playError();
          }
        }
      } else {
        // TODO: If we need to handle cancel option? Maybe default logic to leave/run from encounter idk
      }
    } else {
      switch (this.optionsContainer.getAll()?.length) {
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

  handleTwoOptionMoveInput(button: Button): boolean {
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

  handleThreeOptionMoveInput(button: Button): boolean {
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

  handleFourOptionMoveInput(button: Button): boolean {
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

  unblockInput() {
    if (this.blockInput) {
      this.blockInput = false;
      for (let i = 0; i < this.optionsContainer.length - 1; i++) {
        const optionMode = this.encounterOptions[i].optionMode;
        if (!this.optionsMeetsReqs[i] && (optionMode === MysteryEncounterOptionMode.DISABLED_OR_DEFAULT || optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)) {
          continue;
        }
        (this.optionsContainer.getAt(i) as Phaser.GameObjects.Text).setAlpha(1);
      }
    }
  }

  getCursor(): integer {
    return this.cursor ? this.cursor : 0;
  }

  setCursor(cursor: integer): boolean {
    const prevCursor = this.getCursor();
    const changed = prevCursor !== cursor;
    if (changed) {
      this.cursor = cursor;
    }

    this.viewPartyIndex = this.optionsContainer.getAll()?.length - 1;

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, "cursor");
      this.cursorContainer.add(this.cursorObj);
    }

    if (cursor === this.viewPartyIndex) {
      this.cursorObj.setPosition(246, -17);
    } else if (this.optionsContainer.getAll()?.length === 3) { // 2 Options
      this.cursorObj.setPosition(-10.5 + (cursor % 2 === 1 ? 100 : 0), 15);
    } else if (this.optionsContainer.getAll()?.length === 4) { // 3 Options
      this.cursorObj.setPosition(-10.5 + (cursor % 2 === 1 ? 100 : 0), 7 + (cursor > 1 ? 16 : 0));
    } else if (this.optionsContainer.getAll()?.length === 5) { // 4 Options
      this.cursorObj.setPosition(-10.5 + (cursor % 2 === 1 ? 100 : 0), 7 + (cursor > 1 ? 16 : 0));
    }

    return changed;
  }

  displayEncounterOptions(slideInDescription: boolean = true): void {
    this.getUi().clearText();
    const mysteryEncounter = this.scene.currentBattle.mysteryEncounter!;
    this.encounterOptions = this.overrideSettings?.overrideOptions ?? mysteryEncounter.options;
    this.optionsMeetsReqs = [];

    const titleText: string | null = getEncounterText(this.scene, mysteryEncounter.dialogue.encounterOptionsDialogue?.title, TextStyle.TOOLTIP_TITLE);
    const descriptionText: string | null = getEncounterText(this.scene, mysteryEncounter.dialogue.encounterOptionsDialogue?.description, TextStyle.TOOLTIP_CONTENT);
    const queryText: string | null = getEncounterText(this.scene, mysteryEncounter.dialogue.encounterOptionsDialogue?.query, TextStyle.TOOLTIP_CONTENT);

    // Clear options container (except cursor)
    this.optionsContainer.removeAll(true);

    // Options Window
    for (let i = 0; i < this.encounterOptions.length; i++) {
      const option = this.encounterOptions[i];

      let optionText: BBCodeText;
      switch (this.encounterOptions.length) {
      default:
      case 2:
        optionText = addBBCodeTextObject(this.scene, i % 2 === 0 ? 0 : 100, 8, "-", TextStyle.WINDOW, { fontSize: "80px", lineSpacing: -8 });
        break;
      case 3:
        optionText = addBBCodeTextObject(this.scene, i % 2 === 0 ? 0 : 100, i < 2 ? 0 : 16, "-", TextStyle.WINDOW, { fontSize: "80px", lineSpacing: -8 });
        break;
      case 4:
        optionText = addBBCodeTextObject(this.scene, i % 2 === 0 ? 0 : 100, i < 2 ? 0 : 16, "-", TextStyle.WINDOW, { fontSize: "80px", lineSpacing: -8 });
        break;
      }

      this.optionsMeetsReqs.push(option.meetsRequirements(this.scene));
      const optionDialogue = option.dialogue!;
      const label = !this.optionsMeetsReqs[i] && optionDialogue.disabledButtonLabel ? optionDialogue.disabledButtonLabel : optionDialogue.buttonLabel;
      let text: string | null;
      if (option.hasRequirements() && this.optionsMeetsReqs[i] && (option.optionMode === MysteryEncounterOptionMode.DEFAULT_OR_SPECIAL || option.optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)) {
        // Options with special requirements that are met are automatically colored green
        text = getEncounterText(this.scene, label, TextStyle.SUMMARY_GREEN);
      } else {
        text = getEncounterText(this.scene, label, optionDialogue.style ? optionDialogue.style : TextStyle.WINDOW);
      }

      if (text) {
        optionText.setText(text);
      }

      if (!this.optionsMeetsReqs[i] && (option.optionMode === MysteryEncounterOptionMode.DISABLED_OR_DEFAULT || option.optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)) {
        optionText.setAlpha(0.5);
      }
      if (this.blockInput) {
        optionText.setAlpha(0.5);
      }

      // Sets up the mask that hides the option text to give an illusion of scrolling
      const nonScrollWidth = 90;
      const optionTextMaskRect = this.scene.make.graphics({});
      optionTextMaskRect.setScale(6);
      optionTextMaskRect.fillStyle(0xFFFFFF);
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
        this.optionScrollTweens[i] = this.scene.tweens.add({
          targets: optionText,
          delay: Utils.fixedInt(2000),
          loop: -1,
          hold: Utils.fixedInt(2000),
          duration: Utils.fixedInt((optionTextWidth - nonScrollWidth) / 15 * 2000),
          x: `-=${(optionTextWidth - nonScrollWidth)}`
        });
      }

      this.optionsContainer.add(optionText);
    }

    // View Party Button
    const viewPartyText = addBBCodeTextObject(this.scene, 256, -24, getBBCodeFrag("View Party", TextStyle.PARTY), TextStyle.PARTY);
    this.optionsContainer.add(viewPartyText);

    // Description Window
    const titleTextObject = addBBCodeTextObject(this.scene, 0, 0, titleText ?? "", TextStyle.TOOLTIP_TITLE, { wordWrap: { width: 750 }, align: "center", lineSpacing: -8 });
    this.descriptionContainer.add(titleTextObject);
    titleTextObject.setPosition(72 - titleTextObject.displayWidth / 2, 5.5);

    // Rarity of encounter
    const index = mysteryEncounter.encounterTier === MysteryEncounterTier.COMMON ? 0 :
      mysteryEncounter.encounterTier === MysteryEncounterTier.GREAT ? 1 :
        mysteryEncounter.encounterTier === MysteryEncounterTier.ULTRA ? 2 :
          mysteryEncounter.encounterTier === MysteryEncounterTier.ROGUE ? 3 : 4;
    const ballType = getPokeballAtlasKey(index);
    this.rarityBall.setTexture("pb", ballType);

    const descriptionTextObject = addBBCodeTextObject(this.scene, 6, 25, descriptionText ?? "", TextStyle.TOOLTIP_CONTENT, { wordWrap: { width: 830 } });

    // Sets up the mask that hides the description text to give an illusion of scrolling
    const descriptionTextMaskRect = this.scene.make.graphics({});
    descriptionTextMaskRect.setScale(6);
    descriptionTextMaskRect.fillStyle(0xFFFFFF);
    descriptionTextMaskRect.beginPath();
    descriptionTextMaskRect.fillRect(6, 53, 206, 57);

    const abilityDescriptionTextMask = descriptionTextMaskRect.createGeometryMask();

    descriptionTextObject.setMask(abilityDescriptionTextMask);

    const descriptionLineCount = Math.floor(descriptionTextObject.displayHeight / 10);

    if (this.descriptionScrollTween) {
      this.descriptionScrollTween.remove();
      this.descriptionScrollTween = undefined;
    }

    // Animates the description text moving upwards
    if (descriptionLineCount > 6) {
      this.descriptionScrollTween = this.scene.tweens.add({
        targets: descriptionTextObject,
        delay: Utils.fixedInt(2000),
        loop: -1,
        hold: Utils.fixedInt(2000),
        duration: Utils.fixedInt((descriptionLineCount - 6) * 2000),
        y: `-=${10 * (descriptionLineCount - 6)}`
      });
    }

    this.descriptionContainer.add(descriptionTextObject);

    const queryTextObject = addBBCodeTextObject(this.scene, 0, 0, queryText ?? "", TextStyle.TOOLTIP_CONTENT, { wordWrap: { width: 830 } });
    this.descriptionContainer.add(queryTextObject);
    queryTextObject.setPosition(75 - queryTextObject.displayWidth / 2, 90);

    // Slide in description container
    if (slideInDescription) {
      this.descriptionContainer.x -= 150;
      this.scene.tweens.add({
        targets: this.descriptionContainer,
        x: "+=150",
        ease: "Sine.easeInOut",
        duration: 1000
      });
    }
  }

  displayOptionTooltip() {
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
    if (!this.optionsMeetsReqs[cursor] && (cursorOption.optionMode === MysteryEncounterOptionMode.DISABLED_OR_DEFAULT || cursorOption.optionMode === MysteryEncounterOptionMode.DISABLED_OR_SPECIAL) && optionDialogue.disabledButtonTooltip) {
      text = getEncounterText(this.scene, optionDialogue.disabledButtonTooltip, TextStyle.TOOLTIP_CONTENT);
    } else {
      text = getEncounterText(this.scene, optionDialogue.buttonTooltip, TextStyle.TOOLTIP_CONTENT);
    }

    // Auto-color options green/blue for good/bad by looking for (+)/(-)
    if (text) {
      const primaryStyleString = [...text.match(new RegExp(/\[color=[^\[]*\]\[shadow=[^\[]*\]/i))!][0];
      text = text.replace(/(\(\+\)[^\(\[]*)/gi, substring => "[/color][/shadow]" + getBBCodeFrag(substring, TextStyle.SUMMARY_GREEN) + "[/color][/shadow]" + primaryStyleString);
      text = text.replace(/(\(\-\)[^\(\[]*)/gi, substring => "[/color][/shadow]" + getBBCodeFrag(substring, TextStyle.SUMMARY_BLUE) + "[/color][/shadow]" + primaryStyleString);
    }

    if (text) {
      const tooltipTextObject = addBBCodeTextObject(this.scene, 6, 7, text, TextStyle.TOOLTIP_CONTENT, { wordWrap: { width: 600 }, fontSize: "72px" });
      this.tooltipContainer.add(tooltipTextObject);

      // Sets up the mask that hides the description text to give an illusion of scrolling
      const tooltipTextMaskRect = this.scene.make.graphics({});
      tooltipTextMaskRect.setScale(6);
      tooltipTextMaskRect.fillStyle(0xFFFFFF);
      tooltipTextMaskRect.beginPath();
      tooltipTextMaskRect.fillRect(this.tooltipContainer.x, this.tooltipContainer.y + 188.5, 150, 32);

      const textMask = tooltipTextMaskRect.createGeometryMask();
      tooltipTextObject.setMask(textMask);

      const tooltipLineCount = Math.floor(tooltipTextObject.displayHeight / 11.2);

      if (this.tooltipScrollTween) {
        this.tooltipScrollTween.remove();
        this.tooltipScrollTween = undefined;
      }

      // Animates the tooltip text moving upwards
      if (tooltipLineCount > 3) {
        this.tooltipScrollTween = this.scene.tweens.add({
          targets: tooltipTextObject,
          delay: Utils.fixedInt(1200),
          loop: -1,
          hold: Utils.fixedInt(1200),
          duration: Utils.fixedInt((tooltipLineCount - 3) * 1200),
          y: `-=${11.2 * (tooltipLineCount - 3)}`
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

  clear(): void {
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

  eraseCursor(): void {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = undefined;
  }

  /**
   *
   * @param show - if true does show, if false does hide
   */
  showHideDexProgress(show: boolean) {
    if (show && !this.showDexProgress) {
      this.showDexProgress = true;
      this.scene.tweens.killTweensOf(this.dexProgressContainer);
      this.scene.tweens.add({
        targets: this.dexProgressContainer,
        y: -63,
        ease: "Sine.easeInOut",
        duration: 750,
        onComplete: () => {
          this.dexProgressContainer.on("pointerover", () => {
            (this.scene as BattleScene).ui.showTooltip("", i18next.t("mysteryEncounterMessages:affects_pokedex"), true);
          });
          this.dexProgressContainer.on("pointerout", () => {
            (this.scene as BattleScene).ui.hideTooltip();
          });
        }
      });
    } else if (!show && this.showDexProgress) {
      this.showDexProgress = false;
      this.scene.tweens.killTweensOf(this.dexProgressContainer);
      this.scene.tweens.add({
        targets: this.dexProgressContainer,
        y: -43,
        ease: "Sine.easeInOut",
        duration: 750,
        onComplete: () => {
          this.dexProgressContainer.off("pointerover");
          this.dexProgressContainer.off("pointerout");
        }
      });
    }
  }
}
