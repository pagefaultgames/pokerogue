import * as Utils from "../utils";
import { Button } from "../enums/buttons";
import BattleScene from "../battle-scene";
import MessageUiHandler from "./message-ui-handler";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import { TextStyle, addTextObject, setTextStyle } from "./text";
import { AbstractMultiPointShopModifierType, PointShopModifierCategories, PointShopModifierType, PointShopModifierTypes } from "#app/modifier/point-shop-modifier.js";
import { achvs } from "#app/system/achv.js";
import i18next from "i18next";
import { Modifier } from "../modifier/modifier.js";

type PointShopUiCallback = (modifiers: Modifier[]) => void;

const WindowPadding = {
  left: 8,
  right: 8,
  top: 5,
  bottom: 5,
};

const Padding = {
  left: 4,
  right: 4,
  top: 4,
  bottom: 4,
};

const IconSize = {
  width: 16,
  height: 16,
};

const EnabledIconSize = {
  width: 16,
  height: 16,
};

const MaxIcons = {
  row: 4,
  column: 7,
};

const MaxEnabledIcons = {
  row: 2,
  column: 9,
};

export default class PointShopUiHandler extends MessageUiHandler {
  private get currentSelection() {
    return PointShopModifierTypes[this.currentCategory][this.cursor];
  }
  private get currentEnabledIcon() {
    return this.itemEnableIcon[this.currentCategory][this.cursor];
  }

  private parentContainer: Phaser.GameObjects.Container;

  private backgroundImage: Phaser.GameObjects.Image;

  private itemContainer: Phaser.GameObjects.Container;

  private itemHeaderContainer: Phaser.GameObjects.Container;

  private itemHeaderWindow: Phaser.GameObjects.NineSlice;
  private itemFooterLeftWindow: Phaser.GameObjects.NineSlice;
  private itemFooterRightWindow: Phaser.GameObjects.NineSlice;

  private itemHeaderCursorLeft: Phaser.GameObjects.Sprite;
  private itemHeaderCursorRight: Phaser.GameObjects.Sprite;

  private itemHeaderIconLeft: Phaser.GameObjects.Sprite;
  private itemHeaderIconRight: Phaser.GameObjects.Sprite;

  private readonly itemHeaderText: Phaser.GameObjects.Text[] = new Array(Object.keys(PointShopModifierCategories).length / 2);

  private itemFooterLeftText: Phaser.GameObjects.Text;
  private itemFooterRightText: Phaser.GameObjects.Text;

  private enabledItemsContainer: Phaser.GameObjects.Container;
  private enabledItemsWindow: Phaser.GameObjects.NineSlice;
  private enabledItemsIconContainer: Phaser.GameObjects.Container;
  private readonly enabledItemsIcons: Phaser.GameObjects.Image[] = new Array(MaxEnabledIcons.column * MaxEnabledIcons.row);
  private enabledItemsText: Phaser.GameObjects.Text;

  private itemWindowContainer: Phaser.GameObjects.Container;
  private itemListWindow: Phaser.GameObjects.NineSlice;

  private itemListContainer: Phaser.GameObjects.Container;
  private readonly itemIcons: Phaser.GameObjects.Image[][] = Array.from({ length: (Object.keys(PointShopModifierCategories).length / 2) }, () => Array(0));
  private readonly itemEnableIcon: Phaser.GameObjects.Image[][] = Array.from({ length: (Object.keys(PointShopModifierCategories).length / 2) }, () => Array(0));
  private readonly itemCostText: Phaser.GameObjects.Text[][] = Array.from({ length: (Object.keys(PointShopModifierCategories).length / 2) }, () => Array(0));

  private itemCursor: Phaser.GameObjects.Image;
  private startCursor: Phaser.GameObjects.NineSlice;

  private messageWindow: Phaser.GameObjects.NineSlice;

  private selectionContainer: Phaser.GameObjects.Container;

  private selectionHeaderWindow: Phaser.GameObjects.NineSlice;
  private selectionDescriptionWindow: Phaser.GameObjects.NineSlice;

