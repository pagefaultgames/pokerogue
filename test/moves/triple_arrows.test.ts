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
  const tripleArrows = allMoves[Moves.TRIPLE_ARROWS];
  const flinchAttr = tripleArrows.getAttrs(FlinchAttr)[0];
  const defDropAttr = tripleArrows.getAttrs(StatStageChangeAttr)[0];

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
      .moveset([ Moves.TRIPLE_ARROWS ])
      .battleType("single")
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.STURDY)
      .enemyMoveset(Moves.SPLASH);

    vi.spyOn(flinchAttr, "getMoveChance");
    vi.spyOn(defDropAttr, "getMoveChance");
  });

  it("has a 30% flinch chance and 50% defense drop chance", async () => {
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    game.move.select(Moves.TRIPLE_ARROWS);
    await game.phaseInterceptor.to("BerryPhase");

    expect(flinchAttr.getMoveChance).toHaveReturnedWith(30);
    expect(defDropAttr.getMoveChance).toHaveReturnedWith(50);
  });

  it("is affected normally by Serene Grace", async () => {
    game.override.ability(Abilities.SERENE_GRACE);
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    game.move.select(Moves.TRIPLE_ARROWS);
    await game.phaseInterceptor.to("BerryPhase");

    expect(flinchAttr.getMoveChance).toHaveReturnedWith(60);
    expect(defDropAttr.getMoveChance).toHaveReturnedWith(100);
  });
});
