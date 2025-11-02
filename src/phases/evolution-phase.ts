import type { AnySound } from "#app/battle-scene";
import { EVOLVE_MOVE } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { Phase } from "#app/phase";
import type { SpeciesFormEvolution } from "#balance/pokemon-evolutions";
import { FusionSpeciesFormEvolution } from "#balance/pokemon-evolutions";
import { getTypeRgb } from "#data/type";
import { LearnMoveSituation } from "#enums/learn-move-situation";
import { UiMode } from "#enums/ui-mode";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import type { EvolutionSceneUiHandler } from "#ui/evolution-scene-ui-handler";
import { fixedInt } from "#utils/common";
import i18next from "i18next";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";

export class EvolutionPhase extends Phase {
  // FormChangePhase inherits from this, but EvolutionPhase is not abstract.
  // We have to use the union here
  public readonly phaseName: "EvolutionPhase" | "FormChangePhase" = "EvolutionPhase";
  protected pokemon: PlayerPokemon;
  protected lastLevel: number;

  protected evoChain: Phaser.Tweens.TweenChain | null = null;

  private preEvolvedPokemonName: string;

  private evolution: SpeciesFormEvolution | null;
  private fusionSpeciesEvolved: boolean; // Whether the evolution is of the fused species
  private evolutionBgm: AnySound | null;
  private evolutionHandler: EvolutionSceneUiHandler;

  /** Container for all assets used by the scene. When the scene is cleared, the children within this are destroyed. */
  protected evolutionContainer: Phaser.GameObjects.Container;
  protected evolutionBaseBg: Phaser.GameObjects.Image;
  protected evolutionBg: Phaser.GameObjects.Video;
  protected evolutionBgOverlay: Phaser.GameObjects.Rectangle;
  protected evolutionOverlay: Phaser.GameObjects.Rectangle;
  protected pokemonSprite: Phaser.GameObjects.Sprite;
  protected pokemonTintSprite: Phaser.GameObjects.Sprite;
  protected pokemonEvoSprite: Phaser.GameObjects.Sprite;
  protected pokemonEvoTintSprite: Phaser.GameObjects.Sprite;

  /** Whether the evolution can be cancelled by the player */
  protected canCancel: boolean;

  /**
   * @param pokemon - The Pokemon that is evolving
   * @param evolution - The form being evolved into
   * @param lastLevel - The level at which the Pokemon is evolving
   * @param canCancel - Whether the evolution can be cancelled by the player
   */
  constructor(pokemon: PlayerPokemon, evolution: SpeciesFormEvolution | null, lastLevel: number, canCancel = true) {
    super();

    this.pokemon = pokemon;
    this.evolution = evolution;
    this.lastLevel = lastLevel;
    this.fusionSpeciesEvolved = evolution instanceof FusionSpeciesFormEvolution;
    this.canCancel = canCancel;
  }

  validate(): boolean {
    return !!this.evolution;
  }

  setMode(): Promise<void> {
    return globalScene.ui.setModeForceTransition(UiMode.EVOLUTION_SCENE);
  }

  /**
   * Set up the following evolution assets
   * - {@linkcode evolutionContainer}
   * - {@linkcode evolutionBaseBg}
   * - {@linkcode evolutionBg}
   * - {@linkcode evolutionBgOverlay}
   * - {@linkcode evolutionOverlay}
   *
   */
  private setupEvolutionAssets(): void {
    this.evolutionHandler = globalScene.ui.getHandler() as EvolutionSceneUiHandler;
    this.evolutionContainer = this.evolutionHandler.evolutionContainer;
    this.evolutionBaseBg = globalScene.add.image(0, 0, "default_bg").setOrigin(0);

    this.evolutionBg = globalScene.add
      .video(0, 0, "evo_bg")
      .stop()
      .setOrigin(0)
      .setScale(0.4359673025)
      .setVisible(false);

    this.evolutionBgOverlay = globalScene.add
      .rectangle(0, 0, globalScene.scaledCanvas.width, globalScene.scaledCanvas.height, 0x262626)
      .setOrigin(0)
      .setAlpha(0);
    this.evolutionContainer.add([this.evolutionBaseBg, this.evolutionBgOverlay, this.evolutionBg]);

    this.evolutionOverlay = globalScene.add.rectangle(
      0,
      -globalScene.scaledCanvas.height,
      globalScene.scaledCanvas.width,
      globalScene.scaledCanvas.height - 48,
      0xffffff,
    );
    this.evolutionOverlay.setOrigin(0).setAlpha(0);
    globalScene.ui.add(this.evolutionOverlay);
  }

