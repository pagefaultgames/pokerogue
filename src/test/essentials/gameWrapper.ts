/* eslint-disable */
import fs from "fs";
import game from "../phaser.setup";
import InputManager = Phaser.Input.InputManager;
import KeyboardManager = Phaser.Input.Keyboard.KeyboardManager;
import KeyboardPlugin = Phaser.Input.Keyboard.KeyboardPlugin;
import GamepadPlugin = Phaser.Input.Gamepad.GamepadPlugin;
import EventEmitter = Phaser.Events.EventEmitter;
import CanvasRenderer = Phaser.Renderer.Canvas.CanvasRenderer;
import UpdateList = Phaser.GameObjects.UpdateList;
import ScaleManager = Phaser.Scale.ScaleManager;
import MockGraphics from "#app/test/essentials/mocks/mocksContainer/mockGraphics";
import MockTextureManager from "#app/test/essentials/mocks/mockTextureManager";
import Phaser from "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import {blobToString, generateStarter, setPositionRelative, waitUntil} from "#app/test/essentials/utils";
import {expect, vi} from "vitest";
import mockLocalStorage from "#app/test/essentials/mocks/mockLocalStorage";
import mockConsoleLog from "#app/test/essentials/mocks/mockConsoleLog";
import MockLoader from "#app/test/essentials/mocks/mockLoader";
import {MockFetch} from "#app/test/essentials/mocks/mockFetch";
import * as Utils from "#app/utils";
import {Mode} from "#app/ui/ui";
import {CheckSwitchPhase, CommandPhase, EncounterPhase, SelectStarterPhase} from "#app/phases";
import ConfirmUiHandler from "#app/ui/confirm-ui-handler";
import {Button} from "#app/enums/buttons";
import InputText from "phaser3-rex-plugins/plugins/inputtext";
import {MockClock} from "#app/test/essentials/mocks/mockClock";
import {Command} from "#app/ui/command-ui-handler";
import {GameDataType} from "#app/system/game-data";
import TargetSelectUiHandler from "#app/ui/target-select-ui-handler";
import BattleScene from "#app/battle-scene.js";
import WebGLRenderer = Phaser.Renderer.WebGL.WebGLRenderer;

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
  public scenes: Map<string, Phaser.Scene> = new Map();
  private gameObj = game;
  public scene: {
    add: (_key: string, scene: Phaser.Scene) => void
  };

  constructor() {
    localStorage.clear();
  }

  setScene(scene: BattleScene) {
    this.scene = scene;
    this.injectMandatory();
    this.scene.preload && this.scene.preload();
    this.scene.create();
  }

  injectMandatory() {
    game.config = {
      seed: ["test"],
    }
    this.scene.game = game;
    game.renderer = {
      maxTextures: -1,
      gl: {},
      deleteTexture: () => null,
      canvasToTexture: () => ({}),
      createCanvasTexture: () => ({}),
      pipelines: {
        add: () => null,
      },
    };
    this.scene.renderer = game.renderer;
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
        game: game,
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

    this.scene.anims = game.anims;
    this.scene.cache = game.cache;
    this.scene.plugins = game.plugins;
    this.scene.registry = game.registry;
    this.scene.scale = game.scale;
    this.scene.textures = game.textures;
    this.scene.events = game.events;
    this.scene.manager = new InputManager(game, {});
    this.scene.manager.keyboard = new KeyboardManager(this.scene);
    this.scene.pluginEvents = new EventEmitter();
    this.scene.domContainer = {} as HTMLDivElement;
    this.scene.spritePipeline = {};
    this.scene.fieldSpritePipeline = {};
    this.scene.load = new MockLoader(this.scene);
    this.scene.sys = {
      queueDepthSort: () => null,
      anims: game.anims,
      game: game,
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
      scale: game.scale,
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
      input: game.input,
    };
    const mockTextureManager = new MockTextureManager(this.scene);
    this.scene.add = mockTextureManager.add;
    this.scene.sys.displayList =  this.scene.add.displayList;
    this.scene.sys.updateList = new UpdateList(this.scene);
    this.scene.systems = this.scene.sys;
    this.scene.input = game.input;
    this.scene.scene = this.scene;
    this.scene.input.keyboard = new KeyboardPlugin(this.scene);
    this.scene.input.gamepad = new GamepadPlugin(this.scene);
    this.scene.cachedFetch = (url, init) => {
      return new Promise((resolve) => {
        const newUrl = prependPath(url);
        let raw;
        try {
          raw = fs.readFileSync(newUrl, {encoding: "utf8", flag: "r"});
        } catch(e) {
          return resolve(createFetchResponse({}));
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