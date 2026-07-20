import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Frenzy Move Reset", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .moveset(MoveId.THRASH)
      .statusEffect(StatusEffect.PARALYSIS)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(100)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  /*
   * Thrash (or frenzy moves in general) should not continue to run if the attack fails due to paralysis.
   *
   * With the {@linkcode MoveLockTag} design, each successful frenzy turn queues exactly one follow-up use
   * for the next turn. If that follow-up is disrupted (e.g. paralysis), no new use is queued and the
   * FRENZY tag is removed, freeing the Pokemon to act normally again.
   */
  it("should cancel frenzy move if the queued follow-up fails", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.THRASH);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceStatusActivation(false);
    await game.toNextTurn();

    // The successful first hit queues a single follow-up use for the next turn.
    expect(playerPokemon.summonData.moveQueue.length).toBe(1);
    expect(playerPokemon.summonData.tags.some(tag => tag.tagType === BattlerTagType.FRENZY)).toBe(true);

    await game.move.forceStatusActivation(true);
    await game.toNextTurn();

    // Paralysis disrupts the follow-up, so nothing is re-queued and the tag is removed.
    expect(playerPokemon.summonData.moveQueue.length).toBe(0);
    expect(playerPokemon.summonData.tags.some(tag => tag.tagType === BattlerTagType.FRENZY)).toBe(false);
  });

  it("queues one follow-up use with a fresh target after a frenzy turn", async () => {
    game.override.battleStyle("double").statusEffect(StatusEffect.NONE);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    vi.spyOn(feebas, "randBattleSeedIntRange").mockReturnValue(2);

    game.move.use(MoveId.THRASH, 0);
    await game.toNextTurn();

    expect(feebas.summonData.moveQueue).toHaveLength(1);
    expect(feebas.summonData.moveQueue[0].targets[0]).toBeOneOf([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
  });

  it.each([
    { moveId: MoveId.THRASH, moveName: "Thrash" },
    { moveId: MoveId.OUTRAGE, moveName: "Outrage" },
    { moveId: MoveId.PETAL_DANCE, moveName: "Petal Dance" },
    { moveId: MoveId.RAGING_FURY, moveName: "Raging Fury" },
  ])("$moveName selects a fresh near-enemy target each turn in a double battle", async ({ moveId }) => {
    game.override.battleStyle("double").statusEffect(StatusEffect.NONE);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    let pick = 0;
    vi.spyOn(feebas, "randBattleSeedIntRange").mockReturnValue(2);
    vi.spyOn(feebas, "randBattleSeedInt").mockImplementation(() => pick++ % 2);

    game.move.use(moveId, 0);
    await game.toNextTurn();

    // First hit succeeded: one follow-up is queued against a freshly-picked, valid enemy.
    expect(feebas.summonData.moveQueue).toHaveLength(1);
    const turn1Target = feebas.getLastXMoves(1)[0].targets[0];
    const queuedTarget = feebas.summonData.moveQueue[0].targets[0];
    expect(turn1Target).toBeOneOf([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    expect(queuedTarget).toBeOneOf([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.toNextTurn();

    // The queued follow-up executes against exactly the target selected for it, then frenzy ends.
    expect(feebas.getLastXMoves(1)[0].targets[0]).toBe(queuedTarget);
    expect(feebas.summonData.tags.some(tag => tag.tagType === BattlerTagType.FRENZY)).toBe(false);
  });

  it("targets the sole enemy in a single battle", async () => {
    game.override.statusEffect(StatusEffect.NONE);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    game.move.use(MoveId.THRASH);
    await game.toNextTurn();

    expect(feebas.summonData.moveQueue).toHaveLength(1);
    expect(feebas.summonData.moveQueue[0].targets[0]).toBe(BattlerIndex.ENEMY);
  });

  it("confuses the user when the frenzy expires naturally", async () => {
    game.override.statusEffect(StatusEffect.NONE);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    vi.spyOn(feebas, "randBattleSeedIntRange").mockReturnValue(2); // 2-turn frenzy

    game.move.use(MoveId.THRASH);
    await game.toNextTurn();

    // Frenzy is still running after the first turn, so no confusion yet.
    expect(feebas.summonData.tags.some(tag => tag.tagType === BattlerTagType.FRENZY)).toBe(true);
    expect(feebas.getTag(BattlerTagType.CONFUSED)).toBeUndefined();

    await game.toNextTurn();

    // The frenzy has run its full course uninterrupted, so the user becomes confused.
    expect(feebas.summonData.tags.some(tag => tag.tagType === BattlerTagType.FRENZY)).toBe(false);
    expect(feebas.getTag(BattlerTagType.CONFUSED)).toBeDefined();
  });
});
