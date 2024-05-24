import BattleScene from "../battle-scene";
import Pokemon from "./pokemon";
import * as Utils from "../utils";

export default class PokemonSpriteSparkleHandler {
  private sprites: Set<Phaser.GameObjects.Sprite>;

  setup(scene: BattleScene): void {
    this.sprites = new Set();

    scene.tweens.addCounter({
      duration: Utils.fixedInt(200),
      from: 0,
      to: 1,
      yoyo: true,
      repeat: -1,
      onRepeat: () => this.onLapse()
    });
  }

  onLapse(): void {
    Array.from(this.sprites.values()).filter(s => !s.scene).map(s => this.sprites.delete(s));
    for (const s of this.sprites.values()) {
      if (!s.pipelineData["teraColor"] || !(s.pipelineData["teraColor"] as number[]).find(c => c)) {
        continue;
      }
      if (!s.visible || (s.parentContainer instanceof Pokemon && !s.parentContainer.parentContainer)) {
        continue;
      }
      const pokemon = s.parentContainer instanceof Pokemon ? s.parentContainer as Pokemon : null;
      const parent = (pokemon || s).parentContainer;
      const texture = s.texture;
      const [ width, height ] = [ texture.source[0].width, texture.source[0].height ];
      const [ pixelX, pixelY ] = [ Utils.randInt(width), Utils.randInt(height) ];
      const ratioX = s.width / width;
      const ratioY = s.height / height;
      const pixel = texture.manager.getPixel(pixelX, pixelY, texture.key, "__BASE");
      if (pixel.alpha) {
        const [ xOffset, yOffset ] = [ -s.originX * s.width, -s.originY * s.height];
        const sparkle = (s.scene as BattleScene).addFieldSprite(((pokemon?.x || 0) + s.x + pixelX * ratioX + xOffset), ((pokemon?.y || 0) + s.y + pixelY * ratioY + yOffset), "tera_sparkle");
        sparkle.pipelineData["ignoreTimeTint"] = s.pipelineData["ignoreTimeTint"];
        sparkle.play("tera_sparkle");
        parent.add(sparkle);
        s.scene.time.delayedCall(Utils.fixedInt(Math.floor((1000 / 12) * 13)), () => sparkle.destroy());
      }
    }
  }

  add(sprites: Phaser.GameObjects.Sprite | Phaser.GameObjects.Sprite[]): void {
    if (!Array.isArray(sprites)) {
      sprites = [ sprites ];
    }
    for (const s of sprites) {
      if (this.sprites.has(s)) {
        continue;
      }
      this.sprites.add(s);
    }
  }

  remove(sprites: Phaser.GameObjects.Sprite | Phaser.GameObjects.Sprite[]): void {
    if (!Array.isArray(sprites)) {
      sprites = [ sprites ];
    }
    for (const s of sprites) {
      this.sprites.delete(s);
    }
  }

  removeAll(): void {
    for (const s of this.sprites.values()) {
      this.sprites.delete(s);
    }
  }
}
