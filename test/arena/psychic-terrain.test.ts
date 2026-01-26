import { allMoves } from "#data/data-lists";
import { TerrainType } from "#data/terrain";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Arena - Psychic Terrain", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .enemyLevel(10)
      .enemySpecies(SpeciesId.ELECTRODE)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.BALL_FETCH)
      .passiveAbility(AbilityId.NO_GUARD);
  });

  it("blocks increased priority moves", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    game.move.use(MoveId.QUICK_ATTACK);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move: MoveId.QUICK_ATTACK, result: MoveResult.FAIL });
    expect(game.field.getEnemyPokemon()).toHaveFullHp();
  });

  it("blocks single-target status moves that have their priority boosted by Prankster", async () => {
    game.override.ability(AbilityId.PRANKSTER);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    game.move.use(MoveId.CHARM);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move: MoveId.CHARM, result: MoveResult.FAIL });
    expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.ATK, 0);
  });

  it("does not block spread-target status moves that have their priority boosted with Prankster", async () => {
    game.override.ability(AbilityId.PRANKSTER);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    game.move.use(MoveId.DARK_VOID);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move: MoveId.DARK_VOID, result: MoveResult.SUCCESS });
    expect(game.field.getEnemyPokemon()).toHaveStatusEffect(StatusEffect.SLEEP);
  });

  it("does not block arena-target status moves that have their priority boosted with Prankster", async () => {
    game.override.ability(AbilityId.PRANKSTER);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    game.move.use(MoveId.RAIN_DANCE);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move: MoveId.RAIN_DANCE, result: MoveResult.SUCCESS });
    expect(game).toHaveWeather(WeatherType.RAIN);
  });

  it("should not block non-priority moves boosted by Quick Claw", async () => {
    game.override.startingHeldItems([{ name: "QUICK_CLAW", count: 10 }]);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

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
    expect(feebas).toHaveUsedMove({ move: MoveId.POUND, result: MoveResult.SUCCESS });
  });

  it("should block priority moves boosted by Quick Claw", async () => {
    game.override.startingHeldItems([{ name: "QUICK_CLAW", count: 10 }]);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

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
    expect(feebas).toHaveUsedMove({ move: MoveId.QUICK_ATTACK, result: MoveResult.FAIL });
  });
});
