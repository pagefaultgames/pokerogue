import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { Phase } from "#app/phase";
import type { MessagePhaseOptions } from "#types/ui-types";

export class MessagePhase extends Phase {
  public readonly phaseName = "MessagePhase";

  private text: string;

  // biome-ignore-start lint/correctness/noUnusedPrivateClassMembers: bug in lint rule (doesn't recognize object destructuring)
  private readonly callbackDelay?: number | undefined;
  private readonly prompt?: boolean | undefined;
  private readonly promptDelay: number;
  private readonly speaker?: string | undefined;
  // biome-ignore-end lint/correctness/noUnusedPrivateClassMembers: bug in lint rule (doesn't recognize object destructuring)

  constructor(text: string, { callbackDelay, prompt, promptDelay = 0, speaker }: MessagePhaseOptions = {}) {
    super();

    this.text = text;
    this.callbackDelay = callbackDelay;
    this.prompt = prompt;
    this.promptDelay = promptDelay;
    this.speaker = speaker;

    if (settings.general.manualMessageClear) {
      this.prompt = true;
    }
  }

  public override start(): void {
    super.start();

    const { phaseManager, ui } = globalScene;
    const { callbackDelay, prompt, promptDelay, speaker } = this;

    if (this.text.includes("$")) {
      const pokename: string[] = [];
      const repname = ["#POKEMON1", "#POKEMON2"];

      for (let p = 0; p < globalScene.getPlayerField().length; p++) {
        pokename.push(globalScene.getPlayerField()[p].getNameToRender());
        this.text = this.text.split(pokename[p]).join(repname[p]);
      }

      const pageIndex = this.text.indexOf("$");
      if (pageIndex === -1) {
        for (let p = 0; p < globalScene.getPlayerField().length; p++) {
          this.text = this.text.split(repname[p]).join(pokename[p]);
        }
      } else {
        let page0 = this.text.slice(0, pageIndex);
        let page1 = this.text.slice(pageIndex + 1);
        // Pokemon names must be re-inserted _after_ the split, otherwise the index will be wrong
        for (let p = 0; p < globalScene.getPlayerField().length; p++) {
          page0 = page0.split(repname[p]).join(pokename[p]);
          page1 = page1.split(repname[p]).join(pokename[p]);
        }
        phaseManager.unshiftNew("MessagePhase", page1, { callbackDelay, prompt, promptDelay, speaker });
        this.text = page0.trim();
      }
    }

    const cbDelay = callbackDelay ?? (prompt ? 0 : 1500);
    if (speaker) {
      ui.showDialogue(this.text, speaker, () => this.end(), { callbackDelay: cbDelay, promptDelay });
    } else {
      ui.showText(this.text, { callback: () => this.end(), callbackDelay: cbDelay, prompt, promptDelay });
    }
  }
}
