import { BattleScene } from "#app/battle-scene";
import { timedEventManager } from "#app/global-event-manager";
// biome-ignore lint/performance/noNamespaceImport: Necessary in order to mock the var
import * as appConstants from "#constants/app-constants";
import { MoveAnim } from "#data/battle-anims";
import { Pokemon } from "#field/pokemon";
import { version } from "#package.json";
import { MockClock } from "#test/test-utils/mocks/mock-clock";
import { MockGameObjectCreator } from "#test/test-utils/mocks/mock-game-object-creator";
import { MockLoader } from "#test/test-utils/mocks/mock-loader";
import { MockTextureManager } from "#test/test-utils/mocks/mock-texture-manager";
import { MockContainer } from "#test/test-utils/mocks/mocks-container/mock-container";
import { PokedexMonContainer } from "#ui/pokedex-mon-container";
import fs from "node:fs";
import Phaser from "phaser";
import { vi } from "vitest";

const InputManager = Phaser.Input.InputManager;
const KeyboardManager = Phaser.Input.Keyboard.KeyboardManager;
const KeyboardPlugin = Phaser.Input.Keyboard.KeyboardPlugin;
const GamepadPlugin = Phaser.Input.Gamepad.GamepadPlugin;
const EventEmitter = Phaser.Events.EventEmitter;
const UpdateList = Phaser.GameObjects.UpdateList;

export class GameWrapper {
  public game: Phaser.Game;
  public scene: BattleScene;

  constructor(phaserGame: Phaser.Game, bypassLogin: boolean) {
    // TODO: Figure out how to actually set RNG states correctly
    Phaser.Math.RND.sow(["test"]);
    // vi.spyOn(Utils, "apiFetch", "get").mockReturnValue(fetch);
    if (bypassLogin) {
      vi.spyOn(appConstants, "bypassLogin", "get").mockReturnValue(true);
    }
    this.game = phaserGame;
    // TODO: Move these mocks elsewhere
    MoveAnim.prototype.getAnim = () => ({ frames: {} }) as any;
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
    // @ts-expect-error
    PokedexMonContainer.prototype.remove = MockContainer.prototype.remove;
  }

  /**
   * Initialize the given {@linkcode BattleScene} and override various properties to avoid crashes with headless games.
   * @param scene - The {@linkcode BattleScene} to initialize
   * @returns A Promise that resolves once the initialization process has completed.
   * @todo Is loading files actually necessary for a headless renderer?
   */
  public async setScene(scene: BattleScene): Promise<void> {
    this.scene = scene;
    this.injectMandatory();

    this.scene.preload();
    this.scene.create();
  }

