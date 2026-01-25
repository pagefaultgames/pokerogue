import { getGameMode } from "#app/game-mode";
import overrides from "#app/overrides";
import { BattleStyle } from "#enums/battle-style";
import { Button } from "#enums/buttons";
import { GameModes } from "#enums/game-modes";
import { Nature } from "#enums/nature";
import type { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { SelectStarterPhase } from "#phases/select-starter-phase";
import { generateStarters } from "#test/test-utils/game-manager-utils";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import type { IntClosedRange, TupleOf } from "type-fest";

/**
 * Helper to handle classic-mode specific operations.
 */
export class ClassicModeHelper extends GameManagerHelper {
  /**
   * Transition from the title screen to the summon phase of a new Classic game.
   * @param speciesIds - The {@linkcode SpeciesId}s to summon; must be between 1-6
   * @returns A Promise that resolves when the summon phase is reached.
   * @privateRemarks
   * {@linkcode startBattle} is the preferred way to start a battle; this should only be used for tests
   * that need to stop and do something before the `CommandPhase` starts.
   */
  public async runToSummon(...speciesIds: TupleOf<IntClosedRange<1, 6>, SpeciesId>): Promise<void> {
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
   * Transition from the title screen to the start of a new Classic Mode battle.
   * @param speciesIds - The {@linkcode SpeciesId}s with which to start the battle; must be between 1-6
   * @returns A Promise that resolves when the battle is started.
   */
  public async startBattle(...speciesIds: TupleOf<IntClosedRange<1, 6>, SpeciesId>): Promise<void> {
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

  /**
   * Queue inputs to switch at the start of the next battle, and then start it.
   * @param pokemonIndex - The 0-indexed position of the party pokemon to switch to.
   * @throws {@linkcode Error}
   * Fails test if `pokemonIndex` is out of valid bounds
   * @returns A Promise that resolves once the battle has been started and the switch prompt resolved.
   * @remarks
   * This will temporarily set the current {@linkcode BattleStyle} to `SWITCH` for the duration
   * of the `CheckSwitchPhase`.
   * @todo Make this work for double battles
   * @example
   * ```ts
   * await game.classicMode.runToSummon(SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA)
   * await game.startBattleWithSwitch(1);
   * ```
   */
  public async startBattleWithSwitch(pokemonIndex: IntClosedRange<1, 5>): Promise<void> {
    this.game.settings.battleStyle(BattleStyle.SWITCH);
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
    this.game.settings.battleStyle(BattleStyle.SET);
  }
}
