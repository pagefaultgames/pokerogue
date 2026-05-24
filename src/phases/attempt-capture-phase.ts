import { PLAYER_PARTY_MAX_SIZE } from "#app/constants";
import { audioManager } from "#app/global-audio-manager";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { IS_TEST, isBeta, isDev } from "#constants/app-constants";
import { SubstituteTag } from "#data/battler-tags";
import { Gender } from "#data/gender";
import {
  doPokeballBounceAnim,
  getCriticalCaptureChance,
  getPokeballAtlasKey,
  getPokeballCatchMultiplier,
  getPokeballTintColor,
} from "#data/pokeball";
import { getStatusEffectCatchRateMultiplier } from "#data/status-effect";
import { BattlerIndex } from "#enums/battler-index";
import { ChallengeType } from "#enums/challenge-type";
import { PokeballType } from "#enums/pokeball";
import { StatusEffect } from "#enums/status-effect";
import { UiMode } from "#enums/ui-mode";
import type { EnemyPokemon } from "#field/pokemon";
import { PokemonHeldItemModifier } from "#modifiers/modifier";
import { achvs } from "#system/achv";
import type { PartyOption } from "#ui/party-ui-handler";
import { PartyUiMode } from "#ui/party-ui-handler";
import { SummaryUiMode } from "#ui/summary-ui-handler";
import { playNumberTween, playTween } from "#utils/anim-utils";
import { applyChallenges } from "#utils/challenge-utils";
import { waitTime } from "#utils/time";
import { ValueHolder } from "#utils/value-holder";
import i18next from "i18next";

type FullPartyCatchAction = "summary" | "pokedex" | "release" | "cancel";

/**
 * The Phase where wild Pokemon are captured by the player,
 * encapsulating animations and logic for the entire capture sequence.
 */
export class AttemptCapturePhase extends Phase {
  public readonly phaseName = "AttemptCapturePhase";
  /** The Pokemon to attempt to capture. */
  private readonly pokemon: EnemyPokemon;

  /** The type of Pokeball being thrown. */
  private readonly pokeballType: PokeballType;
  private pokeballSprite: Phaser.GameObjects.Sprite;
  /** The original Y-position of `pokemon`, used to ensure it returns to the proper vertical height if the capture fails. */
  private readonly originalY: number;

  constructor(fieldIndex: 0 | 1, pokeballType: PokeballType) {
    super();

    this.pokeballType = pokeballType;
    const index = (BattlerIndex.ENEMY + fieldIndex) as BattlerIndex.ENEMY | BattlerIndex.ENEMY_2;

    // bang is benign as we immediately abort if nullish
    this.pokemon = globalScene.getPokemonByBattlerIndex(index)!;
    if (!this.pokemon?.isActive(true)) {
      console.warn(
        "Warning: attempted to capture a nonexistent, inactive or off-field Pokemon!\nAborting capture attempt...",
      );
      super.end();
      return;
    }

    this.originalY = this.pokemon.y;
  }

