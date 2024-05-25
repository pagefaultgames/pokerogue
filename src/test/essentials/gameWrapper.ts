/* eslint-disable */
import fs from "fs";
import NoAudioSound = Phaser.Sound.NoAudioSound;
import Clock = Phaser.Time.Clock;
import Systems = Phaser.Scenes.Systems;
import game from "../phaser.setup";
import TweenManager = Phaser.Tweens.TweenManager;
import InputManager = Phaser.Input.InputManager;
import KeyboardManager = Phaser.Input.Keyboard.KeyboardManager;
import KeyboardPlugin = Phaser.Input.Keyboard.KeyboardPlugin;
import GamepadPlugin = Phaser.Input.Gamepad.GamepadPlugin;
export default class GameWrapper {
  private scenes: Map<string, Phaser.Scene> = new Map();
  public scene: {
    add: (_key: string, scene: Phaser.Scene) => void
  };

  constructor() {
    window.matchMedia = () => ({
      matches: false,
    });
    this.scene = {
      add: this.addScene.bind(this),
    };
    this.canvas = {
      height: 0,
      width: 0,
    };
    this.renderer = {
      maxTextures: "",
      gl: {},
      deleteTexture: () => null,
      canvasToTexture: () => null
    };
    this.events = {
      on: () => null,
      once: () => null,
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

    _scene.game = this;
    _scene.sound = {
      play: () => null,
      get: (key) => new NoAudioSound(undefined, key),
      getAllPlaying: () => [],
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
    };
    _scene.add = {
      container: () => ({...addMethods}),
      sprite: {
        apply: () => ({...addMethods}),
      },
      existing: () => null,
      rectangle: () => ({...addMethods}),
      nineslice: () => ({...addMethods}),
      image: () => ({...addMethods}),
      text: () => ({...addMethods}),
      polygon: () => ({...addMethods}),
    };
    _scene.load = {
      setBaseURL: () => null,
      once: () => null,
      isLoading: () => null,
      start: () => null,
      spritesheet: () => null,
      audio: () => null,
      image: () => null,
      atlas: () => null,
    };
    _scene.anims = {
      create: () => null,
      generateFrameNumbers: () => null,
      generateFrameNames: () => ([]),
    };
    _scene.sys = {
      queueDepthSort: () => null,
      game: this,
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
      cache: {},
      scale: {},
      events: {
        on: () => null,
      }
    };
    _scene.renderer = {
      pipelines: {
        add: () => null,
      },
    };
    _scene.make = {
      graphics: () => ({...addMethods}),
      rexTransitionImagePack: () => ({
        transit: () => null,
      }),
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
    _scene.input = {
      gamepad: {
        on: () => null,
        refreshPads: () => null,
      },
      keyboard: {
        on: () => null,
        addKey: () => ({
          on: () => null,
        }),
      }
    };

    // const a = game;
    // _scene.game = game;
    // _scene.sys.game = game;
    // _scene.system = _scene.sys;
    // _scene.renderer = game.renderer;
    // _scene.anims = game.anims;
    // _scene.cache = game.cache;
    // _scene.plugins = game.plugins;
    // _scene.registry = game.registry;
    // _scene.scale = game.scale;
    // _scene.sound = game.sound;
    // _scene.textures = game.textures;
    // _scene.events = game.events;
    // _scene.sys.events = game.events;
    // const tweens = new TweenManager(_scene);
    // _scene.tweens = tweens;
    // _scene.input = game.input;
    // _scene.time = new Clock(_scene);
    this.scenes[key] = _scene;
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
