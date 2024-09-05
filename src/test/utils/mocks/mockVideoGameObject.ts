import { vi } from "vitest";
import { MockGameObject } from "./mockGameObject";

/** Mocks video-related stuff */
export class MockVideoGameObject implements MockGameObject {
  public name: string;

  constructor() {}

  public play = vi.fn();
  public stop = vi.fn(() => this);
  public setOrigin = vi.fn();
  public setScale = vi.fn();
  public setVisible = vi.fn();
  public setLoop = vi.fn(() => this);
}
