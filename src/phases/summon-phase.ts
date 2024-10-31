import { BattleType } from "#app/battle";
import { getPokeballAtlasKey, getPokeballTintColor } from "#app/data/pokeball";
import { SpeciesFormChangeActiveTrigger } from "#app/data/pokemon-forms";
import { TrainerSlot } from "#app/data/trainer-config";
import { PlayerGender } from "#app/enums/player-gender";
import { addPokeballOpenParticles } from "#app/field/anims";
import Pokemon, { FieldPosition } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import i18next from "i18next";
import { PartyMemberPokemonPhase } from "./party-member-pokemon-phase";
import { PostSummonPhase } from "./post-summon-phase";
import { GameOverPhase } from "./game-over-phase";
import { ShinySparklePhase } from "./shiny-sparkle-phase";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { gScene } from "#app/battle-scene";

export class SummonPhase extends PartyMemberPokemonPhase {
  private loaded: boolean;

  constructor(fieldIndex: integer, player: boolean = true, loaded: boolean = false) {
    super(fieldIndex, player);

    this.loaded = loaded;
  }

  start() {
    super.start();

    this.preSummon();
  }

  /**
    * Sends out a Pokemon before the battle begins and shows the appropriate messages
    */
  preSummon(): void {
    const partyMember = this.getPokemon();
    // If the Pokemon about to be sent out is fainted, illegal under a challenge, or no longer in the party for some reason, switch to the first non-fainted legal Pokemon
    if (!partyMember.isAllowedInBattle() || (this.player && !this.getParty().some(p => p.id === partyMember.id))) {
      console.warn("The Pokemon about to be sent out is fainted or illegal under a challenge. Attempting to resolve...");

      // First check if they're somehow still in play, if so remove them.
      if (partyMember.isOnField()) {
        partyMember.leaveField();
      }

      const party = this.getParty();

      // Find the first non-fainted Pokemon index above the current one
      const legalIndex = party.findIndex((p, i) => i > this.partyMemberIndex && p.isAllowedInBattle());
      if (legalIndex === -1) {
        console.error("Party Details:\n", party);
        console.error("All available Pokemon were fainted or illegal!");
        gScene.clearPhaseQueue();
        gScene.unshiftPhase(new GameOverPhase());
        this.end();
        return;
      }

      // Swaps the fainted Pokemon and the first non-fainted legal Pokemon in the party
      [ party[this.partyMemberIndex], party[legalIndex] ] = [ party[legalIndex], party[this.partyMemberIndex] ];
      console.warn("Swapped %s %O with %s %O", getPokemonNameWithAffix(partyMember), partyMember, getPokemonNameWithAffix(party[0]), party[0]);
    }

    if (this.player) {
      gScene.ui.showText(i18next.t("battle:playerGo", { pokemonName: getPokemonNameWithAffix(this.getPokemon()) }));
      if (this.player) {
        gScene.pbTray.hide();
      }
      gScene.trainer.setTexture(`trainer_${gScene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`);
      gScene.time.delayedCall(562, () => {
        gScene.trainer.setFrame("2");
        gScene.time.delayedCall(64, () => {
          gScene.trainer.setFrame("3");
        });
      });
      gScene.tweens.add({
        targets: gScene.trainer,
        x: -36,
        duration: 1000,
        onComplete: () => gScene.trainer.setVisible(false)
      });
      gScene.time.delayedCall(750, () => this.summon());
    } else if (gScene.currentBattle.battleType === BattleType.TRAINER || gScene.currentBattle.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE) {
      const trainerName = gScene.currentBattle.trainer?.getName(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER);
      const pokemonName = this.getPokemon().getNameToRender();
      const message = i18next.t("battle:trainerSendOut", { trainerName, pokemonName });

      gScene.pbTrayEnemy.hide();
      gScene.ui.showText(message, null, () => this.summon());
    } else if (gScene.currentBattle.isBattleMysteryEncounter()) {
      gScene.pbTrayEnemy.hide();
      this.summonWild();
    }
  }

