import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import type { MappingSettingName } from "#types/configs/inputs";
import { specialIconKeys, specialIcons } from "#ui/settings/special-icons";
import { addTextObject, setTextStyle } from "#ui/text";
import { addWindow } from "#ui/ui-theme";

/**
 * A reusable UI container that manages tab-based navigation.
 * It supports button navigation (e.g., CYCLE_FORM/CYCLE_SHINY) and updates the visual state of the tabs.
 */
export class TabMenu extends Phaser.GameObjects.Container {
  public selectedIndex = 0;
  private labels: string[];
  private headerTitles: Phaser.GameObjects.Text[] = [];
  private navigationIcons: Partial<Record<MappingSettingName, Phaser.GameObjects.Sprite>> = {};

  /**
   * Callback executed whenever the user navigates to a new tab.
   * @param tabIndex The index of the newly selected tab.
   */
  private onChangeCallback: (tabIndex: number) => void;

  constructor(x: number, y: number, width: number, labels: string[], onChange: (tabIndex: number) => void) {
    super(globalScene, x, y);
    this.labels = labels;
    this.onChangeCallback = onChange;

    const headerBg = addWindow(0, 0, width, 24).setOrigin(0, 0);
    this.add(headerBg);
    this.width = headerBg.width;
    this.height = headerBg.height;

    const iconPreviousTab = globalScene.add.sprite(8, 4, "keyboard").setOrigin(0, -0.1);
    iconPreviousTab.setPositionRelative(headerBg, 8, 4);
    this.navigationIcons["BUTTON_CYCLE_FORM"] = iconPreviousTab;

    const iconNextTab = globalScene.add.sprite(0, 0, "keyboard").setOrigin(0, -0.1);
    iconNextTab.setPositionRelative(headerBg, headerBg.width - 20, 4);
    this.navigationIcons["BUTTON_CYCLE_SHINY"] = iconNextTab;

    let currentX = 24;
    for (const label of this.labels) {
      const labelText = addTextObject(currentX, 4, label, TextStyle.SETTINGS_LABEL_NAVBAR).setOrigin(0, 0);

      this.add(labelText);
      this.headerTitles.push(labelText);

      currentX += labelText.displayWidth + 16;
    }

    this.add(iconPreviousTab);
    this.add(iconNextTab);

    this.updateTabs();
  }

  private updateTabs(): void {
    for (const [index, title] of this.headerTitles.entries()) {
      setTextStyle(title, index === this.selectedIndex ? TextStyle.SETTINGS_SELECTED : TextStyle.SETTINGS_LABEL_NAVBAR);
    }
  }

  public updateIcons(): void {
    for (const settingName of Object.keys(this.navigationIcons)) {
      if (specialIconKeys?.includes(settingName)) {
        this.navigationIcons[settingName].setTexture("keyboard").setFrame(specialIcons[settingName]).setAlpha(1);
        continue;
      }
      const { inputController } = globalScene;
      const icon = inputController?.getIconForLatestInputRecorded(settingName as MappingSettingName);
      const type = inputController?.getLastSourceType();
      if (icon != null && type != null) {
        this.navigationIcons[settingName].setTexture(type).setFrame(icon).setAlpha(1);
      } else {
        this.navigationIcons[settingName].alpha = 0;
      }
    }
  }

  public setIndex(index: number): void {
    this.selectedIndex = index;
    this.updateTabs();
  }

  public navigate(button: Button): boolean {
    if (button === Button.CYCLE_FORM) {
      this.selectedIndex = this.selectedIndex === 0 ? this.labels.length - 1 : this.selectedIndex - 1;
    } else if (button === Button.CYCLE_SHINY) {
      this.selectedIndex = this.selectedIndex === this.labels.length - 1 ? 0 : this.selectedIndex + 1;
    } else {
      return false;
    }

    this.updateTabs();
    this.onChangeCallback(this.selectedIndex);
    return true;
  }
}
