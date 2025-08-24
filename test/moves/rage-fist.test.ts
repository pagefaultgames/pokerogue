import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { Move } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
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
    move = allMoves[MoveId.RAGE_FIST];
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .moveset([MoveId.RAGE_FIST, MoveId.SPLASH, MoveId.SUBSTITUTE, MoveId.TIDY_UP])
      .startingLevel(100)
      .enemyLevel(1)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.DOUBLE_KICK);

    vi.spyOn(move, "calculateBattlePower");
  });

  it("should gain power per hit taken", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
  });

  it("caps at 6 hits taken", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    // spam splash against magikarp hitting us 2 times per turn
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    game.move.select(MoveId.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    // hit 8 times, but nothing else
    expect(game.field.getPlayerPokemon().battleData.hitCount).toBe(8);
    expect(move.calculateBattlePower).toHaveLastReturnedWith(350);
  });

  it("should not count substitute hits or confusion damage", async () => {
    game.override.enemySpecies(SpeciesId.SHUCKLE).enemyMoveset([MoveId.CONFUSE_RAY, MoveId.DOUBLE_KICK]);

    await game.classicMode.startBattle([SpeciesId.REGIROCK]);

    game.move.select(MoveId.SUBSTITUTE);
    await game.move.selectEnemyMove(MoveId.DOUBLE_KICK);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    // no increase due to substitute
    expect(game.field.getPlayerPokemon().battleData.hitCount).toBe(0);

    // remove substitute and get confused
    game.move.select(MoveId.TIDY_UP);
    await game.move.selectEnemyMove(MoveId.CONFUSE_RAY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    game.move.select(MoveId.RAGE_FIST);
    await game.move.selectEnemyMove(MoveId.CONFUSE_RAY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceConfusionActivation(true);
    await game.toNextTurn();

    // didn't go up from hitting ourself
    expect(game.field.getPlayerPokemon().battleData.hitCount).toBe(0);
  });

  it("should maintain hits recieved between wild waves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    expect(game.field.getPlayerPokemon().battleData.hitCount).toBe(2);

    game.move.select(MoveId.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.field.getPlayerPokemon().battleData.hitCount).toBe(4);
    expect(move.calculateBattlePower).toHaveLastReturnedWith(250);
  });

  it("should reset hits recieved before trainer battles", async () => {
    await game.classicMode.startBattle([SpeciesId.IRON_HANDS]);

    const ironHands = game.field.getPlayerPokemon();
    expect(ironHands).toBeDefined();

    // beat up a magikarp
    game.move.select(MoveId.RAGE_FIST);
    await game.move.selectEnemyMove(MoveId.DOUBLE_KICK);
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
    game.override.enemySpecies(SpeciesId.MAGIKARP).startingWave(10);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.move.select(MoveId.RAGE_FIST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
  });

  it("should not reset if switched out or on reload", async () => {
    game.override.enemyMoveset(MoveId.TACKLE);

    const getPartyHitCount = () =>
      game.scene
        .getPlayerParty()
        .filter(p => !!p)
        .map(m => m.battleData.hitCount);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    // Charizard hit
    game.move.select(MoveId.SPLASH);
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
    game.move.select(MoveId.RAGE_FIST);
    await game.phaseInterceptor.to("MoveEndPhase");

    const charizard = game.field.getPlayerPokemon();
    expect(charizard).toBeDefined();
    expect(charizard.species.speciesId).toBe(SpeciesId.CHARIZARD);
    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);

    // go to new wave, reload game and beat up another poor sap
    await game.toNextWave();

    await game.reload.reloadSession();

    // outsped and oneshot means power rmains same as prior
    game.move.select(MoveId.RAGE_FIST);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
  });
});
