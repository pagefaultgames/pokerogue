import BattleScene from "./battle-scene";
import { TrainerConfig, TrainerType, trainerConfigs } from "./data/trainer-type";
import * as Utils from "./utils";

export default class Trainer extends Phaser.GameObjects.Container {
  public config: TrainerConfig;
  public female: boolean;

  constructor(scene: BattleScene, trainerType: TrainerType, female?: boolean) {
    super(scene, -72, 80);
    this.config = trainerConfigs[trainerType];
    this.female = female;

    const getSprite = (hasShadow?: boolean) => {
      const ret = this.scene.add.sprite(0, 0, this.getKey());
      ret.setOrigin(0.5, 1);
      ret.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], hasShadow: !!hasShadow });
      return ret;
    };
    
    const sprite = getSprite(true);
    const tintSprite = getSprite();

    tintSprite.setVisible(false);

    this.add(sprite);
    this.add(tintSprite);
  }

  getKey(): string {
    return this.config.getKey(this.female);
  }

  getName(): string {
    return this.config.getName();
  }

  getNextSummonIndex(): integer {
    const party = this.scene.getEnemyParty();
    const nonFaintedPartyMembers = party.slice(this.scene.currentBattle.getBattlerCount()).filter(p => !p.isFainted());
    const partyMemberScores = nonFaintedPartyMembers.map(p => {
      const playerField = this.scene.getPlayerField();
      let score = 0;
      for (let playerPokemon of playerField)
        score += p.getMatchupScore(playerPokemon);
      score /= playerField.length;
      return [ party.indexOf(p), score ];
    });

    const sortedPartyMemberScores = partyMemberScores.slice(0);
    sortedPartyMemberScores.sort((a, b) => {
      const scoreA = a[1];
      const scoreB = b[1];
      return scoreA < scoreB ? 1 : scoreA > scoreB ? -1 : 0;
    });

    const maxScorePartyMemberIndexes = partyMemberScores.filter(pms => pms[1] === sortedPartyMemberScores[0][1]).map(pms => pms[0]);
    return maxScorePartyMemberIndexes[Utils.randInt(maxScorePartyMemberIndexes.length)];
  }

  loadAssets(): Promise<void> {
    return this.config.loadAssets(this.scene, this.female);
  }

  playAnim(): void {
    const trainerAnimConfig = {
      key: this.scene.currentBattle.trainer.getKey(),
      repeat: 0
    };
    this.getSprite().play(trainerAnimConfig);
    this.getTintSprite().play(trainerAnimConfig);
  }

  getSprite(): Phaser.GameObjects.Sprite {
    return this.getAt(0) as Phaser.GameObjects.Sprite;
  }

  getTintSprite(): Phaser.GameObjects.Sprite {
    return this.getAt(1) as Phaser.GameObjects.Sprite;
  }

  tint(color: number, alpha?: number, duration?: integer, ease?: string): void {
    const tintSprite = this.getTintSprite();
    tintSprite.setTintFill(color);
    tintSprite.setVisible(true);

    if (duration) {
      tintSprite.setAlpha(0);

      this.scene.tweens.add({
        targets: tintSprite,
        alpha: alpha || 1,
        duration: duration,
        ease: ease || 'Linear'
      });
    } else
      tintSprite.setAlpha(alpha);
  }

  untint(duration: integer, ease?: string): void {
    const tintSprite = this.getTintSprite();

    if (duration) {
      this.scene.tweens.add({
        targets: tintSprite,
        alpha: 0,
        duration: duration,
        ease: ease || 'Linear',
        onComplete: () => {
          tintSprite.setVisible(false);
          tintSprite.setAlpha(1);
        }
      });
    } else {
      tintSprite.setVisible(false);
      tintSprite.setAlpha(1);
    }
  }
}


export default interface Trainer {
  scene: BattleScene
}