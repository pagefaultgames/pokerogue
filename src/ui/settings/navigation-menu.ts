import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { InputsIcons } from "#ui/abstract-control-settings-ui-handler";
import { addTextObject, setTextStyle } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import i18next from "i18next";

const LEFT = "LEFT";
const RIGHT = "RIGHT";

/**
 * Manages navigation and menus tabs within the setting menu.
 */
export class NavigationManager {
  private static instance: NavigationManager;
  public modes: UiMode[];
  public selectedMode: UiMode = UiMode.SETTINGS;
  public navigationMenus: NavigationMenu[] = [];
  public labels: string[];

  /**
   * Creates an instance of NavigationManager.
   * To create a new tab in the menu, add the mode to the modes array and the label to the labels array.
   * and instantiate a new NavigationMenu instance in your handler
   * like: this.navigationContainer = new NavigationMenu(0, 0);
   */
  constructor() {
    this.modes = [
      UiMode.SETTINGS,
      UiMode.SETTINGS_DISPLAY,
      UiMode.SETTINGS_AUDIO,
      UiMode.SETTINGS_GAMEPAD,
      UiMode.SETTINGS_KEYBOARD,
    ];
    this.labels = [
      i18next.t("settings:general"),
      i18next.t("settings:display"),
      i18next.t("settings:audio"),
      i18next.t("settings:gamepad"),
      i18next.t("settings:keyboard"),
    ];
  }

  public reset() {
    this.selectedMode = UiMode.SETTINGS;
    this.updateNavigationMenus();
  }

  /**
   * Gets the singleton instance of the NavigationManager.
   * @returns The singleton instance of NavigationManager.
   */
  public static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }

  /**
   * Navigates modes based on given direction
   * @param direction LEFT or RIGHT
   */
  public navigate(direction) {
    const pos = this.modes.indexOf(this.selectedMode);
    const maxPos = this.modes.length - 1;
    const increment = direction === LEFT ? -1 : 1;
    if (pos === 0 && direction === LEFT) {
      this.selectedMode = this.modes[maxPos];
    } else if (pos === maxPos && direction === RIGHT) {
      this.selectedMode = this.modes[0];
    } else {
      this.selectedMode = this.modes[pos + increment];
    }
    globalScene.ui.setMode(this.selectedMode);
    this.updateNavigationMenus();
  }

  /**
   * Updates all navigation menus.
   */
  public updateNavigationMenus() {
    for (const instance of this.navigationMenus) {
      instance.update();
    }
  }

  /**
   * Updates icons for all navigation menus.
   */
  public updateIcons() {
    for (const instance of this.navigationMenus) {
      instance.updateIcons();
    }
  }

  /**
   * Removes menus from the manager in preparation for reset
   */
  public clearNavigationMenus() {
    this.navigationMenus.length = 0;
  }
}

export class NavigationMenu extends Phaser.GameObjects.Container {
  private navigationIcons: InputsIcons;
  protected headerTitles: Phaser.GameObjects.Text[] = [];

  /**
   * Creates an instance of NavigationMenu.
   * @param x The x position of the NavigationMenu.
   * @param y The y position of the NavigationMenu.
   */
  constructor(x: number, y: number) {
    super(globalScene, x, y);

    this.setup();
  }

  /**
   * Sets up the NavigationMenu by adding windows, icons, and labels.
   */
  setup() {
    const navigationManager = NavigationManager.getInstance();
    const headerBg = addWindow(0, 0, globalScene.scaledCanvas.width - 2, 24);
    headerBg.setOrigin(0, 0);
    this.add(headerBg);
    this.width = headerBg.width;
    this.height = headerBg.height;

    this.navigationIcons = {};

    const iconPreviousTab = globalScene.add.sprite(8, 4, "keyboard");
    iconPreviousTab.setOrigin(0, -0.1);
    iconPreviousTab.setPositionRelative(headerBg, 8, 4);
    this.navigationIcons["BUTTON_CYCLE_FORM"] = iconPreviousTab;

    const iconNextTab = globalScene.add.sprite(0, 0, "keyboard");
    iconNextTab.setOrigin(0, -0.1);
    iconNextTab.setPositionRelative(headerBg, headerBg.width - 20, 4);
    this.navigationIcons["BUTTON_CYCLE_SHINY"] = iconNextTab;

    let relative: Phaser.GameObjects.Sprite | Phaser.GameObjects.Text = iconPreviousTab;
    let relativeWidth: number = iconPreviousTab.width * 6;
    for (const label of navigationManager.labels) {
      const labelText = addTextObject(0, 0, label, TextStyle.SETTINGS_LABEL_NAVBAR);
      labelText.setOrigin(0, 0);
      labelText.setPositionRelative(relative, 6 + relativeWidth / 6, 0);
      this.add(labelText);
      this.headerTitles.push(labelText);
      relative = labelText;
      relativeWidth = labelText.width;
    }

    this.add(iconPreviousTab);
    this.add(iconNextTab);
    navigationManager.navigationMenus.push(this);
    navigationManager.updateNavigationMenus();
  }

  /**
   * Updates the NavigationMenu's header titles based on the selected mode.
   */
  update() {
    const navigationManager = NavigationManager.getInstance();
    const posSelected = navigationManager.modes.indexOf(navigationManager.selectedMode);

    for (const [index, title] of this.headerTitles.entries()) {
      setTextStyle(title, index === posSelected ? TextStyle.SETTINGS_SELECTED : TextStyle.SETTINGS_LABEL);
    }
  }

  /**
   * Updates the icons in the NavigationMenu based on the latest input recorded.
   */
  updateIcons() {
    const specialIcons = {
      BUTTON_HOME: "HOME.png",
      BUTTON_DELETE: "DEL.png",
    };
    for (const settingName of Object.keys(this.navigationIcons)) {
      if (Object.keys(specialIcons).includes(settingName)) {
        this.navigationIcons[settingName].setTexture("keyboard");
        this.navigationIcons[settingName].setFrame(specialIcons[settingName]);
        this.navigationIcons[settingName].alpha = 1;
        continue;
      }
      const icon = globalScene.inputController?.getIconForLatestInputRecorded(settingName);
      if (icon) {
        const type = globalScene.inputController?.getLastSourceType();
        this.navigationIcons[settingName].setTexture(type);
        this.navigationIcons[settingName].setFrame(icon);
        this.navigationIcons[settingName].alpha = 1;
      } else {
        this.navigationIcons[settingName].alpha = 0;
      }
    }
  }

  /**
   * Handles navigation based on the button pressed.
   * @param button The button pressed for navigation.
   * @returns A boolean indicating if the navigation was handled.
   */
  navigate(button: Button): boolean {
    const navigationManager = NavigationManager.getInstance();
    switch (button) {
      case Button.CYCLE_FORM:
        navigationManager.navigate(LEFT);
        return true;
      case Button.CYCLE_SHINY:
        navigationManager.navigate(RIGHT);
        return true;
    }
    return false;
  }
}
