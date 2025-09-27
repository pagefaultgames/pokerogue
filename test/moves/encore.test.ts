import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { invalidEncoreMoves } from "#moves/invalid-moves";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Encore", () => {
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
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should prevent the target from using any move except the last used move", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    game.move.use(MoveId.ENCORE);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    const karp = game.field.getEnemyPokemon();

    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:encoreOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(karp),
      }),
    );

    expect(karp).toHaveBattlerTag({ tagType: BattlerTagType.ENCORE, moveId: MoveId.TACKLE });
    expect(karp.isMoveRestricted(MoveId.SPLASH)).toBe(true);
    expect(karp.isMoveRestricted(MoveId.TACKLE)).toBe(false);
  });

  it("should be removed on turn end after triggering thrice, ignoring Instruct", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const karp = game.field.getEnemyPokemon();
    karp.pushMoveHistory({ move: MoveId.SPLASH, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });

    game.move.use(MoveId.ENCORE);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    // Should have ticked down once
    expect(karp).toHaveBattlerTag({ tagType: BattlerTagType.ENCORE, turnCount: 2 });

    game.move.use(MoveId.INSTRUCT);
    await game.toNextTurn();

    expect(karp).toHaveBattlerTag({ tagType: BattlerTagType.ENCORE, turnCount: 1 });

    game.move.use(MoveId.INSTRUCT);
    await game.toEndOfTurn(false);

    // Tag should still be present until the `TurnEndPhase` ticks it down
    expect(karp).toHaveBattlerTag(BattlerTagType.ENCORE);

    await game.toNextTurn();

    expect(karp).not.toHaveBattlerTag(BattlerTagType.ENCORE);
    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:encoreOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(karp),
      }),
    );
  });

  it("should override the target's upcoming move with the Encored move while still consuming PP", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    // Fake enemy having used tackle the turn prior
    const karp = game.field.getEnemyPokemon();
    game.move.changeMoveset(karp, [MoveId.SPLASH, MoveId.TACKLE]);
    karp.pushMoveHistory({ move: MoveId.TACKLE, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });

    game.move.use(MoveId.ENCORE);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    // Encore overrode the selected Splash with a tackle
    expect(karp).toHaveUsedMove({ move: MoveId.TACKLE, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });
    expect(karp).toHaveUsedPP(MoveId.TACKLE, 1);
  });

  // TODO: Write test
  it.todo("should choose targets for overridden move randomly if multiple are eligible");

  // TODO: Write test
  it.todo("should always target self for Acupressure");

  it("should be removed at turn end if target lacks the Encored move", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    // Lock the enemy into Encore before removing it from their moveset on turn end.
    const enemy = game.field.getEnemyPokemon();
    game.move.changeMoveset(enemy, [MoveId.SPLASH, MoveId.TACKLE]);
    enemy.pushMoveHistory({ move: MoveId.TACKLE, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });

    game.move.use(MoveId.ENCORE);
    await game.move.selectEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn(false);

    expect(enemy).toHaveBattlerTag({ tagType: BattlerTagType.ENCORE, moveId: MoveId.TACKLE });

    game.move.changeMoveset(enemy, [MoveId.SPLASH]);
    await game.toEndOfTurn();

    expect(enemy).not.toHaveBattlerTag(BattlerTagType.ENCORE);
  });

  it("should be removed at turn end if the Encored move runs out of PP", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    // Fake enemy having used tackle the turn prior
    const enemy = game.field.getEnemyPokemon();
    game.move.changeMoveset(enemy, [MoveId.SPLASH, MoveId.TACKLE]);
    enemy.pushMoveHistory({ move: MoveId.TACKLE, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });
    enemy.moveset[1].ppUsed = enemy.moveset[1].getMovePp() - 2;

    game.move.use(MoveId.ENCORE);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(enemy).toHaveUsedMove({ move: MoveId.TACKLE, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });
    expect(enemy).toHaveUsedPP(MoveId.TACKLE, -1);
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
    game.move.changeMoveset(enemy, [move, MoveId.SPLASH]);
    enemy.pushMoveHistory({ move, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });

    game.move.use(MoveId.ENCORE);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.ENCORE, result: MoveResult.FAIL });
    expect(enemy).not.toHaveBattlerTag(BattlerTagType.ENCORE);
  });

  it("should fail if the target has not made a move", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.ENCORE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.ENCORE, result: MoveResult.FAIL });
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
    await game.toNextTurn();

    expect(enemy).toHaveBattlerTag(BattlerTagType.ENCORE);
    expect(enemy).toHaveBattlerTag(BattlerTagType.TORMENT);

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(enemy).toHaveUsedMove(MoveId.STRUGGLE);
  });
});
