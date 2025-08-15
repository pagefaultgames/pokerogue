import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonAnimType } from "#enums/pokemon-anim-type";
import { SpeciesId } from "#enums/species-id";
import type { EffectiveStat } from "#enums/stat";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Commander", () => {
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
      .startingLevel(100)
      .enemyLevel(100)
      .moveset([MoveId.LIQUIDATION, MoveId.MEMENTO, MoveId.SPLASH, MoveId.FLIP_TURN])
      .ability(AbilityId.COMMANDER)
      .battleStyle("double")
      .criticalHits(false)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.TACKLE);

    vi.spyOn(game.scene, "triggerPokemonBattleAnim").mockReturnValue(true);
  });

  it("causes the source to jump into Dondozo's mouth, granting a stat boost and hiding the source", async () => {
    await game.classicMode.startBattle([SpeciesId.TATSUGIRI, SpeciesId.DONDOZO]);

    const [tatsugiri, dondozo] = game.scene.getPlayerField();

    const affectedStats: EffectiveStat[] = [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD];

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();
    affectedStats.forEach(stat => expect(dondozo.getStatStage(stat)).toBe(2));

    game.move.select(MoveId.SPLASH, 1);

    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    // Force both enemies to target the Tatsugiri
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);

    await game.phaseInterceptor.to("BerryPhase", false);
    game.scene.getEnemyField().forEach(enemy => expect(enemy.getLastXMoves(1)[0].result).toBe(MoveResult.MISS));
    expect(tatsugiri.isFullHp()).toBeTruthy();
  });

  it("should activate when a Dondozo switches in and cancel the source's move", async () => {
    game.override.enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.TATSUGIRI, SpeciesId.MAGIKARP, SpeciesId.DONDOZO]);

    const tatsugiri = game.scene.getPlayerField()[0];

    game.move.select(MoveId.LIQUIDATION, 0, BattlerIndex.ENEMY);
    game.doSwitchPokemon(2);

    await game.phaseInterceptor.to("MovePhase", false);
    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);

    const dondozo = game.scene.getPlayerField()[1];
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(tatsugiri.getMoveHistory()).toHaveLength(0);
    expect(game.scene.getEnemyField()[0].isFullHp()).toBeTruthy();
  });

  it("source should reenter the field when Dondozo faints", async () => {
    await game.classicMode.startBattle([SpeciesId.TATSUGIRI, SpeciesId.DONDOZO]);

    const [tatsugiri, dondozo] = game.scene.getPlayerField();

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    game.move.select(MoveId.MEMENTO, 1, BattlerIndex.ENEMY);

    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);

    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("FaintPhase", false);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeUndefined();
    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(dondozo, PokemonAnimType.COMMANDER_REMOVE);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(tatsugiri.isFullHp()).toBeFalsy();
  });

  it("source should still take damage from Poison while hidden", async () => {
    game.override.statusEffect(StatusEffect.POISON).enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.TATSUGIRI, SpeciesId.DONDOZO]);

    const [tatsugiri, dondozo] = game.scene.getPlayerField();

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    game.move.select(MoveId.SPLASH, 1);

    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(tatsugiri.isFullHp()).toBeFalsy();
  });

  it("source should still take damage from Salt Cure while hidden", async () => {
    game.override.enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.TATSUGIRI, SpeciesId.DONDOZO]);

    const [tatsugiri, dondozo] = game.scene.getPlayerField();

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    tatsugiri.addTag(BattlerTagType.SALT_CURED, 0, MoveId.NONE, game.scene.getField()[BattlerIndex.ENEMY].id);

    game.move.select(MoveId.SPLASH, 1);

    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(tatsugiri.isFullHp()).toBeFalsy();
  });

  it("source should still take damage from Sandstorm while hidden", async () => {
    game.override.weather(WeatherType.SANDSTORM).enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.TATSUGIRI, SpeciesId.DONDOZO]);

    const [tatsugiri, dondozo] = game.scene.getPlayerField();

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    game.move.select(MoveId.SPLASH, 1);

    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(tatsugiri.isFullHp()).toBeFalsy();
  });

  it("should make Dondozo immune to being forced out", async () => {
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.WHIRLWIND]);

    await game.classicMode.startBattle([SpeciesId.TATSUGIRI, SpeciesId.DONDOZO]);

    const [tatsugiri, dondozo] = game.scene.getPlayerField();

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    game.move.select(MoveId.SPLASH, 1);

    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    await game.move.selectEnemyMove(MoveId.WHIRLWIND, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);

    // Test may time out here if Whirlwind forced out a Pokemon
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(dondozo.isActive(true)).toBeTruthy();
  });

  it("should interrupt the source's semi-invulnerability", async () => {
    game.override.moveset([MoveId.SPLASH, MoveId.DIVE]).enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.TATSUGIRI, SpeciesId.MAGIKARP, SpeciesId.DONDOZO]);

    const tatsugiri = game.scene.getPlayerField()[0];

    game.move.select(MoveId.DIVE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(tatsugiri.getTag(BattlerTagType.UNDERWATER)).toBeDefined();
    game.doSwitchPokemon(2);

    await game.phaseInterceptor.to("MovePhase", false);
    const dondozo = game.scene.getPlayerField()[1];
    expect(tatsugiri.getTag(BattlerTagType.UNDERWATER)).toBeUndefined();
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    await game.toNextTurn();
    const enemy = game.scene.getEnemyField()[0];
    expect(enemy.isFullHp()).toBeTruthy();
  });
});
