import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Lash Out", () => {
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
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.FUR_COAT)
      .enemyMoveset([MoveId.GROWL])
      .startingLevel(10)
      .enemyLevel(10)
      .starterSpecies(SpeciesId.FEEBAS)
      .ability(AbilityId.BALL_FETCH)
      .moveset([MoveId.LASH_OUT]);
  });

  it("should deal double damage if the user's stat stages were lowered this turn", async () => {
    vi.spyOn(allMoves[MoveId.LASH_OUT], "calculateBattlePower");
    await game.classicMode.startBattle();

    game.move.select(MoveId.LASH_OUT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(allMoves[MoveId.LASH_OUT].calculateBattlePower).toHaveReturnedWith(150);
  });
});
