import Phaser from "phaser";

const CacheManager = Phaser.Cache.CacheManager;

export class MockLoader {
  public cacheManager;
  constructor(scene) {
    this.cacheManager = new CacheManager(scene);
  }

  once(_event, callback) {
    callback();
  }

  setBaseURL(_url) {
    return null;
  }

  video() {
    return null;
  }

  spritesheet(_key, _url, _frameConfig) {}

  audio(_key, _url) {}

  isLoading() {
    return false;
  }

  start() {}

  image() {}

  atlas(_key, _textureUrl, _atlasUrl) {}
}
