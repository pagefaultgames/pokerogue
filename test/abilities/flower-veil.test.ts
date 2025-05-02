import { BattlerIndex } from "#app/battle";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { allMoves } from "#app/data/moves/move";
import { BattlerTagType } from "#enums/battler-tag-type";
import { allAbilities } from "#app/data/data-lists";

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
      .moveset([Moves.SPLASH])
      .enemySpecies(Species.BULBASAUR)
      .ability(Abilities.FLOWER_VEIL)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  /***********************************************
   * Tests for proper handling of status effects *
   ***********************************************/
  it("should not prevent any source of self-inflicted status conditions", async () => {
    game.override
      .enemyMoveset([Moves.TACKLE, Moves.SPLASH])
      .moveset([Moves.REST, Moves.SPLASH])
      .startingHeldItems([{ name: "FLAME_ORB" }]);
    await game.classicMode.startBattle([Species.BULBASAUR]);
    const user = game.scene.getPlayerPokemon()!;
    game.move.select(Moves.REST);
    await game.forceEnemyMove(Moves.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();
    expect(user.status?.effect).toBe(StatusEffect.SLEEP);

    // remove sleep status so we can get burn from the orb
    user.resetStatus();
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    expect(user.status?.effect).toBe(StatusEffect.BURN);
  });

  it("should prevent drowsiness from yawn for a grass user and its grass allies", async () => {
    game.override.enemyMoveset([Moves.YAWN]).moveset([Moves.SPLASH]).battleStyle("double");
    await game.classicMode.startBattle([Species.BULBASAUR, Species.BULBASAUR]);

    // Clear the ability of the ally to isolate the test
    const ally = game.scene.getPlayerField()[1]!;
    vi.spyOn(ally, "getAbility").mockReturnValue(allAbilities[Abilities.BALL_FETCH]);
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.YAWN, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.YAWN, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("BerryPhase");
    const user = game.scene.getPlayerPokemon()!;
    expect(user.getTag(BattlerTagType.DROWSY)).toBeFalsy();
    expect(ally.getTag(BattlerTagType.DROWSY)).toBeFalsy();
  });

  it("should prevent status conditions from moves like Thunder Wave for a grass user and its grass allies", async () => {
    game.override.enemyMoveset([Moves.THUNDER_WAVE]).moveset([Moves.SPLASH]).battleStyle("double");
    vi.spyOn(allMoves[Moves.THUNDER_WAVE], "accuracy", "get").mockReturnValue(100);
    await game.classicMode.startBattle([Species.BULBASAUR]);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.THUNDER_WAVE);
    await game.toNextTurn();
    expect(game.scene.getPlayerPokemon()!.status).toBeUndefined();
    vi.spyOn(allMoves[Moves.THUNDER_WAVE], "accuracy", "get").mockClear();
  });

  it("should not prevent status conditions for a non-grass user and its non-grass allies", async () => {
    game.override.enemyMoveset([Moves.THUNDER_WAVE]).moveset([Moves.SPLASH]).battleStyle("double");
    await game.classicMode.startBattle([Species.MAGIKARP, Species.MAGIKARP]);
    const [user, ally] = game.scene.getPlayerField();
    vi.spyOn(allMoves[Moves.THUNDER_WAVE], "accuracy", "get").mockReturnValue(100);
    // Clear the ally ability to isolate the test
    vi.spyOn(ally, "getAbility").mockReturnValue(allAbilities[Abilities.BALL_FETCH]);
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.THUNDER_WAVE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.THUNDER_WAVE, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");
    expect(user.status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(ally.status?.effect).toBe(StatusEffect.PARALYSIS);
  });

  /*******************************************
   * Tests for proper handling of stat drops *
   *******************************************/

  it("should prevent the status drops from enemies for the a grass user and its grass allies", async () => {
    game.override.enemyMoveset([Moves.GROWL]).moveset([Moves.SPLASH]).battleStyle("double");
    await game.classicMode.startBattle([Species.BULBASAUR, Species.BULBASAUR]);
    const [user, ally] = game.scene.getPlayerField();
    // Clear the ally ability to isolate the test
    vi.spyOn(ally, "getAbility").mockReturnValue(allAbilities[Abilities.BALL_FETCH]);
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    expect(user.getStatStage(Stat.ATK)).toBe(0);
    expect(ally.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not prevent status drops for a non-grass user and its non-grass allies", async () => {
    game.override.enemyMoveset([Moves.GROWL]).moveset([Moves.SPLASH]).battleStyle("double");
    await game.classicMode.startBattle([Species.MAGIKARP, Species.MAGIKARP]);
    const [user, ally] = game.scene.getPlayerField();
    // Clear the ally ability to isolate the test
    vi.spyOn(ally, "getAbility").mockReturnValue(allAbilities[Abilities.BALL_FETCH]);
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    expect(user.getStatStage(Stat.ATK)).toBe(-2);
    expect(ally.getStatStage(Stat.ATK)).toBe(-2);
  });

  it("should not prevent self-inflicted stat drops from moves like Close Combat for a user or its allies", async () => {
    game.override.moveset([Moves.CLOSE_COMBAT]).battleStyle("double");
    await game.classicMode.startBattle([Species.BULBASAUR, Species.BULBASAUR]);
    const [user, ally] = game.scene.getPlayerField();
    // Clear the ally ability to isolate the test
    vi.spyOn(ally, "getAbility").mockReturnValue(allAbilities[Abilities.BALL_FETCH]);

    game.move.select(Moves.CLOSE_COMBAT, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.CLOSE_COMBAT, 1, BattlerIndex.ENEMY_2);
    await game.phaseInterceptor.to("BerryPhase");
    expect(user.getStatStage(Stat.DEF)).toBe(-1);
    expect(user.getStatStage(Stat.SPDEF)).toBe(-1);
    expect(ally.getStatStage(Stat.DEF)).toBe(-1);
    expect(ally.getStatStage(Stat.SPDEF)).toBe(-1);
  });

  it("should prevent the drops while retaining the boosts from spicy extract", async () => {
    game.override.enemyMoveset([Moves.SPICY_EXTRACT]).moveset([Moves.SPLASH]);
    await game.classicMode.startBattle([Species.BULBASAUR]);
    const user = game.scene.getPlayerPokemon()!;
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    expect(user.getStatStage(Stat.ATK)).toBe(2);
    expect(user.getStatStage(Stat.DEF)).toBe(0);
  });
});
