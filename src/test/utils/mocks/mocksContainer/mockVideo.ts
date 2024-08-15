import MockContainer from "#test/utils/mocks/mocksContainer/mockContainer";

export default class MockVideo extends MockContainer {
  private video: HTMLVideoElement | null;
  private videoTexture: Phaser.Textures.Texture | null;
  private videoTextureSource: Phaser.Textures.TextureSource | null;

  constructor(textureManager, x: number, y: number, key?: string) {
    super(textureManager, x, y);
    this.video = null;
    this.videoTexture = null;
    this.videoTextureSource = null;
  }

  stop(): this {
    return this;
  }

  play(): this {
    return this;
  }

  setLoop(value?: boolean): this {
    return this;
  }
}
