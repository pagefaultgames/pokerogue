import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Tera Shell", () => {
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
      .battleStyle("single")
      .ability(AbilityId.TERA_SHELL)
      .moveset([MoveId.SPLASH])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset([MoveId.MACH_PUNCH])
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should change the effectiveness of non-resisted attacks when the source is at full HP", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const playerPokemon = game.field.getPlayerPokemon();
    vi.spyOn(playerPokemon, "getMoveEffectiveness");

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.getMoveEffectiveness).toHaveLastReturnedWith(0.5);

    await game.toNextTurn();

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.getMoveEffectiveness).toHaveLastReturnedWith(2);
  });

  it("should not override type immunities", async () => {
    game.override.enemyMoveset([MoveId.SHADOW_SNEAK]);

    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const playerPokemon = game.field.getPlayerPokemon();
    vi.spyOn(playerPokemon, "getMoveEffectiveness");

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.getMoveEffectiveness).toHaveLastReturnedWith(0);
  });

  it("should not override type multipliers less than 0.5x", async () => {
    game.override.enemyMoveset([MoveId.QUICK_ATTACK]);

    await game.classicMode.startBattle([SpeciesId.AGGRON]);

    const playerPokemon = game.field.getPlayerPokemon();
    vi.spyOn(playerPokemon, "getMoveEffectiveness");

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.getMoveEffectiveness).toHaveLastReturnedWith(0.25);
  });

  it("should not affect the effectiveness of fixed-damage moves", async () => {
    game.override.enemyMoveset([MoveId.DRAGON_RAGE]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const playerPokemon = game.field.getPlayerPokemon();
    const spy = vi.spyOn(playerPokemon, "getMoveEffectiveness");

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(spy).toHaveLastReturnedWith(1);
    expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp() - 40);
  });

  it("should change the effectiveness of all strikes of a multi-strike move", async () => {
    game.override.enemyMoveset([MoveId.DOUBLE_HIT]);

    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const playerPokemon = game.field.getPlayerPokemon();
    const spy = vi.spyOn(playerPokemon, "getMoveEffectiveness");

    game.move.select(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.move.forceHit();
    for (let i = 0; i < 2; i++) {
      await game.phaseInterceptor.to("MoveEffectPhase");
      expect(spy).toHaveLastReturnedWith(0.5);
    }
    expect(spy).toHaveReturnedTimes(2);
  });
});
