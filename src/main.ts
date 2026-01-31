import "#app/polyfills"; // All polyfills MUST be loaded first for side effects
import "#plugins/i18n"; // Initializes i18n on import

import { InvertPostFX } from "#app/pipelines/invert";
import { isBeta, isDev } from "#constants/app-constants";
import { version } from "#package.json";
import Phaser from "phaser";
import BBCodeTextPlugin from "phaser3-rex-plugins/plugins/bbcodetext-plugin";
import InputTextPlugin from "phaser3-rex-plugins/plugins/inputtext-plugin";
import TransitionImagePackPlugin from "phaser3-rex-plugins/templates/transitionimagepack/transitionimagepack-plugin";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin";

if (isBeta || isDev) {
  document.title += " (Beta)";
}

// Catch global errors and display them in an alert so users can report the issue.
window.onerror = (_message, _source, _lineno, _colno, error) => {
  console.error(error);
  // const errorString = `Received unhandled error. Open browser console and click OK to see details.\nError: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\nStack: ${error.stack}`;
  //alert(errorString);
  // Avoids logging the error a second time.
  return true;
};

// Catch global promise rejections and display them in an alert so users can report the issue.
window.addEventListener("unhandledrejection", event => {
  // const errorString = `Received unhandled promise rejection. Open browser console and click OK to see details.\nReason: ${event.reason}`;
  console.error(event.reason);
  //alert(errorString);
});

async function startGame(gameManifest?: Record<string, string>): Promise<void> {
  const LoadingScene = (await import("./loading-scene")).LoadingScene;
  const BattleScene = (await import("./battle-scene")).BattleScene;
  const game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: "app",
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
    scene: [LoadingScene, BattleScene],
    version,
  });
  game.sound.pauseOnBlur = false;
  game.manifest = gameManifest;
}

let manifest: Record<string, string> | undefined;
try {
  const loadFonts = Promise.all([document.fonts.load("16px emerald"), document.fonts.load("10px pkmnems")]);
  const [jsonResponse] = await Promise.all([fetch("/manifest.json").then(r => r.json()), loadFonts]);
  manifest = jsonResponse.manifest;
} catch (err) {
  // Manifest not found (likely local build or path error on live)
  // TODO: Do we want actual error handling here?
  console.log("Manifest not found:", err);
} finally {
  await startGame(manifest);
}
