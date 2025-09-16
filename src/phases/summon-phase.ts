import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { SpeciesFormChangeActiveTrigger } from "#data/form-change-triggers";
import { getPokeballAtlasKey, getPokeballTintColor } from "#data/pokeball";
import { BattleType } from "#enums/battle-type";
import { FieldPosition } from "#enums/field-position";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { PlayerGender } from "#enums/player-gender";
import { TrainerSlot } from "#enums/trainer-slot";
import { addPokeballOpenParticles } from "#field/anims";
import type { Pokemon } from "#field/pokemon";
import { PartyMemberPokemonPhase } from "#phases/party-member-pokemon-phase";
import i18next from "i18next";

export class SummonPhase extends PartyMemberPokemonPhase {
  // The union type is needed to keep typescript happy as these phases extend from SummonPhase
  public readonly phaseName: "SummonPhase" | "SummonMissingPhase" | "SwitchSummonPhase" | "ReturnPhase" = "SummonPhase";
  private loaded: boolean;

  constructor(fieldIndex: number, player = true, loaded = false) {
    super(fieldIndex, player);

    this.loaded = loaded;
  }

  start() {
    super.start();

    applyAbAttrs("PreSummonAbAttr", { pokemon: this.getPokemon() });
    this.preSummon();
  }

  /**
   * Sends out a Pokemon before the battle begins and shows the appropriate messages
   */
  preSummon(): void {
    const partyMember = this.getPokemon();
    // If the Pokemon about to be sent out is fainted, illegal under a challenge, or no longer in the party for some reason, switch to the first non-fainted legal Pokemon
    if (!partyMember.isAllowedInBattle() || (this.player && !this.getParty().some(p => p.id === partyMember.id))) {
      console.warn(
        "The Pokemon about to be sent out is fainted or illegal under a challenge. Attempting to resolve...",
      );

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
        globalScene.phaseManager.clearPhaseQueue();
        globalScene.phaseManager.unshiftNew("GameOverPhase");
        this.end();
        return;
      }

      // Swaps the fainted Pokemon and the first non-fainted legal Pokemon in the party
      [party[this.partyMemberIndex], party[legalIndex]] = [party[legalIndex], party[this.partyMemberIndex]];
      console.warn(
        "Swapped %s %O with %s %O",
        getPokemonNameWithAffix(partyMember),
        partyMember,
        getPokemonNameWithAffix(party[0]),
        party[0],
      );
    }

    if (this.player) {
      globalScene.ui.showText(
        i18next.t("battle:playerGo", {
          pokemonName: getPokemonNameWithAffix(this.getPokemon()),
        }),
      );
      if (this.player) {
        globalScene.pbTray.hide();
      }
      globalScene.trainer.setTexture(
        `trainer_${globalScene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`,
      );
      globalScene.time.delayedCall(562, () => {
        globalScene.trainer.setFrame("2");
        globalScene.time.delayedCall(64, () => {
          globalScene.trainer.setFrame("3");
        });
      });
      globalScene.tweens.add({
        targets: globalScene.trainer,
        x: -36,
        duration: 1000,
        onComplete: () => globalScene.trainer.setVisible(false),
      });
      globalScene.time.delayedCall(750, () => this.summon());
    } else if (
      globalScene.currentBattle.battleType === BattleType.TRAINER
      || globalScene.currentBattle.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE
    ) {
      const trainerName = globalScene.currentBattle.trainer?.getName(
        !(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER,
      );
      const pokemonName = this.getPokemon().getNameToRender();
      const message = i18next.t("battle:trainerSendOut", {
        trainerName,
        pokemonName,
      });

      globalScene.pbTrayEnemy.hide();
      globalScene.ui.showText(message, null, () => this.summon());
    } else if (globalScene.currentBattle.isBattleMysteryEncounter()) {
      globalScene.pbTrayEnemy.hide();
      this.summonWild();
    }
  }

