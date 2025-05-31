import { BattlerIndex } from "#app/battle";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { allMoves } from "#app/data/data-lists";
import type Move from "#app/data/moves/move";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BattleType } from "#enums/battle-type";

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
      .battleStyle("single")
      .moveset([Moves.RAGE_FIST, Moves.SPLASH, Moves.SUBSTITUTE, Moves.TIDY_UP])
      .startingLevel(100)
      .enemyLevel(1)
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.DOUBLE_KICK);

    vi.spyOn(move, "calculateBattlePower");
  });

  it("should gain power per hit taken", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
  });

  it("caps at 6 hits taken", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

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

  it("should not count substitute hits or confusion damage", async () => {
    game.override.enemySpecies(Species.SHUCKLE).enemyMoveset([Moves.CONFUSE_RAY, Moves.DOUBLE_KICK]);

    await game.classicMode.startBattle([Species.REGIROCK]);

    game.move.select(Moves.SUBSTITUTE);
    await game.move.selectEnemyMove(Moves.DOUBLE_KICK);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    // no increase due to substitute
    expect(game.scene.getPlayerPokemon()?.battleData.hitCount).toBe(0);

    // remove substitute and get confused
    game.move.select(Moves.TIDY_UP);
    await game.move.selectEnemyMove(Moves.CONFUSE_RAY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    game.move.select(Moves.RAGE_FIST);
    await game.move.selectEnemyMove(Moves.CONFUSE_RAY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceConfusionActivation(true);
    await game.toNextTurn();

    // didn't go up from hitting ourself
    expect(game.scene.getPlayerPokemon()?.battleData.hitCount).toBe(0);
  });

  it("should maintain hits recieved between wild waves", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    expect(game.scene.getPlayerPokemon()?.battleData.hitCount).toBe(2);

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.getPlayerPokemon()?.battleData.hitCount).toBe(4);
    expect(move.calculateBattlePower).toHaveLastReturnedWith(250);
  });

  it("should reset hits recieved before trainer battles", async () => {
    await game.classicMode.startBattle([Species.IRON_HANDS]);

    const ironHands = game.scene.getPlayerPokemon()!;
    expect(ironHands).toBeDefined();

    // beat up a magikarp
    game.move.select(Moves.RAGE_FIST);
    await game.move.selectEnemyMove(Moves.DOUBLE_KICK);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.isVictory()).toBe(true);
    expect(ironHands.battleData.hitCount).toBe(2);
    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);

    game.override.battleType(BattleType.TRAINER);
    await game.toNextWave();

    expect(ironHands.battleData.hitCount).toBe(0);
  });

  it("should reset hits recieved before new biome", async () => {
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

  it("should not reset if switched out or on reload", async () => {
    game.override.enemyMoveset(Moves.TACKLE);

    const getPartyHitCount = () =>
      game.scene
        .getPlayerParty()
        .filter(p => !!p)
        .map(m => m.battleData.hitCount);

    await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    // Charizard hit
    game.move.select(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();
    expect(getPartyHitCount()).toEqual([1, 0]);

    // blastoise switched in & hit
    game.doSwitchPokemon(1);
    await game.toNextTurn();
    expect(getPartyHitCount()).toEqual([1, 1]);

    // charizard switched in & hit
    game.doSwitchPokemon(1);
    await game.toNextTurn();
    expect(getPartyHitCount()).toEqual([2, 1]);

    // Charizard rage fist
    game.move.select(Moves.RAGE_FIST);
    await game.phaseInterceptor.to("MoveEndPhase");

    const charizard = game.scene.getPlayerPokemon()!;
    expect(charizard).toBeDefined();
    expect(charizard.species.speciesId).toBe(Species.CHARIZARD);
    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);

    // go to new wave, reload game and beat up another poor sap
    await game.toNextWave();

    await game.reload.reloadSession();

    // outsped and oneshot means power rmains same as prior
    game.move.select(Moves.RAGE_FIST);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
  });
});