  /**
   * Configure the sprite, setting its pipeline data
   * @param pokemon - The pokemon object that the sprite information is configured from
   * @param sprite - The sprite object to configure
   * @param setPipeline - Whether to also set the pipeline; should be false
   *  if the sprite is only being updated with new sprite assets
   *
   *
   * @returns The sprite object that was passed in
   */
  protected configureSprite(pokemon: Pokemon, sprite: Phaser.GameObjects.Sprite, setPipeline = true): typeof sprite {
    const spriteKey = pokemon.getSpriteKey(true);
    try {
      sprite.play(spriteKey);
    } catch (err: unknown) {
      console.error(`Failed to play animation for ${spriteKey}`, err);
    }

    if (setPipeline) {
      sprite.setPipeline(globalScene.spritePipeline, {
        tone: [0.0, 0.0, 0.0, 0.0],
        hasShadow: false,
        teraColor: getTypeRgb(pokemon.getTeraType()),
        isTerastallized: pokemon.isTerastallized,
      });
    }

    sprite
      .setPipelineData("ignoreTimeTint", true)
      .setPipelineData("spriteKey", spriteKey)
      .setPipelineData("shiny", pokemon.shiny)
      .setPipelineData("variant", pokemon.variant);

    for (let k of ["spriteColors", "fusionSpriteColors"]) {
      if (pokemon.summonData.speciesForm) {
        k += "Base";
      }
      sprite.pipelineData[k] = pokemon.getSprite().pipelineData[k];
    }

    return sprite;
  }

  private getPokemonSprite(): Phaser.GameObjects.Sprite {
    const sprite = globalScene.addPokemonSprite(
      this.pokemon,
      this.evolutionBaseBg.displayWidth / 2,
      this.evolutionBaseBg.displayHeight / 2,
      "pkmn__sub",
    );
    sprite.setPipeline(globalScene.spritePipeline, {
      tone: [0.0, 0.0, 0.0, 0.0],
      ignoreTimeTint: true,
    });
    return sprite;
  }

  /**
   * Initialize {@linkcode pokemonSprite}, {@linkcode pokemonTintSprite}, {@linkcode pokemonEvoSprite}, and {@linkcode pokemonEvoTintSprite}
   * and add them to the {@linkcode evolutionContainer}
   */
  private setupPokemonSprites(): void {
    this.pokemonSprite = this.configureSprite(this.pokemon, this.getPokemonSprite());
    this.pokemonTintSprite = this.configureSprite(
      this.pokemon,
      this.getPokemonSprite().setAlpha(0).setTintFill(0xffffff),
    );
    this.pokemonEvoSprite = this.configureSprite(this.pokemon, this.getPokemonSprite().setVisible(false));
    this.pokemonEvoTintSprite = this.configureSprite(
      this.pokemon,
      this.getPokemonSprite().setVisible(false).setTintFill(0xffffff),
    );

    this.evolutionContainer.add([
      this.pokemonSprite,
      this.pokemonTintSprite,
      this.pokemonEvoSprite,
      this.pokemonEvoTintSprite,
    ]);
  }

  async start() {
    super.start();
    await this.setMode();

    if (!this.validate()) {
      return this.end();
    }
    this.setupEvolutionAssets();
    this.setupPokemonSprites();
    this.preEvolvedPokemonName = getPokemonNameWithAffix(this.pokemon);
    this.doEvolution();
  }

  /**
   * Update the sprites depicting the evolved Pokemon
   * @param evolvedPokemon - The evolved Pokemon
   */
  private updateEvolvedPokemonSprites(evolvedPokemon: Pokemon): void {
    this.configureSprite(evolvedPokemon, this.pokemonEvoSprite, false);
    this.configureSprite(evolvedPokemon, this.pokemonEvoTintSprite, false);
  }

