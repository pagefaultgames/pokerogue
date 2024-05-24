
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
      setText: () => null,
      setPosition: () => null,
      setTexture: () => null,
      stop: () => null,
      fillStyle: () => null,
      beginPath: () => null,
      fillRect: () => null,
      createGeometryMask: () => null,
      setMask: () => null,
      setPositionRelative: () => null,
      on: () => null,
      setAngle: () => null,
      setTint: () => null,
      setShadowOffset: () => null,
      setFrame: () => null,
      setWordWrapWidth: () => null,
      setFontSize: () => null,
      setColor: () => null,
      setShadowColor: () => null,
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
    };
    const { setStrokeStyle, ...methodsWithoutSetStrokeStyle } = addMethods;
    const { getAt, ...methodsWithoutGetAt } = addMethods;
    addMethods.setStrokeStyle = () => ({ ...methodsWithoutSetStrokeStyle });
    addMethods.getAt = () => ({ ...methodsWithoutGetAt });

    _scene.game = this;
    _scene.time = {
      addEvent: () => null,
      delayedCall: (time, fn) => fn(),
    };
    _scene.tweens = {
      add: () => null,
      chain: () => null,
      addCounter: () => null,
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
    _scene.cachedFetch = () => new Promise((resolve) => resolve({
      response: {
        body: {},
        status: 200,
      },
      json: () => ({}),
    }));
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
    this.scenes[key] = _scene;
    _scene.create();
  }
}
