import { globalScene } from "#app/global-scene";
import { coerceArray } from "#utils/array";
import { fixedInt } from "#utils/common";

export enum PokemonIconAnimMode {
  NONE,
  PASSIVE,
  ACTIVE,
  JUMP,
}

type PokemonIcon = Phaser.GameObjects.Container | Phaser.GameObjects.Sprite;

interface IconState {
  mode: PokemonIconAnimMode;
  restY: number;
}

/**
 * A helper class to handle icon animations in different menus (party, starter select, etc)
 * How to use:
 * `icons` is a list of {@linkcode PokemonIcon}, to each of which we associate a mode, and register the Y coordinate at rest.
 * The handler contains two global tweens: one for idle animation (oscillation up and down) and one for a jumping animation.
 * Calling `addOrUpdate` on a {@linkcode PokemonIcon} (or list of icons) assigns an animation mode:
 * - NONE: no animation, icon does not move.
 * - PASSIVE: idle animation, with a small oscillation amplitude.
 * - ACTIVE: idle animation, with a larger oscillation amplitude.
 * - JUMP: jumping animation (the icons will move up quickly, with a long interval in between).
 */
export class PokemonIconAnimHelper {
  private icons!: Map<PokemonIcon, IconState>;

  private toggled = false;
  private jumpOffset = 0;

  setup(): void {
    this.icons = new Map();
    this.toggled = false;
    this.jumpOffset = 0;

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
        return this.jumpOffset;

      case PokemonIconAnimMode.NONE:
      default:
        return 0;
    }
  }

  private updateJumpIcons(): void {
    for (const [icon, state] of this.icons) {
      icon.y = state.restY + this.getCurrentOffset(state.mode);
    }
  }

  addOrUpdate(icons: PokemonIcon | PokemonIcon[], mode: PokemonIconAnimMode): void {
    icons = coerceArray(icons);

    for (const icon of icons) {
      const existing = this.icons.get(icon);

      if (existing?.mode === mode) {
        continue;
      }

      const restY = existing?.restY ?? icon.y;

      const state: IconState = {
        mode,
        restY,
      };

      this.icons.set(icon, state);

      icon.y = restY + this.getCurrentOffset(mode);
    }
  }

  remove(icons: PokemonIcon | PokemonIcon[]): void {
    icons = coerceArray(icons);

    for (const icon of icons) {
      const state = this.icons.get(icon);

      if (!state) {
        continue;
      }

      icon.y = state.restY;
      this.icons.delete(icon);
    }
  }

  removeAll(): void {
    for (const [icon, state] of this.icons) {
      icon.y = state.restY;
    }

    this.icons.clear();
  }
}
