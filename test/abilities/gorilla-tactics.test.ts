import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { RandomMoveAttr } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Gorilla Tactics", () => {
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
      .criticalHits(false)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(30)
      .moveset([MoveId.SPLASH, MoveId.TACKLE, MoveId.GROWL, MoveId.METRONOME])
      .ability(AbilityId.GORILLA_TACTICS);
  });

  it("boosts the Pokémon's Attack by 50%, but limits the Pokémon to using only one move", async () => {
    await game.classicMode.startBattle([SpeciesId.GALAR_DARMANITAN]);

    const darmanitan = game.field.getPlayerPokemon();
    const initialAtkStat = darmanitan.getStat(Stat.ATK);

    game.move.select(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(darmanitan.getStat(Stat.ATK, false)).toBeCloseTo(initialAtkStat * 1.5);
    // Other moves should be restricted
    expect(darmanitan.isMoveRestricted(MoveId.TACKLE)).toBe(true);
    expect(darmanitan.isMoveRestricted(MoveId.SPLASH)).toBe(false);
  });

  it("should struggle if the only usable move is disabled", async () => {
    await game.classicMode.startBattle([SpeciesId.GALAR_DARMANITAN]);

    const darmanitan = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    // First turn, lock move to Growl
    game.move.select(MoveId.GROWL);
    await game.toNextTurn();

    // Second turn, Growl is interrupted by Disable
    game.move.select(MoveId.GROWL);
    await game.move.forceEnemyMove(MoveId.DISABLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemy.getStatStage(Stat.ATK)).toBe(-1); // Only the effect of the first Growl should be applied

    // Third turn, Struggle is used
    game.move.select(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.SPLASH); // prevent disable from being used by the enemy
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(darmanitan.hp).toBeLessThan(darmanitan.getMaxHp());

    await game.toNextTurn();
    expect(darmanitan.getLastXMoves()[0].move).toBe(MoveId.STRUGGLE);
  });

  it("should lock into calling moves, even if also in moveset", async () => {
    vi.spyOn(RandomMoveAttr.prototype, "getMoveOverride").mockReturnValue(MoveId.TACKLE);
    await game.classicMode.startBattle([SpeciesId.GALAR_DARMANITAN]);

    const darmanitan = game.field.getPlayerPokemon();

    game.move.select(MoveId.METRONOME);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Gorilla Tactics should lock into Metronome, not tackle
    expect(darmanitan.isMoveRestricted(MoveId.TACKLE)).toBe(true);
    expect(darmanitan.isMoveRestricted(MoveId.METRONOME)).toBe(false);
    expect(darmanitan.getLastXMoves(-1)).toEqual([
      expect.objectContaining({ move: MoveId.TACKLE, result: MoveResult.SUCCESS, useMode: MoveUseMode.FOLLOW_UP }),
      expect.objectContaining({ move: MoveId.METRONOME, result: MoveResult.SUCCESS, useMode: MoveUseMode.NORMAL }),
    ]);
  });

  it("should activate when the opponenet protects", async () => {
    await game.classicMode.startBattle([SpeciesId.GALAR_DARMANITAN]);

    const darmanitan = game.field.getPlayerPokemon();

    game.move.select(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.PROTECT);

    await game.toEndOfTurn();
    expect(darmanitan.isMoveRestricted(MoveId.SPLASH)).toBe(true);
    expect(darmanitan.isMoveRestricted(MoveId.TACKLE)).toBe(false);
    const enemy = game.field.getEnemyPokemon();
    expect(enemy.hp).toBe(enemy.getMaxHp());
  });

  it("should activate when a move is succesfully executed but misses", async () => {
    await game.classicMode.startBattle([SpeciesId.GALAR_DARMANITAN]);

    const darmanitan = game.field.getPlayerPokemon();

    game.move.select(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceMiss();
    await game.toEndOfTurn();

    expect(darmanitan.isMoveRestricted(MoveId.SPLASH)).toBe(true);
    expect(darmanitan.isMoveRestricted(MoveId.TACKLE)).toBe(false);
  });
});
