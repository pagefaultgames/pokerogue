import { globalScene } from "#app/global-scene";
import { PokemonIconAnimMode } from "#enums/pokemon-icon-anim-mode";
import { coerceArray } from "#utils/array";
import { fixedInt } from "#utils/common";

type PokemonIcon = Phaser.GameObjects.Container | Phaser.GameObjects.Sprite;

interface IconState {
  mode: PokemonIconAnimMode;
  restY: number;
}

/**
 * A helper class to handle icon animations in different menus (party, starter select, etc).
 * @remarks
 * How to use: \
 * `icons` is a list of {@linkcode PokemonIcon}s, to each of which we associate a mode, and register the Y coordinate at rest. \
 * The handler contains two global tweens: one for idle animation (oscillation up and down) and one for a jumping animation. \
 * Calling `addOrUpdate` on a `PokemonIcon` (or list of icons) assigns an {@linkcode PokemonIconAnimMode | animation mode}:
 * - `NONE`: no animation, icon does not move.
 * - `PASSIVE`: idle animation, with a small oscillation amplitude.
 * - `ACTIVE`: idle animation, with a larger oscillation amplitude.
 * - `JUMP`: jumping animation (the icons will move up quickly, with a long interval in between).
 */
export class PokemonIconAnimHelper {
  private readonly icons: Map<PokemonIcon, IconState> = new Map();

  private toggled = false;

  constructor() {
    // Existing passive/active animation.
    const onAlternate = (tween: Phaser.Tweens.Tween) => {
      this.toggled = !!tween.getValue();

      for (const [icon, state] of this.icons) {
        icon.y = state.restY + this.getCurrentOffset(state.mode);
      }
    };

    // Idle up and down animation.
    globalScene.tweens.addCounter({
      duration: fixedInt(200),
      from: 0,
      to: 1,
      yoyo: true,
      repeat: -1,
      onRepeat: onAlternate,
      onYoyo: onAlternate,
    });

    // Jumping animation.
    globalScene.tweens.chain({
      targets: this,
      loop: -1,
      loopDelay: fixedInt(1000),
      tweens: [
        {
          targets: this,
          jumpOffset: -5,
          duration: fixedInt(125),
          ease: "Cubic.easeOut",
          yoyo: true,
          onUpdate: () => {
            this.updateJumpIcons();
          },
        },
        {
          targets: this,
          jumpOffset: -3,
          duration: fixedInt(150),
          ease: "Cubic.easeOut",
          yoyo: true,
          onUpdate: () => {
            this.updateJumpIcons();
          },
        },
      ],
    });
  }

  private getCurrentOffset(mode: PokemonIconAnimMode): number {
    switch (mode) {
      case PokemonIconAnimMode.PASSIVE:
        return this.toggled ? -1 : 0;

      case PokemonIconAnimMode.ACTIVE:
        return this.toggled ? -2 : 0;

      case PokemonIconAnimMode.JUMP:
      case PokemonIconAnimMode.NONE:
        return 0;
    }
  }

  private updateJumpIcons(): void {
    for (const [icon, state] of this.icons) {
      icon.y = state.restY + this.getCurrentOffset(state.mode);
    }
  }

  public addOrUpdate(icons: PokemonIcon | PokemonIcon[], mode: PokemonIconAnimMode): void {
    icons = coerceArray(icons);

    for (const icon of icons) {
      const existing = this.icons.get(icon);

      if (existing?.mode === mode) {
        continue;
      }

      const restY = existing?.restY ?? icon.y;

      const state: IconState = { mode, restY };

      this.icons.set(icon, state);

      icon.y = restY + this.getCurrentOffset(mode);
    }
  }

  public removeAll(): void {
    for (const [icon, state] of this.icons) {
      icon.y = state.restY;
    }

    this.icons.clear();
  }
}
