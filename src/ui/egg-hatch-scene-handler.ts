import BattleScene from "../battle-scene";
import { EggHatchPhase } from "../egg-hatch-phase";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import {Button} from "../enums/buttons";

export default class EggHatchSceneHandler extends UiHandler {
  public eggHatchContainer: Phaser.GameObjects.Container;

  /**
   * Allows subscribers to listen for events
   *
   * Current Events:
   * - {@linkcode EggEventType.EGG_COUNT_CHANGED} {@linkcode EggCountChangedEvent}
   */
  public readonly eventTarget: EventTarget = new EventTarget();

  constructor(scene: BattleScene) {
    super(scene, Mode.EGG_HATCH_SCENE);
  }

  setup() {
    this.eggHatchContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
    this.scene.fieldUI.add(this.eggHatchContainer);

    const eggLightraysAnimFrames = this.scene.anims.generateFrameNames("egg_lightrays", { start: 0, end: 3 });
    if (!(this.scene.anims.exists("egg_lightrays"))) {
      this.scene.anims.create({
        key: "egg_lightrays",
        frames: eggLightraysAnimFrames,
        frameRate: 32
      });
    }
  }

  show(_args: any[]): boolean {
    super.show(_args);

    this.getUi().showText(null, 0);

    this.scene.setModifiersVisible(false);

    return true;
  }

  processInput(button: Button): boolean {
    if (button === Button.ACTION || button === Button.CANCEL) {
      const phase = this.scene.getCurrentPhase();
      if (phase instanceof EggHatchPhase && phase.trySkip()) {
        return true;
      }
    }

    return this.scene.ui.getMessageHandler().processInput(button);
  }

  setCursor(_cursor: integer): boolean {
    return false;
  }

  clear() {
    super.clear();
    this.eggHatchContainer.removeAll(true);
    this.getUi().hideTooltip();
  }
}
