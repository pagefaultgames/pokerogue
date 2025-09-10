import { globalScene } from "#app/global-scene";
import type { DropDownColumn } from "#enums/drop-down-column";
import { TextStyle } from "#enums/text-style";
import type { UiTheme } from "#enums/ui-theme";
import type { DropDown } from "#ui/containers/dropdown";
import { DropDownType } from "#ui/containers/dropdown";
import type { StarterContainer } from "#ui/containers/starter-container";
import { addTextObject, getTextColor } from "#ui/text";
import { addWindow, WindowVariant } from "#ui/ui-theme";

export class FilterBar extends Phaser.GameObjects.Container {
  private window: Phaser.GameObjects.NineSlice;
  private labels: Phaser.GameObjects.Text[] = [];
  private dropDowns: DropDown[] = [];
  private columns: DropDownColumn[] = [];
  public cursorObj: Phaser.GameObjects.Image;
  public numFilters = 0;
  public openDropDown = false;
  private lastCursor = -1;
  private uiTheme: UiTheme;
  private leftPaddingX: number;
  private rightPaddingX: number;
  private cursorOffset: number;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    leftPaddingX = 6,
    rightPaddingX = 6,
    cursorOffset = 8,
  ) {
    super(globalScene, x, y);

    this.width = width;
    this.height = height;

    this.leftPaddingX = leftPaddingX;
    this.rightPaddingX = rightPaddingX;
    this.cursorOffset = cursorOffset;

    this.window = addWindow(0, 0, width, height, false, false, undefined, undefined, WindowVariant.THIN);

    this.cursorObj = globalScene.add.image(1, 1, "cursor").setScale(0.5).setVisible(false).setOrigin(0);
    this.add([this.window, this.cursorObj]);
  }

  /**
   * Add a new filter to the FilterBar, as long that a unique DropDownColumn is provided
   * @param column  the DropDownColumn that will be used to access the filter values
   * @param title   the string that will get displayed in the filter bar
   * @param dropDown the DropDown with all options for this filter
   * @returns true if successful, false if the provided column was already in use for another filter
   */
  addFilter(column: DropDownColumn, title: string, dropDown: DropDown): boolean {
    // The column should be unique to each filter,
    if (this.columns.includes(column)) {
      return false;
    }

    this.columns.push(column);

    const filterTypesLabel = addTextObject(0, 3, title, TextStyle.FILTER_BAR_MAIN);
    this.labels.push(filterTypesLabel);
    this.add(filterTypesLabel);
    this.dropDowns.push(dropDown);
    this.add(dropDown);

    this.calcFilterPositions();
    this.numFilters++;

    return true;
  }

  /**
   * Get the DropDown associated to a given filter
   * @param col the DropDownColumn used to register the filter to retrieve
   * @returns the associated DropDown if it exists, undefined otherwise
   */
  getFilter(col: DropDownColumn): DropDown {
    return this.dropDowns[this.columns.indexOf(col)];
  }

  /**
   * Get the DropDownColumn associated to a given index
   * @param index the index of the column to retrieve
   * @returns the associated DropDownColumn if it exists, undefined otherwise
   */
  public getColumn(index: number): DropDownColumn {
    return this.columns[index];
  }

  /**
   * Highlight the labels of the FilterBar if the filters are different from their default values
   */
  updateFilterLabels(): void {
    for (let i = 0; i < this.numFilters; i++) {
      if (this.dropDowns[i].hasDefaultValues()) {
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
    let totalWidth = this.leftPaddingX + this.rightPaddingX + this.cursorOffset;
    this.labels.forEach(label => {
      totalWidth += label.displayWidth + this.cursorOffset;
    });
    const spacing = (this.width - totalWidth) / (this.labels.length - 1);
    for (let i = 0; i < this.labels.length; i++) {
      if (i === 0) {
        this.labels[i].x = this.leftPaddingX + this.cursorOffset;
      } else {
        const lastRight = this.labels[i - 1].x + this.labels[i - 1].displayWidth;
        this.labels[i].x = lastRight + spacing + this.cursorOffset;
      }

      this.dropDowns[i].x = this.labels[i].x - this.cursorOffset - this.leftPaddingX;
      this.dropDowns[i].y = this.height;
    }
  }

  /**
   * Move the leftmost dropdown to the left of the FilterBar instead of below it
   */
  offsetHybridFilters(): void {
    for (const dropDown of this.dropDowns) {
      if (dropDown.dropDownType === DropDownType.HYBRID) {
        dropDown.autoSize();
        dropDown.x = -dropDown.getWidth();
        dropDown.y = 0;
      }
    }
  }

  setCursor(cursor: number): void {
    if (this.lastCursor > -1 && this.dropDowns[this.lastCursor].visible) {
      this.dropDowns[this.lastCursor].setVisible(false);
      this.dropDowns[cursor].setVisible(true);
      this.dropDowns[cursor].resetCursor();
    }

    this.cursorObj.setPosition(this.labels[cursor].x - this.cursorOffset + 2, 6);
    this.lastCursor = cursor;
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
    if (this.dropDowns[this.lastCursor].cursor === this.dropDowns[this.lastCursor].options.length - 1) {
      // if at the bottom of the list, wrap around
      return this.dropDowns[this.lastCursor].setCursor(0);
    }
    return this.dropDowns[this.lastCursor].setCursor(this.dropDowns[this.lastCursor].cursor + 1);
  }

  decDropDownCursor(): boolean {
    if (this.dropDowns[this.lastCursor].cursor === 0) {
      // if at the top of the list, wrap around
      return this.dropDowns[this.lastCursor].setCursor(this.dropDowns[this.lastCursor].options.length - 1);
    }
    return this.dropDowns[this.lastCursor].setCursor(this.dropDowns[this.lastCursor].cursor - 1);
  }

  toggleOptionState(): void {
    this.dropDowns[this.lastCursor].toggleOptionState();
  }

  getVals(col: DropDownColumn): any[] {
    return this.getFilter(col).getVals();
  }

  public resetSelection(col: DropDownColumn): void {
    this.dropDowns[col].resetToDefault();
    this.updateFilterLabels();
  }

  setValsToDefault(): void {
    for (const dropDown of this.dropDowns) {
      dropDown.resetToDefault();
    }
  }

  /**
   * Find the nearest filter to the provided container
   * @param container the StarterContainer to compare position against
   * @returns the index of the closest filter
   */
  getNearestFilter(container: StarterContainer): number {
    const midx = container.x + container.icon.displayWidth / 2;
    let nearest = 0;
    let nearestDist = 1000;
    for (let i = 0; i < this.labels.length; i++) {
      const dist = Math.abs(midx - (this.labels[i].x + this.labels[i].displayWidth / 3));
      if (dist < nearestDist) {
        nearest = i;
        nearestDist = dist;
      }
    }

    return nearest;
  }
}
