import { BattlerIndex } from "#app/battle";
import { StatusEffect } from "#app/data/status-effect";
import { Abilities } from "#app/enums/abilities";
import { CommandPhase } from "#app/phases/command-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

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
      .battleType("double")
      .moveset([Moves.TOXIC_THREAD, Moves.SPLASH])
      .enemyAbility(Abilities.BALL_FETCH)
      .enemySpecies(Species.SUNKERN)
      .enemyMoveset(SPLASH_ONLY);
  });

  it("prevents the user and its allies from being afflicted by poison", async () => {
    await game.startBattle([Species.MAGIKARP, Species.GALAR_PONYTA]);
    const ponyta = game.scene.getPlayerField()[1];
    const magikarp = game.scene.getPlayerField()[0];
    ponyta.abilityIndex = 1;

    expect(ponyta.hasAbility(Abilities.PASTEL_VEIL)).toBe(true);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.TOXIC_THREAD, 1, BattlerIndex.PLAYER);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(magikarp.status?.effect).toBeUndefined();
  });

  it("it heals the poisoned status condition of allies if user is sent out into battle", async () => {
    await game.startBattle([Species.MAGIKARP, Species.FEEBAS, Species.GALAR_PONYTA]);
    const ponyta = game.scene.getParty()[2];
    const magikarp = game.scene.getPlayerField()[0];
    ponyta.abilityIndex = 1;

    expect(ponyta.hasAbility(Abilities.PASTEL_VEIL)).toBe(true);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.TOXIC_THREAD, 1, BattlerIndex.PLAYER);

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(magikarp.status?.effect).toBe(StatusEffect.POISON);

    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(Moves.SPLASH);
    game.doSwitchPokemon(2);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(magikarp.status?.effect).toBeUndefined();
  });
});
