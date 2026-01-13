import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { SpeciesFormChangeActiveTrigger } from "#data/form-change-triggers";
import { getPokeballAtlasKey, getPokeballTintColor } from "#data/pokeball";
import { BattleType } from "#enums/battle-type";
import type { FieldBattlerIndex } from "#enums/battler-index";
import { FieldPosition } from "#enums/field-position";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { PlayerGender } from "#enums/player-gender";
import { SwitchType } from "#enums/switch-type";
import type { EncounterPhase } from "#phases/encounter-phase";
import { PokemonPhase } from "#phases/pokemon-phase";
import type { SwitchPhase } from "#phases/switch-phase";
import { playTween } from "#utils/anim-utils";
import { waitTime } from "#utils/time";
import i18next from "i18next";

export interface SummonPhaseOptions {
  /**
   * If `true`, summons the Pokemon as if loading into a wave
   * @defaultValue `false`
   */
  readonly loaded?: boolean;
  /**
   * If `true` for an enemy Trainer's switch, this phase will play
   * an animation on the Trainer before the "thrown Poke Ball" animation.
   * This does not affect summons on the Player's side since part of the
   * Player Trainer's animation is implemented in {@linkcode EncounterPhase}.
   * @defaultValue `true`
   */
  readonly playTrainerAnim?: boolean;
  /**
   * The type of switching behavior that was triggered; default `SwitchType.SWITCH`.
   * Used to configure custom messages for Force switching moves.
   */
  // TODO: Expand this into an entire 'message override' parameter (will be needed for U-Turn and co.)
  readonly switchType?: SwitchType;
}

/**
 * Phase to handle all visual elements of adding a Pokemon to the field.
 * @see {@linkcode SwitchPhase} Phase handling the logical aspects of switching 2 Pokemon
 */
export class SummonPhase extends PokemonPhase {
  public override readonly phaseName = "SummonPhase";

  private readonly loaded: boolean;
  private readonly playTrainerAnim: boolean;
  private readonly switchType: SwitchType;

  constructor(
    battlerIndex: FieldBattlerIndex,
    { loaded = false, playTrainerAnim = true, switchType = SwitchType.SWITCH }: SummonPhaseOptions = {},
  ) {
    super(battlerIndex);

    this.loaded = loaded;
    this.playTrainerAnim = playTrainerAnim;
    this.switchType = switchType;
  }

  public override async start(): Promise<void> {
    super.start();

    // If the Pokemon about to be summoned is fainted or illegal under active challenges,
    // try to reorganize the Pokemon's party such that a legal inactive Pokemon is summoned instead.
    // If this cannot be done, queue a game over and end the phase.
    if (!this.getPokemon().isAllowedInBattle() && !this.handleIllegalSummon()) {
      globalScene.phaseManager.clearAllPhases();
      globalScene.phaseManager.unshiftNew("GameOverPhase", false);
      super.end();
      return;
    }

    await this.playSummonSequence();
    this.end();
  }

  /**
   * Handles edge cases where the Pokemon to be summoned by this phase is somehow not allowed in battle.
   * This will attempt to swap the illegal Pokemon with the first inactive legal
   * Pokemon in the same party.
   * If no legal Pokemon can be summoned, a game over is queued instead.
   * @returns `true` if this phase should continue after error handling.
   */
  private handleIllegalSummon(): boolean {
    console.warn(
      "The Pokemon about to be sent out is fainted or illegal under the current challenge(s). Attempting to resolve...",
    );

    const illegalPokemon = this.getPokemon();

    const party = this.getAlliedParty();
    const legalIndex = party.findIndex((p, i) => i > this.fieldIndex && p.isAllowedInBattle());

    if (legalIndex > -1) {
      // Swap positions of illegal and legal Pokemon in the party
      [party[this.fieldIndex], party[legalIndex]] = [party[legalIndex], party[this.fieldIndex]];
      console.warn(
        `Swapped ${illegalPokemon.name} (index ${this.fieldIndex}) with ${this.getPokemon().name} (index ${legalIndex})`,
      );
      return true;
    }

    console.warn("All Pokemon in the Player's party cannot be summoned!");
    return false;
  }

  /**
   * Play animations and trigger text for the summon sequence,
   * including Trainer summon animations and field entrance effects.
   */
  private async playSummonSequence(): Promise<void> {
    const { currentBattle, pbTray, pbTrayEnemy, trainer } = globalScene;
    if (this.player) {
      pbTray.hide();
      // TODO: Should we await this?
      this.playSendOutMessage(true);
      if (trainer.visible) {
        await this.playPlayerTrainerThrowSequence();
      }
      await this.playPokeBallSummonFX();
    } else if (
      currentBattle.battleType === BattleType.TRAINER
      || currentBattle.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE
    ) {
      // TODO: In battles against 2 Trainers, the second Trainer may not show itself
      // when both enemy Pokemon faint on the same turn.
      if (this.playTrainerAnim && !globalScene.getEnemyParty().some(p => p.isOnField())) {
        await this.playEnemyTrainerThrowSequence();
      }
      await this.playPokeBallSummonFX();
    } else {
      // At the moment, this is only reached during Mystery Encounters where the Player
      // may battle "wild" Pokemon. The enemy's Poke Ball tray is shown during prior phases
      // of the encounter.
      pbTrayEnemy.hide();
      await this.playWildSummonFX();
    }
  }

