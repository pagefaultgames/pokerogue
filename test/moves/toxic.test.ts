import { allMoves } from "#data/data-lists";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Toxic", () => {
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
      .moveset(MoveId.TOXIC)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should be guaranteed to hit if user is Poison-type", async () => {
    vi.spyOn(allMoves[MoveId.TOXIC], "accuracy", "get").mockReturnValue(0);
    await game.classicMode.startBattle([SpeciesId.TOXAPEX]);

    game.move.select(MoveId.TOXIC);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(game.field.getEnemyPokemon().status?.effect).toBe(StatusEffect.TOXIC);
  });

  it("may miss if user is not Poison-type", async () => {
    vi.spyOn(allMoves[MoveId.TOXIC], "accuracy", "get").mockReturnValue(0);
    await game.classicMode.startBattle([SpeciesId.UMBREON]);

    game.move.select(MoveId.TOXIC);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(game.field.getEnemyPokemon().status).toBeUndefined();
  });

  it("should hit semi-invulnerable targets if user is Poison-type", async () => {
    vi.spyOn(allMoves[MoveId.TOXIC], "accuracy", "get").mockReturnValue(0);
    game.override.enemyMoveset(MoveId.FLY);
    await game.classicMode.startBattle([SpeciesId.TOXAPEX]);

    game.move.select(MoveId.TOXIC);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(game.field.getEnemyPokemon().status?.effect).toBe(StatusEffect.TOXIC);
  });

  it("should miss semi-invulnerable targets if user is not Poison-type", async () => {
    vi.spyOn(allMoves[MoveId.TOXIC], "accuracy", "get").mockReturnValue(-1);
    game.override.enemyMoveset(MoveId.FLY);
    await game.classicMode.startBattle([SpeciesId.UMBREON]);

    game.move.select(MoveId.TOXIC);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(game.field.getEnemyPokemon().status).toBeUndefined();
  });

  it("moves other than Toxic should not hit semi-invulnerable targets even if user is Poison-type", async () => {
    game.override.moveset(MoveId.SWIFT).enemyMoveset(MoveId.FLY);
    await game.classicMode.startBattle([SpeciesId.TOXAPEX]);

    game.move.select(MoveId.SWIFT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase", false);

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
  });
});
