import type { AnyFn } from "#types/type-helpers";
import type { FixedInt } from "#utils/common";
import "phaser";

/**
 * A Timer Event represents a delayed function call. \
 * It's managed by a Scene's {@linkcode Phaser.Time.Clock | Clock} and will call its function after a set amount of time has passed. \
 * The Timer Event can optionally repeat - i.e. call its function multiple times before finishing, or loop indefinitely.
 *
 * Because it's managed by a Clock, a Timer Event is based on game time, \
 * will be affected by its Clock's time scale, and will pause if its Clock pauses.
 */
interface TimerEventFixedInt extends Phaser.Time.TimerEvent {
  readonly delay: number | FixedInt;
}

interface TimerEventConfigFixedInt extends Phaser.Types.Time.TimerEventConfig {
  delay?: number | FixedInt;
}

interface NumberTweenBuilderConfigFixedInt extends Phaser.Types.Tweens.NumberTweenBuilderConfig {
  delay?: number | FixedInt;
  duration?: number | FixedInt;
  hold?: number | FixedInt;
  repeatDelay?: number | FixedInt;
  completeDelay?: string | number | AnyFn | object | any[] | FixedInt;
  loopDelay?: string | number | AnyFn | object | any[] | FixedInt;
}

export interface TweenBuilderConfigFixedInt extends Phaser.Types.Tweens.TweenBuilderConfig {
  delay?: number | AnyFn | FixedInt;
  duration?: number | FixedInt;
  hold?: number | FixedInt;
  repeatDelay?: number | FixedInt;
  completeDelay?: string | number | AnyFn | object | any[] | FixedInt;
  loopDelay?: string | number | AnyFn | object | any[] | FixedInt;
}

export interface TweenChainBuilderConfigFixedInt extends Phaser.Types.Tweens.TweenChainBuilderConfig {
  delay?: number | AnyFn | FixedInt;
  completeDelay?: string | number | AnyFn | object | any[] | FixedInt;
  loopDelay?: string | number | AnyFn | object | any[] | FixedInt;
  tweens?: (Phaser.Types.Tweens.TweenBuilderConfig | TweenBuilderConfigFixedInt)[];
}

/**
 * A Tween is able to manipulate the properties of one or more objects to any given value,
 * based on a duration and type of ease. \
 * They are rarely instantiated directly and instead should be created via the TweenManager.
 *
 * Please note that a Tween will not manipulate any property that begins with an underscore.
 */
interface TweenFixedInt extends Phaser.Tweens.Tween {
  duration: number | FixedInt;
}

declare module "phaser" {
  namespace Math {
    interface RandomDataGenerator {
      pick<T>(array: ArrayLike<T>): T;
      weightedPick<T>(array: ArrayLike<T>): T;
    }
  }

  namespace Input {
    namespace Gamepad {
      interface GamepadPlugin {
        /**
         * Refreshes the list of connected Gamepads.
         * This is called automatically when a gamepad is connected or disconnected, and during the update loop.
         */
        refreshPads(): void;
      }
    }
  }

  namespace Time {
    interface Clock {
      addEvent(config: TimerEventFixedInt | TimerEventConfigFixedInt): Phaser.Time.TimerEvent;
      delayedCall(delay: number | FixedInt, callback: AnyFn, args?: any[], callbackScope?: any): Phaser.Time.TimerEvent;
    }
  }

  namespace Tweens {
    interface TweenManager {
      add(
        config:
          | TweenBuilderConfigFixedInt
          | TweenChainBuilderConfigFixedInt
          | TweenFixedInt
          | Phaser.Types.Tweens.TweenBuilderConfig
          | Phaser.Types.Tweens.TweenChainBuilderConfig
          | Phaser.Tweens.Tween
          | Phaser.Tweens.TweenChain,
      ): Phaser.Tweens.Tween;
      addCounter(config: NumberTweenBuilderConfigFixedInt): Phaser.Tweens.Tween;
      addMultiple(configs: TweenBuilderConfigFixedInt[] | object[]): Phaser.Tweens.Tween[];
      chain(tweens: TweenChainBuilderConfigFixedInt | object): Phaser.Tweens.TweenChain;
    }
  }
}
