import { allAbilities, allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Flower Veil", () => {
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
      .enemySpecies(SpeciesId.BULBASAUR)
      .ability(AbilityId.FLOWER_VEIL)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  /***********************************************
   * Tests for proper handling of status effects *
   ***********************************************/
  it("should not prevent any source of self-inflicted status conditions", async () => {
    game.override
      .enemyMoveset([MoveId.TACKLE, MoveId.SPLASH])
      .moveset([MoveId.REST, MoveId.SPLASH])
      .startingHeldItems([{ name: "FLAME_ORB" }]);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    const user = game.field.getPlayerPokemon();
    game.move.select(MoveId.REST);
    await game.move.selectEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();
    expect(user.status?.effect).toBe(StatusEffect.SLEEP);

    // remove sleep status so we can get burn from the orb
    user.resetStatus();
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();
    expect(user.status?.effect).toBe(StatusEffect.BURN);
  });

  it("should prevent drowsiness from yawn for a grass user and its grass allies", async () => {
    game.override.enemyMoveset([MoveId.YAWN]).moveset([MoveId.SPLASH]).battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.BULBASAUR]);

    // Clear the ability of the ally to isolate the test
    const ally = game.scene.getPlayerField()[1]!;
    vi.spyOn(ally, "getAbility").mockReturnValue(allAbilities[AbilityId.BALL_FETCH]);
    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.YAWN, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.YAWN, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("BerryPhase");
    const user = game.field.getPlayerPokemon();
    expect(user.getTag(BattlerTagType.DROWSY)).toBeFalsy();
    expect(ally.getTag(BattlerTagType.DROWSY)).toBeFalsy();
  });

  it("should prevent status conditions from moves like Thunder Wave for a grass user and its grass allies", async () => {
    game.override.enemyMoveset([MoveId.THUNDER_WAVE]).moveset([MoveId.SPLASH]).battleStyle("double");
    vi.spyOn(allMoves[MoveId.THUNDER_WAVE], "accuracy", "get").mockReturnValue(100);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.THUNDER_WAVE);
    await game.toNextTurn();
    expect(game.field.getPlayerPokemon().status).toBeUndefined();
  });

  it("should not prevent status conditions for a non-grass user and its non-grass allies", async () => {
    game.override.enemyMoveset([MoveId.THUNDER_WAVE]).moveset([MoveId.SPLASH]).battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);
    const [user, ally] = game.scene.getPlayerField();
    vi.spyOn(allMoves[MoveId.THUNDER_WAVE], "accuracy", "get").mockReturnValue(100);
    // Clear the ally ability to isolate the test
    vi.spyOn(ally, "getAbility").mockReturnValue(allAbilities[AbilityId.BALL_FETCH]);
    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.THUNDER_WAVE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.THUNDER_WAVE, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");
    expect(user.status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(ally.status?.effect).toBe(StatusEffect.PARALYSIS);
  });

  /*******************************************
   * Tests for proper handling of stat drops *
   *******************************************/

  it("should prevent the status drops from enemies for the a grass user and its grass allies", async () => {
    game.override.enemyMoveset([MoveId.GROWL]).moveset([MoveId.SPLASH]).battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.BULBASAUR]);
    const [user, ally] = game.scene.getPlayerField();
    // Clear the ally ability to isolate the test
    vi.spyOn(ally, "getAbility").mockReturnValue(allAbilities[AbilityId.BALL_FETCH]);
    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    expect(user.getStatStage(Stat.ATK)).toBe(0);
    expect(ally.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not prevent status drops for a non-grass user and its non-grass allies", async () => {
    game.override.enemyMoveset([MoveId.GROWL]).moveset([MoveId.SPLASH]).battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);
    const [user, ally] = game.scene.getPlayerField();
    // Clear the ally ability to isolate the test
    vi.spyOn(ally, "getAbility").mockReturnValue(allAbilities[AbilityId.BALL_FETCH]);
    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    expect(user.getStatStage(Stat.ATK)).toBe(-2);
    expect(ally.getStatStage(Stat.ATK)).toBe(-2);
  });

  it("should not prevent self-inflicted stat drops from moves like Close Combat for a user or its allies", async () => {
    game.override.moveset([MoveId.CLOSE_COMBAT]).battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.BULBASAUR]);
    const [user, ally] = game.scene.getPlayerField();
    // Clear the ally ability to isolate the test
    vi.spyOn(ally, "getAbility").mockReturnValue(allAbilities[AbilityId.BALL_FETCH]);

    game.move.select(MoveId.CLOSE_COMBAT, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.CLOSE_COMBAT, 1, BattlerIndex.ENEMY_2);
    await game.phaseInterceptor.to("BerryPhase");
    expect(user.getStatStage(Stat.DEF)).toBe(-1);
    expect(user.getStatStage(Stat.SPDEF)).toBe(-1);
    expect(ally.getStatStage(Stat.DEF)).toBe(-1);
    expect(ally.getStatStage(Stat.SPDEF)).toBe(-1);
  });

  it("should prevent the drops while retaining the boosts from spicy extract", async () => {
    game.override.enemyMoveset([MoveId.SPICY_EXTRACT]).moveset([MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    const user = game.field.getPlayerPokemon();
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    expect(user.getStatStage(Stat.ATK)).toBe(2);
    expect(user.getStatStage(Stat.DEF)).toBe(0);
  });
});
