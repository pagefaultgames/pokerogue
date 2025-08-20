import { allMoves } from "#data/data-lists";
import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.DRAGON_TAIL, MoveId.SPLASH, MoveId.FLAMETHROWER])
      .enemySpecies(SpeciesId.WAILORD)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(5)
      .enemyLevel(5);

    vi.spyOn(allMoves[MoveId.DRAGON_TAIL], "accuracy", "get").mockReturnValue(100);
  });

  it("should cause opponent to flee, and not crash", async () => {
    await game.classicMode.startBattle([SpeciesId.DRATINI]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.DRAGON_TAIL);

    await game.phaseInterceptor.to("BerryPhase");

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(!isVisible && hasFled).toBe(true);

    // simply want to test that the game makes it this far without crashing
    await game.phaseInterceptor.to("BattleEndPhase");
  });

  it("should cause opponent to flee, display ability, and not crash", async () => {
    game.override.enemyAbility(AbilityId.ROUGH_SKIN);
    await game.classicMode.startBattle([SpeciesId.DRATINI]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.DRAGON_TAIL);

    await game.phaseInterceptor.to("BerryPhase");

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(!isVisible && hasFled).toBe(true);
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
  });

  it("should proceed without crashing in a double battle", async () => {
    game.override.battleStyle("double").enemyMoveset(MoveId.SPLASH).enemyAbility(AbilityId.ROUGH_SKIN);
    await game.classicMode.startBattle([SpeciesId.DRATINI, SpeciesId.DRATINI, SpeciesId.WAILORD, SpeciesId.WAILORD]);

    const leadPokemon = game.field.getPlayerPokemon();

    const [enemyLeadPokemon, enemySecPokemon] = game.scene.getEnemyParty();

    game.move.select(MoveId.DRAGON_TAIL, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("TurnEndPhase");

    const isVisibleLead = enemyLeadPokemon.visible;
    const hasFledLead = enemyLeadPokemon.switchOutStatus;
    const isVisibleSec = enemySecPokemon.visible;
    const hasFledSec = enemySecPokemon.switchOutStatus;
    expect(!isVisibleLead && hasFledLead && isVisibleSec && !hasFledSec).toBe(true);
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());

    // second turn
    game.move.select(MoveId.FLAMETHROWER, 0, BattlerIndex.ENEMY_2);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase");
    expect(enemySecPokemon.hp).toBeLessThan(enemySecPokemon.getMaxHp());
  });

  it("should redirect targets upon opponent flee", async () => {
    game.override.battleStyle("double").enemyMoveset(MoveId.SPLASH).enemyAbility(AbilityId.ROUGH_SKIN);
    await game.classicMode.startBattle([SpeciesId.DRATINI, SpeciesId.DRATINI, SpeciesId.WAILORD, SpeciesId.WAILORD]);

    const [leadPokemon, secPokemon] = game.scene.getPlayerParty();

    const [enemyLeadPokemon, enemySecPokemon] = game.scene.getEnemyParty();

    game.move.select(MoveId.DRAGON_TAIL, 0, BattlerIndex.ENEMY);
    // target the same pokemon, second move should be redirected after first flees
    game.move.select(MoveId.DRAGON_TAIL, 1, BattlerIndex.ENEMY);

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
    game.override.enemyAbility(AbilityId.SUCTION_CUPS);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.DRAGON_TAIL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.isFullHp()).toBe(false);
  });

  it("should force a switch upon fainting an opponent normally", async () => {
    game.override.startingWave(5).startingLevel(1000); // To make sure Dragon Tail KO's the opponent
    await game.classicMode.startBattle([SpeciesId.DRATINI]);

    game.move.select(MoveId.DRAGON_TAIL);

    await game.toNextTurn();

    // Make sure the enemy switched to a healthy Pokemon
    const enemy = game.field.getEnemyPokemon();
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
    await game.classicMode.startBattle([SpeciesId.DRATINI]);

    game.move.select(MoveId.DRAGON_TAIL);

    await game.toNextTurn();

    // Make sure the enemy field is not empty and has a revived Pokemon
    const enemy = game.field.getEnemyPokemon();
    expect(enemy).toBeDefined();
    expect(enemy.hp).toBe(Math.floor(enemy.getMaxHp() / 2));
    expect(game.scene.getEnemyField().length).toBe(1);
  });

  it("should not cause a softlock when activating a player's reviver seed", async () => {
    game.override
      .startingHeldItems([{ name: "REVIVER_SEED" }])
      .enemyMoveset(MoveId.DRAGON_TAIL)
      .enemyLevel(1000); // To make sure Dragon Tail KO's the player
    await game.classicMode.startBattle([SpeciesId.DRATINI, SpeciesId.BULBASAUR]);

    game.move.select(MoveId.SPLASH);

    await game.toNextTurn();

    // Make sure the player's field is not empty and has a revived Pokemon
    const dratini = game.field.getPlayerPokemon();
    expect(dratini).toBeDefined();
    expect(dratini.hp).toBe(Math.floor(dratini.getMaxHp() / 2));
    expect(game.scene.getPlayerField().length).toBe(1);
  });

  it("should force switches randomly", async () => {
    game.override.enemyMoveset(MoveId.DRAGON_TAIL).startingLevel(100).enemyLevel(1);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

    const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();

    // Turn 1: Mock an RNG call that calls for switching to 1st backup Pokemon (Charmander)
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.DRAGON_TAIL);
    await game.toNextTurn();

    expect(bulbasaur.isOnField()).toBe(false);
    expect(charmander.isOnField()).toBe(true);
    expect(squirtle.isOnField()).toBe(false);
    expect(bulbasaur.getInverseHp()).toBeGreaterThan(0);

    // Turn 2: Mock an RNG call that calls for switching to 2nd backup Pokemon (Squirtle)
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min + 1;
    });
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(bulbasaur.isOnField()).toBe(false);
    expect(charmander.isOnField()).toBe(false);
    expect(squirtle.isOnField()).toBe(true);
    expect(charmander.getInverseHp()).toBeGreaterThan(0);
  });

  it("should not force a switch to a challenge-ineligible Pokemon", async () => {
    game.override.enemyMoveset(MoveId.DRAGON_TAIL).startingLevel(100).enemyLevel(1);
    // Mono-Water challenge, Eevee is ineligible
    game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, PokemonType.WATER + 1, 0);
    await game.challengeMode.startBattle([SpeciesId.LAPRAS, SpeciesId.EEVEE, SpeciesId.TOXAPEX, SpeciesId.PRIMARINA]);

    const [lapras, eevee, toxapex, primarina] = game.scene.getPlayerParty();

    // Turn 1: Mock an RNG call that would normally call for switching to Eevee, but it is ineligible
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(lapras.isOnField()).toBe(false);
    expect(eevee.isOnField()).toBe(false);
    expect(toxapex.isOnField()).toBe(true);
    expect(primarina.isOnField()).toBe(false);
    expect(lapras.getInverseHp()).toBeGreaterThan(0);
  });

  it("should not force a switch to a fainted Pokemon", async () => {
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.DRAGON_TAIL]).startingLevel(100).enemyLevel(1);
    await game.classicMode.startBattle([SpeciesId.LAPRAS, SpeciesId.EEVEE, SpeciesId.TOXAPEX, SpeciesId.PRIMARINA]);

    const [lapras, eevee, toxapex, primarina] = game.scene.getPlayerParty();

    // Turn 1: Eevee faints
    eevee.hp = 0;
    eevee.status = new Status(StatusEffect.FAINT);
    expect(eevee.isFainted()).toBe(true);
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    // Turn 2: Mock an RNG call that would normally call for switching to Eevee, but it is fainted
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.DRAGON_TAIL);
    await game.toNextTurn();

    expect(lapras.isOnField()).toBe(false);
    expect(eevee.isOnField()).toBe(false);
    expect(toxapex.isOnField()).toBe(true);
    expect(primarina.isOnField()).toBe(false);
    expect(lapras.getInverseHp()).toBeGreaterThan(0);
  });

  it("should not force a switch if there are no available Pokemon to switch into", async () => {
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.DRAGON_TAIL]).startingLevel(100).enemyLevel(1);
    await game.classicMode.startBattle([SpeciesId.LAPRAS, SpeciesId.EEVEE]);

    const [lapras, eevee] = game.scene.getPlayerParty();

    // Turn 1: Eevee faints
    eevee.hp = 0;
    eevee.status = new Status(StatusEffect.FAINT);
    expect(eevee.isFainted()).toBe(true);
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    // Turn 2: Mock an RNG call that would normally call for switching to Eevee, but it is fainted
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.DRAGON_TAIL);
    await game.toNextTurn();

    expect(lapras.isOnField()).toBe(true);
    expect(eevee.isOnField()).toBe(false);
    expect(lapras.getInverseHp()).toBeGreaterThan(0);
  });
});