  private selectionHeaderText: Phaser.GameObjects.Text;
  private selectionDescriptionText: Phaser.GameObjects.Text;

  private selectionIcon: Phaser.GameObjects.Image;

  private selectionCostWindow: Phaser.GameObjects.NineSlice;
  private selectionCostText: Phaser.GameObjects.Text;

  private testText: Phaser.GameObjects.Text;

  private currentCategory: PointShopModifierCategories = PointShopModifierCategories.DEFAULT;

  private currentPoints: number = 0;
  private maxPoints: number = 0;

  private callbackFunction: PointShopUiCallback;

  constructor(scene: BattleScene) {
    super(scene, Mode.POINT_SHOP);

    const categoryLeftEvent = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    const categoryRightEvent = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    //const categoryLeftEvent = scene.input.gamepad.gamepads[0].on(Phaser.Input.Gamepad.Events.BUTTON_DOWN);
    //const categoryRightEvent = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    categoryLeftEvent.on("down", this.onCategoryLeft, this);
    categoryRightEvent.on("down", this.onCategoryRight, this);
  }

  private getCanvasWidth(): number {
    return this.scene.game.canvas.width / 6;
  }
  private getCanvasHeight(): number {
    return this.scene.game.canvas.height / 6;
  }

  private getRatioWidth(ratio: number) {
    return ratio * this.getCanvasWidth();
  }
  private getRatioHeight(ratio: number) {
    return ratio * this.getCanvasHeight();
  }

  private getIconPositionFromIndex(i: number) : {x: number, y: number} {
    return this.getIconPosition(i % MaxIcons.column, Math.floor(i / MaxIcons.column));
  }

  private getEnabledIconPositionFromIndex(i: number) : {x: number, y: number} {
    return this.getEnabledIconPosition(i % MaxEnabledIcons.column, Math.floor(i / MaxEnabledIcons.column));
  }

  private getIconPosition(x: number, y: number): {x: number, y: number} {
    const innerWindowSize: { width: number, height: number } = {
      width: this.itemListWindow.displayWidth - WindowPadding.right - WindowPadding.left - IconSize.width,
      height: this.itemListWindow.displayHeight - WindowPadding.top - WindowPadding.bottom - IconSize.height,
    };

    const iconX: number = WindowPadding.left + innerWindowSize.width / (MaxIcons.column - 1) * x;
    const iconY: number = WindowPadding.top + innerWindowSize.height / (MaxIcons.row - 1) * y;

    return {x: iconX, y: iconY};
  }

  private getEnabledIconPosition(x: number, y: number): {x: number, y: number} {
    const innerWindowSize: { width: number, height: number } = {
      width: this.enabledItemsWindow.displayWidth - WindowPadding.right - WindowPadding.left - EnabledIconSize.width,
      height: this.enabledItemsWindow.displayHeight - WindowPadding.top - WindowPadding.bottom - EnabledIconSize.height,
    };

    const iconX: number = WindowPadding.left + innerWindowSize.width / (MaxEnabledIcons.column - 1) * x;
    const iconY: number = WindowPadding.top + innerWindowSize.height / (MaxEnabledIcons.row - 1) * y;

    return {x: iconX, y: iconY};
  }

  private setPoints(value: number): boolean {
    if (this.currentPoints === value) {
      return false;
    }

    this.currentPoints = value;

    this.itemFooterRightText.setText("Points: " + this.currentPoints + "/" + this.maxPoints);
    return true;
  }

