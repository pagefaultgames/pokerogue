import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { UiTheme } from "#enums/ui-theme";
import type { StarterContainer } from "#ui/containers/starter-container";
import type { AwaitableUiHandler } from "#ui/handlers/awaitable-ui-handler";
import { addTextObject, getTextColor } from "#ui/text";
import type { UI } from "#ui/ui";
import { addWindow, WindowVariant } from "#ui/ui-theme";
import i18next from "i18next";

export enum FilterTextRow {
  NAME,
  MOVE_1,
  MOVE_2,
  ABILITY_1,
  ABILITY_2,
}

export class FilterText extends Phaser.GameObjects.Container {
  private window: Phaser.GameObjects.NineSlice;
  private labels: Phaser.GameObjects.Text[] = [];
  private selections: Phaser.GameObjects.Text[] = [];
  private rows: FilterTextRow[] = [];
  public cursorObj: Phaser.GameObjects.Image;
  public numFilters = 0;
  private uiTheme: UiTheme;

  private menuMessageBoxContainer: Phaser.GameObjects.Container;
  private dialogueMessageBox: Phaser.GameObjects.NineSlice;
  message: any;
  private readonly textPadding = 8;

  private onChange: () => void;

  public defaultText = "---";

  constructor(x: number, y: number, width: number, height: number, onChange: () => void) {
    super(globalScene, x, y);

    this.onChange = onChange;

    this.width = width;
    this.height = height;

    this.window = addWindow(0, 0, width, height, false, false, undefined, undefined, WindowVariant.THIN);
    this.add(this.window);

    this.cursorObj = globalScene.add.image(1, 1, "cursor");
    this.cursorObj.setScale(0.5);
    this.cursorObj.setVisible(false);
    this.cursorObj.setOrigin(0, 0);
    this.add(this.cursorObj);

    this.menuMessageBoxContainer = globalScene.add.container(0, 130);
    this.menuMessageBoxContainer.setName("menu-message-box");
    this.menuMessageBoxContainer.setVisible(false);

    // Full-width window used for testing dialog messages in debug mode
    this.dialogueMessageBox = addWindow(
      -this.textPadding,
      0,
      globalScene.scaledCanvas.width + this.textPadding * 2,
      49,
      false,
      false,
      0,
      0,
      WindowVariant.THIN,
    );
    this.dialogueMessageBox.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(this.dialogueMessageBox);

    const menuMessageText = addTextObject(this.textPadding, this.textPadding, "", TextStyle.WINDOW, { maxLines: 2 });
    menuMessageText.setName("menu-message");
    menuMessageText.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(menuMessageText);

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
    const paddingX = 6;
    const cursorOffset = 8;
    const extraSpaceX = 40;

    if (this.rows.includes(row)) {
      return false;
    }

    this.rows.push(row);

    const filterTypesLabel = addTextObject(paddingX + cursorOffset, 3, title, TextStyle.TOOLTIP_CONTENT);
    this.labels.push(filterTypesLabel);
    this.add(filterTypesLabel);

    const filterTypesSelection = addTextObject(
      paddingX + cursorOffset + extraSpaceX,
      3,
      this.defaultText,
      TextStyle.TOOLTIP_CONTENT,
    );
    this.selections.push(filterTypesSelection);
    this.add(filterTypesSelection);

    this.calcFilterPositions();
    this.numFilters++;

    return true;
  }

  resetSelection(index: number): void {
    this.selections[index].setText(this.defaultText);
    this.onChange();
  }

  setValsToDefault(): void {
    for (let i = 0; i < this.numFilters; i++) {
      this.resetSelection(i);
    }
  }

  startSearch(index: number, ui: UI): void {
    ui.playSelect();
    const prefilledText = "";
    const buttonAction: any = {};
    buttonAction["buttonActions"] = [
      (sanitizedName: string) => {
        ui.playSelect();
        const dialogueTestName = sanitizedName;
        //TODO: Is it really necessary to encode and decode?
        const dialogueName = decodeURIComponent(escape(atob(dialogueTestName)));
        const handler = ui.getHandler() as AwaitableUiHandler;
        handler.tutorialActive = true;
        // Switch to the dialog test window
        this.selections[index].setText(dialogueName === "" ? this.defaultText : String(i18next.t(dialogueName)));
        ui.revertMode();
        this.onChange();
      },
      () => {
        ui.revertMode();
        this.onChange;
      },
    ];
    ui.setOverlayMode(UiMode.POKEDEX_SCAN, buttonAction, prefilledText, index);
  }

  setCursor(cursor: number): void {
    const cursorOffset = 8;

    this.cursorObj.setPosition(cursorOffset, this.labels[cursor].y + 3);
  }

  /**
   * Highlight the labels of the FilterBar if the filters are different from their default values
   */
  updateFilterLabels(): void {
    for (let i = 0; i < this.numFilters; i++) {
      if (this.selections[i].text === this.defaultText) {
        this.labels[i].setColor(getTextColor(TextStyle.TOOLTIP_CONTENT, false));
      } else {
        this.labels[i].setColor(getTextColor(TextStyle.STATS_LABEL, false));
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
    }
  }

  getValue(row: number): string {
    return this.selections[row].getWrappedText()[0];
  }

  /**
   * Forcibly set the selection text for a specific filter row and then call the `onChange` function
   *
   * @param row - The filter row to set the text for
   * @param value - The text to set for the filter row
   */
  setValue(row: FilterTextRow, value: string) {
    this.selections[row].setText(value);
    this.onChange();
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
