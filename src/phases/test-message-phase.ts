import { MessagePhase } from "./message-phase";

export class TestMessagePhase extends MessagePhase {
  constructor(message: string) {
    super(message, null, true);
  }
}
