import BattleScene from "#app/battle-scene";
import { MessagePhase } from "./message-phase";
import * as LoggerTools from "../logger";

export class TestMessagePhase extends MessagePhase {
  constructor(scene: BattleScene, message: string) {
    super(scene, message, null, true);
  }
}
