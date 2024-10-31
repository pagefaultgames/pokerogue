import { gScene } from "#app/battle-scene";
import { SubstituteTag } from "#app/data/battler-tags";
import { PokemonAnimType } from "#enums/pokemon-anim-type";
import Pokemon from "#app/field/pokemon";
import { BattlePhase } from "#app/phases/battle-phase";


export class PokemonAnimPhase extends BattlePhase {
  /** The type of animation to play in this phase */
  private key: PokemonAnimType;
  /** The Pokemon to which this animation applies */
  private pokemon: Pokemon;
  /** Any other field sprites affected by this animation */
  private fieldAssets: Phaser.GameObjects.Sprite[];

  constructor(key: PokemonAnimType, pokemon: Pokemon, fieldAssets?: Phaser.GameObjects.Sprite[]) {
    super();

    this.key = key;
    this.pokemon = pokemon;
    this.fieldAssets = fieldAssets ?? [];
  }

  start(): void {
    super.start();

    switch (this.key) {
      case PokemonAnimType.SUBSTITUTE_ADD:
        this.doSubstituteAddAnim();
        break;
      case PokemonAnimType.SUBSTITUTE_PRE_MOVE:
        this.doSubstitutePreMoveAnim();
        break;
      case PokemonAnimType.SUBSTITUTE_POST_MOVE:
        this.doSubstitutePostMoveAnim();
        break;
      case PokemonAnimType.SUBSTITUTE_REMOVE:
        this.doSubstituteRemoveAnim();
        break;
      default:
        this.end();
    }
  }

  doSubstituteAddAnim(): void {
    const substitute = this.pokemon.getTag(SubstituteTag);
    if (substitute === null) {
      return this.end();
    }

    const getSprite = () => {
      const sprite = gScene.addFieldSprite(
        this.pokemon.x + this.pokemon.getSprite().x,
        this.pokemon.y + this.pokemon.getSprite().y,
        `pkmn${this.pokemon.isPlayer() ? "__back" : ""}__sub`
      );
      sprite.setOrigin(0.5, 1);
      gScene.field.add(sprite);
      return sprite;
    };

    const [ subSprite, subTintSprite ] = [ getSprite(), getSprite() ];
    const subScale = this.pokemon.getSpriteScale() * (this.pokemon.isPlayer() ? 0.5 : 1);

    subSprite.setVisible(false);
    subSprite.setScale(subScale);
    subTintSprite.setTintFill(0xFFFFFF);
    subTintSprite.setScale(0.01);

    if (this.pokemon.isPlayer()) {
      gScene.field.bringToTop(this.pokemon);
    }

    gScene.playSound("PRSFX- Transform");

    gScene.tweens.add({
      targets: this.pokemon,
      duration: 500,
      x: this.pokemon.x + this.pokemon.getSubstituteOffset()[0],
      y: this.pokemon.y + this.pokemon.getSubstituteOffset()[1],
      alpha: 0.5,
      ease: "Sine.easeIn"
    });

    gScene.tweens.add({
      targets: subTintSprite,
      delay: 250,
      scale: subScale,
      ease: "Cubic.easeInOut",
      duration: 500,
      onComplete: () => {
        subSprite.setVisible(true);
        gScene.tweens.add({
          targets: subTintSprite,
          delay: 250,
          alpha: 0,
          ease: "Cubic.easeOut",
          duration: 1000,
          onComplete: () => {
            subTintSprite.destroy();
            substitute.sprite = subSprite;
            this.end();
          }
        });
      }
    });
  }

  doSubstitutePreMoveAnim(): void {
    if (this.fieldAssets.length !== 1) {
      return this.end();
    }

    const subSprite = this.fieldAssets[0];
    if (subSprite === undefined) {
      return this.end();
    }

    gScene.tweens.add({
      targets: subSprite,
      alpha: 0,
      ease: "Sine.easeInOut",
      duration: 500
    });

    gScene.tweens.add({
      targets: this.pokemon,
      x: subSprite.x,
      y: subSprite.y,
      alpha: 1,
      ease: "Sine.easeInOut",
      delay: 250,
      duration: 500,
      onComplete: () => this.end()
    });
  }

  doSubstitutePostMoveAnim(): void {
    if (this.fieldAssets.length !== 1) {
      return this.end();
    }

    const subSprite = this.fieldAssets[0];
    if (subSprite === undefined) {
      return this.end();
    }

    gScene.tweens.add({
      targets: this.pokemon,
      x: subSprite.x + this.pokemon.getSubstituteOffset()[0],
      y: subSprite.y + this.pokemon.getSubstituteOffset()[1],
      alpha: 0.5,
      ease: "Sine.easeInOut",
      duration: 500
    });

    gScene.tweens.add({
      targets: subSprite,
      alpha: 1,
      ease: "Sine.easeInOut",
      delay: 250,
      duration: 500,
      onComplete: () => this.end()
    });
  }

  doSubstituteRemoveAnim(): void {
    if (this.fieldAssets.length !== 1) {
      return this.end();
    }

    const subSprite = this.fieldAssets[0];
    if (subSprite === undefined) {
      return this.end();
    }

    const getSprite = () => {
      const sprite = gScene.addFieldSprite(
        subSprite.x,
        subSprite.y,
        `pkmn${this.pokemon.isPlayer() ? "__back" : ""}__sub`
      );
      sprite.setOrigin(0.5, 1);
      gScene.field.add(sprite);
      return sprite;
    };

    const subTintSprite = getSprite();
    const subScale = this.pokemon.getSpriteScale() * (this.pokemon.isPlayer() ? 0.5 : 1);
    subTintSprite.setAlpha(0);
    subTintSprite.setTintFill(0xFFFFFF);
    subTintSprite.setScale(subScale);

    gScene.tweens.add({
      targets: subTintSprite,
      alpha: 1,
      ease: "Sine.easeInOut",
      duration: 500,
      onComplete: () => {
        subSprite.destroy();
        const flashTimer = gScene.time.addEvent({
          delay: 100,
          repeat: 7,
          startAt: 200,
          callback: () => {
            gScene.playSound("PRSFX- Substitute2.wav");

            subTintSprite.setVisible(flashTimer.repeatCount % 2 === 0);
            if (!flashTimer.repeatCount) {
              gScene.tweens.add({
                targets: subTintSprite,
                scale: 0.01,
                ease: "Sine.cubicEaseIn",
                duration: 500
              });

              gScene.tweens.add({
                targets: this.pokemon,
                x: this.pokemon.x - this.pokemon.getSubstituteOffset()[0],
                y: this.pokemon.y - this.pokemon.getSubstituteOffset()[1],
                alpha: 1,
                ease: "Sine.easeInOut",
                delay: 250,
                duration: 500,
                onComplete: () => {
                  subTintSprite.destroy();
                  this.end();
                }
              });
            }
          }
        });
      }
    });
  }
}
