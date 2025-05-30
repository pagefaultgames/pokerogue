import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
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
      .moveset([Moves.REST, Moves.SWORDS_DANCE])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.EKANS)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should fully heal the user, cure its prior status and put it to sleep", async () => {
    game.override.statusEffect(StatusEffect.POISON);
    await game.classicMode.startBattle([Species.SNORLAX]);

    const snorlax = game.scene.getPlayerPokemon()!;
    snorlax.hp = 1;
    expect(snorlax.status?.effect).toBe(StatusEffect.POISON);

    game.move.select(Moves.REST);
    await game.phaseInterceptor.to("BerryPhase");

    expect(snorlax.isFullHp()).toBe(true);
    expect(snorlax.status?.effect).toBe(StatusEffect.SLEEP);
  });

  it("should always last 3 turns", async () => {
    await game.classicMode.startBattle([Species.SNORLAX]);

    const snorlax = game.scene.getPlayerPokemon()!;
    snorlax.hp = 1;

    // Cf https://bulbapedia.bulbagarden.net/wiki/Rest_(move):
    // > The user is unable to use moves while asleep for 2 turns after the turn when Rest is used.
    game.move.select(Moves.REST);
    await game.toNextTurn();

    expect(snorlax.status?.effect).toBe(StatusEffect.SLEEP);
    expect(snorlax.status?.sleepTurnsRemaining).toBe(3);

    game.move.select(Moves.SWORDS_DANCE);
    await game.toNextTurn();
    expect(snorlax.status?.sleepTurnsRemaining).toBe(2);

    game.move.select(Moves.SWORDS_DANCE);
    await game.toNextTurn();
    expect(snorlax.status?.sleepTurnsRemaining).toBe(1);

    game.move.select(Moves.SWORDS_DANCE);
    await game.toNextTurn();
    expect(snorlax.status?.effect).toBeUndefined();
    expect(snorlax.getStatStage(Stat.ATK)).toBe(2);
  });

  it("should preserve non-volatile status conditions", async () => {
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
    { name: "is grounded on Electric Terrain", ability: Abilities.ELECTRIC_SURGE },
    { name: "is grounded on Misty Terrain", ability: Abilities.MISTY_SURGE },
    { name: "has Comatose", ability: Abilities.COMATOSE },
  ])("should fail if the user $name", async ({ status = StatusEffect.NONE, ability = Abilities.NONE, dmg = 1 }) => {
    game.override.ability(ability).statusEffect(status);
    await game.classicMode.startBattle([Species.SNORLAX]);

    const snorlax = game.scene.getPlayerPokemon()!;

    snorlax.hp = snorlax.getMaxHp() - dmg;

    game.move.select(Moves.REST);
    await game.phaseInterceptor.to("BerryPhase");

    expect(snorlax.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should fail if called while already asleep", async () => {
    game.override.statusEffect(StatusEffect.SLEEP).moveset([Moves.REST, Moves.SLEEP_TALK]);
    await game.classicMode.startBattle([Species.SNORLAX]);

    const snorlax = game.scene.getPlayerPokemon()!;
    snorlax.hp = 1;

    game.move.select(Moves.SLEEP_TALK);
    await game.phaseInterceptor.to("BerryPhase");

    expect(snorlax.isFullHp()).toBe(false);
    expect(snorlax.status?.effect).toBe(StatusEffect.SLEEP);
    expect(snorlax.getLastXMoves(-1).map(tm => tm.result)).toEqual([MoveResult.FAIL, MoveResult.SUCCESS]);
  });

  it("should succeed if called the turn after waking up", async () => {
    game.override.statusEffect(StatusEffect.SLEEP);
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
    expect(snorlax.status?.sleepTurnsRemaining).toBeGreaterThan(1);
  });
});
