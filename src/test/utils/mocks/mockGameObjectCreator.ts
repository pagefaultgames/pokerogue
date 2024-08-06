import { vi } from "vitest";
import MockGraphics from "./mocksContainer/mockGraphics";
import MockTextureManager from "./mockTextureManager";

export class MockGameObjectCreator {
  private readonly textureManager: MockTextureManager;

  constructor(textureManager: MockTextureManager) {
    console.log("Mocking Phaser.GameObjects.GameObjectCreator;");
    this.textureManager = textureManager;
  }

  graphics(config: any) {
    return new MockGraphics(this.textureManager, config);
  }

  rexTransitionImagePack() {
    return {
      transit: vi.fn(),
      once: vi.fn(),
    };
  }
}
