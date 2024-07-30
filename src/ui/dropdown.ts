import BattleScene from "#app/battle-scene.js";
import { SceneBase } from "#app/scene-base.js";
import { addTextObject, TextStyle } from "./text";
import { addWindow, WindowVariant } from "./ui-theme";
import i18next from "i18next";

export enum DropDownState {
    ON = 0,
    OFF = 1,
    INCLUDE = 2,
    EXCLUDE = 3,
}

export enum DropDownType {
    MULTI = 0,
    SINGLE = 1,
    TRI = 2
}

export enum SortDirection {
  ASC = -1,
  DESC = 1
}

export class DropDownOption extends Phaser.GameObjects.Container {
  public state: DropDownState = DropDownState.ON;
  public toggle: Phaser.GameObjects.Sprite;
  public text: Phaser.GameObjects.Text;
  public sprite?: Phaser.GameObjects.Sprite;
  public val: any;
  public dir: SortDirection = SortDirection.ASC;
  public offStateLabel?: string; // label for OFF state in TRI dropdown
  public includeStateLabel?: string; // label for INCLUDE state in TRI dropdown
  public excludeStateLabel?: string; // label for EXCLUDE state in TRI dropdown
  private onColor = 0x55ff55;
  private offColor = 0x272727;
  private includeColor = 0x55ff55;
  private excludeColor = 0xff5555;


  constructor(scene: SceneBase, val: any, text: string | string[], sprite?: Phaser.GameObjects.Sprite, state: DropDownState = DropDownState.ON) {
    super(scene);
    this.val = val;
    this.state = state;
    if (text) {
      if (Array.isArray(text)) {
        this.offStateLabel = text[0];
        this.includeStateLabel = text[1];
        this.excludeStateLabel = text[2];
        text = text[0];
      } else {
        this.offStateLabel = undefined;
        this.includeStateLabel = undefined;
        this.excludeStateLabel = undefined;
      }
      this.text = addTextObject(scene, 0, 0, text, TextStyle.TOOLTIP_CONTENT);
      this.text.setOrigin(0, 0.5);
      this.add(this.text);
    }

    if (sprite) {
      this.sprite = sprite.setOrigin(0, 0.5);
      this.add(this.sprite);
    }
  }

  public setupToggle(type: DropDownType): void {
    if (type === DropDownType.MULTI || type === DropDownType.TRI) {
      this.toggle = this.scene.add.sprite(0, 0, "candy");
      this.toggle.setScale(0.3);
      this.toggle.setOrigin(0, 0.5);
    } else {
      this.toggle = this.scene.add.sprite(0, 0, "cursor");
      this.toggle.setScale(0.5);
      this.toggle.setOrigin(0, 0.5);
      this.toggle.setRotation(Math.PI / 180 * -90);
    }
    this.add(this.toggle);
  }

  public setOptionState(type: DropDownType, state: DropDownState): DropDownState {
    this.state = state;
    // if type is MULTI or SINGLE, set the color of the toggle based on the state
    if (type === DropDownType.MULTI || type === DropDownType.SINGLE) {
      if (this.state === DropDownState.OFF) {
        this.toggle.setTint(this.offColor);
      } else if (this.state === DropDownState.ON) {
        this.toggle.setTint(this.onColor);
      }
    } else if (type === DropDownType.TRI) {
      if (this.state === DropDownState.OFF) {
        this.text.setText(this.offStateLabel ?? []);
        this.toggle.setTint(this.offColor);
      } else if (this.state === DropDownState.INCLUDE) {
        this.text.setText(this.includeStateLabel ?? []);
        this.toggle.setTint(this.includeColor);
      } else if (this.state === DropDownState.EXCLUDE) {
        this.text.setText(this.excludeStateLabel ?? []);
        this.toggle.setTint(this.excludeColor);
      }
    }
    return this.state;
  }

