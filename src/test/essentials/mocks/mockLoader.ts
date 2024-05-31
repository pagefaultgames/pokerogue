import CacheManager = Phaser.Cache.CacheManager;


export default class MockLoader {
  public cacheManager;
  constructor(scene) {
    this.cacheManager = new CacheManager(scene);
  }

  once(event, callback) {
    callback();
  }

  setBaseURL(url) {
    return null;
  }

  video() {
    return null;
  }

  spritesheet(key, url, frameConfig) {
  }

  audio(key, url) {

  }

  isLoading() {
    return false;
  }

  start() {
  }

  image() {

  }

  atlas(key, textureUrl, atlasUrl) {
  }
}