  /**
   * Plays all animations targeting the Player Trainer during the summon
   * sequence. This assumes the Player Trainer sprite is already visible and
   * on the field, e.g. after the animation sequence in {@linkcode EncounterPhase}
   */
  private async playPlayerTrainerThrowSequence(): Promise<void> {
    const { time, trainer, tweens } = globalScene;

    trainer.setTexture(`trainer_${globalScene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`);

    time.delayedCall(562, () => {
      trainer.setFrame("2");
      time.delayedCall(64, () => {
        trainer.setFrame("3");
      });
    });

    tweens.add({
      targets: trainer,
      x: -36,
      duration: 1000,
      onComplete: () => trainer.setVisible(false),
    });

    // Resolve 750 ms into the above Tween animation
    await waitTime(750);
  }

  /**
   * Plays all animations targeting the Enemy Trainer during the summon
   * sequence. The Trainer first enters the field while showing its Poke Ball tray,
   * then hides itself as it announces the Pokemon entering the field.
   */
  private async playEnemyTrainerThrowSequence(): Promise<void> {
    const { currentBattle, pbTrayEnemy } = globalScene;
    const { trainer } = currentBattle;
    if (!trainer) {
      console.warn("SummonPhase: Enemy Trainer is missing!");
      return;
    }

    if (!trainer.visible) {
      await this.playEnemyTrainerEntranceAnim();
    }

    await Promise.allSettled([this.hideEnemyTrainer(), pbTrayEnemy.hide()]);

    await this.playSendOutMessage(false);
  }

  /**
   * Plays an animation to move the enemy Trainer onto the field.
   * Should only be called if the switched-in Pokemon is an enemy.
   */
  private async playEnemyTrainerEntranceAnim(): Promise<void> {
    await this.showEnemyTrainer(this.getTrainerSlot());
    await globalScene.pbTrayEnemy.showPbTray(globalScene.getEnemyParty());
    await waitTime(1000);
  }

  /**
   * Plays animations to summon this phase's Pokemon from its Poke Ball.
   * More specifically, this animates the Poke Ball's movement to the Pokemon's field position,
   * the Pokemon exiting from the Poke Ball, and the Pokemon's entrance animation and cry.
   */
  private async playPokeBallSummonFX(): Promise<void> {
    const { add, currentBattle, animations, field } = globalScene;
    const pokemon = this.getPokemon();

    const pokeball = globalScene.addFieldSprite(
      this.player ? 36 : 248,
      this.player ? 80 : 44,
      "pb",
      getPokeballAtlasKey(pokemon.pokeball),
    );
    pokeball.setVisible(false);
    pokeball.setOrigin(0.5, 0.625);
    field.add(pokeball);

    if (this.fieldIndex === 1) {
      pokemon.setFieldPosition(FieldPosition.RIGHT, 0);
    } else {
      const availablePartyMembers = this.getAlliedParty().filter(p => p.isAllowedInBattle()).length;
      pokemon.setFieldPosition(
        !currentBattle.double || availablePartyMembers === 1 ? FieldPosition.CENTER : FieldPosition.LEFT,
      );
    }

    const fpOffset = pokemon.getFieldPositionOffset();

    pokeball.setVisible(true);

    const pokeBallXAnimation = playTween({
      targets: pokeball,
      duration: 650,
      x: (this.player ? 100 : 236) + fpOffset[0],
    });

    const pokeBallYAnimation = playTween({
      targets: pokeball,
      duration: 150,
      ease: "Cubic.easeOut",
      y: (this.player ? 70 : 34) + fpOffset[1],
    }).then(() =>
      playTween({
        targets: pokeball,
        duration: 500,
        ease: "Cubic.easeIn",
        y: (this.player ? 132 : 86) + fpOffset[1],
      }),
    );
    await Promise.allSettled([pokeBallXAnimation, pokeBallYAnimation]);

    globalScene.playSound("se/pb_rel");
    pokeball.destroy();
    add.existing(pokemon);
    field.add(pokemon);

    if (!this.player) {
      const playerPokemon = globalScene.getPlayerPokemon()!;
      if (playerPokemon.isOnField()) {
        field.moveBelow(pokemon, playerPokemon);
      }
      currentBattle.seenEnemyPartyMemberIds.add(pokemon.id);
    }

    animations.addPokeballOpenParticles(pokemon.x, pokemon.y - 16, pokemon.pokeball);
    globalScene.updateModifiers(this.player);
    globalScene.updateFieldScale();

    pokemon.showInfo();
    pokemon.playAnim();
    pokemon.setVisible(true);
    pokemon.getSprite().setVisible(true);
    pokemon.setScale(0.5);
    pokemon.tint(getPokeballTintColor(pokemon.pokeball));
    pokemon.untint(250, "Sine.easeIn");

    await Promise.allSettled([
      globalScene.updateFieldScale(),
      playTween({
        targets: pokemon,
        duration: 250,
        ease: "Sine.easeIn",
        scale: pokemon.getSpriteScale(),
      }),
    ]);

    pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
    pokemon.getSprite().clearTint();
    // required to load the proper assets when loading from save data
    // TODO: Do we need this?
    if (this.loaded && pokemon.summonData.speciesForm) {
      pokemon.loadAssets(false);
    }

    await waitTime(1000);
  }

