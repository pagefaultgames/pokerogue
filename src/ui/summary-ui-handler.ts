import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";
import * as Utils from "../utils";

enum Page {
  PROFILE,
  MOVES
}

export default class SummaryUiHandler extends UiHandler {
  private summaryContainer: Phaser.GameObjects.Container;
  private summaryPageContainer: Phaser.GameObjects.Container;
  private summaryPageBg: Phaser.GameObjects.Sprite;
  private summaryPageTransitionContainer: Phaser.GameObjects.Container;
  private summaryPageTransitionBg: Phaser.GameObjects.Sprite;

  private transitioning: boolean;

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

    const getSummaryPageBg = () => {
      const ret = this.scene.add.sprite(0, 0, this.getPageKey(0));
      ret.setOrigin(0, 1);
      ret.setVisible(false);
      return ret;
    };

    this.summaryPageContainer = this.scene.add.container(106, 0);
    this.summaryPageContainer.add((this.summaryPageBg = getSummaryPageBg()));
    this.summaryPageTransitionContainer = this.scene.add.container(106, 0);
    this.summaryPageTransitionContainer.add((this.summaryPageTransitionBg = getSummaryPageBg()));
  }

  getPageKey(page?: integer) {
    if (page === undefined)
      page = this.cursor;
    return `summary_${Page[page].toLowerCase()}`;
  }

  show(args: any[]) {
    super.show(args);

    this.summaryContainer.setVisible(true);
    this.cursor = -1;
    this.setCursor(args.length ? args[0] as Page : 0);
  }

  processInput(keyCode: integer) {
    if (this.transitioning)
      return;

    const ui = this.getUi();
    const keyCodes = Phaser.Input.Keyboard.KeyCodes;

    let success = false;

    if (keyCode === keyCodes.X) {
      ui.setMode(Mode.PARTY);
      success = true;
    } else {
      const pages = Utils.getEnumValues(Page);
      switch (keyCode) {
        case keyCodes.LEFT:
          if (this.cursor)
            success = this.setCursor(this.cursor - 1);
          break;
        case keyCodes.RIGHT:
          if (this.cursor < pages.length - 1)
            success = this.setCursor(this.cursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();
  }

  setCursor(cursor: integer): boolean {
    const changed = this.cursor !== cursor;
    if (changed) {
      const forward = this.cursor < cursor;
      this.cursor = cursor;

      if (this.summaryPageContainer.visible) {
        this.transitioning = true;
        this.populatePageContainer(this.summaryPageTransitionContainer, forward ? cursor : cursor + 1);
        if (forward)
          this.summaryPageTransitionContainer.x += 214;
        else
          this.populatePageContainer(this.summaryPageContainer);
        this.scene.tweens.add({
          targets: this.summaryPageTransitionContainer,
          x: forward ? '-=214' : '+=214',
          duration: 250,
          onComplete: () => {
            if (forward)
              this.populatePageContainer(this.summaryPageContainer);
            else
              this.summaryPageTransitionContainer.x -= 214;
            this.summaryPageTransitionContainer.setVisible(false);
            this.transitioning = false;
          }
        });
        this.summaryPageTransitionContainer.setVisible(true);
      } else {
        this.populatePageContainer(this.summaryPageContainer);
        this.summaryPageContainer.setVisible(true);
      }
    }

    return changed;
  }

  populatePageContainer(pageContainer: Phaser.GameObjects.Container, page?: Page) {
    if (page === undefined)
      page = this.cursor;

    if (pageContainer.getAll().length > 1)
      pageContainer.removeBetween(1, undefined, true);
    (pageContainer.getAt(0) as Phaser.GameObjects.Sprite).setTexture(this.getPageKey(page));
    
    switch (page) {
      case Page.MOVES:
        break;
    }
  }

  clear() {
    super.clear();
    this.cursor = -1;
    this.summaryContainer.setVisible(false);
    this.summaryPageContainer.setVisible(false);
  }
}