  /** @sealed */
  public override async start(): Promise<void> {
    super.start();

    const { pokemon } = this;

    const substitute = pokemon.getTag(SubstituteTag);
    if (substitute) {
      substitute.sprite.setVisible(false);
    }

    globalScene.pokeballCounts[this.pokeballType]--;

    const [isCritical, successfulShakes, caught] = this.computeCaptureOutcome(pokemon, this.pokeballType);

    // TODO: Move these animations into a separate method if or when we decide to de-duplicate this
    // with the duplicated Safari Zone version
    const fpOffset = pokemon.getFieldPositionOffset();

    const pokeballAtlasKey = getPokeballAtlasKey(this.pokeballType);
    this.pokeballSprite = globalScene.addFieldSprite(16, 80, "pb", pokeballAtlasKey).setOrigin(0.5, 0.625);
    globalScene.field.add(this.pokeballSprite);

    audioManager.playSound(isCritical ? "se/crit_throw" : "se/pb_throw");
    waitTime(300).then(() => {
      globalScene.field.moveBelow<Phaser.GameObjects.GameObject>(this.pokeballSprite, pokemon);
    });

    // Throw animation
    await playTween({
      targets: this.pokeballSprite,
      x: { value: 236 + fpOffset[0], ease: "Linear" },
      y: { value: 16 + fpOffset[1], ease: "Cubic.easeOut" },
      duration: 500,
    });

    // Ball opens
    this.animatePokeballOpen();
    audioManager.playSound("se/pb_rel");
    pokemon.tint(getPokeballTintColor(this.pokeballType));
    globalScene.animations.addPokeballOpenParticles(this.pokeballSprite.x, this.pokeballSprite.y, this.pokeballType);

    // Mon enters ball
    await playTween({
      targets: pokemon,
      duration: 500,
      ease: "Sine.easeIn",
      scale: 0.25,
      y: 20,
    });

    // Ball closes
    this.pokeballSprite.setTexture("pb", `${pokeballAtlasKey}_opening`);
    pokemon.setVisible(false);
    audioManager.playSound("se/pb_catch");

    // Ball bounces
    // TODO: Use async once `doPokeballBounceAnim` is promisified
    await Promise.all([
      waitTime(17).then(() => this.pokeballSprite.setTexture("pb", `${pokeballAtlasKey}`)),
      new Promise<void>(resolve =>
        globalScene.time.delayedCall(250, () =>
          doPokeballBounceAnim(this.pokeballSprite, 16, 72, 350, resolve, isCritical),
        ),
      ),
    ]);

    // Play the wobble animations for each successful shake check.
    // Critical captures always show 1 wobble; the result is revealed after.
    await this.animateShakeChecks(successfulShakes);

    if (!caught) {
      await this.failCatch();
      return;
    }

    audioManager.playSound("se/pb_lock");
    globalScene.animations.addPokeballCaptureStars(this.pokeballSprite);

    const pbTint = globalScene.add
      .sprite(this.pokeballSprite.x, this.pokeballSprite.y, "pb", "pb")
      .setOrigin(this.pokeballSprite.originX, this.pokeballSprite.originY)
      .setTintFill(0)
      .setAlpha(0);
    globalScene.field.add(pbTint);

    await playTween({
      targets: pbTint,
      alpha: 0.375,
      duration: 200,
      easing: "Sine.easeOut",
    });
    await playTween({
      targets: pbTint,
      alpha: 0,
      duration: 200,
      easing: "Sine.easeIn",
    });
    pbTint.destroy();

    await this.catch();
  }

  // #region Capture Success calculations

  /**
   * Pre-compute the outcome of a capture sequence, including the number of shake checks that should succeed.
   * @param pokemon - The {@linkcode EnemyPokemon} being caught
   * @param pokeballType - The type of Pokeball being used for the capture attempt
   * @returns A tuple containing:
   * 1. Whether the capture is a critical capture
   * 2. The number of successful shake check animations that should be displayed (0-3)
   * 3. Whether the Pokemon should be caught at the end of the sequence
   */
  private computeCaptureOutcome(
    pokemon: EnemyPokemon,
    pokeballType: PokeballType,
  ): [isCritical: boolean, successfulShakes: number, caught: boolean] {
    // master balls bypass everything and always work correctly
    // TODO: Can master balls randomly critical capture in mainline?
    if (pokeballType === PokeballType.MASTER_BALL) {
      return [false, 3, true];
    }

    const modifiedCatchRate = this.getModifiedCatchRate(pokemon, pokeballType);

    const shakeProbability = this.computeShakeProbability(modifiedCatchRate);

    const criticalCaptureChance = getCriticalCaptureChance(modifiedCatchRate);
    const isCritical = globalScene.randBattleSeedInt(256) < criticalCaptureChance;

    const maxShakeChecks = isCritical ? 1 : 3;
    let successfulShakes: number;

    if (isCritical) {
      successfulShakes = maxShakeChecks;
    } else {
      for (successfulShakes = 0; successfulShakes < maxShakeChecks; successfulShakes++) {
        if (globalScene.randBattleSeedInt(65536) >= shakeProbability) {
          break;
        }
      }
    }

    // The Pokemon must suceed a final 4th shake check to determine whether the ball breaks at the end or not.
    // This does not involve a shake animation (hence why it is separated from `successfulShakes`).
    const caught = successfulShakes === maxShakeChecks && globalScene.randBattleSeedInt(65536) >= shakeProbability;

    if ((isBeta || isDev) && !IS_TEST) {
      console.log(
        `Modified Catch Rate: ${modifiedCatchRate.toPrecision(3)}\n`
          + `Critical Catch Chance: ${criticalCaptureChance}\n`
          + `Critical Catch?: ${isCritical}\n`
          + `Shake Probability: ${Math.floor(shakeProbability)} / 65536\n`
          + `Shake Checks Passed: ${successfulShakes}/${maxShakeChecks}\n`
          + `Caught?: ${caught}`,
      );
    }

    return [isCritical, successfulShakes, caught];
  }

