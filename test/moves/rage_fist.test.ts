import { BattlerIndex } from "#app/battle";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { allMoves } from "#app/data/moves/move";
import type Move from "#app/data/moves/move";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Rage Fist", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let move: Move;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    move = allMoves[Moves.RAGE_FIST];
    game = new GameManager(phaserGame);
    game.override
      .battleType("single")
      .moveset([Moves.RAGE_FIST, Moves.SPLASH, Moves.SUBSTITUTE, Moves.TIDY_UP])
      .startingLevel(100)
      .enemyLevel(1)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.DOUBLE_KICK);

    vi.spyOn(move, "calculateBattlePower");
  });

  it("should gain power per hit taken", async () => {
    game.override.enemySpecies(Species.MAGIKARP);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
  });

  it("caps at 6 hits taken", async () => {
    game.override.enemySpecies(Species.MAGIKARP);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    // spam splash against magikarp hitting us 2 times per turn
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    // hit 8 times, but nothing else
    expect(game.scene.getPlayerPokemon()?.battleData.hitCount).toBe(8);
    expect(move.calculateBattlePower).toHaveLastReturnedWith(350);
  });

  it("should not count subsitute hits or confusion damage", async () => {
    game.override.enemySpecies(Species.MAGIKARP).startingWave(4).enemyMoveset([Moves.CONFUSE_RAY, Moves.DOUBLE_KICK]);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.SUBSTITUTE);
    await game.forceEnemyMove(Moves.DOUBLE_KICK);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase");

    // no increase due to substitute
    expect(move.calculateBattlePower).toHaveLastReturnedWith(50);
    expect(game.scene.getPlayerPokemon()?.battleData.hitCount).toBe(0);

    await game.toNextTurn();

    // remove substitute and get confused
    game.move.select(Moves.TIDY_UP);
    await game.forceEnemyMove(Moves.CONFUSE_RAY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    game.move.select(Moves.RAGE_FIST);
    await game.move.forceStatusActivation(true);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    // didn't go up
    expect(game.scene.getPlayerPokemon()?.battleData.hitCount).toBe(0);

    await game.toNextTurn();

    game.move.select(Moves.RAGE_FIST);
    await game.move.forceStatusActivation(false);
    await game.toNextTurn();

    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
    expect(game.scene.getPlayerPokemon()?.battleData.hitCount).toBe(2);
  });

  it("should maintain hits recieved between wild waves", async () => {
    game.override.enemySpecies(Species.MAGIKARP).startingWave(1);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(250);
    expect(game.scene.getPlayerPokemon()?.battleData.hitCount).toBe(4);
  });

  it("should reset hits recieved during trainer battles", async () => {
    game.override.enemySpecies(Species.MAGIKARP).startingWave(19);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
  });

  it("should reset the hitRecCounter if we enter new biome", async () => {
    game.override.enemySpecies(Species.MAGIKARP).startingWave(10);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
  });

  it("should not reset the hitRecCounter if switched out", async () => {
    game.override.enemySpecies(Species.MAGIKARP).startingWave(1).enemyMoveset(Moves.TACKLE);

    await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    game.move.select(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.move.select(Moves.RAGE_FIST);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(game.scene.getPlayerParty()[0].species.speciesId).toBe(Species.CHARIZARD);
    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
  });
});
