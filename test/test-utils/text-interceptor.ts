import type { BattleScene } from "#app/battle-scene";
import chalk from "chalk";

/**
 * The {@linkcode TextInterceptor} is a wrapper class that intercepts and logs any messages
 * that would be displayed on-screen.
 */
export class TextInterceptor {
  /** A log containing messages having been displayed on screen, sorted in FIFO order. */
  public readonly logs: string[] = [];

  constructor(scene: BattleScene) {
    // @ts-expect-error: Find another more sanitary way of doing this
    scene.messageWrapper = this;
  }

  /** Clear the current content of the TextInterceptor. */
  public clearLogs(): void {
    this.logs.splice(0);
  }

  showText(text: string): void {
    // NB: We do not format the raw _logs_ themselves as tests will be actively checking it.
    console.log(this.formatText(text));
    this.logs.push(text);
  }

  showDialogue(text: string, name: string): void {
    console.log(`${name}: \n${this.formatText(text)}`);
    this.logs.push(name, text);
  }

  /**
   * Format text to be displayed to the test console, as follows:
   * 1. Replaces new lines and new text boxes (marked by `$`) with indented new lines.
   * 2. Removes all `@c{}`, `@d{}`, `@s{}`, and `@f{}` flags from the text.
   * 3. Makes text blue
   * @param text - The unformatted text
   * @returns The formatted text
   */
  private formatText(text: string): string {
    return chalk.blue(
      text
        .replace(/\n/g, " ")
        .replace(/\$/g, "\n  ")
        .replace(/@\w{.*?}/g, ""),
    );
  }
}
