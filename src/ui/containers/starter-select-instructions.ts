import { globalScene } from "#app/global-scene";
import { Device } from "#enums/devices";
import { TextStyle } from "#enums/text-style";
import { SettingKeyboard } from "#system/settings-keyboard";
import { type CanCycle, getStarterSelectTextSettings } from "#ui/starter-select-ui-utils";
import { addTextObject } from "#ui/text";
import i18next from "i18next";
import type { GameObjects } from "phaser";

export class StarterSelectInstructionsContainer extends Phaser.GameObjects.Container {
  private shinyIconElement: Phaser.GameObjects.Sprite;
  private formIconElement: Phaser.GameObjects.Sprite;
  private abilityIconElement: Phaser.GameObjects.Sprite;
  private genderIconElement: Phaser.GameObjects.Sprite;
  private natureIconElement: Phaser.GameObjects.Sprite;
  private teraIconElement: Phaser.GameObjects.Sprite;
  private shinyLabel: Phaser.GameObjects.Text;
  private formLabel: Phaser.GameObjects.Text;
  private genderLabel: Phaser.GameObjects.Text;
  private abilityLabel: Phaser.GameObjects.Text;
  private natureLabel: Phaser.GameObjects.Text;
  private teraLabel: Phaser.GameObjects.Text;

  private goFilterIconElement: Phaser.GameObjects.Sprite;
  private goFilterLabel: Phaser.GameObjects.Text;

  // Constants used to determine the position of the buttons and labels
  private INSTRUCTION_ROW_X = 4;
  private INSTRUCTION_ROW_Y = 156;
  private INSTRUCTION_TEXT_OFFSET = 9;
  private FILTER_INSTRUCTION_ROW_X = 50;
  private FILTER_INSTRUCTION_ROW_Y = 5;

  // Keep track of incremental position of the buttons
  private instructionRowX = this.INSTRUCTION_ROW_X;
  private instructionRowY = this.INSTRUCTION_ROW_Y;

  constructor(x: number, y: number) {
    super(globalScene, x, y);

    this.setupInstructionButtons();
    this.hideInstructions();
  }

