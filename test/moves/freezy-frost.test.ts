import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Freezy Frost", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.RATTATA)
      .enemyLevel(100)
      .enemyMoveset(MoveId.HOWL)
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingLevel(100)
      .moveset([MoveId.FREEZY_FROST, MoveId.HOWL, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH);

    vi.spyOn(allMoves[MoveId.FREEZY_FROST], "accuracy", "get").mockReturnValue(100);
  });

  it("should clear stat changes of user and opponent", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);
    const user = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.HOWL);
    await game.toNextTurn();

    expect(user.getStatStage(Stat.ATK)).toBe(1);
    expect(enemy.getStatStage(Stat.ATK)).toBe(1);

    game.move.select(MoveId.FREEZY_FROST);
    await game.toNextTurn();

    expect(user.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should clear all stat changes even when enemy uses the move", async () => {
    game.override.enemyMoveset(MoveId.FREEZY_FROST);
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]); // Shuckle for slower Howl on first turn so Freezy Frost doesn't affect it.
    const user = game.field.getPlayerPokemon();

    game.move.select(MoveId.HOWL);
    await game.toNextTurn();

    const userAtkBefore = user.getStatStage(Stat.ATK);
    expect(userAtkBefore).toBe(1);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(user.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should clear all stat changes in double battle", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.SHUCKLE, SpeciesId.RATTATA]);
    const [leftPlayer, rightPlayer] = game.scene.getPlayerField();
    const [leftOpp, rightOpp] = game.scene.getEnemyField();

    game.move.select(MoveId.HOWL, 0);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(leftPlayer.getStatStage(Stat.ATK)).toBe(1);
    expect(rightPlayer.getStatStage(Stat.ATK)).toBe(1);
    expect(leftOpp.getStatStage(Stat.ATK)).toBe(2); // Both enemies use Howl
    expect(rightOpp.getStatStage(Stat.ATK)).toBe(2);

    game.move.select(MoveId.FREEZY_FROST, 0, leftOpp.getBattlerIndex());
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(leftPlayer.getStatStage(Stat.ATK)).toBe(0);
    expect(rightPlayer.getStatStage(Stat.ATK)).toBe(0);
    expect(leftOpp.getStatStage(Stat.ATK)).toBe(0);
    expect(rightOpp.getStatStage(Stat.ATK)).toBe(0);
  });
});
