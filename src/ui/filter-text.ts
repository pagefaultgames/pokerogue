import BattleScene from "#app/battle-scene";
import { DropDown, DropDownType } from "./dropdown";
import { StarterContainer } from "./starter-container";
import { addTextObject, getTextColor, TextStyle } from "./text";
import { UiTheme } from "#enums/ui-theme";
import { addWindow, WindowVariant } from "./ui-theme";
import i18next from "i18next";
import AwaitableUiHandler from "./awaitable-ui-handler";
import UI, { Mode } from "./ui";

export enum FilterTextRow{
  NAME,
  MOVE_1,
  MOVE_2,
  ABILITY_1,
  ABILITY_2,
}

export class FilterText extends Phaser.GameObjects.Container {
  private window: Phaser.GameObjects.NineSlice;
  private labels:  Phaser.GameObjects.Text[] = [];
  private selections:  Phaser.GameObjects.Text[] = [];
  private selectionStrings: string[] = [];
  //  private dropDowns: DropDown[] = [];
  private rows: FilterTextRow[] = [];
  public cursorObj: Phaser.GameObjects.Image;
  public numFilters: number = 0;
  //  public openDropDown: boolean = false;
  private lastCursor: number = -1;
  private uiTheme: UiTheme;

  private menuMessageBoxContainer: Phaser.GameObjects.Container;
  private dialogueMessageBox: Phaser.GameObjects.NineSlice;
  message: any;
  private readonly textPadding = 8;
  private readonly defaultWordWrapWidth = 1224;

  private onChange: () => void;

  public defaultText: string = "---";

  constructor(scene: BattleScene, x: number, y: number, width: number, height: number, onChange: () => void,) {
    super(scene, x, y);

    this.onChange = onChange;

    this.width = width;
    this.height = height;

    this.window = addWindow(scene, 0, 0, width, height, false, false, undefined, undefined, WindowVariant.THIN);
    this.add(this.window);

    this.cursorObj = this.scene.add.image(1, 1, "cursor");
    this.cursorObj.setScale(0.5);
    this.cursorObj.setVisible(false);
    this.cursorObj.setOrigin(0, 0);
    this.add(this.cursorObj);

    this.uiTheme = scene.uiTheme;


    this.menuMessageBoxContainer = this.scene.add.container(0, 130);
    this.menuMessageBoxContainer.setName("menu-message-box");
    this.menuMessageBoxContainer.setVisible(false);

    // Full-width window used for testing dialog messages in debug mode
    this.dialogueMessageBox = addWindow(this.scene, -this.textPadding, 0, this.scene.game.canvas.width / 6 + this.textPadding * 2, 49, false, false, 0, 0, WindowVariant.THIN);
    this.dialogueMessageBox.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(this.dialogueMessageBox);

    const menuMessageText = addTextObject(this.scene, this.textPadding, this.textPadding, "", TextStyle.WINDOW, { maxLines: 2 });
    menuMessageText.setName("menu-message");
    menuMessageText.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(menuMessageText);

    //    this.initTutorialOverlay(this.menuContainer);
    //    this.initPromptSprite(this.menuMessageBoxContainer);

    this.message = menuMessageText;

  }

  /**
   * Add a new filter to the FilterBar, as long that a unique DropDownColumn is provided
   * @param column  the DropDownColumn that will be used to access the filter values
   * @param title   the string that will get displayed in the filter bar
   * @param dropDown the DropDown with all options for this filter
   * @returns true if successful, false if the provided column was already in use for another filter
   */
  addFilter(row: FilterTextRow, title: string): boolean {
    // The column should be unique to each filter,

    const paddingX = 6;
    const cursorOffset = 8;
    const extraSpaceX = 50;

    if (this.rows.includes(row)) {
      return false;
    }

    this.rows.push(row);

    const filterTypesLabel = addTextObject(this.scene, paddingX + cursorOffset, 3, title, TextStyle.TOOLTIP_CONTENT);
    this.labels.push(filterTypesLabel);
    this.add(filterTypesLabel);

    const filterTypesSelection = addTextObject(this.scene, paddingX + cursorOffset + extraSpaceX, 3, this.defaultText, TextStyle.TOOLTIP_CONTENT);
    this.selections.push(filterTypesSelection);
    this.add(filterTypesSelection);

    this.selectionStrings.push("");

    this.calcFilterPositions();
    this.numFilters++;

    return true;
  }

  /**
   * Get the DropDown associated to a given filter
   * @param col the DropDownColumn used to register the filter to retrieve
   * @returns the associated DropDown if it exists, undefined otherwise
   */
  getFilter(row: FilterTextRow) : DropDown {
    return this.dropDowns[this.rows.indexOf(row)];
  }

  resetSelection(index: number): void {
    this.selections[index].setText(this.defaultText);
    this.selectionStrings[index] = "";
    this.onChange();
  }

  startSearch(index: number, ui: UI): void {

    ui.playSelect();
    const prefilledText = "";
    const buttonAction: any = {};
    buttonAction["buttonActions"] = [
      (sanitizedName: string) => {
        //        ui.revertMode();
        ui.playSelect();
        const dialogueTestName = sanitizedName;
        console.log("1", dialogueTestName);
        //TODO: Is it really necessary to encode and decode?
        const dialogueName = decodeURIComponent(escape(atob(dialogueTestName)));
        console.log("2", dialogueName);
        const handler = ui.getHandler() as AwaitableUiHandler;
        handler.tutorialActive = true;
        // Switch to the dialog test window
        console.log("6", "switch");
        this.selections[index].setText(String(i18next.t(dialogueName)));
        console.log("6.5", "revert");
        ui.revertMode();
        this.onChange();
      },
      () => {
        console.log("7", "revert");
        ui.revertMode();
        this.onChange;
      }
    ];
    console.log("8", "setmode");
    ui.setOverlayMode(Mode.POKEDEX_SCAN, buttonAction, prefilledText, index);
  }


