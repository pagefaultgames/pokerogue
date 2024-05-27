/* eslint-disable */
import fs from "fs";
import Clock = Phaser.Time.Clock;
import game from "../phaser.setup";
import TweenManager = Phaser.Tweens.TweenManager;
import InputManager = Phaser.Input.InputManager;
import KeyboardManager = Phaser.Input.Keyboard.KeyboardManager;
import KeyboardPlugin = Phaser.Input.Keyboard.KeyboardPlugin;
import GamepadPlugin = Phaser.Input.Gamepad.GamepadPlugin;
import EventEmitter = Phaser.Events.EventEmitter;
import LoaderPlugin = Phaser.Loader.LoaderPlugin;
import CanvasRenderer = Phaser.Renderer.Canvas.CanvasRenderer;
import CacheManager = Phaser.Cache.CacheManager;
import UpdateList = Phaser.GameObjects.UpdateList;
import ScaleManager = Phaser.Scale.ScaleManager;
import MockGraphics from "#app/test/essentials/mocksContainer/mockGraphics";
import MockTextureManager from "#app/test/essentials/mocksContainer/mockTextureManager";
import Phaser from "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import {setPositionRelative} from "#app/test/essentials/utils";
import NoAudioSound = Phaser.Sound.NoAudioSound;

// Phaser.GameObjects.Image.prototype.setPositionRelative = (key) => ({});
// // Phaser.GameObjects.Image.prototype.frame = {realHeight: 1};
// Phaser.GameObjects.Image.prototype.frame = new GameObjectFactory(_scene).frame;
// Phaser.GameObjects.Image.prototype.setTexture = (key) => ({});
// Phaser.GameObjects.Image.prototype.setSizeToFrame = () => null;
//
// Phaser.GameObjects.Text.prototype.setPositionRelative = (key) => ({});
// Phaser.GameObjects.Text.prototype.frame = new Frame({source: {width: 1, height: 1}} as Texture, 0, 0, 0, 0, 0, 0);
// Phaser.GameObjects.Text.prototype.setTexture = (key) => ({});
// Phaser.GameObjects.Text.prototype.setSizeToFrame = () => null;
//
// Phaser.GameObjects.Sprite.prototype.setTexture = (key) => ({});
// Phaser.GameObjects.Sprite.prototype.texture = { frameTotal: 1, get: () => null };
// Phaser.GameObjects.Sprite.prototype.setSizeToFrame = () => null;
//
// Phaser.GameObjects.NineSlice.prototype.setTexture = () => ({});
// Phaser.GameObjects.NineSlice.prototype.setSizeToFrame = () => null;
// Phaser.GameObjects.NineSlice.prototype.frame = {};
//
// Phaser.GameObjects.GameObject.prototype.setInteractive = () => null;
// Phaser.Textures.TextureManager.prototype.getFrame = () => ({});

Phaser.GameObjects.Container.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Sprite.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Image.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.NineSlice.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Text.prototype.setPositionRelative = setPositionRelative;
BBCodeText.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Rectangle.prototype.setPositionRelative = setPositionRelative;

export default class GameWrapper {
  private scenes: Map<string, Phaser.Scene> = new Map();
  private gameObj = game;
  public scene: {
    add: (_key: string, scene: Phaser.Scene) => void
  };

  constructor() {
    this.gameObj.renderer = new CanvasRenderer(this.gameObj);
    this.gameObj.renderer.maxTextures = -1;
    this.gameObj.manager = new InputManager(this.gameObj, {});
    this.gameObj.pluginEvents = new EventEmitter();


    window.matchMedia = () => ({
      matches: false,
    });
    this.scene = {
      add: this.addScene.bind(this),
    };
    this.config = {
      seed: ["test"],
    };
  }

  private addScene(key: string, _scene: any): void {

    _scene.game = this.gameObj;
    _scene.scene = _scene;
    _scene.sys.game = this.gameObj;
    _scene.sys.settings.loader = {
      key: key,
    }
    _scene.sound = {
      play: () => null,
      get: (key) => new NoAudioSound(undefined, key),
      getAllPlaying: () => [],
    };
    _scene.tweens = {
      add: (data) => {
        if (data.onComplete) {
          data.onComplete();
        }
      },
      chain: () => null,
      addCounter: (data) => {
        if (data.onComplete) {
          data.onComplete();
        }
      },
    }
    _scene.system = _scene.sys;
    _scene.systems = _scene.sys;
    _scene.renderer = this.gameObj.renderer;
    _scene.anims = this.gameObj.anims;
    _scene.sys.anims = this.gameObj.anims;
    _scene.sys.queueDepthSort = () => null;
    _scene.cache = this.gameObj.cache;
    _scene.plugins = this.gameObj.plugins;
    _scene.registry = this.gameObj.registry;
    _scene.scale = this.gameObj.scale;
    _scene.textures = this.gameObj.textures;
    _scene.sys.textures = this.gameObj.textures;
    _scene.events = this.gameObj.events;
    _scene.sys.events = new EventEmitter()
    _scene.sys.updateList = new UpdateList(_scene);
    _scene.manager = this.gameObj.manager;
    _scene.pluginEvents = this.gameObj.pluginEvents;
    _scene.input = this.gameObj.input;
    _scene.sys.input = this.gameObj.input;
    _scene.manager.keyboard = new KeyboardManager(_scene);
    _scene.pluginEvents = new EventEmitter();
    _scene.input.keyboard = new KeyboardPlugin(_scene);
    _scene.input.gamepad = new GamepadPlugin(_scene);
    _scene.load = new LoaderPlugin(_scene);
    _scene.load.cacheManager = new CacheManager(_scene);
    _scene.sys.cache = _scene.load.cacheManager;
    _scene.sys.scale = new ScaleManager(_scene);
    _scene.load.video = () => null;
    _scene.spritePipeline = {};
    _scene.fieldSpritePipeline = {};
    const mockTextureManager = new MockTextureManager(_scene);
    _scene.add = mockTextureManager.add;
    _scene.systems.displayList = _scene.add.displayList

    _scene.cachedFetch = (url, init) => {
      return new Promise((resolve) => {
        const newUrl = prependPath(url);
        const raw = fs.readFileSync(newUrl, {encoding: "utf8", flag: "r"});
        const data = JSON.parse(raw);
        const response = createFetchResponse(data);
        return resolve(response);
      });
    };
    _scene.make = {
      graphics: (config) => new MockGraphics(_scene, config),
      rexTransitionImagePack: () => ({
        transit: () => null,
      }),
    };
    _scene.time = {
      addEvent: (evt) => {
        const delay = 1;
        setInterval(() => {
          if (evt.callback) {
            evt.callback();
          }
        }, delay);
        return {
          repeatCount: 0,
          remove: () => null,
        };
      },
      delayedCall: (time, fn) => fn(),
    };

    // const a = this.gameObj;
    this.scenes[key] = _scene;
    _scene.preload && _scene.preload();
    _scene.create();
  }
}

function prependPath(originalPath) {
  const prefix = "public";
  if (originalPath.startsWith("./")) {
    return originalPath.replace("./", `${prefix}/`);
  }
  return originalPath;
}
// Simulate fetch response
function createFetchResponse(data) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}