/* eslint-disable */
import fs from "fs";
import InputManager = Phaser.Input.InputManager;
import KeyboardManager = Phaser.Input.Keyboard.KeyboardManager;
import KeyboardPlugin = Phaser.Input.Keyboard.KeyboardPlugin;
import GamepadPlugin = Phaser.Input.Gamepad.GamepadPlugin;
import EventEmitter = Phaser.Events.EventEmitter;
import UpdateList = Phaser.GameObjects.UpdateList;
import MockGraphics from "#app/test/essentials/mocks/mocksContainer/mockGraphics";
import MockTextureManager from "#app/test/essentials/mocks/mockTextureManager";
import Phaser from "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import {blobToString, setPositionRelative} from "#app/test/essentials/utils";
import {vi} from "vitest";
import mockLocalStorage from "#app/test/essentials/mocks/mockLocalStorage";
import mockConsoleLog from "#app/test/essentials/mocks/mockConsoleLog";
import MockLoader from "#app/test/essentials/mocks/mockLoader";
import {MockFetch} from "#app/test/essentials/mocks/mockFetch";
import * as Utils from "#app/utils";
import InputText from "phaser3-rex-plugins/plugins/inputtext";
import {MockClock} from "#app/test/essentials/mocks/mockClock";
import BattleScene from "#app/battle-scene.js";
import {AnimConfig, BattleAnim, MoveAnim} from "#app/data/battle-anims";
import Pokemon from "#app/field/pokemon";

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage(),
});
Object.defineProperty(window, "console", {
  value: mockConsoleLog(false),
});

Phaser.GameObjects.Container.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Sprite.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Image.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.NineSlice.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Text.prototype.setPositionRelative = setPositionRelative;
BBCodeText.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Rectangle.prototype.setPositionRelative = setPositionRelative;
InputText.prototype.setElement = () => null;
InputText.prototype.resize = () => null;
window.URL.createObjectURL = (blob: Blob) => {
  blobToString(blob).then((data: string) => {
    localStorage.setItem("toExport", data);
  })
  return null;
};
navigator.getGamepads = vi.fn().mockReturnValue([]);
global.fetch = vi.fn(MockFetch);
Utils.setCookie(Utils.sessionIdKey, 'fake_token');


window.matchMedia = () => ({
  matches: false,
});

export default class GameWrapper {
  public scene: BattleScene;
  public game: Phaser.Game;

  constructor() {
    this.game = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    MoveAnim.prototype.getAnim = () => ({
      frames: {},
    });
    Pokemon.prototype.enableMask = () => null;
    localStorage.clear();
  }

  setScene(scene: BattleScene) {
    this.scene = scene;
    this.injectMandatory();
    this.scene.preload && this.scene.preload();
    this.scene.create();
  }

  injectMandatory() {
    this.game.config = {
      seed: ["test"],
    }
    this.scene.game = this.game;
    this.game.renderer = {
      maxTextures: -1,
      gl: {},
      deleteTexture: () => null,
      canvasToTexture: () => ({}),
      createCanvasTexture: () => ({}),
      pipelines: {
        add: () => null,
      },
    };
    this.scene.renderer = this.game.renderer;
    this.scene.children = {
      removeAll: () => null,
    };

    this.scene.sound = {
      play: () => null,
      pause: () => null,
      setRate: () => null,
      add: () => this.scene.sound,
      get: () => this.scene.sound,
      getAllPlaying: () => [],
      manager: {
        game: this.game,
      },
      setVolume: () => null,
      on: (evt, callback) => callback(),
      key: "",
    };

    this.scene.tweens = {
      add: (data) => {
        if (data.onComplete) {
          data.onComplete();
        }
      },
      getTweensOf: () => ([]),
      killTweensOf: () => ([]),
      chain: () => null,
      addCounter: (data) => {
        if (data.onComplete) {
          data.onComplete();
        }
      },
    };

    this.scene.anims = this.game.anims;
    this.scene.cache = this.game.cache;
    this.scene.plugins = this.game.plugins;
    this.scene.registry = this.game.registry;
    this.scene.scale = this.game.scale;
    this.scene.textures = this.game.textures;
    this.scene.events = this.game.events;
    this.scene.manager = new InputManager(this.game, {});
    this.scene.manager.keyboard = new KeyboardManager(this.scene);
    this.scene.pluginEvents = new EventEmitter();
    this.scene.domContainer = {} as HTMLDivElement;
    this.scene.spritePipeline = {};
    this.scene.fieldSpritePipeline = {};
    this.scene.load = new MockLoader(this.scene);
    this.scene.sys = {
      queueDepthSort: () => null,
      anims: this.game.anims,
      game: this.game,
      textures: {
        addCanvas: () => ({
          get: () => ({ // this.frame in Text.js
            source: {},
            setSize: () => null,
            glTexture: () => ({
              spectorMetadata: {},
            }),
          }),
        })
      },
      cache: this.scene.load.cacheManager,
      scale: this.game.scale,
      // _scene.sys.scale = new ScaleManager(_scene);
      // events: {
      //   on: () => null,
      // },
      events: new EventEmitter(),
      settings: {
        loader: {
          key: 'battle',
        }
      },
      input: this.game.input,
    };
    const mockTextureManager = new MockTextureManager(this.scene);
    this.scene.add = mockTextureManager.add;
    this.scene.sys.displayList =  this.scene.add.displayList;
    this.scene.sys.updateList = new UpdateList(this.scene);
    this.scene.systems = this.scene.sys;
    this.scene.input = this.game.input;
    this.scene.scene = this.scene;
    this.scene.input.keyboard = new KeyboardPlugin(this.scene);
    this.scene.input.gamepad = new GamepadPlugin(this.scene);
    this.scene.cachedFetch = (url, init) => {
      return new Promise((resolve) => {
        // need to remove that if later we want to test battle-anims
        const newUrl = url.includes('./battle-anims/') ? prependPath('./battle-anims/tackle.json') : prependPath(url);
        let raw;
        try {
          raw = fs.readFileSync(newUrl, {encoding: "utf8", flag: "r"});
        } catch(e) {
          return resolve(createFetchBadResponse({}));
        }
        const data = JSON.parse(raw);
        const response = createFetchResponse(data);
        return resolve(response);
      });
    };
    this.scene.make = {
      graphics: (config) => new MockGraphics(mockTextureManager, config),
      rexTransitionImagePack: () => ({
        transit: () => null,
      }),
    };
    this.scene.time = new MockClock(this.scene);
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
// Simulate fetch response
function createFetchBadResponse(data) {
  return {
    ok: false,
    status: 404,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}