import { BattlerTagType } from "#enums/battler-tag-type";
import { StatusEffect } from "#enums/status-effect";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";
import { WeatherType } from "#enums/weather-type";

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
      .moveset(Moves.DIVE)
      .battleStyle("single")
      .startingLevel(100)
      .enemySpecies(Species.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.TACKLE);
  });

  it("should make the user semi-invulnerable, then attack over 2 turns", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DIVE);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.UNDERWATER)).toBeDefined();
    expect(enemyPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.MISS);
    expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveQueue()[0].move).toBe(Moves.DIVE);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.UNDERWATER)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveHistory()).toHaveLength(2);

    const playerDive = playerPokemon.getMoveset().find(mv => mv && mv.moveId === Moves.DIVE);
    expect(playerDive?.ppUsed).toBe(1);
  });

  it("should not allow the user to evade attacks from Pokemon with No Guard", async () => {
    game.override.enemyAbility(Abilities.NO_GUARD);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DIVE);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
    expect(enemyPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should not expend PP when the attack phase is cancelled", async () => {
    game.override.enemyAbility(Abilities.NO_GUARD).enemyMoveset(Moves.SPORE);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.DIVE);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.UNDERWATER)).toBeUndefined();
    expect(playerPokemon.status?.effect).toBe(StatusEffect.SLEEP);

    const playerDive = playerPokemon.getMoveset().find(mv => mv && mv.moveId === Moves.DIVE);
    expect(playerDive?.ppUsed).toBe(0);
  });

  it("should trigger on-contact post-defend ability effects", async () => {
    game.override.enemyAbility(Abilities.ROUGH_SKIN).enemyMoveset(Moves.SPLASH);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DIVE);

    await game.phaseInterceptor.to("TurnEndPhase");

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
    expect(enemyPokemon.battleData.abilitiesApplied[0]).toBe(Abilities.ROUGH_SKIN);
  });

  it("should cancel attack after Harsh Sunlight is set", async () => {
    game.override.enemyMoveset(Moves.SPLASH);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DIVE);

    await game.phaseInterceptor.to("TurnEndPhase");
    await game.phaseInterceptor.to("TurnStartPhase", false);
    game.scene.arena.trySetWeather(WeatherType.HARSH_SUN);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(playerPokemon.getTag(BattlerTagType.UNDERWATER)).toBeUndefined();

    const playerDive = playerPokemon.getMoveset().find(mv => mv && mv.moveId === Moves.DIVE);
    expect(playerDive?.ppUsed).toBe(1);
  });
});
