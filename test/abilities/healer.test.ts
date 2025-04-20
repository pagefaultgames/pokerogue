import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { isNullOrUndefined } from "#app/utils/common";
import { PostTurnResetStatusAbAttr } from "#app/data/abilities/ability";
import { allAbilities } from "#app/data/data-lists";
import type Pokemon from "#app/field/pokemon";

describe("Abilities - Healer", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let healerAttrSpy: MockInstance;
  let healerAttr: PostTurnResetStatusAbAttr;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    healerAttrSpy.mockRestore();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .moveset([Moves.SPLASH])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("double")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);

    healerAttr = allAbilities[Abilities.HEALER].getAttrs(PostTurnResetStatusAbAttr)[0];
    healerAttrSpy = vi
      .spyOn(healerAttr, "getCondition")
      .mockReturnValue((pokemon: Pokemon) => !isNullOrUndefined(pokemon.getAlly()));
  });

  it("should not queue a message phase for healing if the ally has fainted", async () => {
    game.override.moveset([Moves.SPLASH, Moves.LUNAR_DANCE]);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.MAGIKARP]);
    const user = game.scene.getPlayerPokemon()!;
    // Only want one magikarp to have the ability.
    vi.spyOn(user, "getAbility").mockReturnValue(allAbilities[Abilities.HEALER]);
    game.move.select(Moves.SPLASH);
    // faint the ally
    game.move.select(Moves.LUNAR_DANCE, 1);
    const abSpy = vi.spyOn(healerAttr, "canApplyPostTurn");
    await game.phaseInterceptor.to("TurnEndPhase");

    // It's not enough to just test that the ally still has its status.
    // We need to ensure that the ability failed to meet its condition
    expect(abSpy).toHaveReturnedWith(false);

    // Explicitly restore the mock to ensure pollution doesn't happen
    abSpy.mockRestore();
  });

  it("should heal the status of an ally if the ally has a status", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP, Species.MAGIKARP]);
    const [user, ally] = game.scene.getPlayerField();
    // Only want one magikarp to have the ability.
    vi.spyOn(user, "getAbility").mockReturnValue(allAbilities[Abilities.HEALER]);
    expect(ally.trySetStatus(StatusEffect.BURN)).toBe(true);
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("TurnEndPhase");
    await game.toNextTurn();

    expect(ally.status?.effect, "status effect was not healed").toBeFalsy();
  });

  // TODO: Healer is currently checked before the
  it.todo("should heal a burn before its end of turn damage", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP, Species.MAGIKARP]);
    const [user, ally] = game.scene.getPlayerField();
    // Only want one magikarp to have the ability.
    vi.spyOn(user, "getAbility").mockReturnValue(allAbilities[Abilities.HEALER]);
    expect(ally.trySetStatus(StatusEffect.BURN)).toBe(true);
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.toNextTurn();

    expect(ally.status?.effect, "status effect was not healed").toBeFalsy();
    expect(ally.hp).toBe(ally.getMaxHp());
  });
});
