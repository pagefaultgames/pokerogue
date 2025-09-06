import { getGameMode } from "#app/game-mode";
import overrides from "#app/overrides";
import { BattleStyle } from "#enums/battle-style";
import { Button } from "#enums/buttons";
import { GameModes } from "#enums/game-modes";
import { Nature } from "#enums/nature";
import type { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { CommandPhase } from "#phases/command-phase";
import { EncounterPhase } from "#phases/encounter-phase";
import { SelectStarterPhase } from "#phases/select-starter-phase";
import { TurnInitPhase } from "#phases/turn-init-phase";
import { generateStarter } from "#test/test-utils/game-manager-utils";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";

/**
 * Helper to handle classic-mode specific operations.
 */
export class ClassicModeHelper extends GameManagerHelper {
  /**
   * Runs the classic game to the summon phase.
   * @param species - An array of {@linkcode SpeciesId} to summon.
   * @returns A promise that resolves when the summon phase is reached.
   * @remarks
   * Do not use this when {@linkcode startBattle} can be used!
   */
  async runToSummon(species: SpeciesId[]): Promise<void>;
  /**
   * Runs the classic game to the summon phase.
   * Selects 3 daily run starters with a fixed seed of "test"
   * (see `DailyRunConfig.getDailyRunStarters` in `daily-run.ts` for more info).
   * @returns A promise that resolves when the summon phase is reached.
   * @deprecated - Specifying the starters helps prevent inconsistencies from internal RNG changes.
   */
  // biome-ignore lint/style/useUnifiedTypeSignatures: Marks the overload for deprecation
  async runToSummon(): Promise<void>;
  async runToSummon(species: SpeciesId[] | undefined): Promise<void>;
  async runToSummon(species?: SpeciesId[]): Promise<void> {
    await this.game.runToTitle();

    if (this.game.override.disableShinies) {
      this.game.override.shiny(false).enemyShiny(false);
    }
    if (this.game.override.normalizeIVs) {
      this.game.override.playerIVs(31).enemyIVs(31);
    }
    if (this.game.override.normalizeNatures) {
      this.game.override.nature(Nature.HARDY).enemyNature(Nature.HARDY);
    }

    this.game.onNextPrompt("TitlePhase", UiMode.TITLE, () => {
      this.game.scene.gameMode = getGameMode(GameModes.CLASSIC);
      const starters = generateStarter(this.game.scene, species);
      const selectStarterPhase = new SelectStarterPhase();
      this.game.scene.phaseManager.pushPhase(new EncounterPhase(false));
      selectStarterPhase.initBattle(starters);
    });

    await this.game.phaseInterceptor.to(EncounterPhase);
    if (overrides.ENEMY_HELD_ITEMS_OVERRIDE.length === 0 && this.game.override.removeEnemyStartingItems) {
      this.game.removeEnemyHeldItems();
    }
  }

  /**
   * Transitions to the start of a battle.
   * @param species - An array of {@linkcode SpeciesId} to start the battle with.
   * @returns A promise that resolves when the battle is started.
   */
  async startBattle(species: SpeciesId[]): Promise<void>;
  /**
   * Transitions to the start of a battle.
   * Will select 3 daily run starters with a fixed seed of "test"
   * (see `DailyRunConfig.getDailyRunStarters` in `daily-run.ts` for more info).
   * @returns A promise that resolves when the battle is started.
   * @deprecated - Specifying the starters helps prevent inconsistencies from internal RNG changes.
   */
  // biome-ignore lint/style/useUnifiedTypeSignatures: Marks the overload for deprecation
  async startBattle(): Promise<void>;
  async startBattle(species?: SpeciesId[]): Promise<void> {
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
   * Queue inputs to switch at the start of the next battle, and then start it.
   * @param pokemonIndex - The 0-indexed position of the party pokemon to switch to.
   * Should never be called with 0 as that will select the currently active pokemon and freeze
   * @returns A Promise that resolves once the battle has been started and the switch prompt resolved
   * @todo Make this work for double battles
   * @example
   * ```ts
   * await game.classicMode.runToSummon([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA])
   * await game.startBattleWithSwitch(1);
   * ```
   */
  public async startBattleWithSwitch(pokemonIndex: number): Promise<void> {
    this.game.scene.battleStyle = BattleStyle.SWITCH;
    this.game.onNextPrompt(
      "CheckSwitchPhase",
      UiMode.CONFIRM,
      () => {
        this.game.scene.ui.getHandler().setCursor(0);
        this.game.scene.ui.getHandler().processInput(Button.ACTION);
      },
      () => this.game.isCurrentPhase("CommandPhase") || this.game.isCurrentPhase("TurnInitPhase"),
    );
    this.game.doSelectPartyPokemon(pokemonIndex);

    await this.game.phaseInterceptor.to("CommandPhase");
    console.log("==================[New Battle (Initial Switch)]==================");
  }
}
