import { Button } from "../enums/buttons";
import BattleScene from "../battle-scene";
import MessageUiHandler from "./message-ui-handler";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import { TextStyle, addTextObject } from "./text";
import { PointShopModifierCategories, PointShopModifierTypes } from "#app/modifier/point-shop-modifier.js";
import { achvs } from "#app/system/achv.js";

type PointShopUiCallback = () => void;

const WindowMargin = {
  left: 8,
  right: 8,
  top: 5,
  bottom: 5,
};

const IconSize = {
  width: 16,
  height: 16,
};

const MaxIcons = {
  row: 5,
  column: 5,
};

export default class PointShopUiHandler extends MessageUiHandler {

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

  private itemFooterLeftText: Phaser.GameObjects.Text;
  private itemFooterRightText: Phaser.GameObjects.Text;

  private itemWindowContainer: Phaser.GameObjects.Container;
  private itemListWindow: Phaser.GameObjects.NineSlice;

  private itemListContainer: Phaser.GameObjects.Container;
  private itemIcons: Phaser.GameObjects.Image[][] = new Array(Object.values(PointShopModifierCategories).length / 2).fill(new Array());
  private itemCostText: Phaser.GameObjects.Text[][] = new Array(Object.values(PointShopModifierCategories).length / 2).fill(new Array());

  private itemCursor: Phaser.GameObjects.Image;
  private startCursor: Phaser.GameObjects.NineSlice;

  private selectionContainer: Phaser.GameObjects.Container;

  private selectionHeaderWindow: Phaser.GameObjects.NineSlice;
  private selectionDescriptionWindow: Phaser.GameObjects.NineSlice;

  private selectionHeaderText: Phaser.GameObjects.Text;
  private selectionDescriptionText: Phaser.GameObjects.Text;

  private selectionIcon: Phaser.GameObjects.Image;

  private selectionCostWindow: Phaser.GameObjects.NineSlice;
  private selectionCostText: Phaser.GameObjects.Text;

  private currentCategory: PointShopModifierCategories = PointShopModifierCategories.DEFAULT;

  private currentPoints: number = 0;
  private maxPoints: number = 0;

  private callbackFunction: PointShopUiCallback;

  constructor(scene: BattleScene) {
    super(scene, Mode.POINT_SHOP);
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
    return this.getIconPosition(i % MaxIcons.row, Math.floor(i / MaxIcons.row));
  }

  private getIconPosition(x: number, y: number): {x: number, y: number} {
    const innerWindowSize: { width: number, height: number } = {
      width: this.itemListWindow.displayWidth - WindowMargin.right - WindowMargin.left - IconSize.width,
      height: this.itemListWindow.displayHeight - WindowMargin.top - WindowMargin.bottom - IconSize.height,
    };

    const iconX: number = WindowMargin.left + innerWindowSize.width / (MaxIcons.row - 1) * x;
    const iconY: number = WindowMargin.top + innerWindowSize.height / (MaxIcons.column - 1) * y;

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
      .sprite(WindowMargin.left, -this.itemHeaderWindow.displayHeight / 2, "cursor_reverse")
      .setOrigin(0, 0.5);
    this.itemHeaderCursorRight = this.scene.add
      .sprite(this.itemHeaderWindow.displayWidth - WindowMargin.right, -this.itemHeaderWindow.displayHeight / 2, "cursor")
      .setOrigin(1, 0.5);

    // Item List Header Icon
    this.itemHeaderIconLeft = this.scene.add
      .sprite(this.itemHeaderCursorLeft.x + this.itemHeaderCursorLeft.displayWidth + 4, -this.itemHeaderWindow.displayHeight / 2, "keyboard", "Q.png")
      .setOrigin(0, 0.5);
    this.itemHeaderIconRight = this.scene.add
      .sprite(this.itemHeaderCursorRight.x - this.itemHeaderCursorRight.displayWidth - 4, -this.itemHeaderWindow.displayHeight / 2, "keyboard", "E.png")
      .setOrigin(1, 0.5);
    this.itemHeaderContainer.add([this.itemHeaderWindow, this.itemHeaderCursorLeft, this.itemHeaderCursorRight, this.itemHeaderIconLeft, this.itemHeaderIconRight]);

    // Item List Window
    this.itemWindowContainer = this.scene.add
      .container(0, -this.getRatioHeight(1/9) + 1)
      .setName("Item Window Container");
    this.itemContainer.add(this.itemWindowContainer);

    this.itemListWindow =
      addWindow(this.scene, 0, 0, this.getRatioWidth(2/3), this.getRatioHeight(7/9) + 2)
        .setOrigin(0, 1);
    this.itemWindowContainer.add(this.itemListWindow);

    // Item List
    this.itemListContainer = this.scene.add
      .container(0, -this.itemListWindow.displayHeight)
      .setName("Item Window Container");
    this.itemWindowContainer.add(this.itemListContainer);

    PointShopModifierTypes.forEach((category, i) => {
      category.forEach((modifierType, j) => {
        const position = this.getIconPositionFromIndex(j);

        const newIcon = this.scene.add
          .image(position.x, position.y, "items", modifierType.iconImage)
          .setOrigin(0, 0)
          .setScale(0.5);
        const newText = addTextObject(this.scene, position.x, position.y, modifierType.cost.toString(), TextStyle.PARTY);
        newText.setScale(newText.scaleX / 2, newText.scaleY / 2);
        this.itemListContainer.add([newIcon, newText]);

        this.itemIcons[i].push(newIcon);
        this.itemCostText[i].push(newText);
      });
    });

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

    this.itemCursor = this.scene.add.image(0, 0, "select_cursor")
      .setOrigin(0, 0);
    this.itemListContainer.add(this.itemCursor);

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
      addTextObject(this.scene, WindowMargin.left, -this.selectionDescriptionWindow.displayHeight + WindowMargin.top, "", TextStyle.PARTY)
        .setText("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.")
        .setWordWrapWidth((this.selectionDescriptionWindow.displayWidth - (WindowMargin.left + WindowMargin.right)) * 6);
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
  }

