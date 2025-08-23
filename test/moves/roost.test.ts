import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

describe("Moves - Roost", () => {
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
      .enemySpecies(SpeciesId.RELICANTH)
      .startingLevel(100)
      .enemyLevel(100)
      .enemyMoveset(MoveId.EARTHQUAKE)
      .moveset([MoveId.ROOST, MoveId.BURN_UP, MoveId.DOUBLE_SHOCK]);
  });

  /**
   * Roost's behavior should be defined as:
   * The pokemon loses its flying type for a turn. If the pokemon was ungroundd solely due to being a flying type, it will be grounded until end of turn.
   * 1. Pure Flying type pokemon -> become normal type until end of turn
   * 2. Dual Flying/X type pokemon -> become type X until end of turn
   * 3. Pokemon that use burn up into roost (ex. Moltres) -> become flying due to burn up, then typeless until end of turn after using roost
   * 4. If a pokemon is afflicted with Forest's Curse or Trick or treat, dual type pokemon will become 3 type pokemon after the flying type is regained
   *    Pure flying types become (Grass or Ghost) and then back to flying/ (Grass or Ghost),
   *    and pokemon post Burn up become ()
   * 5. If a pokemon is also ungrounded due to other reasons (such as levitate), it will stay ungrounded post roost, despite not being flying type.
   * 6. Non flying types using roost (such as dunsparce) are already grounded, so this move will only heal and have no other effects.
   */

  test("Non flying type uses roost -> no type change, took damage", async () => {
    await game.classicMode.startBattle([SpeciesId.DUNSPARCE]);
    const playerPokemon = game.field.getPlayerPokemon();
    const playerPokemonStartingHP = playerPokemon.hp;
    game.move.select(MoveId.ROOST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    // Should only be normal type, and NOT flying type
    let playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemonTypes[0] === PokemonType.NORMAL).toBeTruthy();
    expect(playerPokemonTypes.length === 1).toBeTruthy();
    expect(playerPokemon.isGrounded()).toBeTruthy();

    await game.phaseInterceptor.to(TurnEndPhase);

    // Lose HP, still normal type
    playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemon.hp).toBeLessThan(playerPokemonStartingHP);
    expect(playerPokemonTypes[0] === PokemonType.NORMAL).toBeTruthy();
    expect(playerPokemonTypes.length === 1).toBeTruthy();
    expect(playerPokemon.isGrounded()).toBeTruthy();
  });

  test("Pure flying type -> becomes normal after roost and takes damage from ground moves -> regains flying", async () => {
    await game.classicMode.startBattle([SpeciesId.TORNADUS]);
    const playerPokemon = game.field.getPlayerPokemon();
    const playerPokemonStartingHP = playerPokemon.hp;
    game.move.select(MoveId.ROOST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    // Should only be normal type, and NOT flying type
    let playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemonTypes[0] === PokemonType.NORMAL).toBeTruthy();
    expect(playerPokemonTypes[0] === PokemonType.FLYING).toBeFalsy();
    expect(playerPokemon.isGrounded()).toBeTruthy();

    await game.phaseInterceptor.to(TurnEndPhase);

    // Should have lost HP and is now back to being pure flying
    playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemon.hp).toBeLessThan(playerPokemonStartingHP);
    expect(playerPokemonTypes[0] === PokemonType.NORMAL).toBeFalsy();
    expect(playerPokemonTypes[0] === PokemonType.FLYING).toBeTruthy();
    expect(playerPokemon.isGrounded()).toBeFalsy();
  });

  test("Dual X/flying type -> becomes type X after roost and takes damage from ground moves -> regains flying", async () => {
    await game.classicMode.startBattle([SpeciesId.HAWLUCHA]);
    const playerPokemon = game.field.getPlayerPokemon();
    const playerPokemonStartingHP = playerPokemon.hp;
    game.move.select(MoveId.ROOST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    // Should only be pure fighting type and grounded
    let playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemonTypes[0] === PokemonType.FIGHTING).toBeTruthy();
    expect(playerPokemonTypes.length === 1).toBeTruthy();
    expect(playerPokemon.isGrounded()).toBeTruthy();

    await game.phaseInterceptor.to(TurnEndPhase);

    // Should have lost HP and is now back to being fighting/flying
    playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemon.hp).toBeLessThan(playerPokemonStartingHP);
    expect(playerPokemonTypes[0] === PokemonType.FIGHTING).toBeTruthy();
    expect(playerPokemonTypes[1] === PokemonType.FLYING).toBeTruthy();
    expect(playerPokemon.isGrounded()).toBeFalsy();
  });

  test("Pokemon with levitate after using roost should lose flying type but still be unaffected by ground moves", async () => {
    game.override.starterForms({ [SpeciesId.ROTOM]: 4 });
    await game.classicMode.startBattle([SpeciesId.ROTOM]);
    const playerPokemon = game.field.getPlayerPokemon();
    const playerPokemonStartingHP = playerPokemon.hp;
    game.move.select(MoveId.ROOST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    // Should only be pure eletric type and grounded
    let playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemonTypes[0] === PokemonType.ELECTRIC).toBeTruthy();
    expect(playerPokemonTypes.length === 1).toBeTruthy();
    expect(playerPokemon.isGrounded()).toBeFalsy();

    await game.phaseInterceptor.to(TurnEndPhase);

    // Should have lost HP and is now back to being electric/flying
    playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemon.hp).toBe(playerPokemonStartingHP);
    expect(playerPokemonTypes[0] === PokemonType.ELECTRIC).toBeTruthy();
    expect(playerPokemonTypes[1] === PokemonType.FLYING).toBeTruthy();
    expect(playerPokemon.isGrounded()).toBeFalsy();
  });

  test("A fire/flying type that uses burn up, then roost should be typeless until end of turn", async () => {
    await game.classicMode.startBattle([SpeciesId.MOLTRES]);
    const playerPokemon = game.field.getPlayerPokemon();
    const playerPokemonStartingHP = playerPokemon.hp;
    game.move.select(MoveId.BURN_UP);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    // Should only be pure flying type after burn up
    let playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemonTypes[0] === PokemonType.FLYING).toBeTruthy();
    expect(playerPokemonTypes.length === 1).toBeTruthy();

    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(MoveId.ROOST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    // Should only be typeless type after roost and is grounded
    playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemon.getTag(BattlerTagType.ROOSTED)).toBeDefined();
    expect(playerPokemonTypes[0] === PokemonType.UNKNOWN).toBeTruthy();
    expect(playerPokemonTypes.length === 1).toBeTruthy();
    expect(playerPokemon.isGrounded()).toBeTruthy();

    await game.phaseInterceptor.to(TurnEndPhase);

    // Should go back to being pure flying and have taken damage from earthquake, and is ungrounded again
    playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemon.hp).toBeLessThan(playerPokemonStartingHP);
    expect(playerPokemonTypes[0] === PokemonType.FLYING).toBeTruthy();
    expect(playerPokemonTypes.length === 1).toBeTruthy();
    expect(playerPokemon.isGrounded()).toBeFalsy();
  });

  test("An electric/flying type that uses double shock, then roost should be typeless until end of turn", async () => {
    game.override.enemySpecies(SpeciesId.ZEKROM);
    await game.classicMode.startBattle([SpeciesId.ZAPDOS]);
    const playerPokemon = game.field.getPlayerPokemon();
    const playerPokemonStartingHP = playerPokemon.hp;
    game.move.select(MoveId.DOUBLE_SHOCK);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    // Should only be pure flying type after burn up
    let playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemonTypes[0] === PokemonType.FLYING).toBeTruthy();
    expect(playerPokemonTypes.length === 1).toBeTruthy();

    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(MoveId.ROOST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    // Should only be typeless type after roost and is grounded
    playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemon.getTag(BattlerTagType.ROOSTED)).toBeDefined();
    expect(playerPokemonTypes[0] === PokemonType.UNKNOWN).toBeTruthy();
    expect(playerPokemonTypes.length === 1).toBeTruthy();
    expect(playerPokemon.isGrounded()).toBeTruthy();

    await game.phaseInterceptor.to(TurnEndPhase);

    // Should go back to being pure flying and have taken damage from earthquake, and is ungrounded again
    playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemon.hp).toBeLessThan(playerPokemonStartingHP);
    expect(playerPokemonTypes[0] === PokemonType.FLYING).toBeTruthy();
    expect(playerPokemonTypes.length === 1).toBeTruthy();
    expect(playerPokemon.isGrounded()).toBeFalsy();
  });

  test("Dual Type Pokemon afflicted with Forests Curse/Trick or Treat and post roost will become dual type and then become 3 type at end of turn", async () => {
    game.override.enemyMoveset([
      MoveId.TRICK_OR_TREAT,
      MoveId.TRICK_OR_TREAT,
      MoveId.TRICK_OR_TREAT,
      MoveId.TRICK_OR_TREAT,
    ]);
    await game.classicMode.startBattle([SpeciesId.MOLTRES]);
    const playerPokemon = game.field.getPlayerPokemon();
    game.move.select(MoveId.ROOST);
    await game.phaseInterceptor.to(MoveEffectPhase);

    let playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemonTypes[0] === PokemonType.FIRE).toBeTruthy();
    expect(playerPokemonTypes.length === 1).toBeTruthy();
    expect(playerPokemon.isGrounded()).toBeTruthy();

    await game.phaseInterceptor.to(TurnEndPhase);

    // Should be fire/flying/ghost
    playerPokemonTypes = playerPokemon.getTypes();
    expect(playerPokemonTypes.filter(type => type === PokemonType.FLYING)).toHaveLength(1);
    expect(playerPokemonTypes.filter(type => type === PokemonType.FIRE)).toHaveLength(1);
    expect(playerPokemonTypes.filter(type => type === PokemonType.GHOST)).toHaveLength(1);
    expect(playerPokemonTypes.length === 3).toBeTruthy();
    expect(playerPokemon.isGrounded()).toBeFalsy();
  });
});
