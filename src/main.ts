import Phaser from "phaser";
import BattleScene from "./battle-scene";
import InvertPostFX from "./pipelines/invert";
import { version } from "../package.json";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin";
import BBCodeTextPlugin from "phaser3-rex-plugins/plugins/bbcodetext-plugin";
import InputTextPlugin from "phaser3-rex-plugins/plugins/inputtext-plugin.js";
import TransitionImagePackPlugin from "phaser3-rex-plugins/templates/transitionimagepack/transitionimagepack-plugin.js";
import { LoadingScene } from "./loading-scene";
import { isMobile, hasTouchscreen } from "./touch-controls";
import { SettingKeys, Setting } from "./system/settings/settings";


// Catch global errors and display them in an alert so users can report the issue.
window.onerror = function (message, source, lineno, colno, error) {
  console.error(error);
  // const errorString = `Received unhandled error. Open browser console and click OK to see details.\nError: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\nStack: ${error.stack}`;
  //alert(errorString);
  // Avoids logging the error a second time.
  return true;
};

// Catch global promise rejections and display them in an alert so users can report the issue.
window.addEventListener("unhandledrejection", (event) => {
  // const errorString = `Received unhandled promise rejection. Open browser console and click OK to see details.\nReason: ${event.reason}`;
  console.error(event.reason);
  //alert(errorString);
});

/**
 * Determines if the game window should be centered based on the current device and settings.
 *
 * This function checks several conditions to decide whether the game window should be centered:
 * 1. Checks if the device is in landscape orientation.
 * 2. Checks if the device is not a mobile device.
 * 3. Checks if the device has a touchscreen.
 * 4. Checks if touch controls is explicitly enabled in the settings.
 *
 * @returns {boolean} - Returns true if the window should be centered, false otherwise.
 */
const shouldCenterWindow = (): boolean => {
  const touchControlsOptions = Setting.find(s => s.key === SettingKeys.Touch_Controls).options;
  console.log(touchControlsOptions);
  const settings = localStorage.hasOwnProperty("settings") ? JSON.parse(localStorage.getItem("settings")) : null;

  const isLandscape = window.matchMedia("(orientation: landscape)").matches;
  const isTouchControlsEnabled: boolean | null = settings ? touchControlsOptions[settings[SettingKeys.Touch_Controls]] !== "Disabled" : null;

  if (isLandscape && !isMobile() && (!hasTouchscreen() || (hasTouchscreen() && (typeof isTouchControlsEnabled === "boolean" && !isTouchControlsEnabled)))) {
    return true;
  }
  return false;
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: "app",
  scale: {
    width: 1920,
    height: 1080,
    mode: Phaser.Scale.FIT,
    autoCenter: shouldCenterWindow() ? Phaser.Scale.CENTER_VERTICALLY : Phaser.Scale.NO_CENTER
  },
  plugins: {
    global: [{
      key: "rexInputTextPlugin",
      plugin: InputTextPlugin,
      start: true
    }, {
      key: "rexBBCodeTextPlugin",
      plugin: BBCodeTextPlugin,
      start: true
    }, {
      key: "rexTransitionImagePackPlugin",
      plugin: TransitionImagePackPlugin,
      start: true
    }],
    scene: [{
      key: "rexUI",
      plugin: UIPlugin,
      mapping: "rexUI"
    }]
  },
  input: {
    mouse: {
      target: "app"
    },
    touch: {
      target: "app"
    },
    gamepad: true
  },
  dom: {
    createContainer: true
  },
  pixelArt: true,
  pipeline: [ InvertPostFX ] as unknown as Phaser.Types.Core.PipelineConfig,
  scene: [ LoadingScene, BattleScene ],
  version: version
};

/**
 * Sets this object's position relative to another object with a given offset
 * @param guideObject {@linkcode Phaser.GameObjects.GameObject} to base the position off of
 * @param x The relative x position
 * @param y The relative y position
 */
const setPositionRelative = function (guideObject: any, x: number, y: number) {
  const offsetX = guideObject.width * (-0.5 + (0.5 - guideObject.originX));
  const offsetY = guideObject.height * (-0.5 + (0.5 - guideObject.originY));
  this.setPosition(guideObject.x + offsetX + x, guideObject.y + offsetY + y);
};

declare module "phaser" {
	namespace GameObjects {
		interface Container {
      /**
       * Sets this object's position relative to another object with a given offset
       * @param guideObject {@linkcode Phaser.GameObjects.GameObject} to base the position off of
       * @param x The relative x position
       * @param y The relative y position
       */
			setPositionRelative(guideObject: any, x: number, y: number): void;
		}
		interface Sprite {
      /**
       * Sets this object's position relative to another object with a given offset
       * @param guideObject {@linkcode Phaser.GameObjects.GameObject} to base the position off of
       * @param x The relative x position
       * @param y The relative y position
       */
			setPositionRelative(guideObject: any, x: number, y: number): void;
		}
		interface Image {
      /**
       * Sets this object's position relative to another object with a given offset
       * @param guideObject {@linkcode Phaser.GameObjects.GameObject} to base the position off of
       * @param x The relative x position
       * @param y The relative y position
       */
			setPositionRelative(guideObject: any, x: number, y: number): void;
		}
		interface NineSlice {
      /**
       * Sets this object's position relative to another object with a given offset
       * @param guideObject {@linkcode Phaser.GameObjects.GameObject} to base the position off of
       * @param x The relative x position
       * @param y The relative y position
       */
			setPositionRelative(guideObject: any, x: number, y: number): void;
		}
		interface Text {
      /**
       * Sets this object's position relative to another object with a given offset
       * @param guideObject {@linkcode Phaser.GameObjects.GameObject} to base the position off of
       * @param x The relative x position
       * @param y The relative y position
       */
			setPositionRelative(guideObject: any, x: number, y: number): void;
		}
		interface Rectangle {
      /**
       * Sets this object's position relative to another object with a given offset
       * @param guideObject {@linkcode Phaser.GameObjects.GameObject} to base the position off of
       * @param x The relative x position
       * @param y The relative y position
       */
			setPositionRelative(guideObject: any, x: number, y: number): void;
		}
	}
}

Phaser.GameObjects.Container.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Sprite.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Image.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.NineSlice.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Text.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Rectangle.prototype.setPositionRelative = setPositionRelative;

document.fonts.load("16px emerald").then(() => document.fonts.load("10px pkmnems"));

let game: Phaser.Game;

const startGame = () => {
  game = new Phaser.Game(config);
  game.sound.pauseOnBlur = false;
};

fetch("/manifest.json")
  .then(res => res.json())
  .then(jsonResponse => {
    startGame();
    game["manifest"] = jsonResponse.manifest;
  }).catch(() => {
    // Manifest not found (likely local build)
    startGame();
  });

export default game;
