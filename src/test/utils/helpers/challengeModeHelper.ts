import { Challenge, copyChallenge } from "#app/data/challenge";
import overrides from "#app/overrides";
import { CommandPhase } from "#app/phases/command-phase";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { SelectStarterPhase } from "#app/phases/select-starter-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { Mode } from "#app/ui/ui";
import { BattleStyle } from "#enums/battle-style";
import { Challenges } from "#enums/challenges";
import { Species } from "#enums/species";
import { generateStarter } from "#test/utils/gameManagerUtils";
import { GameManagerHelper } from "#test/utils/helpers/gameManagerHelper";

/**
 * Helper to handle Challenge mode specifics
 */
export class ChallengeModeHelper extends GameManagerHelper {

  challenges: Challenge[] = [];

  /**
   * Adds a challenge to the challenge mode helper.
   * @param id - The challenge id.
   * @param value - The challenge value.
   * @param severity - The challenge severity.
   */
  addChallenge(id: Challenges, value: number = 1, severity: number = 1) {
    const challenge = copyChallenge({ id, value, severity });
    this.challenges.push(challenge);
  }

  /**
   * Runs the Challenge game to the summon phase.
   * @param gameMode - Optional game mode to set.
   * @returns A promise that resolves when the summon phase is reached.
   */
  async runToSummon(species?: Species[]) {
    await this.game.runToTitle();

    if (this.game.override.disableShinies) {
      this.game.override.shiny(false).enemyShiny(false);
    }

    this.game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      this.game.scene.gameMode.challenges = this.challenges;
      const starters = generateStarter(this.game.scene, species);
      const selectStarterPhase = new SelectStarterPhase(this.game.scene);
      this.game.scene.pushPhase(new EncounterPhase(this.game.scene, false));
      selectStarterPhase.initBattle(starters);
    });

    await this.game.phaseInterceptor.run(EncounterPhase);
    if (overrides.OPP_HELD_ITEMS_OVERRIDE.length === 0 && this.game.override.removeEnemyStartingItems) {
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
