import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Suction Cups", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.SUCTION_CUPS);
  });

  it("prevents Roar from forcing it out and shows its flyout once", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    const abilityDisplaySpy = vi.spyOn(game.scene.phaseManager, "queueAbilityDisplay");

    game.move.use(MoveId.ROAR);
    await game.toEndOfTurn();

    expect(enemyPokemon.isOnField()).toBe(true);
    expect(playerPokemon).toHaveUsedMove({ move: MoveId.ROAR, result: MoveResult.FAIL });
    expect(game).toHaveShownMessage(
      i18next.t("moveTriggers:cannotBeSwitchedOut", { pokemonName: getPokemonNameWithAffix(enemyPokemon) }),
    );
    expect(abilityDisplaySpy.mock.calls).toEqual([
      [enemyPokemon, false, true],
      [enemyPokemon, false, false],
    ]);
  });

  it("doesn't activate when the enemy only considers using a force switch move", async () => {
    game.override
      .ability(AbilityId.SUCTION_CUPS)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.ROAR, MoveId.WHIRLWIND, MoveId.SPLASH]);
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

    const playerPokemon = game.field.getPlayerPokemon();
    const abilityDisplaySpy = vi.spyOn(game.scene.phaseManager, "queueAbilityDisplay");

    game.move.use(MoveId.SPLASH);
    // the enemy has chosen its move, but no move has been used yet
    await game.phaseInterceptor.to("TurnStartPhase", false);

    expect(abilityDisplaySpy).not.toHaveBeenCalled();
    expect(playerPokemon).not.toHaveAbilityApplied(AbilityId.SUCTION_CUPS);
  });
});