  /**
   * Handles tweening and battle setup for a wild Pokemon that appears outside of the normal screen transition.
   * Wild Pokemon will ease and fade in onto the field, then perform standard summon behavior.
   * Currently only used by Mystery Encounters, as all other battle types pre-summon wild pokemon before screen transitions.
   * @todo Are any of these animations recycled from other phases? If so, can they be
   * implemented as utility methods?
   */
  private async playWildSummonFX(): Promise<void> {
    const { add, currentBattle, field } = globalScene;
    const pokemon = this.getPokemon();

    if (this.fieldIndex === 1) {
      await pokemon.setFieldPosition(FieldPosition.RIGHT);
    } else {
      const availablePartyMembers = this.getAlliedParty().filter(p => !p.isFainted()).length;
      await pokemon.setFieldPosition(
        !currentBattle.double || availablePartyMembers === 1 ? FieldPosition.CENTER : FieldPosition.LEFT,
      );
    }

    add.existing(pokemon);
    field.add(pokemon);

    if (!this.player) {
      const playerPokemon = globalScene.getPlayerPokemon();
      if (playerPokemon?.isOnField()) {
        field.moveBelow(pokemon, playerPokemon);
      }
      currentBattle.seenEnemyPartyMemberIds.add(pokemon.id);
    }

    globalScene.updateModifiers(this.player);
    // TODO: This is a dangling Promise
    globalScene.updateFieldScale();

    pokemon.showInfo();
    pokemon.playAnim();
    pokemon.setVisible(true);
    pokemon.getSprite().setVisible(true);
    pokemon.setScale(0.75);
    pokemon.tint(getPokeballTintColor(pokemon.pokeball));
    pokemon.untint(250, "Sine.easeIn");
    pokemon.x += 16;
    pokemon.y -= 20;
    pokemon.alpha = 0;

    // Ease pokemon in
    await playTween({
      targets: pokemon,
      x: "-=16",
      y: "+=16",
      alpha: 1,
      duration: 1000,
      ease: "Sine.easeIn",
      scale: pokemon.getSpriteScale(),
    });

    pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
    pokemon.getSprite().clearTint();

    await waitTime(1000);
  }

  public override end(): void {
    const { waveIndex, battleType } = globalScene.currentBattle;
    const pokemon = this.getPokemon();

    // If the Pokemon summoned was recalled earlier without switching (e.g. on arena reset),
    // its `switchOutStatus` may need to be adjusted to reflect it being active again.
    pokemon.switchOutStatus = false;

    if (pokemon.isShiny()) {
      globalScene.phaseManager.unshiftNew("ShinySparklePhase", pokemon.getBattlerIndex());
    }

    // TODO: Review these conditions
    if (
      !this.loaded
      || [BattleType.TRAINER, BattleType.MYSTERY_ENCOUNTER].includes(battleType)
      || waveIndex % 10 === 1
    ) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
    }

    super.end();
  }

  private async playSendOutMessage(player: boolean): Promise<void> {
    const { ui } = globalScene;
    const { trainer } = globalScene.currentBattle;
    let msg: string;

    if (this.switchType === SwitchType.FORCE_SWITCH) {
      // "XYZ was dragged out!"
      msg = i18next.t("battle:pokemonDraggedOut", {
        pokemonName: getPokemonNameWithAffix(this.getPokemon()),
      });
    } else if (player) {
      msg = i18next.t("battle:playerGo", {
        pokemonName: this.getPokemon().getNameToRender(),
      });
    } else {
      msg = i18next.t("battle:trainerSendOut", {
        trainerName: trainer?.getName(this.getTrainerSlot()),
        pokemonName: this.getPokemon().getNameToRender(),
      });
    }

    await new Promise<void>(resolve => ui.showText(msg, undefined, resolve));
  }
}
