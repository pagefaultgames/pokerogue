import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { FRIENDSHIP_LOSS_FROM_FAINT } from "#balance/starters";
import { allMoves } from "#data/data-lists";
import { battleSpecDialogue } from "#data/dialogue";
import { SpeciesFormChangeActiveTrigger } from "#data/form-change-triggers";
import { BattleSpec } from "#enums/battle-spec";
import { BattleType } from "#enums/battle-type";
import type { BattlerIndex } from "#enums/battler-index";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HitResult } from "#enums/hit-result";
import { StatusEffect } from "#enums/status-effect";
import { SwitchType } from "#enums/switch-type";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#field/pokemon";
import { PokemonInstantReviveModifier } from "#modifiers/modifier";
import { PokemonMove } from "#moves/pokemon-move";
import { PokemonPhase } from "#phases/pokemon-phase";
import { isNullOrUndefined } from "#utils/common";
import i18next from "i18next";

export class FaintPhase extends PokemonPhase {
  public readonly phaseName = "FaintPhase";
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

    /**
     * In case the current pokemon was just switched in, make sure it is counted as participating in the combat.
     * For EXP_SHARE purposes, if the current pokemon faints as the combat ends and it was the ONLY player pokemon
     * involved in combat, it needs to be counted as a participant so the other party pokemon can get their EXP,
     * so the fainted pokemon has been included.
     */
    for (const pokemon of globalScene.getPlayerField()) {
      if (pokemon?.isActive() || pokemon?.isFainted()) {
        globalScene.currentBattle.addParticipant(pokemon);
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
        pokemon,
        turn: globalScene.currentBattle.turn,
      });
    } else {
      globalScene.currentBattle.enemyFaints += 1;
      globalScene.currentBattle.enemyFaintsHistory.push({
        pokemon,
        turn: globalScene.currentBattle.turn,
      });
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("battle:fainted", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
      null,
      true,
    );
    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);

    pokemon.resetTera();

    // TODO: this can be simplified by just checking whether lastAttack is defined
    if (pokemon.turnData.attacksReceived?.length > 0) {
      const lastAttack = pokemon.turnData.attacksReceived[0];
      applyAbAttrs("PostFaintAbAttr", {
        pokemon,
        // TODO: We should refactor lastAttack's sourceId to forbid null and just use undefined
        attacker: globalScene.getPokemonById(lastAttack.sourceId) ?? undefined,
        // TODO: improve the way that we provide the move that knocked out the pokemon...
        move: new PokemonMove(lastAttack.move).getMove(),
        hitResult: lastAttack.result,
      }); // TODO: is this bang correct?
    } else {
      //If killed by indirect damage, apply post-faint abilities without providing a last move
      applyAbAttrs("PostFaintAbAttr", { pokemon });
    }

    const alivePlayField = globalScene.getField(true);
    for (const p of alivePlayField) {
      applyAbAttrs("PostKnockOutAbAttr", { pokemon: p, victim: pokemon });
    }
    if (pokemon.turnData.attacksReceived?.length > 0) {
      const defeatSource = this.source;

      if (defeatSource?.isOnField()) {
        applyAbAttrs("PostVictoryAbAttr", { pokemon: defeatSource });
        const pvmove = allMoves[pokemon.turnData.attacksReceived[0].move];
        const pvattrs = pvmove.getAttrs("PostVictoryStatStageChangeAttr");
        if (pvattrs.length > 0) {
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
      if (legalPlayerPokemon.length === 0) {
        /** If the player doesn't have any legal Pokemon, end the game */
        globalScene.phaseManager.unshiftNew("GameOverPhase");
      } else if (
        globalScene.currentBattle.double
        && legalPlayerPokemon.length === 1
        && legalPlayerPartyPokemon.length === 0
      ) {
        /**
         * If the player has exactly one Pokemon in total at this point in a double battle, and that Pokemon
         * is already on the field, unshift a phase that moves that Pokemon to center position.
         */
        globalScene.phaseManager.unshiftNew("ToggleDoublePositionPhase", true);
      } else if (legalPlayerPartyPokemon.length > 0) {
        /**
         * If previous conditions weren't met, and the player has at least 1 legal Pokemon off the field,
         * push a phase that prompts the player to summon a Pokemon from their party.
         */
        globalScene.phaseManager.pushNew("SwitchPhase", SwitchType.SWITCH, this.fieldIndex, true, false);
      }
    } else {
      globalScene.phaseManager.unshiftNew("VictoryPhase", this.battlerIndex);
      if ([BattleType.TRAINER, BattleType.MYSTERY_ENCOUNTER].includes(globalScene.currentBattle.battleType)) {
        const hasReservePartyMember =
          globalScene
            .getEnemyParty()
            .filter(p => p.isActive() && !p.isOnField() && p.trainerSlot === (pokemon as EnemyPokemon).trainerSlot)
            .length > 0;
        if (hasReservePartyMember) {
          globalScene.phaseManager.pushNew("SwitchSummonPhase", SwitchType.SWITCH, this.fieldIndex, -1, false, false);
        }
      }
    }

    // in double battles redirect potential moves off fainted pokemon
    const allyPokemon = pokemon.getAlly();
    if (globalScene.currentBattle.double && !isNullOrUndefined(allyPokemon)) {
      globalScene.redirectPokemonMoves(pokemon, allyPokemon);
    }

    pokemon.faintCry(() => {
      if (pokemon.isPlayer()) {
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
          pokemon.doSetStatus(StatusEffect.FAINT);
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
            globalScene.phaseManager.unshiftNew("DamageAnimPhase", enemy.getBattlerIndex(), 0, HitResult.INDIRECT);
            this.end();
          }
          return true;
        }
    }

    return false;
  }
}
