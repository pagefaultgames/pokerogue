import { BattlerIndex } from "#app/battle";
import {
  handleMysteryEncounterBattleStartEffects,
  handleMysteryEncounterTurnStartEffects,
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { TurnInitEvent } from "#app/events/battle-scene";
import type { PlayerPokemon } from "#app/field/pokemon";
import i18next from "i18next";
import { CommandPhase } from "./command-phase";
import { EnemyCommandPhase } from "./enemy-command-phase";
import { FieldPhase } from "./field-phase";
import { GameOverPhase } from "./game-over-phase";
import { ToggleDoublePositionPhase } from "./toggle-double-position-phase";
import { TurnStartPhase } from "./turn-start-phase";
import { globalScene } from "#app/global-scene";

export class TurnInitPhase extends FieldPhase {
  start() {
    super.start();

    globalScene.getPlayerField().forEach(p => {
      // If this pokemon is in play and evolved into something illegal under the current challenge, force a switch
      if (p.isOnField() && !p.isAllowedInBattle()) {
        globalScene.queueMessage(i18next.t("challenges:illegalEvolution", { pokemon: p.name }), null, true);

        const allowedPokemon = globalScene.getPokemonAllowedInBattle();

        if (!allowedPokemon.length) {
          // If there are no longer any legal pokemon in the party, game over.
          globalScene.clearPhaseQueue();
          globalScene.unshiftPhase(new GameOverPhase());
        } else if (
          allowedPokemon.length >= globalScene.currentBattle.getBattlerCount() ||
          (globalScene.currentBattle.double && !allowedPokemon[0].isActive(true))
        ) {
          // If there is at least one pokemon in the back that is legal to switch in, force a switch.
          p.switchOut();
        } else {
          // If there are no pokemon in the back but we're not game overing, just hide the pokemon.
          // This should only happen in double battles.
          p.leaveField();
        }
        if (allowedPokemon.length === 1 && globalScene.currentBattle.double) {
          globalScene.unshiftPhase(new ToggleDoublePositionPhase(true));
        }
      }
    });

    globalScene.eventTarget.dispatchEvent(new TurnInitEvent());

    handleMysteryEncounterBattleStartEffects();

    // If true, will skip remainder of current phase (and not queue CommandPhases etc.)
    if (handleMysteryEncounterTurnStartEffects()) {
      this.end();
      return;
    }

    globalScene.getField().forEach((pokemon, i) => {
      if (pokemon?.isActive()) {
        if (pokemon.isPlayer()) {
          globalScene.currentBattle.addParticipant(pokemon as PlayerPokemon);
        }

        pokemon.resetTurnData();

        globalScene.pushPhase(pokemon.isPlayer() ? new CommandPhase(i) : new EnemyCommandPhase(i - BattlerIndex.ENEMY));
      }
    });

    globalScene.pushPhase(new TurnStartPhase());

    this.end();
  }
}
