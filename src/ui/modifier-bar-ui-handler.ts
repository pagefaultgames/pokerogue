import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { Button } from "../enums/buttons";
import { ModifierBar } from "../modifier/modifier.js";
import { addWindow } from "./ui-theme";
import { TextStyle, addTextObject } from "./text";

/**
 * UI handler for browsing {@linkcode ModifierBar} via button input
 * @extends UiHandler
 * */
export default class ModifierBarUiHandler extends UiHandler {
  /** Set to true if {@linkcode ModifierBar} is owned by the player */
  private player: boolean = false;
  private modifierBar: ModifierBar;
  private cursorObj: Phaser.GameObjects.NineSlice;

  /** Number of rows within {@linkcode ModifierBar} (12 per row) */
  private rowCount: number = 0;

  private tooltipContainer: Phaser.GameObjects.Container;
  private tooltipBg: Phaser.GameObjects.NineSlice;
  private tooltipTitle: Phaser.GameObjects.Text;
  private tooltipContent: Phaser.GameObjects.Text;

  constructor(scene: BattleScene) {
    super(scene, Mode.MODIFIER_INFO);
  }

  setup() {
    this.tooltipContainer = this.scene.add.container(0, 0);
    this.tooltipContainer.setVisible(false);

    this.tooltipBg = addWindow(this.scene as BattleScene, 0, 0, 128, 31);
    this.tooltipBg.setOrigin(0, 0);

    this.tooltipTitle = addTextObject(this.scene, 64, 4, "", TextStyle.TOOLTIP_TITLE);
    this.tooltipTitle.setOrigin(0.5, 0);

    this.tooltipContent = addTextObject(this.scene, 6, 16, "", TextStyle.TOOLTIP_CONTENT);
    this.tooltipContent.setWordWrapWidth(696);

    this.tooltipContainer.add(this.tooltipBg);
    this.tooltipContainer.add(this.tooltipTitle);
    this.tooltipContainer.add(this.tooltipContent);
  }

  /** Show the handler
   * @param args [0] {@linkcode ModifierBar} to handle
   *             [1] {boolean} true if {@linkcode ModifierBar} is owned by the player, false otherwise
   * */
  show(args: any[]): boolean {
    if (this.modifierBar) {
      return false;
    }

    if (args.length !== 2) {
      return false;
    }

    const modifierBar = args[0] as ModifierBar;
    if (!modifierBar) {
      return false;
    }

    if (modifierBar.length === 0) {
      return false;
    }

    super.show(args);

    this.modifierBar = modifierBar;
    this.player = args[1];
    this.rowCount = Math.ceil(modifierBar.length / 12);

    this.modifierBar.updateModifierOverflowVisibility(true);

    return this.setCursor(0);
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const cursor = this.getCursor();

    switch (button) {
    case Button.UP:
      // No need to process if there's only one row
      if (this.rowCount < 2) {
        return false;
      }
      // Move up if the space above is within the length of the bar
      if (cursor + 12 < this.modifierBar.length) {
        success = this.setCursor(cursor + 12);
      // Otherwise cursor is at the topmost row already,
      // try to wrap it to the lowest row
      } else {
        for (let i = this.rowCount; i >= 1; i--) {
          if (cursor - 12 * i >= 0) {
            success = this.setCursor(cursor - 12 * i);
            if (success) {
              break;
            }
          }
        }
      }
      break;
    case Button.DOWN:
      if (this.rowCount < 2) {
        return false;
      }
      // Move down if space below is within the bar
      if (cursor - 12 >= 0) {
        success = this.setCursor(cursor - 12);
      // Otherwise cursor is at the lowest row already,
      // try to wrap it to the topmost row
      } else {
        for (let i = 1; i <= this.rowCount; i++) {
          if (cursor + 12 * i < this.modifierBar.length) {
            success = this.setCursor(cursor + 12 * i);
            if (success) {
              break;
            }
          }
        }
      }
      break;
    case Button.LEFT:
      success = this.setCursor(cursor + (this.player ? 1 : -1));
      break;
    case Button.RIGHT:
      success = this.setCursor(cursor + (this.player ? -1 : 1));
      break;
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  setupTooltip(title: string, content: string): void {
    this.tooltipTitle.setText(title || "");
    const wrappedContent = this.tooltipContent.runWordWrap(content);
    this.tooltipContent.setText(wrappedContent);
    this.tooltipContent.y = title ? 16 : 4;
    this.tooltipBg.width = Math.min(Math.max(this.tooltipTitle.displayWidth, this.tooltipContent.displayWidth) + 12, 684);
    this.tooltipBg.height = (title ? 31 : 19) + 10.5 * (wrappedContent.split("\n").length - 1);
  }

  hideTooltip(): void {
    this.scene.uiContainer.remove(this.tooltipContainer);

    this.tooltipContainer.setVisible(false);
    this.tooltipTitle.clearTint();
  }

  setCursor(cursor: integer): boolean {
    const index = cursor;

    const item = this.modifierBar.getAt(index) as Phaser.GameObjects.Container;
    if (!item) {
      return false;
    }

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, "select_cursor", null, 32, 24, 5, 5, 5, 5);
      this.cursorObj.setOrigin(0, 0);
    }

    item.add(this.cursorObj);

    const name = item.getData("name");
    const desc = item.getData("desc");
    this.setupTooltip(name, desc);

    const scale = this.scene.uiContainer.scale;

    const tx = item.getWorldTransformMatrix().getX(0, 0) + this.cursorObj.width * 2;
    const ty = item.getWorldTransformMatrix().getY(0, 0) + this.cursorObj.height * 2;

    // Check if the tooltip is too far to the right to fit the screen
    const reverse = !this.player && (tx >= this.scene.game.canvas.width - this.tooltipBg.width * scale - 12);

    const actualX = tx / scale;
    const actualY = ty / scale;

    // If the tooltip is too far to the right to fit,
    // offset it to the left by its and the cursor's width
    const xOffset = reverse ? -this.tooltipBg.width - this.cursorObj.width / scale - 4 : 4;
    const yOffset = 4;

    this.tooltipContainer.setPosition(actualX + xOffset, actualY + yOffset);

    this.scene.uiContainer.add(this.tooltipContainer);
    this.tooltipContainer.setVisible(true);

    this.cursor = index;

    return true;
  }

  clear() {
    super.clear();

    this.eraseCursor();
    this.hideTooltip();

    this.modifierBar.updateModifierOverflowVisibility(false);
    this.modifierBar = null;
  }

  eraseCursor() {
    this.modifierBar.remove(this.cursorObj);

    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
