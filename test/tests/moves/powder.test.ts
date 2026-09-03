import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Powder", () => {
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
      .battleStyle("single")
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(100)
      .enemyMoveset(MoveId.EMBER)
      .enemyAbility(AbilityId.INSOMNIA)
      .startingLevel(100)
      .moveset([MoveId.POWDER, MoveId.SPLASH, MoveId.FIERY_DANCE, MoveId.ROAR]);
  });

  it("should cancel the target's Fire-type move, damage the target, and still consume the target's PP", async () => {
    // Cannot use enemy moveset override for this test, since it interferes with checking PP
    game.override.enemyMoveset([]);
    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    const enemyPokemon = game.field.getEnemyPokemon();
    game.move.changeMoveset(enemyPokemon, MoveId.EMBER);

    game.move.select(MoveId.POWDER);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.EMBER, result: MoveResult.FAIL });
    expect(enemyPokemon.hp).toBe(Math.ceil((3 * enemyPokemon.getMaxHp()) / 4));
    expect(enemyPokemon).toHaveUsedPP(MoveId.EMBER, 1);

    await game.toNextTurn();

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.EMBER, result: MoveResult.SUCCESS });
    expect(enemyPokemon.hp).toBe(Math.ceil((3 * enemyPokemon.getMaxHp()) / 4));
    expect(enemyPokemon).toHaveUsedPP(MoveId.EMBER, 2);
  });

  it("should have no effect against Grass-type Pokemon", async () => {
    game.override.enemySpecies(SpeciesId.AMOONGUSS);

    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.POWDER);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.EMBER, result: MoveResult.SUCCESS });
    expect(enemyPokemon).toHaveFullHp();
  });

  it("should have no effect against Pokemon with Overcoat", async () => {
    game.override.enemyAbility(AbilityId.OVERCOAT);

    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.POWDER);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.EMBER, result: MoveResult.SUCCESS });
    expect(enemyPokemon).toHaveFullHp();
  });

  it("should not damage the target if the target has Magic Guard", async () => {
    game.override.enemyAbility(AbilityId.MAGIC_GUARD);

    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.POWDER);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.EMBER, result: MoveResult.FAIL });
    expect(enemyPokemon).toHaveFullHp();
  });

  it("should not damage the target if Primordial Sea is active", async () => {
    game.override.enemyAbility(AbilityId.PRIMORDIAL_SEA);

    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.POWDER);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.EMBER, result: MoveResult.FAIL });
    expect(enemyPokemon).toHaveFullHp();
  });

  it("should not prevent the target from thawing out with Flame Wheel", async () => {
    game.override.enemyMoveset(MoveId.FLAME_WHEEL).enemyStatusEffect(StatusEffect.FREEZE);

    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.POWDER);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).not.toHaveStatusEffect(StatusEffect.FREEZE);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.FLAME_WHEEL, result: MoveResult.FAIL });
    expect(enemyPokemon.hp).toBe(Math.ceil((3 * enemyPokemon.getMaxHp()) / 4));
  });

  it("should not allow a target with Protean to change to Fire type", async () => {
    game.override.enemyAbility(AbilityId.PROTEAN);

    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.POWDER);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.EMBER, result: MoveResult.FAIL });
    expect(enemyPokemon).not.toHaveFullHp();
    expect(enemyPokemon.summonData.types).not.toBe(PokemonType.FIRE);
  });

  it("should cancel Fire-type moves generated by the target's Dancer ability", async () => {
    game.override.battleStyle("double").enemySpecies(SpeciesId.BLASTOISE).enemyAbility(AbilityId.DANCER);

    await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.CHARIZARD);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    // Turn 1: Roar away 1 opponent
    game.move.select(MoveId.ROAR, 0, BattlerIndex.ENEMY_2);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    // Turn 2: Enemy should activate Powder twice: From using Ember, and from copying Fiery Dance via Dancer
    playerPokemon.hp = playerPokemon.getMaxHp();
    game.move.select(MoveId.FIERY_DANCE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.POWDER, 1, BattlerIndex.ENEMY);

    await game.phaseInterceptor.to("MoveEffectPhase");
    const enemyStartingHp = enemyPokemon.hp;

    await game.toEndOfTurn();

    // player should not take damage
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.FIERY_DANCE, result: MoveResult.FAIL });
    expect(playerPokemon).toHaveFullHp();
    // enemy should have taken damage from player's Fiery Dance + 2 Powder procs
    expect(enemyPokemon.hp).toBe(
      enemyStartingHp - playerPokemon.turnData.totalDamageDealt - 2 * Math.floor(enemyPokemon.getMaxHp() / 4),
    );
  });

  it("should cancel Fiery Dance and prevent it from triggering Dancer", async () => {
    game.override.ability(AbilityId.DANCER).enemyMoveset(MoveId.FIERY_DANCE);

    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.POWDER);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.FIERY_DANCE, result: MoveResult.FAIL });
    expect(enemyPokemon.hp).toBe(Math.ceil((3 * enemyPokemon.getMaxHp()) / 4));
    expect(playerPokemon).toHaveUsedMove(MoveId.POWDER);
  });

  it("should cancel Revelation Dance if it becomes a Fire-type move", async () => {
    game.override.enemySpecies(SpeciesId.CHARIZARD).enemyMoveset(MoveId.REVELATION_DANCE);

    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.POWDER);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.REVELATION_DANCE, result: MoveResult.FAIL });
    expect(enemyPokemon.hp).toBe(Math.ceil((3 * enemyPokemon.getMaxHp()) / 4));
  });

  it("should cancel Shell Trap and damage the target, even if the move would fail", async () => {
    game.override.enemyMoveset(MoveId.SHELL_TRAP);

    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.POWDER);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.SHELL_TRAP, result: MoveResult.FAIL });
    expect(enemyPokemon.hp).toBe(Math.ceil((3 * enemyPokemon.getMaxHp()) / 4));
  });

  it("should cancel Grass Pledge if used after ally's Fire Pledge", async () => {
    game.override.enemyMoveset([MoveId.FIRE_PLEDGE, MoveId.GRASS_PLEDGE]).battleStyle("double");

    await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.CHARIZARD);
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.POWDER, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.GRASS_PLEDGE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.FIRE_PLEDGE, BattlerIndex.PLAYER);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.GRASS_PLEDGE, result: MoveResult.FAIL });
    expect(enemyPokemon.hp).toBe(Math.ceil((3 * enemyPokemon.getMaxHp()) / 4));
  });

  it("should cancel Fire Pledge if used before ally's Water Pledge", async () => {
    game.override.enemyMoveset([MoveId.FIRE_PLEDGE, MoveId.WATER_PLEDGE]).battleStyle("double");

    await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.CHARIZARD);
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.POWDER, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.FIRE_PLEDGE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.WATER_PLEDGE, BattlerIndex.PLAYER);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.FIRE_PLEDGE, result: MoveResult.FAIL });
    expect(enemyPokemon.hp).toBe(Math.ceil((3 * enemyPokemon.getMaxHp()) / 4));
  });

  it("should NOT cancel Fire Pledge if used after ally's Water Pledge", async () => {
    game.override.enemyMoveset([MoveId.FIRE_PLEDGE, MoveId.WATER_PLEDGE]).battleStyle("double");

    await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.CHARIZARD);
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.POWDER, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.FIRE_PLEDGE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.WATER_PLEDGE, BattlerIndex.PLAYER);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon).toHaveUsedMove({ move: MoveId.FIRE_PLEDGE, result: MoveResult.SUCCESS });
    expect(enemyPokemon).toHaveFullHp();
  });
});
