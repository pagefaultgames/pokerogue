import { globalScene } from "#app/global-scene";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { Command } from "#enums/command";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import type { CommandPhase } from "#phases/command-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Neutralizing Gas", () => {
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
      .moveset([MoveId.SPLASH])
      .ability(AbilityId.NEUTRALIZING_GAS)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should prevent other abilities from activating", async () => {
    game.override.enemyAbility(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Intimidate is suppressed, so the attack stat should not be lowered
    expect(game.field.getPlayerPokemon().getStatStage(Stat.ATK)).toBe(0);
  });

  it("should allow the user's passive to activate", async () => {
    game.override.passiveAbility(AbilityId.INTREPID_SWORD);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.field.getPlayerPokemon().getStatStage(Stat.ATK)).toBe(1);
  });

  it.todo("should activate before other abilities", async () => {
    game.override.enemySpecies(SpeciesId.ACCELGOR).enemyLevel(100).enemyAbility(AbilityId.INTIMIDATE);

    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Intimidate is suppressed even when the user's speed is lower
    expect(game.field.getPlayerPokemon().getStatStage(Stat.ATK)).toBe(0);
  });

  it("should activate other abilities when removed", async () => {
    game.override
      .enemyAbility(AbilityId.INTREPID_SWORD)
      .enemyPassiveAbility(AbilityId.DAUNTLESS_SHIELD)
      .enemyMoveset(MoveId.ENTRAINMENT);

    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    // Enemy removes user's ability, so both abilities are activated
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(1);
  });

  it("should not activate the user's other ability when removed", async () => {
    game.override.passiveAbility(AbilityId.INTIMIDATE).enemyMoveset(MoveId.ENTRAINMENT);

    await game.classicMode.startBattle([SpeciesId.FEEBAS]);
    // Neutralising gas user's passive is still active
    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    // Intimidate did not reactivate after neutralizing gas was removed
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should only deactivate when all setters are off the field", async () => {
    game.override.enemyMoveset([MoveId.ENTRAINMENT, MoveId.SPLASH]).battleStyle("double");

    await game.classicMode.startBattle([SpeciesId.ACCELGOR, SpeciesId.ACCELGOR]);
    game.move.select(MoveId.SPLASH, 0);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.ENTRAINMENT, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeDefined(); // Now one neut gas user is left

    game.move.select(MoveId.SPLASH, 0);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.ENTRAINMENT, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeUndefined(); // No neut gas users are left
  });

  it("should deactivate when suppressed by gastro acid", async () => {
    game.override.enemyMoveset(MoveId.GASTRO_ACID);

    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeUndefined();
  });

  it("should deactivate when the pokemon faints", async () => {
    game.override.ability(AbilityId.BALL_FETCH).enemyAbility(AbilityId.NEUTRALIZING_GAS);

    await game.classicMode.startBattle([SpeciesId.FEEBAS]);
    game.move.select(MoveId.SPLASH);
    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeDefined();
    await game.doKillOpponents();

    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeUndefined();
  });

  it("should deactivate upon catching a wild pokemon", async () => {
    game.override.battleStyle("single").enemyAbility(AbilityId.NEUTRALIZING_GAS).ability(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeDefined();

    game.scene.pokeballCounts[PokeballType.MASTER_BALL] = 1;
    game.doThrowPokeball(PokeballType.MASTER_BALL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeUndefined();
  });

  it("should deactivate after fleeing from a wild pokemon", async () => {
    game.override.enemyAbility(AbilityId.NEUTRALIZING_GAS).ability(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeDefined();

    vi.spyOn(game.field.getPlayerPokemon(), "randBattleSeedInt").mockReturnValue(0);
    vi.spyOn(globalScene, "randBattleSeedInt").mockReturnValue(0);

    const commandPhase = game.scene.phaseManager.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeUndefined();
  });

  it("should not activate abilities of pokemon no longer on the field", async () => {
    game.override.battleStyle("single").ability(AbilityId.NEUTRALIZING_GAS).enemyAbility(AbilityId.DELTA_STREAM);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemy = game.field.getEnemyPokemon();
    const weatherChangeAttr = enemy.getAbilityAttrs("PostSummonWeatherChangeAbAttr", false)[0];
    const weatherChangeSpy = vi.spyOn(weatherChangeAttr, "apply");

    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeDefined();

    game.move.select(MoveId.SPLASH);
    await game.killPokemon(enemy);
    await game.killPokemon(game.field.getPlayerPokemon());

    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeUndefined();
    expect(weatherChangeSpy).not.toHaveBeenCalled();
  });
});