  /**
   * Compute the modified catch rate for the current capture attempt.
   * @param pokemon - The {@linkcode EnemyPokemon} being caught
   * @returns The modified catch rate value.
   * @remarks
   * Unlike the mainline games, we do not round the result to the nearest multiple of 4096.
   * All other computations remain identical to mainline games.
   */
  protected getModifiedCatchRate(pokemon: EnemyPokemon, pokeballType: PokeballType): number {
    const hpMult = 1 - (pokemon.getHpRatio(true) * 2) / 3;

    const { catchRate } = pokemon.species;
    const ballBonus = getPokeballCatchMultiplier(pokeballType);
    const statusMultiplier = getStatusEffectCatchRateMultiplier(pokemon.status?.effect ?? StatusEffect.NONE);
    // PKR-exclusive, though it is most akin to Gen 6' pass powers (and occupies the same spot in the formula)
    const shinyMultiplier = pokemon.isShiny() ? timedEventManager.getShinyCatchMultiplier() : 1;

    return hpMult * catchRate * ballBonus * statusMultiplier * shinyMultiplier;
  }

  private computeShakeProbability(modifiedCatchRate: number): number {
    // Formula taken from gen 6 capture mechanics, albeit without the 4096-based rounding
    // (thus making the denominator 255 instead of 255*4096 = 1044480)
    // NB: Rounding the result here (while it would make for cleaner numbers) ultimately does nothing
    // as we solely compare it with integers
    return 65536 * Math.pow(modifiedCatchRate / 255, 0.1875);
  }

  // #endregion Capture Success calculations

  // #region Capture Outcome methods

  /**
   * Animate Pokeball wobbling for each successful shake check.
   * @param shakeCount - The number of wobble animations to play
   * @returns A Promise that resolves once the animations have been played.
   * @remarks
   * This does not perform any logic related to shake checks themselves, nor does it handle the final check
   * that determines the capture's overall result.
   */
  private async animateShakeChecks(shakeCount: number): Promise<void> {
    // Initial pause before the first wobble (or the ball breaking)
    await waitTime(1000);

    if (shakeCount === 0) {
      return;
    }

    const pbX = this.pokeballSprite.x;
    let currentShake = 0;

    await playNumberTween({
      from: 0,
      to: 1,
      yoyo: true,
      ease: "Cubic.easeOut",
      duration: 250,
      repeat: shakeCount - 1,
      repeatDelay: 500,
      onUpdate: t => {
        const value = t.getValue() ?? 0;
        const directionMultiplier = currentShake % 2 === 0 ? 1 : -1;
        this.pokeballSprite.setX(pbX + value * 4 * directionMultiplier);
        this.pokeballSprite.setAngle(value * 27.5 * directionMultiplier);
      },
      onRepeat: () => {
        audioManager.playSound("se/pb_move");
        currentShake++;
      },
    });

    // Trailing pause after the final wobble
    await waitTime(500);
  }

  /**
   * Resolve a failed capture attempt by restoring the Pokemon, replaying the ball opening, and ending the phase.
   */
  private async failCatch(): Promise<void> {
    const { pokemon, pokeballType } = this;

    audioManager.playSound("se/pb_rel");
    pokemon.setY(this.originalY);
    if (pokemon.status?.effect !== StatusEffect.SLEEP) {
      pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
    }
    pokemon.tint(getPokeballTintColor(pokeballType));
    pokemon.setVisible(true);
    pokemon.untint(250, "Sine.easeOut");

    const substitute = pokemon.getTag(SubstituteTag);
    if (substitute) {
      substitute.sprite.setVisible(true);
    }

    await Promise.all([
      this.animatePokeballOpen(),
      playTween({
        targets: pokemon,
        duration: 250,
        ease: "Sine.easeOut",
        scale: 1,
      }),
    ]);

    globalScene.currentBattle.lastUsedPokeball = pokeballType;
    await this.removePb();
    this.end();
  }

