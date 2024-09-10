import { BattleStyle } from "#app/enums/battle-style";
import { Species } from "#app/enums/species";
import { GameModes, getGameMode } from "#app/game-mode";
import overrides from "#app/overrides";
import { CommandPhase } from "#app/phases/command-phase";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { SelectStarterPhase } from "#app/phases/select-starter-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { Mode } from "#app/ui/ui";
import { generateStarter } from "../gameManagerUtils";
import { GameManagerHelper } from "./gameManagerHelper";

/**
 * Helper to handle classic mode specifics
 */
export class ClassicModeHelper extends GameManagerHelper {

  /**
   * Runs the classic game to the summon phase.
   * @param species - Optional array of species to summon.
   * @returns A promise that resolves when the summon phase is reached.
   */
  async runToSummon(species?: Species[]) {
    await this.game.runToTitle();

    this.game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      this.game.scene.gameMode = getGameMode(GameModes.CLASSIC);
      const starters = generateStarter(this.game.scene, species);
      const selectStarterPhase = new SelectStarterPhase(this.game.scene);
      this.game.scene.pushPhase(new EncounterPhase(this.game.scene, false));
      selectStarterPhase.initBattle(starters);
    });

    await this.game.phaseInterceptor.run(EncounterPhase);
    if (overrides.OPP_HELD_ITEMS_OVERRIDE.length === 0) {
      this.game.removeEnemyHeldItems();
    }
  }

  /**
   * Transitions to the start of a battle.
   * @param species - Optional array of species to start the battle with.
   * @returns A promise that resolves when the battle is started.
   */
  async startBattle(species?: Species[]) {
    await this.runToSummon(species);

    if (this.game.scene.battleStyle === BattleStyle.SWITCH) {
      this.game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
        this.game.setMode(Mode.MESSAGE);
        this.game.endPhase();
      }, () => this.game.isCurrentPhase(CommandPhase) || this.game.isCurrentPhase(TurnInitPhase));

      this.game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
        this.game.setMode(Mode.MESSAGE);
        this.game.endPhase();
      }, () => this.game.isCurrentPhase(CommandPhase) || this.game.isCurrentPhase(TurnInitPhase));
    }

    await this.game.phaseInterceptor.to(CommandPhase);
    console.log("==================[New Turn]==================");
  }
}
