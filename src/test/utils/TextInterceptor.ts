export default class TextInterceptor {
  private scene;
  public logs = [];
  constructor(scene) {
    this.scene = scene;
    scene.messageWrapper = this;
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer): void {
    console.log(text);
    this.logs.push(text);
  }

  getLatestMessage(): string {
    return this.logs.pop();
  }
}
