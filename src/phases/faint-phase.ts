import { gScene } from "#app/battle-scene";
import { BattlerIndex, BattleType } from "#app/battle";
import { applyPostFaintAbAttrs, PostFaintAbAttr, applyPostKnockOutAbAttrs, PostKnockOutAbAttr, applyPostVictoryAbAttrs, PostVictoryAbAttr } from "#app/data/ability";
import { BattlerTagLapseType, DestinyBondTag } from "#app/data/battler-tags";
import { battleSpecDialogue } from "#app/data/dialogue";
import { allMoves, PostVictoryStatStageChangeAttr } from "#app/data/move";
import { BattleSpec } from "#app/enums/battle-spec";
import { StatusEffect } from "#app/enums/status-effect";
import Pokemon, { PokemonMove, EnemyPokemon, PlayerPokemon, HitResult } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonInstantReviveModifier } from "#app/modifier/modifier";
import i18next from "i18next";
import { DamagePhase } from "./damage-phase";
import { PokemonPhase } from "./pokemon-phase";
import { SwitchSummonPhase } from "./switch-summon-phase";
import { ToggleDoublePositionPhase } from "./toggle-double-position-phase";
import { GameOverPhase } from "./game-over-phase";
import { SwitchPhase } from "./switch-phase";
import { VictoryPhase } from "./victory-phase";
import { SpeciesFormChangeActiveTrigger } from "#app/data/pokemon-forms";
import { SwitchType } from "#enums/switch-type";
import { isNullOrUndefined } from "#app/utils";
import { FRIENDSHIP_LOSS_FROM_FAINT } from "#app/data/balance/starters";

export class FaintPhase extends PokemonPhase {
  /**
   * Whether or not enduring (for this phase's purposes, Reviver Seed) should be prevented
   */
  private preventEndure: boolean;

  /**
   * Destiny Bond tag belonging to the currently fainting Pokemon, if applicable
   */
  private destinyTag?: DestinyBondTag;

  /**
   * The source Pokemon that dealt fatal damage and should get KO'd by Destiny Bond, if applicable
   */
  private source?: Pokemon;

  constructor(battlerIndex: BattlerIndex, preventEndure: boolean = false, destinyTag?: DestinyBondTag, source?: Pokemon) {
    super(battlerIndex);

    this.preventEndure = preventEndure;
    this.destinyTag = destinyTag;
    this.source = source;
  }

  start() {
    super.start();

    if (!isNullOrUndefined(this.destinyTag) && !isNullOrUndefined(this.source)) {
      this.destinyTag.lapse(this.source, BattlerTagLapseType.CUSTOM);
    }

    if (!this.preventEndure) {
      const instantReviveModifier = gScene.applyModifier(PokemonInstantReviveModifier, this.player, this.getPokemon()) as PokemonInstantReviveModifier;

      if (instantReviveModifier) {
        if (!--instantReviveModifier.stackCount) {
          gScene.removeModifier(instantReviveModifier);
        }
        gScene.updateModifiers(this.player);
        return this.end();
      }
    }

    /** In case the current pokemon was just switched in, make sure it is counted as participating in the combat */
    gScene.getPlayerField().forEach((pokemon, i) => {
      if (pokemon?.isActive(true)) {
        if (pokemon.isPlayer()) {
          gScene.currentBattle.addParticipant(pokemon as PlayerPokemon);
        }
      }
    });

    if (!this.tryOverrideForBattleSpec()) {
      this.doFaint();
    }
  }