  show(args: any[]): boolean {
    super.show(args);

    const unlockedKeys = Object.keys(this.scene.gameData.achvUnlocks);

    let points = 0;
    for (let i = 0; i < unlockedKeys.length; i++) {
      const key = unlockedKeys[i];

      points += achvs[key].score;
    }
    this.maxPoints = points;
    this.setPoints(points);

    this.cursor = -1;
    this.setCursor(0);

    this.callbackFunction = args[0]; // Holds a callback for when this UI is finished to continue on

    this.parentContainer.setVisible(true);

    return false;
  }

  setCursor(cursor: integer): boolean {
    const changed = super.setCursor(cursor);
    if (!changed) {
      return changed;
    }

    if (this.cursor >= PointShopModifierTypes[this.currentCategory].length) {
      this.itemCursor.setVisible(false);
      this.startCursor.setVisible(true);

      return changed;
    } else if (!this.itemCursor.visible) {
      this.startCursor.setVisible(false);
      this.itemCursor.setVisible(true);
    }

    const cursorPosition = this.getIconPositionFromIndex(this.cursor);

    this.itemCursor.setX(cursorPosition.x - 1).setY(cursorPosition.y - 1);

    const currentSelection = PointShopModifierTypes[this.currentCategory][this.cursor];
    this.selectionCostText.setText(currentSelection.cost.toString());
    this.selectionIcon.setFrame(currentSelection.iconImage);
    this.selectionHeaderText.setText(currentSelection.name);
    this.selectionDescriptionText.setText(currentSelection.getDescription(this.scene));

    return changed;
  }

  processInput(button: Button): boolean {
    //const ui = this.getUi();

    let success = false;
    const error = false;

    if (button === Button.ACTION) {
      this.callbackFunction();
    } else {
      switch (button) {
      case Button.UP:
        this.setCursor(Math.max(this.cursor - MaxIcons.row, 0));
        break;
      case Button.DOWN:
        this.setCursor(Math.min(this.cursor + MaxIcons.row, PointShopModifierTypes[this.currentCategory].length));
        break;
      case Button.LEFT:
        this.setCursor(Math.max(this.cursor - 1, 0));
        break;
      case Button.RIGHT:
        this.setCursor(Math.min(this.cursor + 1, PointShopModifierTypes[this.currentCategory].length));
        break;
      }

      success = true;
    }

    return success || error;
  }

  clear() {
    super.clear();
    this.parentContainer.setVisible(false);
  }
}
