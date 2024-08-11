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
    game.override.startingLevel(70);
    game.override.disableCrits();
  });

  it("increases power if ally died previous turn", async () => {
    await game.startBattle([Species.ABRA, Species.COBALION]);
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    game.doSelectPartyPokemon(1);

    await game.toNextTurn();
    game.doAttack(getMovePosition(game.scene, 0, Moves.RETALIATE));
    //await game.phaseInterceptor.to(DamagePhase);
    console.log("ALLO1");
    let snorlax = game.scene.getEnemyPokemon()!;
    let cobalion = game.scene.getPlayerPokemon()!;
    expect(cobalion.name).equals("Cobalion");
    expect(retaliate.calculateBattlePower(cobalion, snorlax)).equals(140);
    expect(retaliate.calculateBattlePower(snorlax, cobalion)).equals(70);
    console.log(game.scene.getEnemyPokemon()!.hp);
    console.log(game.scene.getPlayerPokemon()!.hp);
    //await game.toNextTurn();
    console.log("ALLO2");
    game.doAttack(getMovePosition(game.scene, 0, Moves.RETALIATE));
    snorlax = game.scene.getEnemyPokemon()!;
    cobalion = game.scene.getPlayerPokemon()!;
    expect(retaliate.calculateBattlePower(cobalion, snorlax)).equals(70);
    expect(retaliate.calculateBattlePower(snorlax, cobalion)).equals(70);
  });
});
