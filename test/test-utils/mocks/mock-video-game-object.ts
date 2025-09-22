import type { MockGameObject } from "#test/test-utils/mocks/mock-game-object";

/** Mocks video-related stuff */
export class MockVideoGameObject implements MockGameObject {
  public name: string;
  public active = true;

  public play = () => this;
  public stop = () => this;
  public setOrigin = () => this;
  public setScale = () => this;
  public setVisible = () => this;
  public setLoop = () => this;
  public setName = (name: string) => {
    this.name = name;
    return this;
  };
  public setActive = (active: boolean) => {
    this.active = active;
    return this;
  };
}
