export default class TextInterceptor {
  private scene;
  private logs = [];
  constructor(scene) {
    this.scene = scene;
    scene.messageWrapper = this;
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer): void {
    this.logs.push(text);
  }

  getLatestMessage(): string {
    return this.logs.pop();
  }
}
