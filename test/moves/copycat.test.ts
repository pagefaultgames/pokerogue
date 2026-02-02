import { getPokemonNameWithAffix } from "#app/messages";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Copycat", () => {
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
      .moveset([MoveId.COPYCAT, MoveId.SPIKY_SHIELD, MoveId.SWORDS_DANCE, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should copy the last move executed across turns", async () => {
    game.override.enemyMoveset(MoveId.SUCKER_PUNCH);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.select(MoveId.SWORDS_DANCE);
    await game.toNextTurn();

    game.move.select(MoveId.COPYCAT); // Last successful move should be Swords Dance
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.field.getPlayerPokemon().getStatStage(Stat.ATK)).toBe(4);
  });

  it("should fail when the last move used is not a valid Copycat move", async () => {
    game.override.enemyMoveset(MoveId.PROTECT); // Protect is not a valid move for Copycat to copy
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.select(MoveId.SPIKY_SHIELD); // Spiky Shield is not a valid move for Copycat to copy
    await game.toNextTurn();

    game.move.select(MoveId.COPYCAT);
    await game.toNextTurn();

    expect(game.field.getPlayerPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should copy the called move when the last move successfully calls another", async () => {
    game.override.moveset([MoveId.SPLASH, MoveId.METRONOME]).enemyMoveset(MoveId.COPYCAT);
    await game.classicMode.startBattle(SpeciesId.DRAMPA);
    game.move.forceMetronomeMove(MoveId.SWORDS_DANCE, true);

    game.move.select(MoveId.METRONOME);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]); // Player moves first so enemy can copy Swords Dance
    await game.toNextTurn();

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.getLastXMoves()[0]).toMatchObject({
      move: MoveId.SWORDS_DANCE,
      result: MoveResult.SUCCESS,
      useMode: MoveUseMode.FOLLOW_UP,
    });
    expect(enemy.getStatStage(Stat.ATK)).toBe(2);
  });

  it("should apply move secondary effects", async () => {
    game.override.enemyMoveset(MoveId.ACID_SPRAY); // Secondary effect lowers SpDef by 2 stages
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.select(MoveId.COPYCAT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game.field.getEnemyPokemon().getStatStage(Stat.SPDEF)).toBe(-2);
  });

  it("should not update the lastMove tracker for move failures in sequence 2", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.COPYCAT);
    await game.move.forceEnemyMove(MoveId.DOUBLE_SHOCK);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    // const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();

    // move should have shown text and consumed PP, but failed before being tracked by Copycat
    expect(karp).toHaveUsedMove({ move: MoveId.DOUBLE_SHOCK, result: MoveResult.FAIL });
    expect(karp).toHaveUsedPP(MoveId.DOUBLE_SHOCK, 1);
    expect(game).toHaveShownMessage(
      i18next.t("battle:useMove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(karp),
        moveName: allMoves[MoveId.DOUBLE_SHOCK].name,
      }),
    );
    expect(game.scene.currentBattle.lastMove).toBe(MoveId.NONE);
    // TODO: Move-calling moves incorrectly attempt to call MoveId.NONE (and bypass normal failure logic); uncomment once #6858 is merged
    // expect(feebas).toHaveUsedMove({ move: MoveId.COPYCAT, result: MoveResult.FAIL });
  });
});
