import BattleScene from "../battle-scene";
import {addBBCodeTextObject, getBBCodeFrag, TextStyle} from "./text";
import {Mode} from "./ui";
import UiHandler from "./ui-handler";
import {Button} from "#enums/buttons";
import {addWindow, WindowVariant} from "./ui-theme";
import {MysteryEncounterPhase} from "../phases/mystery-encounter-phase";
import {PartyUiMode} from "./party-ui-handler";
import MysteryEncounterOption from "../data/mystery-encounter-option";
import * as Utils from "../utils";
import {isNullOrUndefined} from "../utils";
import {getPokeballAtlasKey} from "../data/pokeball";
import {getEncounterText} from "#app/data/mystery-encounters/mystery-encounter-utils";

export default class MysteryEncounterUiHandler extends UiHandler {
  private cursorContainer: Phaser.GameObjects.Container;
  private cursorObj: Phaser.GameObjects.Image;

  private optionsContainer: Phaser.GameObjects.Container;

  private tooltipWindow: Phaser.GameObjects.NineSlice;
  private tooltipContainer: Phaser.GameObjects.Container;
  private tooltipScrollTween: Phaser.Tweens.Tween;

  private descriptionWindow: Phaser.GameObjects.NineSlice;
  private descriptionContainer: Phaser.GameObjects.Container;
  private descriptionScrollTween: Phaser.Tweens.Tween;
  private rarityBall: Phaser.GameObjects.Sprite;

  private filteredEncounterOptions: MysteryEncounterOption[] = [];
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

