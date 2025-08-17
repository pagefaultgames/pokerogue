import { globalScene } from "#app/global-scene";
import { SubstituteTag } from "#data/battler-tags";
import { PokemonAnimType } from "#enums/pokemon-anim-type";
import { SpeciesId } from "#enums/species-id";
import type { Pokemon } from "#field/pokemon";
import { BattlePhase } from "#phases/battle-phase";
import { isNullOrUndefined } from "#utils/common";

export class PokemonAnimPhase extends BattlePhase {
  public readonly phaseName = "PokemonAnimPhase";
  /** The type of animation to play in this phase */
  protected key: PokemonAnimType;
  /** The Pokemon to which this animation applies */
  protected pokemon: Pokemon;
  /** Any other field sprites affected by this animation */
  protected fieldAssets: Phaser.GameObjects.Sprite[];

  constructor(key: PokemonAnimType, pokemon: Pokemon, fieldAssets: Phaser.GameObjects.Sprite[] = []) {
    super();

    this.key = key;
    this.pokemon = pokemon;
    this.fieldAssets = fieldAssets;
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
      case PokemonAnimType.COMMANDER_APPLY:
        this.doCommanderApplyAnim();
        break;
      case PokemonAnimType.COMMANDER_REMOVE:
        this.doCommanderRemoveAnim();
        break;
      default:
        this.end();
    }
  }

  private doSubstituteAddAnim(): void {
    const substitute = this.pokemon.getTag(SubstituteTag);
    if (isNullOrUndefined(substitute)) {
      this.end();
      return;
    }

    const getSprite = () => {
      const sprite = globalScene.addFieldSprite(
        this.pokemon.x + this.pokemon.getSprite().x,
        this.pokemon.y + this.pokemon.getSprite().y,
        `pkmn${this.pokemon.isPlayer() ? "__back" : ""}__sub`,
      );
      sprite.setOrigin(0.5, 1);
      globalScene.field.add(sprite);
      return sprite;
    };

    const [subSprite, subTintSprite] = [getSprite(), getSprite()];
    const subScale = this.pokemon.getSpriteScale() * (this.pokemon.isPlayer() ? 0.5 : 1);

    subSprite.setVisible(false);
    subSprite.setScale(subScale);
    subTintSprite.setTintFill(0xffffff);
    subTintSprite.setScale(0.01);

    if (this.pokemon.isPlayer()) {
      globalScene.field.bringToTop(this.pokemon);
    }

    globalScene.playSound("PRSFX- Transform");

    globalScene.tweens.add({
      targets: this.pokemon,
      duration: 500,
      x: this.pokemon.x + this.pokemon.getSubstituteOffset()[0],
      y: this.pokemon.y + this.pokemon.getSubstituteOffset()[1],
      alpha: 0.5,
      ease: "Sine.easeIn",
    });

    globalScene.tweens.add({
      targets: subTintSprite,
      delay: 250,
      scale: subScale,
      ease: "Cubic.easeInOut",
      duration: 500,
      onComplete: () => {
        subSprite.setVisible(true);
        globalScene.tweens.add({
          targets: subTintSprite,
          delay: 250,
          alpha: 0,
          ease: "Cubic.easeOut",
          duration: 1000,
          onComplete: () => {
            subTintSprite.destroy();
            substitute.sprite = subSprite;
            this.end();
          },
        });
      },
    });
  }

  private doSubstitutePreMoveAnim(): void {
    if (this.fieldAssets.length !== 1) {
      this.end();
      return;
    }

    const subSprite = this.fieldAssets[0];
    if (subSprite === undefined) {
      this.end();
      return;
    }

    globalScene.tweens.add({
      targets: subSprite,
      alpha: 0,
      ease: "Sine.easeInOut",
      duration: 500,
    });

    globalScene.tweens.add({
      targets: this.pokemon,
      x: subSprite.x,
      y: subSprite.y,
      alpha: 1,
      ease: "Sine.easeInOut",
      delay: 250,
      duration: 500,
      onComplete: () => this.end(),
    });
  }

  private doSubstitutePostMoveAnim(): void {
    if (this.fieldAssets.length !== 1) {
      this.end();
      return;
    }

    const subSprite = this.fieldAssets[0];
    if (subSprite === undefined) {
      this.end();
      return;
    }

    globalScene.tweens.add({
      targets: this.pokemon,
      x: subSprite.x + this.pokemon.getSubstituteOffset()[0],
      y: subSprite.y + this.pokemon.getSubstituteOffset()[1],
      alpha: 0.5,
      ease: "Sine.easeInOut",
      duration: 500,
    });

    globalScene.tweens.add({
      targets: subSprite,
      alpha: 1,
      ease: "Sine.easeInOut",
      delay: 250,
      duration: 500,
      onComplete: () => this.end(),
    });
  }

  private doSubstituteRemoveAnim(): void {
    if (this.fieldAssets.length !== 1) {
      this.end();
      return;
    }

    const subSprite = this.fieldAssets[0];
    if (subSprite === undefined) {
      this.end();
      return;
    }

    const getSprite = () => {
      const sprite = globalScene.addFieldSprite(
        subSprite.x,
        subSprite.y,
        `pkmn${this.pokemon.isPlayer() ? "__back" : ""}__sub`,
      );
      sprite.setOrigin(0.5, 1);
      globalScene.field.add(sprite);
      return sprite;
    };

    const subTintSprite = getSprite();
    const subScale = this.pokemon.getSpriteScale() * (this.pokemon.isPlayer() ? 0.5 : 1);
    subTintSprite.setAlpha(0);
    subTintSprite.setTintFill(0xffffff);
    subTintSprite.setScale(subScale);

    globalScene.tweens.add({
      targets: subTintSprite,
      alpha: 1,
      ease: "Sine.easeInOut",
      duration: 500,
      onComplete: () => {
        subSprite.destroy();
        const flashTimer = globalScene.time.addEvent({
          delay: 100,
          repeat: 7,
          startAt: 200,
          callback: () => {
            globalScene.playSound("PRSFX- Substitute2.wav");

            subTintSprite.setVisible(flashTimer.repeatCount % 2 === 0);
            if (!flashTimer.repeatCount) {
              globalScene.tweens.add({
                targets: subTintSprite,
                scale: 0.01,
                ease: "Sine.cubicEaseIn",
                duration: 500,
              });

              globalScene.tweens.add({
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
                },
              });
            }
          },
        });
      },
    });
  }

  private doCommanderApplyAnim(): void {
    if (!globalScene.currentBattle?.double) {
      this.end();
      return;
    }
    const dondozo = this.pokemon.getAlly();

    if (dondozo?.species?.speciesId !== SpeciesId.DONDOZO) {
      this.end();
      return;
    }

    const tatsugiriX = this.pokemon.x + this.pokemon.getSprite().x;
    const tatsugiriY = this.pokemon.y + this.pokemon.getSprite().y;

    const getSourceSprite = () => {
      const sprite = globalScene.addPokemonSprite(
        this.pokemon,
        tatsugiriX,
        tatsugiriY,
        this.pokemon.getSprite().texture,
        this.pokemon.getSprite()!.frame.name,
        true,
      );
      ["spriteColors", "fusionSpriteColors"].map(
        k => (sprite.pipelineData[k] = this.pokemon.getSprite().pipelineData[k]),
      );
      sprite.setPipelineData("spriteKey", this.pokemon.getBattleSpriteKey());
      sprite.setPipelineData("shiny", this.pokemon.shiny);
      sprite.setPipelineData("variant", this.pokemon.variant);
      sprite.setPipelineData("ignoreFieldPos", true);
      sprite.setOrigin(0.5, 1);
      this.pokemon.getSprite().on("animationupdate", (_anim, frame) => sprite.setFrame(frame.textureFrame));
      globalScene.field.add(sprite);
      return sprite;
    };

    const sourceSprite = getSourceSprite();

    this.pokemon.setVisible(false);

    const sourceFpOffset = this.pokemon.getFieldPositionOffset();
    const dondozoFpOffset = dondozo.getFieldPositionOffset();

    globalScene.playSound("se/pb_throw");

    globalScene.tweens.add({
      targets: sourceSprite,
      duration: 375,
      scale: 0.5,
      x: {
        value: tatsugiriX + (dondozoFpOffset[0] - sourceFpOffset[0]) / 2,
        ease: "Linear",
      },
      y: {
        value: (this.pokemon.isPlayer() ? 100 : 65) + sourceFpOffset[1],
        ease: "Sine.easeOut",
      },
      onComplete: () => {
        globalScene.field.bringToTop(dondozo);
        globalScene.tweens.add({
          targets: sourceSprite,
          duration: 375,
          scale: 0.01,
          x: { value: dondozo.x, ease: "Linear" },
          y: { value: dondozo.y + dondozo.height / 2, ease: "Sine.easeIn" },
          onComplete: () => {
            sourceSprite.destroy();
            globalScene.playSound("battle_anims/PRSFX- Liquidation1.wav");
            globalScene.tweens.add({
              targets: dondozo,
              duration: 250,
              ease: "Sine.easeInOut",
              scale: 0.85,
              yoyo: true,
              onComplete: () => this.end(),
            });
          },
        });
      },
    });
  }

  private doCommanderRemoveAnim(): void {
    // Note: unlike the other Commander animation, this is played through the
    // Dondozo instead of the Tatsugiri.
    const tatsugiri = this.pokemon.getAlly();
    if (isNullOrUndefined(tatsugiri)) {
      console.warn("Aborting COMMANDER_REMOVE anim: Tatsugiri is undefined");
      this.end();
      return;
    }

    const tatsuSprite = globalScene.addPokemonSprite(
      tatsugiri,
      this.pokemon.x + this.pokemon.getSprite().x,
      this.pokemon.y + this.pokemon.getSprite().y + this.pokemon.height / 2,
      tatsugiri.getSprite().texture,
      tatsugiri.getSprite()!.frame.name,
      true,
    );
    ["spriteColors", "fusionSpriteColors"].map(
      k => (tatsuSprite.pipelineData[k] = tatsugiri.getSprite().pipelineData[k]),
    );
    tatsuSprite.setPipelineData("spriteKey", tatsugiri.getBattleSpriteKey());
    tatsuSprite.setPipelineData("shiny", tatsugiri.shiny);
    tatsuSprite.setPipelineData("variant", tatsugiri.variant);
    tatsuSprite.setPipelineData("ignoreFieldPos", true);
    this.pokemon.getSprite().on("animationupdate", (_anim, frame) => tatsuSprite.setFrame(frame.textureFrame));

    tatsuSprite.setOrigin(0.5, 1);
    tatsuSprite.setScale(0.01);

    globalScene.field.add(tatsuSprite);
    globalScene.field.bringToTop(this.pokemon);
    tatsuSprite.setVisible(true);

    globalScene.tweens.add({
      targets: this.pokemon,
      duration: 250,
      ease: "Sine.easeInOut",
      scale: 1.15,
      yoyo: true,
      onComplete: () => {
        globalScene.playSound("battle_anims/PRSFX- Liquidation4.wav");
        globalScene.tweens.add({
          targets: tatsuSprite,
          duration: 500,
          scale: 1,
          x: { value: tatsugiri.x + tatsugiri.getSprite().x, ease: "Linear" },
          y: {
            value: tatsugiri.y + tatsugiri.getSprite().y,
            ease: "Sine.easeIn",
          },
          onComplete: () => {
            tatsugiri.setVisible(true);
            tatsuSprite.destroy();
            this.end();
          },
        });
      },
    });
  }
}
