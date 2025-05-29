import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/data-lists";
import { Abilities } from "#enums/abilities";
import { BattleType } from "#enums/battle-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

describe.each<{ name: string; move: Moves }>([
  { name: "Bolt Beak", move: Moves.BOLT_BEAK },
  { name: "Fishious Rend", move: Moves.FISHIOUS_REND },
])("Moves - $name", ({ move }) => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let powerSpy: MockInstance;

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
      .moveset(move)
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .battleType(BattleType.TRAINER)
      .disableCrits()
      .enemyLevel(100)
      .enemySpecies(Species.DRACOVISH)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);

    powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");
  });

  it("should double power if the user moves before the target", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    // turn 1: enemy, then player (no boost)
    game.move.select(move);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power);

    // turn 2: player, then enemy (boost)
    game.move.select(move);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power * 2);
  });
  
  it("should only consider the selected target in Double Battles", async () => {
    game.override.battleStyle("double").moveset([move, Moves.SPLASH]);
    await game.classicMode.startBattle([Species.FEEBAS, Species.MILOTIC]);

    // Use move after everyone but P1 and enemy 1 have already moved
    game.move.select(move, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power * 2);
  });

  it("should double power on the turn the target switches in", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(move);
    game.forceEnemyToSwitch();
    await game.toNextTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power * 2);
  });

  // TODO: Verify behavior with Instruct/Dancer
  it.todo.each<{ type: string; allyMove: Moves }>([
    { type: "a Dancer-induced", allyMove: Moves.FIERY_DANCE },
    { type: "an Instructed", allyMove: Moves.INSTRUCT },
  ])("should double power if $type move is used as the target's first action that turn", async ({ allyMove }) => {
    game.override.battleStyle("double").moveset([move, allyMove]).enemyAbility(Abilities.DANCER);
    await game.classicMode.startBattle([Species.DRACOVISH, Species.ARCTOZOLT]);

    // Simulate enemy having used splash last turn to allow Instruct to copy it
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.pushMoveHistory({
      move: Moves.SPLASH,
      targets: [BattlerIndex.ENEMY],
      turn: game.scene.currentBattle.turn - 1,
    });

    game.move.select(move, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(allyMove, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toNextTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power);
  });
});
