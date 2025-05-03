import type { MockGameObject } from "./mock-game-object";

/** Mocks video-related stuff */
export class MockVideoGameObject implements MockGameObject {
  public name: string;

  public play = () => null;
  public stop = () => this;
  public setOrigin = () => null;
  public setScale = () => null;
  public setVisible = () => null;
  public setLoop = () => null;
}
