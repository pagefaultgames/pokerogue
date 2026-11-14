import { AbilityId } from "#enums/ability-id";
import { BattleStyle } from "#enums/battle-style";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/framework/game-manager";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Phases - CheckSwitchPhase", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  /** Whether the "Will you switch Pokémon?" prompt was shown */
  let switchPromptShown: boolean;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    switchPromptShown = false;
    game.override
      .battleStyle("single")
      .startingWave(3)
      .disableTrainerWaves()
      .startingLevel(100)
      .moveset([MoveId.DIG, MoveId.HYPER_BEAM, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyLevel(50)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemyStatusEffect(StatusEffect.POISON);
  });

  /**
   * Use a move on the final turn of a wild wave, then reload the session saved at the start of the next wave
   * with the "Switch" battle style enabled.
   * The opponent faints by the end of the turn (from the move or from poison),
   * so any follow-up turn of the move carries over into the next wave.
   * @param move - The {@linkcode MoveId} to use on the final turn of the wave
   */
  async function reloadAfterFinalMove(move: MoveId): Promise<void> {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);
    game.field.getEnemyPokemon().hp = 1;

    game.move.select(move);
    await game.move.forceHit();
    await game.toNextWave();

    game.settings.battleStyle(BattleStyle.SWITCH);
    game.onNextPrompt(
      "CheckSwitchPhase",
      UiMode.CONFIRM,
      () => {
        switchPromptShown = true;
        game.setMode(UiMode.MESSAGE);
        game.endPhase();
      },
      () => game.isCurrentPhase("CommandPhase", "TurnInitPhase"),
    );
    await game.reload.reloadSession();
  }

  it("should ask to switch after reloading a wild wave", async () => {
    await reloadAfterFinalMove(MoveId.SPLASH);

    expect(switchPromptShown).toBe(true);
  });

  it("should not ask to switch after reloading while the Pokemon is mid-way through a two-turn move", async () => {
    await reloadAfterFinalMove(MoveId.DIG);

    const feebas = game.field.getPlayerPokemon();
    expect(switchPromptShown).toBe(false);
    expect(feebas.species.speciesId).toBe(SpeciesId.FEEBAS);
    expect(feebas).toHaveBattlerTag(BattlerTagType.UNDERGROUND);

    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({ move: MoveId.DIG, result: MoveResult.SUCCESS });
    expect(feebas).not.toHaveBattlerTag(BattlerTagType.UNDERGROUND);
  });

  it("should not ask to switch at the start of the next wave while the Pokemon is mid-way through a two-turn move", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);
    game.field.getEnemyPokemon().hp = 1;

    game.move.select(MoveId.DIG);
    game.settings.battleStyle(BattleStyle.SWITCH);
    game.doSelectModifier();
    game.onNextPrompt(
      "CheckSwitchPhase",
      UiMode.CONFIRM,
      () => {
        switchPromptShown = true;
        game.setMode(UiMode.MESSAGE);
        game.endPhase();
      },
      () => game.isCurrentPhase("CommandPhase", "TurnInitPhase"),
    );
    await game.phaseInterceptor.to("TurnInitPhase");
    await game.phaseInterceptor.to("CommandPhase");

    expect(switchPromptShown).toBe(false);
    expect(game.field.getPlayerPokemon()).toHaveBattlerTag(BattlerTagType.UNDERGROUND);
  });

  it("should not ask to switch after reloading while the Pokemon must recharge", async () => {
    await reloadAfterFinalMove(MoveId.HYPER_BEAM);

    const feebas = game.field.getPlayerPokemon();
    expect(switchPromptShown).toBe(false);
    expect(feebas.species.speciesId).toBe(SpeciesId.FEEBAS);
    expect(feebas).toHaveBattlerTag(BattlerTagType.RECHARGING);
  });
});
