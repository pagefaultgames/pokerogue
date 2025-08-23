import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

// TODO: When Magic Bounce is implemented, make a test for its interaction with mirror guard, use screech

describe("Ability - Mirror Armor", () => {
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
      .enemySpecies(SpeciesId.RATTATA)
      .enemyMoveset([MoveId.SPLASH, MoveId.STICKY_WEB, MoveId.TICKLE, MoveId.OCTOLOCK])
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingLevel(2000)
      .moveset([MoveId.SPLASH, MoveId.STICKY_WEB, MoveId.TICKLE, MoveId.OCTOLOCK])
      .ability(AbilityId.BALL_FETCH);
  });

  it("Player side + single battle Intimidate - opponent loses stats", async () => {
    game.override.ability(AbilityId.MIRROR_ARMOR).enemyAbility(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const userPokemon = game.field.getPlayerPokemon();

    // Enemy has intimidate, enemy should lose -1 atk
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(userPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("Enemy side + single battle Intimidate - player loses stats", async () => {
    game.override.enemyAbility(AbilityId.MIRROR_ARMOR).ability(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const userPokemon = game.field.getPlayerPokemon();

    // Enemy has intimidate, enemy should lose -1 atk
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(userPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("Player side + double battle Intimidate - opponents each lose -2 atk", async () => {
    game.override.battleStyle("double").ability(AbilityId.MIRROR_ARMOR).enemyAbility(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    const [player1, player2] = game.scene.getPlayerField();

    // Enemy has intimidate, enemy should lose -2 atk each
    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(enemy1.getStatStage(Stat.ATK)).toBe(-2);
    expect(enemy2.getStatStage(Stat.ATK)).toBe(-2);
    expect(player1.getStatStage(Stat.ATK)).toBe(0);
    expect(player2.getStatStage(Stat.ATK)).toBe(0);
  });

  it("Enemy side + double battle Intimidate - players each lose -2 atk", async () => {
    game.override.battleStyle("double").enemyAbility(AbilityId.MIRROR_ARMOR).ability(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    const [player1, player2] = game.scene.getPlayerField();

    // Enemy has intimidate, enemy should lose -1 atk
    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(enemy1.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy2.getStatStage(Stat.ATK)).toBe(0);
    expect(player1.getStatStage(Stat.ATK)).toBe(-2);
    expect(player2.getStatStage(Stat.ATK)).toBe(-2);
  });

  it("Player side + single battle Intimidate + Tickle - opponent loses stats", async () => {
    game.override.ability(AbilityId.MIRROR_ARMOR).enemyAbility(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const userPokemon = game.field.getPlayerPokemon();

    // Enemy has intimidate and uses tickle, enemy receives -2 atk and -1 defense
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.TICKLE, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(-1);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-2);
    expect(userPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(userPokemon.getStatStage(Stat.DEF)).toBe(0);
  });

  it("Player side + double battle Intimidate + Tickle - opponents each lose -3 atk, -1 def", async () => {
    game.override.battleStyle("double").ability(AbilityId.MIRROR_ARMOR).enemyAbility(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    const [player1, player2] = game.scene.getPlayerField();

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.TICKLE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.TICKLE, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(player1.getStatStage(Stat.ATK)).toBe(0);
    expect(player1.getStatStage(Stat.DEF)).toBe(0);
    expect(player2.getStatStage(Stat.ATK)).toBe(0);
    expect(player2.getStatStage(Stat.DEF)).toBe(0);
    expect(enemy1.getStatStage(Stat.ATK)).toBe(-3);
    expect(enemy1.getStatStage(Stat.DEF)).toBe(-1);
    expect(enemy2.getStatStage(Stat.ATK)).toBe(-3);
    expect(enemy2.getStatStage(Stat.DEF)).toBe(-1);
  });

  it("Enemy side + single battle Intimidate + Tickle - player loses stats", async () => {
    game.override.enemyAbility(AbilityId.MIRROR_ARMOR).ability(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const userPokemon = game.field.getPlayerPokemon();

    // Enemy has intimidate and uses tickle, enemy receives -2 atk and -1 defense
    game.move.select(MoveId.TICKLE);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(userPokemon.getStatStage(Stat.DEF)).toBe(-1);
    expect(userPokemon.getStatStage(Stat.ATK)).toBe(-2);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);
  });

  it("Player side + single battle Intimidate + oppoenent has white smoke - no one loses stats", async () => {
    game.override.enemyAbility(AbilityId.WHITE_SMOKE).ability(AbilityId.MIRROR_ARMOR);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const userPokemon = game.field.getPlayerPokemon();

    // Enemy has intimidate and uses tickle, enemy has white smoke, no one loses stats
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.TICKLE, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(userPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(userPokemon.getStatStage(Stat.DEF)).toBe(0);
  });

  it("Enemy side + single battle Intimidate + player has white smoke - no one loses stats", async () => {
    game.override.ability(AbilityId.WHITE_SMOKE).enemyAbility(AbilityId.MIRROR_ARMOR);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const userPokemon = game.field.getPlayerPokemon();

    // Enemy has intimidate and uses tickle, enemy has white smoke, no one loses stats
    game.move.select(MoveId.TICKLE);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(userPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(userPokemon.getStatStage(Stat.DEF)).toBe(0);
  });

  it("Player side + single battle + opponent uses octolock - does not interact with mirror armor, player loses stats", async () => {
    game.override.ability(AbilityId.MIRROR_ARMOR);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const userPokemon = game.field.getPlayerPokemon();

    // Enemy uses octolock, player loses stats at end of turn
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.OCTOLOCK, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.SPDEF)).toBe(0);
    expect(userPokemon.getStatStage(Stat.DEF)).toBe(-1);
    expect(userPokemon.getStatStage(Stat.SPDEF)).toBe(-1);
  });

  it("Enemy side + single battle + player uses octolock - does not interact with mirror armor, opponent loses stats", async () => {
    game.override.enemyAbility(AbilityId.MIRROR_ARMOR);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const userPokemon = game.field.getPlayerPokemon();

    // Player uses octolock, enemy loses stats at end of turn
    game.move.select(MoveId.OCTOLOCK);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(userPokemon.getStatStage(Stat.DEF)).toBe(0);
    expect(userPokemon.getStatStage(Stat.SPDEF)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(-1);
    expect(enemyPokemon.getStatStage(Stat.SPDEF)).toBe(-1);
  });

  it("Both sides have mirror armor - does not loop, player loses attack", async () => {
    game.override.enemyAbility(AbilityId.MIRROR_ARMOR).ability(AbilityId.MIRROR_ARMOR).ability(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const userPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(userPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("Single battle + sticky web applied player side - player switches out and enemy should lose -1 speed", async () => {
    game.override.ability(AbilityId.MIRROR_ARMOR);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const userPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.STICKY_WEB, BattlerIndex.PLAYER);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(userPokemon.getStatStage(Stat.SPD)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.SPD)).toBe(-1);
  });

  it("Double battle + sticky web applied player side - player switches out and enemy 1 should lose -1 speed", async () => {
    game.override.battleStyle("double").ability(AbilityId.MIRROR_ARMOR);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    const [player1, player2] = game.scene.getPlayerField();

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.STICKY_WEB, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    game.doSwitchPokemon(2);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(enemy1.getStatStage(Stat.SPD)).toBe(-1);
    expect(enemy2.getStatStage(Stat.SPD)).toBe(0);
    expect(player1.getStatStage(Stat.SPD)).toBe(0);
    expect(player2.getStatStage(Stat.SPD)).toBe(0);
  });
});