  /**
   * Adds the evolution tween and begins playing it
   */
  private playEvolutionAnimation(evolvedPokemon: Pokemon): void {
    globalScene.time.delayedCall(1000, () => {
      this.evolutionBgm = globalScene.playSoundWithoutBgm("evolution");
      globalScene.tweens.add({
        targets: this.evolutionBgOverlay,
        alpha: 1,
        delay: 500,
        duration: 1500,
        ease: "Sine.easeOut",
        onComplete: () => {
          globalScene.time.delayedCall(1000, () => {
            this.evolutionBg.setVisible(true).play();
          });
          globalScene.playSound("se/charge");
          globalScene.animations.doSpiralUpward(this.evolutionBaseBg, this.evolutionContainer);
          this.fadeOutPokemonSprite(evolvedPokemon);
        },
      });
    });
  }

  private fadeOutPokemonSprite(evolvedPokemon: Pokemon): void {
    globalScene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 2000,
      onUpdate: t => {
        this.pokemonTintSprite.setAlpha(t.getValue() ?? 1);
      },
      onComplete: () => {
        this.pokemonSprite.setVisible(false);
        globalScene.time.delayedCall(1100, () => {
          globalScene.playSound("se/beam");
          globalScene.animations.doArcDownward(this.evolutionBaseBg, this.evolutionContainer);
          this.prepareForCycle(evolvedPokemon);
        });
      },
    });
  }

  /**
   * Prepares the evolution cycle by setting up the tint sprites and starting the cycle
   */
  private prepareForCycle(evolvedPokemon: Pokemon): void {
    globalScene.time.delayedCall(1500, () => {
      this.pokemonEvoTintSprite.setScale(0.25).setVisible(true);
      this.evolutionHandler.canCancel = this.canCancel;
      globalScene.animations.doCycle(1, 15, this.pokemonTintSprite, this.pokemonEvoTintSprite).then(() => {
        if (this.evolutionHandler.cancelled) {
          this.handleFailedEvolution(evolvedPokemon);
        } else {
          this.handleSuccessEvolution(evolvedPokemon);
        }
      });
    });
  }

  /**
   * Show the evolution text and then commence the evolution animation
   */
  doEvolution(): void {
    globalScene.ui.showText(
      i18next.t("menu:evolving", { pokemonName: this.preEvolvedPokemonName }),
      null,
      () => {
        this.pokemon.cry();
        this.pokemon.getPossibleEvolution(this.evolution).then(evolvedPokemon => {
          this.updateEvolvedPokemonSprites(evolvedPokemon);
          this.playEvolutionAnimation(evolvedPokemon);
        });
      },
      1000,
    );
  }

  /** Used exclusively by {@linkcode handleFailedEvolution} to fade out the evolution sprites and music */
  private fadeOutEvolutionAssets(): void {
    globalScene.tweens.add({
      targets: [this.evolutionBg, this.pokemonTintSprite, this.pokemonEvoSprite, this.pokemonEvoTintSprite],
      alpha: 0,
      duration: 250,
      onComplete: () => {
        this.evolutionBg.setVisible(false);
      },
    });
    if (this.evolutionBgm) {
      SoundFade.fadeOut(globalScene, this.evolutionBgm, 100);
    }
  }

  /**
   * Show the confirmation prompt for pausing evolutions
   * @param endCallback - The callback to call after either option is selected.
   *  This should end the evolution phase
   */
  private showPauseEvolutionConfirmation(endCallback: () => void): void {
    globalScene.ui.setOverlayMode(
      UiMode.CONFIRM,
      () => {
        globalScene.ui.revertMode();
        this.pokemon.pauseEvolutions = true;
        globalScene.ui.showText(
          i18next.t("menu:evolutionsPaused", {
            pokemonName: this.preEvolvedPokemonName,
          }),
          null,
          endCallback,
          3000,
        );
      },
      () => {
        globalScene.ui.revertMode();
        globalScene.time.delayedCall(3000, endCallback);
      },
    );
  }

  /**
   * Used exclusively by {@linkcode handleFailedEvolution} to show the failed evolution UI messages
   */
  private showFailedEvolutionUI(evolvedPokemon: Pokemon): void {
    globalScene.phaseManager.unshiftNew("EndEvolutionPhase");

    globalScene.ui.showText(
      i18next.t("menu:stoppedEvolving", {
        pokemonName: this.preEvolvedPokemonName,
      }),
      null,
      () => {
        globalScene.ui.showText(
          i18next.t("menu:pauseEvolutionsQuestion", {
            pokemonName: this.preEvolvedPokemonName,
          }),
          null,
          () => {
            const end = () => {
              globalScene.ui.showText("", 0);
              globalScene.playBgm();
              evolvedPokemon.destroy();
              this.end();
            };
            this.showPauseEvolutionConfirmation(end);
          },
        );
      },
      null,
      true,
    );
  }

  /**
   * Fade out the evolution assets, show the failed evolution UI messages, and enqueue the EndEvolutionPhase
   * @param evolvedPokemon - The evolved Pokemon
   */
  private handleFailedEvolution(evolvedPokemon: Pokemon): void {
    this.pokemonSprite.setVisible(true);
    this.pokemonTintSprite.setScale(1);
    this.fadeOutEvolutionAssets();

    globalScene.phaseManager.unshiftNew("EndEvolutionPhase");
    this.showFailedEvolutionUI(evolvedPokemon);
  }

  /**
   * Fadeout evolution music, play the cry, show the evolution completed text, and end the phase
   */
  private onEvolutionComplete(evolvedPokemon: Pokemon) {
    if (this.evolutionBgm) {
      SoundFade.fadeOut(globalScene, this.evolutionBgm, 100);
    }
    globalScene.time.delayedCall(250, () => {
      this.pokemon.cry();
      globalScene.time.delayedCall(1250, () => {
        globalScene.playSoundWithoutBgm("evolution_fanfare");

        evolvedPokemon.destroy();
        globalScene.ui.showText(
          i18next.t("menu:evolutionDone", {
            pokemonName: this.preEvolvedPokemonName,
            evolvedPokemonName: this.pokemon.name,
          }),
          null,
          () => this.end(),
          null,
          true,
          fixedInt(4000),
        );
        globalScene.time.delayedCall(fixedInt(4250), () => globalScene.playBgm());
      });
    });
  }

  private postEvolve(evolvedPokemon: Pokemon): void {
    const learnSituation: LearnMoveSituation = this.fusionSpeciesEvolved
      ? LearnMoveSituation.EVOLUTION_FUSED
      : this.pokemon.fusionSpecies
        ? LearnMoveSituation.EVOLUTION_FUSED_BASE
        : LearnMoveSituation.EVOLUTION;
    const levelMoves = this.pokemon
      .getLevelMoves(this.lastLevel + 1, true, false, false, learnSituation)
      .filter(lm => lm[0] === EVOLVE_MOVE);
    for (const lm of levelMoves) {
      globalScene.phaseManager.unshiftNew("LearnMovePhase", globalScene.getPlayerParty().indexOf(this.pokemon), lm[1]);
    }
    globalScene.phaseManager.unshiftNew("EndEvolutionPhase");

    globalScene.playSound("se/shine");
    globalScene.animations.doSpray(this.evolutionBaseBg, this.evolutionContainer);

    globalScene.tweens.chain({
      targets: null,
      tweens: [
        {
          targets: this.evolutionOverlay,
          alpha: 1,
          duration: 250,
          easing: "Sine.easeIn",
          onComplete: () => {
            this.evolutionBgOverlay.setAlpha(1);
            this.evolutionBg.setVisible(false);
          },
        },
        {
          targets: [this.evolutionOverlay, this.pokemonEvoTintSprite],
          alpha: 0,
          duration: 2000,
          delay: 150,
          easing: "Sine.easeIn",
        },
        {
          targets: this.evolutionBgOverlay,
          alpha: 0,
          duration: 250,
          onComplete: () => this.onEvolutionComplete(evolvedPokemon),
        },
      ],
    });
  }

  /**
   * Handles a successful evolution
   * @param evolvedPokemon - The evolved Pokemon
   */
  private handleSuccessEvolution(evolvedPokemon: Pokemon): void {
    globalScene.playSound("se/sparkle");
    this.pokemonEvoSprite.setVisible(true);
    globalScene.animations.doCircleInward(this.evolutionBaseBg, this.evolutionContainer);

    globalScene.time.delayedCall(900, () => {
      this.evolutionHandler.canCancel = this.canCancel;

      this.pokemon.evolve(this.evolution, this.pokemon.species).then(() => this.postEvolve(evolvedPokemon));
    });
  }
}
