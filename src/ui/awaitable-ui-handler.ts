import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";

export default abstract class AwaitableUiHandler extends UiHandler {
  protected awaitingActionInput: boolean;
  protected onActionInput: Function;

  constructor(scene: BattleScene, mode: Mode) {
    super(scene, mode);
  }
}