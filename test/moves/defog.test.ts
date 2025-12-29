import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should not allow opponent Safeguard to be active", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    game.scene.arena.addTag(ArenaTagType.SAFEGUARD, 0, 0, game.field.getPlayerPokemon().id, ArenaTagSide.PLAYER);
    game.scene.arena.addTag(ArenaTagType.SAFEGUARD, 0, 0, game.field.getEnemyPokemon().id, ArenaTagSide.ENEMY);

    game.move.use(MoveId.DEFOG);
    await game.toEndOfTurn();

    expect(game).toHaveArenaTag({ tagType: ArenaTagType.SAFEGUARD, side: ArenaTagSide.PLAYER });
    expect(game).not.toHaveArenaTag({ tagType: ArenaTagType.SAFEGUARD, side: ArenaTagSide.ENEMY });
  });

  it("should not allow opponent Mist to be active", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    game.move.use(MoveId.MIST);
    await game.move.forceEnemyMove(MoveId.DEFOG);

    await game.toNextTurn();

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.GROWL);

    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon()).toHaveStatStage(Stat.ATK, -1);
  });
});
