import { TRAINER_MAX_FRIENDSHIP_WAVE } from "#balance/starters";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe.each([
  { name: "Frustration", move: MoveId.FRUSTRATION, inverted: true },
  { name: "Return", move: MoveId.RETURN, inverted: false },
  { name: "Pika Papow", move: MoveId.PIKA_PAPOW, inverted: false },
  { name: "Veevee Volley", move: MoveId.VEEVEE_VOLLEY, inverted: false },
])("Move - $name", ({ move, inverted }) => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  /**
   * Helper function to return the raw computed power for Return & co, excluding any rounding.
   */
  function getPowerFromFriendship(friendship: number): number {
    const power = (inverted ? 255 - friendship : friendship) / 2.5;
    return Math.floor(power);
  }

  it(`should ${inverted ? "decrease" : "increase"} in power based on the user's friendship`, async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    feebas.friendship = 100;
    expect(feebas.friendship).not.toBe(feebas.species.baseFriendship);

    const powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");

    game.move.use(move);
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({ move, result: MoveResult.SUCCESS });
    expect(powerSpy).toHaveLastReturnedWith(getPowerFromFriendship(feebas.friendship));
  });

  it("should use the base species friendship for wild pokemon", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const karp = game.field.getEnemyPokemon();
    karp.friendship = 200;
    expect(karp.friendship).not.toBe(karp.species.baseFriendship);

    const powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(move);
    await game.toEndOfTurn();

    expect(karp).toHaveUsedMove({ move, result: MoveResult.SUCCESS });
    expect(powerSpy).not.toHaveLastReturnedWith(getPowerFromFriendship(karp.friendship));
    expect(powerSpy).toHaveLastReturnedWith(getPowerFromFriendship(karp.species.baseFriendship));
  });

  it("should use wave-based friendship amounts for Trainer pokemon", async () => {
    game.override.battleType(BattleType.TRAINER).startingWave(TRAINER_MAX_FRIENDSHIP_WAVE - 50);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const karp = game.field.getEnemyPokemon();
    expect(karp.friendship).not.toBe(karp.species.baseFriendship);

    const powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(move);
    await game.toEndOfTurn();

    expect(karp).toHaveUsedMove({ move, result: MoveResult.SUCCESS });
    expect(powerSpy).not.toHaveLastReturnedWith(getPowerFromFriendship(karp.species.baseFriendship));
    expect(powerSpy).toHaveLastReturnedWith(getPowerFromFriendship(karp.friendship));
  });

  it("should return a bare minimum of 1 power", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    feebas.friendship = inverted ? 255 : 0;
    expect(getPowerFromFriendship(feebas.friendship)).toBe(0);

    const powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");

    game.move.use(move);
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({ move, result: MoveResult.SUCCESS });
    expect(powerSpy).toHaveLastReturnedWith(1);
  });
});
