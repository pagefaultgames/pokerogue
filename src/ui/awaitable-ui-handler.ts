import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import {Button} from "#enums/buttons";

export default abstract class AwaitableUiHandler extends UiHandler {
  protected awaitingActionInput: boolean;
  protected onActionInput: Function;
  public tutorialActive: boolean = false;

  constructor(scene: BattleScene, mode: Mode) {
    super(scene, mode);
  }

  processTutorialInput(button: Button): boolean {
    if ((button === Button.ACTION || button === Button.CANCEL) && this.onActionInput) {
      this.getUi().playSelect();
      const originalOnActionInput = this.onActionInput;
      this.onActionInput = null;
      originalOnActionInput();
      this.awaitingActionInput = false;
      return true;
    }

    return false;
  }
}
