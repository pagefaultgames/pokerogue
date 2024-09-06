import BattleScene from "#app/battle-scene";
import { BattlerIndex, BattleType } from "#app/battle";
import { applyPostFaintAbAttrs, PostFaintAbAttr, applyPostKnockOutAbAttrs, PostKnockOutAbAttr, applyPostVictoryAbAttrs, PostVictoryAbAttr } from "#app/data/ability";
import { BattlerTagLapseType } from "#app/data/battler-tags";
import { battleSpecDialogue } from "#app/data/dialogue";
import { allMoves, PostVictoryStatStageChangeAttr } from "#app/data/move";
import { BattleSpec } from "#app/enums/battle-spec";
import { StatusEffect } from "#app/enums/status-effect";
import { PokemonMove, EnemyPokemon, PlayerPokemon, HitResult } from "#app/field/pokemon";
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

export class FaintPhase extends PokemonPhase {
  private preventEndure: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, preventEndure?: boolean) {
    super(scene, battlerIndex);

    this.preventEndure = preventEndure!; // TODO: is this bang correct?
  }

  start() {
    super.start();

    if (!this.preventEndure) {
      const instantReviveModifier = this.scene.applyModifier(PokemonInstantReviveModifier, this.player, this.getPokemon()) as PokemonInstantReviveModifier;

      if (instantReviveModifier) {
        if (!--instantReviveModifier.stackCount) {
          this.scene.removeModifier(instantReviveModifier);
        }
        this.scene.updateModifiers(this.player);
        return this.end();
      }
    }

    if (!this.tryOverrideForBattleSpec()) {
      this.doFaint();
    }
  }

  doFaint(): void {
    const pokemon = this.getPokemon();


    // Track total times pokemon have been KO'd for supreme overlord/last respects
    if (pokemon.isPlayer()) {
      this.scene.currentBattle.playerFaints += 1;
    } else {
      this.scene.currentBattle.enemyFaints += 1;
    }

    this.scene.queueMessage(i18next.t("battle:fainted", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }), null, true);
    this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);

    if (pokemon.turnData?.attacksReceived?.length) {
      const lastAttack = pokemon.turnData.attacksReceived[0];
      applyPostFaintAbAttrs(PostFaintAbAttr, pokemon, this.scene.getPokemonById(lastAttack.sourceId)!, new PokemonMove(lastAttack.move).getMove(), lastAttack.result); // TODO: is this bang correct?
    }

    const alivePlayField = this.scene.getField(true);
    alivePlayField.forEach(p => applyPostKnockOutAbAttrs(PostKnockOutAbAttr, p, pokemon));
    if (pokemon.turnData?.attacksReceived?.length) {
      const defeatSource = this.scene.getPokemonById(pokemon.turnData.attacksReceived[0].sourceId);
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
      const legalPlayerPokemon = this.scene.getParty().filter(p => p.isAllowedInBattle());
      /** The total number of legal player Pokemon that aren't currently on the field */
      const legalPlayerPartyPokemon = legalPlayerPokemon.filter(p => !p.isActive(true));
      if (!legalPlayerPokemon.length) {
        /** If the player doesn't have any legal Pokemon, end the game */
        this.scene.unshiftPhase(new GameOverPhase(this.scene));
      } else if (this.scene.currentBattle.double && legalPlayerPokemon.length === 1 && legalPlayerPartyPokemon.length === 0) {
        /**
         * If the player has exactly one Pokemon in total at this point in a double battle, and that Pokemon
         * is already on the field, unshift a phase that moves that Pokemon to center position.
         */
        this.scene.unshiftPhase(new ToggleDoublePositionPhase(this.scene, true));
      } else if (legalPlayerPartyPokemon.length > 0) {
        /**
         * If previous conditions weren't met, and the player has at least 1 legal Pokemon off the field,
         * push a phase that prompts the player to summon a Pokemon from their party.
         */
        this.scene.pushPhase(new SwitchPhase(this.scene, this.fieldIndex, true, false));
      }
    } else {
      this.scene.unshiftPhase(new VictoryPhase(this.scene, this.battlerIndex));
      if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
        const hasReservePartyMember = !!this.scene.getEnemyParty().filter(p => p.isActive() && !p.isOnField() && p.trainerSlot === (pokemon as EnemyPokemon).trainerSlot).length;
        if (hasReservePartyMember) {
          this.scene.pushPhase(new SwitchSummonPhase(this.scene, this.fieldIndex, -1, false, false, false));
        }
      }
    }

    // in double battles redirect potential moves off fainted pokemon
    if (this.scene.currentBattle.double) {
      const allyPokemon = pokemon.getAlly();
      this.scene.redirectPokemonMoves(pokemon, allyPokemon);
    }

    pokemon.lapseTags(BattlerTagLapseType.FAINT);
    this.scene.getField(true).filter(p => p !== pokemon).forEach(p => p.removeTagsBySourceId(pokemon.id));

    pokemon.faintCry(() => {
      if (pokemon instanceof PlayerPokemon) {
        pokemon.addFriendship(-10);
      }
      pokemon.hideInfo();
      this.scene.playSound("se/faint");
      this.scene.tweens.add({
        targets: pokemon,
        duration: 500,
        y: pokemon.y + 150,
        ease: "Sine.easeIn",
        onComplete: () => {
          pokemon.setVisible(false);
          pokemon.y -= 150;
          pokemon.trySetStatus(StatusEffect.FAINT);
          if (pokemon.isPlayer()) {
            this.scene.currentBattle.removeFaintedParticipant(pokemon as PlayerPokemon);
          } else {
            this.scene.addFaintedEnemyScore(pokemon as EnemyPokemon);
            this.scene.currentBattle.addPostBattleLoot(pokemon as EnemyPokemon);
          }
          this.scene.field.remove(pokemon);
          this.end();
        }
      });
    });
  }

  tryOverrideForBattleSpec(): boolean {
    switch (this.scene.currentBattle.battleSpec) {
    case BattleSpec.FINAL_BOSS:
      if (!this.player) {
        const enemy = this.getPokemon();
        if (enemy.formIndex) {
          this.scene.ui.showDialogue(battleSpecDialogue[BattleSpec.FINAL_BOSS].secondStageWin, enemy.species.name, null, () => this.doFaint());
        } else {
          // Final boss' HP threshold has been bypassed; cancel faint and force check for 2nd phase
          enemy.hp++;
          this.scene.unshiftPhase(new DamagePhase(this.scene, enemy.getBattlerIndex(), 0, HitResult.OTHER));
          this.end();
        }
        return true;
      }
    }

    return false;
  }
}
