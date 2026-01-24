import overrides from "#app/overrides";
import type { Challenge } from "#data/challenge";
import { copyChallenge } from "#data/challenge";
import { BattleStyle } from "#enums/battle-style";
import type { Challenges } from "#enums/challenges";
import type { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { CommandPhase } from "#phases/command-phase";
import { EncounterPhase } from "#phases/encounter-phase";
import { SelectStarterPhase } from "#phases/select-starter-phase";
import { TurnInitPhase } from "#phases/turn-init-phase";
import { generateStarters } from "#test/test-utils/game-manager-utils";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";

type ChallengeStub = { id: Challenges; value: number; severity: number };

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
   * Runs the challenge game to the summon phase.
   * @param speciesIds - An array of {@linkcode Species} to summon.
   * @returns A promise that resolves when the summon phase is reached.
   * @todo This duplicates all but 1 line of code from the classic mode variant...
   */
  async runToSummon(speciesIds: SpeciesId[]): Promise<void>;
  /**
   * Runs the challenge game to the summon phase.
   * Selects 3 daily run starters with a fixed seed of "test"
   * (see `DailyRunConfig.getDailyRunStarters` in `daily-run.ts` for more info).
   * @returns A promise that resolves when the summon phase is reached.
   * @deprecated Specifying the starters helps prevent inconsistencies from internal RNG changes.
   * @todo This duplicates all but 1 line of code from the classic mode variant...
   */
  // biome-ignore lint/style/useUnifiedTypeSignatures: Marks for deprecation
  async runToSummon(): Promise<void>;
  async runToSummon(speciesIds?: SpeciesId[]): Promise<void>;
  async runToSummon(speciesIds?: SpeciesId[]): Promise<void> {
    await this.game.runToTitle();

    if (this.game.override.disableShinies) {
      this.game.override.shiny(false).enemyShiny(false);
    }

    this.game.onNextPrompt("TitlePhase", UiMode.TITLE, () => {
      this.game.scene.gameMode.challenges = this.challenges;
      const starters = generateStarters(this.game.scene, speciesIds);
      const selectStarterPhase = new SelectStarterPhase();
      this.game.scene.phaseManager.pushPhase(new EncounterPhase(false));
      selectStarterPhase.initBattle(starters);
    });

    await this.game.phaseInterceptor.to("EncounterPhase");
    if (overrides.ENEMY_HELD_ITEMS_OVERRIDE.length === 0 && this.game.override.removeEnemyStartingItems) {
      this.game.removeEnemyHeldItems();
    }
  }

  /**
   * Transitions the challenge game to the start of a new battle.
   * @param species - An array of {@linkcode Species} to summon.
   * @returns A promise that resolves when the battle is started.
   * @todo This duplicates all its code with the classic mode variant...
   */
  async startBattle(species: SpeciesId[]): Promise<void>;
  /**
   * Transitions the challenge game to the start of a new battle.
   * Selects 3 daily run starters with a fixed seed of "test"
   * (see `DailyRunConfig.getDailyRunStarters` in `daily-run.ts` for more info).
   * @returns A promise that resolves when the battle is started.
   * @deprecated Specifying the starters helps prevent inconsistencies from internal RNG changes.
   * @todo This duplicates all its code with the classic mode variant...
   */
  // biome-ignore lint/style/useUnifiedTypeSignatures: Marks for deprecation
  async startBattle(): Promise<void>;
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
   */
  // TODO: Make severity optional for challenges that do not require it
  public overrideGameWithChallenges(id: Challenges, value: number, severity: number): void;
  /**
   * Override an already-started game with the given challenges.
   * @param challenges - One or more challenges to set.
   */
  public overrideGameWithChallenges(challenges: ChallengeStub[]): void;
  public overrideGameWithChallenges(challenges: ChallengeStub[] | Challenges, value?: number, severity?: number): void {
    if (typeof challenges !== "object") {
      challenges = [{ id: challenges, value: value!, severity: severity! }];
    }
    for (const challenge of challenges) {
      this.game.scene.gameMode.setChallengeValue(challenge.id, challenge.value, challenge.severity);
    }
  }
}
