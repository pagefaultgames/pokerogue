import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { ScrollBar } from "#ui/containers/scroll-bar";
import { addTextObject } from "#ui/text";
import { addWindow, WindowVariant } from "#ui/ui-theme";
import i18next from "i18next";

export enum DropDownState {
  ON = 0,
  OFF = 1,
  EXCLUDE = 2,
  UNLOCKABLE = 3,
  ONE = 4,
  TWO = 5,
}

export enum DropDownType {
  SINGLE = 0,
  MULTI = 1,
  HYBRID = 2,
  RADIAL = 3,
}

export enum SortDirection {
  ASC = -1,
  DESC = 1,
}

export enum SortCriteria {
  NUMBER = 0,
  COST = 1,
  CANDY = 2,
  IV = 3,
  NAME = 4,
  CAUGHT = 5,
  HATCHED = 6,
}

export class DropDownLabel {
  public state: DropDownState;
  public text: string;
  public sprite?: Phaser.GameObjects.Sprite;

  constructor(label: string, sprite?: Phaser.GameObjects.Sprite, state: DropDownState = DropDownState.OFF) {
    this.text = label || "";
    this.sprite = sprite;
    this.state = state;
  }
}

export class DropDownOption extends Phaser.GameObjects.Container {
  public state: DropDownState = DropDownState.ON;
  public toggle: Phaser.GameObjects.Sprite;
  public text: Phaser.GameObjects.Text;
  public val: any;
  public dir: SortDirection = SortDirection.ASC;
  private currentLabelIndex: number;
  private labels: DropDownLabel[];
  private onColor = 0x33bbff;
  private offColor = 0x272727;
  private excludeColor = 0xff5555;
  private unlockableColor = 0xffff00;
  private oneColor = 0x33bbff;
  private twoColor = 0x33bbff;

  constructor(val: any, labels: DropDownLabel | DropDownLabel[]) {
    super(globalScene);
    this.val = val;

    if (Array.isArray(labels)) {
      this.labels = labels;
    } else {
      this.labels = labels ? [labels] : [new DropDownLabel("")];
    }
    this.currentLabelIndex = 0;
    const currentLabel = this.labels[this.currentLabelIndex];

    this.state = currentLabel.state;
    this.text = addTextObject(0, 0, currentLabel.text || "", TextStyle.TOOLTIP_CONTENT);
    this.text.setOrigin(0, 0.5);
    this.add(this.text);

    // Add to container the sprite for each label if there is one
    for (let i = 0; i < this.labels.length; i++) {
      const sprite = this.labels[i].sprite;
      if (sprite) {
        this.add(sprite);
        sprite.setOrigin(0, 0.5);
        if (i !== this.currentLabelIndex) {
          sprite.setVisible(false);
        }
      }
    }
  }

  /**
   * Initialize the toggle icon based on the provided DropDownType
   * For DropDownType.SINGLE: uses a cursor arrow icon
   * For other types: uses a candy icon
   * @param type the DropDownType to use
   * @param visible whether the icon should be visible or not
   */
  setupToggleIcon(type: DropDownType, visible: boolean): void {
    if (type === DropDownType.SINGLE) {
      this.toggle = globalScene.add.sprite(0, 0, "cursor");
      this.toggle.setScale(0.5);
      this.toggle.setOrigin(0, 0.5);
      this.toggle.setRotation((Math.PI / 180) * -90);
    } else {
      this.toggle = globalScene.add.sprite(0, 0, "candy");
      this.toggle.setScale(0.3);
      this.toggle.setOrigin(0, 0.5);
    }
    this.add(this.toggle);
    this.toggle.setVisible(visible);
    this.updateToggleIconColor();
  }

  /**
   * Set the toggle icon color based on the current state
   */
  private updateToggleIconColor(): void {
    switch (this.state) {
      case DropDownState.ON:
        this.toggle.setTint(this.onColor);
        break;
      case DropDownState.OFF:
        this.toggle.setTint(this.offColor);
        break;
      case DropDownState.EXCLUDE:
        this.toggle.setTint(this.excludeColor);
        break;
      case DropDownState.UNLOCKABLE:
        this.toggle.setTint(this.unlockableColor);
        break;
      case DropDownState.ONE:
        this.toggle.setTint(this.oneColor);
        break;
      case DropDownState.TWO:
        this.toggle.setTint(this.twoColor);
        break;
    }
  }

