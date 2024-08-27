import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { BerryType } from "#app/enums/berry-type";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import GameManager from "#test/utils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

const TIMEOUT = 20 * 1000; // 20 seconds

describe("Items - Grip Claw", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phase.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleType("double")
      .moveset([Moves.POPULATION_BOMB, Moves.SPLASH])
      .startingHeldItems([
        { name: "GRIP_CLAW", count: 5 }, // TODO: Find a way to mock the steal chance of grip claw
        { name: "MULTI_LENS", count: 3 },
      ])
      .enemySpecies(Species.SNORLAX)
      .ability(Abilities.KLUTZ)
      .enemyMoveset(SPLASH_ONLY)
      .enemyHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 2 },
        { name: "BERRY", type: BerryType.LUM, count: 2 },
      ])
      .startingLevel(100)
      .enemyLevel(100);

    vi.spyOn(allMoves[Moves.POPULATION_BOMB], "accuracy", "get").mockReturnValue(100);
  });

  it(
    "should only steal items from the attack target",
    async () => {
      await game.startBattle([Species.PANSEAR, Species.ROWLET]);

      const enemyPokemon = game.scene.getEnemyField();

      const enemyHeldItemCt = enemyPokemon.map(p => p.getHeldItems.length);

      game.move.select(Moves.POPULATION_BOMB, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(enemyPokemon[1].getHeldItems.length).toBe(enemyHeldItemCt[1]);
    }, TIMEOUT
  );
});
