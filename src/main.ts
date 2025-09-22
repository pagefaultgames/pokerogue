import "#app/polyfills";
// All polyfills MUST be loaded first for side effects

import { InvertPostFX } from "#app/pipelines/invert";
import { initI18n } from "#app/plugins/i18n";
import { version } from "#package.json";
import Phaser from "phaser";
import BBCodeTextPlugin from "phaser3-rex-plugins/plugins/bbcodetext-plugin";
import InputTextPlugin from "phaser3-rex-plugins/plugins/inputtext-plugin";
import TransitionImagePackPlugin from "phaser3-rex-plugins/templates/transitionimagepack/transitionimagepack-plugin";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin";

if (import.meta.env.DEV) {
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

/**
 * Sets this object's position relative to another object with a given offset
 */
const setPositionRelative = function (guideObject: Phaser.GameObjects.GameObject, x: number, y: number) {
  const offsetX = guideObject.width * (-0.5 + (0.5 - guideObject.originX));
  const offsetY = guideObject.height * (-0.5 + (0.5 - guideObject.originY));
  return this.setPosition(guideObject.x + offsetX + x, guideObject.y + offsetY + y);
};

Phaser.GameObjects.Container.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Sprite.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Image.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.NineSlice.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Text.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Rectangle.prototype.setPositionRelative = setPositionRelative;

document.fonts.load("16px emerald").then(() => document.fonts.load("10px pkmnems"));
// biome-ignore lint/suspicious/noImplicitAnyLet: TODO
let game;
// biome-ignore lint/suspicious/noImplicitAnyLet: TODO
let manifest;

const startGame = async () => {
  await initI18n();
  const LoadingScene = (await import("./loading-scene")).LoadingScene;
  const BattleScene = (await import("./battle-scene")).BattleScene;
  game = new Phaser.Game({
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
  if (manifest) {
    game["manifest"] = manifest;
  }
};

fetch("/manifest.json")
  .then(res => res.json())
  .then(jsonResponse => {
    manifest = jsonResponse.manifest;
  })
  .catch(err => {
    // Manifest not found (likely local build or path error on live)
    console.log(`Manifest not found. ${err}`);
  })
  .finally(() => {
    startGame();
  });

export default game;
