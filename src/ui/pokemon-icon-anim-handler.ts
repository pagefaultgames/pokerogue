import BattleScene from "../battle-scene";
import * as Utils from "../utils";

export enum PokemonIconAnimMode {
  NONE,
  PASSIVE,
  ACTIVE
}

export default class PokemonIconAnimHandler {
  private icons: Map<Phaser.GameObjects.Container, PokemonIconAnimMode>;
  private toggled: boolean;

  setup(scene: BattleScene): void {
    this.icons = new Map();
    this.toggled = false;

    const onAlternate = (tween: Phaser.Tweens.Tween) => {
      const value = tween.getValue();
      this.toggled = !!value;
      for (let i of this.icons.keys())
          i.y += this.getModeYDelta(this.icons.get(i)) * (this.toggled ? 1 : -1);
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

  addOrUpdate(icons: Phaser.GameObjects.Container | Phaser.GameObjects.Container[], mode: PokemonIconAnimMode): void {
    if (!Array.isArray(icons))
      icons = [ icons ];
    for (let i of icons) {
      if (this.icons.has(i) && this.icons.get(i) === mode)
        continue;
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

  remove(icons: Phaser.GameObjects.Container | Phaser.GameObjects.Container[]): void {
    if (!Array.isArray(icons))
      icons = [ icons ];
    for (let i of icons) {
      if (this.toggled)
        i.y -= this.getModeYDelta(this.icons.get(i));
      this.icons.delete(i);
    }
  }

  removeAll(): void {
    for (let i of this.icons.keys()) {
      if (this.toggled)
        i.y -= this.getModeYDelta(this.icons.get(i));
      this.icons.delete(i);
    }
  }
}