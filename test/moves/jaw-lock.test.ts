import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { BerryPhase } from "#phases/berry-phase";
import { FaintPhase } from "#phases/faint-phase";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Jaw Lock", () => {
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
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset(MoveId.SPLASH)
      .moveset([MoveId.JAW_LOCK, MoveId.SPLASH])
      .startingLevel(100)
      .enemyLevel(100)
      .criticalHits(false);
  });

  it("should trap the move's user and target", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.JAW_LOCK);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined();
    expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined();
  });

  it("should not trap either pokemon if the target faints", async () => {
    game.override.enemyLevel(1);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.JAW_LOCK);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();

    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();

    await game.phaseInterceptor.to(FaintPhase);

    expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
  });

  it("should only trap the user until the target faints", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.JAW_LOCK);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined();
    expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined();

    await game.phaseInterceptor.to(TurnEndPhase);

    await game.doKillOpponents();

    expect(leadPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
  });

  it("should not trap other targets after the first target is trapped", async () => {
    game.override.battleStyle("double");

    await game.classicMode.startBattle([SpeciesId.CHARMANDER, SpeciesId.BULBASAUR]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.JAW_LOCK, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(playerPokemon[0].getTag(BattlerTagType.TRAPPED)).toBeDefined();
    expect(enemyPokemon[0].getTag(BattlerTagType.TRAPPED)).toBeDefined();

    await game.toNextTurn();

    game.move.select(MoveId.JAW_LOCK, 0, BattlerIndex.ENEMY_2);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(enemyPokemon[1].getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    expect(playerPokemon[0].getTag(BattlerTagType.TRAPPED)).toBeDefined();
    expect(playerPokemon[0].getTag(BattlerTagType.TRAPPED)?.sourceId).toBe(enemyPokemon[0].id);
  });

  it("should not trap either pokemon if the target is protected", async () => {
    game.override.enemyMoveset([MoveId.PROTECT]);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.JAW_LOCK);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(playerPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
  });
});
