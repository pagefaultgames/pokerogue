import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import type FadeIn from "phaser3-rex-plugins/plugins/audio/fade/FadeIn";
import type FadeOut from "phaser3-rex-plugins/plugins/audio/fade/FadeOut";
import type BattleScene from "#app/battle-scene";
import { globalScene } from "#app/global-scene";
import { FixedInt } from "#app/utils/common";

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

  const originalAddEvent = this.time.addEvent;
  this.time.addEvent = function (config: Phaser.Time.TimerEvent | Phaser.Types.Time.TimerEventConfig) {
    if (!(config instanceof Phaser.Time.TimerEvent) && config.delay) {
      config.delay = transformValue(config.delay);
    }
    return originalAddEvent.apply(this, [config]);
  };
  const originalTweensAdd = this.tweens.add;
  this.tweens.add = function (
    config:
      | Phaser.Types.Tweens.TweenBuilderConfig
      | Phaser.Types.Tweens.TweenChainBuilderConfig
      | Phaser.Tweens.Tween
      | Phaser.Tweens.TweenChain,
  ) {
    if (config.loopDelay) {
      config.loopDelay = transformValue(config.loopDelay as number);
    }

    if (!(config instanceof Phaser.Tweens.TweenChain)) {
      if (config.duration) {
        config.duration = transformValue(config.duration);
      }

      if (!(config instanceof Phaser.Tweens.Tween)) {
        if (config.delay) {
          config.delay = transformValue(config.delay as number);
        }
        if (config.repeatDelay) {
          config.repeatDelay = transformValue(config.repeatDelay);
        }
        if (config.hold) {
          config.hold = transformValue(config.hold);
        }
      }
    }
    return originalTweensAdd.apply(this, [config]);
  };
  const originalTweensChain = this.tweens.chain;
  this.tweens.chain = function (config: Phaser.Types.Tweens.TweenChainBuilderConfig): Phaser.Tweens.TweenChain {
    if (config.tweens) {
      for (const t of config.tweens) {
        if (t.duration) {
          t.duration = transformValue(t.duration);
        }
        if (t.delay) {
          t.delay = transformValue(t.delay as number);
        }
        if (t.repeatDelay) {
          t.repeatDelay = transformValue(t.repeatDelay);
        }
        if (t.loopDelay) {
          t.loopDelay = transformValue(t.loopDelay as number);
        }
        if (t.hold) {
          t.hold = transformValue(t.hold);
        }
      }
    }
    return originalTweensChain.apply(this, [config]);
  };
  const originalAddCounter = this.tweens.addCounter;
  this.tweens.addCounter = function (config: Phaser.Types.Tweens.NumberTweenBuilderConfig) {
    if (config.duration) {
      config.duration = transformValue(config.duration);
    }
    if (config.delay) {
      config.delay = transformValue(config.delay);
    }
    if (config.repeatDelay) {
      config.repeatDelay = transformValue(config.repeatDelay);
    }
    if (config.loopDelay) {
      config.loopDelay = transformValue(config.loopDelay as number);
    }
    if (config.hold) {
      config.hold = transformValue(config.hold);
    }
    return originalAddCounter.apply(this, [config]);
  };

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