  setCursor(cursor: number): void {
    const cursorOffset = 8;

    console.log("Called set cursor from inside", cursor, 6 - cursorOffset + 2, this.labels[cursor].y + 5);

    this.cursorObj.setPosition(cursorOffset, this.labels[cursor].y + 3);
    this.lastCursor = cursor;
  }

  /**
   * Switch the message window style and size when we are replaying dialog for debug purposes
   * In "dialog test mode", the window takes the whole width of the screen and the text
   * is set up to wrap around the same way as the dialogue during the game
   * @param isDialogMode whether to use the dialog test
   */
  setDialogTestMode(isDialogMode: boolean) {
    this.dialogueMessageBox.setVisible(isDialogMode);
    // If we're testing dialog, we use the same word wrapping as the battle message handler
    this.message.setWordWrapWidth(isDialogMode ? this.scene.ui.getMessageHandler().wordWrapWidth : this.defaultWordWrapWidth);
    this.message.setX(isDialogMode ? this.textPadding + 1 : this.textPadding);
    this.message.setY(isDialogMode ? this.textPadding + 0.4 : this.textPadding);
  }


  /////////////////From here down changes must be made
  /**
   * Highlight the labels of the FilterBar if the filters are different from their default values
   */
  updateFilterLabels(): void {
    for (let i = 0; i < this.numFilters; i++) {
      if (this.dropDowns[i].hasDefaultValues()) {
        this.labels[i].setColor(getTextColor(TextStyle.TOOLTIP_CONTENT, false, this.uiTheme));
      } else {
        this.labels[i].setColor(getTextColor(TextStyle.STATS_LABEL, false, this.uiTheme));
      }
    }
  }

  /**
   * Position the filter dropdowns evenly across the width of the container
   */
  private calcFilterPositions(): void {
    const paddingY = 8;

    let totalHeight = paddingY * 2;
    this.labels.forEach(label => {
      totalHeight += label.displayHeight;
    });
    const spacing = (this.height - totalHeight) / (this.labels.length - 1);
    for (let i = 0; i < this.labels.length; i++) {
      if (i === 0) {
        this.labels[i].y = paddingY;
        this.selections[i].y = paddingY;
      } else {
        const lastBottom = this.labels[i - 1].y + this.labels[i - 1].displayHeight;
        this.labels[i].y = lastBottom + spacing;
        this.selections[i].y = lastBottom + spacing;
      }
      // Uncomment and adjust if necessary to position dropdowns vertically
      // this.dropDowns[i].y = this.labels[i].y + this.labels[i].displayHeight + paddingY;
      // this.dropDowns[i].x = this.width;
    }
  }


  /**
   * Move the leftmost dropdown to the left of the FilterBar instead of below it
   */
  offsetHybridFilters(): void {
    for (let i = 0; i < this.dropDowns.length; i++) {
      if (this.dropDowns[i].dropDownType === DropDownType.HYBRID) {
        this.dropDowns[i].autoSize();
        this.dropDowns[i].x = - this.dropDowns[i].getWidth();
        this.dropDowns[i].y = 0;
      }
    }
  }


  toggleDropDown(index: number): void {
    this.dropDowns[index].toggleVisibility();
    this.openDropDown = this.dropDowns[index].visible;
    this.dropDowns[index].resetCursor();
  }

  hideDropDowns(): void {
    this.dropDowns.forEach(dropDown => {
      dropDown.setVisible(false);
    });
    this.openDropDown = false;
  }

  incDropDownCursor(): boolean {
    if (this.dropDowns[this.lastCursor].cursor === this.dropDowns[this.lastCursor].options.length - 1) {// if at the bottom of the list, wrap around
      return this.dropDowns[this.lastCursor].setCursor(0);
    } else {
      return this.dropDowns[this.lastCursor].setCursor(this.dropDowns[this.lastCursor].cursor + 1);
    }
  }

  decDropDownCursor(): boolean {
    if (this.dropDowns[this.lastCursor].cursor === 0) {// if at the top of the list, wrap around
      return this.dropDowns[this.lastCursor].setCursor(this.dropDowns[this.lastCursor].options.length - 1);
    } else {
      return this.dropDowns[this.lastCursor].setCursor(this.dropDowns[this.lastCursor].cursor - 1);
    }
  }

  toggleOptionState(): void {
    this.dropDowns[this.lastCursor].toggleOptionState();
  }

  getValue(row: number): string {
    return this.selections[row].getWrappedText()[0];
  }

  setValsToDefault(): void {
    for (const dropDown of this.dropDowns) {
      dropDown.resetToDefault();
    }
  }

  /**
   * Find the nearest filter to the provided container on the y-axis
   * @param container the StarterContainer to compare position against
   * @returns the index of the closest filter
   */
  getNearestFilter(container: StarterContainer): number {

    const midy = container.y + container.icon.displayHeight / 2;
    let nearest = 0;
    let nearestDist = 1000;
    for (let i = 0; i < this.labels.length; i++) {
      const dist = Math.abs(midy - (this.labels[i].y + this.labels[i].displayHeight / 3));
      if (dist < nearestDist) {
        nearest = i;
        nearestDist = dist;
      }
    }

    return nearest;
  }


}
