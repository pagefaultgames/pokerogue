import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - SYRUP BOMB", () => {
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
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.BALL_FETCH)
      .startingLevel(30)
      .enemyLevel(100)
      .moveset([MoveId.SYRUP_BOMB, MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH);
  });

  //Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/syrup_bomb_(move)

  it("decreases the target Pokemon's speed stat once per turn for 3 turns", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const targetPokemon = game.field.getEnemyPokemon();
    expect(targetPokemon.getStatStage(Stat.SPD)).toBe(0);

    game.move.select(MoveId.SYRUP_BOMB);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.toNextTurn();
    expect(targetPokemon.getTag(BattlerTagType.SYRUP_BOMB)).toBeDefined();
    expect(targetPokemon.getStatStage(Stat.SPD)).toBe(-1);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(targetPokemon.getTag(BattlerTagType.SYRUP_BOMB)).toBeDefined();
    expect(targetPokemon.getStatStage(Stat.SPD)).toBe(-2);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(targetPokemon.getTag(BattlerTagType.SYRUP_BOMB)).toBeUndefined();
    expect(targetPokemon.getStatStage(Stat.SPD)).toBe(-3);
  });

  it("does not affect Pokemon with the ability Bulletproof", async () => {
    game.override.enemyAbility(AbilityId.BULLETPROOF);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const targetPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.SYRUP_BOMB);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.toNextTurn();
    expect(targetPokemon.isFullHp()).toBe(true);
    expect(targetPokemon.getTag(BattlerTagType.SYRUP_BOMB)).toBeUndefined();
    expect(targetPokemon.getStatStage(Stat.SPD)).toBe(0);
  });

  it("stops lowering the target's speed if the user leaves the field", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    game.move.select(MoveId.SYRUP_BOMB);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(game.field.getEnemyPokemon().getStatStage(Stat.SPD)).toBe(-1);
  });
});
