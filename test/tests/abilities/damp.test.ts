import { getPokemonNameWithAffix } from "#app/messages";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Damp", () => {
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
      .enemyAbility(AbilityId.DAMP);
  });

  it("prevents explosive moves and shows its flyout once", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    const abilityDisplaySpy = vi.spyOn(game.scene.phaseManager, "queueAbilityDisplay");

    game.move.use(MoveId.EXPLOSION);
    await game.toEndOfTurn();

    expect(playerPokemon).not.toHaveFainted();
    expect(playerPokemon).toHaveUsedMove({ move: MoveId.EXPLOSION, result: MoveResult.FAIL });
    expect(game).toHaveShownMessage(
      i18next.t("moveTriggers:cannotUseMove", {
        pokemonName: getPokemonNameWithAffix(playerPokemon),
        moveName: allMoves[MoveId.EXPLOSION].name,
      }),
    );
    expect(abilityDisplaySpy.mock.calls).toEqual([
      [enemyPokemon, false, true],
      [enemyPokemon, false, false],
    ]);
  });

  it("doesn't activate when the enemy only considers using an explosive move", async () => {
    game.override
      .ability(AbilityId.DAMP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.EXPLOSION, MoveId.SELF_DESTRUCT, MoveId.SPLASH]);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const playerPokemon = game.field.getPlayerPokemon();
    const abilityDisplaySpy = vi.spyOn(game.scene.phaseManager, "queueAbilityDisplay");

    game.move.use(MoveId.SPLASH);
    // the enemy has chosen its move, but no move has been used yet
    await game.phaseInterceptor.to("TurnStartPhase", false);

    expect(abilityDisplaySpy).not.toHaveBeenCalled();
    expect(playerPokemon).not.toHaveAbilityApplied(AbilityId.DAMP);
  });
});