  setup() {
    const ui = this.getUi();

    this.parentContainer = this.scene.add
      .container()
      .setName("Point Shop Parent")
      .setVisible(false);
    ui.add(this.parentContainer);

    const loadSessionBg = this.scene.add
      .rectangle(0, 0, this.getCanvasWidth(), -this.getCanvasHeight(), 0x9a9a9a)
      .setOrigin(0, 0);
    this.parentContainer.add(loadSessionBg);

    this.backgroundImage = this.scene.add
      .image(-144, 0, "starter_select_bg")
      .setOrigin(0, 1);
    this.parentContainer.add(this.backgroundImage);

    this.itemContainer = this.scene.add
      .container(this.getRatioWidth(1/3), 0)
      .setName("Item Container");
    this.parentContainer.add(this.itemContainer);

    this.itemHeaderContainer = this.scene.add
      .container(0, -this.getRatioHeight(8/9))
      .setName("Item Container");
    this.itemContainer.add(this.itemHeaderContainer);

    // Item List Header Window
    this.itemHeaderWindow =
      addWindow(this.scene, 0, 0, this.getRatioWidth(2/3), this.getRatioHeight(1/9))
        .setOrigin(0, 1);

    // Item List Header Cursor
    this.itemHeaderCursorLeft = this.scene.add
      .sprite(WindowPadding.left, -this.itemHeaderWindow.displayHeight / 2, "cursor_reverse")
      .setOrigin(0, 0.5);
    this.itemHeaderCursorRight = this.scene.add
      .sprite(this.itemHeaderWindow.displayWidth - WindowPadding.right, -this.itemHeaderWindow.displayHeight / 2, "cursor")
      .setOrigin(1, 0.5);

    // Item List Header Icon
    this.itemHeaderIconLeft = this.scene.add
      .sprite(this.itemHeaderCursorLeft.x + this.itemHeaderCursorLeft.displayWidth + Padding.left, -this.itemHeaderWindow.displayHeight / 2, "keyboard", "Q.png")
      .setOrigin(0, 0.5);
    this.itemHeaderIconRight = this.scene.add
      .sprite(this.itemHeaderCursorRight.x - this.itemHeaderCursorRight.displayWidth - Padding.right, -this.itemHeaderWindow.displayHeight / 2, "keyboard", "E.png")
      .setOrigin(1, 0.5);
    this.itemHeaderContainer.add([this.itemHeaderWindow, this.itemHeaderCursorLeft, this.itemHeaderCursorRight, this.itemHeaderIconLeft, this.itemHeaderIconRight]);

    // Item List Window
    this.itemWindowContainer = this.scene.add
      .container(0, -this.getRatioHeight(3/9) + 1)
      .setName("Item Window Container");
    this.itemContainer.add(this.itemWindowContainer);

    this.itemListWindow =
      addWindow(this.scene, 0, 0, this.getRatioWidth(2/3), this.getRatioHeight(5/9) + 2)
        .setOrigin(0, 1);
    this.itemWindowContainer.add(this.itemListWindow);

    // Item List
    this.itemListContainer = this.scene.add
      .container(0, -this.itemListWindow.displayHeight)
      .setName("Item List Container");
    this.itemWindowContainer.add(this.itemListContainer);

    PointShopModifierTypes.forEach((category, i) => {
      const isCurrentCategory = this.currentCategory === i;

      let x = this.itemHeaderIconLeft.x + this.itemHeaderIconLeft.displayWidth + Padding.left;
      if (i > 0) {
        x = this.itemHeaderText[i - 1].x + this.itemHeaderText[i - 1].displayWidth + 8;
      }

      this.itemHeaderText[i] =
        addTextObject(this.scene, x, this.itemHeaderIconLeft.y, Utils.toReadableString(Object.values(PointShopModifierCategories)[i].toString()), isCurrentCategory ? TextStyle.PARTY_ORANGE : TextStyle.PARTY)
          .setOrigin(0, 0.5);

      this.itemHeaderContainer.add(this.itemHeaderText[i]);

      category.forEach((modifierType, j) => {
        const position = this.getIconPositionFromIndex(j);
        const cost = !(modifierType instanceof AbstractMultiPointShopModifierType)
          ? modifierType.cost.toString()
          : modifierType.cost + "+" ;

        const newIcon = this.scene.add
          .image(position.x, position.y, "items", modifierType.iconImage)
          .setOrigin(0, 0)
          .setScale(0.5)
          .setVisible(isCurrentCategory);
        const newEnabledIcon = this.scene.add
          .image(position.x - 1 + 9, position.y - 1 + 9, "select_cursor_highlight")
          .setOrigin()
          .setScale(0.75)
          .setVisible(isCurrentCategory && modifierType.active);
        const newText =
          addTextObject(this.scene, position.x, position.y, cost, TextStyle.PARTY)
            .setVisible(isCurrentCategory);
        newText.setScale(newText.scaleX / 2, newText.scaleY / 2);

        this.itemIcons[i].push(newIcon);
        this.itemEnableIcon[i].push(newEnabledIcon);
        this.itemCostText[i].push(newText);

        this.itemListContainer.add([newIcon, newEnabledIcon]);
      });
    });

    this.itemCursor = this.scene.add.image(0, 0, "select_cursor")
      .setOrigin(0, 0);
    this.itemListContainer.add(this.itemCursor);

    this.itemListContainer.add(this.itemCostText.flat());

    /* for (let y = 0; y < MaxIcons.column; y++) {
      for (let x = 0; x < MaxIcons.row; x++) {
        this.itemListContainer.add(this.scene.add
          .rectangle(
            this.getIconPosition(x, y).x,
            this.getIconPosition(x, y).y,
            IconSize.width,
            IconSize.height, 0x000000, 0.6)
          .setOrigin(0, 0));
      }
    } */

    this.enabledItemsContainer = this.scene.add.container(this.getRatioWidth(1/3), -this.getRatioHeight(1/9) + 1);
    this.parentContainer.add(this.enabledItemsContainer);

    this.enabledItemsWindow =
      addWindow(this.scene, 0, 0, this.getRatioWidth(2/3), this.getRatioHeight(2/9) + 1)
        .setOrigin(0, 1);
    this.enabledItemsContainer.add(this.enabledItemsWindow);

    //this.enabledItemsIcons
    this.enabledItemsText =
      addTextObject(this.scene, this.enabledItemsWindow.displayWidth / 2, -this.enabledItemsWindow.displayHeight / 2, "No Items Enabled...", TextStyle.PARTY)
        .setOrigin(0.5, 0.5)
        .setAlpha(0.5);
    this.enabledItemsText.setScale(this.enabledItemsText.scale / 2);
    this.enabledItemsContainer.add(this.enabledItemsText);

    this.enabledItemsIconContainer = this.scene.add.container(0, -this.enabledItemsWindow.displayHeight);
    this.enabledItemsContainer.add(this.enabledItemsIconContainer);

    for (let i = 0; i < this.enabledItemsIcons.length; i++) {
      const position = this.getEnabledIconPositionFromIndex(i);

      this.enabledItemsIcons[i] = this.scene.add
        .image(position.x, position.y, "items", "exp_charm")
        .setOrigin(0, 0)
        .setScale(0.5)
        .setVisible(false);

      this.enabledItemsIconContainer.add(this.enabledItemsIcons[i]);

      /* this.enabledItemsIconContainer.add(this.scene.add
        .rectangle(
          position.x,
          position.y,
          EnabledIconSize.width,
          EnabledIconSize.height, 0x000000, 0.6)
        .setOrigin(0, 0)); */
    }

    // Item List Footer Windows
    this.itemFooterLeftWindow =
      addWindow(this.scene, 0, 0, this.getRatioWidth(2/3) * (1/3), this.getRatioHeight(1/9))
        .setOrigin(0, 1);
    this.itemFooterRightWindow =
      addWindow(this.scene, this.getRatioWidth(2/3) * (1/3) - 1, 0, this.getRatioWidth(2/3) * (2/3) + 1, this.getRatioHeight(1/9))
        .setOrigin(0, 1);
    this.itemContainer.add([this.itemFooterLeftWindow, this.itemFooterRightWindow]);

    // Item List Footer Text
    this.itemFooterLeftText =
      addTextObject(this.scene, this.itemFooterLeftWindow.displayWidth / 2, -this.itemFooterLeftWindow.displayHeight / 2 - 1, "Start", TextStyle.PARTY)
        .setOrigin()
        .setAlign("center");
    this.itemFooterRightText =
      addTextObject(this.scene, this.itemFooterRightWindow.x + this.itemFooterRightWindow.displayWidth / 2, -this.itemFooterRightWindow.displayHeight / 2 - 1, "Points: ???", TextStyle.PARTY)
        .setOrigin()
        .setAlign("center");
    this.startCursor = this.scene.add
      .nineslice(this.itemFooterLeftText.x, this.itemFooterLeftText.y + 1, "select_cursor", null, this.itemFooterLeftText.displayWidth * 1.4, this.itemFooterLeftText.displayHeight * 1.1, 6, 6, 6, 6)
      .setOrigin()
      .setVisible(false);
    this.itemContainer.add([this.itemFooterLeftText, this.itemFooterRightText, this.startCursor]);

    // Footer Message Window
    this.messageWindow =
      addWindow(this.scene, 0, 0, this.getRatioWidth(2/3), this.getRatioHeight(1/9))
        .setOrigin(0, 1)
        .setVisible(false);
    this.enabledItemsContainer.add(this.messageWindow);

    this.message = addTextObject(this.scene, WindowPadding.left, this.messageWindow.y - this.messageWindow.displayHeight / 2 - 1, "", TextStyle.PARTY, { maxLines: 1 })
      .setOrigin(0, 0.5);
    this.enabledItemsContainer.add(this.message);

    // Selection Container
    this.selectionContainer = this.scene.add
      .container()
      .setName("Selection Container");
    this.parentContainer.add(this.selectionContainer);

    // Selection Windows
    this.selectionHeaderWindow =
      addWindow(this.scene, 0, -this.getRatioHeight(2/5), this.getRatioWidth(1/3) + 1, this.getRatioHeight(1/9) + 2)
        .setOrigin(0, 1);
    this.selectionDescriptionWindow =
      addWindow(this.scene, 0, 0, this.getRatioWidth(1/3) + 1, this.getRatioHeight(2/5) + 1)
        .setOrigin(0, 1);
    this.selectionCostWindow =
      addWindow(this.scene, 0, -this.getCanvasHeight(), 30, 20)
        .setOrigin(0, 0);
    this.selectionContainer.add([this.selectionHeaderWindow ,this.selectionDescriptionWindow, this.selectionCostWindow]);

    // Selection Text
    this.selectionHeaderText =
      addTextObject(this.scene, this.selectionHeaderWindow.displayWidth / 2, this.selectionHeaderWindow.y - this.selectionHeaderWindow.displayHeight / 2, "Selection Text", TextStyle.MESSAGE)
        .setOrigin()
        .setAlign("center");
    this.selectionDescriptionText =
      addTextObject(this.scene, WindowPadding.left, -this.selectionDescriptionWindow.displayHeight + WindowPadding.top, "", TextStyle.PARTY)
        .setText("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.")
        .setWordWrapWidth((this.selectionDescriptionWindow.displayWidth - (WindowPadding.left + WindowPadding.right)) * 6);
    this.selectionCostText =
      addTextObject(this.scene, this.selectionCostWindow.displayWidth / 2, this.selectionCostWindow.y + this.selectionCostWindow.displayHeight / 2, "???", TextStyle.PARTY)
        .setOrigin()
        .setAlign("center");
    this.selectionContainer.add([this.selectionDescriptionText, this.selectionHeaderText, this.selectionCostText]);

    this.selectionIcon = this.scene.add
      .image(this.selectionDescriptionWindow.displayWidth / 2, -this.getRatioHeight(3/5) - this.getRatioHeight(1/8), "items")
      .setOrigin()
      .setScale(1.75);
    this.selectionContainer.add(this.selectionIcon);

    /*this.testText = addTextObject(this.scene, 10, -66, "The quick brown fox \njumps over the lazy \ndog", TextStyle.PARTY)
      .setOrigin(0, 0)
      .setFontSize(11 * 6 * 4)
      .setScale(1/6 / 4)
      .setShadow();
    this.parentContainer.add(this.testText);*/
  }

