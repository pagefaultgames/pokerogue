import BattleScene from "#app/battle-scene.js";
import { SemiInvulnerableTag } from "#app/data/battler-tags.js";
import { SpeciesFormChange, getSpeciesFormChangeMessage } from "#app/data/pokemon-forms.js";
import { getTypeRgb } from "#app/data/type.js";
import { BattleSpec } from "#app/enums/battle-spec.js";
import Pokemon, { EnemyPokemon } from "#app/field/pokemon.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import { BattlePhase } from "./battle-phase";
import { MovePhase } from "./move-phase";
import { PokemonHealPhase } from "./pokemon-heal-phase";

export class QuietFormChangePhase extends BattlePhase {
  protected pokemon: Pokemon;
  protected formChange: SpeciesFormChange;

  constructor(scene: BattleScene, pokemon: Pokemon, formChange: SpeciesFormChange) {
    super(scene);
    this.pokemon = pokemon;
    this.formChange = formChange;
  }

  start(): void {
    super.start();

    if (this.pokemon.formIndex === this.pokemon.species.forms.findIndex(f => f.formKey === this.formChange.formKey)) {
      return this.end();
    }

    const preName = getPokemonNameWithAffix(this.pokemon);

    if (!this.pokemon.isOnField() || this.pokemon.getTag(SemiInvulnerableTag)) {
      this.pokemon.changeForm(this.formChange).then(() => {
        this.scene.ui.showText(getSpeciesFormChangeMessage(this.pokemon, this.formChange, preName), null, () => this.end(), 1500);
      });
      return;
    }

    const getPokemonSprite = () => {
      const sprite = this.scene.addPokemonSprite(this.pokemon, this.pokemon.x + this.pokemon.getSprite().x, this.pokemon.y + this.pokemon.getSprite().y, "pkmn__sub");
      sprite.setOrigin(0.5, 1);
      sprite.play(this.pokemon.getBattleSpriteKey()).stop();
      sprite.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], hasShadow: false, teraColor: getTypeRgb(this.pokemon.getTeraType()) });
      [ "spriteColors", "fusionSpriteColors" ].map(k => {
        if (this.pokemon.summonData?.speciesForm) {
          k += "Base";
        }
        sprite.pipelineData[k] = this.pokemon.getSprite().pipelineData[k];
      });
      this.scene.field.add(sprite);
      return sprite;
    };

    const [ pokemonTintSprite, pokemonFormTintSprite ] = [ getPokemonSprite(), getPokemonSprite() ];

    this.pokemon.getSprite().on("animationupdate", (_anim, frame) => {
      if (frame.textureKey === pokemonTintSprite.texture.key) {
        pokemonTintSprite.setFrame(frame.textureFrame);
      } else {
        pokemonFormTintSprite.setFrame(frame.textureFrame);
      }
    });

    pokemonTintSprite.setAlpha(0);
    pokemonTintSprite.setTintFill(0xFFFFFF);
    pokemonFormTintSprite.setVisible(false);
    pokemonFormTintSprite.setTintFill(0xFFFFFF);

    this.scene.playSound("PRSFX- Transform");

    this.scene.tweens.add({
      targets: pokemonTintSprite,
      alpha: 1,
      duration: 1000,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.pokemon.setVisible(false);
        this.pokemon.changeForm(this.formChange).then(() => {
          pokemonFormTintSprite.setScale(0.01);
          pokemonFormTintSprite.play(this.pokemon.getBattleSpriteKey()).stop();
          pokemonFormTintSprite.setVisible(true);
          this.scene.tweens.add({
            targets: pokemonTintSprite,
            delay: 250,
            scale: 0.01,
            ease: "Cubic.easeInOut",
            duration: 500,
            onComplete: () => pokemonTintSprite.destroy()
          });
          this.scene.tweens.add({
            targets: pokemonFormTintSprite,
            delay: 250,
            scale: this.pokemon.getSpriteScale(),
            ease: "Cubic.easeInOut",
            duration: 500,
            onComplete: () => {
              this.pokemon.setVisible(true);
              this.scene.tweens.add({
                targets: pokemonFormTintSprite,
                delay: 250,
                alpha: 0,
                ease: "Cubic.easeOut",
                duration: 1000,
                onComplete: () => {
                  pokemonTintSprite.setVisible(false);
                  this.scene.ui.showText(getSpeciesFormChangeMessage(this.pokemon, this.formChange, preName), null, () => this.end(), 1500);
                }
              });
            }
          });
        });
      }
    });
  }

  end(): void {
    if (this.pokemon.scene?.currentBattle.battleSpec === BattleSpec.FINAL_BOSS && this.pokemon instanceof EnemyPokemon) {
      this.scene.playBgm();
      this.scene.unshiftPhase(new PokemonHealPhase(this.scene, this.pokemon.getBattlerIndex(), this.pokemon.getMaxHp(), null, false, false, false, true));
      this.pokemon.findAndRemoveTags(() => true);
      this.pokemon.bossSegments = 5;
      this.pokemon.bossSegmentIndex = 4;
      this.pokemon.initBattleInfo();
      this.pokemon.cry();

      const movePhase = this.scene.findPhase(p => p instanceof MovePhase && p.pokemon === this.pokemon) as MovePhase;
      if (movePhase) {
        movePhase.cancel();
      }
    }

    super.end();
  }
}
