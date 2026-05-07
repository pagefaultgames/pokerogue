import type { BattleScene } from "#app/battle-scene";
import { FixedInt } from "#utils/common";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";

/** Array containing all time-related properties to be mutated. */
const TIME_RELATED_PROPERTIES = [
  "delay",
  "completeDelay",
  "loopDelay",
  "duration",
  "repeatDelay",
  "hold",
  "startDelay",
] as const;

/**
 * Compute the new value of a duration or other time-based property based on the current game speed.
 * @param scene - The current {@linkcode BattleScene}
 * @param value - The base amount of time the effect should last at 1x speed
 * @returns The updated duration value accounting for game speed
 * @remarks
 * Any {@linkcode FixedInt}s passed in will be returned verbatim without adjustment.
 */
function applyGameSpeedMult(scene: BattleScene, value: number | FixedInt): number {
  if (value instanceof FixedInt) {
    return value.value;
  }
  return Math.ceil(value / scene.gameSpeed);
}

/**
 * Recursively mutate an object's time-related properties.
 * @param obj - The object to mutate
 * @param allowArray - (Default `false`) Whether to allow mutating arrays of tween configs at the top level.
 */
// TODO: This typing can be made much stricter if and when Phaser decides to stop typing its config properties as object[]
function mutateTimeRelatedProperties<O extends object>(
  scene: BattleScene,
  obj: O,
  ...allowArray: O extends readonly any[] ? [true] : []
): void;
function mutateTimeRelatedProperties(scene: BattleScene, obj: object, allowArray?: boolean): void;
function mutateTimeRelatedProperties(
  scene: BattleScene,
  obj: Partial<Record<(typeof TIME_RELATED_PROPERTIES)[number], number | FixedInt>>,
  allowArray = false,
): void {
  // We do not mutate Tweens or TweenChain objects directly
  if (obj instanceof Phaser.Tweens.Tween || obj instanceof Phaser.Tweens.TweenChain) {
    return;
  }

  // mutate top-level arrays of tween configs if applicable (ensuring we don't recursively mutate them)
  if (Array.isArray(obj)) {
    if (!allowArray) {
      return;
    }
    for (const tween of obj) {
      mutateTimeRelatedProperties(scene, tween);
    }
    return;
  }

  for (const prop of TIME_RELATED_PROPERTIES) {
    const timeVal = obj[prop] satisfies number | FixedInt | undefined;
    if (typeof timeVal === "number" || timeVal instanceof FixedInt) {
      obj[prop] = applyGameSpeedMult(scene, timeVal);
    }
  }

  // If the object has a 'tweens' property that is an array, then it is a tween chain
  // and we need to mutate its properties as well
  if ("tweens" in obj && Array.isArray(obj.tweens)) {
    mutateTimeRelatedProperties(scene, obj.tweens, true);
  }
}

/**
 * Override and wrap various Phaser methods to alter time-related properties based on the current game speed. \
 * Any duration values passed that are {@linkcode FixedInt}s will be treated as fixed duration values and preserved.
 *
 * @param scene - The {@linkcode BattleScene} to initialize; will have relevant properties overwritten in place
 * @privateRemarks
 * While this approach may appear somewhat heavy-handed, there is effectively no other way to achieve the desired effect within the constraints set by Phaser,
 * as altering game speed via game settings would affect _all_ time-related processes (including ones we want to remain unchanged).
 */
export function initGameSpeed(scene: BattleScene): void {
  // #region Method overrides

  const originalAddEvent = scene.time.addEvent;
  scene.time.addEvent = function (this: Phaser.Time.Clock, config) {
    if (!(config instanceof Phaser.Time.TimerEvent) && config.delay) {
      config.delay = applyGameSpeedMult(scene, config.delay);
    }
    return originalAddEvent.call(this, config);
  } satisfies typeof originalAddEvent;

  const originalTweensAdd = scene.tweens.add;
  scene.tweens.add = function (this: Phaser.Tweens.TweenManager, config) {
    mutateTimeRelatedProperties(scene, config);
    return originalTweensAdd.call(this, config);
  } satisfies typeof originalTweensAdd;

  const originalTweensChain = scene.tweens.chain;
  scene.tweens.chain = function (this: Phaser.Tweens.TweenManager, config): Phaser.Tweens.TweenChain {
    mutateTimeRelatedProperties(scene, config);
    return originalTweensChain.call(this, config);
  } satisfies typeof originalTweensChain;

  const originalAddCounter = scene.tweens.addCounter;
  scene.tweens.addCounter = function (this: Phaser.Tweens.TweenManager, config) {
    mutateTimeRelatedProperties(scene, config);
    return originalAddCounter.call(this, config);
  } satisfies typeof originalAddCounter;

  const originalCreate = scene.tweens.create;
  scene.tweens.create = function (this: Phaser.Tweens.TweenManager, config) {
    mutateTimeRelatedProperties(scene, config, true);
    return originalCreate.call(this, config);
  } satisfies typeof originalCreate;

  const originalAddMultiple = scene.tweens.addMultiple;
  scene.tweens.addMultiple = function (this: Phaser.Tweens.TweenManager, config) {
    mutateTimeRelatedProperties(scene, config, true);
    return originalAddMultiple.call(this, config);
  } satisfies typeof originalAddMultiple;

  // Override the fade in/out duration for sound effects

  // TODO: TypeScript has comically terrible inference support for overwriting functions declared as callable interfaces
  // (hence why this code is so verbose and type-assertion heavy)
  const originalFadeOut = SoundFade.fadeOut;
  SoundFade.fadeOut = ((
    ...args:
      | [scene: Phaser.Scene, sound: string | Phaser.Sound.BaseSound, duration: number, destroy?: boolean | undefined]
      | [sound: string | Phaser.Sound.BaseSound, duration: number, destroy?: boolean | undefined]
  ): Phaser.Sound.BaseSound => {
    if (typeof args[1] === "number") {
      // no scene included; duration is at index 1
      (args[1] as number) = applyGameSpeedMult(scene, args[1] as number);
    } else {
      // scene included in parameter list; duration is at index 2
      (args[2] as number) = applyGameSpeedMult(scene, args[2] as number);
    }
    return originalFadeOut(...(args as Parameters<typeof originalFadeOut>));
  }) satisfies typeof originalFadeOut;

  const originalFadeIn = SoundFade.fadeIn;
  SoundFade.fadeIn = ((
    ...args:
      | [
          scene: Phaser.Scene,
          sound: string | Phaser.Sound.BaseSound,
          duration: number,
          endVolume?: number | undefined,
          startVolume?: number | undefined,
        ]
      | [
          sound: string | Phaser.Sound.BaseSound,
          duration: number,
          endVolume?: number | undefined,
          startVolume?: number | undefined,
        ]
  ): Phaser.Sound.BaseSound => {
    if (typeof args[1] === "number") {
      // no scene included; duration is at index 1
      (args[1] as number) = applyGameSpeedMult(scene, args[1] as number);
    } else {
      // scene included in parameter list; duration is at index 2
      (args[2] as number) = applyGameSpeedMult(scene, args[2] as number);
    }
    return originalFadeIn(...(args as Parameters<typeof originalFadeIn>));
  }) satisfies typeof originalFadeIn;

  // #endregion Method overrides
}