  show(args: any[]): boolean {
    if (!args.length || !(args[0] instanceof Function)) {
      return false;
    }

    super.show(args);

    const unlockedKeys = Object.keys(this.scene.gameData.achvUnlocks);

    let points = 0;
    for (let i = 0; i < unlockedKeys.length; i++) {
      const key = unlockedKeys[i];

      points += achvs[key].score;
    }
    this.maxPoints = points;
    this.setPoints(points);

    PointShopModifierTypes.forEach(category => category.forEach(modifier => modifier.init(this.scene)));

    this.cursor = -1;
    this.setCursor(0);

    this.callbackFunction = args[0]; // Holds a callback for when this UI is finished to continue on

    this.parentContainer.setVisible(true);

    return true;
  }

  getEnabledModifiers(): PointShopModifierType[] {
    return PointShopModifierTypes.flat().filter(modifier => modifier.active);
  }

  setCursor(cursor: integer): boolean {
    const changed = super.setCursor(cursor);
    if (!changed) {
      return changed;
    }

    if (!this.currentSelection) {
      this.itemCursor.setVisible(false);
      this.startCursor.setVisible(true);

      return changed;
    } else if (!this.itemCursor.visible) {
      this.startCursor.setVisible(false);
      this.itemCursor.setVisible(true);
    }

    const cursorPosition = this.getIconPositionFromIndex(this.cursor);

    this.itemCursor.setX(cursorPosition.x - 1).setY(cursorPosition.y - 1);

    this.selectionCostText.setText(this.currentSelection.cost.toString());
    this.selectionIcon.setFrame(this.currentSelection.iconImage);
    this.selectionHeaderText.setText(this.currentSelection.name);
    this.selectionDescriptionText.setText(this.currentSelection.getDescription(this.scene));

    return changed;
  }
  setCategory(category: PointShopModifierCategories): boolean {
    const changed = this.currentCategory !== category;
    if (!changed) {
      return changed;
    }

    this.currentCategory = category;

    PointShopModifierTypes.forEach((category, i) => {
      const isCurrentCategory = this.currentCategory === i;

      this.itemIcons[i].forEach(icon => icon.setVisible(isCurrentCategory));
      this.itemCostText[i].forEach(text => text.setVisible(isCurrentCategory));
      this.itemEnableIcon[i].forEach((icon, j) => {
        const currentSelection = PointShopModifierTypes[i][j];
        if (!(currentSelection instanceof AbstractMultiPointShopModifierType)) {
          icon.setVisible(isCurrentCategory && currentSelection.active);
        } else {
          icon.setVisible(isCurrentCategory && currentSelection.modifierOptions.some(option => option.active));
        }
      });

      setTextStyle(this.itemHeaderText[i], this.scene, isCurrentCategory ? TextStyle.PARTY_ORANGE : TextStyle.PARTY);
    });

    this.cursor = -1;
    this.setCursor(0);

    return changed;
  }

