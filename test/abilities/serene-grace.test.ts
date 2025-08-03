import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Serene Grace", () => {
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
      .criticalHits(false)
      .battleStyle("single")
      .ability(AbilityId.SERENE_GRACE)
      .moveset([MoveId.AIR_SLASH])
      .enemySpecies(SpeciesId.ALOLA_GEODUDE)
      .enemyLevel(10)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH]);
  });

  it("Serene Grace should double the secondary effect chance of a move", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const airSlashMove = allMoves[MoveId.AIR_SLASH];
    const airSlashFlinchAttr = airSlashMove.getAttrs("FlinchAttr")[0];
    vi.spyOn(airSlashFlinchAttr, "getMoveChance");

    game.move.select(MoveId.AIR_SLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.phaseInterceptor.to("BerryPhase");

    expect(airSlashFlinchAttr.getMoveChance).toHaveLastReturnedWith(60);
  });
});
