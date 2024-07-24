import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phase from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import { Moves } from "#app/enums/moves.js";
import { Species } from "#app/enums/species.js";
import { BerryType } from "#app/enums/berry-type.js";
import { Abilities } from "#app/enums/abilities.js";
import { getMovePosition } from "../utils/gameManagerUtils";
import { CommandPhase, MoveEndPhase, SelectTargetPhase } from "#app/phases.js";
import { BattlerIndex } from "#app/battle.js";
import { allMoves } from "#app/data/move.js";

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

    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("double");
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.POPULATION_BOMB, Moves.SPLASH ]);
    vi.spyOn(Overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "GRIP_CLAW", count: 5}, {name: "MULTI_LENS", count: 3}]);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.KLUTZ);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);
    vi.spyOn(Overrides, "OPP_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([
      {name: "BERRY", type: BerryType.SITRUS, count: 2},
      {name: "BERRY", type: BerryType.LUM, count: 2}
    ]);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(Overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);

    vi.spyOn(allMoves[Moves.POPULATION_BOMB], "accuracy", "get").mockReturnValue(100);
  });

  it(
    "should only steal items from the attack target",
    async () => {
      await game.startBattle([Species.PANSEAR, Species.ROWLET, Species.PANPOUR, Species.PANSAGE, Species.CHARMANDER, Species.SQUIRTLE]);

      const playerPokemon = game.scene.getPlayerField();
      playerPokemon.forEach(p => expect(p).toBeDefined());

      const enemyPokemon = game.scene.getEnemyField();
      enemyPokemon.forEach(p => expect(p).toBeDefined());

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