  /**
   * Switch the option to its next state and update visuals
   * If only ON/OFF are possible, toggle between the two
   * For radials, move to the next state in the list
   * @returns the updated DropDownState
   */
  public toggleOptionState(): DropDownState {
    if (this.labels.length > 1) {
      return this.setCurrentLabel((this.currentLabelIndex + 1) % this.labels.length);
    }
    const newState = this.state === DropDownState.ON ? DropDownState.OFF : DropDownState.ON;
    return this.setOptionState(newState);
  }

  /**
   * Set the option to the given state and update visuals
   * @param newState the state to switch to
   * @returns the new DropDownState
   */
  public setOptionState(newState: DropDownState): DropDownState {
    const newLabelIndex = this.labels.findIndex(label => label.state === newState);
    if (newLabelIndex !== -1 && newLabelIndex !== this.currentLabelIndex) {
      return this.setCurrentLabel(newLabelIndex);
    }

    this.state = newState;
    this.updateToggleIconColor();
    return newState;
  }

  /**
   * Change the option state to the one at the given index and update visuals
   * @param index index of the state to switch to
   * @returns the new DropDownState
   */
  private setCurrentLabel(index: number): DropDownState {
    const currentLabel = this.labels[this.currentLabelIndex];
    const newLabel = this.labels[index];

    if (!newLabel) {
      return this.state;
    }

    this.currentLabelIndex = index;

    // update state, sprite and text to fit the new label
    this.state = newLabel.state;
    this.updateToggleIconColor();

    if (currentLabel.sprite) {
      this.text.x -= currentLabel.sprite.displayWidth + 2;
      currentLabel.sprite.setVisible(false);
    }
    if (newLabel.sprite) {
      this.text.x += newLabel.sprite.displayWidth + 2;
      newLabel.sprite.setVisible(true);
    }
    this.text.setText(newLabel.text);

    return this.state;
  }

  /**
   * Set the current SortDirection to the provided value and update icon accordingly
   * @param SortDirection the new SortDirection to use
   */
  public setDirection(dir: SortDirection): void {
    this.dir = dir;
    this.toggle.flipX = this.dir === SortDirection.DESC;
  }

  /**
   * Toggle the current SortDirection value
   */
  public toggleDirection(): void {
    this.setDirection(this.dir * -1);
  }

  /**
   * Place the label elements (text and sprite if there is one) to the provided x and y position
   * @param x the horizontal position
   * @param y the vertical position
   */
  setLabelPosition(x: number, y: number) {
    let textX = x;
    for (let i = 0; i < this.labels.length; i++) {
      const label = this.labels[i];
      if (label.sprite) {
        label.sprite.x = x;
        label.sprite.y = y;
        if (i === this.currentLabelIndex) {
          textX += label.sprite.displayWidth + 2;
        }
      }
    }
    if (this.text) {
      this.text.x = textX;
      this.text.y = y;
    }
  }

  /**
   * Place the toggle icon at the provided position
   * @param x the horizontal position
   * @param y the vertical position
   */
  setTogglePosition(x: number, y: number) {
    if (this.toggle) {
      this.toggle.x = x;
      this.toggle.y = y;
    }
  }

  /**
   * @returns the x position to use for the current label depending on if it has a sprite or not
   */
  getCurrentLabelX(): number | undefined {
    if (this.labels[this.currentLabelIndex].sprite) {
      return this.labels[this.currentLabelIndex].sprite?.x;
    }
    return this.text.x;
  }

  /**
   * @returns max width needed to display all of the labels
   */
  getWidth(): number {
    let w = 0;
    const currentText = this.text.text;
    for (const label of this.labels) {
      this.text.setText(label.text);
      const spriteWidth = label.sprite ? label.sprite.displayWidth + 2 : 0;
      w = Math.max(w, this.text.displayWidth + spriteWidth);
    }
    this.text.setText(currentText);
    return w;
  }
}

export class DropDown extends Phaser.GameObjects.Container {
  public options: DropDownOption[];
  private window: Phaser.GameObjects.NineSlice;
  private cursorObj: Phaser.GameObjects.Image;
  public dropDownType: DropDownType = DropDownType.MULTI;
  public cursor = 0;
  private lastCursor = -1;
  public defaultCursor = 0;
  private onChange: () => void;
  private lastDir: SortDirection = SortDirection.ASC;
  private defaultSettings: any[];
  private dropDownScrollBar: ScrollBar;
  private totalOptions = 0;
  private maxOptions = 0;
  private shownOptions = 0;
  private tooManyOptions = false;
  private firstShown = 0;
  private optionHeight = 0;
  private optionSpacing = 0;
  private optionPaddingX = 4;
  private optionPaddingY = 6;
  private optionWidth = 100;
  private cursorOffset = 0;

