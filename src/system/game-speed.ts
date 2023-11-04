import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import FadeIn from 'phaser3-rex-plugins/plugins/audio/fade/FadeIn';
import FadeOut from 'phaser3-rex-plugins/plugins/audio/fade/FadeOut';
import BattleScene from "../battle-scene";
import * as Utils from "../utils";

type FadeIn = typeof FadeIn;
type FadeOut = typeof FadeOut;

export function initGameSpeed() {
  const thisArg = this as BattleScene;

  const transformValue = (value: number | Utils.FixedInt): number => {
    if (value instanceof Utils.FixedInt)
      return (value as Utils.FixedInt).value;
    return thisArg.gameSpeed === 1 ? value : Math.ceil(value /= thisArg.gameSpeed);
  };

  const originalAddEvent = this.time.addEvent;
  this.time.addEvent = function (config: Phaser.Time.TimerEvent | Phaser.Types.Time.TimerEventConfig) {
    if (config.delay)
      config.delay = transformValue(config.delay);
    return originalAddEvent.apply(this, [ config ]);
  };
  const originalTweensAdd = this.tweens.add;
  this.tweens.add = function (config: Phaser.Types.Tweens.TweenBuilderConfig | object) {
    if (config.duration)
      config.duration = transformValue(config.duration);
    if (config.delay)
      config.delay = transformValue(config.delay);
    return originalTweensAdd.apply(this, [ config ]);
  };
  const originalAddCounter = this.tweens.addCounter;
  this.tweens.addCounter = function (config: Phaser.Types.Tweens.NumberTweenBuilderConfig) {
    if (config.duration)
      config.duration = transformValue(config.duration);
    if (config.delay)
      config.delay = transformValue(config.delay);
    return originalAddCounter.apply(this, [ config ]);
  };
  
  const originalFadeOut = SoundFade.fadeOut;
  SoundFade.fadeOut = ((
    scene: Phaser.Scene,
    sound: Phaser.Sound.BaseSound,
    duration: number,
    destroy?: boolean
  ) => originalFadeOut(scene, sound, transformValue(duration), destroy)) as FadeOut;

  const originalFadeIn = SoundFade.fadeIn;
  SoundFade.fadeIn = ((
    scene: Phaser.Scene,
    sound: string | Phaser.Sound.BaseSound,
    duration: number,
    endVolume?: number,
    startVolume?: number
  ) => originalFadeIn(scene, sound, transformValue(duration), endVolume, startVolume)) as FadeIn;
}