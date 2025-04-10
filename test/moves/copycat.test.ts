import { BattlerIndex } from "#app/battle";
import { allMoves, RandomMoveAttr } from "#app/data/moves/move";
import { Stat } from "#app/enums/stat";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
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
    randomMoveAttr = allMoves[Moves.METRONOME].getAttrs(RandomMoveAttr)[0];
    game = new GameManager(phaserGame);
    game.override
      .moveset([Moves.COPYCAT, Moves.SPIKY_SHIELD, Moves.SWORDS_DANCE, Moves.SPLASH])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .starterSpecies(Species.FEEBAS)
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should copy the last move successfully executed", async () => {
    game.override.enemyMoveset(Moves.SUCKER_PUNCH);
    await game.classicMode.startBattle();

    game.move.select(Moves.SWORDS_DANCE);
    await game.toNextTurn();

    game.move.select(Moves.COPYCAT); // Last successful move should be Swords Dance
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(4);
  });

  it("should fail when the last move used is not a valid Copycat move", async () => {
    game.override.enemyMoveset(Moves.PROTECT); // Protect is not a valid move for Copycat to copy
    await game.classicMode.startBattle();

    game.move.select(Moves.SPIKY_SHIELD); // Spiky Shield is not a valid move for Copycat to copy
    await game.toNextTurn();

    game.move.select(Moves.COPYCAT);
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should copy the called move when the last move successfully calls another", async () => {
    game.override.moveset([Moves.SPLASH, Moves.METRONOME]).enemyMoveset(Moves.COPYCAT);
    await game.classicMode.startBattle();
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(Moves.SWORDS_DANCE);

    game.move.select(Moves.METRONOME);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]); // Player moves first, so enemy can copy Swords Dance
    await game.toNextTurn();

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(2);
  });

  it("should apply secondary effects of a move", async () => {
    game.override.enemyMoveset(Moves.ACID_SPRAY); // Secondary effect lowers SpDef by 2 stages
    await game.classicMode.startBattle();

    game.move.select(Moves.COPYCAT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.SPDEF)).toBe(-2);
  });
});
