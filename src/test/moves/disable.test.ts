import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import GameManager from "../utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { MoveResult } from "#app/field/pokemon.js";
import { SPLASH_ONLY } from "../utils/testUtils";
import { CommandPhase } from "#app/phases/command-phase.js";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase.js";
import { TurnInitPhase } from "#app/phases/turn-init-phase.js";

describe("Moves - Disable", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    game.override.battleType("single");
    game.override.ability(Abilities.NONE);
    game.override.enemyAbility(Abilities.NONE);
    game.override.moveset([Moves.DISABLE, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.starterSpecies(Species.PIKACHU);
    game.override.enemySpecies(Species.SHUCKLE);
  });

  it("restricts moves", async () => {
    await game.classicMode.startBattle();
    const playerMon = game.scene.getPlayerPokemon()!;
    const enemyMon = game.scene.getEnemyPokemon()!;

    vi.spyOn(playerMon, "stats", "get").mockReturnValue([1, 1, 1, 1, 1, 1]);
    vi.spyOn(enemyMon, "stats", "get").mockReturnValue([1, 1, 1, 1, 1, 2]);

    game.move.select(Moves.DISABLE);
    await game.phaseInterceptor.to(CommandPhase);

    expect(playerMon.getMoveHistory()).toHaveLength(1);
    expect(enemyMon.getMoveHistory()).toHaveLength(1);
    expect(playerMon.getMoveHistory()[0]).toMatchObject({ move: Moves.DISABLE, result: MoveResult.SUCCESS });
    expect(enemyMon.isMoveRestricted(Moves.SPLASH)).toBe(true);
  });

  it("fails if enemy has no move history", async() => {
    await game.classicMode.startBattle();
    const playerMon = game.scene.getPlayerPokemon()!;
    const enemyMon = game.scene.getEnemyPokemon()!;

    vi.spyOn(playerMon, "stats", "get").mockReturnValue([1, 1, 1, 1, 1, 2]);
    vi.spyOn(enemyMon, "stats", "get").mockReturnValue([1, 1, 1, 1, 1, 1]);

    game.move.select(Moves.DISABLE);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnInitPhase);

    expect(playerMon.getMoveHistory()).toHaveLength(1);
    expect(playerMon.getMoveHistory()[0]).toMatchObject({ move: Moves.DISABLE, result: MoveResult.FAIL });
  }, 20000);

  it("causes STRUGGLE if all usable moves are disabled", async() => {
    await game.classicMode.startBattle();
    const playerMon = game.scene.getPlayerPokemon()!;
    const enemyMon = game.scene.getEnemyPokemon()!;

    vi.spyOn(playerMon, "stats", "get").mockReturnValue([1, 1, 1, 1, 1, 1]);
    vi.spyOn(enemyMon, "stats", "get").mockReturnValue([1, 1, 1, 1, 1, 2]);

    // Enemy will use SPLASH, we will disable it
    game.move.select(Moves.DISABLE);
    await game.phaseInterceptor.to(CommandPhase);

    // Enemy will use STRUGGLE
    game.move.select(Moves.DISABLE);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(CommandPhase);

    const enemyHistory = enemyMon.getMoveHistory();
    expect(enemyHistory).toHaveLength(2);
    expect(enemyHistory[0].move).toBe(Moves.SPLASH);
    expect(enemyHistory[1].move).toBe(Moves.STRUGGLE);
  }, 20000);

  it("cannot disable STRUGGLE", async() => {
    game.override.enemyMoveset(Array(4).fill(Moves.STRUGGLE));
    await game.classicMode.startBattle();
    const playerMon = game.scene.getPlayerPokemon()!;
    const enemyMon = game.scene.getEnemyPokemon()!;

    vi.spyOn(playerMon, "stats", "get").mockReturnValue([1, 1, 1, 1, 1, 1]);
    vi.spyOn(enemyMon, "stats", "get").mockReturnValue([1, 1, 1, 1, 1, 2]);

    game.move.select(Moves.DISABLE);
    await game.phaseInterceptor.to(CommandPhase);

    expect(playerMon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(enemyMon.getLastXMoves()[0].move).toBe(Moves.STRUGGLE);
    expect(enemyMon.isMoveRestricted(Moves.STRUGGLE)).toBe(false);
  }, 20000);

  it("interrupts target's move when target moves after", async() => {
    await game.classicMode.startBattle();
    const playerMon = game.scene.getPlayerPokemon()!;
    const enemyMon = game.scene.getEnemyPokemon()!;

    vi.spyOn(playerMon, "stats", "get").mockReturnValue([1, 1, 1, 1, 1, 2]);
    vi.spyOn(enemyMon, "stats", "get").mockReturnValue([1, 1, 1, 1, 1, 1]);

    // Waste a turn to let the target make move history
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(CommandPhase);

    // Both mons just used Splash last turn; now have player use Disable.
    game.move.select(Moves.DISABLE);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(CommandPhase);

    const enemyHistory = enemyMon.getMoveHistory();
    expect(enemyHistory).toHaveLength(2);
    expect(enemyHistory[0]).toMatchObject({ move: Moves.SPLASH, result: MoveResult.SUCCESS });
    expect(enemyHistory[1].result).toBe(MoveResult.FAIL);
  }, 20000);

  it("disables NATURE POWER, not the move invoked by it", async() => {
    await game.classicMode.startBattle();
    const playerMon = game.scene.getPlayerPokemon()!;
    const enemyMon = game.scene.getEnemyPokemon()!;

    game.override.moveset(Array(4).fill(Moves.DISABLE));
    game.override.enemyMoveset(Array(4).fill(Moves.NATURE_POWER));

    vi.spyOn(playerMon, "stats", "get").mockReturnValue([1, 1, 1, 1, 1, 1]);
    vi.spyOn(enemyMon, "stats", "get").mockReturnValue([1, 1, 1, 1, 1, 2]);

    game.move.select(Moves.DISABLE);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(CommandPhase);

    expect(enemyMon.isMoveRestricted(Moves.NATURE_POWER)).toBe(true);
    expect(enemyMon.isMoveRestricted(enemyMon.getLastXMoves(2)[1].move)).toBe(false);
  }, 20000);
});