  public toggleOptionState(type: DropDownType): DropDownState {
    if (type === DropDownType.TRI) {
      switch (this.state) {
      case DropDownState.OFF:
        this.state = DropDownState.INCLUDE;
        break;
      case DropDownState.INCLUDE:
        this.state = DropDownState.EXCLUDE;
        break;
      case DropDownState.EXCLUDE:
        this.state = DropDownState.OFF;
        break;
      }
    } else {
      switch (this.state) {
      case DropDownState.ON:
        this.state = DropDownState.OFF;
        break;
      case DropDownState.OFF:
        this.state = DropDownState.ON;
        break;
      }
    }
    return this.setOptionState(type, this.state);
  }

  public setDirection(dir: SortDirection): void {
    this.dir = dir;
    this.toggle.flipX = this.dir === SortDirection.DESC;
  }

  public toggleDirection(): void {
    this.setDirection(this.dir * -1);
  }
}

export class DropDown extends Phaser.GameObjects.Container {
  public options: DropDownOption[];
  private window: Phaser.GameObjects.NineSlice;
  private cursorObj: Phaser.GameObjects.Image;
  private dropDownType: DropDownType = DropDownType.MULTI;
  public cursor: integer = 0;
  private onChange: () => void;
  private lastDir: SortDirection = SortDirection.ASC;

  constructor(scene: BattleScene, x: number, y: number, options: DropDownOption[], onChange: () => void, type: DropDownType = DropDownType.MULTI, optionSpacing: number = 2) {
    const windowPadding = 5;
    const optionHeight = 7;
    const optionPaddingX = 4;
    const optionPaddingY = 6;
    const cursorOffset = 7;
    const optionWidth = 100;

    super(scene, x - cursorOffset - windowPadding, y);
    this.options = options;
    this.dropDownType = type;
    this.onChange = onChange;

    this.cursorObj = scene.add.image(optionPaddingX + 3, 0, "cursor");
    this.cursorObj.setScale(0.5);
    this.cursorObj.setOrigin(0, 0.5);
    this.cursorObj.setVisible(false);

    if (this.dropDownType === DropDownType.MULTI) {
      this.options.unshift(new DropDownOption(scene, "ALL", i18next.t("filterBar:all"), undefined, this.checkForAllOn() ? DropDownState.ON : DropDownState.OFF));
    }

    options.forEach((option, index) => {
      option.setupToggle(type);
      if (type === DropDownType.SINGLE && option.state === DropDownState.OFF) {
        option.toggle.setVisible(false);
      }
      option.setOptionState(type, option.state);

      option.width = optionWidth;
      option.y = index * optionHeight + index * optionSpacing + optionPaddingY;

      if (option.text) {
        option.text.x = cursorOffset + optionPaddingX + 3 + 8;
        option.text.y = optionHeight / 2;
      }
      if (option.sprite) {
        option.sprite.x = cursorOffset + optionPaddingX + 3 + 8;
        option.sprite.y = optionHeight / 2;
      }
      if (type === DropDownType.SINGLE) {
        option.toggle.x = cursorOffset + optionPaddingX + 3 + 3;
        option.toggle.y = optionHeight / 2 + 1;
      } else {
        option.toggle.x = cursorOffset + optionPaddingX + 3;
        option.toggle.y = optionHeight / 2;
      }
    });
    this.window = addWindow(scene, 0, 0, optionWidth, options[options.length - 1].y + optionHeight + optionPaddingY, false, false, undefined, undefined, WindowVariant.XTHIN);
    this.add(this.window);
    this.add(options);
    this.add(this.cursorObj);
    this.setVisible(false);
  }

  toggle(): void {
    this.setVisible(!this.visible);
  }

