import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { allMoves } from "#app/data/move.js";

describe("Moves - Retaliate", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const retaliate = allMoves[Moves.RETALIATE];

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
    game.override.battleType("single");
    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyMoveset([Moves.RETALIATE, Moves.RETALIATE, Moves.RETALIATE, Moves.RETALIATE]);
    game.override.enemyLevel(100);

    game.override.moveset([Moves.RETALIATE, Moves.SPLASH]);
    game.override.startingHeldItems([{name: "WIDE_LENS", count: 3}]);
    game.override.startingLevel(80);
    game.override.disableCrits();
  });

  it("increases power if ally died previous turn", async () => {
    await game.startBattle([Species.ABRA, Species.COBALION]);
    expect(retaliate.calculateBattlePower(game.scene.getPlayerPokemon()!, game.scene.getEnemyPokemon()!)).equals(70);
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    game.doSelectPartyPokemon(1);

    await game.toNextTurn();
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    console.log("ALLO1");
    const snorlax = game.scene.getEnemyPokemon()!;
    const cobalion = game.scene.getPlayerPokemon()!;
    expect(cobalion.name).equals("Cobalion");
    expect(retaliate.calculateBattlePower(cobalion, snorlax)).equals(140);
    expect(retaliate.calculateBattlePower(snorlax, cobalion)).equals(70);
  });
});
