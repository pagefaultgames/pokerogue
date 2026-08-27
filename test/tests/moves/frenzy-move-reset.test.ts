import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
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
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(100)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  /*
   * Thrash (or frenzy moves in general) should not continue to run if the attack fails due to paralysis or other effects.
   *
   * With the {@linkcode MoveLockTag} design, each successful frenzy turn queues exactly one follow-up use
   * for the next turn. If that follow-up is disrupted (e.g. paralysis), no new use is queued and the
   * FRENZY tag is removed, freeing the Pokemon to act normally again.
   */

  it("should cancel the frenzy if the queued follow-up fails", async () => {
    game.override.statusEffect(StatusEffect.PARALYSIS);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.THRASH);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceStatusActivation(false);
    await game.toNextTurn();

    // The successful first hit queues a single follow-up use for the next turn.
    expect(player.summonData.moveQueue.length).toBe(1);
    expect(player).toHaveBattlerTag(BattlerTagType.FRENZY);

    await game.move.forceStatusActivation(true);
    await game.toNextTurn();

    // Paralysis disrupted the follow-up, so nothing is re-queued and the tag is removed.
    expect(player).toHaveUsedMove({ move: MoveId.NONE, result: MoveResult.FAIL });
    expect(player.summonData.moveQueue.length).toBe(0);
    expect(player).not.toHaveBattlerTag(BattlerTagType.FRENZY);
  });

  it("should confuse the user when the frenzy expires naturally", async () => {
    game.override.statusEffect(StatusEffect.NONE);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    vi.spyOn(player, "randBattleSeedIntRange").mockReturnValue(2); // 2-turn frenzy

    game.move.use(MoveId.THRASH);
    await game.toNextTurn();

    // Frenzy is still running
    expect(player).toHaveBattlerTag({ tagType: BattlerTagType.FRENZY, turnCount: 1 });
    expect(player).not.toHaveBattlerTag(BattlerTagType.CONFUSED);

    await game.toNextTurn();

    // The frenzy has run its full course uninterrupted, so the user becomes confused.
    expect(player).not.toHaveBattlerTag(BattlerTagType.FRENZY);
    expect(player).toHaveBattlerTag(BattlerTagType.CONFUSED);
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
  ])("$moveName should select a random valid target each turn in a double battle", async ({ moveId }) => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    vi.spyOn(player, "randBattleSeedIntRange").mockReturnValue(3); // 3 turn duration
    // by default, randBattleSeedInt is stubbed to return the max value (2nd target)

    game.move.use(moveId);
    await game.toNextTurn();

    // First hit succeeded: both the initial attack and queued strike target a random enemy (#2 in this case)
    expect(player).toHaveUsedMove({ move: moveId, targets: [BattlerIndex.ENEMY_2], result: MoveResult.SUCCESS });
    const queuedTarget = player.summonData.moveQueue[0].targets[0];
    expect(queuedTarget).toBe(BattlerIndex.ENEMY_2);

    // change the randomly selected target for the next queued strike
    vi.spyOn(player, "randBattleSeedInt").mockImplementation(() => 0);

    await game.toNextTurn();

    // The queued follow-up executes against exactly the target selected for it,
    // and a new random target is chosen for NEXT turn.
    expect(player).toHaveUsedMove({ move: moveId, targets: [queuedTarget], result: MoveResult.SUCCESS });
    const newQueuedTarget = player.summonData.moveQueue[0].targets[0];
    expect(newQueuedTarget).toBe(BattlerIndex.ENEMY);
  });

  it("should target the sole enemy in a single battle", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.THRASH);
    await game.toNextTurn();

    expect(player.summonData.moveQueue[0].targets[0]).toBe(BattlerIndex.ENEMY);
  });
});
