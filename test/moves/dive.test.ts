import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Dive", () => {
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
      .moveset(MoveId.DIVE)
      .battleStyle("single")
      .startingLevel(100)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.TACKLE);
  });

  it("should make the user semi-invulnerable, then attack over 2 turns", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.DIVE);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.UNDERWATER)).toBeDefined();
    expect(enemyPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.MISS);
    expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveQueue()[0].move).toBe(MoveId.DIVE);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.UNDERWATER)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveHistory()).toHaveLength(2);

    const playerDive = playerPokemon.getMoveset().find(mv => mv && mv.moveId === MoveId.DIVE);
    expect(playerDive?.ppUsed).toBe(1);
  });

  it("should not allow the user to evade attacks from Pokemon with No Guard", async () => {
    game.override.enemyAbility(AbilityId.NO_GUARD);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.DIVE);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
    expect(enemyPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should not expend PP when the attack phase is cancelled", async () => {
    game.override.enemyAbility(AbilityId.NO_GUARD).enemyMoveset(MoveId.SPORE);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.DIVE);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.UNDERWATER)).toBeUndefined();
    expect(playerPokemon.status?.effect).toBe(StatusEffect.SLEEP);

    const playerDive = playerPokemon.getMoveset().find(mv => mv && mv.moveId === MoveId.DIVE);
    expect(playerDive?.ppUsed).toBe(0);
  });

  it("should trigger on-contact post-defend ability effects", async () => {
    game.override.enemyAbility(AbilityId.ROUGH_SKIN).enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.DIVE);

    await game.phaseInterceptor.to("TurnEndPhase");

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
    expect(enemyPokemon.waveData.abilitiesApplied).toContain(AbilityId.ROUGH_SKIN);
  });

  it("should cancel attack after Harsh Sunlight is set", async () => {
    game.override.enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.DIVE);

    await game.phaseInterceptor.to("TurnEndPhase");
    await game.phaseInterceptor.to("TurnStartPhase", false);
    game.scene.arena.trySetWeather(WeatherType.HARSH_SUN);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(playerPokemon.getTag(BattlerTagType.UNDERWATER)).toBeUndefined();

    const playerDive = playerPokemon.getMoveset().find(mv => mv && mv.moveId === MoveId.DIVE);
    expect(playerDive?.ppUsed).toBe(1);
  });
});
