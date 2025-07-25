import { globalScene } from "#app/global-scene";
import { coerceArray, fixedInt } from "#utils/common";

export enum PokemonIconAnimMode {
  NONE,
  PASSIVE,
  ACTIVE,
}

type PokemonIcon = Phaser.GameObjects.Container | Phaser.GameObjects.Sprite;

export class PokemonIconAnimHandler {
  private icons: Map<PokemonIcon, PokemonIconAnimMode>;
  private toggled: boolean;

  setup(): void {
    this.icons = new Map();
    this.toggled = false;

    const onAlternate = (tween: Phaser.Tweens.Tween) => {
      const value = tween.getValue();
      this.toggled = !!value;
      for (const i of this.icons.keys()) {
        const icon = this.icons.get(i);
        const delta = icon ? this.getModeYDelta(icon) : 0;
        i.y += delta * (this.toggled ? 1 : -1);
      }
    };
    globalScene.tweens.addCounter({
      duration: fixedInt(200),
      from: 0,
      to: 1,
      yoyo: true,
      repeat: -1,
      onRepeat: onAlternate,
      onYoyo: onAlternate,
    });
  }

  getModeYDelta(mode: PokemonIconAnimMode): number {
    switch (mode) {
      case PokemonIconAnimMode.NONE:
        return 0;
      case PokemonIconAnimMode.PASSIVE:
        return -1;
      case PokemonIconAnimMode.ACTIVE:
        return -2;
    }
  }

  addOrUpdate(icons: PokemonIcon | PokemonIcon[], mode: PokemonIconAnimMode): void {
    icons = coerceArray(icons);
    for (const i of icons) {
      if (this.icons.has(i) && this.icons.get(i) === mode) {
        continue;
      }
      if (this.toggled) {
        const lastYDelta = this.icons.has(i) ? this.icons.get(i)! : 0;
        const yDelta = this.getModeYDelta(mode);
        i.y += yDelta + lastYDelta;
      }
      this.icons.set(i, mode);
    }
  }

  remove(icons: PokemonIcon | PokemonIcon[]): void {
    icons = coerceArray(icons);
    for (const i of icons) {
      if (this.toggled) {
        const icon = this.icons.get(i);
        const delta = icon ? this.getModeYDelta(icon) : 0;
        i.y -= delta;
      }
      this.icons.delete(i);
    }
  }

  removeAll(): void {
    for (const i of this.icons.keys()) {
      if (this.toggled) {
        const icon = this.icons.get(i);
        const delta = icon ? this.getModeYDelta(icon) : 0;
        i.y -= delta;
      }
      this.icons.delete(i);
    }
  }
}
