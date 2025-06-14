import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { MoveId } from "#enums/move-id";
import { SpeciesIs } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

describe.each<{ name: string; move: MoveId }>([
  { name: "Bolt Beak", move: MoveId.BOLT_BEAK },
  { name: "Fishious Rend", move: MoveId.FISHIOUS_REND },
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
      .enemySpecies(SpeciesId.DRACOVISH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);

    powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");
  });

  it("should double power if the user moves before the target", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

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
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    // Use move after everyone but P1 and enemy 1 have already moved
    game.move.use(move, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power * 2);
  });

  it("should double power on the turn the target switches in", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(move);
    game.forceEnemyToSwitch();
    await game.toNextTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power * 2);
  });

  // TODO: Verify behavior with Instruct/Dancer
  it.todo.each<{ type: string; allyMove: MoveId }>([
    { type: "a Dancer-induced", allyMove: MoveId.FIERY_DANCE },
    { type: "an Instructed", allyMove: MoveId.INSTRUCT },
  ])("should double power if $type move is used as the target's first action that turn", async ({ allyMove }) => {
    game.override.battleStyle("double").moveset([move, allyMove]).enemyAbility(AbilityId.DANCER);
    await game.classicMode.startBattle([SpeciesIs.DRACOVISH, SpeciesId.ARCTOZOLT]);

    // Simulate enemy having used splash last turn to allow Instruct to copy it
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.pushMoveHistory({
      move: MoveId.SPLASH,
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
