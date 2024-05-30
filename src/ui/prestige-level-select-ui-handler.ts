import BattleScene from "../battle-scene";
import OptionSelectUiHandler from "./option-select-ui-handler";
import { PrestigeModifiersDescription } from "./prestige-modifiers-description";
import { Mode } from "./ui";

export default class PrestigeLevelSelectUiHandler extends OptionSelectUiHandler {
  private prestigeModifiersDescription: PrestigeModifiersDescription;
  private descriptionContainer: Phaser.GameObjects.Container;

  constructor(scene: BattleScene, mode: Mode = Mode.PRESTIGE_LEVEL_SELECT) {
    super(scene, mode);
  }

  setup() {
    super.setup();

    const ui = this.getUi();

    this.descriptionContainer = this.scene.add.container(0, -(this.scene.game.canvas.height / 6));
    this.descriptionContainer.setVisible(false);
    ui.add(this.descriptionContainer);

    this.prestigeModifiersDescription = new PrestigeModifiersDescription(this.scene, 0, 0);
    this.prestigeModifiersDescription.setup();

    this.descriptionContainer.add(this.prestigeModifiersDescription);
  }

  show(args: any[]): boolean {
    const result = super.show(args);
    if (result) {
      this.descriptionContainer.setVisible(true);
      this.prestigeModifiersDescription.setVisible(true);
    }
    return result;
  }

  clear(): void {
    super.clear();
    this.descriptionContainer.setVisible(false);
    this.prestigeModifiersDescription.setVisible(false);
  }

  setCursor(cursor: number): boolean {
    const result = super.setCursor(cursor);
    const selectedOption = this.getCurrentSelectedOption();
    if (selectedOption !== undefined) {
      const value = selectedOption.value;
      if (value !== undefined) {
        this.prestigeModifiersDescription.updateContent(value as integer);
      }
    }
    return result;
  }
}
