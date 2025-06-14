import { BattlerIndex } from "#enums/battler-index";
import { AbilityId } from "#enums/ability-id";
import { CommandPhase } from "#app/phases/command-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Pastel Veil", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("double")
      .moveset([MoveId.TOXIC_THREAD, MoveId.SPLASH])
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.SUNKERN)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("prevents the user and its allies from being afflicted by poison", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.GALAR_PONYTA]);
    const ponyta = game.scene.getPlayerField()[1];
    const magikarp = game.scene.getPlayerField()[0];
    ponyta.abilityIndex = 1;

    expect(ponyta.hasAbility(AbilityId.PASTEL_VEIL)).toBe(true);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.TOXIC_THREAD, 1, BattlerIndex.PLAYER);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(magikarp.status?.effect).toBeUndefined();
  });

  it("it heals the poisoned status condition of allies if user is sent out into battle", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS, SpeciesId.GALAR_PONYTA]);
    const ponyta = game.scene.getPlayerParty()[2];
    const magikarp = game.scene.getPlayerField()[0];
    ponyta.abilityIndex = 1;

    expect(ponyta.hasAbility(AbilityId.PASTEL_VEIL)).toBe(true);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.TOXIC_THREAD, 1, BattlerIndex.PLAYER);

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(magikarp.status?.effect).toBe(StatusEffect.POISON);

    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(MoveId.SPLASH);
    game.doSwitchPokemon(2);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(magikarp.status?.effect).toBeUndefined();
  });
});
