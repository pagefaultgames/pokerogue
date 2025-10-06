import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Rest", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.EKANS)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should fully heal the user, cure its prior status and put it to sleep", async () => {
    game.override.statusEffect(StatusEffect.POISON);
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const snorlax = game.field.getPlayerPokemon();
    snorlax.hp = 1;
    expect(snorlax.status?.effect).toBe(StatusEffect.POISON);

    game.move.use(MoveId.REST);
    await game.toEndOfTurn();

    expect(snorlax.hp).toBe(snorlax.getMaxHp());
    expect(snorlax.status?.effect).toBe(StatusEffect.SLEEP);
  });

  it("should always last 3 turns", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const snorlax = game.field.getPlayerPokemon();
    snorlax.hp = 1;

    // Cf https://bulbapedia.bulbagarden.net/wiki/Rest_(move):
    // > The user is unable to use MoveId while asleep for 2 turns after the turn when Rest is used.
    game.move.use(MoveId.REST);
    await game.toNextTurn();

    expect(snorlax.status?.effect).toBe(StatusEffect.SLEEP);
    expect(snorlax.status?.sleepTurnsRemaining).toBe(3);

    game.move.use(MoveId.SWORDS_DANCE);
    await game.toNextTurn();
    expect(snorlax.status?.sleepTurnsRemaining).toBe(2);

    game.move.use(MoveId.SWORDS_DANCE);
    await game.toNextTurn();
    expect(snorlax.status?.sleepTurnsRemaining).toBe(1);

    game.move.use(MoveId.SWORDS_DANCE);
    await game.toNextTurn();
    expect(snorlax.status?.effect).toBeUndefined();
    expect(snorlax.getStatStage(Stat.ATK)).toBe(2);
  });

  it("should preserve non-volatile status conditions", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const snorlax = game.field.getPlayerPokemon();
    snorlax.hp = 1;
    snorlax.addTag(BattlerTagType.CONFUSED, 999);

    game.move.use(MoveId.REST);
    await game.toEndOfTurn();

    expect(snorlax.getTag(BattlerTagType.CONFUSED)).toBeDefined();
  });

  it.each<{ name: string; status?: StatusEffect; ability?: AbilityId; dmg?: number }>([
    { name: "is at full HP", dmg: 0 },
    { name: "is grounded on Electric Terrain", ability: AbilityId.ELECTRIC_SURGE },
    { name: "is grounded on Misty Terrain", ability: AbilityId.MISTY_SURGE },
    { name: "has Comatose", ability: AbilityId.COMATOSE },
  ])("should fail if the user $name", async ({ status = StatusEffect.NONE, ability = AbilityId.NONE, dmg = 1 }) => {
    game.override.ability(ability).statusEffect(status);
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const snorlax = game.field.getPlayerPokemon();

    snorlax.hp = snorlax.getMaxHp() - dmg;

    game.move.use(MoveId.REST);
    await game.toEndOfTurn();

    expect(snorlax.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should fail if called while already asleep", async () => {
    game.override.statusEffect(StatusEffect.SLEEP).moveset([MoveId.REST, MoveId.SLEEP_TALK]);
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const snorlax = game.field.getPlayerPokemon();
    snorlax.hp = 1;

    // Need to use sleep talk here since you normally can't move while asleep
    game.move.select(MoveId.SLEEP_TALK);
    await game.toEndOfTurn();

    expect(snorlax.isFullHp()).toBe(false);
    expect(snorlax.status?.effect).toBe(StatusEffect.SLEEP);
    expect(snorlax.getLastXMoves(-1).map(tm => tm.result)).toEqual([MoveResult.FAIL, MoveResult.SUCCESS]);
  });

  it("should succeed if called the same turn as the user wakes", async () => {
    game.override.statusEffect(StatusEffect.SLEEP);
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const snorlax = game.field.getPlayerPokemon();
    snorlax.hp = 1;

    expect(snorlax.status?.effect).toBe(StatusEffect.SLEEP);
    snorlax.status!.sleepTurnsRemaining = 1;

    game.move.use(MoveId.REST);
    await game.toNextTurn();

    expect(snorlax.status!.effect).toBe(StatusEffect.SLEEP);
    expect(snorlax.isFullHp()).toBe(true);
    expect(snorlax.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(snorlax.status!.sleepTurnsRemaining).toBeGreaterThan(1);
  });
});
