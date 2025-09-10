import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import type { EggCountChangedEvent } from "#events/egg";
import { EggEventType } from "#events/egg";
import type { EggHatchSceneHandler } from "#ui/handlers/egg-hatch-scene-handler";
import { addTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";

/**
 * A container that displays the count of hatching eggs.
 * @extends Phaser.GameObjects.Container
 */
export class EggCounterContainer extends Phaser.GameObjects.Container {
  private readonly WINDOW_DEFAULT_WIDTH = 37;
  private readonly WINDOW_MEDIUM_WIDTH = 42;
  private readonly WINDOW_HEIGHT = 26;
  private readonly onEggCountChangedEvent = (event: Event) => this.onEggCountChanged(event);

  private eggCount: number;
  private eggCountWindow: Phaser.GameObjects.NineSlice;
  public eggCountText: Phaser.GameObjects.Text;

  /**
   * @param eggCount - The number of eggs to hatch.
   */
  constructor(eggCount: number) {
    super(globalScene, 0, 0);
    this.eggCount = eggCount;

    const uiHandler = globalScene.ui.getHandler() as EggHatchSceneHandler;

    uiHandler.eventTarget.addEventListener(EggEventType.EGG_COUNT_CHANGED, this.onEggCountChangedEvent);
    this.setup();
  }

  /**
   * Sets up the container, creating the window, egg sprite, and egg count text.
   */
  private setup(): void {
    const windowWidth = this.eggCount > 9 ? this.WINDOW_MEDIUM_WIDTH : this.WINDOW_DEFAULT_WIDTH;

    this.eggCountWindow = addWindow(5, 5, windowWidth, this.WINDOW_HEIGHT);
    this.setVisible(this.eggCount > 1);

    this.add(this.eggCountWindow);

    const eggSprite = globalScene.add.sprite(19, 18, "egg", "egg_0").setScale(0.32);

    this.eggCountText = addTextObject(28, 13, `${this.eggCount}`, TextStyle.MESSAGE, { fontSize: "66px" }).setName(
      "text-egg-count",
    );

    this.add([eggSprite, this.eggCountText]);
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
