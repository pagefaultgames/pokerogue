import type { BattlerIndex } from "#app/battle";
import { BattleType } from "#enums/battle-type";
import { globalScene } from "#app/global-scene";
import {
  applyPostFaintAbAttrs,
  applyPostKnockOutAbAttrs,
  applyPostVictoryAbAttrs,
  PostFaintAbAttr,
  PostKnockOutAbAttr,
  PostVictoryAbAttr,
} from "#app/data/abilities/ability";
import { BattlerTagLapseType } from "#app/data/battler-tags";
import { battleSpecDialogue } from "#app/data/dialogue";
import { allMoves, PostVictoryStatStageChangeAttr } from "#app/data/moves/move";
import { SpeciesFormChangeActiveTrigger } from "#app/data/pokemon-forms";
import { BattleSpec } from "#app/enums/battle-spec";
import { StatusEffect } from "#app/enums/status-effect";
import type { EnemyPokemon } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import { HitResult, PlayerPokemon, PokemonMove } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonInstantReviveModifier } from "#app/modifier/modifier";
import { SwitchType } from "#enums/switch-type";
import i18next from "i18next";
import { DamageAnimPhase } from "./damage-anim-phase";
import { GameOverPhase } from "./game-over-phase";
import { PokemonPhase } from "./pokemon-phase";
import { SwitchPhase } from "./switch-phase";
import { SwitchSummonPhase } from "./switch-summon-phase";
import { ToggleDoublePositionPhase } from "./toggle-double-position-phase";
import { VictoryPhase } from "./victory-phase";
import { isNullOrUndefined } from "#app/utils/common";
import { FRIENDSHIP_LOSS_FROM_FAINT } from "#app/data/balance/starters";
import { BattlerTagType } from "#enums/battler-tag-type";

export class FaintPhase extends PokemonPhase {
  /**
   * Whether or not instant revive should be prevented
   */
  private preventInstantRevive: boolean;

  /**
   * The source Pokemon that dealt fatal damage
   */
  private source?: Pokemon;

  constructor(battlerIndex: BattlerIndex, preventInstantRevive = false, source?: Pokemon) {
    super(battlerIndex);

    this.preventInstantRevive = preventInstantRevive;
    this.source = source;
  }

  start() {
    super.start();

    const faintPokemon = this.getPokemon();

    if (this.source) {
      faintPokemon.getTag(BattlerTagType.DESTINY_BOND)?.lapse(this.source, BattlerTagLapseType.CUSTOM);
      faintPokemon.getTag(BattlerTagType.GRUDGE)?.lapse(faintPokemon, BattlerTagLapseType.CUSTOM, this.source);
    }

    faintPokemon.resetSummonData();

    if (!this.preventInstantRevive) {
      const instantReviveModifier = globalScene.applyModifier(
        PokemonInstantReviveModifier,
        this.player,
        faintPokemon,
      ) as PokemonInstantReviveModifier;

      if (instantReviveModifier) {
        faintPokemon.loseHeldItem(instantReviveModifier);
        globalScene.updateModifiers(this.player);
        return this.end();
      }
    }

    /** In case the current pokemon was just switched in, make sure it is counted as participating in the combat */
    for (const pokemon of globalScene.getPlayerField()) {
      if (pokemon?.isActive(true) && pokemon.isPlayer()) {
        globalScene.currentBattle.addParticipant(pokemon as PlayerPokemon);
      }
    }

    if (!this.tryOverrideForBattleSpec()) {
      this.doFaint();
    }
  }