  /**
   * Enemy trainer or player trainer will do animations to throw Pokeball and summon a Pokemon to the field.
   */
  summon(): void {
    const pokemon = this.getPokemon();

    const pokeball = globalScene.addFieldSprite(
      this.player ? 36 : 248,
      this.player ? 80 : 44,
      "pb",
      getPokeballAtlasKey(pokemon.getPokeball(true)),
    );
    pokeball.setVisible(false);
    pokeball.setOrigin(0.5, 0.625);
    globalScene.field.add(pokeball);

    if (this.fieldIndex === 1) {
      pokemon.setFieldPosition(FieldPosition.RIGHT, 0);
    } else {
      const availablePartyMembers = this.getParty().filter(p => p.isAllowedInBattle()).length;
      pokemon.setFieldPosition(
        !globalScene.currentBattle.double || availablePartyMembers === 1 ? FieldPosition.CENTER : FieldPosition.LEFT,
      );
    }

    const fpOffset = pokemon.getFieldPositionOffset();

    pokeball.setVisible(true);

    globalScene.tweens.add({
      targets: pokeball,
      duration: 650,
      x: (this.player ? 100 : 236) + fpOffset[0],
    });

    globalScene.tweens.add({
      targets: pokeball,
      duration: 150,
      ease: "Cubic.easeOut",
      y: (this.player ? 70 : 34) + fpOffset[1],
      onComplete: () => {
        globalScene.tweens.add({
          targets: pokeball,
          duration: 500,
          ease: "Cubic.easeIn",
          angle: 1440,
          y: (this.player ? 132 : 86) + fpOffset[1],
          onComplete: () => {
            globalScene.playSound("se/pb_rel");
            pokeball.destroy();
            globalScene.add.existing(pokemon);
            globalScene.field.add(pokemon);
            if (!this.player) {
              const playerPokemon = globalScene.getPlayerPokemon() as Pokemon;
              if (playerPokemon?.isOnField()) {
                globalScene.field.moveBelow(pokemon, playerPokemon);
              }
              globalScene.currentBattle.seenEnemyPartyMemberIds.add(pokemon.id);
            }
            addPokeballOpenParticles(pokemon.x, pokemon.y - 16, pokemon.getPokeball(true));
            globalScene.updateModifiers(this.player);
            globalScene.updateFieldScale();
            pokemon.showInfo();
            pokemon.playAnim();
            pokemon.setVisible(true);
            pokemon.getSprite().setVisible(true);
            pokemon.setScale(0.5);
            pokemon.tint(getPokeballTintColor(pokemon.getPokeball(true)));
            pokemon.untint(250, "Sine.easeIn");
            globalScene.updateFieldScale();
            globalScene.tweens.add({
              targets: pokemon,
              duration: 250,
              ease: "Sine.easeIn",
              scale: pokemon.getSpriteScale(),
              onComplete: () => {
                pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
                pokemon.getSprite().clearTint();
                pokemon.fieldSetup();
                // necessary to stay transformed during wild waves
                if (pokemon.summonData.speciesForm) {
                  pokemon.loadAssets(false);
                }
                globalScene.time.delayedCall(1000, () => this.end());
              },
            });
          },
        });
      },
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
      pokemon.setFieldPosition(
        !globalScene.currentBattle.double || availablePartyMembers === 1 ? FieldPosition.CENTER : FieldPosition.LEFT,
      );
    }

    globalScene.add.existing(pokemon);
    globalScene.field.add(pokemon);
    if (!this.player) {
      const playerPokemon = globalScene.getPlayerPokemon() as Pokemon;
      if (playerPokemon?.isOnField()) {
        globalScene.field.moveBelow(pokemon, playerPokemon);
      }
      globalScene.currentBattle.seenEnemyPartyMemberIds.add(pokemon.id);
    }
    globalScene.updateModifiers(this.player);
    globalScene.updateFieldScale();
    pokemon.showInfo();
    pokemon.playAnim();
    pokemon.setVisible(true);
    pokemon.getSprite().setVisible(true);
    pokemon.setScale(0.75);
    pokemon.tint(getPokeballTintColor(pokemon.pokeball));
    pokemon.untint(250, "Sine.easeIn");
    globalScene.updateFieldScale();
    pokemon.x += 16;
    pokemon.y -= 20;
    pokemon.alpha = 0;

    // Ease pokemon in
    globalScene.tweens.add({
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
        pokemon.fieldSetup();
        globalScene.updateFieldScale();
        globalScene.time.delayedCall(1000, () => this.end());
      },
    });
  }

  onEnd(): void {
    const pokemon = this.getPokemon();

    if (pokemon.isShiny(true)) {
      globalScene.phaseManager.unshiftNew("ShinySparklePhase", pokemon.getBattlerIndex());
    }

    pokemon.resetTurnData();

    if (
      !this.loaded
      || [BattleType.TRAINER, BattleType.MYSTERY_ENCOUNTER].includes(globalScene.currentBattle.battleType)
      || globalScene.currentBattle.waveIndex % 10 === 1
    ) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
      this.queuePostSummon();
    }
  }

  queuePostSummon(): void {
    globalScene.phaseManager.pushNew("PostSummonPhase", this.getPokemon().getBattlerIndex());
  }

  end() {
    this.onEnd();

    super.end();
  }
}
