import { BattlerIndex } from "#app/battle";
import { TurnInitEvent } from "#app/events/battle-scene";
import { PlayerPokemon } from "#app/field/pokemon";
import i18next from "i18next";
import { FieldPhase } from "./field-phase";
import { ToggleDoublePositionPhase } from "./toggle-double-position-phase";
import { CommandPhase } from "./command-phase";
import { EnemyCommandPhase } from "./enemy-command-phase";
import { GameOverPhase } from "./game-over-phase";
import { TurnStartPhase } from "./turn-start-phase";
import { handleMysteryEncounterBattleStartEffects, handleMysteryEncounterTurnStartEffects } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { gScene } from "#app/battle-scene";

export class TurnInitPhase extends FieldPhase {
  constructor() {
    super();
  }

  start() {
    super.start();

    gScene.getPlayerField().forEach(p => {
      // If this pokemon is in play and evolved into something illegal under the current challenge, force a switch
      if (p.isOnField() && !p.isAllowedInBattle()) {
        gScene.queueMessage(i18next.t("challenges:illegalEvolution", { "pokemon": p.name }), null, true);

        const allowedPokemon = gScene.getParty().filter(p => p.isAllowedInBattle());

        if (!allowedPokemon.length) {
          // If there are no longer any legal pokemon in the party, game over.
          gScene.clearPhaseQueue();
          gScene.unshiftPhase(new GameOverPhase());
        } else if (allowedPokemon.length >= gScene.currentBattle.getBattlerCount() || (gScene.currentBattle.double && !allowedPokemon[0].isActive(true))) {
          // If there is at least one pokemon in the back that is legal to switch in, force a switch.
          p.switchOut();
        } else {
          // If there are no pokemon in the back but we're not game overing, just hide the pokemon.
          // This should only happen in double battles.
          p.leaveField();
        }
        if (allowedPokemon.length === 1 && gScene.currentBattle.double) {
          gScene.unshiftPhase(new ToggleDoublePositionPhase(true));
        }
      }
    });

    //gScene.pushPhase(new MoveAnimTestPhase());
    gScene.eventTarget.dispatchEvent(new TurnInitEvent());

    handleMysteryEncounterBattleStartEffects();

    // If true, will skip remainder of current phase (and not queue CommandPhases etc.)
    if (handleMysteryEncounterTurnStartEffects()) {
      this.end();
      return;
    }

    gScene.getField().forEach((pokemon, i) => {
      if (pokemon?.isActive()) {
        if (pokemon.isPlayer()) {
          gScene.currentBattle.addParticipant(pokemon as PlayerPokemon);
        }

        pokemon.resetTurnData();

        gScene.pushPhase(pokemon.isPlayer() ? new CommandPhase(i) : new EnemyCommandPhase(i - BattlerIndex.ENEMY));
      }
    });

    gScene.pushPhase(new TurnStartPhase());

    this.end();
  }
}
