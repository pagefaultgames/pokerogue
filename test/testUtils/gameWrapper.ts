// @ts-nocheck - TODO: remove this
import BattleScene from "#app/battle-scene";
import { MoveAnim } from "#app/data/battle-anims";
import Pokemon from "#app/field/pokemon";
import { sessionIdKey } from "#app/utils/common";
import { setCookie } from "#app/utils/cookies";
import { blobToString } from "#test/testUtils/gameManagerUtils";
import { MockClock } from "#test/testUtils/mocks/mockClock";
import { MockFetch } from "#test/testUtils/mocks/mockFetch";
import MockLoader from "#test/testUtils/mocks/mockLoader";
import MockTextureManager from "#test/testUtils/mocks/mockTextureManager";
import fs from "node:fs";
import Phaser from "phaser";
import { vi } from "vitest";
import { version } from "../../package.json";
import { MockGameObjectCreator } from "./mocks/mockGameObjectCreator";
import { MockTimedEventManager } from "./mocks/mockTimedEventManager";
import InputManager = Phaser.Input.InputManager;
import KeyboardManager = Phaser.Input.Keyboard.KeyboardManager;
import KeyboardPlugin = Phaser.Input.Keyboard.KeyboardPlugin;
import GamepadPlugin = Phaser.Input.Gamepad.GamepadPlugin;
import EventEmitter = Phaser.Events.EventEmitter;
import UpdateList = Phaser.GameObjects.UpdateList;
import { PokedexMonContainer } from "#app/ui/pokedex-mon-container";
import MockContainer from "./mocks/mocksContainer/mockContainer";
// biome-ignore lint/style/noNamespaceImport: Necessary in order to mock the var
import * as bypassLoginModule from "#app/global-vars/bypass-login";

window.URL.createObjectURL = (blob: Blob) => {
  blobToString(blob).then((data: string) => {
    localStorage.setItem("toExport", data);
  });
  return null;
};
navigator.getGamepads = () => [];
global.fetch = vi.fn(MockFetch);
setCookie(sessionIdKey, "fake_token");

window.matchMedia = () => ({
  matches: false,
});

export default class GameWrapper {
  public game: Phaser.Game;
  public scene: BattleScene;

  constructor(phaserGame: Phaser.Game, bypassLogin: boolean) {
    Phaser.Math.RND.sow(["test"]);
    // vi.spyOn(Utils, "apiFetch", "get").mockReturnValue(fetch);
    if (bypassLogin) {
      vi.spyOn(bypassLoginModule, "bypassLogin", "get").mockReturnValue(true);
    }
    this.game = phaserGame;
    MoveAnim.prototype.getAnim = () => ({
      frames: {},
    });
    Pokemon.prototype.enableMask = () => null;
    Pokemon.prototype.updateFusionPalette = () => null;
    Pokemon.prototype.cry = () => null;
    Pokemon.prototype.faintCry = cb => {
      if (cb) {
        cb();
      }
    };
    BattleScene.prototype.addPokemonIcon = () => new Phaser.GameObjects.Container(this.scene);

    // Pokedex container is not actually mocking container, but the sprites they contain are mocked.
    // We need to mock the remove function to not throw an error when removing a sprite.
    PokedexMonContainer.prototype.remove = MockContainer.prototype.remove;
  }

  setScene(scene: BattleScene) {
    this.scene = scene;
    this.injectMandatory();
    this.scene.preload?.();
    this.scene.create();
  }

  injectMandatory() {
    this.game.config = {
      seed: ["test"],
      gameVersion: version,
    };
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
      get: () => ({ ...this.scene.sound, totalDuration: 0 }),
      getAllPlaying: () => [],
      manager: {
        game: this.game,
      },
      destroy: () => null,
      setVolume: () => null,
      stop: () => null,
      stopByKey: () => null,
      on: (_evt, callback) => callback(),
      key: "",
    };

    this.scene.cameras = {
      main: {
        setPostPipeline: () => null,
        removePostPipeline: () => null,
      },
    };

    this.scene.tweens = {
      add: data => {
        if (data.onComplete) {
          data.onComplete();
        }
      },
      getTweensOf: () => [],
      killTweensOf: () => [],
      chain: () => null,
      addCounter: data => {
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
          get: () => ({
            // this.frame in Text.js
            source: {},
            setSize: () => null,
            glTexture: () => ({
              spectorMetadata: {},
            }),
          }),
        }),
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
          key: "battle",
        },
      },
      input: this.game.input,
    };
    const mockTextureManager = new MockTextureManager(this.scene);
    this.scene.add = mockTextureManager.add;
    this.scene.textures = mockTextureManager;
    this.scene.sys.displayList = this.scene.add.displayList;
    this.scene.sys.updateList = new UpdateList(this.scene);
    this.scene.systems = this.scene.sys;
    this.scene.input = this.game.input;
    this.scene.scene = this.scene;
    this.scene.input.keyboard = new KeyboardPlugin(this.scene);
    this.scene.input.gamepad = new GamepadPlugin(this.scene);
    this.scene.cachedFetch = (url, _init) => {
      return new Promise(resolve => {
        // need to remove that if later we want to test battle-anims
        const newUrl = url.includes("./battle-anims/") ? prependPath("./battle-anims/tackle.json") : prependPath(url);
        // biome-ignore lint/suspicious/noImplicitAnyLet: TODO
        let raw;
        try {
          raw = fs.readFileSync(newUrl, { encoding: "utf8", flag: "r" });
        } catch (_e) {
          return resolve(createFetchBadResponse({}));
        }
        const data = JSON.parse(raw);
        const response = createFetchResponse(data);
        return resolve(response);
      });
    };
    this.scene.make = new MockGameObjectCreator(mockTextureManager);
    this.scene.time = new MockClock(this.scene);
    this.scene.remove = vi.fn(); // TODO: this should be stubbed differently
    this.scene.eventManager = new MockTimedEventManager(); // Disable Timed Events
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
    headers: new Headers(),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}
// Simulate fetch response
function createFetchBadResponse(data) {
  return {
    ok: false,
    status: 404,
    headers: new Headers(),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}
