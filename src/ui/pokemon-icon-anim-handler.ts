import BattleScene from "../battle-scene";
import * as Utils from "../utils";

export enum PokemonIconAnimMode {
  NONE,
  PASSIVE,
  ACTIVE
}

type PokemonIcon = Phaser.GameObjects.Container | Phaser.GameObjects.Sprite;

export default class PokemonIconAnimHandler {
  private icons: Map<PokemonIcon, PokemonIconAnimMode>;
  private toggled: boolean;

  setup(scene: BattleScene): void {
    this.icons = new Map();
    this.toggled = false;

    const onAlternate = (tween: Phaser.Tweens.Tween) => {
      const value = tween.getValue();
      this.toggled = !!value;
      for (const i of this.icons.keys()) {
        i.y += this.getModeYDelta(this.icons.get(i)) * (this.toggled ? 1 : -1);
      }
    };
    scene.tweens.addCounter({
      duration: Utils.fixedInt(200),
      from: 0,
      to: 1,
      yoyo: true,
      repeat: -1,
      onRepeat: onAlternate,
      onYoyo: onAlternate
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
    if (!Array.isArray(icons)) {
      icons = [ icons ];
    }
    for (const i of icons) {
      if (this.icons.has(i) && this.icons.get(i) === mode) {
        continue;
      }
      if (this.toggled) {
        const lastYDelta = this.icons.has(i)
          ? this.icons.get(i)
          : 0;
        const yDelta = this.getModeYDelta(mode);
        i.y += yDelta + lastYDelta;
      }
      this.icons.set(i, mode);
    }
  }

  remove(icons: PokemonIcon | PokemonIcon[]): void {
    if (!Array.isArray(icons)) {
      icons = [ icons ];
    }
    for (const i of icons) {
      if (this.toggled) {
        i.y -= this.getModeYDelta(this.icons.get(i));
      }
      this.icons.delete(i);
    }
  }

  removeAll(): void {
    for (const i of this.icons.keys()) {
      if (this.toggled) {
        i.y -= this.getModeYDelta(this.icons.get(i));
      }
      this.icons.delete(i);
    }
  }
}
