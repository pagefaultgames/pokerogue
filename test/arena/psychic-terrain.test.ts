import { allMoves } from "#data/data-lists";
import { TerrainType } from "#data/terrain";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Arena - Psychic Terrain", () => {
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
      .enemyLevel(1)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH)
      .moveset([MoveId.PSYCHIC_TERRAIN, MoveId.RAIN_DANCE, MoveId.DARK_VOID])
      .ability(AbilityId.NO_GUARD);
  });

  it("Dark Void with Prankster is not blocked", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    game.move.select(MoveId.DARK_VOID);
    await game.toEndOfTurn();

    expect(game.field.getEnemyPokemon().status?.effect).toBe(StatusEffect.SLEEP);
  });

  it("Rain Dance with Prankster is not blocked", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    game.move.select(MoveId.RAIN_DANCE);
    await game.toEndOfTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.RAIN);
  });

  it("should not block non-priority moves boosted by Quick Claw", async () => {
    game.override.startingHeldItems([{ name: "QUICK_CLAW", count: 10 }]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    expect(game).toHaveTerrain(TerrainType.PSYCHIC);

    game.move.use(MoveId.POUND);
    await game.phaseInterceptor.to("MovePhase", false);

    const feebas = game.field.getPlayerPokemon();
    expect(allMoves[MoveId.POUND].getPriority(feebas)).toBe(0);

    await game.toEndOfTurn();

    const shuckle = game.field.getEnemyPokemon();
    expect(shuckle).not.toHaveFullHp();
  });

  it("should block priority moves boosted by Quick Claw", async () => {
    game.override.startingHeldItems([{ name: "QUICK_CLAW", count: 10 }]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    expect(game).toHaveTerrain(TerrainType.PSYCHIC);

    game.move.use(MoveId.QUICK_ATTACK);
    await game.phaseInterceptor.to("MovePhase", false);

    const feebas = game.field.getPlayerPokemon();
    expect(allMoves[MoveId.QUICK_ATTACK].getPriority(feebas)).toBe(1);

    await game.toEndOfTurn();

    const shuckle = game.field.getEnemyPokemon();
    expect(shuckle).toHaveFullHp();
  });
});