  /**
   * Override the scene and stub out various properties to avoid crashes.
   * @todo This method is an unmaintainable mess and likely stems from us
   * never actually instantiating `BattleScene` via `Phaser.Game` correctly.
   * Furthermore, this also makes testing any form of Phaser-related infrastructure absolutely
   * infeasible, and must be revisited before a multi-scene breakup can be considered.
   */
  private injectMandatory(): void {
    // @ts-expect-error: `config` is `readonly`
    this.game.config = {
      seed: ["test"],
      gameVersion: version,
    };
    this.scene.game = this.game;
    this.game.renderer = {
      maxTextures: -1,
      gl: {} as any,
      deleteTexture: () => null!,
      canvasToTexture: () => ({}) as any,
      createCanvasTexture: () => ({}) as any,
      pipelines: { add: () => null! } as any,
    } as any;
    this.scene.renderer = this.game.renderer as any;
    this.scene.children = { removeAll: () => null! } as any;

    // TODO: Can't we just turn on `noAudio` in audio config?
    this.scene.sound = {
      play: () => false,
      // @ts-expect-error: not sure why we're mocking this when it doesn't seem to exist normally? or maybe typescript is confused?
      pause: () => false,
      setRate: () => null!,
      add: () => this.scene.sound as any,
      get: () => ({ ...this.scene.sound, totalDuration: 0 }) as any,
      getAllPlaying: () => [],
      manager: { game: this.game },
      destroy: () => null,
      setVolume: () => null,
      stop: () => null,
      stopByKey: () => 0,
      on: (_evt, callback) => callback(),
      key: "",
    };

    this.scene.cameras = {
      main: {
        setPostPipeline: () => null!,
        removePostPipeline: () => null!,
      },
    } as any;

    // TODO: Replace this with a proper mock of phaser's TweenManager.
    this.scene.tweens = {
      // @ts-expect-error
      add: data => {
        // TODO: our mock of `add` should have the same signature as the real one, which returns the tween
        // @ts-expect-error
        data.onComplete?.();
      },
      getTweensOf: () => [],
      killTweensOf: () => [] as any,
      // @ts-expect-error
      chain: data => {
        // TODO: our mock of `chain` should have the same signature as the real one, which returns the chain
        // @ts-expect-error
        // biome-ignore lint/suspicious/useIterableCallbackReturn: it's a mock
        data?.tweens?.forEach(tween => tween.onComplete?.());
        // @ts-expect-error
        data.onComplete?.();
      },
      // @ts-expect-error
      addCounter: data => {
        if (data.onComplete) {
          // @ts-expect-error: how does this work when the parameters are missing?
          data.onComplete();
        }
      },
    };

    // TODO: These stubs override phaser classes with ones of... different types?
    this.scene.anims = this.game.anims;
    this.scene.cache = this.game.cache;
    this.scene.plugins = this.game.plugins;
    this.scene.registry = this.game.registry;
    this.scene.scale = this.game.scale;
    this.scene.textures = this.game.textures;
    this.scene.events = this.game.events;
    // TODO: Why is this needed? The `manager` property isn't used anywhere
    this.scene["manager"] = new InputManager(this.game, {});
    this.scene["manager"].keyboard = new KeyboardManager(this.scene as any);
    this.scene["pluginEvents"] = new EventEmitter();
    this.game.domContainer = {} as HTMLDivElement;
    // TODO: scenes don't have dom containers
    this.scene["domContainer"] = {} as HTMLDivElement;
    this.scene.spritePipeline = {} as any;
    this.scene.fieldSpritePipeline = {} as any;
    this.scene.load = new MockLoader(this.scene) as any;
    this.scene.sys = {
      queueDepthSort: () => null,
      anims: this.game.anims,
      game: this.game,
      textures: {
        addCanvas: () => ({
          get: () => ({
            // this.frame in Text.js
            source: {} as any,
            setSize: () => null!,
            // @ts-expect-error
            glTexture: () => ({ spectorMetadata: {} }),
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
          // @ts-expect-error: apparently `key` doesn't exist on this object normally? not sure why we're setting it
          key: "battle",
        },
      },
      input: this.game.input,
    };
    const mockTextureManager = new MockTextureManager(this.scene);
    this.scene.add = mockTextureManager.add;
    this.scene.textures = mockTextureManager as any;
    // @ts-expect-error: `add.displayList` is `protected`
    this.scene.sys.displayList = this.scene.add.displayList;
    this.scene.sys.updateList = new UpdateList(this.scene);
    this.scene["systems"] = this.scene.sys;
    this.scene.input = this.game.input as any;
    this.scene.scene = this.scene as any; // TODO: This seems wacky
    this.scene.input.keyboard = new KeyboardPlugin(this.scene as any);
    this.scene.input.gamepad = new GamepadPlugin(this.scene as any);
    this.scene.cachedFetch = async (url, _init): Promise<Response> => {
      // Replace all battle anim fetches solely with the tackle anim to save time.
      // TODO: This effectively bars us from testing battle animation related code ever
      const newUrl = url.includes("./battle-anims/") ? prependPath("./battle-anims/tackle.json") : prependPath(url);
      try {
        const raw = fs.readFileSync(newUrl, { encoding: "utf8", flag: "r" });
        return createFetchResponse(JSON.parse(raw));
      } catch {
        return createFetchBadResponse({});
      }
    };
    this.scene.make = new MockGameObjectCreator(mockTextureManager) as any;
    this.scene.time = new MockClock(this.scene);
    this.scene["remove"] = vi.fn(); // TODO: this should be stubbed differently
    timedEventManager.disable();
  }
}

function prependPath(originalPath) {
  const prefix = "assets";
  if (originalPath.startsWith("./")) {
    return originalPath.replace("./", `${prefix}/`);
  }
  return originalPath;
}
// Simulate fetch response
function createFetchResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as any;
}
// Simulate fetch response
function createFetchBadResponse(data: unknown): Response {
  return {
    ok: false,
    status: 404,
    headers: new Headers(),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as any;
}
