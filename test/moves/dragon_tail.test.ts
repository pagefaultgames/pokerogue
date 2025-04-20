import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/moves/move";
import { Status } from "#app/data/status-effect";
import { Challenges } from "#enums/challenges";
import { StatusEffect } from "#enums/status-effect";
import { PokemonType } from "#enums/pokemon-type";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Dragon Tail", () => {
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
      .moveset([Moves.DRAGON_TAIL, Moves.SPLASH, Moves.FLAMETHROWER])
      .enemySpecies(Species.WAILORD)
      .enemyMoveset(Moves.SPLASH)
      .startingLevel(5)
      .enemyLevel(5);

    vi.spyOn(allMoves[Moves.DRAGON_TAIL], "accuracy", "get").mockReturnValue(100);
  });

  it("should cause opponent to flee, and not crash", async () => {
    await game.classicMode.startBattle([Species.DRATINI]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DRAGON_TAIL);

    await game.phaseInterceptor.to("BerryPhase");

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(!isVisible && hasFled).toBe(true);

    // simply want to test that the game makes it this far without crashing
    await game.phaseInterceptor.to("BattleEndPhase");
  });

  it("should cause opponent to flee, display ability, and not crash", async () => {
    game.override.enemyAbility(Abilities.ROUGH_SKIN);
    await game.classicMode.startBattle([Species.DRATINI]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DRAGON_TAIL);

    await game.phaseInterceptor.to("BerryPhase");

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(!isVisible && hasFled).toBe(true);
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
  });

  it("should proceed without crashing in a double battle", async () => {
    game.override.battleStyle("double").enemyMoveset(Moves.SPLASH).enemyAbility(Abilities.ROUGH_SKIN);
    await game.classicMode.startBattle([Species.DRATINI, Species.DRATINI, Species.WAILORD, Species.WAILORD]);

    const leadPokemon = game.scene.getPlayerParty()[0]!;

    const enemyLeadPokemon = game.scene.getEnemyParty()[0]!;
    const enemySecPokemon = game.scene.getEnemyParty()[1]!;

    game.move.select(Moves.DRAGON_TAIL, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("TurnEndPhase");

    const isVisibleLead = enemyLeadPokemon.visible;
    const hasFledLead = enemyLeadPokemon.switchOutStatus;
    const isVisibleSec = enemySecPokemon.visible;
    const hasFledSec = enemySecPokemon.switchOutStatus;
    expect(!isVisibleLead && hasFledLead && isVisibleSec && !hasFledSec).toBe(true);
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());

    // second turn
    game.move.select(Moves.FLAMETHROWER, 0, BattlerIndex.ENEMY_2);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase");
    expect(enemySecPokemon.hp).toBeLessThan(enemySecPokemon.getMaxHp());
  });

  it("should redirect targets upon opponent flee", async () => {
    game.override.battleStyle("double").enemyMoveset(Moves.SPLASH).enemyAbility(Abilities.ROUGH_SKIN);
    await game.classicMode.startBattle([Species.DRATINI, Species.DRATINI, Species.WAILORD, Species.WAILORD]);

    const leadPokemon = game.scene.getPlayerParty()[0]!;
    const secPokemon = game.scene.getPlayerParty()[1]!;

    const enemyLeadPokemon = game.scene.getEnemyParty()[0]!;
    const enemySecPokemon = game.scene.getEnemyParty()[1]!;

    game.move.select(Moves.DRAGON_TAIL, 0, BattlerIndex.ENEMY);
    // target the same pokemon, second move should be redirected after first flees
    game.move.select(Moves.DRAGON_TAIL, 1, BattlerIndex.ENEMY);

    await game.phaseInterceptor.to("BerryPhase");

    const isVisibleLead = enemyLeadPokemon.visible;
    const hasFledLead = enemyLeadPokemon.switchOutStatus;
    const isVisibleSec = enemySecPokemon.visible;
    const hasFledSec = enemySecPokemon.switchOutStatus;
    expect(!isVisibleLead && hasFledLead && !isVisibleSec && hasFledSec).toBe(true);
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
    expect(secPokemon.hp).toBeLessThan(secPokemon.getMaxHp());
    expect(enemyLeadPokemon.hp).toBeLessThan(enemyLeadPokemon.getMaxHp());
    expect(enemySecPokemon.hp).toBeLessThan(enemySecPokemon.getMaxHp());
  });

  it("doesn't switch out if the target has suction cups", async () => {
    game.override.enemyAbility(Abilities.SUCTION_CUPS);
    await game.classicMode.startBattle([Species.REGIELEKI]);

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DRAGON_TAIL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.isFullHp()).toBe(false);
  });

  it("should force a switch upon fainting an opponent normally", async () => {
    game.override.startingWave(5).startingLevel(1000); // To make sure Dragon Tail KO's the opponent
    await game.classicMode.startBattle([Species.DRATINI]);

    game.move.select(Moves.DRAGON_TAIL);

    await game.toNextTurn();

    // Make sure the enemy switched to a healthy Pokemon
    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy).toBeDefined();
    expect(enemy.isFullHp()).toBe(true);

    // Make sure the enemy has a fainted Pokemon in their party and not on the field
    const faintedEnemy = game.scene.getEnemyParty().find(p => !p.isAllowedInBattle());
    expect(faintedEnemy).toBeDefined();
    expect(game.scene.getEnemyField().length).toBe(1);
  });

  it("should not cause a softlock when activating an opponent trainer's reviver seed", async () => {
    game.override
      .startingWave(5)
      .enemyHeldItems([{ name: "REVIVER_SEED" }])
      .startingLevel(1000); // To make sure Dragon Tail KO's the opponent
    await game.classicMode.startBattle([Species.DRATINI]);

    game.move.select(Moves.DRAGON_TAIL);

    await game.toNextTurn();

    // Make sure the enemy field is not empty and has a revived Pokemon
    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy).toBeDefined();
    expect(enemy.hp).toBe(Math.floor(enemy.getMaxHp() / 2));
    expect(game.scene.getEnemyField().length).toBe(1);
  });

  it("should not cause a softlock when activating a player's reviver seed", async () => {
    game.override
      .startingHeldItems([{ name: "REVIVER_SEED" }])
      .enemyMoveset(Moves.DRAGON_TAIL)
      .enemyLevel(1000); // To make sure Dragon Tail KO's the player
    await game.classicMode.startBattle([Species.DRATINI, Species.BULBASAUR]);

    game.move.select(Moves.SPLASH);

    await game.toNextTurn();

    // Make sure the player's field is not empty and has a revived Pokemon
    const dratini = game.scene.getPlayerPokemon()!;
    expect(dratini).toBeDefined();
    expect(dratini.hp).toBe(Math.floor(dratini.getMaxHp() / 2));
    expect(game.scene.getPlayerField().length).toBe(1);
  });

  it("should force switches randomly", async () => {
    game.override.enemyMoveset(Moves.DRAGON_TAIL).startingLevel(100).enemyLevel(1);
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();

    // Turn 1: Mock an RNG call that calls for switching to 1st backup Pokemon (Charmander)
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.DRAGON_TAIL);
    await game.toNextTurn();

    expect(bulbasaur.isOnField()).toBe(false);
    expect(charmander.isOnField()).toBe(true);
    expect(squirtle.isOnField()).toBe(false);
    expect(bulbasaur.getInverseHp()).toBeGreaterThan(0);

    // Turn 2: Mock an RNG call that calls for switching to 2nd backup Pokemon (Squirtle)
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min + 1;
    });
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(bulbasaur.isOnField()).toBe(false);
    expect(charmander.isOnField()).toBe(false);
    expect(squirtle.isOnField()).toBe(true);
    expect(charmander.getInverseHp()).toBeGreaterThan(0);
  });

  it("should not force a switch to a challenge-ineligible Pokemon", async () => {
    game.override.enemyMoveset(Moves.DRAGON_TAIL).startingLevel(100).enemyLevel(1);
    // Mono-Water challenge, Eevee is ineligible
    game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, PokemonType.WATER + 1, 0);
    await game.challengeMode.startBattle([Species.LAPRAS, Species.EEVEE, Species.TOXAPEX, Species.PRIMARINA]);

    const [lapras, eevee, toxapex, primarina] = game.scene.getPlayerParty();

    // Turn 1: Mock an RNG call that would normally call for switching to Eevee, but it is ineligible
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(lapras.isOnField()).toBe(false);
    expect(eevee.isOnField()).toBe(false);
    expect(toxapex.isOnField()).toBe(true);
    expect(primarina.isOnField()).toBe(false);
    expect(lapras.getInverseHp()).toBeGreaterThan(0);
  });

  it("should not force a switch to a fainted Pokemon", async () => {
    game.override.enemyMoveset([Moves.SPLASH, Moves.DRAGON_TAIL]).startingLevel(100).enemyLevel(1);
    await game.classicMode.startBattle([Species.LAPRAS, Species.EEVEE, Species.TOXAPEX, Species.PRIMARINA]);

    const [lapras, eevee, toxapex, primarina] = game.scene.getPlayerParty();

    // Turn 1: Eevee faints
    eevee.hp = 0;
    eevee.status = new Status(StatusEffect.FAINT);
    expect(eevee.isFainted()).toBe(true);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    // Turn 2: Mock an RNG call that would normally call for switching to Eevee, but it is fainted
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.DRAGON_TAIL);
    await game.toNextTurn();

    expect(lapras.isOnField()).toBe(false);
    expect(eevee.isOnField()).toBe(false);
    expect(toxapex.isOnField()).toBe(true);
    expect(primarina.isOnField()).toBe(false);
    expect(lapras.getInverseHp()).toBeGreaterThan(0);
  });

  it("should not force a switch if there are no available Pokemon to switch into", async () => {
    game.override.enemyMoveset([Moves.SPLASH, Moves.DRAGON_TAIL]).startingLevel(100).enemyLevel(1);
    await game.classicMode.startBattle([Species.LAPRAS, Species.EEVEE]);

    const [lapras, eevee] = game.scene.getPlayerParty();

    // Turn 1: Eevee faints
    eevee.hp = 0;
    eevee.status = new Status(StatusEffect.FAINT);
    expect(eevee.isFainted()).toBe(true);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    // Turn 2: Mock an RNG call that would normally call for switching to Eevee, but it is fainted
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.DRAGON_TAIL);
    await game.toNextTurn();

    expect(lapras.isOnField()).toBe(true);
    expect(eevee.isOnField()).toBe(false);
    expect(lapras.getInverseHp()).toBeGreaterThan(0);
  });
});
