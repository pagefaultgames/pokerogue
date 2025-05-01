import { Stat } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BattlerIndex } from "#app/battle";

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
      .enemySpecies(Species.RATTATA)
      .enemyMoveset([Moves.SPLASH, Moves.STICKY_WEB, Moves.TICKLE, Moves.OCTOLOCK])
      .enemyAbility(Abilities.BALL_FETCH)
      .startingLevel(2000)
      .moveset([Moves.SPLASH, Moves.STICKY_WEB, Moves.TICKLE, Moves.OCTOLOCK])
      .ability(Abilities.BALL_FETCH);
  });

  it("Player side + single battle Intimidate - opponent loses stats", async () => {
    game.override.ability(Abilities.MIRROR_ARMOR);
    game.override.enemyAbility(Abilities.INTIMIDATE);
    await game.classicMode.startBattle([Species.BULBASAUR]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const userPokemon = game.scene.getPlayerPokemon()!;

    // Enemy has intimidate, enemy should lose -1 atk
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(userPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("Enemy side + single battle Intimidate - player loses stats", async () => {
    game.override.enemyAbility(Abilities.MIRROR_ARMOR);
    game.override.ability(Abilities.INTIMIDATE);
    await game.classicMode.startBattle([Species.BULBASAUR]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const userPokemon = game.scene.getPlayerPokemon()!;

    // Enemy has intimidate, enemy should lose -1 atk
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(userPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("Player side + double battle Intimidate - opponents each lose -2 atk", async () => {
    game.override.battleStyle("double");
    game.override.ability(Abilities.MIRROR_ARMOR);
    game.override.enemyAbility(Abilities.INTIMIDATE);
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    const [player1, player2] = game.scene.getPlayerField();

    // Enemy has intimidate, enemy should lose -2 atk each
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(enemy1.getStatStage(Stat.ATK)).toBe(-2);
    expect(enemy2.getStatStage(Stat.ATK)).toBe(-2);
    expect(player1.getStatStage(Stat.ATK)).toBe(0);
    expect(player2.getStatStage(Stat.ATK)).toBe(0);
  });

  it("Enemy side + double battle Intimidate - players each lose -2 atk", async () => {
    game.override.battleStyle("double");
    game.override.enemyAbility(Abilities.MIRROR_ARMOR);
    game.override.ability(Abilities.INTIMIDATE);
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    const [player1, player2] = game.scene.getPlayerField();

    // Enemy has intimidate, enemy should lose -1 atk
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(enemy1.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy2.getStatStage(Stat.ATK)).toBe(0);
    expect(player1.getStatStage(Stat.ATK)).toBe(-2);
    expect(player2.getStatStage(Stat.ATK)).toBe(-2);
  });

  it("Player side + single battle Intimidate + Tickle - opponent loses stats", async () => {
    game.override.ability(Abilities.MIRROR_ARMOR);
    game.override.enemyAbility(Abilities.INTIMIDATE);
    await game.classicMode.startBattle([Species.BULBASAUR]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const userPokemon = game.scene.getPlayerPokemon()!;

    // Enemy has intimidate and uses tickle, enemy receives -2 atk and -1 defense
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.TICKLE, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(-1);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-2);
    expect(userPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(userPokemon.getStatStage(Stat.DEF)).toBe(0);
  });

  it("Player side + double battle Intimidate + Tickle - opponents each lose -3 atk, -1 def", async () => {
    game.override.battleStyle("double");
    game.override.ability(Abilities.MIRROR_ARMOR);
    game.override.enemyAbility(Abilities.INTIMIDATE);
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    const [player1, player2] = game.scene.getPlayerField();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.TICKLE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.TICKLE, BattlerIndex.PLAYER_2);
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
    game.override.enemyAbility(Abilities.MIRROR_ARMOR);
    game.override.ability(Abilities.INTIMIDATE);
    await game.classicMode.startBattle([Species.BULBASAUR]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const userPokemon = game.scene.getPlayerPokemon()!;

    // Enemy has intimidate and uses tickle, enemy receives -2 atk and -1 defense
    game.move.select(Moves.TICKLE);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(userPokemon.getStatStage(Stat.DEF)).toBe(-1);
    expect(userPokemon.getStatStage(Stat.ATK)).toBe(-2);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);
  });

  it("Player side + single battle Intimidate + oppoenent has white smoke - no one loses stats", async () => {
    game.override.enemyAbility(Abilities.WHITE_SMOKE);
    game.override.ability(Abilities.MIRROR_ARMOR);
    await game.classicMode.startBattle([Species.BULBASAUR]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const userPokemon = game.scene.getPlayerPokemon()!;

    // Enemy has intimidate and uses tickle, enemy has white smoke, no one loses stats
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.TICKLE, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(userPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(userPokemon.getStatStage(Stat.DEF)).toBe(0);
  });

  it("Enemy side + single battle Intimidate + player has white smoke - no one loses stats", async () => {
    game.override.ability(Abilities.WHITE_SMOKE);
    game.override.enemyAbility(Abilities.MIRROR_ARMOR);
    await game.classicMode.startBattle([Species.BULBASAUR]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const userPokemon = game.scene.getPlayerPokemon()!;

    // Enemy has intimidate and uses tickle, enemy has white smoke, no one loses stats
    game.move.select(Moves.TICKLE);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(userPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(userPokemon.getStatStage(Stat.DEF)).toBe(0);
  });

  it("Player side + single battle + opponent uses octolock - does not interact with mirror armor, player loses stats", async () => {
    game.override.ability(Abilities.MIRROR_ARMOR);
    await game.classicMode.startBattle([Species.BULBASAUR]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const userPokemon = game.scene.getPlayerPokemon()!;

    // Enemy uses octolock, player loses stats at end of turn
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.OCTOLOCK, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.SPDEF)).toBe(0);
    expect(userPokemon.getStatStage(Stat.DEF)).toBe(-1);
    expect(userPokemon.getStatStage(Stat.SPDEF)).toBe(-1);
  });

  it("Enemy side + single battle + player uses octolock - does not interact with mirror armor, opponent loses stats", async () => {
    game.override.enemyAbility(Abilities.MIRROR_ARMOR);
    await game.classicMode.startBattle([Species.BULBASAUR]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const userPokemon = game.scene.getPlayerPokemon()!;

    // Player uses octolock, enemy loses stats at end of turn
    game.move.select(Moves.OCTOLOCK);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(userPokemon.getStatStage(Stat.DEF)).toBe(0);
    expect(userPokemon.getStatStage(Stat.SPDEF)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(-1);
    expect(enemyPokemon.getStatStage(Stat.SPDEF)).toBe(-1);
  });

  it("Both sides have mirror armor - does not loop, player loses attack", async () => {
    game.override.enemyAbility(Abilities.MIRROR_ARMOR);
    game.override.ability(Abilities.MIRROR_ARMOR);
    game.override.ability(Abilities.INTIMIDATE);
    await game.classicMode.startBattle([Species.BULBASAUR]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const userPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(userPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("Single battle + sticky web applied player side - player switches out and enemy should lose -1 speed", async () => {
    game.override.ability(Abilities.MIRROR_ARMOR);
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const userPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.STICKY_WEB, BattlerIndex.PLAYER);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(userPokemon.getStatStage(Stat.SPD)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.SPD)).toBe(-1);
  });

  it("Double battle + sticky web applied player side - player switches out and enemy 1 should lose -1 speed", async () => {
    game.override.battleStyle("double");
    game.override.ability(Abilities.MIRROR_ARMOR);
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    const [player1, player2] = game.scene.getPlayerField();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.STICKY_WEB, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    game.doSwitchPokemon(2);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(enemy1.getStatStage(Stat.SPD)).toBe(-1);
    expect(enemy2.getStatStage(Stat.SPD)).toBe(0);
    expect(player1.getStatStage(Stat.SPD)).toBe(0);
    expect(player2.getStatStage(Stat.SPD)).toBe(0);
  });
});
