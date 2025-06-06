import { BattlerIndex } from "#app/battle";
import { RandomMoveAttr } from "#app/data/moves/move";
import { allMoves } from "#app/data/data-lists";
import { Stat } from "#app/enums/stat";
import { MoveResult } from "#app/field/pokemon";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Copycat", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let randomMoveAttr: RandomMoveAttr;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    randomMoveAttr = allMoves[MoveId.METRONOME].getAttrs(RandomMoveAttr)[0];
    game = new GameManager(phaserGame);
    game.override
      .moveset([MoveId.COPYCAT, MoveId.SPIKY_SHIELD, MoveId.SWORDS_DANCE, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .starterSpecies(SpeciesId.FEEBAS)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should copy the last move successfully executed", async () => {
    game.override.enemyMoveset(MoveId.SUCKER_PUNCH);
    await game.classicMode.startBattle();

    game.move.select(MoveId.SWORDS_DANCE);
    await game.toNextTurn();

    game.move.select(MoveId.COPYCAT); // Last successful move should be Swords Dance
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(4);
  });

  it("should fail when the last move used is not a valid Copycat move", async () => {
    game.override.enemyMoveset(MoveId.PROTECT); // Protect is not a valid move for Copycat to copy
    await game.classicMode.startBattle();

    game.move.select(MoveId.SPIKY_SHIELD); // Spiky Shield is not a valid move for Copycat to copy
    await game.toNextTurn();

    game.move.select(MoveId.COPYCAT);
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should copy the called move when the last move successfully calls another", async () => {
    game.override.moveset([MoveId.SPLASH, MoveId.METRONOME]).enemyMoveset(MoveId.COPYCAT);
    await game.classicMode.startBattle();
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.SWORDS_DANCE);

    game.move.select(MoveId.METRONOME);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]); // Player moves first, so enemy can copy Swords Dance
    await game.toNextTurn();

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(2);
  });

  it("should apply secondary effects of a move", async () => {
    game.override.enemyMoveset(MoveId.ACID_SPRAY); // Secondary effect lowers SpDef by 2 stages
    await game.classicMode.startBattle();

    game.move.select(MoveId.COPYCAT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.SPDEF)).toBe(-2);
  });
});
