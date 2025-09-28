import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Defog", () => {
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
      .moveset([MoveId.MIST, MoveId.SAFEGUARD, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.DEFOG, MoveId.GROWL]);
  });

  // TODO: Refactor these tests they suck ass
  it("should not allow Safeguard to be active", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    game.scene.arena.addTag(ArenaTagType.SAFEGUARD, 0, 0, 0);

    game.move.use(MoveId.DEFOG);
    await game.toEndOfTurn();

    expect(game).not.toHaveArenaTag(ArenaTagType.SAFEGUARD);
  });

  it("should not allow Mist to be active", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    game.move.select(MoveId.MIST);
    await game.move.selectEnemyMove(MoveId.DEFOG);

    await game.toNextTurn();

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.GROWL);

    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon()).toHaveStatStage(Stat.ATK, -1);
  });
});
