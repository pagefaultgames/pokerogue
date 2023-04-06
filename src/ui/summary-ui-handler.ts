import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";

enum Page {
  PROFILE,
  MOVES
}

export default class SummaryUiHandler extends UiHandler {
  private summaryContainer: Phaser.GameObjects.Container;
  private summaryPage: Phaser.GameObjects.Sprite;
  private summaryPageTransition: Phaser.GameObjects.Sprite;

  private page: integer;

  constructor(scene: BattleScene) {
    super(scene, Mode.SUMMARY);
  }

  setup() {
    const ui = this.getUi();

    this.summaryContainer = this.scene.add.container(0, 0);
    this.summaryContainer.setVisible(false);
    ui.add(this.summaryContainer);

    const summaryBg = this.scene.add.image(0, 0, 'summary_bg');
    summaryBg.setOrigin(0, 1);
    this.summaryContainer.add(summaryBg);

    this.page = 0;

    this.summaryPage = this.scene.add.sprite(106, 21, this.getPageKey());
    this.summaryPage.setVisible(false);
    this.summaryContainer.add(this.summaryPage);
  }

  setPage(newPage: integer) {
    this.page = newPage;
  
    if (this.summaryPage.visible) {

    } else {
      this.summaryPage.setTexture(this.getPageKey());
      this.summaryPage.setVisible(true);
    }
  }

  getPageKey() {
    return `summary_${Page[this.page].toLowerCase()}`;
  }

  show(args: any[]) {
    super.show(args);

    this.summaryContainer.setVisible(true);
  }

  processInput(keyCode: integer) {
    const ui = this.getUi();
    const keyCodes = Phaser.Input.Keyboard.KeyCodes;

    if (keyCode === keyCodes.X) {
      ui.setMode(Mode.PARTY);
      ui.playSelect();
    }
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
    this.summaryPage.setVisible(false);
  }
}
