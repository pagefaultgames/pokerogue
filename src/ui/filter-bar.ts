import BattleScene from "#app/battle-scene.js";
import { DropDown, DropDownColumns } from "./dropdown";
import { addTextObject, TextStyle } from "./text";
import { addWindow, WindowVariant } from "./ui-theme";

export class FilterBar extends Phaser.GameObjects.Container {
  private window: Phaser.GameObjects.NineSlice;
  public labels:  Phaser.GameObjects.Text[] = [];
  public dropDowns: DropDown[] = [];
  public cursorObj: Phaser.GameObjects.Image;
  public numFilters: number = 0;
  public openDropDown: boolean = false;
  private lastCursor: number = -1;

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
    return this.dropDowns[this.lastCursor].setCursor(this.dropDowns[this.lastCursor].cursor + 1);
  }

  decDropDownCursor(): boolean {
    return this.dropDowns[this.lastCursor].setCursor(this.dropDowns[this.lastCursor].cursor - 1);
  }

  toggleOptionState(): void {
    this.dropDowns[this.lastCursor].toggleOptionState();
  }

  getVals(col: DropDownColumns): any[] {
    return this.dropDowns[col].getVals();
  }
}
