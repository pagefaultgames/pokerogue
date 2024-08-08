export default class TextInterceptor {
  private scene;
  public logs: string[] = [];
  constructor(scene) {
    this.scene = scene;
    scene.messageWrapper = this;
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer): void {
    console.log(text);
    this.logs.push(text);
  }

  showDialogue(text: string, name: string, delay?: integer, callback?: Function, callbackDelay?: integer, promptDelay?: integer): void {
    console.log(name, text);
    this.logs.push(name, text);
  }

  getLatestMessage(): string {
    return this.logs.pop() ?? "";
  }
}
