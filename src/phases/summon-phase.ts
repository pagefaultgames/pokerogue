import BattleScene from "#app/battle-scene.js";
import { BattleType } from "#app/battle.js";
import { getPokeballAtlasKey, getPokeballTintColor } from "#app/data/pokeball.js";
import { SpeciesFormChangeActiveTrigger } from "#app/data/pokemon-forms.js";
import { TrainerSlot } from "#app/data/trainer-config.js";
import { PlayerGender } from "#app/enums/player-gender.js";
import { addPokeballOpenParticles } from "#app/field/anims.js";
import Pokemon, { FieldPosition } from "#app/field/pokemon.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import i18next from "i18next";
import { PartyMemberPokemonPhase } from "./party-member-pokemon-phase";
import { PostSummonPhase } from "./post-summon-phase";
import { GameOverPhase } from "./game-over-phase";
import { ShinySparklePhase } from "./shiny-sparkle-phase";

export class SummonPhase extends PartyMemberPokemonPhase {
  private loaded: boolean;

  constructor(scene: BattleScene, fieldIndex: integer, player: boolean = true, loaded: boolean = false) {
    super(scene, fieldIndex, player);

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
    // If the Pokemon about to be sent out is fainted or illegal under a challenge, switch to the first non-fainted legal Pokemon
    if (!partyMember.isAllowedInBattle()) {
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
        this.scene.clearPhaseQueue();
        this.scene.unshiftPhase(new GameOverPhase(this.scene));
        this.end();
        return;
      }

      // Swaps the fainted Pokemon and the first non-fainted legal Pokemon in the party
      [party[this.partyMemberIndex], party[legalIndex]] = [party[legalIndex], party[this.partyMemberIndex]];
      console.warn("Swapped %s %O with %s %O", getPokemonNameWithAffix(partyMember), partyMember, getPokemonNameWithAffix(party[0]), party[0]);
    }

    if (this.player) {
      this.scene.ui.showText(i18next.t("battle:playerGo", { pokemonName: getPokemonNameWithAffix(this.getPokemon()) }));
      if (this.player) {
        this.scene.pbTray.hide();
      }
      this.scene.trainer.setTexture(`trainer_${this.scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`);
      this.scene.time.delayedCall(562, () => {
        this.scene.trainer.setFrame("2");
        this.scene.time.delayedCall(64, () => {
          this.scene.trainer.setFrame("3");
        });
      });
      this.scene.tweens.add({
        targets: this.scene.trainer,
        x: -36,
        duration: 1000,
        onComplete: () => this.scene.trainer.setVisible(false)
      });
      this.scene.time.delayedCall(750, () => this.summon());
    } else {
      const trainerName = this.scene.currentBattle.trainer?.getName(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER);
      const pokemonName = this.getPokemon().getNameToRender();
      const message = i18next.t("battle:trainerSendOut", { trainerName, pokemonName });

      this.scene.pbTrayEnemy.hide();
      this.scene.ui.showText(message, null, () => this.summon());
    }
  }

  summon(): void {
    const pokemon = this.getPokemon();

    const pokeball = this.scene.addFieldSprite(this.player ? 36 : 248, this.player ? 80 : 44, "pb", getPokeballAtlasKey(pokemon.pokeball));
    pokeball.setVisible(false);
    pokeball.setOrigin(0.5, 0.625);
    this.scene.field.add(pokeball);

    if (this.fieldIndex === 1) {
      pokemon.setFieldPosition(FieldPosition.RIGHT, 0);
    } else {
      const availablePartyMembers = this.getParty().filter(p => p.isAllowedInBattle()).length;
      pokemon.setFieldPosition(!this.scene.currentBattle.double || availablePartyMembers === 1 ? FieldPosition.CENTER : FieldPosition.LEFT);
    }

    const fpOffset = pokemon.getFieldPositionOffset();

    pokeball.setVisible(true);

    this.scene.tweens.add({
      targets: pokeball,
      duration: 650,
      x: (this.player ? 100 : 236) + fpOffset[0]
    });

    this.scene.tweens.add({
      targets: pokeball,
      duration: 150,
      ease: "Cubic.easeOut",
      y: (this.player ? 70 : 34) + fpOffset[1],
      onComplete: () => {
        this.scene.tweens.add({
          targets: pokeball,
          duration: 500,
          ease: "Cubic.easeIn",
          angle: 1440,
          y: (this.player ? 132 : 86) + fpOffset[1],
          onComplete: () => {
            this.scene.playSound("se/pb_rel");
            pokeball.destroy();
            this.scene.add.existing(pokemon);
            this.scene.field.add(pokemon);
            if (!this.player) {
              const playerPokemon = this.scene.getPlayerPokemon() as Pokemon;
              if (playerPokemon?.visible) {
                this.scene.field.moveBelow(pokemon, playerPokemon);
              }
              this.scene.currentBattle.seenEnemyPartyMemberIds.add(pokemon.id);
            }
            addPokeballOpenParticles(this.scene, pokemon.x, pokemon.y - 16, pokemon.pokeball);
            this.scene.updateModifiers(this.player);
            this.scene.updateFieldScale();
            pokemon.showInfo();
            pokemon.playAnim();
            pokemon.setVisible(true);
            pokemon.getSprite().setVisible(true);
            pokemon.setScale(0.5);
            pokemon.tint(getPokeballTintColor(pokemon.pokeball));
            pokemon.untint(250, "Sine.easeIn");
            this.scene.updateFieldScale();
            this.scene.tweens.add({
              targets: pokemon,
              duration: 250,
              ease: "Sine.easeIn",
              scale: pokemon.getSpriteScale(),
              onComplete: () => {
                pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
                pokemon.getSprite().clearTint();
                pokemon.resetSummonData();
                this.scene.time.delayedCall(1000, () => this.end());
              }
            });
          }
        });
      }
    });
  }

  onEnd(): void {
    const pokemon = this.getPokemon();

    if (pokemon.isShiny()) {
      this.scene.unshiftPhase(new ShinySparklePhase(this.scene, pokemon.getBattlerIndex()));
    }

    pokemon.resetTurnData();

    if (!this.loaded || this.scene.currentBattle.battleType === BattleType.TRAINER || (this.scene.currentBattle.waveIndex % 10) === 1) {
      this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
      this.queuePostSummon();
    }
  }

  queuePostSummon(): void {
    this.scene.pushPhase(new PostSummonPhase(this.scene, this.getPokemon().getBattlerIndex()));
  }

  end() {
    this.onEnd();

    super.end();
  }
}
