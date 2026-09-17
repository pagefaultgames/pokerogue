import { globalScene } from "#app/global-scene";
import { Pokemon } from "#field/pokemon";
import { fixedInt, randInt } from "#utils/common";

export class PokemonSpriteTeraSparkleHandler {
  private sprites: Set<Phaser.GameObjects.Sprite>;

  private counterTween?: Phaser.Tweens.Tween | undefined;

  public setup(): this {
    this.sprites = new Set();

    this.counterTween = globalScene.tweens.addCounter({
      duration: fixedInt(200),
      from: 0,
      to: 1,
      yoyo: true,
      repeat: -1,
      onRepeat: () => this.onLapse(),
    });

    return this;
  }

  private onLapse(): void {
    for (const sprite of this.sprites.values()) {
      if (!sprite.scene) {
        this.sprites.delete(sprite);
      }
    }

    for (const s of this.sprites.values()) {
      const teraColorData: number[] | undefined = s.pipelineData["teraColor"];
      if (!teraColorData?.some(c => c)) {
        continue;
      }
      if (!s.visible || (s.parentContainer instanceof Pokemon && !s.parentContainer.parentContainer)) {
        continue;
      }
      if (!(s.parentContainer instanceof Pokemon) || !(s.parentContainer as Pokemon).isTerastallized) {
        continue;
      }

      const pokemon = s.parentContainer instanceof Pokemon ? (s.parentContainer as Pokemon) : null;
      const parent = (pokemon || s).parentContainer;
      const texture = s.texture;
      const { width, height } = texture.source[0];
      const pixelX = randInt(width);
      const pixelY = randInt(height);
      const ratioX = s.width / width;
      const ratioY = s.height / height;
      const pixel = texture.manager.getPixel(pixelX, pixelY, texture.key, "__BASE");

      if (pixel?.alpha) {
        const xOffset = -s.originX * s.width;
        const yOffset = -s.originY * s.height;
        const sparkle = globalScene.addFieldSprite(
          (pokemon?.x ?? 0) + s.x + pixelX * ratioX + xOffset,
          (pokemon?.y ?? 0) + s.y + pixelY * ratioY + yOffset,
          "tera_sparkle",
        );

        sparkle.pipelineData["ignoreTimeTint"] = s.pipelineData["ignoreTimeTint"];
        sparkle.setName("sprite-tera-sparkle");
        sparkle.play("tera_sparkle");
        parent.add(sparkle);
        s.scene.time.delayedCall(fixedInt(Math.floor((1000 / 12) * 13)), () => sparkle.destroy());
      }
    }
  }

  public add(...sprites: Phaser.GameObjects.Sprite[]): void {
    for (const s of sprites) {
      if (this.sprites.has(s)) {
        continue;
      }
      this.sprites.add(s);
    }
  }

  public remove(...sprites: Phaser.GameObjects.Sprite[]): void {
    for (const s of sprites) {
      this.sprites.delete(s);
    }
  }

  public removeAll(): void {
    for (const s of this.sprites.values()) {
      this.sprites.delete(s);
    }
  }

  public destroy(): void {
    this.removeAll();
    if (this.counterTween) {
      this.counterTween.destroy();
      this.counterTween = undefined;
    }
  }
}
