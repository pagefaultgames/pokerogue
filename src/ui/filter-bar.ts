import BattleScene from "#app/battle-scene.js";
import { DropDown } from "./dropdown";
import { StarterContainer } from "./starter-container";
import { addTextObject, TextStyle } from "./text";
import { addWindow, WindowVariant } from "./ui-theme";

export enum DropDownColumn {
  GEN,
  TYPES,
  UNLOCKS,
  WIN,
  SORT
}

export class FilterBar extends Phaser.GameObjects.Container {
  private window: Phaser.GameObjects.NineSlice;
  public labels:  Phaser.GameObjects.Text[] = [];
  public dropDowns: DropDown[] = [];
  public cursorObj: Phaser.GameObjects.Image;
  public numFilters: number = 0;
  public openDropDown: boolean = false;
  private lastCursor: number = -1;
  public defaultGenVals: any[] = [];
  public defaultTypeVals: any[] = [];
  public defaultUnlockVals: any[] = [];
  public defaultWinVals: any[] = [];
  public defaultSortVals: any[] = [];

  constructor(scene: BattleScene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);

    this.width = width;
    this.height = height;

    this.window = addWindow(scene, 0, 0, width, height, false, false, null, null, WindowVariant.THIN);
    this.add(this.window);

    this.cursorObj = this.scene.add.image(1, 1, "cursor");
    this.cursorObj.setScale(0.5);
    this.cursorObj.setVisible(false);
    this.cursorObj.setOrigin(0, 0);
    this.add(this.cursorObj);
  }

  addFilter(text: string, dropDown: DropDown): void {
    const filterTypesLabel = addTextObject(this.scene, 0, 3, text, TextStyle.TOOLTIP_CONTENT);
    this.labels.push(filterTypesLabel);
    this.add(filterTypesLabel);
    this.dropDowns.push(dropDown);
    this.add(dropDown);

    this.calcFilterPositions();
    this.numFilters++;
  }


  updateFilterLabels(): void {
    const genVals = this.getVals(DropDownColumn.GEN);
    const typeVals = this.getVals(DropDownColumn.TYPES);
    const unlockVals = this.getVals(DropDownColumn.UNLOCKS);
    const winVals = this.getVals(DropDownColumn.WIN);
    const sortVals = this.getVals(DropDownColumn.SORT);

    // onColor is Yellow, offColor is White
    const onColor = 0xffef5c;
    const offColor = 0xffffff;

    // if genVals and defaultGenVals has same elements, set the label to White else set it to Green
    if (genVals.length === this.defaultGenVals.length && genVals.every((value, index) => value === this.defaultGenVals[index])) {
      this.labels[DropDownColumn.GEN].setTint(offColor);
    } else {
      this.labels[DropDownColumn.GEN].setTint(onColor);
    }

    // if typeVals and defaultTypeVals has same elements, set the label to White else set it to Green
    if (typeVals.length === this.defaultTypeVals.length && typeVals.every((value, index) => value === this.defaultTypeVals[index])) {
      this.labels[DropDownColumn.TYPES].setTint(offColor);
    } else {
      this.labels[DropDownColumn.TYPES].setTint(onColor);
    }

    // if unlockVals and defaultUnlockVals has same elements, set the label to White else set it to Green
    if (unlockVals.length === this.defaultUnlockVals.length && unlockVals.every((value, index) => value === this.defaultUnlockVals[index])) {
      this.labels[DropDownColumn.UNLOCKS].setTint(offColor);
    } else {
      this.labels[DropDownColumn.UNLOCKS].setTint(onColor);
    }

    // if winVals and defaultWinVals has same elements, set the label to White else set it to Green
    if (winVals.length === this.defaultWinVals.length && winVals.every((value, index) => value === this.defaultWinVals[index])) {
      this.labels[DropDownColumn.WIN].setTint(offColor);
    } else {
      this.labels[DropDownColumn.WIN].setTint(onColor);
    }

    // if sortVals and defaultSortVals has same value and dir, set the label to White else set it to Green
    if (sortVals[0]["dir"] === this.defaultSortVals[0]["dir"] && sortVals[0]["val"] === this.defaultSortVals[0]["val"]) {
      this.labels[DropDownColumn.SORT].setTint(offColor);
    } else {
      this.labels[DropDownColumn.SORT].setTint(onColor);
    }
  }

  calcFilterPositions(): void {
    const paddingX = 6;
    const cursorOffset = 8;

    // position labels with even space across the width of the container
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

  setCursor(cursor: number): void {
    if (this.lastCursor > -1) {
      if (this.dropDowns[this.lastCursor].visible) {
        this.dropDowns[this.lastCursor].setVisible(false);
        this.dropDowns[cursor].setVisible(true);
        this.dropDowns[cursor].setCursor(0);
      }
    }

    const cursorOffset = 8;
    this.cursorObj.setPosition(this.labels[cursor].x - cursorOffset + 2, 6);
    this.lastCursor = cursor;
  }

  toggleDropDown(index: number): void {
    this.dropDowns[index].toggle();
    this.openDropDown = this.dropDowns[index].visible;
    this.dropDowns[index].setCursor(0);
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
    return this.dropDowns[col].getVals();
  }

  getNearestFilter(container: StarterContainer): number {
    // find the nearest filter to the x position
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

  getLastFilterX(): number {
    return this.labels[this.lastCursor].x + this.labels[this.lastCursor].displayWidth / 2;
  }

  isFilterActive(index: number) {
    return this.dropDowns[index].isActive();
  }
}
