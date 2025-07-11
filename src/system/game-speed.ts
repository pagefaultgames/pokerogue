import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import type BattleScene from "#app/battle-scene";
import { globalScene } from "#app/global-scene";
import { FixedInt } from "#app/utils/common";

/** The list of properties to mutate */
const PROPERTIES = ["delay", "completeDelay", "loopDelay", "duration", "repeatDelay", "hold", "startDelay"];

/**
 * Adjust an animation's duration based on the current game speed.
 * @param duration - The original duration in seconds, either as a number or a {@linkcode FixedInt}.
 * @param speed - The current game speed value.
 * @returns The adjusted duration value, rounded to the nearest millisecond.
 */
function transformValue(duration: number | FixedInt, speed: number): number {
  // We do not mutate `FixedInt`s' durations
  if (typeof duration !== "number") {
    return duration.value;
  }
  return Math.ceil(duration / speed);
};

/** Adjust various Phaser objects' methods to scale durations with the current game speed. */
export function initGameSpeed(this: BattleScene): void {
  const mutateProperties = (obj: any, allowArray = false) => {
    // We do not mutate Tweens or TweenChain objects themselves.
    if (obj instanceof Phaser.Tweens.Tween || obj instanceof Phaser.Tweens.TweenChain) {
      return;
    }

    // If allowArray is true and obj is an array, mutate all its constituent tweens.
    if (allowArray && Array.isArray(obj)) {
      for (const tween of obj) {
        mutateProperties(tween);
      }
      return;
    }

    // Adjust durations of number or FixedInt properties
    for (const prop of PROPERTIES) {
      const objProp = obj[prop];
      if (typeof objProp === "number" || objProp instanceof FixedInt) {
        obj[prop] = transformValue(objProp, this.gameSpeed);
      }
    }

    // If the object has a 'tweens' property that is an array, then it is a tween chain
    // and we need to mutate its properties as well
    if (obj.tweens && Array.isArray(obj.tweens)) {
      for (const tween of obj.tweens) {
        mutateProperties(tween);
      }
    }
  };

  const originalAddEvent = this.time.addEvent;
  this.time.addEvent = (config: Phaser.Time.TimerEvent | Phaser.Types.Time.TimerEventConfig) => {
    if (!(config instanceof Phaser.Time.TimerEvent) && config.delay) {
      config.delay = transformValue(config.delay, this.gameSpeed);
    }
    return originalAddEvent.apply(this, [config]);
  };

  // Mutate tween functions
  for (const funcName of ["add", "addCounter", "chain", "create", "addMultiple"]) {
    const origTweenFunc = this.tweens[funcName];
    this.tweens[funcName] = (args) => {
      // TODO: review what allowArray is used for and why it is necessary
      mutateProperties(args, funcName === "create" || funcName === "addMultiple");
      return origTweenFunc.apply(this, [args]);
    }
  }

  const originalFadeOut = SoundFade.fadeOut;
  SoundFade.fadeOut = ((_scene: Phaser.Scene, sound: Phaser.Sound.BaseSound, duration: number, destroy?: boolean) =>
    originalFadeOut(this, sound, transformValue(duration, this.gameSpeed), destroy)) as typeof originalFadeOut;

  const originalFadeIn = SoundFade.fadeIn;
  SoundFade.fadeIn = ((
    _scene: Phaser.Scene,
    sound: string | Phaser.Sound.BaseSound,
    duration: number,
    endVolume?: number,
    startVolume?: number,
  ) => originalFadeIn(this, sound, transformValue(duration, this.gameSpeed), endVolume, startVolume)) as typeof originalFadeIn;
}
