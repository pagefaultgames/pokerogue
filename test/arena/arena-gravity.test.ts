import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Arena - Gravity", () => {
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
      .ability(AbilityId.UNNERVE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.FLETCHLING)
      .enemyLevel(5);
  });

  // Reference: https://bulbapedia.bulbagarden.net/wiki/Gravity_(move)

  it("should multiply all non-OHKO move accuracy by 1.67x", async () => {
    const accSpy = vi.spyOn(allMoves[MoveId.TACKLE], "calculateBattleAccuracy");
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    game.move.use(MoveId.GRAVITY);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.toEndOfTurn();

    expect(game).toHaveArenaTag(ArenaTagType.GRAVITY);
    expect(accSpy).toHaveLastReturnedWith(allMoves[MoveId.TACKLE].accuracy * 1.67);
  });

  it("should not affect OHKO move accuracy", async () => {
    const accSpy = vi.spyOn(allMoves[MoveId.FISSURE], "calculateBattleAccuracy");
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    game.move.use(MoveId.GRAVITY);
    await game.move.forceEnemyMove(MoveId.FISSURE);
    await game.toEndOfTurn();

    expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();
    expect(accSpy).toHaveLastReturnedWith(allMoves[MoveId.FISSURE].accuracy);
  });

  it("should forcibly ground all Pokemon for the duration of the effect", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    expect(enemy.isGrounded()).toBe(false);

    game.move.use(MoveId.GRAVITY);
    await game.toNextTurn();

    expect(game).toHaveArenaTag(ArenaTagType.GRAVITY);
    expect(player.isGrounded()).toBe(true);
    expect(enemy.isGrounded()).toBe(true);
  });
});
