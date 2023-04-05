import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";

export default class SummaryUiHandler extends UiHandler {
  private summaryContainer: Phaser.GameObjects.Container;

  constructor(scene: BattleScene) {
    super(scene, Mode.SUMMARY);
  }

  setup() {
    const ui = this.getUi();

    this.summaryContainer = this.scene.add.container(0, 0);
    this.summaryContainer.setVisible(false);
    ui.add(this.summaryContainer);

    const summaryBg = this.scene.add.image(0, 0, 'summary_bg');
    this.summaryContainer.add(summaryBg);

    summaryBg.setOrigin(0, 1);
  }

  show(args: any[]) {
    super.show(args);

    this.summaryContainer.setVisible(true);
  }

  processInput(keyCode: integer) {
    const ui = this.getUi();
    const keyCodes = Phaser.Input.Keyboard.KeyCodes;
  }

  setCursor(cursor: integer): boolean {
    const changed = this.cursor !== cursor;
    if (changed) {
    }

    return changed;
  }

  clear() {
    super.clear();
    this.summaryContainer.setVisible(false);
  }
}