  setCursor(cursor: integer): boolean {
    this.cursor = cursor;
    if (cursor < 0) {
      cursor = 0;
      this.cursorObj.setVisible(false);
      return false;
    } else if (cursor >= this.options.length) {
      cursor = this.options.length - 1;
      this.cursorObj.y = this.options[cursor].y + 3.5;
      this.cursorObj.setVisible(true);
      return false;
    } else {
      this.cursorObj.y = this.options[cursor].y + 3.5;
      this.cursorObj.setVisible(true);
    }
    return true;
  }

  toggleOptionState(): void {
    if (this.dropDownType === DropDownType.MULTI) {
      const newState = this.options[this.cursor].toggleOptionState(this.dropDownType);
      if (this.cursor === 0) {
        this.options.forEach((option, index) => {
          if (index !== this.cursor) {
            option.setOptionState(this.dropDownType, newState);
          }
        });
      } else {
        if (this.checkForAllOff()) {
          this.options[0].setOptionState(this.dropDownType, DropDownState.OFF);
        } else if (this.checkForAllOn()) {
          this.options[0].setOptionState(this.dropDownType, DropDownState.ON);
        } else {
          this.options[0].setOptionState(this.dropDownType, DropDownState.OFF);
        }
      }
    } else if (this.dropDownType === DropDownType.SINGLE) {
      if (this.options[this.cursor].state === DropDownState.OFF) {
        this.options.forEach((option) => {
          option.setOptionState(this.dropDownType, DropDownState.OFF);
          option.setDirection(SortDirection.ASC);
          option.toggle.setVisible(false);
        });
        this.options[this.cursor].setOptionState(this.dropDownType, DropDownState.ON);
        this.options[this.cursor].setDirection(this.lastDir);
        this.options[this.cursor].toggle.setVisible(true);
      } else {
        this.options[this.cursor].toggleDirection();
        this.lastDir = this.options[this.cursor].dir;
      }
    } else if (this.dropDownType === DropDownType.TRI) {
      this.options[this.cursor].toggleOptionState(this.dropDownType);
      this.autoSize();
    }
    this.onChange();
  }

  setVisible(value: boolean): this {
    super.setVisible(value);

    if (value) {
      this.autoSize();
    }

    return this;
  }

  checkForAllOn(): boolean {
    return this.options.every((option, i) => i === 0 || option.state === DropDownState.ON);
  }

  checkForAllOff(): boolean {
    return this.options.every((option, i) => i === 0 || option.state === DropDownState.OFF);
  }

  getVals(): any[] {
    if (this.dropDownType === DropDownType.MULTI) {
      return this.options.filter((option, i) => i > 0 && option.state === DropDownState.ON).map((option) => option.val);
    // in TRI dropdown, if state is ON, return the "ON" with the value, if state is OFF, return the "OFF" with the value, if state is TRI, return the "TRI" with the value
    } else if (this.dropDownType === DropDownType.TRI) {
      return this.options.filter((option, i) => option.state === DropDownState.OFF || option.state === DropDownState.INCLUDE || option.state === DropDownState.EXCLUDE).map((option) => {
        return {val: option.val, state: option.state};
      });
    } else {
      return this.options.filter((option, i) => option.state === DropDownState.ON).map((option) => {
        return {val: option.val, dir: option.dir};
      });
    }
  }

  autoSize(): void {
    let maxWidth = 0;
    let x = 0;
    for (let i = 0; i < this.options.length; i++) {
      if (this.options[i].sprite) {
        if (this.options[i].sprite!.displayWidth > maxWidth) {
          maxWidth = this.options[i].sprite!.displayWidth;
          x = this.options[i].sprite!.x;
        }
      } else {
        if (this.options[i].text.displayWidth > maxWidth) {
          maxWidth = this.options[i].text.displayWidth;
          x = this.options[i].text.x;
        }
      }
    }
    this.window.width = maxWidth + x - this.window.x + 6;

    if (this.x + this.window.width > this.parentContainer.width) {
      this.x = this.parentContainer.width - this.window.width;
    }
  }

  isActive(): boolean {
    return this.options.some((option) => option.state === DropDownState.ON);
  }
}
