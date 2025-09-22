import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Tackle", () => {
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
    const moveToUse = MoveId.TACKLE;
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .startingLevel(1)
      .startingWave(97)
      .moveset([moveToUse])
      .enemyMoveset(MoveId.GROWTH)
      .criticalHits(false);
  });

  it("TACKLE against ghost", async () => {
    const moveToUse = MoveId.TACKLE;
    game.override.enemySpecies(SpeciesId.GENGAR);

    await game.classicMode.startBattle([SpeciesId.MIGHTYENA]);
    const hpOpponent = game.scene.currentBattle.enemyParty[0].hp;
    game.move.select(moveToUse);
    await game.toEndOfTurn();
    const hpLost = hpOpponent - game.scene.currentBattle.enemyParty[0].hp;
    expect(hpLost).toBe(0);
  });

  it("TACKLE against not resistant", async () => {
    const moveToUse = MoveId.TACKLE;
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA]);
    game.scene.currentBattle.enemyParty[0].stats[Stat.DEF] = 50;
    game.field.getPlayerPokemon().stats[Stat.ATK] = 50;

    const hpOpponent = game.scene.currentBattle.enemyParty[0].hp;

    game.move.select(moveToUse);
    await game.toEndOfTurn();
    const hpLost = hpOpponent - game.scene.currentBattle.enemyParty[0].hp;
    expect(hpLost).toBeGreaterThan(0);
    expect(hpLost).toBeLessThan(4);
  });
});
