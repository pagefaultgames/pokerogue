import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import type BattleScene from "#app/battle-scene";
import { globalScene } from "#app/global-scene";
import { FixedInt } from "#app/utils/common";

/** The list of properties to mutate */
const PROPERTIES = ["delay", "completeDelay", "loopDelay", "duration", "repeatDelay", "hold", "startDelay"];

/**
 * Adjust an animation's duration based on the current game speed.
 * @param duration - The original duration in seconds, either as a number or a {@linkcode FixedInt}
 * @returns The adjusted duration value, rounded to the nearest millisecond.
 * {@linkcode FixedInt}s will not be affected by changes to game speed.
 */
function transformValue(duration: number | FixedInt): number {
  // We do not mutate `FixedInt` durations
  if (typeof duration !== "number") {
    return duration.value;
  }
  return Math.ceil(duration / globalScene.gameSpeed);
}

/**
 * Adjust various Phaser objects' methods to scale durations with the current game speed.
 * @param this - The current {@linkcode BattleScene}
 */
export function initGameSpeed(this: BattleScene): void {
  /** 
   * Recursively mutate duration-based properties to scale with the current game speed.
   * @param obj - The object being mutated
   * @param allowArray - Whether to recurse once into array-like objects; default `false`
   */
  const mutateProperties = (obj: any, allowArray = false): void => {
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
        obj[prop] = transformValue(objProp);
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

  // NB: anonymous functions are used instead of arrow functions
  // to preserve `this` values in their original contexts.
  const originalAddEvent = this.time.addEvent;
  this.time.addEvent = function (config: Phaser.Time.TimerEvent | Phaser.Types.Time.TimerEventConfig) {
    if (!(config instanceof Phaser.Time.TimerEvent) && config.delay) {
      config.delay = transformValue(config.delay);
    }
    return originalAddEvent.apply(this, [config]);
  };

  // Mutate tween functions
  const originalTweensAdd = this.tweens.add;
  this.tweens.add = function (
    config:
      | Phaser.Types.Tweens.TweenBuilderConfig
      | Phaser.Types.Tweens.TweenChainBuilderConfig
      | Phaser.Tweens.Tween
      | Phaser.Tweens.TweenChain,
  ) {
    mutateProperties(config);
    return originalTweensAdd.call(this, config);
  };

  const originalTweensChain = this.tweens.chain;
  this.tweens.chain = function (config: Phaser.Types.Tweens.TweenChainBuilderConfig): Phaser.Tweens.TweenChain {
    mutateProperties(config);
    return originalTweensChain.call(this, config);
  };

  const originalAddCounter = this.tweens.addCounter;
  this.tweens.addCounter = function (config: Phaser.Types.Tweens.NumberTweenBuilderConfig) {
    mutateProperties(config);
    return originalAddCounter.call(this, config);
  };

  const originalCreate = this.tweens.create;
  this.tweens.create = function (config: Phaser.Types.Tweens.TweenBuilderConfig) {
    mutateProperties(config, true);
    return originalCreate.call(this, config);
  };

  const originalAddMultiple = this.tweens.addMultiple;
  this.tweens.addMultiple = function (config: Phaser.Types.Tweens.TweenBuilderConfig[]) {
    mutateProperties(config, true);
    return originalAddMultiple.call(this, config);
  };

  // Mutate sound fade in/out
  const originalFadeOut = SoundFade.fadeOut;
  SoundFade.fadeOut = function (scene: Phaser.Scene, sound: Phaser.Sound.BaseSound, duration: number, destroy?: boolean) {
    duration = transformValue(duration)
    return originalFadeOut(scene, sound, duration, destroy);
  }

  const originalFadeIn = SoundFade.fadeIn;
  SoundFade.fadeIn = function (
    scene: Phaser.Scene,
    sound: string | Phaser.Sound.BaseSound,
    duration: number,
    endVolume?: number,
    startVolume?: number,
  ) {
    duration = transformValue(duration)
    return originalFadeIn(scene, sound, duration, endVolume, startVolume);
  }
}
