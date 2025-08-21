import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TurnStartPhase } from "#phases/turn-start-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Move - Trick Room", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should reverse the speed order of combatants while active", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();
    feebas.setStat(Stat.SPD, 2);
    karp.setStat(Stat.SPD, 1);
    expect(game.field.getSpeedOrder(true)).toEqual([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    // Add trick room to the field
    game.move.use(MoveId.TRICK_ROOM);
    await game.toNextTurn();

    expect(game).toHaveArenaTag({
      tagType: ArenaTagType.TRICK_ROOM,
      side: ArenaTagSide.BOTH,
      sourceId: feebas.id,
      sourceMove: MoveId.TRICK_ROOM,
      turnCount: 4, // The 5 turn limit _includes_ the current turn!
    });

    // Now, check that speed was indeed reduced
    const turnOrderSpy = vi.spyOn(TurnStartPhase.prototype, "getSpeedOrder");

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(turnOrderSpy).toHaveLastReturnedWith([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
  });

  it("should be removed when overlapped", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();

    // Add trick room to the field, then add it again!
    game.scene.arena.addTag(ArenaTagType.TRICK_ROOM, 5, MoveId.TRICK_ROOM, feebas.id);

    expect(game).toHaveArenaTag(ArenaTagType.TRICK_ROOM);

    game.scene.arena.addTag(ArenaTagType.TRICK_ROOM, 5, MoveId.TRICK_ROOM, feebas.id);

    expect(game).not.toHaveArenaTag(ArenaTagType.TRICK_ROOM);
  });
});
