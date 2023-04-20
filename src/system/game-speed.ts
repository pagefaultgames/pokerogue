import BattleScene from "../battle-scene";
import * as Utils from "../utils";

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
}