  /**
   * Play the brief opening-frame transition used when the Pokeball hits or releases its target.
   */
  private async animatePokeballOpen(): Promise<void> {
    const { pokeballType } = this;

    const pokeballAtlasKey = getPokeballAtlasKey(pokeballType);
    this.pokeballSprite.setTexture("pb", `${pokeballAtlasKey}_opening`);
    await waitTime(17);
    this.pokeballSprite.setTexture("pb", `${pokeballAtlasKey}_open`);
  }

  /**
   * Complete a successful capture attempt.
   */
  private async catch(): Promise<void> {
    const { pokemon } = this;

    this.validateCaptureAchievements();

    globalScene.pokemonInfoContainer.show(pokemon, true);

    globalScene.gameData.updateSpeciesDexIvs(pokemon.species.getRootSpeciesId(true), pokemon.ivs);

    const addStatus = new ValueHolder(true);
    applyChallenges(ChallengeType.POKEMON_ADD_TO_PARTY, pokemon, addStatus);

    await globalScene.ui.showTextPromise(
      i18next.t(addStatus.value ? "battle:pokemonCaught" : "battle:pokemonCaughtButChallenge", {
        pokemonName: pokemon.name,
      }),
    );

    await Promise.all([pokemon.hideInfo(), globalScene.gameData.setPokemonCaught(pokemon)]);

    if (!addStatus.value) {
      this.removeCaughtPokemonFromField();
      await this.finishCatch();
      return;
    }

    if (globalScene.getPlayerParty().length === PLAYER_PARTY_MAX_SIZE) {
      await this.handleFullPartyCatch();
      return;
    }

    await this.addCaughtPokemonToParty();
  }

  /**
   * Remove the captured enemy from the field and update battle state as though it has left play.
   */
  private removeCaughtPokemonFromField(): void {
    const { pokemon } = this;

    globalScene.addFaintedEnemyScore(pokemon);
    pokemon.hp = 0;
    pokemon.doSetStatus(StatusEffect.FAINT);
    globalScene.clearEnemyHeldItemModifiers();
    pokemon.leaveField(true, true, true);
  }

  /** Finish queueing various post-capture effects before ending this Phase. */
  private async finishCatch(): Promise<void> {
    const { pokemon } = this;

    globalScene.phaseManager.unshiftNew("VictoryPhase", pokemon.getBattlerIndex());
    globalScene.pokemonInfoContainer.hide();
    await this.removePb();
    this.end();
  }

  /**
   * Repeatedly prompt the player to inspect or make room for a newly caught Pokemon when the party is full.
   */
  private async handleFullPartyCatch(): Promise<void> {
    const { pokemon } = this;

    while (true) {
      await globalScene.ui.showTextPromise(
        i18next.t("battle:partyFull", {
          pokemonName: pokemon.getNameToRender(),
        }),
      );

      globalScene.pokemonInfoContainer.makeRoomForConfirmUi(1, true);

      const action = await this.promptFullPartyCatchAction();
      switch (action) {
        case "summary":
          await this.showCaughtPokemonSummary();
          continue;
        case "pokedex":
          await this.showCaughtPokemonPokedexPage();
          continue;
        case "release": {
          const slotIndex = await this.promptCatchReleaseSlot();
          if (slotIndex === PLAYER_PARTY_MAX_SIZE) {
            continue;
          }
          await this.addCaughtPokemonToParty(slotIndex);
          return;
        }
        case "cancel":
          this.removeCaughtPokemonFromField();
          await this.finishCatch();
          return;
      }
    }
  }

  /**
   * Prompt the player to choose whether to keep a caught Pokemon upon their party being full.
   * @returns A Promise that resolves with the chosen action.
   */
  private async promptFullPartyCatchAction(): Promise<FullPartyCatchAction> {
    const { promise, resolve } = Promise.withResolvers<FullPartyCatchAction>();
    globalScene.ui.setMode(
      UiMode.CONFIRM,
      () => resolve("summary"),
      () => resolve("pokedex"),
      () => resolve("release"),
      () => resolve("cancel"),
      "fullParty",
    );
    return promise;
  }

