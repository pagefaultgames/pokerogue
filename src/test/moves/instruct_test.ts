import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { BattlerIndex } from "#app/battle";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Instruct", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    game.override.battleType("double");
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    const moveToUse = Moves.INSTRUCT;
    game = new GameManager(phaserGame);
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyLevel(1);
    game.override.starterSpecies(Species.AMOONGUSS);
    game.override.startingLevel(100);
    game.override.moveset([ moveToUse ]);
    game.override.enemyMoveset([ Moves.VINE_WHIP ]);
  });

  it("should repeat enemy's attack move when moving last", async () => {
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);
    const enemyPokemon = game.scene.getEnemyPokemon();

    game.move.select(Moves.INSTRUCT, 0, 2);
    await game.forceEnemyMove(Moves.VINE_WHIP);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    const moveUsed = enemyPokemon?.getMoveset().find(m => m?.moveId === Moves.VINE_WHIP);
    expect(moveUsed).toBeCalledTimes(2);
  });
});
