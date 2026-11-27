import { getPokemonNameWithAffix } from "#app/messages";
import { getStatusEffectDescriptor } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Psycho Shift", () => {
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
      .moveset([MoveId.PSYCHO_SHIFT])
      .ability(AbilityId.BALL_FETCH)
      .statusEffect(StatusEffect.POISON)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyLevel(20)
      .enemyAbility(AbilityId.SYNCHRONIZE)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("If Psycho Shift is used on a Pokémon with Synchronize, the user of Psycho Shift will already be afflicted with a status condition when Synchronize activates", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    expect(playerPokemon.status).toBeDefined();
    expect(enemyPokemon).toHaveStatusEffect(StatusEffect.NONE);

    game.move.select(MoveId.PSYCHO_SHIFT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon).toHaveStatusEffect(StatusEffect.NONE);
    expect(enemyPokemon.status).toBeDefined();
  });

  it("fails and shows the immunity flyout and message once against a target immune to the status", async () => {
    game.override.statusEffect(StatusEffect.PARALYSIS).enemyAbility(AbilityId.LIMBER);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    const abilityDisplaySpy = vi.spyOn(game.scene.phaseManager, "queueAbilityDisplay");

    game.move.select(MoveId.PSYCHO_SHIFT);
    await game.toEndOfTurn();

    expect(playerPokemon).toHaveUsedMove({ move: MoveId.PSYCHO_SHIFT, result: MoveResult.FAIL });
    expect(enemyPokemon.status).toBeFalsy();
    expect(abilityDisplaySpy.mock.calls).toEqual([
      [enemyPokemon, false, true],
      [enemyPokemon, false, false],
    ]);
    expect(game).toHaveShownMessage(
      i18next.t("abilityTriggers:statusEffectImmunityWithName", {
        pokemonNameWithAffix: getPokemonNameWithAffix(enemyPokemon),
        abilityName: enemyPokemon.getAbility().name,
        statusEffectName: getStatusEffectDescriptor(StatusEffect.PARALYSIS),
      }),
    );
  });

  it("doesn't show immunity flyouts or messages when the enemy only considers using it", async () => {
    game.override
      .statusEffect(StatusEffect.NONE)
      .ability(AbilityId.LIMBER)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyStatusEffect(StatusEffect.PARALYSIS)
      .enemyMoveset([MoveId.PSYCHO_SHIFT, MoveId.SPLASH]);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const playerPokemon = game.field.getPlayerPokemon();
    const abilityDisplaySpy = vi.spyOn(game.scene.phaseManager, "queueAbilityDisplay");
    const queueMessageSpy = vi.spyOn(game.scene.phaseManager, "queueMessage");

    game.move.use(MoveId.SPLASH);
    // the enemy has chosen its move, but no move has been used yet
    await game.phaseInterceptor.to("TurnStartPhase", false);

    expect(abilityDisplaySpy).not.toHaveBeenCalled();
    expect(queueMessageSpy).not.toHaveBeenCalled();
    expect(playerPokemon).not.toHaveAbilityApplied(AbilityId.LIMBER);
  });
});
