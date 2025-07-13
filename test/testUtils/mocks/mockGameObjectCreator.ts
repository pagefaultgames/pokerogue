import { MockGraphics } from "#test/testUtils/mocks/mocksContainer/mockGraphics";
import type { MockTextureManager } from "#test/testUtils/mocks/mockTextureManager";

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
      transit: () => null,
      once: () => null,
    };
  }
}
