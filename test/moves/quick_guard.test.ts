import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import GameManager from "#test/testUtils/gameManager";
import { SpeciesId } from "#enums/species-id";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { Stat } from "#enums/stat";
import { BattlerIndex } from "#enums/battler-index";
import { MoveResult } from "#enums/move-result";

describe("Moves - Quick Guard", () => {
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
      .battleStyle("double")
      .moveset([MoveId.QUICK_GUARD, MoveId.SPLASH, MoveId.FOLLOW_ME])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyMoveset([MoveId.QUICK_ATTACK])
      .enemyAbility(AbilityId.INSOMNIA)
      .startingLevel(100)
      .enemyLevel(100);
  });

  test("should protect the user and allies from priority moves", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.QUICK_GUARD);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    playerPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
  });

  test("should protect the user and allies from Prankster-boosted moves", async () => {
    game.override.enemyAbility(AbilityId.PRANKSTER).enemyMoveset([MoveId.GROWL]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.QUICK_GUARD);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    playerPokemon.forEach(p => expect(p.getStatStage(Stat.ATK)).toBe(0));
  });

  test("should stop subsequent hits of a multi-hit priority move", async () => {
    game.override.enemyMoveset([MoveId.WATER_SHURIKEN]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.QUICK_GUARD);
    game.move.select(MoveId.FOLLOW_ME, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    playerPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
    enemyPokemon.forEach(p => expect(p.turnData.hitCount).toBe(1));
  });

  test("should fail if the user is the last to move in the turn", async () => {
    game.override.battleStyle("single").enemyMoveset([MoveId.QUICK_GUARD]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.QUICK_GUARD);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