    this.rarityBall = this.scene.add.sprite(141, 9, "pb");
    this.rarityBall.setScale(0.75);
    this.descriptionContainer.add(this.rarityBall);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.cursorContainer.setVisible(true);
    this.descriptionContainer.setVisible(true);
    this.optionsContainer.setVisible(true);
    this.displayEncounterOptions(!(args[0] as boolean || false));
    const cursor = this.getCursor();
    if (cursor === (this?.optionsContainer?.length || 0) - 1) {
      // Always resets cursor on view party button if it was last there
      this.setCursor(cursor);
    } else {
      this.setCursor(0);
    }
    if (this.blockInput) {
      setTimeout(() => {
        this.unblockInput();
      }, 1500);
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
        if (cursor === this.viewPartyIndex) {
          // Handle view party
          success = true;
          this.scene.ui.setMode(Mode.PARTY, PartyUiMode.CHECK, -1, () => {
            this.scene.ui.setMode(Mode.MYSTERY_ENCOUNTER, true);
            setTimeout(() => {
              this.setCursor(this.viewPartyIndex);
              this.unblockInput();
            }, 300);
          });
        } else if (this.blockInput || !this.optionsMeetsReqs[cursor]) {
          success = false;
        } else {
          const selected = this.filteredEncounterOptions[cursor];
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
      switch (this.optionsContainer.length) {
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
        if (!this.optionsMeetsReqs[i]) {
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

    this.viewPartyIndex = this.optionsContainer.length - 1;

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, "cursor");
      this.cursorContainer.add(this.cursorObj);
    }

    if (cursor === this.viewPartyIndex) {
      this.cursorObj.setPosition(246, -17);
    } else if (this.optionsContainer.length === 3) { // 2 Options
      this.cursorObj.setPosition(-10.5 + (cursor % 2 === 1 ? 100 : 0), 15);
    } else if (this.optionsContainer.length === 4) { // 3 Options
      this.cursorObj.setPosition(-10.5 + (cursor % 2 === 1 ? 100 : 0), 7 + (cursor > 1 ? 16 : 0));
    } else if (this.optionsContainer.length === 5) { // 4 Options
      this.cursorObj.setPosition(-10.5 + (cursor % 2 === 1 ? 100 : 0), 7 + (cursor > 1 ? 16 : 0));
    }

    return changed;
  }

  displayEncounterOptions(slideInDescription: boolean = true): void {
    this.getUi().clearText();
    const mysteryEncounter = this.scene.currentBattle.mysteryEncounter;
    this.filteredEncounterOptions = mysteryEncounter.options;
    this.optionsMeetsReqs = [];

    const titleText: string = getEncounterText(this.scene, mysteryEncounter.dialogue.encounterOptionsDialogue.title, TextStyle.TOOLTIP_TITLE);
    const descriptionText: string = getEncounterText(this.scene, mysteryEncounter.dialogue.encounterOptionsDialogue.description, TextStyle.TOOLTIP_CONTENT);
    const queryText: string = getEncounterText(this.scene, mysteryEncounter.dialogue.encounterOptionsDialogue.query, TextStyle.TOOLTIP_CONTENT);

    // Clear options container (except cursor)
    this.optionsContainer.removeAll();

    // Options Window
    for (let i = 0; i < this.filteredEncounterOptions.length; i++) {
      let optionText;
      switch (this.filteredEncounterOptions.length) {
      case 2:
        optionText = addBBCodeTextObject(this.scene, i % 2 === 0 ? 0 : 100, 8, "-", TextStyle.WINDOW, { wordWrap: { width: 558 }, fontSize: "80px", lineSpacing: -8 });
        break;
      case 3:
        optionText = addBBCodeTextObject(this.scene, i % 2 === 0 ? 0 : 100, i < 2 ? 0 : 16, "-", TextStyle.WINDOW, { wordWrap: { width: 558 }, fontSize: "80px", lineSpacing: -8 });
        break;
      case 4:
        optionText = addBBCodeTextObject(this.scene, i % 2 === 0 ? 0 : 100, i < 2 ? 0 : 16, "-", TextStyle.WINDOW, { wordWrap: { width: 558 }, fontSize: "80px", lineSpacing: -8 });
        break;
      }
      const option = mysteryEncounter.dialogue.encounterOptionsDialogue.options[i];
      const text = getEncounterText(this.scene, option.buttonLabel, option.style ? option.style : TextStyle.WINDOW);
      if (text) {
        optionText.setText(text);
      }

      this.optionsMeetsReqs.push(this.filteredEncounterOptions[i].meetsRequirements(this.scene));

      if (!this.optionsMeetsReqs[i]) {
        optionText.setAlpha(0.5);
      }
      if (this.blockInput) {
        optionText.setAlpha(0.5);
      }
      this.optionsContainer.add(optionText);
    }

    // View Party Button
    const viewPartyText = addBBCodeTextObject(this.scene, 256, -24, getBBCodeFrag("View Party", TextStyle.PARTY), TextStyle.PARTY);
    this.optionsContainer.add(viewPartyText);

    // Description Window
    const titleTextObject = addBBCodeTextObject(this.scene, 0, 0, titleText, TextStyle.TOOLTIP_TITLE, { wordWrap: { width: 750 }, align: "center", lineSpacing: -8 });
    this.descriptionContainer.add(titleTextObject);
    titleTextObject.setPosition(72 - titleTextObject.displayWidth / 2, 5.5);

    // Rarity of encounter
    const ballType = getPokeballAtlasKey(mysteryEncounter.encounterTier as number);
    this.rarityBall.setTexture("pb", ballType);

    const descriptionTextObject = addBBCodeTextObject(this.scene, 6, 25, descriptionText, TextStyle.TOOLTIP_CONTENT, { wordWrap: { width: 830 } });

    // Sets up the mask that hides the description text to give an illusion of scrolling
    const descriptionTextMaskRect = this.scene.make.graphics({});
    descriptionTextMaskRect.setScale(6);
    descriptionTextMaskRect.fillStyle(0xFFFFFF);
    descriptionTextMaskRect.beginPath();
    descriptionTextMaskRect.fillRect(6, 54, 206, 60);

    const abilityDescriptionTextMask = descriptionTextMaskRect.createGeometryMask();

    descriptionTextObject.setMask(abilityDescriptionTextMask);

    const descriptionLineCount = Math.floor(descriptionTextObject.displayHeight / 10);

    if (this.descriptionScrollTween) {
      this.descriptionScrollTween.remove();
      this.descriptionScrollTween = null;
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

    const queryTextObject = addBBCodeTextObject(this.scene, 0, 0, queryText, TextStyle.TOOLTIP_CONTENT, { wordWrap: { width: 830 } });
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
      return;
    }

    const mysteryEncounter = this.scene.currentBattle.mysteryEncounter;
    let text;
    const option = mysteryEncounter.dialogue.encounterOptionsDialogue.options[cursor];
    if (!this.optionsMeetsReqs[cursor] && option.disabledTooltip) {
      text = getEncounterText(this.scene, option.disabledTooltip, TextStyle.TOOLTIP_CONTENT);
    } else {
      text = getEncounterText(this.scene, option.buttonTooltip, TextStyle.TOOLTIP_CONTENT);
    }

    // Auto-color options green/blue for good/bad by looking for (+)/(-)
    const primaryStyleString = [...text.match(new RegExp(/\[color=[^\[]*\]\[shadow=[^\[]*\]/i))][0];
    text = text.replace(/(\(\+\)[^\(\[]*)/gi, substring => "[/color][/shadow]" + getBBCodeFrag(substring, TextStyle.SUMMARY_GREEN) + "[/color][/shadow]" + primaryStyleString);
    text = text.replace(/(\(\-\)[^\(\[]*)/gi, substring => "[/color][/shadow]" + getBBCodeFrag(substring, TextStyle.SUMMARY_BLUE) + "[/color][/shadow]" + primaryStyleString);

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
        this.tooltipScrollTween = null;
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
  }

  clear(): void {
    super.clear();
    this.optionsContainer.setVisible(false);
    this.optionsContainer.removeAll(true);
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
    this.cursorObj = null;
  }
}
