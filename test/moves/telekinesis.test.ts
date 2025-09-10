import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Telekinesis", () => {
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
      .moveset([MoveId.TELEKINESIS, MoveId.TACKLE, MoveId.MUD_SHOT, MoveId.SMACK_DOWN])
      .battleStyle("single")
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(60)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH]);
  });

  it("Telekinesis makes the affected vulnerable to most attacking moves regardless of accuracy", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemyOpponent = game.field.getEnemyPokemon();

    game.move.select(MoveId.TELEKINESIS);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent.getTag(BattlerTagType.FLOATING)).toBeDefined();

    await game.toNextTurn();
    vi.spyOn(allMoves[MoveId.TACKLE], "accuracy", "get").mockReturnValue(0);
    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent.isFullHp()).toBe(false);
  });

  it("Telekinesis makes the affected airborne and immune to most Ground-moves", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemyOpponent = game.field.getEnemyPokemon();

    game.move.select(MoveId.TELEKINESIS);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent.getTag(BattlerTagType.FLOATING)).toBeDefined();

    await game.toNextTurn();
    vi.spyOn(allMoves[MoveId.MUD_SHOT], "accuracy", "get").mockReturnValue(100);
    game.move.select(MoveId.MUD_SHOT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent.isFullHp()).toBe(true);
  });

  it("Telekinesis can still affect Pokemon that have been transformed into invalid Pokemon", async () => {
    game.override.enemyMoveset(MoveId.TRANSFORM);
    await game.classicMode.startBattle([SpeciesId.DIGLETT]);

    const enemyOpponent = game.field.getEnemyPokemon();

    game.move.select(MoveId.TELEKINESIS);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent.getTag(BattlerTagType.FLOATING)).toBeDefined();
    expect(enemyOpponent.summonData.speciesForm?.speciesId).toBe(SpeciesId.DIGLETT);
  });

  it("Moves like Smack Down and 1000 Arrows remove all effects of Telekinesis from the target Pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemyOpponent = game.field.getEnemyPokemon();

    game.move.select(MoveId.TELEKINESIS);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent.getTag(BattlerTagType.FLOATING)).toBeDefined();

    await game.toNextTurn();
    game.move.select(MoveId.SMACK_DOWN);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent.getTag(BattlerTagType.TELEKINESIS)).toBeUndefined();
    expect(enemyOpponent.getTag(BattlerTagType.FLOATING)).toBeUndefined();
  });

  it("Ingrain will remove the floating effect of Telekinesis, but not the 100% hit", async () => {
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.INGRAIN]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyOpponent = game.field.getEnemyPokemon();

    game.move.select(MoveId.TELEKINESIS);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent.getTag(BattlerTagType.FLOATING)).toBeDefined();

    await game.toNextTurn();
    vi.spyOn(allMoves[MoveId.MUD_SHOT], "accuracy", "get").mockReturnValue(0);
    game.move.select(MoveId.MUD_SHOT);
    await game.move.selectEnemyMove(MoveId.INGRAIN);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent.getTag(BattlerTagType.INGRAIN)).toBeDefined();
    expect(enemyOpponent.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(enemyOpponent.getTag(BattlerTagType.FLOATING)).toBeUndefined();
    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should not be baton passed onto a mega gengar", async () => {
    game.override
      .moveset([MoveId.BATON_PASS])
      .enemyMoveset([MoveId.TELEKINESIS])
      .starterForms({ [SpeciesId.GENGAR]: 1 });

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.GENGAR]);
    game.move.select(MoveId.BATON_PASS);
    game.doSelectPartyPokemon(1);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.field.getPlayerPokemon().getTag(BattlerTagType.TELEKINESIS)).toBeUndefined();
  });
});