  /**
   * Show the summary page for the caught Pokemon, then return the UI to message mode.
   */
  private async showCaughtPokemonSummary(): Promise<void> {
    const { pokemon } = this;

    // TODO: We shouldn't need to create a new dummy Pokemon solely to display the summary page
    const newPokemon = globalScene.addPlayerPokemon(
      pokemon.species,
      pokemon.level,
      pokemon.abilityIndex,
      pokemon.formIndex,
      pokemon.gender,
      pokemon.shiny,
      pokemon.variant,
      pokemon.ivs,
      pokemon.nature,
      pokemon,
    );

    await new Promise<void>(resolve => {
      globalScene.ui.setMode(
        UiMode.SUMMARY,
        newPokemon,
        0,
        SummaryUiMode.DEFAULT,
        () => {
          globalScene.ui.setMode(UiMode.MESSAGE).then(resolve);
        },
        false,
      );
    });

    pokemon.destroy();
  }

  /**
   * Show the Pokedex entry for the caught Pokemon before returning it to normal.
   * @returns A Promise that resolves once the Pokedex page has been dismissed.
   */
  private async showCaughtPokemonPokedexPage(): Promise<void> {
    const { pokemon } = this;

    const attributes = {
      shiny: pokemon.shiny,
      variant: pokemon.variant,
      form: pokemon.formIndex,
      female: pokemon.gender === Gender.FEMALE,
    };

    await new Promise<void>(resolve => {
      globalScene.ui.setOverlayMode(UiMode.POKEDEX_PAGE, pokemon.species, attributes, null, null, () => {
        globalScene.ui.setMode(UiMode.MESSAGE).then(resolve);
      });
    });
  }

  /**
   * Open the party release UI to select the party member to replace with the newly caught Pokemon.
   * @returns A Promise that resolves with the chosen slot number, or {@linkcode PLAYER_PARTY_MAX_SIZE} if the prompt is declined.
   */
  private async promptCatchReleaseSlot(): Promise<number> {
    const { pokemon } = this;

    return await new Promise(resolve => {
      globalScene.ui.setMode(
        UiMode.PARTY,
        PartyUiMode.RELEASE,
        pokemon.getFieldIndex(),
        (slotIndex: number, _option: PartyOption) => {
          globalScene.ui.setMode(UiMode.MESSAGE).then(() => resolve(slotIndex));
        },
      );
    });
  }

  /**
   * Add the caught Pokemon to the player's party, restore transferred modifiers, and finish the capture flow.
   * @param slotIndex - Optional slot to overwrite when the player releases an existing party member.
   */
  private async addCaughtPokemonToParty(slotIndex?: number): Promise<void> {
    const { pokemon, pokeballType } = this;

    const newPokemon = pokemon.addToParty(pokeballType, slotIndex);
    const modifiers = globalScene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);

    if (globalScene.getPlayerParty().filter(p => p.isShiny()).length === PLAYER_PARTY_MAX_SIZE) {
      globalScene.validateAchv(achvs.SHINY_PARTY);
    }

    await Promise.all(modifiers.map(m => globalScene.addModifier(m, true)));
    globalScene.updateModifiers(true);
    this.removeCaughtPokemonFromField();

    if (newPokemon) {
      newPokemon.leaveField(true, true, false);
      await newPokemon.loadAssets();
    }

    await this.finishCatch();
  }

  /** Validate various achievements for catching certain types of Pokemon. */
  private validateCaptureAchievements(): void {
    const { pokemon } = this;

    const speciesForm = pokemon.fusionSpecies ? pokemon.getFusionSpeciesForm() : pokemon.getSpeciesForm();

    const abilityIndex = pokemon.fusionSpecies ? pokemon.fusionAbilityIndex : pokemon.abilityIndex;
    if (speciesForm.abilityHidden && abilityIndex === speciesForm.getAbilityCount() - 1) {
      globalScene.validateAchv(achvs.HIDDEN_ABILITY);
    }

    if (pokemon.species.subLegendary) {
      globalScene.validateAchv(achvs.CATCH_SUB_LEGENDARY);
    }

    if (pokemon.species.legendary) {
      globalScene.validateAchv(achvs.CATCH_LEGENDARY);
    }

    if (pokemon.species.mythical) {
      globalScene.validateAchv(achvs.CATCH_MYTHICAL);
    }
  }

  /**
   * Fade out and destroy the active Pokeball sprite.
   */
  private async removePb(): Promise<void> {
    await playTween({
      targets: this.pokeballSprite,
      duration: 250,
      delay: 250,
      ease: "Sine.easeIn",
      alpha: 0,
    });
    this.pokeballSprite.destroy();
  }
}
