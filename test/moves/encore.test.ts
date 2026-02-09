import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import type { EnemyPokemon } from "#field/pokemon";
import { invalidEncoreMoves } from "#moves/invalid-moves";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Encore", () => {
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
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should lock the target into its last used move for 3 turns", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.ENCORE);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();
    expect(feebas).toHaveUsedMove({ move: MoveId.ENCORE, result: MoveResult.SUCCESS });
    expect(karp).toHaveBattlerTag({ tagType: BattlerTagType.ENCORE, moveId: MoveId.TACKLE, turnCount: 3 });
    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:encoreOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(karp),
      }),
    );

    // should only be able to select tackle
    expect(karp.hasRestrictingTag(MoveId.SPLASH)).toBe(true);
    expect(karp.hasRestrictingTag(MoveId.TACKLE)).toBe(false);
  });

  // Source: https://play.pokemonshowdown.com/battle-gen9nationaldex-2507329086
  it("should be removed at the end of the 3rd turn during which it triggers, ignoring Instruct", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const karp = game.field.getEnemyPokemon();
    karp.pushMoveHistory({ move: MoveId.SPLASH, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });

    game.move.use(MoveId.ENCORE);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(karp).toHaveBattlerTag({ tagType: BattlerTagType.ENCORE, turnCount: 3 });

    game.move.use(MoveId.INSTRUCT);
    await game.toNextTurn();

    // Should have ticked down only once, even with encore
    expect(karp).toHaveBattlerTag({ tagType: BattlerTagType.ENCORE, turnCount: 2 });

    game.move.use(MoveId.INSTRUCT);
    await game.toNextTurn();
    game.move.use(MoveId.INSTRUCT);
    await game.toNextTurn();

    expect(karp).not.toHaveBattlerTag(BattlerTagType.ENCORE);
    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:encoreOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(karp),
      }),
    );
  });

  // TODO: Verify the turn count behavior on mainline just in case it's different
  it("should override the target's upcoming move if used first, ending 1 turn sooner if it occurs", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    // Fake enemy having used tackle the turn prior
    const karp = game.field.getEnemyPokemon();
    game.move.changeMoveset(karp, [MoveId.SPLASH, MoveId.TACKLE]);
    karp.pushMoveHistory({ move: MoveId.TACKLE, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });

    game.move.use(MoveId.ENCORE);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    // Encore overrode the selected Splash with a tackle, ticking down an additional time
    expect(karp).toHaveBattlerTag({ tagType: BattlerTagType.ENCORE, turnCount: 2 });
    expect(karp).toHaveUsedMove({ move: MoveId.TACKLE, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });
    expect(karp).toHaveUsedPP(MoveId.TACKLE, 1);

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();
    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn(false);

    // Tag is removed at the end of turn X+2
    expect(karp).toHaveBattlerTag({ tagType: BattlerTagType.ENCORE, turnCount: 1 });
  });

  // TODO: These interactions are implemented, but somewhat hard to test atm
  it.todo("should choose targets for overridden move randomly if multiple are eligible");

  // TODO: Write test
  it.todo("should always target self when forcing Acupressure");

  it.each<{ reason: string; callback: (enemy: EnemyPokemon) => void }>([
    { reason: "the target lacks the Encored move", callback: enemy => game.move.changeMoveset(enemy, [MoveId.SPLASH]) },
    {
      reason: "the Encored move runs out of PP",
      callback: enemy => (enemy.moveset[1].ppUsed = enemy.moveset[1].getMovePp()),
    },
  ])("should be removed at turn end if $reason", async ({ callback }) => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const karp = game.field.getEnemyPokemon();
    game.move.changeMoveset(karp, [MoveId.SPLASH, MoveId.TACKLE]);
    karp.pushMoveHistory({ move: MoveId.TACKLE, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });

    game.move.use(MoveId.ENCORE);
    await game.move.selectEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn(false);

    expect(karp).toHaveBattlerTag({ tagType: BattlerTagType.ENCORE, moveId: MoveId.TACKLE });

    callback(karp);

    await game.toEndOfTurn();

    expect(karp).not.toHaveBattlerTag(BattlerTagType.ENCORE);
  });

  const invalidMoves = [...invalidEncoreMoves].map(m => ({
    name: MoveId[m],
    move: m,
  }));
  it.each(invalidMoves)("should fail if the target's last move is $name", async ({ move }) => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

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
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.ENCORE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();
    expect(feebas).toHaveUsedMove({ move: MoveId.ENCORE, result: MoveResult.FAIL });
    expect(karp).not.toHaveBattlerTag(BattlerTagType.ENCORE);
  });

  it("should force a Tormented target to alternate between Struggle and the Encored move", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.ENCORE);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    const karp = game.field.getEnemyPokemon();
    expect(karp).toHaveBattlerTag(BattlerTagType.ENCORE);

    game.move.use(MoveId.TORMENT);
    await game.toNextTurn();

    expect(karp).toHaveUsedMove(MoveId.TACKLE);
    expect(karp).toHaveBattlerTag(BattlerTagType.ENCORE);
    expect(karp).toHaveBattlerTag(BattlerTagType.TORMENT);

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(karp).toHaveUsedMove(MoveId.STRUGGLE);
  });
});
