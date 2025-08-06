import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { invalidEncoreMoves } from "#moves/invalid-moves";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Encore", () => {
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
      .moveset([MoveId.SPLASH, MoveId.ENCORE])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should prevent the target from using any move except the last used move", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.use(MoveId.ENCORE);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemyPokemon).toHaveBattlerTag(BattlerTagType.ENCORE);
    expect(enemyPokemon.isMoveRestricted(MoveId.TACKLE)).toBe(true);
    expect(enemyPokemon.isMoveRestricted(MoveId.SPLASH)).toBe(false);
  });

  it("should override any upcoming moves with the Encored move, while still consuming PP", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    // Fake enemy having used tackle the turn prior
    const enemy = game.field.getEnemyPokemon();
    game.move.changeMoveset(enemy, [MoveId.SPLASH, MoveId.TACKLE]);
    enemy.pushMoveHistory({ move: MoveId.TACKLE, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });

    game.move.use(MoveId.ENCORE);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(enemy).toHaveUsedMove({ move: MoveId.TACKLE, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });
    expect(enemy).toHaveUsedPP(MoveId.TACKLE, 1);
  });

  // TODO: Make test using `changeMoveset`
  it.todo("should end at turn end if the user forgets the Encored move");

  it("should end immediately if the move runs out of PP", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    // Fake enemy having used tackle the turn prior
    const enemy = game.field.getEnemyPokemon();
    game.move.changeMoveset(enemy, [MoveId.SPLASH, MoveId.TACKLE]);
    enemy.pushMoveHistory({ move: MoveId.TACKLE, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });
    enemy.moveset[1].ppUsed = 2;

    game.move.use(MoveId.ENCORE);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(enemy).toHaveUsedMove({ move: MoveId.TACKLE, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });
    expect(enemy).toHaveUsedPP(MoveId.TACKLE, 39);
    expect(enemy).toHaveBattlerTag(BattlerTagType.ENCORE);

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(enemy).toHaveUsedPP(MoveId.TACKLE, "all");
    expect(enemy).not.toHaveBattlerTag(BattlerTagType.ENCORE);
  });

  const invalidMoves = [...invalidEncoreMoves].map(m => ({
    name: MoveId[m],
    move: m,
  }));
  it.each(invalidMoves)("should fail if the target's last move is $name", async ({ move }) => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    enemy.pushMoveHistory({ move, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });

    game.move.use(MoveId.ENCORE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
    expect(enemy).not.toHaveBattlerTag(BattlerTagType.ENCORE);
  });

  it("should fail if the target has not made a move", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.ENCORE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
    expect(enemy).not.toHaveBattlerTag(BattlerTagType.ENCORE);
  });

  it("should force a Tormented target to alternate between Struggle and the Encored move", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.ENCORE);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemy).toHaveBattlerTag(BattlerTagType.ENCORE);

    game.move.use(MoveId.TORMENT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemy).toHaveBattlerTag(BattlerTagType.ENCORE);
    expect(enemy).toHaveBattlerTag(BattlerTagType.TORMENT);

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(enemy).toHaveUsedMove(MoveId.STRUGGLE);
  });
});