  doFaint(): void {
    const pokemon = this.getPokemon();

    // Track total times pokemon have been KO'd for Last Respects/Supreme Overlord
    if (pokemon.isPlayer()) {
      globalScene.arena.playerFaints += 1;
      globalScene.currentBattle.playerFaintsHistory.push({
        pokemon: pokemon,
        turn: globalScene.currentBattle.turn,
      });
    } else {
      globalScene.currentBattle.enemyFaints += 1;
      globalScene.currentBattle.enemyFaintsHistory.push({
        pokemon: pokemon,
        turn: globalScene.currentBattle.turn,
      });
    }

    globalScene.queueMessage(
      i18next.t("battle:fainted", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
      null,
      true,
    );
    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);

    pokemon.resetTera();

    if (pokemon.turnData?.attacksReceived?.length) {
      const lastAttack = pokemon.turnData.attacksReceived[0];
      applyPostFaintAbAttrs(
        PostFaintAbAttr,
        pokemon,
        globalScene.getPokemonById(lastAttack.sourceId)!,
        new PokemonMove(lastAttack.move).getMove(),
        lastAttack.result,
      ); // TODO: is this bang correct?
    } else {
      //If killed by indirect damage, apply post-faint abilities without providing a last move
      applyPostFaintAbAttrs(PostFaintAbAttr, pokemon);
    }

    const alivePlayField = globalScene.getField(true);
    for (const p of alivePlayField) {
      applyPostKnockOutAbAttrs(PostKnockOutAbAttr, p, pokemon);
    }
    if (pokemon.turnData?.attacksReceived?.length) {
      const defeatSource = this.source;

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
      const legalPlayerPokemon = globalScene.getPokemonAllowedInBattle();
      /** The total number of legal player Pokemon that aren't currently on the field */
      const legalPlayerPartyPokemon = legalPlayerPokemon.filter(p => !p.isActive(true));
      if (!legalPlayerPokemon.length) {
        /** If the player doesn't have any legal Pokemon, end the game */
        globalScene.unshiftPhase(new GameOverPhase());
      } else if (
        globalScene.currentBattle.double &&
        legalPlayerPokemon.length === 1 &&
        legalPlayerPartyPokemon.length === 0
      ) {
        /**
         * If the player has exactly one Pokemon in total at this point in a double battle, and that Pokemon
         * is already on the field, unshift a phase that moves that Pokemon to center position.
         */
        globalScene.unshiftPhase(new ToggleDoublePositionPhase(true));
      } else if (legalPlayerPartyPokemon.length > 0) {
        /**
         * If previous conditions weren't met, and the player has at least 1 legal Pokemon off the field,
         * push a phase that prompts the player to summon a Pokemon from their party.
         */
        globalScene.pushPhase(new SwitchPhase(SwitchType.SWITCH, this.fieldIndex, true, false));
      }
    } else {
      globalScene.unshiftPhase(new VictoryPhase(this.battlerIndex));
      if ([BattleType.TRAINER, BattleType.MYSTERY_ENCOUNTER].includes(globalScene.currentBattle.battleType)) {
        const hasReservePartyMember = !!globalScene
          .getEnemyParty()
          .filter(p => p.isActive() && !p.isOnField() && p.trainerSlot === (pokemon as EnemyPokemon).trainerSlot)
          .length;
        if (hasReservePartyMember) {
          globalScene.pushPhase(new SwitchSummonPhase(SwitchType.SWITCH, this.fieldIndex, -1, false, false));
        }
      }
    }

    // in double battles redirect potential moves off fainted pokemon
    const allyPokemon = pokemon.getAlly();
    if (globalScene.currentBattle.double && !isNullOrUndefined(allyPokemon)) {
      globalScene.redirectPokemonMoves(pokemon, allyPokemon);
    }

    pokemon.faintCry(() => {
      if (pokemon instanceof PlayerPokemon) {
        pokemon.addFriendship(-FRIENDSHIP_LOSS_FROM_FAINT);
      }
      pokemon.hideInfo();
      globalScene.playSound("se/faint");
      globalScene.tweens.add({
        targets: pokemon,
        duration: 500,
        y: pokemon.y + 150,
        ease: "Sine.easeIn",
        onComplete: () => {
          pokemon.lapseTags(BattlerTagLapseType.FAINT);

          pokemon.y -= 150;
          pokemon.trySetStatus(StatusEffect.FAINT);
          if (pokemon.isPlayer()) {
            globalScene.currentBattle.removeFaintedParticipant(pokemon as PlayerPokemon);
          } else {
            globalScene.addFaintedEnemyScore(pokemon as EnemyPokemon);
            globalScene.currentBattle.addPostBattleLoot(pokemon as EnemyPokemon);
          }
          pokemon.leaveField();
          this.end();
        },
      });
    });
  }

  tryOverrideForBattleSpec(): boolean {
    switch (globalScene.currentBattle.battleSpec) {
      case BattleSpec.FINAL_BOSS:
        if (!this.player) {
          const enemy = this.getPokemon();
          if (enemy.formIndex) {
            globalScene.ui.showDialogue(
              battleSpecDialogue[BattleSpec.FINAL_BOSS].secondStageWin,
              enemy.species.name,
              null,
              () => this.doFaint(),
            );
          } else {
            // Final boss' HP threshold has been bypassed; cancel faint and force check for 2nd phase
            enemy.hp++;
            globalScene.unshiftPhase(new DamageAnimPhase(enemy.getBattlerIndex(), 0, HitResult.INDIRECT));
            this.end();
          }
          return true;
        }
    }

    return false;
  }
}
