import BattleScene from "#app/battle-scene.js";
import { SceneBase } from "#app/scene-base.js";
import { addTextObject, TextStyle } from "./text";
import { addWindow, WindowVariant } from "./ui-theme";

export enum DropDownState {
    ON,
    OFF
}

export enum DropDownType {
    MULTI = 0,
    SINGLE
}

export class DropDownOption extends Phaser.GameObjects.Container {
  public state: DropDownState = DropDownState.ON;
  public toggle: Phaser.GameObjects.Sprite;
  public text: Phaser.GameObjects.Text;
  public sprite?: Phaser.GameObjects.Sprite;

  constructor(scene: SceneBase, text: string, sprite?: Phaser.GameObjects.Sprite, state: DropDownState = DropDownState.ON) {
    super(scene);
    this.toggle = scene.add.sprite(0, 0, "candy").setScale(0.3).setOrigin(0, 0.5);
    this.text = addTextObject(scene, 0, 0, text, TextStyle.TOOLTIP_CONTENT).setOrigin(0, 0.5);
    this.add(this.toggle);
    this.add(this.text);
    if (sprite) {
      this.sprite = sprite.setOrigin(0, 0.5);
      this.add(this.sprite);
    }
    this.setOptionState(state);
  }

  public setOptionState(state: DropDownState): DropDownState {
    this.state = state % 2;
    if (this.state === DropDownState.OFF) {
      this.toggle.setTint(0xff5555);
    } else {
      this.toggle.setTint(0x55ff55);
    }
    return this.state;
  }

  public toggleOptionState(): DropDownState {
    return this.setOptionState(this.state + 1);
  }
}

export class DropDown extends Phaser.GameObjects.Container {
  public options: DropDownOption[];
  private window: Phaser.GameObjects.NineSlice;
  private cursorObj: Phaser.GameObjects.Image;
  private dropDownType: DropDownType = DropDownType.MULTI;
  private cursor: integer = 0;

  constructor(scene: BattleScene, x: number, y: number, options: DropDownOption[], type: DropDownType = DropDownType.MULTI, optionSpacing: number = 2) {
    const windowPadding = 5;
    const optionHeight = 7;
    const optionPaddingX = 4;
    const optionPaddingY = 6;
    const cursorOffset = 7;
    const optionWidth = type === DropDownType.MULTI ? 50 : 50;

    super(scene, x - cursorOffset - windowPadding, y);
    this.options = options;
    this.dropDownType = type;

    this.cursorObj = scene.add.image(optionPaddingX + 3, 0, "cursor").setScale(0.5).setOrigin(0, 0.5);
    this.cursorObj.setVisible(false);

    if (this.dropDownType === DropDownType.MULTI) {
      this.options.unshift(new DropDownOption(scene, "All", null, DropDownState.ON));
    }

    options.forEach((option, index) => {
      option.width = optionWidth;
      option.y = index * optionHeight + index * optionSpacing + optionPaddingY;

      option.text.x = cursorOffset + optionPaddingX + 3 + 8;
      option.text.y = optionHeight / 2;
      if (option.sprite) {
        option.sprite.x = cursorOffset + optionPaddingX + 3 + 8;
        option.sprite.y = optionHeight / 2;
      }
      option.toggle.x = cursorOffset + optionPaddingX + 3;
      option.toggle.y = optionHeight / 2;
      if (type === DropDownType.SINGLE && option.state === DropDownState.OFF) {
        option.toggle.setVisible(false);
      }
    });
    this.window = addWindow(scene, 0, 0, optionWidth, options[options.length - 1].y + optionHeight + optionPaddingY, false, false, null, null, WindowVariant.XTHIN);
    this.add(this.window);
    this.add(options);
    this.add(this.cursorObj);
    this.setVisible(false);
  }

  toggle(): void {
    this.setVisible(!this.visible);
  }

  setCursor(cursor: integer): void {
    if (cursor < 0) {
      cursor = 0;
      this.cursorObj.setVisible(false);
    } else {
      this.cursorObj.y = this.options[cursor].y + 3.5;
      this.cursorObj.setVisible(true);
    }
    this.cursor = cursor;
  }

  toggleOptionState(): void {
    console.log(this);
    if (this.dropDownType === DropDownType.MULTI) {
      const newState = this.options[this.cursor].toggleOptionState();

      if (this.cursor === 0) {
        this.options.forEach((option, index) => {
          if (index !== this.cursor) {
            option.setOptionState(newState);
          }
        });
      } else {
        if (this.checkForAllOff()) {
          this.options[0].setOptionState(DropDownState.OFF);
        } else if (this.checkForAllOn()) {
          this.options[0].setOptionState(DropDownState.ON);
        }
      }
    } else {
      if (this.options[this.cursor].state === DropDownState.OFF) {
        this.options.forEach((option) => {
          option.setOptionState(DropDownState.OFF);
          option.toggle.setVisible(false);
        });
        this.options[this.cursor].setOptionState(DropDownState.ON);
        this.options[this.cursor].toggle.setVisible(true);
      }
    }
  }

  checkForAllOn(): boolean {
    return this.options.every((option, i) => i === 0 || option.state === DropDownState.ON);
  }

  checkForAllOff(): boolean {
    return this.options.every((option, i) => i === 0 || option.state === DropDownState.OFF);
  }
}
