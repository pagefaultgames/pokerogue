import { allMoves, FlinchAttr, StatStageChangeAttr } from "#app/data/move";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Triple Arrows", () => {
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
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.TRIPLE_ARROWS])
      .battleType("single")
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("has a 30% flinch chance and 50% defense drop chance", async () => {
    const tripleArrows = allMoves[Moves.TRIPLE_ARROWS];
    const flinchAttr = tripleArrows.getAttrs(FlinchAttr)[0];
    const defDropAttr = tripleArrows.getAttrs(StatStageChangeAttr)[0];
    vi.spyOn(flinchAttr, "getMoveChance");
    vi.spyOn(defDropAttr, "getMoveChance");
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.TRIPLE_ARROWS);
    await game.phaseInterceptor.to("BerryPhase");

    expect(flinchAttr.getMoveChance).toHaveReturnedWith(30);
    expect(defDropAttr.getMoveChance).toHaveReturnedWith(50);
  });
});
