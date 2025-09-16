import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Parting Shot", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(5)
      .enemyLevel(5);
  });

  it("should switch the user out and lower the target's ATK/SPATK by 1", async () => {
    await game.classicMode.startBattle([SpeciesId.MURKROW, SpeciesId.MEOWTH]);

    game.move.use(MoveId.PARTING_SHOT);
    game.doSelectPartyPokemon(1);
    await game.toEndOfTurn();

    const enemy = game.field.getEnemyPokemon();
    expect(enemy).toHaveStatStage(Stat.ATK, -1);
    expect(enemy).toHaveStatStage(Stat.SPATK, -1);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.MEOWTH);
  });

  // TODO: This is not currently implemented uh oh
  it.todo("should fail without switching if stat stages cannot be lowered", async () => {
    await game.classicMode.startBattle([SpeciesId.MURKROW, SpeciesId.ABRA]);

    const enemyPokemon = game.field.getEnemyPokemon();
    enemyPokemon.setStatStage(Stat.ATK, -6);
    enemyPokemon.setStatStage(Stat.SPATK, -6);

    game.move.use(MoveId.PARTING_SHOT);
    game.doSelectPartyPokemon(1);
    await game.toEndOfTurn();

    expect(enemyPokemon).toHaveStatStage(Stat.ATK, -6);
    expect(enemyPokemon).toHaveStatStage(Stat.SPATK, -6);

    const murkrow = game.field.getPlayerPokemon();
    expect(murkrow.species.speciesId).toBe(SpeciesId.MURKROW);
    expect(murkrow).toHaveUsedMove({ move: MoveId.PARTING_SHOT, result: MoveResult.FAIL });
  });

  it.todo(
    // TODO: fix this bug to pass the test!
    "should lower stats without failing if unable to switch",
    async () => {
      await game.classicMode.startBattle([SpeciesId.MURKROW]);

      game.move.use(MoveId.PARTING_SHOT);
      game.doSelectPartyPokemon(1);
      await game.toEndOfTurn();

      const enemy = game.field.getEnemyPokemon();
      expect(enemy).toHaveStatStage(Stat.ATK, 0);
      expect(enemy).toHaveStatStage(Stat.SPATK, 0);

      const murkrow = game.field.getPlayerPokemon();
      expect(murkrow.species.speciesId).toBe(SpeciesId.MURKROW);
      expect(murkrow).toHaveUsedMove({ move: MoveId.PARTING_SHOT, result: MoveResult.FAIL });
      expect(murkrow).toHaveUsedMove({ move: MoveId.PARTING_SHOT, result: MoveResult.FAIL });
    },
  );
});
