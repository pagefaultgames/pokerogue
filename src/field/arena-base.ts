import { globalScene } from "#app/global-scene";
import type { BiomeId } from "#enums/biome-id";
import { getBiomeHasProps, getBiomeKey } from "#field/arena";
import { randSeedInt } from "#utils/common";

// TODO: this needs documentation
export class ArenaBase extends Phaser.GameObjects.Container {
  public player: boolean;
  public biome: BiomeId;
  public propValue: number;
  public base: Phaser.GameObjects.Sprite;
  public props: Phaser.GameObjects.Sprite[];

  constructor(player: boolean) {
    super(globalScene, 0, 0);

    this.player = player;

    this.base = globalScene.addFieldSprite(0, 0, "plains_a", undefined, 1);
    this.base.setOrigin(0, 0);

    this.props = [];
    if (!player) {
      for (let i = 0; i < 3; i++) {
        const ret = globalScene.addFieldSprite(0, 0, "plains_b", undefined, 1);
        ret.setOrigin(0, 0);
        ret.setVisible(false);
        this.props.push(ret);
      }
    }
  }

  setBiome(biome: BiomeId, propValue?: number): void {
    const hasProps = getBiomeHasProps(biome);
    const biomeKey = getBiomeKey(biome);
    const baseKey = `${biomeKey}_${this.player ? "a" : "b"}`;

    if (biome !== this.biome) {
      this.base.setTexture(baseKey);

      if (this.base.texture.frameTotal > 1) {
        const baseFrameNames = globalScene.anims.generateFrameNames(baseKey, {
          zeroPad: 4,
          suffix: ".png",
          start: 1,
          end: this.base.texture.frameTotal - 1,
        });
        if (!globalScene.anims.exists(baseKey)) {
          globalScene.anims.create({
            key: baseKey,
            frames: baseFrameNames,
            frameRate: 12,
            repeat: -1,
          });
        }
        this.base.play(baseKey);
      } else {
        this.base.stop();
      }

      this.add(this.base);
    }

    if (!this.player) {
      globalScene.executeWithSeedOffset(
        () => {
          this.propValue = propValue === undefined ? (hasProps ? randSeedInt(8) : 0) : propValue;
          this.props.forEach((prop, p) => {
            const propKey = `${biomeKey}_b${hasProps ? `_${p + 1}` : ""}`;
            prop.setTexture(propKey);

            if (hasProps && prop.texture.frameTotal > 1) {
              const propFrameNames = globalScene.anims.generateFrameNames(propKey, {
                zeroPad: 4,
                suffix: ".png",
                start: 1,
                end: prop.texture.frameTotal - 1,
              });
              if (!globalScene.anims.exists(propKey)) {
                globalScene.anims.create({
                  key: propKey,
                  frames: propFrameNames,
                  frameRate: 12,
                  repeat: -1,
                });
              }
              prop.play(propKey);
            } else {
              prop.stop();
            }

            prop.setVisible(hasProps && !!(this.propValue & (1 << p)));
            this.add(prop);
          });
        },
        globalScene.currentBattle?.waveIndex || 0,
        globalScene.waveSeed,
      );
    }
  }
}
