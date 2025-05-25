import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Rest", () => {
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
      .moveset([Moves.REST, Moves.SLEEP_TALK])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.EKANS)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should fully heal the user, cure its status and put it to sleep", async () => {
    await game.classicMode.startBattle([Species.SNORLAX]);

    const snorlax = game.scene.getPlayerPokemon()!;
    snorlax.hp = 1;
    snorlax.trySetStatus(StatusEffect.POISON);
    expect(snorlax.status?.effect).toBe(StatusEffect.POISON);

    game.move.select(Moves.REST);
    await game.phaseInterceptor.to("BerryPhase");

    expect(snorlax.isFullHp()).toBe(true);
    expect(snorlax.status?.effect).toBe(StatusEffect.SLEEP);
  });

  it("should preserve non-volatile conditions", async () => {
    await game.classicMode.startBattle([Species.SNORLAX]);

    const snorlax = game.scene.getPlayerPokemon()!;
    snorlax.hp = 1;
    snorlax.addTag(BattlerTagType.CONFUSED, 999);

    game.move.select(Moves.REST);
    await game.phaseInterceptor.to("BerryPhase");

    expect(snorlax.getTag(BattlerTagType.CONFUSED)).toBeDefined();
  });

  it.each<{ name: string; status?: StatusEffect; ability?: Abilities; dmg?: number }>([
    { name: "is at full HP", dmg: 0 },
    { name: "is affected by Electric Terrain", ability: Abilities.ELECTRIC_SURGE },
    { name: "is affected by Misty Terrain", ability: Abilities.MISTY_SURGE },
    { name: "has Comatose", ability: Abilities.COMATOSE },
  ])("should fail if the user $name", async ({ status = StatusEffect.NONE, ability = Abilities.NONE, dmg = 1 }) => {
    game.override.ability(ability);
    await game.classicMode.startBattle([Species.SNORLAX]);

    const snorlax = game.scene.getPlayerPokemon()!;
    snorlax.trySetStatus(status);

    snorlax.hp = snorlax.getMaxHp() - dmg;

    game.move.select(Moves.REST);
    await game.phaseInterceptor.to("BerryPhase");

    expect(snorlax.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should fail if called while already asleep", async () => {
    await game.classicMode.startBattle([Species.SNORLAX]);

    const snorlax = game.scene.getPlayerPokemon()!;
    snorlax.hp = 1;
    snorlax.trySetStatus(StatusEffect.SLEEP);

    game.move.select(Moves.SLEEP_TALK);
    await game.phaseInterceptor.to("BerryPhase");

    expect(snorlax.isFullHp()).toBe(false);
    expect(snorlax.status?.effect).toBeUndefined();
    expect(snorlax.getLastXMoves().map(tm => tm.result)).toEqual([MoveResult.FAIL, MoveResult.SUCCESS]);
  });

  it("should succeed if called the turn after waking up", async () => {
    await game.classicMode.startBattle([Species.SNORLAX]);

    const snorlax = game.scene.getPlayerPokemon()!;
    snorlax.hp = 1;

    expect(snorlax.status?.effect).toBe(StatusEffect.SLEEP);
    snorlax.status!.sleepTurnsRemaining = 1;

    game.move.select(Moves.REST);
    await game.toNextTurn();

    expect(snorlax.status?.effect).toBe(StatusEffect.SLEEP);
    expect(snorlax.isFullHp()).toBe(true);
    expect(snorlax.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(snorlax.status?.sleepTurnsRemaining).toBe(3);
  });
});
