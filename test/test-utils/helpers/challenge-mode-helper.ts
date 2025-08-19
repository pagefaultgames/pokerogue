import overrides from "#app/overrides";
import type { Challenge } from "#data/challenge";
import { BattleStyle } from "#enums/battle-style";
import type { Challenges } from "#enums/challenges";
import type { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { CommandPhase } from "#phases/command-phase";
import { EncounterPhase } from "#phases/encounter-phase";
import { SelectStarterPhase } from "#phases/select-starter-phase";
import { TurnInitPhase } from "#phases/turn-init-phase";
import { generateStarter } from "#test/test-utils/game-manager-utils";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import { copyChallenge } from "data/challenge";

type challengeStub = { id: Challenges; value: number; severity: number };

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
   * Runs the Challenge game to the summon phase.
   * @param gameMode - Optional game mode to set.
   * @returns A promise that resolves when the summon phase is reached.
   * @todo this duplicates nearly all its code with the classic mode variant...
   */
  private async runToSummon(species?: SpeciesId[]) {
    await this.game.runToTitle();

    if (this.game.override.disableShinies) {
      this.game.override.shiny(false).enemyShiny(false);
    }

    this.game.onNextPrompt("TitlePhase", UiMode.TITLE, () => {
      this.game.scene.gameMode.challenges = this.challenges;
      const starters = generateStarter(this.game.scene, species);
      const selectStarterPhase = new SelectStarterPhase();
      this.game.scene.phaseManager.pushPhase(new EncounterPhase(false));
      selectStarterPhase.initBattle(starters);
    });

    await this.game.phaseInterceptor.run(EncounterPhase);
    if (overrides.ENEMY_HELD_ITEMS_OVERRIDE.length === 0 && this.game.override.removeEnemyStartingItems) {
      this.game.removeEnemyHeldItems();
    }
  }

  /**
   * Transitions to the start of a battle.
   * @param species - Optional array of species to start the battle with.
   * @returns A promise that resolves when the battle is started.
   */
  async startBattle(species?: SpeciesId[]) {
    await this.runToSummon(species);

    if (this.game.scene.battleStyle === BattleStyle.SWITCH) {
      this.game.onNextPrompt(
        "CheckSwitchPhase",
        UiMode.CONFIRM,
        () => {
          this.game.setMode(UiMode.MESSAGE);
          this.game.endPhase();
        },
        () => this.game.isCurrentPhase(CommandPhase) || this.game.isCurrentPhase(TurnInitPhase),
      );

      this.game.onNextPrompt(
        "CheckSwitchPhase",
        UiMode.CONFIRM,
        () => {
          this.game.setMode(UiMode.MESSAGE);
          this.game.endPhase();
        },
        () => this.game.isCurrentPhase(CommandPhase) || this.game.isCurrentPhase(TurnInitPhase),
      );
    }

    await this.game.phaseInterceptor.to(CommandPhase);
    console.log("==================[New Turn]==================");
  }

  /**
   * Override an already-started game with the given challenges.
   * @param id - The challenge id
   * @param value - The challenge value
   * @param severity - The challenge severity
   * @todo Make severity optional for challenges that do not require it
   */
  public overrideGameWithChallenges(id: Challenges, value: number, severity: number): void;
  /**
   * Override an already-started game with the given challenges.
   * @param challenges - One or more challenges to set.
   */
  public overrideGameWithChallenges(challenges: challengeStub[]): void;
  public overrideGameWithChallenges(challenges: challengeStub[] | Challenges, value?: number, severity?: number): void {
    if (typeof challenges !== "object") {
      challenges = [{ id: challenges, value: value!, severity: severity! }];
    }
    for (const challenge of challenges) {
      this.game.scene.gameMode.setChallengeValue(challenge.id, challenge.value, challenge.severity);
    }
  }
}
