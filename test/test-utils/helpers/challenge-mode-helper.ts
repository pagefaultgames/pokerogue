import overrides from "#app/overrides";
import type { Challenge } from "#data/challenge";
import { copyChallenge } from "#data/challenge";
import { BattleStyle } from "#enums/battle-style";
import type { Challenges } from "#enums/challenges";
import type { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { SelectStarterPhase } from "#phases/select-starter-phase";
import { generateStarters } from "#test/test-utils/game-manager-utils";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import type { IntClosedRange, TupleOf } from "type-fest";

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
  addChallenge(id: Challenges, value: number, severity: number) {
    const challenge = copyChallenge({ id, value, severity });
    this.challenges.push(challenge);
  }

  /**
   * Transition from the title screen to the summon phase of a new Challenge game.
   * @param speciesIds - The {@linkcode SpeciesId}s to summon; must be between 1-6
   * @returns A promise that resolves when the summon phase is reached.
   * @privateRemarks
   * {@linkcode startBattle} is the preferred way to start a battle; this should only be used for tests
   * that need to stop and do something before the `CommandPhase` starts.
   */
  async runToSummon(...speciesIds: TupleOf<IntClosedRange<1, 6>, SpeciesId>) {
    await this.game.runToTitle();

    if (this.game.override.disableShinies) {
      this.game.override.shiny(false).enemyShiny(false);
    }

    this.game.onNextPrompt("TitlePhase", UiMode.TITLE, () => {
      this.game.scene.gameMode.challenges = this.challenges;
      const starters = generateStarters(this.game.scene, speciesIds);
      const selectStarterPhase = new SelectStarterPhase();
      this.game.scene.phaseManager.pushNew("EncounterPhase", false);
      selectStarterPhase.initBattle(starters);
    });

    await this.game.phaseInterceptor.to("EncounterPhase");
    if (overrides.ENEMY_HELD_ITEMS_OVERRIDE.length === 0 && this.game.override.removeEnemyStartingItems) {
      this.game.removeEnemyHeldItems();
    }
  }

  /**
   * Transitions to the start of a challenge mode battle.
   * @param speciesIds - Optional array of species to start the battle with.
   * @returns A promise that resolves when the battle is started.
   */
  async startBattle(...speciesIds: TupleOf<1 | 2 | 3 | 4 | 5 | 6, SpeciesId>) {
    await this.runToSummon(...speciesIds);

    if (this.game.scene.battleStyle === BattleStyle.SWITCH) {
      this.game.onNextPrompt(
        "CheckSwitchPhase",
        UiMode.CONFIRM,
        () => {
          this.game.setMode(UiMode.MESSAGE);
          this.game.endPhase();
        },
        () => this.game.isCurrentPhase("CommandPhase") || this.game.isCurrentPhase("TurnInitPhase"),
      );

      this.game.onNextPrompt(
        "CheckSwitchPhase",
        UiMode.CONFIRM,
        () => {
          this.game.setMode(UiMode.MESSAGE);
          this.game.endPhase();
        },
        () => this.game.isCurrentPhase("CommandPhase") || this.game.isCurrentPhase("TurnInitPhase"),
      );
    }

    await this.game.phaseInterceptor.to("CommandPhase");
    console.log("==================[New Turn]==================");
  }
}
