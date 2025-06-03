import { BattlerIndex } from "#app/battle";
import { RandomMoveAttr } from "#app/data/moves/move";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/testUtils/gameManager";
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
      .enemyAbility(Abilities.BALL_FETCH)
      .enemySpecies(Species.MAGIKARP)
      .enemyLevel(30)
      .moveset([Moves.SPLASH, Moves.TACKLE, Moves.GROWL, Moves.METRONOME])
      .ability(Abilities.GORILLA_TACTICS);
  });

  it("boosts the Pokémon's Attack by 50%, but limits the Pokémon to using only one move", async () => {
    await game.classicMode.startBattle([Species.GALAR_DARMANITAN]);

    const darmanitan = game.scene.getPlayerPokemon()!;
    const initialAtkStat = darmanitan.getStat(Stat.ATK);

    game.move.select(Moves.SPLASH);
    await game.move.forceEnemyMove(Moves.SPLASH);
    await game.toEndOfTurn()

    expect(darmanitan.getStat(Stat.ATK, false)).toBeCloseTo(initialAtkStat * 1.5);
    // Other moves should be restricted
    expect(darmanitan.isMoveRestricted(Moves.TACKLE)).toBe(true);
    expect(darmanitan.isMoveRestricted(Moves.SPLASH)).toBe(false);
  });

  it("should struggle if the only usable move is disabled", async () => {
    await game.classicMode.startBattle([Species.GALAR_DARMANITAN]);

    const darmanitan = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    // First turn, lock move to Growl
    game.move.select(Moves.GROWL);
    await game.move.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    // Second turn, Growl is interrupted by Disable
    game.move.select(Moves.GROWL);
    await game.move.forceEnemyMove(Moves.DISABLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();
    
    expect(enemy.getStatStage(Stat.ATK)).toBe(-1); // Only the effect of the first Growl should be applied

    // Third turn, Struggle is used
    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");
    
    expect(darmanitan.hp).toBeLessThan(darmanitan.getMaxHp());
    
    await game.toNextTurn();
    expect(darmanitan.getLastXMoves()[0].move).toBe(Moves.STRUGGLE);
  });

  it("should lock into calling moves, even if also in moveset", async () => {
    vi.spyOn(RandomMoveAttr.prototype, "getMoveOverride").mockReturnValue(Moves.TACKLE);
    await game.classicMode.startBattle([Species.GALAR_DARMANITAN]);

    const darmanitan = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.METRONOME);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Gorilla Tactics should bypass dancer and instruct
    expect(darmanitan.isMoveRestricted(Moves.TACKLE)).toBe(true);
    expect(darmanitan.isMoveRestricted(Moves.METRONOME)).toBe(false);
  });
});
