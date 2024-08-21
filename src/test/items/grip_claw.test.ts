import { BattlerIndex } from "#app/battle.js";
import { allMoves } from "#app/data/move.js";
import { Abilities } from "#app/enums/abilities.js";
import { BerryType } from "#app/enums/berry-type.js";
import { Moves } from "#app/enums/moves.js";
import { Species } from "#app/enums/species.js";
import { CommandPhase, MoveEndPhase, SelectTargetPhase } from "#app/phases.js";
import GameManager from "#test/utils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getMovePosition } from "#test/utils/gameManagerUtils";

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
        { name: "GRIP_CLAW", count: 5 },
        { name: "MULTI_LENS", count: 3 },
      ])
      .enemySpecies(Species.SNORLAX)
      .ability(Abilities.KLUTZ)
      .enemyMoveset([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH])
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
      await game.startBattle([Species.PANSEAR, Species.ROWLET, Species.PANPOUR, Species.PANSAGE, Species.CHARMANDER, Species.SQUIRTLE]);

      const enemyPokemon = game.scene.getEnemyField();

      const enemyHeldItemCt = enemyPokemon.map(p => p.getHeldItems.length);

      game.doAttack(getMovePosition(game.scene, 0, Moves.POPULATION_BOMB));

      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(BattlerIndex.ENEMY);

      await game.phaseInterceptor.to(CommandPhase, false);
      game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(enemyPokemon[1].getHeldItems.length).toBe(enemyHeldItemCt[1]);
    }, TIMEOUT
  );
});
