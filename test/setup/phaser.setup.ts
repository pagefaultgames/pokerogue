import { BattleScene } from "#app/battle-scene";
import { InvertPostFX } from "#app/pipelines/invert";
import { MockClock } from "#test/test-utils/mocks/mock-clock";
import { readFileSync } from "fs";
import BBCodeTextPlugin from "phaser3-rex-plugins/plugins/bbcodetext-plugin";
import InputTextPlugin from "phaser3-rex-plugins/plugins/inputtext-plugin";
import TransitionImagePackPlugin from "phaser3-rex-plugins/templates/transitionimagepack/transitionimagepack-plugin";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin";
import { expect } from "vitest";

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.HEADLESS,
  audio: {
    noAudio: true,
  },
  seed: ["test"],
  scene: [BattleScene],
  scale: {
    width: 1920,
    height: 1080,
    mode: Phaser.Scale.FIT,
  },
  plugins: {
    global: [
      {
        key: "rexInputTextPlugin",
        plugin: InputTextPlugin,
        start: true,
      },
      {
        key: "rexBBCodeTextPlugin",
        plugin: BBCodeTextPlugin,
        start: true,
      },
      {
        key: "rexTransitionImagePackPlugin",
        plugin: TransitionImagePackPlugin,
        start: true,
      },
    ],
    scene: [
      {
        key: "rexUI",
        plugin: UIPlugin,
        mapping: "rexUI",
      },
      {
        key: "mockClock",
        mapping: "time",
        // NB: This is compatible with the interface for scene plugins (taking a scene as first argument)
        plugin: MockClock,
      },
    ],
  },
  input: {
    mouse: {
      target: "app",
    },
    touch: {
      target: "app",
    },
    gamepad: true,
  },
  dom: {
    createContainer: true,
  },
  antialias: false,
  pipeline: [InvertPostFX] as unknown as Phaser.Types.Core.PipelineConfig,
};

export async function initializePhaserGame(): Promise<BattleScene> {
  const game = new Phaser.Game(gameConfig);
  await new Promise<void>(resolve => game.events.once(Phaser.Core.Events.READY, () => resolve()));

  const scene = game.scene.getScene("battle") as BattleScene;
  expect(scene).toBeDefined();
  expect(scene.game).toBe(game);
  expect(scene.time).toBeInstanceOf(MockClock);
  scene.cachedFetch = async (url, _init): Promise<Response> => {
    // Replace all battle anim fetches solely with the tackle anim to save time.
    // TODO: This effectively bars us from testing battle animation related code ever
    const newUrl = url.includes("./battle-anims/") ? prependPath("./battle-anims/tackle.json") : prependPath(url);
    try {
      const raw = readFileSync(newUrl, { encoding: "utf8", flag: "r" });
      return createFetchResponse(newUrl, JSON.parse(raw));
    } catch {
      return createFetchBadResponse(newUrl);
    }
  };

  return scene;
}

// TODO: Refactor this slop
function prependPath(originalPath) {
  const prefix = "assets";
  if (originalPath.startsWith("./")) {
    return originalPath.replace("./", `${prefix}/`);
  }
  return originalPath;
}

// TODO: Migrate these to using MSW or something, this is ridiculous
function createFetchResponse(url: string, data: unknown): Response {
  const str = JSON.stringify(data);
  return {
    ok: true,
    status: 200,
    redirected: false,
    statusText: "OK",
    type: "basic",
    url,
    headers: new Headers(),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(str),
    blob: () => Promise.resolve(new Blob([str])),
    arrayBuffer: () => Promise.resolve(new TextEncoder().encode(str).buffer),
  } as Response;
}
function createFetchBadResponse(url: string): Response {
  return {
    ok: false,
    status: 404,
    statusText: "Not Found",
    headers: new Headers(),
    url,
    redirected: false,
    json: () => Promise.resolve({ error: `Resource not found: ${url}` }),
    text: () => Promise.resolve(JSON.stringify({ error: `Resource not found: ${url}` })),
  } as Response;
}
