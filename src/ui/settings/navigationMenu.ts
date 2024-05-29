import BattleScene from "#app/battle-scene";
import {Mode} from "#app/ui/ui";
import {InputsIcons} from "#app/ui/settings/abstract-settings-ui-handler";
import {addTextObject, setTextStyle, TextStyle} from "#app/ui/text";
import {addWindow} from "#app/ui/ui-theme";
import {Button} from "#app/enums/buttons";


export class NavigationManager {
  private static instance: NavigationManager;
  public modes: Mode[];
  public selectedMode: Mode = Mode.SETTINGS;
  public navigationMenus: NavigationMenu[] = new Array<NavigationMenu>();
  public labels: string[];

  constructor() {
    this.modes = [
      Mode.SETTINGS,
      Mode.SETTINGS_GAMEPAD,
      Mode.SETTINGS_KEYBOARD,
    ];
    this.labels = ["General", "Gamepad", "Keyboard"];
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
      instance.update();
    }
  }

  public updateIcons() {
    for (const instance of this.navigationMenus) {
      instance.updateIcons();
    }
  }

}

export default class NavigationMenu extends Phaser.GameObjects.Container {
  private navigationIcons: InputsIcons;
  public scene: BattleScene;
  protected headerTitles: Phaser.GameObjects.Text[] = new Array<Phaser.GameObjects.Text>();

  constructor(scene: BattleScene, x: number, y: number) {
    super(scene, x, y);
    this.scene = scene;

    this.setup();
  }

  setup() {
    const navigationManager = NavigationManager.getInstance();
    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    headerBg.setOrigin(0, 0);
    this.add(headerBg);
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

    let relative: Phaser.GameObjects.Sprite | Phaser.GameObjects.Text = iconPreviousTab;
    let relativeWidth: number = iconPreviousTab.width*6;
    for (const label of navigationManager.labels) {
      const labelText = addTextObject(this.scene, 0, 0, label, TextStyle.SETTINGS_LABEL);
      labelText.setOrigin(0, 0);
      labelText.setPositionRelative(relative, 6 + relativeWidth/6, 0);
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

  update() {
    const navigationManager = NavigationManager.getInstance();
    const posSelected = navigationManager.modes.indexOf(navigationManager.selectedMode);

    for (const [index, title] of this.headerTitles.entries()) {
      setTextStyle(title, this.scene, index === posSelected ? TextStyle.SETTINGS_SELECTED : TextStyle.SETTINGS_LABEL);
    }
  }

  updateIcons() {
    const specialIcons = {
      "BUTTON_HOME": "HOME.png",
      "BUTTON_DELETE": "DEL.png",
    };
    for (const settingName of Object.keys(this.navigationIcons)) {
      if (Object.keys(specialIcons).includes(settingName)) {
        this.navigationIcons[settingName].setTexture("keyboard");
        this.navigationIcons[settingName].setFrame(specialIcons[settingName]);
        this.navigationIcons[settingName].alpha = 1;
        continue;
      }
      const icon = this.scene.inputController?.getIconForLatestInputRecorded(settingName);
      if (icon) {
        const type = this.scene.inputController?.getLastSourceType();
        this.navigationIcons[settingName].setTexture(type);
        this.navigationIcons[settingName].setFrame(icon);
        this.navigationIcons[settingName].alpha = 1;
      } else {
        this.navigationIcons[settingName].alpha = 0;
      }
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
