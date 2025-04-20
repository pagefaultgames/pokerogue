import { BattlerIndex } from "#app/battle";
import type { CommandPhase } from "#app/phases/command-phase";
import { Command } from "#app/ui/command-ui-handler";
import { PostSummonWeatherChangeAbAttr } from "#app/data/abilities/ability";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Moves } from "#enums/moves";
import { PokeballType } from "#enums/pokeball";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset([Moves.SPLASH])
      .ability(Abilities.NEUTRALIZING_GAS)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should prevent other abilities from activating", async () => {
    game.override.enemyAbility(Abilities.INTIMIDATE);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Intimidate is suppressed, so the attack stat should not be lowered
    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should allow the user's passive to activate", async () => {
    game.override.passiveAbility(Abilities.INTREPID_SWORD);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.ATK)).toBe(1);
  });

  it.todo("should activate before other abilities", async () => {
    game.override.enemySpecies(Species.ACCELGOR).enemyLevel(100).enemyAbility(Abilities.INTIMIDATE);

    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Intimidate is suppressed even when the user's speed is lower
    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should activate other abilities when removed", async () => {
    game.override
      .enemyAbility(Abilities.INTREPID_SWORD)
      .enemyPassiveAbility(Abilities.DAUNTLESS_SHIELD)
      .enemyMoveset(Moves.ENTRAINMENT);

    await game.classicMode.startBattle([Species.FEEBAS]);

    const enemyPokemon = game.scene.getEnemyPokemon();
    expect(enemyPokemon?.getStatStage(Stat.ATK)).toBe(0);
    expect(enemyPokemon?.getStatStage(Stat.DEF)).toBe(0);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    // Enemy removes user's ability, so both abilities are activated
    expect(enemyPokemon?.getStatStage(Stat.ATK)).toBe(1);
    expect(enemyPokemon?.getStatStage(Stat.DEF)).toBe(1);
  });

  it("should not activate the user's other ability when removed", async () => {
    game.override.passiveAbility(Abilities.INTIMIDATE).enemyMoveset(Moves.ENTRAINMENT);

    await game.classicMode.startBattle([Species.FEEBAS]);
    // Neutralising gas user's passive is still active
    const enemyPokemon = game.scene.getEnemyPokemon();
    expect(enemyPokemon?.getStatStage(Stat.ATK)).toBe(-1);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    // Intimidate did not reactivate after neutralizing gas was removed
    expect(enemyPokemon?.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should only deactivate when all setters are off the field", async () => {
    game.override.enemyMoveset([Moves.ENTRAINMENT, Moves.SPLASH]).battleStyle("double");

    await game.classicMode.startBattle([Species.ACCELGOR, Species.ACCELGOR]);
    game.move.select(Moves.SPLASH, 0);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.ENTRAINMENT, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeDefined(); // Now one neut gas user is left

    game.move.select(Moves.SPLASH, 0);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.ENTRAINMENT, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeUndefined(); // No neut gas users are left
  });

  it("should deactivate when suppressed by gastro acid", async () => {
    game.override.enemyMoveset(Moves.GASTRO_ACID);

    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeUndefined();
  });

  it("should deactivate when the pokemon faints", async () => {
    game.override.ability(Abilities.BALL_FETCH).enemyAbility(Abilities.NEUTRALIZING_GAS);

    await game.classicMode.startBattle([Species.FEEBAS]);
    game.move.select(Moves.SPLASH);
    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeDefined();
    await game.doKillOpponents();

    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeUndefined();
  });

  it("should deactivate upon catching a wild pokemon", async () => {
    game.override.battleStyle("single").enemyAbility(Abilities.NEUTRALIZING_GAS).ability(Abilities.BALL_FETCH);
    await game.classicMode.startBattle([Species.MAGIKARP]);
    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeDefined();

    game.scene.pokeballCounts[PokeballType.MASTER_BALL] = 1;
    game.doThrowPokeball(PokeballType.MASTER_BALL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeUndefined();
  });

  it("should deactivate after fleeing from a wild pokemon", async () => {
    game.override.enemyAbility(Abilities.NEUTRALIZING_GAS).ability(Abilities.BALL_FETCH);
    await game.classicMode.startBattle([Species.MAGIKARP]);
    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeDefined();

    vi.spyOn(game.scene.getPlayerPokemon()!, "randSeedInt").mockReturnValue(0);

    const commandPhase = game.scene.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeUndefined();
  });

  it("should not activate abilities of pokemon no longer on the field", async () => {
    game.override.battleStyle("single").ability(Abilities.NEUTRALIZING_GAS).enemyAbility(Abilities.DELTA_STREAM);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const enemy = game.scene.getEnemyPokemon()!;
    const weatherChangeAttr = enemy.getAbilityAttrs(PostSummonWeatherChangeAbAttr, false)[0];
    vi.spyOn(weatherChangeAttr, "applyPostSummon");

    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeDefined();

    game.move.select(Moves.SPLASH);
    await game.killPokemon(enemy);
    await game.killPokemon(game.scene.getPlayerPokemon()!);

    expect(game.scene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS)).toBeUndefined();
    expect(weatherChangeAttr.applyPostSummon).not.toHaveBeenCalled();
  });
});
