import { applyOnLoseAbAttrs, applyPostFormChangeAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getSpeciesFormChangeMessage } from "#data/form-change-triggers";
import type { SpeciesFormChange } from "#data/pokemon-forms";
import { getTypeRgb } from "#data/type";
import { BattleSpec } from "#enums/battle-spec";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { Pokemon } from "#field/pokemon";
import { BattlePhase } from "#phases/battle-phase";
import { playTween } from "#utils/anim-utils";

/**
 * Phase handling mid-battle form changes that do not occur in the Party modal
 * and do not show an evolution dialogue.
 */
// TODO: Rename as the term "quiet" can be confusing
export class QuietFormChangePhase extends BattlePhase {
  public readonly phaseName = "QuietFormChangePhase";
  public readonly pokemon: Pokemon;
  protected readonly formChange: SpeciesFormChange;
  /** The Pokemon's prior name before changing forms. */
  private preName: string;

  constructor(pokemon: Pokemon, formChange: SpeciesFormChange) {
    super();
    this.pokemon = pokemon;
    this.formChange = formChange;
  }

  async start(): Promise<void> {
    super.start();

    this.preName = getPokemonNameWithAffix(this.pokemon);

    // Don't do anything if the user is already in the same form.
    if (this.pokemon.formIndex === this.pokemon.species.forms.findIndex(f => f.formKey === this.formChange.formKey)) {
      super.end();
      return;
    }

    if (!this.pokemon.visible && (await this.checkInactive())) {
      return;
    }

    await this.playFormChangeTween();
  }

  /**
   * Handle queueing messages for form changing a currently invisible player Pokemon.
   */
  private async checkInactive(): Promise<boolean> {
    // End immediately for off-field enemy pokemon
    // TODO: This avoids actually doing the form change, is this intended?
    if (!this.pokemon.isPlayer() && !this.pokemon.isActive(true)) {
      return false;
    }

    await this.doChangeForm();
    globalScene.ui.showText(
      getSpeciesFormChangeMessage(this.pokemon, this.formChange, this.preName),
      null,
      () => this.end(),
      1500,
    );
    return true;
  }

  /**
   * Wrapper function to queue effects related to a Pokemon changing forms.
   */
  private async doChangeForm(): Promise<void> {
    const { pokemon, formChange } = this;

    // TODO: This will have ordering issues with on lose abilities' trigger messages showing after this Phase ends
    // if any are given to a Pokemon with mid-battle form changes.
    // If this is desired later on, the animation/textual part of `QuietFormChangePhase` will need to be pulled out
    // into a separate Phase, though I doubt balence team will want to do this for a while...

    applyOnLoseAbAttrs({ pokemon });
    await pokemon.changeForm(formChange);
    applyPostFormChangeAbAttrs({ pokemon });
  }

  private async playFormChangeTween(): Promise<void> {
    const [pokemonTintSprite, pokemonFormTintSprite] = [this.getPokemonSprite(), this.getPokemonSprite()];

    // TODO: This is never deregistered
    this.pokemon.getSprite().on("animationupdate", (_anim, frame) => {
      if (frame.textureKey === pokemonTintSprite.texture.key) {
        pokemonTintSprite.setFrame(frame.textureFrame);
      } else {
        pokemonFormTintSprite.setFrame(frame.textureFrame);
      }
    });

    pokemonTintSprite // formatting
      .setAlpha(0)
      .setTintFill(0xffffff);
    pokemonFormTintSprite // formatting
      .setVisible(false)
      .setTintFill(0xffffff);

    globalScene.playSound("battle_anims/PRSFX- Transform");

    await playTween({
      targets: pokemonTintSprite,
      alpha: 1,
      duration: 1000,
      ease: "Cubic.easeIn",
    });

    this.pokemon.setVisible(false);
    await this.doChangeForm();

    pokemonFormTintSprite.setScale(0.01);
    const spriteKey = this.pokemon.getBattleSpriteKey();
    // TODO: Why do we play and then immediately stop the form tint sprite?
    // The thing isn't even visible anyways at this point in the code
    try {
      pokemonFormTintSprite.play(spriteKey).stop();
    } catch (err: unknown) {
      console.error(`Failed to play animation for ${spriteKey}`, err);
    }

    pokemonFormTintSprite.setVisible(true);
    globalScene.tweens.add({
      targets: pokemonTintSprite,
      delay: 250,
      scale: 0.01,
      ease: "Cubic.easeInOut",
      duration: 500,
      onComplete: () => pokemonTintSprite.destroy(),
    });
    await playTween({
      targets: pokemonFormTintSprite,
      delay: 250,
      scale: this.pokemon.getSpriteScale(),
      ease: "Cubic.easeInOut",
      duration: 500,
    });

    this.pokemon.setVisible(true);
    await playTween({
      targets: pokemonFormTintSprite,
      delay: 250,
      alpha: 0,
      ease: "Cubic.easeOut",
      duration: 1000,
    });
    pokemonTintSprite.setVisible(false);
    globalScene.ui.showText(
      getSpeciesFormChangeMessage(this.pokemon, this.formChange, this.preName),
      null,
      () => this.end(),
      1500,
    );
  }

  private getPokemonSprite(): Phaser.GameObjects.Sprite {
    const sprite = globalScene.addPokemonSprite(
      this.pokemon,
      this.pokemon.x + this.pokemon.getSprite().x,
      this.pokemon.y + this.pokemon.getSprite().y,
      "pkmn__sub",
    );
    sprite.setOrigin(0.5, 1);
    const spriteKey = this.pokemon.getBattleSpriteKey();
    // TODO: Move error handling elsewhere
    try {
      sprite.play(spriteKey).stop();
    } catch (err: unknown) {
      console.error(`Failed to play animation for ${spriteKey}`, err);
    }
    sprite.setPipeline(globalScene.spritePipeline, {
      tone: [0.0, 0.0, 0.0, 0.0],
      hasShadow: false,
      teraColor: getTypeRgb(this.pokemon.getTeraType()),
      isTerastallized: this.pokemon.isTerastallized,
    });
    ["spriteColors", "fusionSpriteColors"].map(k => {
      if (this.pokemon.summonData.speciesForm) {
        k += "Base";
      }
      sprite.pipelineData[k] = this.pokemon.getSprite().pipelineData[k];
    });
    globalScene.field.add(sprite);
    return sprite;
  }

  end(): void {
    // Autotomize's weight reduction is reset when form changing
    this.pokemon.removeTag(BattlerTagType.AUTOTOMIZED);

    if (globalScene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS && this.pokemon.isEnemy()) {
      globalScene.playBgm();
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        this.pokemon.getBattlerIndex(),
        this.pokemon.getMaxHp(),
        null,
        false,
        false,
        false,
        true,
      );
      this.pokemon.summonData.tags.splice(0);
      this.pokemon.bossSegments = 5;
      this.pokemon.bossSegmentIndex = 4;
      this.pokemon.initBattleInfo();
      this.pokemon.cry();

      globalScene.phaseManager.cancelMove(p => p.pokemon === this.pokemon);
    }

    super.end();
  }
}
