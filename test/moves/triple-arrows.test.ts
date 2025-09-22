import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { FlinchAttr, Move, StatStageChangeAttr } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Triple Arrows", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let tripleArrows: Move;
  let flinchAttr: FlinchAttr;
  let defDropAttr: StatStageChangeAttr;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    tripleArrows = allMoves[MoveId.TRIPLE_ARROWS];
    flinchAttr = tripleArrows.getAttrs("FlinchAttr")[0];
    defDropAttr = tripleArrows.getAttrs("StatStageChangeAttr")[0];
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .moveset([MoveId.TRIPLE_ARROWS])
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH);

    vi.spyOn(flinchAttr, "getMoveChance");
    vi.spyOn(defDropAttr, "getMoveChance");
  });

  it("has a 30% flinch chance and 50% defense drop chance", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.TRIPLE_ARROWS);
    await game.phaseInterceptor.to("BerryPhase");

    expect(flinchAttr.getMoveChance).toHaveReturnedWith(30);
    expect(defDropAttr.getMoveChance).toHaveReturnedWith(50);
  });

  it("is affected normally by Serene Grace", async () => {
    game.override.ability(AbilityId.SERENE_GRACE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.TRIPLE_ARROWS);
    await game.phaseInterceptor.to("BerryPhase");

    expect(flinchAttr.getMoveChance).toHaveReturnedWith(60);
    expect(defDropAttr.getMoveChance).toHaveReturnedWith(100);
  });
});
