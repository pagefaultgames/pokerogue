import { BattlerIndex } from "#app/battle";
import { BattlerTagType } from "#enums/battler-tag-type";
import { PokemonAnimType } from "#enums/pokemon-anim-type";
import { EffectiveStat, Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
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
      .moveset([ Moves.LIQUIDATION, Moves.MEMENTO, Moves.SPLASH, Moves.FLIP_TURN ])
      .ability(Abilities.COMMANDER)
      .battleType("double")
      .disableCrits()
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.TACKLE);

    vi.spyOn(game.scene, "triggerPokemonBattleAnim").mockReturnValue(true);
  });

  it("causes the source to jump into Dondozo's mouth, granting a stat boost and hiding the source", async () => {
    await game.classicMode.startBattle([ Species.TATSUGIRI, Species.DONDOZO ]);

    const [ tatsugiri, dondozo ] = game.scene.getPlayerField();

    const affectedStats: EffectiveStat[] = [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ];

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();
    affectedStats.forEach((stat) => expect(dondozo.getStatStage(stat)).toBe(2));

    game.move.select(Moves.SPLASH, 1);

    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    // Force both enemies to target the Tatsugiri
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);

    await game.phaseInterceptor.to("BerryPhase", false);
    game.scene.getEnemyField().forEach(enemy => expect(enemy.getLastXMoves(1)[0].result).toBe(MoveResult.MISS));
    expect(tatsugiri.isFullHp()).toBeTruthy();
  });

  it("should activate when a Dondozo switches in and cancel the source's move", async () => {
    game.override.enemyMoveset(Moves.SPLASH);

    await game.classicMode.startBattle([ Species.TATSUGIRI, Species.MAGIKARP, Species.DONDOZO ]);

    const tatsugiri = game.scene.getPlayerField()[0];

    game.move.select(Moves.LIQUIDATION, 0, BattlerIndex.ENEMY);
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
    await game.classicMode.startBattle([ Species.TATSUGIRI, Species.DONDOZO ]);

    const [ tatsugiri, dondozo ] = game.scene.getPlayerField();

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    game.move.select(Moves.MEMENTO, 1, BattlerIndex.ENEMY);

    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);

    await game.setTurnOrder([ BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER ]);

    await game.phaseInterceptor.to("FaintPhase", false);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeUndefined();
    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(dondozo, PokemonAnimType.COMMANDER_REMOVE);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(tatsugiri.isFullHp()).toBeFalsy();
  });

  it("source should still take damage from Poison while hidden", async () => {
    game.override
      .statusEffect(StatusEffect.POISON)
      .enemyMoveset(Moves.SPLASH);

    await game.classicMode.startBattle([ Species.TATSUGIRI, Species.DONDOZO ]);

    const [ tatsugiri, dondozo ] = game.scene.getPlayerField();

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    game.move.select(Moves.SPLASH, 1);

    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(tatsugiri.isFullHp()).toBeFalsy();
  });

  it("source should still take damage from Salt Cure while hidden", async () => {
    game.override.enemyMoveset(Moves.SPLASH);

    await game.classicMode.startBattle([ Species.TATSUGIRI, Species.DONDOZO ]);

    const [ tatsugiri, dondozo ] = game.scene.getPlayerField();

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    tatsugiri.addTag(BattlerTagType.SALT_CURED, 0, Moves.NONE, game.scene.getField()[BattlerIndex.ENEMY].id);

    game.move.select(Moves.SPLASH, 1);

    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(tatsugiri.isFullHp()).toBeFalsy();
  });

  it("source should still take damage from Sandstorm while hidden", async () => {
    game.override
      .weather(WeatherType.SANDSTORM)
      .enemyMoveset(Moves.SPLASH);

    await game.classicMode.startBattle([ Species.TATSUGIRI, Species.DONDOZO ]);

    const [ tatsugiri, dondozo ] = game.scene.getPlayerField();

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    game.move.select(Moves.SPLASH, 1);

    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(tatsugiri.isFullHp()).toBeFalsy();
  });

  it("should make Dondozo immune to being forced out", async () => {
    game.override.enemyMoveset([ Moves.SPLASH, Moves.WHIRLWIND ]);

    await game.classicMode.startBattle([ Species.TATSUGIRI, Species.DONDOZO ]);

    const [ tatsugiri, dondozo ] = game.scene.getPlayerField();

    expect(game.scene.triggerPokemonBattleAnim).toHaveBeenLastCalledWith(tatsugiri, PokemonAnimType.COMMANDER_APPLY);
    expect(dondozo.getTag(BattlerTagType.COMMANDED)).toBeDefined();

    game.move.select(Moves.SPLASH, 1);

    expect(game.scene.currentBattle.turnCommands[0]?.skip).toBeTruthy();

    await game.forceEnemyMove(Moves.WHIRLWIND, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);

    // Test may time out here if Whirlwind forced out a Pokemon
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(dondozo.isActive(true)).toBeTruthy();
  });

  it("should interrupt the source's semi-invulnerability", async () => {
    game.override
      .moveset([ Moves.SPLASH, Moves.DIVE ])
      .enemyMoveset(Moves.SPLASH);

    await game.classicMode.startBattle([ Species.TATSUGIRI, Species.MAGIKARP, Species.DONDOZO ]);

    const tatsugiri = game.scene.getPlayerField()[0];

    game.move.select(Moves.DIVE, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("CommandPhase");
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