  constructor(
    x: number,
    y: number,
    options: DropDownOption[],
    onChange: () => void,
    type: DropDownType = DropDownType.MULTI,
    optionSpacing = 2,
  ) {
    const windowPadding = 5;
    const cursorOffset = 7;

    super(globalScene, x - cursorOffset - windowPadding, y);

    this.optionWidth = 100;
    this.optionHeight = 7;
    this.optionSpacing = optionSpacing;
    this.optionPaddingX = 4;
    this.optionPaddingY = 6;
    this.cursorOffset = cursorOffset;

    this.options = options;
    this.dropDownType = type;
    this.onChange = onChange;

    this.cursorObj = globalScene.add.image(this.optionPaddingX + 3, 0, "cursor");
    this.cursorObj.setScale(0.5);
    this.cursorObj.setOrigin(0, 0.5);
    this.cursorObj.setVisible(false);

    // For MULTI and HYBRID filter, add an ALL option at the top
    if (this.dropDownType === DropDownType.MULTI || this.dropDownType === DropDownType.HYBRID) {
      this.options.unshift(
        new DropDownOption(
          "ALL",
          new DropDownLabel(
            i18next.t("filterBar:all"),
            undefined,
            this.checkForAllOn() ? DropDownState.ON : DropDownState.OFF,
          ),
        ),
      );
    }

    this.maxOptions = 19;
    this.totalOptions = this.options.length;
    this.tooManyOptions = this.totalOptions > this.maxOptions;
    this.shownOptions = this.tooManyOptions ? this.maxOptions : this.totalOptions;

    this.defaultSettings = this.getSettings();

    // Place ui elements in the correct spot
    options.forEach((option, index) => {
      const toggleVisibility = type !== DropDownType.SINGLE || option.state === DropDownState.ON;
      option.setupToggleIcon(type, toggleVisibility);

      option.width = this.optionWidth;
      option.y = index * this.optionHeight + index * optionSpacing + this.optionPaddingY;

      const baseX = cursorOffset + this.optionPaddingX + 3;
      const baseY = this.optionHeight / 2;
      option.setLabelPosition(baseX + 8, baseY);
      if (type === DropDownType.SINGLE) {
        option.setTogglePosition(baseX + 3, baseY + 1);
      } else {
        option.setTogglePosition(baseX, baseY);
      }

      if (index >= this.shownOptions) {
        option.visible = false;
      }

      this.firstShown = 0;
    });

    this.window = addWindow(
      0,
      0,
      this.optionWidth,
      options[this.shownOptions - 1].y + this.optionHeight + this.optionPaddingY,
      false,
      false,
      undefined,
      undefined,
      WindowVariant.XTHIN,
    );
    this.add(this.window);
    this.add(options);
    this.add(this.cursorObj);
    this.setVisible(false);

    if (this.tooManyOptions) {
      // Setting the last parameter to 1 turns out to be optimal in all cases.
      this.dropDownScrollBar = new ScrollBar(this.window.width - 3, 5, 5, this.window.height - 10, 1);
      this.add(this.dropDownScrollBar);
      this.dropDownScrollBar.setTotalRows(this.totalOptions);
      this.dropDownScrollBar.setScrollCursor(0);
    }
  }

  getWidth(): number {
    return this.window ? this.window.width : this.width;
  }

  toggleVisibility(): void {
    this.setVisible(!this.visible);
  }

  setVisible(value: boolean): this {
    super.setVisible(value);

    if (value) {
      this.autoSize();
    }

    return this;
  }

  resetCursor(): boolean {
    // If we are an hybrid dropdown in "hover" mode, don't move the cursor back to 0
    if (this.dropDownType === DropDownType.HYBRID && this.checkForAllOff()) {
      return this.setCursor(this.lastCursor);
    }
    return this.setCursor(this.defaultCursor);
  }

