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
import MockRectangle from "#app/test/essentials/mocksContainer/mockRectangle";
import MockNineslice from "#app/test/essentials/mocksContainer/mockNineslice";

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
    let text = "";
    const addMethods = {
      setPipeline: () => null,
      setScale: () => null,
      setShadow: () => null,
      setLineSpacing: () => null,
      setOrigin: () => null,
      setDepth: () => null,
      setAlpha: () => null,
      setInteractive: () => null,
      setFillStyle: () => null,
      setVisible: () => null,
      setStrokeStyle: null,
      removeFromDisplayList: () => null,
      addedToScene: () => null,
      setSize: () => null,
      once: () => null,
      apply: () => null,
      setY: () => null,
      setX: () => null,
      add: () => null,
      setText: (value) => text = value,
      setPosition: () => null,
      setTexture: () => null,
      setTintFill: () => null,
      clearTint: () => null,
      stop: () => null,
      fillStyle: () => null,
      beginPath: () => null,
      fillRect: () => null,
      createGeometryMask: () => null,
      setMask: () => null,
      setPositionRelative: () => null,
      totalDuration: () => null,
      on: () => null,
      off: () => null,
      sendToBack: () => null,
      moveAbove: () => null,
      getAll: () => [],
      setAngle: () => null,
      setTint: () => null,
      setShadowOffset: () => null,
      setFrame: () => null,
      setWordWrapWidth: () => null,
      setFontSize: () => null,
      play: () => null,
      setColor: () => null,
      setCrop: () => null,
      setShadowColor: () => null,
      removeAll: () => null,
      disableInteractive: () => null,
      getIndex: () => -1,
      destroy: () => null,
      addAt: () => null,
      getBounds: () => ({ width: 0, height: 0 }),
      getAt: null,
      runWordWrap: () => (""),
      pipelineData: {},
      texture: {
        key: {
          replace: () => null,
        }
      },
      frame: {},
      repeatCount: {},
      displayWidth: text.length * 3,
      displayHeight: text.length * 3,

    };
    const { setStrokeStyle, ...methodsWithoutSetStrokeStyle } = addMethods;
    const { getAt, ...methodsWithoutGetAt } = addMethods;
    addMethods.setStrokeStyle = () => ({ ...methodsWithoutSetStrokeStyle });
    addMethods.getAt = () => ({ ...methodsWithoutGetAt });

    _scene.add = {
      container: () => ({...addMethods}),
      sprite: {
        apply: () => ({...addMethods}),
      },
      existing: () => null,
      rectangle: (x, y, width, height, fillColor) => new MockRectangle(_scene, x, y, width, height, fillColor),
      nineslice: (x, y, texture, frame, width, height, leftWidth, rightWidth, topHeight, bottomHeight) => new MockNineslice(_scene, x, y, texture, frame, width, height, leftWidth, rightWidth, topHeight, bottomHeight),
      image: () => ({...addMethods}),
      text: () => ({...addMethods}),
      polygon: () => ({...addMethods}),
    };

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
      graphics: () => ({...addMethods}),
      rexTransitionImagePack: () => ({
        transit: () => null,
      }),
    };

    _scene.game = this.gameObj;
    _scene.scene = _scene;
    _scene.sys.game = this.gameObj;
    _scene.sys.settings.loader = {
      key: key,
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
    _scene.sound = this.gameObj.sound;
    _scene.textures = this.gameObj.textures;
    _scene.sys.textures = this.gameObj.textures;
    _scene.events = this.gameObj.events;
    _scene.sys.events = this.gameObj.events;
    _scene.sys.updateList = new UpdateList(_scene);
    _scene.tweens = new TweenManager(_scene);
    _scene.manager = this.gameObj.manager;
    _scene.pluginEvents = this.gameObj.pluginEvents;
    _scene.input = this.gameObj.input;
    _scene.manager.keyboard = new KeyboardManager(_scene);
    _scene.pluginEvents = new EventEmitter();
    _scene.input.keyboard = new KeyboardPlugin(_scene);
    _scene.input.gamepad = new GamepadPlugin(_scene);
    _scene.time = new Clock(_scene);
    _scene.systems.displayList = _scene.add.displayList
    _scene.load = new LoaderPlugin(_scene);
    _scene.load.cacheManager = new CacheManager(_scene);
    _scene.sys.cache = _scene.load.cacheManager;
    _scene.sys.scale = new ScaleManager(_scene);
    _scene.load.video = () => null;
    _scene.spritePipeline = {};
    _scene.fieldSpritePipeline = {};

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