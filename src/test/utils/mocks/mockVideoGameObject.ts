import { MockGameObject } from "./mockGameObject";

/** Mocks video-related stuff */
export class MockVideoGameObject implements MockGameObject {
  constructor() {}

  public play = () => null;
  public stop = () => this;
  public setOrigin = () => null;
  public setScale = () => null;
  public setVisible = () => null;
}
