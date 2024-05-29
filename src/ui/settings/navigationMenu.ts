import BattleScene from "#app/battle-scene";
import {Mode} from "#app/ui/ui";
import {InputsIcons} from "#app/ui/settings/abstract-settings-ui-handler";
import {addTextObject, setTextStyle, TextStyle} from "#app/ui/text";
import {addWindow} from "#app/ui/ui-theme";
import {Button} from "#app/enums/buttons";


class NavigationManager {
  private static instance: NavigationManager;
  public modes: Mode[];
  public selectedMode: Mode = Mode.SETTINGS;
  public navigationMenus: NavigationMenu[] = new Array<NavigationMenu>();

  constructor() {
    this.modes = [
      Mode.SETTINGS,
      Mode.SETTINGS_GAMEPAD,
    ];
  }

  public static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }

  public navigateLeft(scene) {
    const pos = this.modes.indexOf(this.selectedMode);
    const maxPos = this.modes.length - 1;
    if (pos === 0) {
      this.selectedMode = this.modes[maxPos];
    } else {
      this.selectedMode = this.modes[pos - 1];
    }
    scene.ui.setMode(this.selectedMode);
    this.updateNavigationMenus();
  }

  public navigateRight(scene) {
    const pos = this.modes.indexOf(this.selectedMode);
    const maxPos = this.modes.length - 1;
    if (pos === maxPos) {
      this.selectedMode = this.modes[0];
    } else {
      this.selectedMode = this.modes[pos + 1];
    }
    scene.ui.setMode(this.selectedMode);
    this.updateNavigationMenus();
  }

  public updateNavigationMenus() {
    for (const instance of this.navigationMenus) {
      instance.updateHeaderTitles();
    }
  }

}

export default class NavigationMenu extends Phaser.GameObjects.Container {
  private navigationIcons: InputsIcons;
  public scene: BattleScene;
  protected headerTitles: Phaser.GameObjects.Text[] = new Array<Phaser.GameObjects.Text>();
  public parentMode: Mode;

  constructor(scene: BattleScene, x: number, y: number) {
    super(scene, x, y);
    this.scene = scene;

    this.setup();
  }

  setup() {
    const navigationManager = NavigationManager.getInstance();
    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    headerBg.setOrigin(0, 0);
    this.width = headerBg.width;
    this.height = headerBg.height;

    this.navigationIcons = {};

    const iconPreviousTab = this.scene.add.sprite(8, 4, "keyboard");
    iconPreviousTab.setOrigin(0, -0.1);
    iconPreviousTab.setPositionRelative(headerBg, 8, 4);
    this.navigationIcons["BUTTON_CYCLE_FORM"] = iconPreviousTab;

    const iconNextTab = this.scene.add.sprite(0, 0, "keyboard");
    iconNextTab.setOrigin(0, -0.1);
    iconNextTab.setPositionRelative(headerBg, headerBg.width - 20, 4);
    this.navigationIcons["BUTTON_CYCLE_SHINY"] = iconNextTab;

    const headerText = addTextObject(this.scene, 0, 0, "General", TextStyle.SETTINGS_LABEL);
    this.headerTitles.push(headerText);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 18 + iconPreviousTab.width - 4, 4);

    const gamepadText = addTextObject(this.scene, 0, 0, "Gamepad", TextStyle.SETTINGS_LABEL);
    this.headerTitles.push(gamepadText);
    gamepadText.setOrigin(0, 0);
    gamepadText.setPositionRelative(headerBg, 60 + iconPreviousTab.width - 4, 4);

    const keyboardText = addTextObject(this.scene, 0, 0, "Keyboard", TextStyle.SETTINGS_LABEL);
    this.headerTitles.push(keyboardText);
    keyboardText.setOrigin(0, 0);
    keyboardText.setPositionRelative(headerBg, 107 + iconPreviousTab.width - 4, 4);

    this.add(headerBg);
    this.add(iconPreviousTab);
    this.add(iconNextTab);
    this.add(headerText);
    this.add(gamepadText);
    this.add(keyboardText);
    navigationManager.navigationMenus.push(this);
    navigationManager.updateNavigationMenus();
  }

  updateHeaderTitles() {
    const navigationManager = NavigationManager.getInstance();
    const posSelected = navigationManager.modes.indexOf(navigationManager.selectedMode);

    for (const [index, title] of this.headerTitles.entries()) {
      setTextStyle(title, this.scene, index === posSelected ? TextStyle.SETTINGS_SELECTED : TextStyle.SETTINGS_LABEL);
    }
  }


  navigate(button: Button): boolean {
    const navigationManager = NavigationManager.getInstance();
    switch (button) {
    case Button.CYCLE_FORM:
      navigationManager.navigateLeft(this.scene);
      return true;
      break;
    case Button.CYCLE_SHINY:
      navigationManager.navigateRight(this.scene);
      return true;
      break;
    }
    return false;
  }
}
