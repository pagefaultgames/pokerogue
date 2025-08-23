import { EntryHazardTag } from "#data/arena-tag";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

describe("Moves - Ceaseless Edge", () => {
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
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.RUN_AWAY)
      .enemyPassiveAbility(AbilityId.RUN_AWAY)
      .startingLevel(100)
      .enemyLevel(100)
      .moveset([MoveId.CEASELESS_EDGE, MoveId.SPLASH, MoveId.ROAR])
      .enemyMoveset(MoveId.SPLASH);
    vi.spyOn(allMoves[MoveId.CEASELESS_EDGE], "accuracy", "get").mockReturnValue(100);
  });

  test("move should hit and apply spikes", async () => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const enemyPokemon = game.field.getEnemyPokemon();

    const enemyStartingHp = enemyPokemon.hp;

    game.move.select(MoveId.CEASELESS_EDGE);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    // Spikes should not have any layers before move effect is applied
    const tagBefore = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as EntryHazardTag;
    expect(tagBefore instanceof EntryHazardTag).toBeFalsy();

    await game.phaseInterceptor.to(TurnEndPhase);
    const tagAfter = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as EntryHazardTag;
    expect(tagAfter instanceof EntryHazardTag).toBeTruthy();
    expect(tagAfter.layers).toBe(1);
    expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
  });

  test("move should hit twice with multi lens and apply two layers of spikes", async () => {
    game.override.startingHeldItems([{ name: "MULTI_LENS" }]);
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const enemyPokemon = game.field.getEnemyPokemon();

    const enemyStartingHp = enemyPokemon.hp;

    game.move.select(MoveId.CEASELESS_EDGE);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    // Spikes should not have any layers before move effect is applied
    const tagBefore = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as EntryHazardTag;
    expect(tagBefore instanceof EntryHazardTag).toBeFalsy();

    await game.phaseInterceptor.to(TurnEndPhase);
    const tagAfter = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as EntryHazardTag;
    expect(tagAfter instanceof EntryHazardTag).toBeTruthy();
    expect(tagAfter.layers).toBe(2);
    expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
  });

  test("trainer - move should hit twice, apply two layers of spikes, force switch opponent - opponent takes damage", async () => {
    game.override.startingHeldItems([{ name: "MULTI_LENS" }]).startingWave(25);

    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    game.move.select(MoveId.CEASELESS_EDGE);
    await game.phaseInterceptor.to(MoveEffectPhase, false);
    // Spikes should not have any layers before move effect is applied
    const tagBefore = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as EntryHazardTag;
    expect(tagBefore instanceof EntryHazardTag).toBeFalsy();

    await game.toNextTurn();
    const tagAfter = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as EntryHazardTag;
    expect(tagAfter instanceof EntryHazardTag).toBeTruthy();
    expect(tagAfter.layers).toBe(2);

    const hpBeforeSpikes = game.scene.currentBattle.enemyParty[1].hp;
    // Check HP of pokemon that WILL BE switched in (index 1)
    game.forceEnemyToSwitch();
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase, false);
    expect(game.scene.currentBattle.enemyParty[0].hp).toBeLessThan(hpBeforeSpikes);
  });
});
