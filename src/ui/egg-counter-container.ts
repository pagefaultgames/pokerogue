import BattleScene from "#app/battle-scene.js";
import { addWindow } from "./ui-theme";
import { addTextObject, TextStyle } from "./text";
import { EggCountChangedEvent, EggEventType } from "#app/events/egg.js";
import EggHatchSceneHandler from "./egg-hatch-scene-handler";

/**
 * A container that displays the count of hatching eggs.
 * Extends Phaser.GameObjects.Container.
 */
export default class EggCounterContainer extends Phaser.GameObjects.Container {
  private readonly WINDOW_DEFAULT_WIDTH = 37;
  private readonly WINDOW_MEDIUM_WIDTH = 42;
  private readonly WINDOW_HEIGHT = 26;
  private readonly onEggCountChangedEvent = (event: Event) => this.onEggCountChanged(event);

  private battleScene: BattleScene;
  private eggCount: integer;
  private eggCountWindow: Phaser.GameObjects.NineSlice;
  public eggCountText: Phaser.GameObjects.Text;

  /**
   * @param {BattleScene} scene - The scene to which this container belongs.
   * @param {number} eggCount - The number of eggs to hatch.
   */
  constructor(scene: BattleScene, eggCount: integer) {
    super(scene, 0, 0);
    this.eggCount = eggCount;
    this.battleScene = scene;

    const uiHandler = this.battleScene.ui.getHandler() as EggHatchSceneHandler;

    uiHandler.eventTarget.addEventListener(EggEventType.EGG_COUNT_CHANGED, this.onEggCountChangedEvent);
    this.setup();
  }

  /**
   * Sets up the container, creating the window, egg sprite, and egg count text.
   */
  private setup(): void {
    const windowWidth = this.eggCount > 9 ? this.WINDOW_MEDIUM_WIDTH : this.WINDOW_DEFAULT_WIDTH;

    this.eggCountWindow = addWindow(this.battleScene, 5, 5, windowWidth, this.WINDOW_HEIGHT);
    this.setVisible(this.eggCount > 1);

    this.add(this.eggCountWindow);

    const eggSprite = this.battleScene.add.sprite(19, 18, "egg", "egg_0");
    eggSprite.setScale(0.32);

    this.eggCountText = addTextObject(this.battleScene, 28, 13, `${this.eggCount}`, TextStyle.MESSAGE, { fontSize: "66px" });
    this.eggCountText.setName("text-egg-count");

    this.add(eggSprite);
    this.add(this.eggCountText);
  }

  /**
   * Resets the window size to the default width and height.
   */
  private setWindowToDefaultSize(): void {
    this.eggCountWindow.setSize(this.WINDOW_DEFAULT_WIDTH, this.WINDOW_HEIGHT);
  }

  /**
   * Handles window size, the egg count to show, and whether it should be displayed.
   *
   * @param event {@linkcode Event} being sent
   * @returns void
   */
  private onEggCountChanged(event: Event): void {
    const eggCountChangedEvent = event as EggCountChangedEvent;
    if (!eggCountChangedEvent || !this.eggCountText?.data) {
      return;
    }

    const eggCount = eggCountChangedEvent.eggCount;

    if (eggCount < 10) {
      this.setWindowToDefaultSize();
    }

    if (eggCount > 0) {
      this.eggCountText.setText(eggCount.toString());
    } else {
      this.eggCountText.setVisible(false);
    }
  }
}