  doFaint(): void {
    const pokemon = this.getPokemon();


    // Track total times pokemon have been KO'd for supreme overlord/last respects
    if (pokemon.isPlayer()) {
      gScene.currentBattle.playerFaints += 1;
      gScene.currentBattle.playerFaintsHistory.push({ pokemon: pokemon, turn: gScene.currentBattle.turn });
    } else {
      gScene.currentBattle.enemyFaints += 1;
      gScene.currentBattle.enemyFaintsHistory.push({ pokemon: pokemon, turn: gScene.currentBattle.turn });
    }

    gScene.queueMessage(i18next.t("battle:fainted", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }), null, true);
    gScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);

    if (pokemon.turnData?.attacksReceived?.length) {
      const lastAttack = pokemon.turnData.attacksReceived[0];
      applyPostFaintAbAttrs(PostFaintAbAttr, pokemon, gScene.getPokemonById(lastAttack.sourceId)!, new PokemonMove(lastAttack.move).getMove(), lastAttack.result); // TODO: is this bang correct?
    } else { //If killed by indirect damage, apply post-faint abilities without providing a last move
      applyPostFaintAbAttrs(PostFaintAbAttr, pokemon);
    }

    const alivePlayField = gScene.getField(true);
    alivePlayField.forEach(p => applyPostKnockOutAbAttrs(PostKnockOutAbAttr, p, pokemon));
    if (pokemon.turnData?.attacksReceived?.length) {
      const defeatSource = gScene.getPokemonById(pokemon.turnData.attacksReceived[0].sourceId);
      if (defeatSource?.isOnField()) {
        applyPostVictoryAbAttrs(PostVictoryAbAttr, defeatSource);
        const pvmove = allMoves[pokemon.turnData.attacksReceived[0].move];
        const pvattrs = pvmove.getAttrs(PostVictoryStatStageChangeAttr);
        if (pvattrs.length) {
          for (const pvattr of pvattrs) {
            pvattr.applyPostVictory(defeatSource, defeatSource, pvmove);
          }
        }
      }
    }

    if (this.player) {
      /** The total number of Pokemon in the player's party that can legally fight */
      const legalPlayerPokemon = gScene.getParty().filter(p => p.isAllowedInBattle());
      /** The total number of legal player Pokemon that aren't currently on the field */
      const legalPlayerPartyPokemon = legalPlayerPokemon.filter(p => !p.isActive(true));
      if (!legalPlayerPokemon.length) {
        /** If the player doesn't have any legal Pokemon, end the game */
        gScene.unshiftPhase(new GameOverPhase());
      } else if (gScene.currentBattle.double && legalPlayerPokemon.length === 1 && legalPlayerPartyPokemon.length === 0) {
        /**
         * If the player has exactly one Pokemon in total at this point in a double battle, and that Pokemon
         * is already on the field, unshift a phase that moves that Pokemon to center position.
         */
        gScene.unshiftPhase(new ToggleDoublePositionPhase(true));
      } else if (legalPlayerPartyPokemon.length > 0) {
        /**
         * If previous conditions weren't met, and the player has at least 1 legal Pokemon off the field,
         * push a phase that prompts the player to summon a Pokemon from their party.
         */
        gScene.pushPhase(new SwitchPhase(SwitchType.SWITCH, this.fieldIndex, true, false));
      }
    } else {
      gScene.unshiftPhase(new VictoryPhase(this.battlerIndex));
      if ([ BattleType.TRAINER, BattleType.MYSTERY_ENCOUNTER ].includes(gScene.currentBattle.battleType)) {
        const hasReservePartyMember = !!gScene.getEnemyParty().filter(p => p.isActive() && !p.isOnField() && p.trainerSlot === (pokemon as EnemyPokemon).trainerSlot).length;
        if (hasReservePartyMember) {
          gScene.pushPhase(new SwitchSummonPhase(SwitchType.SWITCH, this.fieldIndex, -1, false, false));
        }
      }
    }

    // in double battles redirect potential moves off fainted pokemon
    if (gScene.currentBattle.double) {
      const allyPokemon = pokemon.getAlly();
      gScene.redirectPokemonMoves(pokemon, allyPokemon);
    }

    pokemon.faintCry(() => {
      if (pokemon instanceof PlayerPokemon) {
        pokemon.addFriendship(-FRIENDSHIP_LOSS_FROM_FAINT);
      }
      pokemon.hideInfo();
      gScene.playSound("se/faint");
      gScene.tweens.add({
        targets: pokemon,
        duration: 500,
        y: pokemon.y + 150,
        ease: "Sine.easeIn",
        onComplete: () => {
          pokemon.resetSprite();
          pokemon.lapseTags(BattlerTagLapseType.FAINT);
          gScene.getField(true).filter(p => p !== pokemon).forEach(p => p.removeTagsBySourceId(pokemon.id));

          pokemon.y -= 150;
          pokemon.trySetStatus(StatusEffect.FAINT);
          if (pokemon.isPlayer()) {
            gScene.currentBattle.removeFaintedParticipant(pokemon as PlayerPokemon);
          } else {
            gScene.addFaintedEnemyScore(pokemon as EnemyPokemon);
            gScene.currentBattle.addPostBattleLoot(pokemon as EnemyPokemon);
          }
          gScene.field.remove(pokemon);
          this.end();
        }
      });
    });
  }

  tryOverrideForBattleSpec(): boolean {
    switch (gScene.currentBattle.battleSpec) {
      case BattleSpec.FINAL_BOSS:
        if (!this.player) {
          const enemy = this.getPokemon();
          if (enemy.formIndex) {
            gScene.ui.showDialogue(battleSpecDialogue[BattleSpec.FINAL_BOSS].secondStageWin, enemy.species.name, null, () => this.doFaint());
          } else {
          // Final boss' HP threshold has been bypassed; cancel faint and force check for 2nd phase
            enemy.hp++;
            gScene.unshiftPhase(new DamagePhase(enemy.getBattlerIndex(), 0, HitResult.OTHER));
            this.end();
          }
          return true;
        }
    }

    return false;
  }
}
