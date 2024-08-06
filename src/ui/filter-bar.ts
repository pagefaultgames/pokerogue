import BattleScene from "#app/battle-scene.js";
import { DropDown, DropDownType } from "./dropdown";
import { StarterContainer } from "./starter-container";
import { addTextObject, getTextColor, TextStyle } from "./text";
import { UiTheme } from "#enums/ui-theme";
import { addWindow, WindowVariant } from "./ui-theme";

export enum DropDownColumn {
  GEN,
  TYPES,
  CAUGHT,
  UNLOCKS,
  MISC,
  SORT
}

export class FilterBar extends Phaser.GameObjects.Container {
  private window: Phaser.GameObjects.NineSlice;
  private labels:  Phaser.GameObjects.Text[] = [];
  private dropDowns: DropDown[] = [];
  private columns: DropDownColumn[] = [];
  public cursorObj: Phaser.GameObjects.Image;
  public numFilters: number = 0;
  public openDropDown: boolean = false;
  private lastCursor: number = -1;
  private uiTheme: UiTheme;

  constructor(scene: BattleScene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);

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

    const filterTypesLabel = addTextObject(this.scene, 0, 3, title, TextStyle.TOOLTIP_CONTENT);
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
  getFilter(col: DropDownColumn) : DropDown {
    return this.dropDowns[this.columns.indexOf(col)];
  }

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
    const paddingX = 6;
    const cursorOffset = 8;

    let totalWidth = paddingX * 2 + cursorOffset;
    this.labels.forEach(label => {
      totalWidth += label.displayWidth + cursorOffset;
    });
    const spacing = (this.width - totalWidth) / (this.labels.length - 1);
    for (let i=0; i<this.labels.length; i++) {
      if (i === 0) {
        this.labels[i].x = paddingX + cursorOffset;
      } else {
        const lastRight = this.labels[i-1].x + this.labels[i-1].displayWidth;
        this.labels[i].x = lastRight + spacing + cursorOffset;
      }

      this.dropDowns[i].x = this.labels[i].x - cursorOffset - paddingX;
      this.dropDowns[i].y = this.height;
    }
  }

  /**
   * Move the leftmost dropdown to the left of the FilterBar instead of below it
   */
  offsetHybridFilters(): void {
    for (let i=0; i<this.dropDowns.length; i++) {
      if (this.dropDowns[i].dropDownType === DropDownType.HYBRID) {
        this.dropDowns[i].autoSize();
        this.dropDowns[i].x = - this.dropDowns[i].getWidth();
        this.dropDowns[i].y = 0;
      }
    }
  }

  setCursor(cursor: number): void {
    if (this.lastCursor > -1) {
      if (this.dropDowns[this.lastCursor].visible) {
        this.dropDowns[this.lastCursor].setVisible(false);
        this.dropDowns[cursor].setVisible(true);
        this.dropDowns[cursor].resetCursor();
      }
    }

    const cursorOffset = 8;
    this.cursorObj.setPosition(this.labels[cursor].x - cursorOffset + 2, 6);
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

  getVals(col: DropDownColumn): any[] {
    return this.getFilter(col).getVals();
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
    for (let i=0; i < this.labels.length; i++) {
      const dist = Math.abs(midx - (this.labels[i].x + this.labels[i].displayWidth / 3));
      if (dist < nearestDist) {
        nearest = i;
        nearestDist = dist;
      }
    }

    return nearest;
  }

}