  setCursor(cursor: number): boolean {
    if (this.tooManyOptions) {
      this.setLabels(cursor);
    }

    this.cursor = cursor;
    if (cursor < 0) {
      cursor = 0;
      this.cursorObj.setVisible(false);
      return false;
    }
    if (cursor >= this.options.length) {
      cursor = this.options.length - 1;
      this.cursorObj.y = this.options[cursor].y + 3.5;
      this.cursorObj.setVisible(true);
      return false;
    }
    this.cursorObj.y = this.options[cursor].y + 3.5;
    this.cursorObj.setVisible(true);
    // If hydrid type, we need to update the filters when going up/down in the list
    if (this.dropDownType === DropDownType.HYBRID) {
      this.lastCursor = cursor;
      this.onChange();
    }
    return true;
  }

  setLabels(cursor: number) {
    if (cursor === 0 && this.lastCursor === this.totalOptions - 1) {
      this.firstShown = 0;
    } else if (cursor === this.totalOptions - 1 && this.lastCursor === 0) {
      this.firstShown = this.totalOptions - this.shownOptions;
    } else if (cursor - this.firstShown >= this.shownOptions && cursor > this.lastCursor) {
      this.firstShown += 1;
    } else if (cursor < this.firstShown && cursor < this.lastCursor) {
      this.firstShown -= 1;
    }

    this.options.forEach((option, index) => {
      option.y = (index - this.firstShown) * (this.optionHeight + this.optionSpacing) + this.optionPaddingY;

      const baseX = this.cursorOffset + this.optionPaddingX + 3;
      const baseY = this.optionHeight / 2;
      option.setLabelPosition(baseX + 8, baseY);
      if (this.dropDownType === DropDownType.SINGLE) {
        option.setTogglePosition(baseX + 3, baseY + 1);
      } else {
        option.setTogglePosition(baseX, baseY);
      }

      if (index < this.firstShown || index >= this.firstShown + this.shownOptions) {
        option.visible = false;
      } else {
        option.visible = true;
      }
    });

    this.dropDownScrollBar.setScrollCursor(cursor);
  }

  /**
   * Switch the option at the provided index to its next state and update visuals
   * Update accordingly the other options if needed:
   *  - if "all" is toggled, also update all other options
   *  - for DropDownType.SINGLE, unselect the previously selected option if applicable
   * @param index the index of the option for which to update the state
   */
  toggleOptionState(index: number = this.cursor): void {
    const option: DropDownOption = this.options[index];
    if (this.dropDownType === DropDownType.MULTI || this.dropDownType === DropDownType.HYBRID) {
      const newState = option.toggleOptionState();
      if (index === 0) {
        // we are on the All option > put all other options to the newState
        this.setAllOptions(newState);
      } else if (newState === DropDownState.ON && this.checkForAllOn()) {
        // select the "all" option if all others are selected, other unselect it
        this.options[0].setOptionState(DropDownState.ON);
      } else {
        this.options[0].setOptionState(DropDownState.OFF);
      }
    } else if (this.dropDownType === DropDownType.SINGLE) {
      if (option.state === DropDownState.OFF) {
        this.options.forEach(option => {
          option.setOptionState(DropDownState.OFF);
          option.setDirection(SortDirection.ASC);
          option.toggle.setVisible(false);
        });
        option.setOptionState(DropDownState.ON);
        option.setDirection(this.lastDir);
        option.toggle.setVisible(true);
      } else {
        option.toggleDirection();
        this.lastDir = this.options[this.cursor].dir;
      }
    } else if (this.dropDownType === DropDownType.RADIAL) {
      option.toggleOptionState();
    }
    this.onChange();
  }

  /**
   * Check whether all options except the "ALL" one are ON
   * @returns true if all options are set to DropDownState.ON, false otherwise
   */
  checkForAllOn(): boolean {
    return this.options.every((option, i) => i === 0 || option.state === DropDownState.ON);
  }

  /**
   * Check whether all options except the "ALL" one are OFF
   * @returns true if all options are set to DropDownState.OFF, false otherwise
   */
  checkForAllOff(): boolean {
    return this.options.every((option, i) => i === 0 || option.state === DropDownState.OFF);
  }