  setupInstructionButtons(): void {
    // The font size should be set per language
    const textSettings = getStarterSelectTextSettings();
    const instructionTextSize = textSettings.instructionTextSize;

    const iRowX = this.INSTRUCTION_ROW_X;
    const iRowY = this.INSTRUCTION_ROW_Y;
    const iRowTextX = iRowX + this.INSTRUCTION_TEXT_OFFSET;

    // instruction rows that will be pushed into the container dynamically based on need
    // creating new sprites since they will be added to the scene later
    this.shinyIconElement = new Phaser.GameObjects.Sprite(globalScene, iRowX, iRowY, "keyboard", "R.png")
      .setName("sprite-shiny-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.shinyLabel = addTextObject(
      iRowTextX,
      iRowY,
      i18next.t("starterSelectUiHandler:cycleShiny"),
      TextStyle.INSTRUCTIONS_TEXT,
      {
        fontSize: instructionTextSize,
      },
    ).setName("text-shiny-label");

    this.formIconElement = new Phaser.GameObjects.Sprite(globalScene, iRowX, iRowY, "keyboard", "F.png")
      .setName("sprite-form-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.formLabel = addTextObject(
      iRowTextX,
      iRowY,
      i18next.t("starterSelectUiHandler:cycleForm"),
      TextStyle.INSTRUCTIONS_TEXT,
      {
        fontSize: instructionTextSize,
      },
    ).setName("text-form-label");

    this.genderIconElement = new Phaser.GameObjects.Sprite(globalScene, iRowX, iRowY, "keyboard", "G.png")
      .setName("sprite-gender-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.genderLabel = addTextObject(
      iRowTextX,
      iRowY,
      i18next.t("starterSelectUiHandler:cycleGender"),
      TextStyle.INSTRUCTIONS_TEXT,
      { fontSize: instructionTextSize },
    ).setName("text-gender-label");

    this.abilityIconElement = new Phaser.GameObjects.Sprite(globalScene, iRowX, iRowY, "keyboard", "E.png")
      .setName("sprite-ability-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.abilityLabel = addTextObject(
      iRowTextX,
      iRowY,
      i18next.t("starterSelectUiHandler:cycleAbility"),
      TextStyle.INSTRUCTIONS_TEXT,
      { fontSize: instructionTextSize },
    ).setName("text-ability-label");

    this.natureIconElement = new Phaser.GameObjects.Sprite(globalScene, iRowX, iRowY, "keyboard", "N.png")
      .setName("sprite-nature-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.natureLabel = addTextObject(
      iRowTextX,
      iRowY,
      i18next.t("starterSelectUiHandler:cycleNature"),
      TextStyle.INSTRUCTIONS_TEXT,
      { fontSize: instructionTextSize },
    ).setName("text-nature-label");

    this.teraIconElement = new Phaser.GameObjects.Sprite(globalScene, iRowX, iRowY, "keyboard", "V.png")
      .setName("sprite-tera-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.teraLabel = addTextObject(
      iRowTextX,
      iRowY,
      i18next.t("starterSelectUiHandler:cycleTera"),
      TextStyle.INSTRUCTIONS_TEXT,
      {
        fontSize: instructionTextSize,
      },
    ).setName("text-tera-label");

    this.goFilterIconElement = new Phaser.GameObjects.Sprite(
      globalScene,
      this.FILTER_INSTRUCTION_ROW_X,
      this.FILTER_INSTRUCTION_ROW_Y,
      "keyboard",
      "C.png",
    )
      .setName("sprite-goFilter-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.goFilterLabel = addTextObject(
      this.FILTER_INSTRUCTION_ROW_X + this.INSTRUCTION_TEXT_OFFSET,
      this.FILTER_INSTRUCTION_ROW_Y,
      i18next.t("starterSelectUiHandler:goFilter"),
      TextStyle.INSTRUCTIONS_TEXT,
      { fontSize: instructionTextSize },
    ).setName("text-goFilter-label");
  }

  updateButtonIcon(
    iconSetting: SettingKeyboard,
    gamepadType: string,
    iconElement: GameObjects.Sprite,
    controlLabel: GameObjects.Text,
  ): void {
    let iconPath: string | undefined;
    // touch controls cannot be rebound as is, and are just emulating a keyboard event.
    // Additionally, since keyboard controls can be rebound (and will be displayed when they are), we need to have special handling for the touch controls
    if (gamepadType === "touch") {
      gamepadType = "keyboard";
      switch (iconSetting) {
        case SettingKeyboard.BUTTON_CYCLE_SHINY:
          iconPath = "R.png";
          break;
        case SettingKeyboard.BUTTON_CYCLE_FORM:
          iconPath = "F.png";
          break;
        case SettingKeyboard.BUTTON_CYCLE_GENDER:
          iconPath = "G.png";
          break;
        case SettingKeyboard.BUTTON_CYCLE_ABILITY:
          iconPath = "E.png";
          break;
        case SettingKeyboard.BUTTON_CYCLE_NATURE:
          iconPath = "N.png";
          break;
        case SettingKeyboard.BUTTON_CYCLE_TERA:
          iconPath = "V.png";
          break;
        case SettingKeyboard.BUTTON_STATS:
          iconPath = "C.png";
          break;
        default:
          break;
      }
    } else {
      iconPath = globalScene.inputController?.getIconForLatestInputRecorded(iconSetting);
    }
    // The bang for iconPath is correct as long the cases in the above switch statement handle all `SettingKeyboard` values enabled in touch mode
    iconElement
      .setTexture(gamepadType, iconPath!)
      .setPosition(this.instructionRowX, this.instructionRowY)
      .setVisible(true);
    controlLabel
      .setPosition(this.instructionRowX + this.INSTRUCTION_TEXT_OFFSET, this.instructionRowY)
      .setVisible(true);
    this.add([iconElement, controlLabel]);
    this.instructionRowY += 8;
    if (this.instructionRowY >= this.INSTRUCTION_ROW_Y + 24) {
      this.instructionRowY = this.INSTRUCTION_ROW_Y;
      this.instructionRowX += 50;
    }
  }