  /**
   * Enemy trainer or player trainer will do animations to throw Pokeball and summon a Pokemon to the field.
   */
  summon(): void {
    const pokemon = this.getPokemon();

    const pokeball = gScene.addFieldSprite(this.player ? 36 : 248, this.player ? 80 : 44, "pb", getPokeballAtlasKey(pokemon.pokeball));
    pokeball.setVisible(false);
    pokeball.setOrigin(0.5, 0.625);
    gScene.field.add(pokeball);

    if (this.fieldIndex === 1) {
      pokemon.setFieldPosition(FieldPosition.RIGHT, 0);
    } else {
      const availablePartyMembers = this.getParty().filter(p => p.isAllowedInBattle()).length;
      pokemon.setFieldPosition(!gScene.currentBattle.double || availablePartyMembers === 1 ? FieldPosition.CENTER : FieldPosition.LEFT);
    }

    const fpOffset = pokemon.getFieldPositionOffset();

    pokeball.setVisible(true);

    gScene.tweens.add({
      targets: pokeball,
      duration: 650,
      x: (this.player ? 100 : 236) + fpOffset[0]
    });

    gScene.tweens.add({
      targets: pokeball,
      duration: 150,
      ease: "Cubic.easeOut",
      y: (this.player ? 70 : 34) + fpOffset[1],
      onComplete: () => {
        gScene.tweens.add({
          targets: pokeball,
          duration: 500,
          ease: "Cubic.easeIn",
          angle: 1440,
          y: (this.player ? 132 : 86) + fpOffset[1],
          onComplete: () => {
            gScene.playSound("se/pb_rel");
            pokeball.destroy();
            gScene.add.existing(pokemon);
            gScene.field.add(pokemon);
            if (!this.player) {
              const playerPokemon = gScene.getPlayerPokemon() as Pokemon;
              if (playerPokemon?.visible) {
                gScene.field.moveBelow(pokemon, playerPokemon);
              }
              gScene.currentBattle.seenEnemyPartyMemberIds.add(pokemon.id);
            }
            addPokeballOpenParticles(pokemon.x, pokemon.y - 16, pokemon.pokeball);
            gScene.updateModifiers(this.player);
            gScene.updateFieldScale();
            pokemon.showInfo();
            pokemon.playAnim();
            pokemon.setVisible(true);
            pokemon.getSprite().setVisible(true);
            pokemon.setScale(0.5);
            pokemon.tint(getPokeballTintColor(pokemon.pokeball));
            pokemon.untint(250, "Sine.easeIn");
            gScene.updateFieldScale();
            gScene.tweens.add({
              targets: pokemon,
              duration: 250,
              ease: "Sine.easeIn",
              scale: pokemon.getSpriteScale(),
              onComplete: () => {
                pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
                pokemon.getSprite().clearTint();
                pokemon.resetSummonData();
                gScene.time.delayedCall(1000, () => this.end());
              }
            });
          }
        });
      }
    });
  }

  /**
   * Handles tweening and battle setup for a wild Pokemon that appears outside of the normal screen transition.
   * Wild Pokemon will ease and fade in onto the field, then perform standard summon behavior.
   * Currently only used by Mystery Encounters, as all other battle types pre-summon wild pokemon before screen transitions.
   */
  summonWild(): void {
    const pokemon = this.getPokemon();

    if (this.fieldIndex === 1) {
      pokemon.setFieldPosition(FieldPosition.RIGHT, 0);
    } else {
      const availablePartyMembers = this.getParty().filter(p => !p.isFainted()).length;
      pokemon.setFieldPosition(!gScene.currentBattle.double || availablePartyMembers === 1 ? FieldPosition.CENTER : FieldPosition.LEFT);
    }

    gScene.add.existing(pokemon);
    gScene.field.add(pokemon);
    if (!this.player) {
      const playerPokemon = gScene.getPlayerPokemon() as Pokemon;
      if (playerPokemon?.visible) {
        gScene.field.moveBelow(pokemon, playerPokemon);
      }
      gScene.currentBattle.seenEnemyPartyMemberIds.add(pokemon.id);
    }
    gScene.updateModifiers(this.player);
    gScene.updateFieldScale();
    pokemon.showInfo();
    pokemon.playAnim();
    pokemon.setVisible(true);
    pokemon.getSprite().setVisible(true);
    pokemon.setScale(0.75);
    pokemon.tint(getPokeballTintColor(pokemon.pokeball));
    pokemon.untint(250, "Sine.easeIn");
    gScene.updateFieldScale();
    pokemon.x += 16;
    pokemon.y -= 20;
    pokemon.alpha = 0;

    // Ease pokemon in
    gScene.tweens.add({
      targets: pokemon,
      x: "-=16",
      y: "+=16",
      alpha: 1,
      duration: 1000,
      ease: "Sine.easeIn",
      scale: pokemon.getSpriteScale(),
      onComplete: () => {
        pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
        pokemon.getSprite().clearTint();
        pokemon.resetSummonData();
        gScene.updateFieldScale();
        gScene.time.delayedCall(1000, () => this.end());
      }
    });
  }

  onEnd(): void {
    const pokemon = this.getPokemon();

    if (pokemon.isShiny()) {
      gScene.unshiftPhase(new ShinySparklePhase(pokemon.getBattlerIndex()));
    }

    pokemon.resetTurnData();

    if (!this.loaded || [ BattleType.TRAINER, BattleType.MYSTERY_ENCOUNTER ].includes(gScene.currentBattle.battleType) || (gScene.currentBattle.waveIndex % 10) === 1) {
      gScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
      this.queuePostSummon();
    }
  }

  queuePostSummon(): void {
    gScene.pushPhase(new PostSummonPhase(this.getPokemon().getBattlerIndex()));
  }

  end() {
    this.onEnd();

    super.end();
  }
}
