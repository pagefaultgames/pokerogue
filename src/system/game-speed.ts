import type { BattleScene } from "#app/battle-scene";
import { globalScene } from "#app/global-scene";
import { FixedInt } from "#utils/common";
import type FadeIn from "phaser3-rex-plugins/plugins/audio/fade/FadeIn";
import type FadeOut from "phaser3-rex-plugins/plugins/audio/fade/FadeOut";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";

type TweenManager = typeof Phaser.Tweens.TweenManager.prototype;

/** The set of properties to mutate */
const PROPERTIES = ["delay", "completeDelay", "loopDelay", "duration", "repeatDelay", "hold", "startDelay"];

type FadeInType = typeof FadeIn;
type FadeOutType = typeof FadeOut;
export function initGameSpeed() {
  const thisArg = this as BattleScene;

  const transformValue = (value: number | FixedInt): number => {
    if (value instanceof FixedInt) {
      return (value as FixedInt).value;
    }
    return thisArg.gameSpeed === 1 ? value : Math.ceil((value /= thisArg.gameSpeed));
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complexity is necessary here
  const mutateProperties = (obj: any, allowArray = false) => {
    // We do not mutate Tweens or TweenChain objects themselves.
    if (obj instanceof Phaser.Tweens.Tween || obj instanceof Phaser.Tweens.TweenChain) {
      return;
    }
    // If allowArray is true then check if first obj is an array and if so, mutate the tweens inside
    if (allowArray && Array.isArray(obj)) {
      for (const tween of obj) {
        mutateProperties(tween);
      }
      return;
    }

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

  const originalAddEvent: typeof Phaser.Time.Clock.prototype.addEvent = this.time.addEvent;
  this.time.addEvent = function (config: Phaser.Time.TimerEvent | Phaser.Types.Time.TimerEventConfig) {
    if (!(config instanceof Phaser.Time.TimerEvent) && config.delay) {
      config.delay = transformValue(config.delay);
    }
    return originalAddEvent.apply(this, [config]);
  };
  const originalTweensAdd: TweenManager["add"] = this.tweens.add;

  this.tweens.add = function (
    config:
      | Phaser.Types.Tweens.TweenBuilderConfig
      | Phaser.Types.Tweens.TweenChainBuilderConfig
      | Phaser.Tweens.Tween
      | Phaser.Tweens.TweenChain,
  ) {
    mutateProperties(config);
    return originalTweensAdd.apply(this, [config]);
  } as typeof originalTweensAdd;

  const originalTweensChain: TweenManager["chain"] = this.tweens.chain;
  this.tweens.chain = function (config: Phaser.Types.Tweens.TweenChainBuilderConfig): Phaser.Tweens.TweenChain {
    mutateProperties(config);
    return originalTweensChain.apply(this, [config]);
  } as typeof originalTweensChain;
  const originalAddCounter: TweenManager["addCounter"] = this.tweens.addCounter;

  this.tweens.addCounter = function (config: Phaser.Types.Tweens.NumberTweenBuilderConfig) {
    mutateProperties(config);
    return originalAddCounter.apply(this, [config]);
  } as typeof originalAddCounter;

  const originalCreate: TweenManager["create"] = this.tweens.create;
  this.tweens.create = function (config: Phaser.Types.Tweens.TweenBuilderConfig) {
    mutateProperties(config, true);
    return originalCreate.apply(this, [config]);
  } as typeof originalCreate;

  const originalAddMultiple: TweenManager["addMultiple"] = this.tweens.addMultiple;
  this.tweens.addMultiple = function (config: Phaser.Types.Tweens.TweenBuilderConfig[]) {
    mutateProperties(config, true);
    return originalAddMultiple.apply(this, [config]);
  } as typeof originalAddMultiple;

  const originalFadeOut = SoundFade.fadeOut;
  SoundFade.fadeOut = ((_scene: Phaser.Scene, sound: Phaser.Sound.BaseSound, duration: number, destroy?: boolean) =>
    originalFadeOut(globalScene, sound, transformValue(duration), destroy)) as FadeOutType;

  const originalFadeIn = SoundFade.fadeIn;
  SoundFade.fadeIn = ((
    _scene: Phaser.Scene,
    sound: string | Phaser.Sound.BaseSound,
    duration: number,
    endVolume?: number,
    startVolume?: number,
  ) => originalFadeIn(globalScene, sound, transformValue(duration), endVolume, startVolume)) as FadeInType;
}