  /**
   * Get the current selected values for each option
   * @returns an array of values, depending on the DropDownType
   *  - if MULTI or HYBRID, an array of all the values of the options set to ON (except the ALL one)
   *  - if RADIAL, an array where the value for each option is of the form { val: any, state: DropDownState }
   *  - if SINGLE, a single object of the form { val: any, state: SortDirection }
   */
  getVals(): any[] {
    if (this.dropDownType === DropDownType.MULTI) {
      return this.options.filter((option, i) => i > 0 && option.state === DropDownState.ON).map(option => option.val);
    }
    if (this.dropDownType === DropDownType.HYBRID) {
      const selected = this.options
        .filter((option, i) => i > 0 && option.state === DropDownState.ON)
        .map(option => option.val);
      if (selected.length > 0) {
        return selected;
      }
      // if nothing is selected and the ALL option is hovered, return all elements
      if (this.cursor === 0) {
        return this.options.filter((_, i) => i > 0).map(option => option.val);
      }
      // if nothing is selected and a single option is hovered, return that one
      return [this.options[this.cursor].val];
    }
    if (this.dropDownType === DropDownType.RADIAL) {
      return this.options.map(option => {
        return { val: option.val, state: option.state };
      });
    }
    return this.options
      .filter(option => option.state === DropDownState.ON)
      .map(option => {
        return { val: option.val, dir: option.dir };
      });
  }

  /**
   * Get the current selected settings dictionary for each option
   * @returns an array of dictionaries with the current state of each option
   * - the settings dictionary is like this { val: any, state: DropDownState, cursor: boolean, dir: SortDirection }
   */
  private getSettings(): any[] {
    const settings: any[] = [];
    for (let i = 0; i < this.options.length; i++) {
      settings.push({
        val: this.options[i].val,
        state: this.options[i].state,
        cursor: this.cursor === i,
        dir: this.options[i].dir,
      });
    }
    return settings;
  }

  /**
   * Check whether the values of all options are the same as the default ones
   * @returns true if they are the same, false otherwise
   */
  public hasDefaultValues(): boolean {
    const currentValues = this.getSettings();

    const compareValues = (keys: string[]): boolean => {
      return (
        currentValues.length === this.defaultSettings.length
        && currentValues.every((value, index) => keys.every(key => value[key] === this.defaultSettings[index][key]))
      );
    };

    switch (this.dropDownType) {
      case DropDownType.MULTI:
      case DropDownType.RADIAL:
        return compareValues(["val", "state"]);

      case DropDownType.HYBRID:
        return compareValues(["val", "state", "cursor"]);

      case DropDownType.SINGLE:
        return compareValues(["val", "state", "dir"]);

      default:
        return false;
    }
  }

  /**
   * Set all values to their default state
   */
  public resetToDefault(): void {
    if (this.defaultSettings.length > 0) {
      this.setCursor(this.defaultCursor);
      this.lastDir = SortDirection.ASC;

      for (let i = 0; i < this.options.length; i++) {
        // reset values with the defaultValues
        if (this.dropDownType === DropDownType.SINGLE) {
          if (this.defaultSettings[i].state === DropDownState.OFF) {
            this.options[i].setOptionState(DropDownState.OFF);
            this.options[i].setDirection(SortDirection.ASC);
            this.options[i].toggle.setVisible(false);
          } else {
            this.options[i].setOptionState(DropDownState.ON);
            this.options[i].setDirection(SortDirection.ASC);
            this.options[i].toggle.setVisible(true);
          }
        } else if (this.defaultSettings[i]) {
          this.options[i].setOptionState(this.defaultSettings[i]["state"]);
        }
      }

      this.onChange();
    }
  }

  /**
   * Set all options to a specific state
   * @param state the DropDownState to assign to each option
   */
  private setAllOptions(state: DropDownState): void {
    // For single type dropdown, setting all options is not relevant
    if (this.dropDownType === DropDownType.SINGLE) {
      return;
    }

    for (const option of this.options) {
      option.setOptionState(state);
    }
  }

  /**
   * Set all options to their ON state
   */
  public selectAllOptions() {
    this.setAllOptions(DropDownState.ON);
  }

  /**
   * Set all options to their OFF state
   */
  public unselectAllOptions() {
    this.setAllOptions(DropDownState.OFF);
  }

  /**
   * Automatically set the width and position based on the size of options
   */
  autoSize(): void {
    let maxWidth = 0;
    let x = 0;
    for (const option of this.options) {
      const optionWidth = option.getWidth();
      if (optionWidth > maxWidth) {
        maxWidth = optionWidth;
        x = option.getCurrentLabelX() ?? 0;
      }
    }
    this.window.width = maxWidth + x - this.window.x + 9;

    if (this.tooManyOptions) {
      this.window.width += 6;
      this.dropDownScrollBar.x = this.window.width - 9;
    }

    if (this.x + this.window.width > this.parentContainer.width) {
      this.x = this.parentContainer.width - this.window.width;
    }
  }
}