  updateFilterButtonIcon(iconSetting: SettingKeyboard, gamepadType: string): void {
    let iconPath: string | undefined;
    // touch controls cannot be rebound as is, and are just emulating a keyboard event.
    // Additionally, since keyboard controls can be rebound (and will be displayed when they are), we need to have special handling for the touch controls
    if (gamepadType === "touch") {
      gamepadType = "keyboard";
      iconPath = "C.png";
    } else {
      iconPath = globalScene.inputController?.getIconForLatestInputRecorded(iconSetting);
    }
    this.goFilterIconElement
      .setTexture(gamepadType, iconPath)
      .setPosition(this.FILTER_INSTRUCTION_ROW_X, this.FILTER_INSTRUCTION_ROW_Y)
      .setVisible(true);
    this.goFilterLabel
      .setPosition(this.FILTER_INSTRUCTION_ROW_X + this.INSTRUCTION_TEXT_OFFSET, this.FILTER_INSTRUCTION_ROW_Y)
      .setVisible(true);
    this.add([this.goFilterIconElement, this.goFilterLabel]);
  }

  updateInstructions(canCycle: CanCycle, isCaught = false, filterMode = false): void {
    this.instructionRowX = this.INSTRUCTION_ROW_X;
    this.instructionRowY = this.INSTRUCTION_ROW_Y;
    this.hideInstructions();
    this.removeAll();
    let gamepadType: string;
    if (globalScene.inputMethod === "gamepad") {
      gamepadType = globalScene.inputController.getConfig(
        globalScene.inputController.selectedDevice[Device.GAMEPAD]!, // TODO: re-evaluate bang
      ).padType;
    } else {
      gamepadType = globalScene.inputMethod;
    }

    if (!gamepadType) {
      return;
    }

    if (isCaught) {
      if (canCycle.shiny) {
        this.updateButtonIcon(SettingKeyboard.BUTTON_CYCLE_SHINY, gamepadType, this.shinyIconElement, this.shinyLabel);
      }
      if (canCycle.form) {
        this.updateButtonIcon(SettingKeyboard.BUTTON_CYCLE_FORM, gamepadType, this.formIconElement, this.formLabel);
      }
      if (canCycle.gender) {
        this.updateButtonIcon(
          SettingKeyboard.BUTTON_CYCLE_GENDER,
          gamepadType,
          this.genderIconElement,
          this.genderLabel,
        );
      }
      if (canCycle.ability) {
        this.updateButtonIcon(
          SettingKeyboard.BUTTON_CYCLE_ABILITY,
          gamepadType,
          this.abilityIconElement,
          this.abilityLabel,
        );
      }
      if (canCycle.nature) {
        this.updateButtonIcon(
          SettingKeyboard.BUTTON_CYCLE_NATURE,
          gamepadType,
          this.natureIconElement,
          this.natureLabel,
        );
      }
      if (canCycle.tera) {
        this.updateButtonIcon(SettingKeyboard.BUTTON_CYCLE_TERA, gamepadType, this.teraIconElement, this.teraLabel);
      }
    }

    // if filter mode is inactivated and gamepadType is not undefined, update the button icons
    if (!filterMode) {
      this.updateFilterButtonIcon(SettingKeyboard.BUTTON_STATS, gamepadType);
    }
  }

  hideInstructions(): void {
    this.shinyIconElement.setVisible(false);
    this.shinyLabel.setVisible(false);
    this.formIconElement.setVisible(false);
    this.formLabel.setVisible(false);
    this.genderIconElement.setVisible(false);
    this.genderLabel.setVisible(false);
    this.abilityIconElement.setVisible(false);
    this.abilityLabel.setVisible(false);
    this.natureIconElement.setVisible(false);
    this.natureLabel.setVisible(false);
    this.teraIconElement.setVisible(false);
    this.teraLabel.setVisible(false);
    this.goFilterIconElement.setVisible(false);
    this.goFilterLabel.setVisible(false);
  }
}
