import BattleScene from "../battle-scene";
import { addTextObject, TextStyle } from "./text";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { Button } from "../enums/buttons";
import { MysteryEncounterOptionSelectPhase } from "../phases/mystery-encounter-option-select-phase";
import { addWindow, WindowVariant } from "./ui-theme";
import i18next from "i18next";
import { MysteryEncounterOption } from "../data/mystery-encounter";

export default class MysteryEncounterUiHandler extends UiHandler {
  private optionsContainer: Phaser.GameObjects.Container;
  private cursorObj: Phaser.GameObjects.Image;

  private descriptionWindow: Phaser.GameObjects.NineSlice;
  private descriptionContainer: Phaser.GameObjects.Container;

  private encounterOptions: MysteryEncounterOption[] = [];

  protected fieldIndex: integer = 0;
  protected cursor2: integer = 0;

  constructor(scene: BattleScene) {
    super(scene, Mode.MYSTERY_ENCOUNTER);
  }

  setup() {
    const ui = this.getUi();

    const commands = this.encounterOptions.map((option) => {
      return option.label;
    });

    this.optionsContainer = this.scene.add.container(18, -38.7);
    this.optionsContainer.setVisible(false);
    ui.add(this.optionsContainer);

    this.descriptionContainer = this.scene.add.container(0, -152);
    this.descriptionContainer.setVisible(false);
    ui.add(this.descriptionContainer);

    this.descriptionWindow = addWindow(this.scene, 0, 0, 150, 105, false, false, 0, 0, WindowVariant.THIN);
    this.descriptionContainer.add(this.descriptionWindow);

    for (let c = 0; c < commands.length; c++) {
      const commandText = addTextObject(this.scene, c % 2 === 0 ? 0 : 90, c < 2 ? 0 : 16, commands[c], TextStyle.WINDOW);
      this.optionsContainer.add(commandText);
    }
  }

  show(args: any[]): boolean {
    super.show(args);

    this.descriptionContainer.setVisible(true);
    this.optionsContainer.setVisible(true);
    this.setCursor(this.getCursor());
    this.displayEncounterOptions();

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const cursor = this.getCursor();

    if (button === Button.CANCEL || button === Button.ACTION) {

      if (button === Button.ACTION) {
        const selected = this.encounterOptions[cursor];
        if ((this.scene.getCurrentPhase() as MysteryEncounterOptionSelectPhase).handleOptionSelect(selected)) {
          this.clear();
          success = true;
        } else {
          ui.playError();
        }
      } else {
        // If we need to handle cancel option? Maybe default logic to leave/run from encounter idk
      }
    } else {
      switch (button) {
      case Button.UP:
        if (cursor >= 2) {
          success = this.setCursor(cursor - 2);
        }
        break;
      case Button.DOWN:
        if (cursor < 2) {
          success = this.setCursor(cursor + 2);
        }
        break;
      case Button.LEFT:
        if (cursor % 2 === 1) {
          success = this.setCursor(cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (cursor % 2 === 0) {
          success = this.setCursor(cursor + 1);
        }
        break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  getCursor(): integer {
    return !this.fieldIndex ? this.cursor : this.cursor2;
  }

  setCursor(cursor: integer): boolean {
    const changed = this.getCursor() !== cursor;
    if (changed) {
      if (!this.fieldIndex) {
        this.cursor = cursor;
      } else {
        this.cursor2 = cursor;
      }
    }

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, "cursor");
      this.optionsContainer.add(this.cursorObj);
    }

    this.cursorObj.setPosition(-5 + (cursor % 2 === 1 ? 150 : 0), 8 + (cursor >= 2 ? 16 : 0));

    return changed;
  }

  displayEncounterOptions(): void {
    const mysteryEncounter = (this.scene.getCurrentPhase() as MysteryEncounterOptionSelectPhase).getMysteryEncounter();
    this.encounterOptions = mysteryEncounter.getMysteryEncounterOptions();
    const index = mysteryEncounter.getMysteryEncounterIndex();
    const titleText = i18next.t(`mysteryEncounter:encounter_${index}_id`);
    const descriptionText = i18next.t(`mysteryEncounter:encounter_${index}_description`);
    const queryText = i18next.t(`mysteryEncounter:encounter_${index}_query`);

    // Options Window
    for (let i = 0; i < this.encounterOptions.length; i++) {
      const optionText = addTextObject(this.scene, i % 2 === 0 ? 0 : 150, i < 2 ? 0 : 16, "-", TextStyle.WINDOW);
      const text = i18next.t(`mysteryEncounter:encounter_${index}_option_${i + 1}`);
      if (text) {
        optionText.setText(text);
      }
      if (!this.encounterOptions[i].meetsRequirements(this.scene)) {
        // TODO: This option should be disabled/greyed out or removed
      }
      this.optionsContainer.add(optionText);
    }

    // Description Window
    //addTextObject(this.scene, 7, 69, abilityInfo.ability.description, TextStyle.WINDOW_ALT, { wordWrap: { width: 1224 } });
    const titleTextObject = addTextObject(this.scene, 6, 4, titleText, TextStyle.TOOLTIP_TITLE, { wordWrap: { width: 830 } });
    this.descriptionContainer.add(titleTextObject);

    const descriptionTextObject = addTextObject(this.scene, 6, 25, descriptionText, TextStyle.TOOLTIP_CONTENT, { wordWrap: { width: 830 } });
    this.descriptionContainer.add(descriptionTextObject);

    const queryTextObject = addTextObject(this.scene, 6, 90, queryText, TextStyle.TOOLTIP_CONTENT, { wordWrap: { width: 830 } });
    this.descriptionContainer.add(queryTextObject);
  }

  clear(): void {
    super.clear();
    this.getUi().getMessageHandler().commandWindow.setVisible(false);
    this.optionsContainer.setVisible(false);
    this.descriptionContainer.setVisible(false);
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
