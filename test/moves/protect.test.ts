import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import GameManager from "#test/testUtils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { allMoves } from "#app/data/data-lists";
import { ArenaTagSide, ArenaTrapTag } from "#app/data/arena-tag";
import { BattlerIndex } from "#app/battle";
import { MoveResult } from "#app/field/pokemon";

describe("Moves - Protect", () => {
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

    game.override.battleStyle("single");

    game.override.moveset([Moves.PROTECT]);
    game.override.enemySpecies(Species.SNORLAX);

    game.override.enemyAbility(Abilities.INSOMNIA);
    game.override.enemyMoveset([Moves.TACKLE]);

    game.override.startingLevel(100);
    game.override.enemyLevel(100);
  });

  test("should protect the user from attacks", async () => {
    await game.classicMode.startBattle([Species.CHARIZARD]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.PROTECT);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
  });

  test("should prevent secondary effects from the opponent's attack", async () => {
    game.override.enemyMoveset([Moves.CEASELESS_EDGE]);
    vi.spyOn(allMoves[Moves.CEASELESS_EDGE], "accuracy", "get").mockReturnValue(100);

    await game.classicMode.startBattle([Species.CHARIZARD]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.PROTECT);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    expect(game.scene.arena.getTagOnSide(ArenaTrapTag, ArenaTagSide.ENEMY)).toBeUndefined();
  });

  test("should protect the user from status moves", async () => {
    game.override.enemyMoveset([Moves.CHARM]);

    await game.classicMode.startBattle([Species.CHARIZARD]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.PROTECT);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  test("should stop subsequent hits of a multi-hit move", async () => {
    game.override.enemyMoveset([Moves.TACHYON_CUTTER]);

    await game.classicMode.startBattle([Species.CHARIZARD]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.PROTECT);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    expect(enemyPokemon.turnData.hitCount).toBe(1);
  });

  test("should fail if the user is the last to move in the turn", async () => {
    game.override.enemyMoveset([Moves.PROTECT]);

    await game.classicMode.startBattle([Species.CHARIZARD]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.PROTECT);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(leadPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