  onCategoryLeft() {
    if (this.getUi().getMode() !== Mode.POINT_SHOP) {
      return;
    }

    this.setCategory(Math.max(this.currentCategory - 1, 0));
  }
  onCategoryRight() {
    if (this.getUi().getMode() !== Mode.POINT_SHOP) {
      return;
    }

    this.setCategory(Math.min(this.currentCategory + 1, PointShopModifierTypes.length - 1));
  }

  updateEnabledIcons() {
    this.enabledItemsText.setVisible(false);
    this.enabledItemsIcons.forEach(icon => icon.setVisible(false));

    let i = 0;
    this.getEnabledModifiers().forEach(modifier => {
      this.enabledItemsIcons[i++]
        .setFrame(modifier.iconImage)
        .setVisible(true);
    });

    this.enabledItemsText.setVisible(i === 0);
  }
  updateMessage(index: number) {
    let messageString: string;
    if (!(this.currentSelection instanceof AbstractMultiPointShopModifierType)) {
      messageString = "Current Status: " + (this.currentSelection.active ? "Enabled" : "Disabled");
    } else {
      const currentMultiSelection = this.currentSelection as AbstractMultiPointShopModifierType;
      if (currentMultiSelection.multiSelect) {
        messageString = "Current Status: " + (currentMultiSelection.modifierOptions[index].active ? "Enabled" : "Disabled");
      } else {
        const enabledOption = currentMultiSelection.modifierOptions.find(option => option.active);
        messageString = "Current Status: " + (enabledOption ? enabledOption.name : "Disabled");
      }
    }

    this.message.setText(messageString);
  }
  handleToggle(index: number) {
    if (!(this.currentSelection instanceof AbstractMultiPointShopModifierType)) {
      if (!this.currentSelection.tryToggleActive()) {
        this.scene.playSound("error");
      }

      this.currentEnabledIcon.setVisible(this.currentSelection.active);
    } else {
      if (!this.currentSelection.modifierOptions[index].tryToggleActive()) {
        this.scene.playSound("error");
      } else if (!this.currentSelection.multiSelect) {
        this.currentSelection.modifierOptions.forEach((option, i) => {
          if (i !== index) {
            option.active = false;
          }
        });
      }

      this.currentEnabledIcon.setVisible(this.currentSelection.modifierOptions.some(option => option.active));
    }

    this.updateMessage(index);
    this.updateEnabledIcons();
  }
  handleSelection() {
    const ui = this.getUi();

    let optionStrings: string[];
    if (!(this.currentSelection instanceof AbstractMultiPointShopModifierType)) {
      optionStrings = ["Toggle " + this.currentSelection.name];
    } else {
      const currentMultiSelection = this.currentSelection as AbstractMultiPointShopModifierType;
      optionStrings = currentMultiSelection.modifierOptions.map(option => option.name);
    }

    ui.showText("Current Status: ", undefined, () => {
      this.updateMessage(0);
      ui.setModeWithoutClear(Mode.OPTION_SELECT, {
        options: optionStrings.map((optionString, i) => {
          // make an option for each available starter move
          const option = {
            label: optionString,
            handler: () => {
              this.handleToggle(i);
            },
            onHover: () => {
              this.updateMessage(i);
            },
          };
          return option;
        }).concat({
          label: i18next.t("menu:cancel"),
          handler: () => {
            ui.setMode(Mode.POINT_SHOP);
            this.clearText();
            return true;
          },
          onHover: () => {
            this.message.setText("Return to the Item List");
          },
        }),
        supportHover: true,
        maxOptions: 8,
        yOffset: 30 - this.getRatioHeight(1/9),
        xOffset: -1,
      });
    });
  }

  processInput(button: Button): boolean {
    let success = false;
    const error = false;

    switch (button) {
    case Button.SUBMIT:
      this.setCursor(PointShopModifierTypes[this.currentCategory].length);
    case Button.ACTION:
      if (!this.currentSelection) {
        this.callbackFunction(this.getEnabledModifiers().map(modifier => modifier.newModifier()));
      } else {
        this.handleSelection();
      }
      break;
    case Button.UP:
      this.setCursor(Math.max(this.cursor - MaxIcons.column, 0));
      break;
    case Button.DOWN:
      this.setCursor(Math.min(this.cursor + MaxIcons.column, PointShopModifierTypes[this.currentCategory].length));
      break;
    case Button.LEFT:
      this.setCursor(Math.max(this.cursor - 1, 0));
      break;
    case Button.RIGHT:
      this.setCursor(Math.min(this.cursor + 1, PointShopModifierTypes[this.currentCategory].length));
    }

    success = true;

    return success || error;
  }

  clear() {
    super.clear();
    this.parentContainer.setVisible(false);
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);

    this.messageWindow.setVisible(!!text?.length);
  }

  clearText() {
    this.messageWindow.setVisible(false);
    super.clearText();
  }
}
