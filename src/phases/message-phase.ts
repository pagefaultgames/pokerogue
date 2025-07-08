import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";

export class MessagePhase extends Phase {
  public readonly phaseName = "MessagePhase";
  private text: string;
  private callbackDelay?: number | null;
  private prompt?: boolean | null;
  private promptDelay?: number | null;
  private speaker?: string;

  constructor(
    text: string,
    callbackDelay?: number | null,
    prompt?: boolean | null,
    promptDelay?: number | null,
    speaker?: string,
  ) {
    super();

    this.text = text;
    this.callbackDelay = callbackDelay;
    this.prompt = prompt;
    this.promptDelay = promptDelay;
    this.speaker = speaker;
  }

  start() {
    super.start();

    if (this.text.indexOf("$") > -1) {
      const pokename: string[] = [];
      const repname = ["#POKEMON1", "#POKEMON2"];
      for (let p = 0; p < globalScene.getPlayerField().length; p++) {
        pokename.push(globalScene.getPlayerField()[p].getNameToRender());
        this.text = this.text.split(pokename[p]).join(repname[p]);
      }
      const pageIndex = this.text.indexOf("$");
      if (pageIndex !== -1) {
        let page0 = this.text.slice(0, pageIndex);
        let page1 = this.text.slice(pageIndex + 1);
        // Pokemon names must be re-inserted _after_ the split, otherwise the index will be wrong
        for (let p = 0; p < globalScene.getPlayerField().length; p++) {
          page0 = page0.split(repname[p]).join(pokename[p]);
          page1 = page1.split(repname[p]).join(pokename[p]);
        }
        globalScene.phaseManager.unshiftNew(
          "MessagePhase",
          page1,
          this.callbackDelay,
          this.prompt,
          this.promptDelay,
          this.speaker,
        );
        this.text = page0.trim();
      } else {
        for (let p = 0; p < globalScene.getPlayerField().length; p++) {
          this.text = this.text.split(repname[p]).join(pokename[p]);
        }
      }
    }

    if (this.speaker) {
      globalScene.ui.showDialogue(
        this.text,
        this.speaker,
        null,
        () => this.end(),
        this.callbackDelay || (this.prompt ? 0 : 1500),
        this.promptDelay ?? 0,
      );
    } else {
      globalScene.ui.showText(
        this.text,
        null,
        () => this.end(),
        this.callbackDelay || (this.prompt ? 0 : 1500),
        this.prompt,
        this.promptDelay,
      );
    }
  }
}
