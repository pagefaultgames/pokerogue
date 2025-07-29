import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Fishious Rend & Bolt Beak", () => {
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
      .ability(AbilityId.STURDY)
      .battleStyle("single")
      .startingWave(5)
      .criticalHits(false)
      .enemyLevel(100)
      .enemySpecies(SpeciesId.DRACOVISH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it.each<{ name: string; move: MoveId }>([
    { name: "Bolt Beak", move: MoveId.BOLT_BEAK },
    { name: "Fishious Rend", move: MoveId.FISHIOUS_REND },
  ])("$name should double power if the user moves before the target", async ({ move }) => {
    const powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    // turn 1: enemy, then player (no boost)
    game.move.use(move);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power);

    // turn 2: player, then enemy (boost)
    game.move.use(move);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power * 2);
  });

  it("should only consider the selected target in Double Battles", async () => {
    game.override.battleStyle("double");
    const powerSpy = vi.spyOn(allMoves[MoveId.BOLT_BEAK], "calculateBattlePower");
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    // Use move after everyone but P1 and enemy 1 have already moved
    game.move.use(MoveId.BOLT_BEAK, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[MoveId.BOLT_BEAK].power * 2);
  });

  it("should double power on the turn the target switches in", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);
    const powerSpy = vi.spyOn(allMoves[MoveId.BOLT_BEAK], "calculateBattlePower");

    game.move.use(MoveId.BOLT_BEAK);
    game.forceEnemyToSwitch();
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[MoveId.BOLT_BEAK].power * 2);
  });

  it("should double power on forced switch-induced sendouts", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);
    const powerSpy = vi.spyOn(allMoves[MoveId.BOLT_BEAK], "calculateBattlePower");

    game.move.use(MoveId.BOLT_BEAK);
    await game.move.forceEnemyMove(MoveId.U_TURN);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[MoveId.BOLT_BEAK].power * 2);
  });

  it.each<{ type: string; allyMove: MoveId }>([
    { type: "a Dancer-induced", allyMove: MoveId.FIERY_DANCE },
    { type: "an Instructed", allyMove: MoveId.INSTRUCT },
  ])("should double power if $type move is used as the target's first action that turn", async ({ allyMove }) => {
    game.override.battleStyle("double").enemyAbility(AbilityId.DANCER);
    const powerSpy = vi.spyOn(allMoves[MoveId.FISHIOUS_REND], "calculateBattlePower");
    await game.classicMode.startBattle([SpeciesId.DRACOVISH, SpeciesId.ARCTOZOLT]);

    // Simulate enemy having used splash last turn to allow Instruct to copy it
    const enemy = game.field.getEnemyPokemon();
    enemy.pushMoveHistory({
      move: MoveId.SPLASH,
      targets: [BattlerIndex.ENEMY],
      turn: game.scene.currentBattle.turn - 1,
      useMode: MoveUseMode.NORMAL,
    });

    game.move.use(MoveId.FISHIOUS_REND, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(allyMove, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[MoveId.FISHIOUS_REND].power);
  });
});
